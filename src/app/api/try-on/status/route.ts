// Updated try-on/status/route.ts with S3 upload functionality

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { RequestStatus } from "@/generated/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

// Type for Fashn AI response
interface FashnAIResponse {
  id: string;
  status: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output?: string[];
  error?: string | null;
}

// Type for our database update
interface TryOnUpdateData {
  status?: RequestStatus;
  resultImageUrl?: string;
  errorMessage?: string;
  processingTime?: number;
  updatedAt: Date;
}

// Helper function to download image from URL and upload to S3
async function downloadAndUploadToS3(imageUrl: string, requestId: string): Promise<string> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    
    // Download the image from Fashn AI
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Generate a unique filename
    const fileExtension = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `results/tryon-result-${requestId}-${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    
    console.log(`Uploading to S3 as: ${fileName}`);
    
    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return the S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.TRIALROOM_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
    console.log(`Successfully uploaded to S3: ${s3Url}`);
    
    return s3Url;
  } catch (error) {
    console.error("Error downloading and uploading image:", error);
    throw new Error(`Failed to process result image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required" },
        { status: 400 }
      );
    }

    // Get try-on request - ensure it belongs to the current user
    const tryOnRequest = await db.tryOnRequest.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!tryOnRequest) {
      return NextResponse.json(
        { error: "Try-on request not found" },
        { status: 404 }
      );
    }

    // If already completed or failed, return current status
    if (
      tryOnRequest.status === "COMPLETED" ||
      tryOnRequest.status === "FAILED"
    ) {
      return NextResponse.json({
        requestId: tryOnRequest.id,
        status: tryOnRequest.status,
        resultImageUrl: tryOnRequest.resultImageUrl,
        errorMessage: tryOnRequest.errorMessage,
        processingTime: tryOnRequest.processingTime,
      });
    }

    // Check status with Fashn AI
    const statusResponse = await fetch(
      `https://api.fashn.ai/v1/status/${tryOnRequest.predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      console.error("Fashn AI status check failed:", statusResponse.status);
      return NextResponse.json(
        {
          error: "Failed to check processing status",
        },
        { status: 500 }
      );
    }

    const statusData: FashnAIResponse = await statusResponse.json();
    console.log("Fashn AI status:", statusData);

    // Prepare update data with proper typing
    const updateData: TryOnUpdateData = {
      updatedAt: new Date(),
    };

    // Map Fashn AI status to our database status
    switch (statusData.status) {
      case "starting":
      case "in_queue":
        updateData.status = "PENDING";
        break;

      case "processing":
        updateData.status = "PROCESSING";
        break;

      case "completed":
        // Extract image URL from output array
        if (
          statusData.output &&
          Array.isArray(statusData.output) &&
          statusData.output.length > 0
        ) {
          const fashnImageUrl = statusData.output[0];
          console.log("Fashn AI result URL:", fashnImageUrl);
          
          try {
            // Download from Fashn AI and upload to our S3
            const s3ImageUrl = await downloadAndUploadToS3(fashnImageUrl, requestId);
            
            updateData.status = "COMPLETED";
            updateData.resultImageUrl = s3ImageUrl;
            
            // Calculate processing time
            const processingTime = Math.floor(
              (new Date().getTime() - tryOnRequest.createdAt.getTime()) / 1000
            );
            updateData.processingTime = processingTime;
            console.log("Processing time calculated:", processingTime);
            
          } catch (uploadError) {
            console.error("Failed to upload result to S3:", uploadError);
            updateData.status = "FAILED";
            updateData.errorMessage = `Failed to save result: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`;
          }
        } else {
          console.error(
            "No output URL found in completed response:",
            statusData
          );
          updateData.status = "FAILED";
          updateData.errorMessage = "No result image URL returned from AI service";
        }
        break;

      case "failed":
        updateData.status = "FAILED";
        updateData.errorMessage = statusData.error || "AI processing failed";
        console.log("Processing failed:", statusData.error);
        break;

      default:
        console.warn("Unknown status from Fashn AI:", statusData.status);
        // Don't update status if we don't recognize it
        break;
    }

    console.log("Update data prepared:", updateData);

    // Update database only if we have status changes
    if (updateData.status) {
      const updatedRequest = await db.tryOnRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      console.log("Database updated successfully:", {
        id: updatedRequest.id,
        status: updatedRequest.status,
        resultImageUrl: updatedRequest.resultImageUrl,
      });

      return NextResponse.json({
        requestId: updatedRequest.id,
        status: updatedRequest.status,
        resultImageUrl: updatedRequest.resultImageUrl,
        errorMessage: updatedRequest.errorMessage,
        processingTime: updatedRequest.processingTime,
      });
    }

    // If no status update needed, return current status
    return NextResponse.json({
      requestId: tryOnRequest.id,
      status: tryOnRequest.status,
      resultImageUrl: tryOnRequest.resultImageUrl,
      errorMessage: tryOnRequest.errorMessage,
      processingTime: tryOnRequest.processingTime,
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}