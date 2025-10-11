'use client'

import React from "react";
import { Upload, Square, Download, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface MainActionsToolbarProps {
  isVisible: boolean;
  isGenerating: boolean;
  isImageLoaded: boolean;
  isMaskActive: boolean;
  hasMaskSelection: boolean;
  maskPrompt: string;
  hasContent: boolean; // Has annotations or mask strokes
  onClickUpload: () => void;
  onClickNew: () => void;
  onDownload: () => void;
  onGenerate: () => void;
}

export const MainActionsToolbar: React.FC<MainActionsToolbarProps> = ({
  isVisible,
  isGenerating,
  isImageLoaded,
  isMaskActive,
  hasMaskSelection,
  maskPrompt,
  hasContent,
  onClickUpload,
  onClickNew,
  onDownload,
  onGenerate,
}) => {
  if (!isVisible) return null;

  const isGenerateDisabled = !isImageLoaded || isGenerating || (isMaskActive && ( !hasMaskSelection || !maskPrompt.trim()))
  const isGenerateReady = !isGenerateDisabled && hasContent && !isGenerating;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <TooltipProvider>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onClickUpload}
                  variant="outline">
                  <Upload className="h-4 w-4 mr-2"  />
                  <span className="hidden sm:inline text-lg">Upload</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload a new image or replace current canvas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onClickNew}
                  variant="outline">
                  <Square className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline text-lg">New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a new canvas (current work will be lost)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onDownload}
                  disabled={!isImageLoaded || isGenerating}
                  variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download your canvas as an image</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onGenerate}
                  disabled={isGenerateDisabled}
                  className="bg-primary hover:bg-primary/90">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Idealizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline text-lg">{isMaskActive ? "Edit Mask" : "Idealize"}</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMaskActive ? "Transform masked areas with AI" : "Transform your design with AI"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default MainActionsToolbar;


