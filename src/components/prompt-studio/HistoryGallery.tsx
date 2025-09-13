"use client";

import { Loader2, Camera, ZoomIn } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { TransformationRequest } from "./ResultModal";

interface HistoryGalleryProps {
  transformationHistory: TransformationRequest[];
  isLoading: boolean;
  onResultClick: (transformation: TransformationRequest) => void;
}

export default function HistoryGallery({
  transformationHistory,
  isLoading,
  onResultClick,
}: HistoryGalleryProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">
              Transformation Gallery
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              View and manage your AI-transformed images
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {transformationHistory.length} transformations
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading your gallery...</p>
          </div>
        ) : transformationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No transformations yet
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Transform your first image to see your creations here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformationHistory.map((transformation) => (
              <div
                key={transformation.id}
                className="group cursor-pointer"
                onClick={() => {
                  if (transformation.status === "COMPLETED" && transformation.resultImageUrl) {
                    onResultClick(transformation);
                  }
                }}
              >
                <Card className="border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Result Image */}
                      {transformation.resultImageUrl && (
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                          <Image
                            src={transformation.resultImageUrl}
                            alt="Transformation result"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="h-3 w-3" />
                          </div>
                        </div>
                      )}

                      {/* Transformation Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">
                            {transformation.promptName}
                          </h4>
                          <Badge
                            variant={transformation.status === "COMPLETED" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {transformation.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(transformation.createdAt).toLocaleDateString()}
                          </span>
                          {transformation.processingTime && (
                            <span>{transformation.processingTime}s</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
