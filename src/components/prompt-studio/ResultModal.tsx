"use client";

import { useState } from "react";
import { Wand2, Download, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

export interface TransformationRequest {
  id: string;
  originalImageUrl: string;
  resultImageUrl?: string;
  promptUsed: string;
  promptName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string;
  processingTime?: number;
  creditsUsed?: number;
  createdAt: string;
  updatedAt: string;
}

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TransformationRequest | null;
}

export default function ResultModal({ isOpen, onClose, result }: ResultModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (imageUrl: string) => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `prompt_studio_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Download failed", {
        description: "Failed to download the image. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Prompt Studio Creation",
          text: "Check out this AI-transformed image!",
          url: imageUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(imageUrl);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
    }
  };

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-medium font-serif text-primary">
            <Wand2 className="h-5 w-5" />
            Transformation Result
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div className="space-y-3">
              <h4 className="font-medium">Original Image</h4>
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={result.originalImageUrl}
                  alt="Original image"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Transformed Result */}
            <div className="space-y-3">
              <h4 className="font-medium">Transformed Result</h4>
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={result.resultImageUrl!}
                  alt="Transformation result"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Transformation Details */}
          <div className="space-y-3">
            <h4 className="font-medium">Transformation Details</h4>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Style:</span>
                <span className="font-medium">{result.promptName}</span>
              </div>
              {result.processingTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing time:</span>
                  <span>{result.processingTime} seconds</span>
                </div>
              )}
              {result.creditsUsed && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits used:</span>
                  <span>{result.creditsUsed}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(result.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => handleDownload(result.resultImageUrl!)}
              className="bg-primary hover:bg-primary/90"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare(result.resultImageUrl!)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
