import React from "react";
import {
  Pen,
  ArrowRight,
  Type,
  Image,
  Lasso,
  MessageSquare,
} from "lucide-react";
import { ToolButton } from "./ToolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToolType } from "../annotation-types";

interface DrawingToolbarProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  className?: string;
  isMaskToolActive?: boolean;
  isGenerating?: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onToolSelect,
  className,
  isMaskToolActive = false,
  isGenerating = false,
}) => {
  const isToolDisabled = (tool: ToolType) => {
    if (isGenerating) return true;
    if (tool === "mask") return false; // Mask tool is never disabled by itself
    return isMaskToolActive; // Other tools are disabled when mask is active
  };

  return (
    <Card className={`border-border ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Drawing Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ToolButton
          tool="draw"
          activeTool={activeTool}
          onSelect={isToolDisabled("draw") ? () => {} : onToolSelect}
          icon={<Pen size={18} />}
          label="Draw"
          disabled={isToolDisabled("draw")}
        />

        <ToolButton
          tool="arrow"
          activeTool={activeTool}
          onSelect={isToolDisabled("arrow") ? () => {} : onToolSelect}
          icon={<ArrowRight size={18} />}
          label="Arrow"
          disabled={isToolDisabled("arrow")}
        />

        {/* <ToolButton
          tool="text"
          activeTool={activeTool}
          onSelect={isToolDisabled("text") ? () => {} : onToolSelect}
          icon={<Type size={18} />}
          label="Text"
          disabled={isToolDisabled("text")}
        /> */}

        <ToolButton
          tool="image"
          activeTool={activeTool}
          onSelect={isToolDisabled("image") ? () => {} : onToolSelect}
          icon={<Image size={18} />}
          label="Image"
          disabled={isToolDisabled("image")}
        />

        <ToolButton
          tool="mask"
          activeTool={activeTool}
          onSelect={isToolDisabled("mask") ? () => {} : onToolSelect}
          icon={<Lasso size={18} />}
          label="Mask"
          disabled={isToolDisabled("mask")}
        />

        <ToolButton
          tool="prompt"
          activeTool={activeTool}
          onSelect={isToolDisabled("prompt") ? () => {} : onToolSelect}
          icon={<MessageSquare size={18} />}
          label="Prompt"
          disabled={isToolDisabled("prompt")}
        />
      </CardContent>
    </Card>
  );
};
