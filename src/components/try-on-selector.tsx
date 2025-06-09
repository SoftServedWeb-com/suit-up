"use client";

import { useState } from "react";
import { Download, Share, Sparkles, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TryOnResultProps {
  resultImage: string;
  modelImage?: string;
  garmentImage?: string;
}

export default function TryOnResult({ resultImage, modelImage, garmentImage }: TryOnResultProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `try-on-result-${Date.now()}.jpg`;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Virtual Try-On Result",
          text: "Check out how this outfit looks on me!",
          url: resultImage,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(resultImage);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(resultImage);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Try-On Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Result Image */}
          <div className="relative group">
            <div 
              className={`relative overflow-hidden rounded-lg border-2 border-border cursor-pointer transition-all duration-300 ${
                isZoomed ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur-sm' : 'hover:border-primary/50'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={resultImage}
                alt="Try-on result"
                className={`w-full object-cover transition-all duration-300 ${
                  isZoomed ? 'h-full object-contain' : 'max-h-96 group-hover:scale-105'
                }`}
              />
              {!isZoomed && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 rounded-full p-2">
                    <ZoomIn className="h-5 w-5 text-gray-800" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Images Preview */}
          {(modelImage || garmentImage) && (
            <div className="flex gap-4 justify-center">
              {modelImage && (
                <div className="text-center">
                  <img
                    src={modelImage}
                    alt="Original model"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Original</p>
                </div>
              )}
              {garmentImage && (
                <div className="text-center">
                  <img
                    src={garmentImage}
                    alt="Garment"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Garment</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="hover:border-primary/50 hover:text-primary"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}