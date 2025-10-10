"use client";

import React, { useState } from "react";
import { X, Upload, Loader2, ShirtIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentImageUrl: string; // The generated canvas image
  onTryOnComplete?: (resultUrl: string) => void;
}

export function TryOnModal({ isOpen, onClose, garmentImageUrl, onTryOnComplete }: TryOnModalProps) {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [personImagePreview, setPersonImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("upper_body");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  const categories = [
    { value: "upper_body", label: "Upper Body (Tops, Shirts, Jackets)" },
    { value: "lower_body", label: "Lower Body (Pants, Skirts)" },
    { value: "dresses", label: "Dresses" },
    { value: "full_body", label: "Full Body Outfit" },
  ];

  const handlePersonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonImage(file);
      setPersonImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleTryOn = async () => {
    if (!personImage) {
      setError("Please upload a person image");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert garment URL to File
      const garmentResponse = await fetch(garmentImageUrl);
      const garmentBlob = await garmentResponse.blob();
      const garmentFile = new File([garmentBlob], "garment.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("modelImage", personImage);
      formData.append("garmentImage", garmentFile);
      formData.append("category", category);

      const response = await fetch("/api/try-on-beta", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process try-on");
      }

      if (data.success && data.resultImageUrl) {
        setResultImageUrl(data.resultImageUrl);
        onTryOnComplete?.(data.resultImageUrl);
      } else {
        throw new Error("No result image received");
      }
    } catch (err: any) {
      console.error("Try-on error:", err);
      setError(err.message || "Failed to process try-on. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPersonImage(null);
    setPersonImagePreview(null);
    setResultImageUrl(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShirtIcon className="h-5 w-5" />
            Virtual Try-On
          </DialogTitle>
        </DialogHeader>

        {!resultImageUrl ? (
          <div className="space-y-6">
            {/* Preview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Garment Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Garment (From Canvas)
                </label>
                <div className="relative w-full aspect-square overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garmentImageUrl}
                    alt="Garment"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Person Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Person Image *
                </label>
                <div className="relative w-full aspect-square overflow-hidden rounded-lg border bg-muted">
                  {personImagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={personImagePreview}
                        alt="Person"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPersonImage(null);
                          setPersonImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/80 transition-colors">
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload person image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePersonImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Garment Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleTryOn} disabled={!personImage || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShirtIcon className="h-4 w-4 mr-2" />
                    Try On
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Result View */
          <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImageUrl}
                alt="Try-on Result"
                className="w-full h-auto"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => window.open(resultImageUrl, "_blank")}>
                Open in New Tab
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

