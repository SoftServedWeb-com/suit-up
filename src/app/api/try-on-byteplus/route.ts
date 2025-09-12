import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import crypto from "crypto";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.TRIALROOM_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.TRIALROOM_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TRIALROOM_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.TRIALROOM_AWS_S3_BUCKET_NAME!;

// Helper function to upload file to S3
async function uploadToS3(file: File, prefix: string): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: file.type,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.TRIALROOM_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("File upload Failed. Please try again.");
  }
}

// Helper function for exponential backoff retry
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.status === 429 || error.code === 429) {
        if (attempt < maxRetries) {
          const retryDelay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limited. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(retryDelay);
          continue;
        }
      }
      
      // If it's not a rate limit error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError!;
}

// Helper function to download image from URL and convert to base64
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error("Failed to download image for processing");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription limits before processing
    const canCreate = await checkCanCreateTryOn(userId);
    if (!canCreate.canCreate) {
      return NextResponse.json({ 
        error: canCreate.reason,
        type: "SUBSCRIPTION_LIMIT",
        remaining: canCreate.remaining || 0
      }, { status: 403 });
    }

    const formData = await request.formData();
    const modelImageFile = formData.get("modelImage") as File;
    const garmentImageFile = formData.get("garmentImage") as File;
    const previousModelImage = formData.get("previousModelImage") as string;
    const previousGarmentImage = formData.get("previousGarmentImage") as string;
    const category = formData.get("category") as string;

    if (!modelImageFile && !previousModelImage || !garmentImageFile && !previousGarmentImage || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let modelImageUrl: string, garmentImageUrl: string;
    
    // Handle image sources (upload new ones or use previous ones)
    if(previousModelImage && previousGarmentImage){
      modelImageUrl = previousModelImage;
      garmentImageUrl = previousGarmentImage;
    }
    else if(previousGarmentImage) {
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = previousGarmentImage;
    }
    else if(previousModelImage) {
      modelImageUrl = previousModelImage;
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
    }
    else{
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
    }

    console.log("Images prepared for BytePlus ModelArk:", { 
      modelImage: modelImageUrl, 
      garmentImage: garmentImageUrl 
    });

    // Use BytePlus ModelArk Seedream for virtual try-on
    const prompt = `Create a realistic virtual try-on showing the person wearing the garment. Apply the clothing item onto the person while maintaining their pose, body proportions, facial features, and background. Ensure the garment fits naturally and realistically. The clothing category is: ${category}. Keep the background and lighting consistent.`;

    const requestBody = {
      model: "seedream-4-0-250828", // Seedream 4.0 model
      prompt: prompt,
      image: modelImageUrl, // Base image (person)
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: false // Disable watermark for cleaner results
    };

    console.log("Sending request to BytePlus ModelArk...");

    // Use retry mechanism for the API call
    const response = await retryWithBackoff(async () => {
      return await fetch("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ARK_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
    }, 3, 2000); // 3 retries, starting with 2 second delay

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BytePlus ModelArk API error:", response.status, errorText);
      
      // Handle specific error types
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status === 401) {
        throw new Error("Invalid API key configuration.");
      } else {
        throw new Error(`BytePlus ModelArk API error: ${response.status} - ${errorText}`);
      }
    }

    const byteplusData = await response.json();
    console.log("BytePlus response:", byteplusData);

    // Extract generated image URL from response
    let generatedImageUrl: string | null = null;
    
    if (byteplusData.data && byteplusData.data.length > 0) {
      const imageData = byteplusData.data[0];
      if (imageData.url) {
        generatedImageUrl = imageData.url;
        console.log("Received generated image URL from BytePlus:", generatedImageUrl);
      }
    }

    if (!generatedImageUrl) {
      throw new Error("No image was generated by BytePlus ModelArk");
    }

    // Consume try-on credit (only after successful generation)
    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error(creditResult.error || "Failed to consume credit");
    }

    console.log("BytePlus ModelArk virtual try-on completed:", generatedImageUrl);

    // Save to database with a unique prediction ID for consistency
    const predictionId = `byteplus-${crypto.randomUUID()}`;
    const tryOnRequest = await db.tryOnRequest.create({
      data: {
        predictionId,
        userId,
        modelImageUrl,
        garmentImageUrl,
        category,
        status: "COMPLETED",
        creditsUsed: 1,
        resultImageUrl: generatedImageUrl
      }
    });

    return NextResponse.json({
      success: true,
      requestId: tryOnRequest.id,
      predictionId,
      status: "completed",
      resultImageUrl: generatedImageUrl,
      message: "Virtual try-on completed successfully using BytePlus ModelArk Seedream.",
      creditsRemaining: creditResult.remaining,
      provider: "byteplus",
      model: "seedream-4-0-250828"
    });

  } catch (error: any) {
    console.error("BytePlus Try-on API error:", error);
    
    // Handle specific error types
    if (error instanceof Error && error.message.includes("credit")) {
      return NextResponse.json({ 
        error: error.message,
        type: "SUBSCRIPTION_LIMIT"
      }, { status: 403 });
    }
    
    // Handle BytePlus API rate limiting
    if (error.message?.includes("Rate limit") || error.status === 429) {
      return NextResponse.json({ 
        error: "BytePlus ModelArk API rate limit exceeded. Please try again in a few minutes.",
        type: "RATE_LIMIT",
        provider: "byteplus",
        details: "You've reached the API rate limits. Please wait before making another request."
      }, { status: 429 });
    }
    
    // Handle authentication errors
    if (error.message?.includes("Invalid API key") || error.status === 401) {
      return NextResponse.json({ 
        error: "Invalid BytePlus ModelArk API key.",
        type: "AUTH_ERROR",
        provider: "byteplus"
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to process try-on request",
      provider: "byteplus"
    }, { status: 500 });
  }
}
