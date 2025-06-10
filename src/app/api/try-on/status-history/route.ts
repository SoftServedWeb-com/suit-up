import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get all try-on requests for the current user
export async function GET(req:Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id:userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tryOnRequests = await db.tryOnRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to recent 50 requests
    });

    console.log("Get All requests success:", tryOnRequests);

    return NextResponse.json({ requests: tryOnRequests });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      {
        error: "Failed to get requests",
      },
      { status: 500 }
    );
  }
}
