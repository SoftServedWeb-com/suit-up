"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface ImageUploadProps {
  selectedImage: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File | null, preview: string | null) => void;
}

export default function ImageUpload({
  selectedImage,
  imagePreview,
  onImageSelect,
}: ImageUploadProps) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelect(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageSelect(null, null);
  };

  return (
    <Card className="border-ring bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Your Image
        </CardTitle>
        <CardDescription>
          Choose an image to transform with AI-powered style prompts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Selected image"
                    width={300}
                    height={300}
                    className="max-w-xs max-h-64 object-contain rounded-lg border"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                  <label htmlFor="image-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Change Image</span>
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <label htmlFor="image-upload">
                    <Button variant="outline" asChild>
                      <span>Choose Image</span>
                    </Button>
                  </label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
