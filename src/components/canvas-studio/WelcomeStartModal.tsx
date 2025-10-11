'use client'

import React from "react";
import { Upload, Square, X, Maximize2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PresetSize = {
  name: string;
  width: number;
  height: number;
  isFullscreen?: boolean;
};

interface WelcomeStartModalProps {
  isOpen: boolean;
  showSizeSelector: boolean;
  onOpenSizeSelector: () => void;
  onCloseSizeSelector: () => void;
  onClickUpload: () => void;
  presetSizes: PresetSize[];
  customWidth: string;
  customHeight: string;
  setCustomWidth: (value: string) => void;
  setCustomHeight: (value: string) => void;
  onCreateCustomSize: () => void;
  onSelectPreset: (width: number, height: number) => void;
}

export const WelcomeStartModal: React.FC<WelcomeStartModalProps> = ({
  isOpen,
  showSizeSelector,
  onOpenSizeSelector,
  onCloseSizeSelector,
  onClickUpload,
  presetSizes,
  customWidth,
  customHeight,
  setCustomWidth,
  setCustomHeight,
  onCreateCustomSize,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  if (showSizeSelector) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <Card className="w-full max-w-4xl mx-4 shadow-xl border-border">
          <CardHeader className="relative">
            <button
              onClick={onCloseSizeSelector}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
            <CardTitle className="text-2xl font-serif">Choose Canvas Size</CardTitle>
            <CardDescription>Select a preset or create your own custom size</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetSizes.filter(p => !p.isFullscreen).map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  onClick={() => onSelectPreset(preset.width, preset.height)}
                  className="h-auto flex flex-col items-center justify-center p-4 hover:bg-primary/5 hover:border-primary transition-all"
                >
                  <Square size={24} className="mb-2 text-muted-foreground" />
                  <span className="font-medium text-sm mb-1">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">{preset.width} × {preset.height}</span>
                </Button>
              ))}
            </div>

            {presetSizes.filter(p => p.isFullscreen).map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => onSelectPreset(preset.width, preset.height)}
                className="w-full flex items-center justify-between p-4 h-auto hover:bg-primary/5 hover:border-primary transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Maximize2 size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="block font-medium text-base">{preset.name}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Maximum available workspace</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{preset.width} × {preset.height}px</span>
              </Button>
            ))}

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Square size={16} />
                  Custom Size
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-muted-foreground mb-2">Width (px)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      min="100"
                      max="2400"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-muted-foreground mb-2">Height (px)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      min="100"
                      max="2400"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                    />
                  </div>
                  <Button onClick={onCreateCustomSize}>
                    Create
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Maximum size: 2400 × 2400 pixels</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 shadow-xl border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-serif">Welcome to Canvas Studio</CardTitle>
          <CardDescription className="text-base">Choose your starting point</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onClickUpload}
              className="h-auto flex flex-col items-center justify-center p-8 hover:bg-primary/5 hover:border-primary transition-all group min-h-[240px]"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">Start with an existing photo or design</p>
              <div className="text-xs text-muted-foreground/80 text-center space-y-1">
                <p>→ Use Mask tool to edit areas</p>
                <p>→ Click Idealize to enhance</p>
                <p>→ Try on your creation!</p>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={onOpenSizeSelector}
              className="h-auto flex flex-col items-center justify-center p-8 hover:bg-primary/5 hover:border-primary transition-all group min-h-[240px]"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Square size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Blank Canvas</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">Create from your imagination</p>
              <div className="text-xs text-muted-foreground/80 text-center space-y-1">
                <p>→ Draw or add images</p>
                <p>→ Click Idealize to generate</p>
                <p>→ Try on your design!</p>
              </div>
            </Button>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-center text-muted-foreground">
              <span className="font-medium">💡 Pro Tip:</span> All tools support tooltips! Hover over any button to learn what it does.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeStartModal;


