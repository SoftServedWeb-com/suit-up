'use client'

import React from "react";
import { Lasso } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MaskPromptBarProps {
  isActive: boolean;
  maskStrokesCount: number;
  maskPrompt: string;
  setMaskPrompt: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onCancel: () => void;
  isApiAvailable: boolean;
}

export const MaskPromptBar: React.FC<MaskPromptBarProps> = ({
  isActive,
  maskStrokesCount,
  maskPrompt,
  setMaskPrompt,
  onSubmit,
  onClear,
  onCancel,
  isApiAvailable,
}) => {
  if (!isActive) return null;

  return (
    <div className="mt-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lasso size={16} className="text-primary" />
              <span className="font-medium">
                {maskStrokesCount > 0 ? "Edit Selected Area" : "Paint to Select Area"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={maskPrompt}
                onChange={(e) => setMaskPrompt(e.target.value)}
                placeholder={
                  maskStrokesCount > 0
                    ? "Describe how to change the selected area..."
                    : "First paint an area to select, then describe changes..."
                }
                disabled={maskStrokesCount === 0}
                autoFocus
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    maskStrokesCount > 0 &&
                    maskPrompt.trim()
                  ) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                className="flex-1"
              />

              <div className="flex items-center gap-2">
                {maskStrokesCount > 0 && (
                  <Button
                    onClick={onClear}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    Clear
                  </Button>
                )}

                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaskPromptBar;


