'use client'

import React, { useState, useEffect } from "react";
import { Info, X, Lightbulb, Sparkles, ShirtIcon, ImageIcon, Palette, ArrowDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type GuidanceStep = 
  | 'blank-canvas-start'
  | 'uploaded-image-start'
  | 'has-annotations'
  | 'ready-to-idealize'
  | 'has-generated'
  | 'ready-for-tryon';

interface GuidanceBannerProps {
  currentStep: GuidanceStep;
  hasAnnotations: boolean;
  hasGenerated: boolean;
  isBlankCanvas: boolean;
  onDismiss?: () => void;
}

const guidanceConfig: Record<GuidanceStep, {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}> = {
  'blank-canvas-start': {
    icon: <Palette className="h-4 w-4" />,
    title: "Start Creating",
    description: "Use the Tools panel on the left to draw or add images, then click 'Visualize' to transform with AI",
    variant: 'default' as const,
  },
  'uploaded-image-start': {
    icon: <ImageIcon className="h-4 w-4" />,
    title: "Edit Your Image",
    description: "Use the Mask tool to select areas to edit, or add annotations. Click 'Visualize' when ready",
    variant: 'default' as const,
  },
  'has-annotations': {
    icon: <Sparkles className="h-4 w-4" />,
    title: "Ready to Generate",
    description: "Your design is ready. Click the 'Visualize' button below to transform it with AI",
    variant: 'default' as const,
  },
  'ready-to-idealize': {
    icon: <Sparkles className="h-4 w-4" />,
    title: "Next: Click Visualize",
    description: "Click the 'Visualize' button below to generate your design with AI",
    variant: 'default' as const,
  },
  'has-generated': {
    icon: <ShirtIcon className="h-4 w-4" />,
    title: "Success!",
    description: "Your design is generated. Open Gallery on the right and click 'Try On' to see it on a model",
    variant: 'default' as const,
  },
  'ready-for-tryon': {
    icon: <ShirtIcon className="h-4 w-4" />,
    title: "Try It On",
    description: "Open the Gallery on the right side and click 'Try On' to see your design on a virtual model",
    variant: 'default' as const,
  },
};

export const GuidanceBanner: React.FC<GuidanceBannerProps> = ({
  currentStep,
  hasAnnotations,
  hasGenerated,
  isBlankCanvas,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  // Load dismissed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('canvas-guidance-dismissed');
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error("Failed to load guidance state:", e);
    }
  }, []);

  const handleDismiss = () => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(currentStep);
    setDismissed(newDismissed);
    
    try {
      localStorage.setItem('canvas-guidance-dismissed', JSON.stringify(Array.from(newDismissed)));
    } catch (e) {
      console.error("Failed to save guidance state:", e);
    }
    
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't show if already dismissed
  if (dismissed.has(currentStep) || !isVisible) {
    return null;
  }

  const config = guidanceConfig[currentStep];

  const showArrow = currentStep === 'has-annotations';

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-xl w-full px-4">
      <Alert 
        variant={config.variant}
        className="bg-primary/5 border-primary/30 shadow-lg backdrop-blur-sm"
      >
        {config.icon}
        <AlertTitle className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {config.title}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-primary/20 ml-2"
            onClick={handleDismiss}
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-xs">
          {config.description}
        </AlertDescription>
      </Alert>
      
      {/* Arrow pointing down when ready to visualize */}
      {showArrow && (
        <div className="flex flex-col items-center mt-2">
          <ArrowDown className="h-5 w-5 text-primary" strokeWidth={2} />
          <div className="mt-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
            Click Visualize
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidanceBanner;

