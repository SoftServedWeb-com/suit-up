import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import crypto from "crypto";
import { RedirectToSignIn } from "@clerk/nextjs";
import { fileToBase64, saveBase64ToS3, uploadToS3 } from "@/lib/aws-s3/utils";
import { genAI } from "@/lib/google";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return RedirectToSignIn;
    }

    const canCreate = await checkCanCreateTryOn(userId);
    if (!canCreate.canCreate) {
      return NextResponse.json(
        {
          error: canCreate.reason,
          type: "SUBSCRIPTION_LIMIT",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;
    const maskDataStr = formData.get("maskData") as string;

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    const imageUrl = await uploadToS3(imageFile, "canvas-input");
    const imageBase64 = await fileToBase64(imageFile);

    let enhancedPrompt = prompt;
    if (maskDataStr) {
      enhancedPrompt = `Edit the selected area of this image: ${prompt}. Only modify the masked region, keep everything else identical.`;
    }

    const promptArray = [
      { text: enhancedPrompt },
      { inlineData: { mimeType: imageFile.type, data: imageBase64 } },
    ];

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: promptArray,
      config: {
        safetySettings: [
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
        ],
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
      },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error(
        `Content blocked: ${response.promptFeedback.blockReason}`
      );
    }

    let resultUrl: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        resultUrl = await saveBase64ToS3(part.inlineData.data, "image/png");
        break;
      }
    }

    if (!resultUrl) {
      throw new Error("No image generated");
    }

    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error("Failed to consume credit");
    }

    const predictionId = `canvas-${crypto.randomUUID()}`;
    const record = await db.tryOnRequest.create({
      data: {
        predictionId,
        userId,
        modelImageUrl: imageUrl,
        garmentImageUrl: resultUrl,
        category: "canvas-edit",
        status: "COMPLETED",
        creditsUsed: 1,
        resultImageUrl: resultUrl,
      },
    });

    return NextResponse.json({
      success: true,
      requestId: record.id,
      resultImageUrl: resultUrl,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error("Canvas generate error:", error);
    return NextResponse.json(
      {
        error: error.message || "Generation failed",
      },
      { status: 500 }
    );
  }
}
