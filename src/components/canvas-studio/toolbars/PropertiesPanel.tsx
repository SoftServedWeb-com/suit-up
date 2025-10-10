import React from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToolType } from "../annotation-types";

interface PropertiesPanelProps {
  activeTool: ToolType;
  colors: {
    draw: string;
    arrow: string;
    text: string;
    mask: string;
  };
  sizes: {    
    drawThickness: number;
    arrowThickness: number;
    fontSize: number;
    brushSize: number;
  };
  onColorChange: (tool: string, color: string) => void;
  onSizeChange: (property: string, size: number) => void;
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeTool,
  colors,
  sizes,
  onColorChange,
  onSizeChange,
  className,
}) => {
  if (!activeTool) {
    return (
      <Card className={`border-border ${className || ''}`}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a tool to see properties
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium capitalize">
          {activeTool} Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTool === "draw" && (
          <>
            <ColorPicker
              label="Color"
              value={colors.draw}
              onChange={(color) => onColorChange("draw", color)}
            />
            <Slider
              label="Thickness"
              value={sizes.drawThickness}
              onChange={(value) => onSizeChange("drawThickness", value)}
              min={1}
              max={20}
            />
          </>
        )}

        {activeTool === "arrow" && (
          <>
            <ColorPicker
              label="Color"
              value={colors.arrow}
              onChange={(color) => onColorChange("arrow", color)}
            />
            <Slider
              label="Thickness"
              value={sizes.arrowThickness}
              onChange={(value) => onSizeChange("arrowThickness", value)}
              min={1}
              max={20}
            />
          </>
        )}

        {activeTool === "text" && (
          <>
            <ColorPicker
              label="Color"
              value={colors.text}
              onChange={(color) => onColorChange("text", color)}
            />
            <Slider
              label="Font Size"
              value={sizes.fontSize}
              onChange={(value) => onSizeChange("fontSize", value)}
              min={12}
              max={72}
            />
          </>
        )}

        {activeTool === "mask" && (
          <>
            <ColorPicker
              label="Color"
              value={colors.mask}
              onChange={(color) => onColorChange("mask", color)}
            />
            <Slider
              label="Brush Size"
              value={sizes.brushSize}
              onChange={(value) => onSizeChange("brushSize", value)}
              min={10}
              max={100}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
