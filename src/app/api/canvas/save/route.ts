import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { saveBase64ToS3 } from "@/lib/aws-s3/utils";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dataUrl } = await request.json();
    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
    }

    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
    }
    const mimeType = match[1] || "image/png";
    const base64 = match[2];

    const url = await saveBase64ToS3(base64, mimeType);

    // Persist a lightweight record (saving is free, no credits used)
    await db.tryOnRequest.create({
      data: {
        predictionId:`canvas-save-${Date.now()}`,
        userId,
        modelImageUrl: url,
        garmentImageUrl: url,
        category: "canvas-edit",
        status: "COMPLETED",
        creditsUsed: 0,
        resultImageUrl: url,
      },
    });

    return NextResponse.json({ 
      success: true, 
      url
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save" }, { status: 500 });
  }
}


