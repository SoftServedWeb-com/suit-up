// api/try-on/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
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

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get try-on request
    const tryOnRequest = await db.tryOnRequest.findFirst({
      where: {
        id: requestId,
        userId: user.id,
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

    const statusData = await statusResponse.json();
    console.log("Fashn AI status:", statusData);

    let updateData: any = {
      updatedAt: new Date(),
    };

    // Map Fashn AI status to our database status
    if (statusData.status === "starting" || statusData.status === "in_queue") {
      updateData.status = "PENDING";
    } else if (statusData.status === "processing") {
      updateData.status = "PROCESSING";
    } else if (statusData.status === "completed") {
      updateData.status = "COMPLETED";
      // Extract image URL from output array
      if (statusData.output && statusData.output.length > 0) {
        updateData.resultImageUrl = statusData.output[0];
      }
      // Calculate processing time
      const processingTime = Math.floor(
        (new Date().getTime() - tryOnRequest.createdAt.getTime()) / 1000
      );
      updateData.processingTime = processingTime;
    } else if (statusData.status === "failed") {
      updateData.status = "FAILED";
      updateData.errorMessage = statusData.error || "Processing failed";
    }

    // Update database
    const updatedRequest = await db.tryOnRequest.update({
      where: { id: requestId },
      data: updateData,
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
