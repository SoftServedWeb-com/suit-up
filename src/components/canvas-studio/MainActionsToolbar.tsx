'use client'

import React from "react";
import { Upload, Square, Undo, Redo, Trash2, Download, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MainActionsToolbarProps {
  isVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isGenerating: boolean;
  isImageLoaded: boolean;
  isMaskActive: boolean;
  hasMaskSelection: boolean;
  maskPrompt: string;
  onClickUpload: () => void;
  onClickNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onGenerate: () => void;
}

export const MainActionsToolbar: React.FC<MainActionsToolbarProps> = ({
  isVisible,
  canUndo,
  canRedo,
  isGenerating,
  isImageLoaded,
  isMaskActive,
  hasMaskSelection,
  maskPrompt,
  onClickUpload,
  onClickNew,
  onUndo,
  onRedo,
  onClear,
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
            variant="outline"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <Button
            onClick={onClickNew}
            variant="outline"
            size="sm"
          >
            <Square className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New</span>
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={onUndo}
              disabled={!canUndo || isGenerating}
              variant="ghost"
              size="sm"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              onClick={onRedo}
              disabled={!canRedo || isGenerating}
              variant="ghost"
              size="sm"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={onClear}
            disabled={isGenerating}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={onDownload}
            disabled={!isImageLoaded || isGenerating}
            variant="ghost"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <span>{isMaskActive ? "Edit Mask" : "Generate"}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MainActionsToolbar;


