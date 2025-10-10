'use client'

import React from "react";
import { Upload, Square, Download, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MainActionsToolbarProps {
  isVisible: boolean;
  isGenerating: boolean;
  isImageLoaded: boolean;
  isMaskActive: boolean;
  hasMaskSelection: boolean;
  maskPrompt: string;
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
  onClickUpload,
  onClickNew,
  onDownload,
  onGenerate,
}) => {
  if (!isVisible) return null;

  const isGenerateDisabled = !isImageLoaded || isGenerating || (isMaskActive && ( !hasMaskSelection || !maskPrompt.trim()))

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <Button
            onClick={onClickUpload}
            variant="outline">
            <Upload className="h-4 w-4 mr-2"  />
            <span className="hidden sm:inline text-lg">Upload</span>
          </Button>

          <Button
            onClick={onClickNew}
            variant="outline">
            <Square className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline text-lg">New</span>
          </Button>

          <Button
            onClick={onDownload}
            disabled={!isImageLoaded || isGenerating}
            variant="ghost">
            <Download className="h-4 w-4" />
          </Button>

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
        </div>
      </CardContent>
    </Card>
  );
};

export default MainActionsToolbar;


