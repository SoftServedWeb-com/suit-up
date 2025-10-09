import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import { HarmCategory, HarmBlockThreshold } from "@google/genai";
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
    
    // Log parsed form data without re-reading the request body
    try {
      const logged = Array.from(formData.keys());
      console.log("[Canvas generate] Received form fields:", logged);
    } catch (e) {
      console.log("[Canvas generate] Could not log form data keys");
    }
    
    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }
    
    const imageBase64 = await fileToBase64(imageFile);
    
    let enhancedPrompt = prompt;
    if (maskDataStr) {
      enhancedPrompt = `You are to create a real outfit from the given image. ${prompt}`;
    }

    const promptArray = [
      { text: enhancedPrompt },
      { inlineData: { mimeType: imageFile.type, data: imageBase64 } },
    ];

    // For debugging: create a data URL to view the image in the browser console
    const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;
    console.log("[Canvas generate] Prompt array WITH IMAGE:", promptArray);
    console.log("[Canvas generate] To view the image being sent to Gemini, copy and paste this in your browser address bar or devtools:", imageDataUrl);

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

    console.log("Response from Gemini AI:", response);

    if (response.promptFeedback?.blockReason) {
      throw new Error(
        `Content blocked: ${response.promptFeedback.blockReason}`
      );
    }

    let resultDataBase64: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        resultDataBase64 = part.inlineData.data;
        break;
      }
    }

    if (!resultDataBase64) {
      throw new Error("No image generated");
    }

    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error("Failed to consume credit");
    }

    // Return base64 data URL for client-side preview; saving is a separate step
    const resultDataUrl = `data:image/png;base64,${resultDataBase64}`;
    return NextResponse.json({
      success: true,
      resultImageDataUrl: resultDataUrl,
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
