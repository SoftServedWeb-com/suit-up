"use client";

import { useState, useEffect } from "react";
import { Upload, Clock, X, History, ChevronDown, ChevronUp } from "lucide-react";
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
  refreshTrigger?: number;
}

interface UploadHistory {
  id: string;
  preview: string;
  name: string;
  size: number;
  uploadedAt: string;
  source?: 'local' | 'database';
}

interface DatabaseImage {
  id: string;
  originalImageUrl: string;
  promptName: string;
  createdAt: string;
}

const UPLOAD_HISTORY_KEY = 'prompt-studio-upload-history';
const MAX_HISTORY_ITEMS = 6;

export default function ImageUpload({
  selectedImage,
  imagePreview,
  onImageSelect,
  refreshTrigger,
}: ImageUploadProps) {
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([]);
  const [loadingDatabaseImages, setLoadingDatabaseImages] = useState(true);
  const [showPreviousImages, setShowPreviousImages] = useState(false);

  // Load upload history from localStorage and database on component mount
  useEffect(() => {
    // Load from localStorage
    const savedHistory = localStorage.getItem(UPLOAD_HISTORY_KEY);
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setUploadHistory(history.map((item: UploadHistory) => ({ ...item, source: 'local' })));
      } catch (error) {
        console.error('Failed to load upload history:', error);
      }
    }

    // Load from database
    loadDatabaseImages();
  }, []);

  // Refresh database images when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadDatabaseImages();
    }
  }, [refreshTrigger]);

  // Load images from database
  const loadDatabaseImages = async () => {
    try {
      setLoadingDatabaseImages(true);
      const response = await fetch("/api/prompt-transform/history");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.transformations) {
          // Extract unique original images from transformations
          const uniqueImages = new Map<string, DatabaseImage>();
          
          data.transformations.forEach((transformation: any) => {
            if (transformation.originalImageUrl) {
              uniqueImages.set(transformation.originalImageUrl, {
                id: transformation.id,
                originalImageUrl: transformation.originalImageUrl,
                promptName: transformation.promptName || 'Unknown Style',
                createdAt: transformation.createdAt,
              });
            }
          });

          // Convert to array and sort by most recent
          const imageArray = Array.from(uniqueImages.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, MAX_HISTORY_ITEMS); // Limit to prevent too many items

          setDatabaseImages(imageArray);
        }
      } else {
        console.error("Failed to load database images:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load database images:", error);
    } finally {
      setLoadingDatabaseImages(false);
    }
  };

  // Save upload history to localStorage
  const saveUploadHistory = (history: UploadHistory[]) => {
    try {
      localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(history));
      setUploadHistory(history);
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  };

  // Add new upload to history
  const addToHistory = (file: File, preview: string) => {
    const newItem: UploadHistory = {
      id: Date.now().toString(),
      preview,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const updatedHistory = [newItem, ...uploadHistory]
      .slice(0, MAX_HISTORY_ITEMS); // Keep only the most recent items
    
    saveUploadHistory(updatedHistory);
  };

  // Remove item from history
  const removeFromHistory = (id: string) => {
    const updatedHistory = uploadHistory.filter(item => item.id !== id);
    saveUploadHistory(updatedHistory);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
        addToHistory(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selecting from local storage history
  const handleHistorySelect = (historyItem: UploadHistory) => {
    // Convert base64 back to File (for consistency)
    fetch(historyItem.preview)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], historyItem.name, { type: blob.type });
        onImageSelect(file, historyItem.preview);
        // Hide previous images after selection
        setShowPreviousImages(false);
      })
      .catch(error => {
        console.error('Failed to load image from history:', error);
        // Fallback: just use the preview
        onImageSelect(null, historyItem.preview);
        setShowPreviousImages(false);
      });
  };

  // Handle selecting from database images
  const handleDatabaseImageSelect = (dbImage: DatabaseImage) => {
    // Convert URL to File (for consistency)
    fetch(dbImage.originalImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `image-${dbImage.id}.jpg`, { type: blob.type });
        onImageSelect(file, dbImage.originalImageUrl);
        // Hide previous images after selection
        setShowPreviousImages(false);
      })
      .catch(error => {
        console.error('Failed to load image from database:', error);
        // Fallback: just use the URL as preview
        onImageSelect(null, dbImage.originalImageUrl);
        setShowPreviousImages(false);
      });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
          {/* Previous Images Toggle Button */}
          {(uploadHistory.length > 0 || databaseImages.length > 0) && !imagePreview && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowPreviousImages(!showPreviousImages)}
                className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <History className="h-4 w-4" />
                {showPreviousImages ? 'Hide' : 'Show'} Previous Images
                <span className="text-xs text-muted-foreground">
                  ({uploadHistory.length + databaseImages.length})
                </span>
                {loadingDatabaseImages && (
                  <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                )}
                {showPreviousImages ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Reuse images from your recent uploads and previous transformations
              </p>
            </div>
          )}

          {/* Previous Images Content */}
          {showPreviousImages && (uploadHistory.length > 0 || databaseImages.length > 0) && !imagePreview && (
            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Recent Images</h4>
                <span className="text-xs text-muted-foreground">
                  ({uploadHistory.length + databaseImages.length})
                </span>
              </div>

              {/* Local Storage Images */}
              {uploadHistory.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Uploads
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadHistory.map((item) => (
                      <div
                        key={item.id}
                        className="relative group cursor-pointer border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                        onClick={() => handleHistorySelect(item)}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={item.preview}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          {/* Source badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">
                            Local
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item.id);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {/* Info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs truncate">{item.name}</p>
                            <p className="text-xs text-gray-300">{formatFileSize(item.size)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Database Images */}
              {databaseImages.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Previously Used Images
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {databaseImages.map((item) => (
                      <div
                        key={item.id}
                        className="relative group cursor-pointer border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                        onClick={() => handleDatabaseImageSelect(item)}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={item.originalImageUrl}
                            alt={`Image used for ${item.promptName}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          {/* Source badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                            Saved
                          </div>
                          {/* Info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs truncate">Used for {item.promptName}</p>
                            <p className="text-xs text-gray-300">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or upload new image
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
