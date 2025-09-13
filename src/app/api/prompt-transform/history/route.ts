import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch transformation history for the user
    // We filter by category starting with "prompt:" to get only prompt transformations
    const transformations = await db.tryOnRequest.findMany({
      where: {
        userId,
        category: {
          startsWith: "prompt:",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        predictionId: true,
        modelImageUrl: true, // This contains the original image
        resultImageUrl: true,
        category: true, // This contains "prompt:{promptId}"
        status: true,
        processingTime: true,
        creditsUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform the data to match the expected format
    const formattedTransformations = transformations.map((t) => {
      // Extract prompt ID from category
      const promptId = t.category.replace("prompt:", "");
      
      // Map prompt IDs to display names
      const promptNames: Record<string, string> = {
        "vintage-style": "Vintage Style",
        "artistic-portrait": "Artistic Portrait",
        "professional-headshot": "Professional Headshot",
        "fashion-editorial": "Fashion Editorial",
        "cinematic-look": "Cinematic Look",
        "black-white-classic": "Classic B&W",
        "soft-glow": "Soft Glow",
        "urban-street": "Urban Street",
      };

      return {
        id: t.id,
        originalImageUrl: t.modelImageUrl,
        resultImageUrl: t.resultImageUrl,
        promptId,
        promptName: promptNames[promptId] || promptId,
        status: t.status,
        processingTime: t.processingTime,
        creditsUsed: t.creditsUsed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      transformations: formattedTransformations,
      total: formattedTransformations.length,
    });

  } catch (error) {
    console.error("Prompt Transform History API error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch transformation history",
        success: false 
      },
      { status: 500 }
    );
  }
}
