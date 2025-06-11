import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get all try-on requests for the current user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    console.log("Auth userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, try to find or create the user
    let user = await db.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist, create them (this might be needed if user creation happens elsewhere)
    if (!user) {
      console.log("User not found, creating new user");
      try {
        user = await db.user.create({
          data: {
            id: userId,
            // Add other required fields as needed
          },
        });
        console.log("Created new user:", user);
      } catch (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json({ error: "User setup failed" }, { status: 500 });
      }
    }

    console.log("Found user:", user);

    // Get try-on requests for this user
    const tryOnRequests = await db.tryOnRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50 requests
    });

    console.log(`Found ${tryOnRequests.length} try-on requests for user ${userId}`);
    
    // Log some sample data for debugging
    if (tryOnRequests.length > 0) {
      console.log("Sample request:", {
        id: tryOnRequests[0].id,
        modelImageUrl: tryOnRequests[0].modelImageUrl,
        garmentImageUrl: tryOnRequests[0].garmentImageUrl,
        category: tryOnRequests[0].category,
        status: tryOnRequests[0].status,
        createdAt: tryOnRequests[0].createdAt,
      });
    }

    // Ensure all required fields are present
    const sanitizedRequests = tryOnRequests.map(request => ({
      id: request.id,
      modelImageUrl: request.modelImageUrl,
      garmentImageUrl: request.garmentImageUrl,
      category: request.category,
      status: request.status,
      resultImageUrl: request.resultImageUrl,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }));

    return NextResponse.json({ 
      requests: sanitizedRequests,
      total: sanitizedRequests.length,
      userId: user.id
    });

  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      {
        error: "Failed to get requests",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}