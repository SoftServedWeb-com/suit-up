'use client'

import { AnnotationEditor } from "./annotation-editor";
import { CanvasAPIClient } from "@/lib/api-client";
import { useState } from "react";

export default function CanvasStudio() {
  const [apiClient] = useState(() => new CanvasAPIClient());

  const handleImageGenerated = (imageUrl: string) => {
    console.log("Generated image:", imageUrl);
  };

  const handleError = (error: string) => {
    console.error("Error:", error);
    alert(`Error: ${error}`);
  };

  return (
    <div className="h-screen">
      <AnnotationEditor
        apiClient={apiClient}
        onImageGenerated={handleImageGenerated}
        onError={handleError}
        config={{
          colors: {
            draw: "#000000",
            arrow: "#ef4444",
            text: "#1f2937",
            mask: "#3b82f6",
          },
          defaultSizes: {
            drawThickness: 3,
            arrowThickness: 3,
            fontSize: 16,
            brushSize: 30,
          },
          canvas: {
            maxWidth: 1200,
            maxHeight: 800,
            backgroundColor: "#ffffff",
          },
        }}
      />
    </div>
  );
}