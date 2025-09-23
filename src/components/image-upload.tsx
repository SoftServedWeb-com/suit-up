"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  X,
  Camera,
  History,
  Grid3X3,
  FileImage,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Crop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  cleanup,
  initializeFaceDetector,
  processGarmentImage,
  processGarmentImageFromUrl,
} from "@/lib/face-crop";
import { ImageUploadProps, PreviousImage } from "@/lib/types";
import { getCategoryColor } from "@/lib/colors-switch";

export default function ImprovedImageUpload({
  title,
  description,
  file,
  onUpload,
  onRemove,
  onSelectPrevious,
  type,
  icon,
}: ImageUploadProps) {
  const [previousImages, setPreviousImages] = useState<PreviousImage[]>([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPreviousImage, setSelectedPreviousImage] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedPrevious, setHasLoadedPrevious] = useState(false);

  const [processingImage, setProcessingImage] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [imageCropped, setImageCropped] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);

  // Load previous images when component mounts or when user first interacts
  useEffect(() => {
    if (type === "garment") {
      initializeFaceDetector()
        .then(() => {
          setDetectorReady(true);
          console.log("Face detector ready");
        })
        .catch((err) => {
          console.error("Failed to initialize face detector:", err);
        });
    }

    // Cleanup on unmount
    return () => {
      if (type === "garment") {
        cleanup();
      }
    };
  }, [type]);

  // Load previous images
  const loadPreviousImages = async () => {
    if (hasLoadedPrevious && !error) return;

    setIsLoadingPrevious(true);
    setError(null);

    try {
      const response = await fetch("/api/try-on/status-history");

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.requests || !Array.isArray(data.requests)) {
        setError("Invalid response from server");
        return;
      }

      const images: PreviousImage[] = [];
      const seenUrls = new Set<string>();

      data.requests.forEach((request: any, index: number) => {
        const imageUrl =
          type === "model" ? request.modelImageUrl : request.garmentImageUrl;

        if (
          imageUrl &&
          typeof imageUrl === "string" &&
          imageUrl.trim() &&
          !seenUrls.has(imageUrl)
        ) {
          seenUrls.add(imageUrl);
          images.push({
            id: request.id || `${type}-${index}`,
            url: imageUrl,
            createdAt: request.createdAt || new Date().toISOString(),
            category: type === "garment" ? request.category : undefined,
          });
        }
      });

      images.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPreviousImages(images);
      setHasLoadedPrevious(true);
    } catch (error) {
      console.error("Error loading previous images:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setSelectedPreviousImage(null);
    setImageCropped(false);

    if (type === "garment") {
      setProcessingImage(true);

      try {
        // Step 1: Analyze first
        const form = new FormData();
        form.append("garmentImage", selectedFile);

        const res = await fetch("/api/garment/analyze", {
          method: "POST",
          body: form,
        });
        const data = await res.json();

        let fileToUpload = selectedFile;
        let wasCropped = false;

        if (res.ok && data.success && data.haveFace && detectorReady) {
          console.log("😊 Face detected! Cropping...");

          try {
            const result = await processGarmentImage(selectedFile, 0.3);

            if (result.wasCropped) {
              fileToUpload = result.file;
              wasCropped = true;
              setImageCropped(true);

              // VISUAL VERIFICATION - Create side-by-side comparison
              const originalUrl = URL.createObjectURL(selectedFile);
              const croppedUrl = URL.createObjectURL(result.file);

              console.log("🖼️ VISUAL COMPARISON:");
              console.log(
                "%c Original Image:",
                "color: blue; font-weight: bold"
              );
              console.log(originalUrl);
              console.log(
                "%c Cropped Image:",
                "color: green; font-weight: bold"
              );
              console.log(croppedUrl);

              // Open both images in new tabs for comparison
              if (
                confirm("Open images for comparison? (Original vs Cropped)")
              ) {
                window.open(originalUrl, "_blank");
                setTimeout(() => window.open(croppedUrl, "_blank"), 100);
              }

              // Show dimensions
              const img1 = new Image();
              const img2 = new Image();
              img1.onload = () => {
                img2.onload = () => {
                  console.table({
                    Original: {
                      width: img1.width,
                      height: img1.height,
                      size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
                    },
                    Cropped: {
                      width: img2.width,
                      height: img2.height,
                      size: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
                    },
                  });
                };
                img2.src = croppedUrl;
              };
              img1.src = originalUrl;
            }
          } catch (cropError) {
            console.error("❌ Cropping failed:", cropError);
          }
        }

        // Upload the final file
        onUpload(fileToUpload);

        if (res.ok && data.success) {
          window.dispatchEvent(
            new CustomEvent("garmentAnalyzed", {
              detail: {
                description: data.description,
                haveFace: data.haveFace,
                wasCropped: wasCropped,
              },
            })
          );
        }
      } catch (err) {
        console.error("Error:", err);
        onUpload(selectedFile);
      } finally {
        setProcessingImage(false);
      }
    } else {
      onUpload(selectedFile);
    }
  };

  const handleSelectPrevious = async (imageUrl: string) => {
    setSelectedPreviousImage(imageUrl);
    setImageCropped(false);

    if (onSelectPrevious) {
      onSelectPrevious(imageUrl);
    }
    setShowGallery(false);

    // For garment images, analyze and crop if needed
    if (type === "garment") {
      console.log("🔄 Processing previous garment image");
      setProcessingImage(true);

      try {
        // Step 1: Analyze the image
        const analyzeForm = new FormData();
        analyzeForm.append("imageUrl", imageUrl);

        console.log("📤 Analyzing previous image URL...");
        const res = await fetch("/api/garment/analyze", {
          method: "POST",
          body: analyzeForm,
        });
        const data = await res.json();
        console.log("📊 Analysis result for previous image:", data);

        // Step 2: If face detected and detector ready, crop it
        if (res.ok && data.success && data.haveFace && detectorReady) {
          console.log("😊 Face detected in previous image! Starting crop...");

          try {
            const result = await processGarmentImageFromUrl(imageUrl, 0.3);

            if (result.wasCropped && result.blob) {
              console.log("✂️ Successfully cropped previous image");
              const croppedFile = new File(
                [result.blob],
                `garment_cropped_${Date.now()}.jpg`,
                { type: "image/jpeg" }
              );
              onUpload(croppedFile);
              setSelectedPreviousImage(null); // Clear selection since using cropped
              setImageCropped(true);
            }
          } catch (cropError) {
            console.error("❌ Error cropping previous image:", cropError);
          }
        }

        // Dispatch event
        if (res.ok && data.success) {
          window.dispatchEvent(
            new CustomEvent("garmentAnalyzed", {
              detail: {
                description: data.description,
                haveFace: data.haveFace,
                wasCropped: imageCropped,
              },
            })
          );
        }
      } catch (err) {
        console.error("❌ Error processing previous image:", err);
      } finally {
        setProcessingImage(false);
      }
    }
  };
  const handleShowGallery = () => {
    if (!hasLoadedPrevious) {
      loadPreviousImages();
    }
    setShowGallery(true);
  };

  const getInfoContent = () => {
    if (type === "model") {
      return (
        <div className="space-y-4 text-sm p-3 glass-card">
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Best Practices
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • <strong>Full body shots</strong> work best for complete outfit
                swaps
              </li>
              <li>
                • <strong>Clear, well-lit photos</strong> with good contrast
              </li>
              <li>
                • <strong>Person facing forward</strong> with arms at sides
              </li>
              <li>
                • <strong>Simple background</strong> (solid colors work best)
              </li>
              <li>
                • <strong>High resolution</strong> but under 2000px height
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Avoid
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Blurry or low-quality images</li>
              <li>• Extreme poses or unusual angles</li>
              <li>• Heavy shadows or poor lighting</li>
              <li>• Cluttered backgrounds</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Focused shots (upper/lower body) work well
              for specific garment types.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4 text-sm p-3 glass-card">
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Best Garment Types
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • <strong>Flat-lay images</strong> (best quality)
              </li>
              <li>
                • <strong>Ghost mannequin</strong> photos
              </li>
              <li>
                • <strong>Product photos</strong> from e-commerce sites
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Crop className="h-4 w-4 text-blue-500" />
              Auto-Cropping
            </h4>
            <p className="text-muted-foreground">
              If a face is detected in the garment image, it will be
              automatically cropped from the neck down for better results.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Avoid
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Blurry or pixelated images</li>
              <li>• Multiple garments in one image</li>
              <li>• Images with text overlays</li>
            </ul>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300">
              <strong>Pro Tip:</strong> Use flat-lay images for the most precise
              try-on results.
            </p>
          </div>
        </div>
      );
    }
  };

  const currentImageSrc =
    selectedPreviousImage || (file ? URL.createObjectURL(file) : null);

  return (
    <Card className="h-full hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-background/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-accent-foreground font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon || <Camera className="h-5 w-5 text-primary" />}
            {title}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 max-h-96 overflow-y-auto"
              side="bottom"
              align="end">
              {getInfoContent()}
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {processingImage ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Processing garment image...
            </p>
          </div>
        ) : currentImageSrc ? (
          // Image Selected State
          <div className="space-y-4">
            
            {type === "garment" && file && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                    ✂️ Image auto-cropped from neck down
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = URL.createObjectURL(file);
                      window.open(url, "_blank");
                    }}
                    className="mt-1 text-xs">
                    View Cropped Image
                  </Button>
                </div>
              )}
            <div className="relative group">
              <img
                src={currentImageSrc}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-border group-hover:border-primary/30 transition-colors"
                onError={(e) => {
                  console.error(`Failed to load image: ${currentImageSrc}`);
                  // The base64 SVG creates a 200x200 gray placeholder with "Image not found" text
                  // - Sets a gray (#ddd) background
                  // - Adds centered text in Arial 14px in #999 color
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                }}
              />
              {onRemove && (
                <button
                  onClick={() => {
                    setSelectedPreviousImage(null);
                    if (onRemove) onRemove();
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Image Source Indicator */}
              <div className="absolute bottom-2 left-2">
                {selectedPreviousImage ? (
                  <div className="bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Previous
                  </div>
                ) : file && file.size > 5 * 1024 * 1024 ? (
                  <div className="bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Large file
                  </div>
                ) : (
                  <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Ready
                  </div>
                )}
              </div>
            </div>

            {/* Image Info */}
            <div className="text-center space-y-2">
              {selectedPreviousImage ? (
                <p className="text-sm text-muted-foreground">
                  Using previous image
                </p>
              ) : file ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {file.name}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById(`${type}-upload`)?.click()
                }
                className="hover:border-primary/50 hover:text-primary transition-colors">
                <Upload className="h-3 w-3 mr-2" />
                Upload New
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShowGallery}
                className="hover:border-primary/50 hover:text-primary transition-colors">
                <History className="h-3 w-3 mr-2" />
                Browse Previous
              </Button>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="space-y-4">
            {/* Main Upload Area */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-gradient-to-b from-muted/20 to-muted/5 hover:from-primary/5 hover:to-primary/10"
              onClick={() =>
                document.getElementById(`${type}-upload`)?.click()
              }>
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-105 duration-300">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">
                    Drop your image here
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 4MB
                  </p>
                </div>
              </div>
            </div>
            

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Previous Images Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowGallery}
              className="w-full hover:border-primary/50 hover:text-primary transition-colors"
              disabled={isLoadingPrevious}>
              {isLoadingPrevious ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <History className="h-3 w-3 mr-2" />
                  Choose from Previous Images
                  {hasLoadedPrevious && previousImages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {previousImages.length}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          id={`${type}-upload`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Gallery Dialog */}
        <Dialog open={showGallery} onOpenChange={setShowGallery}>
          <DialogContent className="max-w-md md:max-w-4xl w-full  max-h-[80vh] m overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Previous {type === "model" ? "Model" : "Garment"} Images
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[60vh]">
              {isLoadingPrevious ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">
                    Loading previous images...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Error Loading Images
                  </h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={loadPreviousImages}
                    className="hover:border-primary/50 hover:text-primary">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : previousImages.length === 0 ? (
                <div className="text-center py-12">
                  <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No previous images
                  </h3>
                  <p className="text-muted-foreground">
                    No previous {type} images found. Upload some images first!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previousImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer"
                      onClick={() => handleSelectPrevious(image.url)}>
                      <img
                        src={image.url}
                        alt={`Previous ${type}`}
                        className="w-full aspect-square object-cover rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-200 hover:scale-105"
                        onError={(e) => {
                          console.error(
                            `Failed to load gallery image: ${image.url}`
                          );
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==";
                        }}
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>

                      {/* Category Badge for Garments */}
                      {type === "garment" && image.category && (
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`text-xs ${getCategoryColor(
                              image.category
                            )}`}>
                            {image.category}
                          </Badge>
                        </div>
                      )}

                      {/* Date */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
