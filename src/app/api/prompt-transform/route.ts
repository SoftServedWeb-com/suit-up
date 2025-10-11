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
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}-${
    file.name
  }`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: file.type,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${
      process.env.TRIALROOM_AWS_REGION || "us-east-1"
    }.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("File upload Failed. Please try again.");
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

// Helper function to save generated image to S3
async function saveGeneratedImageToS3(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64");
  const extension = mime.getExtension(mimeType) || "png";
  const fileName = `prompt-transform-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: mimeType,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${
      process.env.TRIALROOM_AWS_REGION || "us-east-1"
    }.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 upload error for generated image:", error);
    throw new Error("Failed to save generated image. Please try again.");
  }
}

// Helper function for exponential backoff retry
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
              console.warn(
                "Could not parse retry delay from error:",
                parseError
              );
            }
          }

          console.log(
            `Rate limited. Retrying in ${retryDelay}ms (attempt ${
              attempt + 1
            }/${maxRetries + 1})`
          );
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
      return NextResponse.json(
        {
          error: canCreate.reason,
          type: "SUBSCRIPTION_LIMIT",
          remaining: canCreate.remaining || 0,
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;
    const promptName = formData.get("promptName") as string;
    const promptId = formData.get("promptId") as string;

    if (!imageFile || !prompt || !promptName || !promptId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload original image to S3
    const originalImageUrl = await uploadToS3(imageFile, "prompt-original");

    // Convert image to base64 for Gemini
    const imageBase64 = await fileToBase64(imageFile);
    const imageMimeType = imageFile.type;

    console.log("Image prepared for Gemini AI transformation:", {
      originalImage: originalImageUrl,
      promptName,
      promptId,
    });

    // Use Google Gemini 2.5 Flash Image Preview for image transformation
    const model = "gemini-2.5-flash-image-preview";

    // Enhanced prompt for better image transformation results
    const enhancedPrompt = `${prompt}

IMPORTANT INSTRUCTIONS:
- Maintain the original composition and subject positioning
- Preserve facial features, expressions, and identity if person is present
- Keep the same image dimensions and aspect ratio
- Apply the transformation style while maintaining image quality
- Ensure the result looks natural and professionally edited
- Do not add watermarks, text, or signatures
- Generate a high-quality, photorealistic result`;

    const promptArray = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      },
    ];

    console.log("Sending request for image transformation...");

    // Configure safety settings to be appropriate for image editing
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];

    // Generation configuration for better image quality
    const generationConfig = {
      temperature: 0.3, // Lower temperature for more consistent results
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
    };

    // Use retry mechanism for the API call
    const response = await retryWithBackoff(
      async () => {
        return await genAI.models.generateContent({
          model,
          contents: promptArray,
          config: {
            safetySettings: safetySettings,
            ...generationConfig,
          },
        });
      },
      3,
      2000
    ); // 3 retries, starting with 2 second delay

    console.log("Response from AI:", response);

    let generatedImageUrl: string | null = null;
    let textResponse = "";

    // Check for safety filter blocks
    if (response.promptFeedback?.blockReason) {
      console.log(
        "Request blocked by safety filters:",
        response.promptFeedback.blockReason
      );
      throw new Error(
        `Content blocked by safety filters: ${response.promptFeedback.blockReason}. Try with different images or adjust the prompt.`
      );
    }

    // Process the response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const candidate = response.candidates[0];

      // Check if the candidate was blocked
      if (candidate.finishReason === "SAFETY") {
        console.log("Response blocked by safety filters");
        throw new Error(
          "Generated content was blocked by safety filters. Please try with different images or ensure appropriate content."
        );
      }

      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          textResponse += part.text;
          console.log("Received text response from AI:", part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          if (imageData) {
            console.log(
              "Received generated image from AI - data length:",
              imageData.length
            );
            generatedImageUrl = await saveGeneratedImageToS3(
              imageData,
              "image/png"
            );
          }
        }
      }
    } else {
      console.log(
        "No candidates found in response. Full response:",
        JSON.stringify(response, null, 2)
      );
    }

    if (!generatedImageUrl) {
      throw new Error("No image was visualized");
    }

    // Consume try-on credit (only after successful generation)
    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error(creditResult.error || "Failed to consume credit");
    }

    console.log("image transformation completed:", generatedImageUrl);

    // Save to database with a unique prediction ID for consistency
    const predictionId = `prompt-${crypto.randomUUID()}`;

    // Create a transformation request record (we'll need to add this table to the schema)
    // For now, we'll use the existing TryOnRequest table with modified fields
    const transformRequest = await db.tryOnRequest.create({
      data: {
        predictionId,
        userId,
        modelImageUrl: originalImageUrl, // Store original image here
        garmentImageUrl: generatedImageUrl, // Store result here temporarily
        category: `prompt:${promptId}`, // Store prompt ID in category
        status: "COMPLETED",
        creditsUsed: 1,
        resultImageUrl: generatedImageUrl,
        // We could add a custom field for prompt name if needed
      },
    });

    return NextResponse.json({
      success: true,
      requestId: transformRequest.id,
      predictionId,
      status: "completed",
      resultImageUrl: generatedImageUrl,
      originalImageUrl: originalImageUrl,
      message: "image transformation completed successfully",
      creditsRemaining: creditResult.remaining,
      provider: "gemini-prompt",
      promptName: promptName,
      promptId: promptId,
      textResponse:
        textResponse || "Image transformation generated successfully",
    });
  } catch (error: any) {
    console.error("Prompt Transform API error:", error);

    // Handle specific error types
    if (error instanceof Error && error.message.includes("credit")) {
      return NextResponse.json(
        {
          error: error.message,
          type: "SUBSCRIPTION_LIMIT",
        },
        { status: 403 }
      );
    }

    // Handle Gemini API rate limiting
    if (error.status === 429 || error.code === 429) {
      return NextResponse.json(
        {
          error:
            "API rate limit exceeded. Please try again in a few minutes.",
          type: "RATE_LIMIT",
          provider: "gemini", 
          details:
            "You've reached the free tier quota limits. Consider upgrading your Google AI Studio plan or try again later.",
        },
        { status: 429 }
      );
    }

    // Handle quota exceeded errors
    if (
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          error:
            "AI API quota exceeded. Please check your billing plan.",
          type: "QUOTA_EXCEEDED",
          provider: "gemini",
          details:
            "Free tier limits reached. Visit https://ai.google.dev/pricing for upgrade options.",
        },
        { status: 429 }
      );
    }

    // Handle authentication errors
    if (error.status === 401 || error.code === 401) {
      return NextResponse.json(
        {
          error: "Invalid AI API key.",
          type: "AUTH_ERROR",
          provider: "gemini",
        },
        { status: 401 }
      );
    }

    // Handle safety filter blocks
    if (
      error.message?.includes("safety filters") ||
      error.message?.includes("blocked")
    ) {
      return NextResponse.json(
        {
          error:
            "Content was blocked by safety filters. Please try with different images or ensure appropriate content.",
          type: "SAFETY_FILTER",
          provider: "gemini",
          details:
            "The AI model's safety systems prevented generation. Try with different images.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process image transformation request",
        provider: "gemini-prompt",
      },
      { status: 500 }
    );
  }
}
