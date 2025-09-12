import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import mime from "mime";
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

// Initialize Google GenAI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

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

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Helper function to save generated image to S3
async function saveGeneratedImageToS3(base64Data: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mime.getExtension(mimeType) || 'png';
  const fileName = `generated-tryon-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: mimeType,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.TRIALROOM_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 upload error for generated image:", error);
    throw new Error("Failed to save generated image. Please try again.");
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
          // Extract retry delay from error if available
          let retryDelay = baseDelay * Math.pow(2, attempt);
          
          // Check if Google provided a retry delay
          if (error.message?.includes('"retryDelay"')) {
            try {
              const match = error.message.match(/"retryDelay":\s*"(\d+)s"/);
              if (match) {
                retryDelay = parseInt(match[1]) * 1000; // Convert to milliseconds
              }
            } catch (parseError) {
              console.warn("Could not parse retry delay from error:", parseError);
            }
          }
          
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
    let modelImageBase64: string, garmentImageBase64: string;
    let modelImageMimeType: string, garmentImageMimeType: string;

    // Handle image sources (upload new ones or use previous ones)
    if(previousModelImage && previousGarmentImage){
      // Use previous images - need to fetch them and convert to base64
      modelImageUrl = previousModelImage;
      garmentImageUrl = previousGarmentImage;
      
      // Fetch images and convert to base64
      const [modelResponse, garmentResponse] = await Promise.all([
        fetch(previousModelImage),
        fetch(previousGarmentImage)
      ]);
      
      const [modelBuffer, garmentBuffer] = await Promise.all([
        modelResponse.arrayBuffer(),
        garmentResponse.arrayBuffer()
      ]);
      
      modelImageBase64 = Buffer.from(modelBuffer).toString('base64');
      garmentImageBase64 = Buffer.from(garmentBuffer).toString('base64');
      modelImageMimeType = modelResponse.headers.get('content-type') || 'image/jpeg';
      garmentImageMimeType = garmentResponse.headers.get('content-type') || 'image/jpeg';
    }
    else if(previousGarmentImage) {
      // Use previous garment image, upload new model image
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = previousGarmentImage;
      
      modelImageBase64 = await fileToBase64(modelImageFile);
      modelImageMimeType = modelImageFile.type;
      
      const garmentResponse = await fetch(previousGarmentImage);
      const garmentBuffer = await garmentResponse.arrayBuffer();
      garmentImageBase64 = Buffer.from(garmentBuffer).toString('base64');
      garmentImageMimeType = garmentResponse.headers.get('content-type') || 'image/jpeg';
    }
    else if(previousModelImage) {
      // Use previous model image, upload new garment image
      modelImageUrl = previousModelImage;
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
      
      garmentImageBase64 = await fileToBase64(garmentImageFile);
      garmentImageMimeType = garmentImageFile.type;
      
      const modelResponse = await fetch(previousModelImage);
      const modelBuffer = await modelResponse.arrayBuffer();
      modelImageBase64 = Buffer.from(modelBuffer).toString('base64');
      modelImageMimeType = modelResponse.headers.get('content-type') || 'image/jpeg';
    }
    else{
      // Upload both images to S3
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
      
      modelImageBase64 = await fileToBase64(modelImageFile);
      garmentImageBase64 = await fileToBase64(garmentImageFile);
      modelImageMimeType = modelImageFile.type;
      garmentImageMimeType = garmentImageFile.type;
    }

    console.log("Images prepared for Gemini AI:", { 
      modelImage: modelImageUrl, 
      garmentImage: garmentImageUrl 
    });

    // Use Google Gemini 2.5 Flash Image Preview for virtual try-on
    const model = 'gemini-2.5-flash-image-preview';
    
    // Try different approaches based on category for better results
    let detailedPrompt: string;
    let prompt: any[];

    // Approach 1: Image editing style (better for clothing replacement)
    if (category.toLowerCase().includes('top') || category.toLowerCase().includes('shirt') || category.toLowerCase().includes('dress')) {
      detailedPrompt = `Using the person in the first image, replace their current ${category} with the exact ${category} shown in the second image. 
      Keep everything else identical: same person, same pose, same facial expression, same background, same lighting. Only change the clothing item.
      Make the new ${category} fit naturally on their body with proper draping and shadows. Ensure the fabric texture, color, and style match the reference garment exactly.
      Generate a photorealistic result where the clothing swap looks completely natural and seamless.`;
    } else {
      // Approach 2: Composition style for other items
      detailedPrompt = `Create a realistic virtual try-on showing the person from the first image wearing the ${category} from the second image.
        PRESERVE EXACTLY:
        - Person's pose, facial features, skin tone, hair
        - Background and lighting conditions  
        - Body proportions and positioning

        CHANGE ONLY:
        - Replace their current ${category} with the one from the second image
        - Ensure proper fit, draping, and realistic shadows
        - Match the exact fabric, color, and style from the reference

        Result should be photorealistic with seamless clothing integration.`;
    }

    prompt = [
      { text: detailedPrompt },
      {
        inlineData: {
          mimeType: modelImageMimeType,
          data: modelImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: garmentImageMimeType,
          data: garmentImageBase64,
        },
      },
    ];

    console.log("Sending request to Gemini AI for virtual try-on...");

    // Safety mode configuration - can be adjusted based on needs
    const SAFETY_MODE = process.env.GEMINI_SAFETY_MODE || 'BALANCED'; // OPTIONS: 'STRICT', 'BALANCED', 'RELAXED'
    
    let safetyThreshold;
    switch (SAFETY_MODE) {
      case 'STRICT':
        safetyThreshold = HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
        break;
      case 'RELAXED':
        safetyThreshold = HarmBlockThreshold.OFF;
        break;
      case 'BALANCED':
      default:
        safetyThreshold = HarmBlockThreshold.BLOCK_ONLY_HIGH;
        break;
    }

    // Configure safety settings optimized for clothing try-on
    console.log(`Using safety mode: ${SAFETY_MODE} with threshold: ${safetyThreshold}`);
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: safetyThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
        threshold: safetyThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: safetyThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: safetyThreshold,
      },
      // Add image-specific categories for better clothing try-on
      {
        category: HarmCategory.HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT,
        threshold: safetyThreshold,
      },
    ];

    // Generation configuration for better image quality
    const generationConfig = {
      temperature: 0.4, // Lower temperature for more consistent results
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
    };

    // Use retry mechanism for the API call
    const response = await retryWithBackoff(async () => {
      return await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          safetySettings: safetySettings,
          ...generationConfig,
        },
      });
    }, 3, 2000); // 3 retries, starting with 2 second delay

    console.log("Response from Gemini AI:", response);

    let generatedImageUrl: string | null = null;
    let textResponse = "";

    // Check for safety filter blocks
    if (response.promptFeedback?.blockReason) {
      console.log("Request blocked by safety filters:", response.promptFeedback.blockReason);
      throw new Error(`Content blocked by safety filters: ${response.promptFeedback.blockReason}. Try with different images or adjust the prompt.`);
    }

    // Process the response (following the example pattern)
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const candidate = response.candidates[0];
      
      // Check if the candidate was blocked
      if (candidate.finishReason === 'SAFETY') {
        console.log("Response blocked by safety filters");
        throw new Error("Generated content was blocked by safety filters. Please try with different images or ensure appropriate content.");
      }

      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          textResponse += part.text;
          console.log("Received text response from Gemini:", part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          if (imageData) {
            console.log("Received generated image from Gemini - data length:", imageData.length);
            generatedImageUrl = await saveGeneratedImageToS3(imageData, 'image/png');
          }
        }
      }
    } else {
      console.log("No candidates found in response. Full response:", JSON.stringify(response, null, 2));
    }

    if (!generatedImageUrl) {
      throw new Error("No image was generated by Gemini AI");
    }

    // Consume try-on credit (only after successful generation)
    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error(creditResult.error || "Failed to consume credit");
    }

    console.log("Gemini AI virtual try-on completed:", generatedImageUrl);

    // Save to database with a unique prediction ID for consistency
    const predictionId = `gemini-${crypto.randomUUID()}`;
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
      message: "Virtual try-on completed successfully using Google Gemini AI.",
      creditsRemaining: creditResult.remaining,
      provider: "gemini",
      textResponse: textResponse || "Virtual try-on generated successfully"
    });

  } catch (error: any) {
    console.error("Try-on Beta API error:", error);
    
    // Handle specific error types
    if (error instanceof Error && error.message.includes("credit")) {
      return NextResponse.json({ 
        error: error.message,
        type: "SUBSCRIPTION_LIMIT"
      }, { status: 403 });
    }
    
    // Handle Gemini API rate limiting
    if (error.status === 429 || error.code === 429) {
      return NextResponse.json({ 
        error: "Google Gemini API rate limit exceeded. Please try again in a few minutes.",
        type: "RATE_LIMIT",
        provider: "gemini",
        details: "You've reached the free tier quota limits. Consider upgrading your Google AI Studio plan or try again later."
      }, { status: 429 });
    }
    
    // Handle quota exceeded errors
    if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ 
        error: "Google Gemini API quota exceeded. Please check your billing plan.",
        type: "QUOTA_EXCEEDED",
        provider: "gemini",
        details: "Free tier limits reached. Visit https://ai.google.dev/pricing for upgrade options."
      }, { status: 429 });
    }
    
    // Handle authentication errors
    if (error.status === 401 || error.code === 401) {
      return NextResponse.json({ 
        error: "Invalid Google Gemini API key.",
        type: "AUTH_ERROR",
        provider: "gemini"
      }, { status: 401 });
    }

    // Handle safety filter blocks
    if (error.message?.includes("safety filters") || error.message?.includes("blocked")) {
      return NextResponse.json({ 
        error: "Content was blocked by safety filters. Please try with different images or ensure appropriate content for virtual try-on.",
        type: "SAFETY_FILTER",
        provider: "gemini",
        details: "The AI model's safety systems prevented generation. Try with clearer, appropriate clothing images."
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to process try-on request",
      provider: "gemini"
    }, { status: 500 });
  }
}
