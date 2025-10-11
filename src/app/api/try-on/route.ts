import { NextResponse } from "next/server"; 
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import { uploadToS3 } from "@/lib/aws-s3/utils";


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
    if(previousModelImage && previousGarmentImage){
      // Use previous images
      modelImageUrl = previousModelImage;
      garmentImageUrl = previousGarmentImage;
    }
    else if(previousGarmentImage) {
      // Use previous garment image
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = previousGarmentImage;
    }
    else if(previousModelImage) {
      // Use previous model image
      modelImageUrl = previousModelImage;
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
    }
    else{
      // Upload images to S3
      modelImageUrl = await uploadToS3(modelImageFile, "model");
      garmentImageUrl = await uploadToS3(garmentImageFile, "garment");
    }

    console.log("Images uploaded to S3:", { 
      modelImage: modelImageUrl, 
      garmentImage: garmentImageUrl 
    });

    // Submit to Fashn AI
    const fashnResponse = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      body: JSON.stringify({
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category: category ? category : "auto",
        mode: "quality",
        garment_photo_type: "auto",
        // num_samples: 3
      }),
      headers: {
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!fashnResponse.ok) {
      const errorText = await fashnResponse.text();
      console.error("Fashn.ai API error:", fashnResponse.status, errorText);
      throw new Error(`Fashn.ai API error: ${fashnResponse.status}`);
    }

    const fashnData = await fashnResponse.json();
    const predictionId = fashnData.id;

    if (!predictionId) {
      throw new Error("No prediction ID returned from Fashn.ai API");
    }

       // Consume try-on credit (only after successful submission to Fashn AI)
       const creditResult = await consumeTryOnCredit(userId);
       if (!creditResult.success) {
         throw new Error(creditResult.error || "Failed to consume credit");
       }
   

    console.log("Fashn AI prediction started:", predictionId);

    // Save to database
    const tryOnRequest = await db.tryOnRequest.create({
      data: {
        predictionId,
        userId, // Using Clerk user ID directly
        modelImageUrl,
        garmentImageUrl,
        category,
        status: "PENDING",
        creditsUsed: 1
      }
    });

    return NextResponse.json({
      success: true,
      requestId: tryOnRequest.id,
      predictionId,
      status: "submitted",
      message: "Try-on request submitted successfully. Processing will take up to 40 seconds.",
      creditsRemaining: creditResult.remaining
    });

  } catch (error) {
    console.error("Try-on API error:", error);
    
    // Return specific error types for better frontend handling
    if (error instanceof Error && error.message.includes("credit")) {
      return NextResponse.json({ 
        error: error.message,
        type: "SUBSCRIPTION_LIMIT"
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to process try-on request" 
    }, { status: 500 });
  }
}