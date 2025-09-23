import { NextResponse } from "next/server";
import { vertex } from "@ai-sdk/google-vertex";
import { FilePart, generateObject, ModelMessage } from "ai";
import { z } from "zod";

// POST /api/garment/analyze
// Accepts multipart/form-data with either a File `garmentImage` or a string `imageUrl`.
// Returns a structured object: { description: string; haveFace: boolean }
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const garmentImage = form.get("garmentImage");
    const imageUrl = form.get("imageUrl") as string | null;

    if (!garmentImage && !imageUrl) {
      return NextResponse.json(
        { error: "Provide garmentImage file or imageUrl" },
        { status: 400 }
      );
    }

    // Build message with file or URL
    let filePart: FilePart;
    if (garmentImage) {
      const blob = garmentImage as unknown as Blob;
      const arrayBuffer = await blob.arrayBuffer();
      const mediaType = (garmentImage as any).type || "application/octet-stream";
      filePart = {
        type: "file",
        data: arrayBuffer,
        mediaType,
      };
    } else {
      filePart = {
        type: "file",
        data: new URL(imageUrl as string),
        mediaType: "image/jpeg",
      };
    }

    console.log("FilePart:", filePart);
    
    // Structured output schema via Zod
    const schema = z.object({
      description: z.string().describe("A concise product-style description of the garment (color, type, notable details, Give detailed explanation of the patterns if present) only. NO need the description of the background and the model."),
      haveFace: z.boolean().describe("true only if a human face is visible in the image"),
    });

    const { object , response} = await generateObject({
      model: vertex('gemini-2.5-pro'),
      schema: schema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this garment product image. Return: a concise product-style description (color, type, notable details) and a boolean haveFace that is true only if a human face is visible in the image.",
            },
            filePart as FilePart,
          ],
        },
      ] as ModelMessage[], 
    });

    console.log("Object:", object, response);

    return NextResponse.json({ success: true, description: object.description, haveFace: object.haveFace });
  } catch (error: any) {
    console.error("Garment analyze error:", error);
    const message = error?.message || "Failed to analyze garment image";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


