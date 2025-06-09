"use client";

import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ImageUploadProps {
  title: string;
  description: string;
  file: File | null;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  type: "model" | "garment";
  icon?: React.ReactNode;
}

export default function ImageUpload({
  title,
  description,
  file,
  onUpload,
  onRemove,
  type,
  icon
}: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <Card className="h-full glass-card hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon || <Camera className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {file ? (
            <div className="space-y-4">
              <div className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-border group-hover:border-primary/30 transition-colors"
                />
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3 truncate">{file.name}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById(`${type}-upload`)?.click()}
                  className="hover:border-primary/50 hover:text-primary"
                >
                  Change Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                 onClick={() => document.getElementById(`${type}-upload`)?.click()}>
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Button variant="outline" size="sm" className="hover:border-primary/50 hover:text-primary">
                    Upload Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}
          <input
            id={`${type}-upload`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}