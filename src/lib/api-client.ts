// lib/api-client.ts
import type { GenerationRequest, GenerationResponse } from "@/components/canvas-studio/annotation-types";

export class CanvasAPIClient {
  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const formData = new FormData();
      
      // Convert base64 image data to blob
      const imageBlob = await this.base64ToBlob(request.imageData);
      formData.append("image", imageBlob, "canvas-image.png");
      formData.append("prompt", request.prompt || "");
      
      // If we have mask data, include it
      if (request.maskData && request.maskData.length > 0) {
        formData.append("maskData", JSON.stringify(request.maskData));
      }
      
      // Add generation parameters
      if (request.strength !== undefined) {
        formData.append("strength", request.strength.toString());
      }
      if (request.guidance !== undefined) {
        formData.append("guidance", request.guidance.toString());
      }
      if (request.steps !== undefined) {
        formData.append("steps", request.steps.toString());
      }
      if (request.seed !== undefined) {
        formData.append("seed", request.seed.toString());
      }

      const response = await fetch("/api/canvas/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      return {
        success: true,
        result: {
          output: data.resultImageUrl,
          requestId: data.requestId,
        },
      };
    } catch (error) {
      console.error("API Client error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      };
    }
  }

  private async base64ToBlob(base64: string): Promise<Blob> {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: "image/png" });
  }
}