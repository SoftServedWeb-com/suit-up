import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkCanCreateTryOn, consumeTryOnCredit } from "@/lib/subscription";
import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import { RedirectToSignIn } from "@clerk/nextjs";
import { fileToBase64 } from "@/lib/aws-s3/utils";
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
    const materialImage = formData.get("materialImage") as File | null;
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
    console.log("[Canvas generate] PROMPT before enhancment:", prompt);
    if (maskDataStr) {
      enhancedPrompt = `
      You are a fashion designer. You are task is to identify the masked layer, type of clothing, and make then do the following changes: ${prompt}`;
    }

    const promptArray: any[] = [
      { text: `These are the instructions you must follow: ${enhancedPrompt}` },
      { inlineData: { mimeType: imageFile.type, data: imageBase64 } },
    ];
    if (materialImage) {
      const materialBase64 = await fileToBase64(materialImage);
      // Add a clarifying text before material image, then the material image itself
      promptArray.push({
        text: "Use this additional image as the fabric/material reference for the outfit.",
      });
      promptArray.push({
        inlineData: { mimeType: materialImage.type, data: materialBase64 },
      });
      const materialDataUrl = `data:${materialImage.type};base64,${materialBase64}`;
      console.log(
        "[Canvas generate] Material image present. Base64 length:",
        materialBase64.length
      );
      console.log(
        "[Canvas generate] Material data URL (trimmed):",
        materialDataUrl.substring(0, 128) + "..."
      );
    } else {
      console.log("[Canvas generate] No material image provided");
    }

    // For debugging: log prompt composition and trimmed base image data URL
    // const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;
    console.log(
      "[Canvas generate] Prompt array parts count:",
      enhancedPrompt
    );
    // console.log(
    //   "[Canvas generate] Base canvas data URL (trimmed):",
    //   imageDataUrl.substring(0, 128) + "..."
    // );

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
        systemInstruction:`You are a fashion designer. You are to create a real mockup for the outfit from the given drawings. ADD THE CLOTHING TO A MANNEQUIN.${enhancedPrompt}`,
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

    // Consume credit for generation
    const creditResult = await consumeTryOnCredit(userId);
    if (!creditResult.success) {
      throw new Error("Failed to consume credit");
    }

    let creditsRemaining = creditResult.remaining;

    // If masking was used, consume additional credit for every 2 mask strokes
    if (maskDataStr) {
      try {
        const maskData = JSON.parse(maskDataStr);
        const maskStrokeCount = Array.isArray(maskData) ? maskData.length : 0;
        
        // Consume 1 credit for every 2 mask strokes
        const maskCreditsToConsume = Math.floor(maskStrokeCount / 2);
        
        if (maskCreditsToConsume > 0) {
          console.log(`[Canvas generate] Consuming ${maskCreditsToConsume} additional credit(s) for ${maskStrokeCount} mask strokes`);
          
          for (let i = 0; i < maskCreditsToConsume; i++) {
            const maskCreditResult = await consumeTryOnCredit(userId);
            if (!maskCreditResult.success) {
              console.error("Failed to consume masking credit:", maskCreditResult.error);
              // Don't fail the entire request if masking credit consumption fails
              // Just log and continue with whatever credits were consumed
              break;
            }
            creditsRemaining = maskCreditResult.remaining;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse maskData for credit calculation:", parseError);
        // Continue without consuming masking credits if parsing fails
      }
    }

    // Return base64 data URL for client-side preview; saving is a separate step
    const resultDataUrl = `data:image/png;base64,${resultDataBase64}`;
    return NextResponse.json({
      success: true,
      resultImageDataUrl: resultDataUrl,
      creditsRemaining: creditsRemaining,
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
