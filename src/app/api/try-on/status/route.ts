// Fixed status update logic in try-on/status/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { RequestStatus } from "@/generated/prisma";

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
        updateData.status = "COMPLETED";

        // Extract image URL from output array
        if (
          statusData.output &&
          Array.isArray(statusData.output) &&
          statusData.output.length > 0
        ) {
          updateData.resultImageUrl = statusData.output[0];
          console.log("Setting result image URL:", statusData.output[0]);
        } else {
          console.error(
            "No output URL found in completed response:",
            statusData
          );
          updateData.status = "FAILED";
          updateData.errorMessage = "No result image URL returned";
        }

        // Calculate processing time
        const processingTime = Math.floor(
          (new Date().getTime() - tryOnRequest.createdAt.getTime()) / 1000
        );
        updateData.processingTime = processingTime;
        console.log("Processing time calculated:", processingTime);
        break;

      case "failed":
        updateData.status = "FAILED";
        updateData.errorMessage = statusData.error || "Processing failed";
        console.log("Processing failed:", statusData.error);
        break;

      default:
        console.warn("Unknown status from Fashn AI:", statusData.status);
        // Don't update status if we don't recognize it
        break;
    }

    console.log("Update data prepared:", updateData);

    // Update database
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
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check status",
      },
      { status: 500 }
    );
  }
}
