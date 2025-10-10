'use client'

import React, { useState, useRef, useCallback } from "react";
import { Square, Home, Palette, Sparkles, TestTube, Zap, Pen, ArrowRight, Type, Image, Lasso, MessageSquare, ChevronDown, ChevronRight, X, ChevronUp, ZoomIn, ZoomOut, Trash2, Undo, Redo, ShirtIcon } from "lucide-react";
import { useAnnotations } from "@/lib/hooks";
import { AnnotationCanvas } from "./canvas";
import { TextInputModal, PromptInputModal, GeneratedImageModal, TryOnModal } from "./modals";
import {
  loadImage,
  calculateCanvasDimensions,
  canvasToDataURL,
} from "./utils";
import WelcomeStartModal from "./WelcomeStartModal";
import MaskPromptBar from "./MaskPromptBar";
import MainActionsToolbar from "./MainActionsToolbar";
import Header from "@/components/page/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import type { AnnotationConfig, GenerationRequest } from "./annotation-types";
import { toast } from "sonner";

interface AnnotationEditorProps {
  apiClient?: any;
  config?: Partial<AnnotationConfig>;
  className?: string;
  onImageGenerated?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

const defaultConfig: AnnotationConfig = {
  colors: {
    draw: "#000000",
    arrow: "#ef4444",
    text: "#000000",
    mask: "#3b82f6",
  },
  defaultSizes: {
    drawThickness: 3,
    arrowThickness: 3,
    fontSize: 16,
    brushSize: 30,
  },
  canvas: {
    maxWidth: 1400,
    maxHeight: 1800,
    backgroundColor: "#ffffff",
  },
};

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  apiClient,
  config: userConfig = {},
  className,
  onImageGenerated,
  onError,
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialFileRef = useRef<File | null>(null);

  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [showStartOptions, setShowStartOptions] = useState(true);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [customWidth, setCustomWidth] = useState('800');
  const [customHeight, setCustomHeight] = useState('600');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [colors, setColors] = useState(config.colors);
  const [sizes, setSizes] = useState(config.defaultSizes);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("canvas_generated_gallery");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [tryOnGarmentUrl, setTryOnGarmentUrl] = useState<string | null>(null);

  const addToGallery = (dataUrl: string) => {
    setGallery((prev) => {
      const next = [dataUrl, ...prev].slice(0, 24);
      try {
        window.localStorage.setItem("canvas_generated_gallery", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromGallery = (index: number) => {
    setGallery((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        window.localStorage.setItem("canvas_generated_gallery", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = -event.deltaY * 0.001;
      setZoomLevel((prev) => Math.max(0.25, Math.min(3.0, prev + delta)));
    }
  }, []);

  // Modals
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Mask state
  const [maskPrompt, setMaskPrompt] = useState("");

  // Image overlay
  const overlayImageInputRef = useRef<HTMLInputElement>(null);

  // Annotations hook
  const {
    annotations,
    maskStrokes,
    activeTool,
    isDrawing,
    currentPath,
    selectedAnnotationId,
    isDragging,
    dragType,
    canUndo,
    canRedo,
    startPos,
    currentMousePos,
    setActiveTool,
    setSelectedAnnotationId,
    startDrawing,
    continueDrawing,
    endDrawing,
    addTextAnnotation,
    addImageAnnotation,
    updateTextAnnotation,
    clearAll,
    clearMaskStrokes,
    startDragging,
    continueDragging,
    stopDragging,
    undo,
    redo,
  } = useAnnotations();

  // Calculate fullscreen dimensions (with padding for UI)
  const getFullscreenDimensions = () => {
    if (typeof window === 'undefined') return { width: 1400, height: 900 };
    const padding = 200; // Leave space for toolbars and UI
    return {
      width: Math.min(window.innerWidth - padding, config.canvas.maxWidth),
      height: Math.min(window.innerHeight - padding, config.canvas.maxHeight),
    };
  };

  // Preset sizes for blank canvas
  const presetSizes = [
    { name: 'Square (1:1)', width: 800, height: 800 },
    { name: 'Landscape (16:9)', width: 1200, height: 675 },
    { name: 'Portrait (9:16)', width: 675, height: 1200 },
    { name: 'Standard (4:3)', width: 800, height: 600 },
    { name: 'Full Screen', width: getFullscreenDimensions().width, height: getFullscreenDimensions().height, isFullscreen: true },
  ];

  // Create blank canvas
  const createBlankCanvas = useCallback((width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill with white background
    ctx.fillStyle = config.canvas.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Convert to image
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'blank-canvas.png', { type: 'image/png' });
        loadImage(file).then((img) => {
          setImage(img);
          setDimensions({ width, height });
          setShowStartOptions(false);
          setShowSizeSelector(false);
          clearAll();
        }).catch((error) => {
          onError?.("Failed to create blank canvas");
          console.error("Failed to create blank canvas:", error);
        });
      }
    });
  }, [config.canvas.backgroundColor, clearAll, onError]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const img = await loadImage(file);
        
        // If no image is set as background, set this as background
        if (!image) {
          // Calculate optimal canvas dimensions with max constraints
          // This keeps large images manageable while maintaining aspect ratio
          const maxWidth = config.canvas.maxWidth;
          const maxHeight = config.canvas.maxHeight;
          const canvasDims = calculateCanvasDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );
          
          console.log(`Original image: ${img.width}x${img.height}, Canvas: ${canvasDims.width}x${canvasDims.height}`);
          
          setImage(img);
          // Use calculated dimensions directly to preserve aspect ratio
          setDimensions(canvasDims);
          setShowStartOptions(false);
          clearAll();
        } else {
          // If there's already a background image, add this as an image annotation
          // Position it at the center of the canvas
          const x = (dimensions.width - img.width) / 2;
          const y = (dimensions.height - img.height) / 2;
          addImageAnnotation(x, y, img.width, img.height, img);
        }
      } catch (error) {
        onError?.("Failed to load image");
        console.error("Failed to load image:", error);
      }
    },
    [image, dimensions, addImageAnnotation, clearAll, onError, config.canvas.maxWidth, config.canvas.maxHeight]
  );

  // Handle custom canvas size
  const handleCustomSize = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    
    if (width > 0 && height > 0 && width <= 2400 && height <= 2400) {
      createBlankCanvas(width, height);
    }
  };

  // Handle overlay image upload
  const handleOverlayImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const img = await loadImage(file);

        // Calculate default size (30% of canvas size)
        const maxSize = Math.min(dimensions.width, dimensions.height) * 0.3;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxSize;
            height = maxSize / aspectRatio;
          } else {
            height = maxSize;
            width = maxSize * aspectRatio;
          }
        }

        // Position at center of canvas
        const x = (dimensions.width - width) / 2;
        const y = (dimensions.height - height) / 2;

        addImageAnnotation(x, y, width, height, img);
        setActiveTool(null);
      } catch (error) {
        onError?.("Failed to load overlay image");
        console.error("Failed to load overlay image:", error);
      }
    },
    [dimensions, addImageAnnotation, setActiveTool, onError]
  );

  // Handle canvas mouse events
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width) / zoomLevel;
      const y = (event.clientY - rect.top) * (canvas.height / rect.height) / zoomLevel;
      const point = { x, y, timestamp: Date.now() };

      if (activeTool === "text") {
        setEditingTextId(null);
        setTextPosition({ x, y });
        setShowTextModal(true);
        return;
      }

      if (activeTool === "image") {
        overlayImageInputRef.current?.click();
        return;
      }

      if (activeTool === "prompt") {
        setShowPromptModal(true);
        return;
      }

      // Priority: If drawing tools are active, draw instead of selecting
      if (
        activeTool === "draw" ||
        activeTool === "arrow" ||
        activeTool === "mask"
      ) {
        startDrawing(point);
        return;
      }

      // No active tool - check for dragging/selecting annotations
      const didStartDrag = startDragging(point);
      if (didStartDrag) {
        const textAnn = annotations.find(
          (ann) => ann.id === selectedAnnotationId && ann.type === "text"
        );
        if (textAnn && event.detail === 2) {
          setEditingTextId(textAnn.id);
          setTextPosition({ x: (textAnn as any).x, y: (textAnn as any).y });
          setShowTextModal(true);
          stopDragging();
          return;
        }
        return;
      }

      // Click on empty canvas - deselect
      setSelectedAnnotationId(null);
    },
    [
      activeTool,
      annotations,
      selectedAnnotationId,
      setSelectedAnnotationId,
      startDragging,
      startDrawing,
      stopDragging,
      zoomLevel,
    ]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width) / zoomLevel;
      const y = (event.clientY - rect.top) * (canvas.height / rect.height) / zoomLevel;
      const point = { x, y, timestamp: Date.now() };

      if (isDragging) {
        continueDragging(point);
        return;
      }

      if (isDrawing) {
        continueDrawing(point);
        return;
      }

      // Update cursor based on active tool and what's under the mouse
      // Priority: Active drawing tools override everything
      if (activeTool === "draw" || activeTool === "mask") {
        setCursorStyle("crosshair");
      } else if (activeTool === "arrow") {
        setCursorStyle("crosshair");
      } else if (activeTool === "image") {
        setCursorStyle("crosshair");
      } else if (activeTool === "text") {
        setCursorStyle("text");
      } else if (!activeTool || activeTool === null) {
        // No active tool - show context-aware cursors for selection/resizing
        const handleSize = 12;
        const handleTolerance = 6;
        let newCursor = "default";

        // Check for image resize handles
        for (let i = annotations.length - 1; i >= 0; i--) {
          const ann = annotations[i];
          if (ann.type === "image" && ann.id === selectedAnnotationId) {
            const imgAnn = ann as any;

            // Top-left handle
            if (
              Math.abs(point.x - imgAnn.x) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - imgAnn.y) <= handleSize / 2 + handleTolerance
            ) {
              newCursor = "nwse-resize";
              break;
            }

            // Top-right handle
            if (
              Math.abs(point.x - (imgAnn.x + imgAnn.width)) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - imgAnn.y) <= handleSize / 2 + handleTolerance
            ) {
              newCursor = "nesw-resize";
              break;
            }

            // Bottom-left handle
            if (
              Math.abs(point.x - imgAnn.x) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - (imgAnn.y + imgAnn.height)) <= handleSize / 2 + handleTolerance
            ) {
              newCursor = "nesw-resize";
              break;
            }

            // Bottom-right handle
            if (
              Math.abs(point.x - (imgAnn.x + imgAnn.width)) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - (imgAnn.y + imgAnn.height)) <= handleSize / 2 + handleTolerance
            ) {
              newCursor = "nwse-resize";
              break;
            }

            // Inside image - move cursor
            if (
              point.x >= imgAnn.x &&
              point.x <= imgAnn.x + imgAnn.width &&
              point.y >= imgAnn.y &&
              point.y <= imgAnn.y + imgAnn.height
            ) {
              newCursor = "move";
              break;
            }
          }
        }

        setCursorStyle(newCursor);
      }
    },
    [isDrawing, isDragging, continueDrawing, continueDragging, zoomLevel, annotations, selectedAnnotationId, activeTool]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width) / zoomLevel;
      const y = (event.clientY - rect.top) * (canvas.height / rect.height) / zoomLevel;
      const point = { x, y, timestamp: Date.now() };

      if (isDragging) {
        stopDragging();
        return;
      }

      if (isDrawing) {
        const color = colors[activeTool as keyof typeof colors] || "#000000";
        const thickness =
          activeTool === "draw"
            ? sizes.drawThickness
            : activeTool === "arrow"
            ? sizes.arrowThickness
            : activeTool === "mask"
            ? sizes.brushSize
            : 3;

        endDrawing(point, color, thickness);
        return;
      }
    },
    [isDrawing, isDragging, activeTool, colors, sizes, endDrawing, stopDragging, zoomLevel]
  );

  // Handle text submission
  const handleTextSubmit = useCallback(
    (text: string, color: string, fontSize: number) => {
      if (editingTextId) {
        updateTextAnnotation(editingTextId, { text, color, fontSize });
        setEditingTextId(null);
      } else {
        addTextAnnotation(
          textPosition.x,
          textPosition.y,
          text,
          color,
          fontSize
        );
      }
      setShowTextModal(false);
    },
    [textPosition, addTextAnnotation, editingTextId, updateTextAnnotation]
  );

  // Auto-open modals
  React.useEffect(() => {
    if (activeTool === "text" && !showTextModal && !editingTextId) {
      setTextPosition({
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      });
      setShowTextModal(true);
    }
  }, [activeTool, showTextModal, editingTextId, dimensions]);

  React.useEffect(() => {
    if (activeTool === "prompt" && !showPromptModal) {
      setShowPromptModal(true);
    }
  }, [activeTool, showPromptModal]);

  // Handle color changes
  const handleColorChange = useCallback((tool: string, color: string) => {
    setColors((prev) => ({ ...prev, [tool]: color }));
  }, []);

  // Handle size changes
  const handleSizeChange = useCallback((property: string, size: number) => {
    setSizes((prev) => ({ ...prev, [property]: size }));
  }, []);

  // Handle download
  const handleDownload = useCallback(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;

    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = config.canvas.backgroundColor;
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    const dataUrl = canvasToDataURL(tempCanvas);
    const link = document.createElement("a");
    link.download = "annotated-image.png";
    link.href = dataUrl;
    link.click();
  }, [dimensions, image, config.canvas.backgroundColor]);

  // Handle AI generation
  const handleGenerate = useCallback(
    async (prompt: string) => {
      if (!apiClient || !image) {
        return onError?.("API client not configured or no image loaded");
    
      }

      setIsGenerating(true);

      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = dimensions.width;
        tempCanvas.height = dimensions.height;

        const ctx = tempCanvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        // Draw background image first
        ctx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

        // Draw annotations on top of the background image
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        annotations.forEach((annotation) => {
          const isSelected = annotation.id === selectedAnnotationId;

          if (annotation.type === "draw") {
            if (annotation.path.length > 1) {
              ctx.strokeStyle = annotation.color;
              ctx.lineWidth = annotation.thickness;
              ctx.globalAlpha = isSelected ? 0.7 : 1;

              ctx.beginPath();
              ctx.moveTo(annotation.path[0].x, annotation.path[0].y);
              annotation.path.forEach((point) => {
                ctx.lineTo(point.x, point.y);
              });
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          } else if (annotation.type === "arrow") {
            ctx.strokeStyle = annotation.color;
            ctx.lineWidth = annotation.thickness;
            ctx.globalAlpha = isSelected ? 0.7 : 1;

            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(annotation.startX, annotation.startY);
            ctx.lineTo(annotation.endX, annotation.endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(
              annotation.endY - annotation.startY,
              annotation.endX - annotation.startX
            );
            const headLength = 20;

            ctx.beginPath();
            ctx.moveTo(annotation.endX, annotation.endY);
            ctx.lineTo(
              annotation.endX - headLength * Math.cos(angle - Math.PI / 6),
              annotation.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(annotation.endX, annotation.endY);
            ctx.lineTo(
              annotation.endX - headLength * Math.cos(angle + Math.PI / 6),
              annotation.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
            ctx.globalAlpha = 1;
          } else if (annotation.type === "text") {
            ctx.font = `${annotation.fontSize}px Arial`;
            ctx.fillStyle = annotation.color;
            ctx.globalAlpha = isSelected ? 0.7 : 1;

            // Shadow for visibility
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowBlur = 2;

            ctx.fillText(annotation.text, annotation.x, annotation.y);

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          } else if (annotation.type === "image") {
            ctx.globalAlpha = isSelected ? 0.7 : 1;

            const centerX = annotation.x + annotation.width / 2;
            const centerY = annotation.y + annotation.height / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(annotation.rotation);
            ctx.drawImage(
              annotation.imageElement,
              -annotation.width / 2,
              -annotation.height / 2,
              annotation.width,
              annotation.height
            );
            ctx.restore();
            ctx.globalAlpha = 1;
          }
        });

        // Export composed image (background + annotations)
        const imageData = canvasToDataURL(tempCanvas);

        const maskData = maskStrokes.length > 0 ? maskStrokes : undefined;

        const request: GenerationRequest = {
          imageData,
          maskData,
          prompt,
          materialFile: materialFileRef.current || undefined,
          strength: 0.8,
          guidance: 7.5,
          steps: 20,
        };

        const response = await apiClient.generateImage(request);

        if (response.success && response.result) {
          setGeneratedDataUrl(response.result.output);
          setPreviewOpen(true);
          addToGallery(response.result.output);
          clearMaskStrokes();
          
          // Show credits remaining if available
          if (response.result.creditsRemaining !== undefined) {
            toast.success(`Image generated! ${response.result.creditsRemaining} credits remaining.`);
          }
        } else {
          const errorMsg = response.error?.message || response.error || "Generation failed";
          throw new Error(errorMsg);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Generation failed";
        onError?.(errorMessage);
        console.error("Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      apiClient,
      image,
      dimensions,
      maskStrokes,
      onImageGenerated,
      onError,
      clearMaskStrokes,
      addToGallery,
    ]
  );

  // Welcome modal moved to WelcomeStartModal component

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      
      <main className="max-w-7xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-y-0 border-x">
        {/* Creative Studios Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-serif tracking-tight text-foreground mb-4 flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Creative Studios
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Explore AI-powered creative tools for virtual try-on and image transformation.
          </p>
          
          {/* <div className="flex gap-3 text-sm"> */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full sm:w-auto h-10 sm:h-8 px-3 text-muted-foreground hover:text-foreground flex items-center justify-start sm:justify-center"
                >
                  <Home className="h-4 w-4 sm:h-3 sm:w-3 mr-2" />
                  <span className="truncate">Try-On Studio</span>
                </Button>
              </Link>
              
              <Link href="/prompt-studio" className="w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full sm:w-auto h-10 sm:h-8 px-3 text-muted-foreground hover:text-foreground flex items-center justify-start sm:justify-center"
                >
                  <Sparkles className="h-4 w-4 sm:h-3 sm:w-3 mr-2" />
                  <span className="truncate">Prompt Studio</span>
                </Button>
              </Link>
              
              <div className="relative w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full sm:w-auto h-10 sm:h-8 px-3 text-primary hover:text-primary/90 bg-primary/5 flex items-center justify-start sm:justify-center"
                >
                  <Palette className="h-4 w-4 sm:h-3 sm:w-3 mr-2" />
                  <span className="truncate">Canvas Studio</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Active
                  </Badge>
                </Button>
              </div>
            </div>
        </div>
        
        {/* Main Canvas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-serif tracking-tight text-foreground">
                Canvas Studio
              </p>
              <span className="opacity-70 text-sm text-muted-foreground">
                Create, annotate, and transform images with AI
              </span>
            </div>
            {image && (
              <Badge variant="outline" className="text-xs">
                {dimensions.width} × {dimensions.height}px
              </Badge>
            )}
          </div>


          {/* Full-Screen Canvas Card */}
          <Card className="border-ring bg-background">
            <CardContent className="p-0">
              <div className="relative h-[85vh]">
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto"
                  onWheel={handleWheel}
                >
                  {image ? (
                    <div 
                      className="flex items-center justify-center p-6 relative"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out',
                        cursor: cursorStyle,
                      }}
                    >
                      <AnnotationCanvas
                      dimensions={dimensions}
                      annotations={annotations}
                      maskStrokes={maskStrokes}
                      currentPath={currentPath}
                      isDrawing={isDrawing}
                      activeTool={activeTool}
                      startPos={startPos}
                      currentMousePos={currentMousePos}
                      selectedAnnotationId={selectedAnnotationId}
                      isDragging={isDragging}
                      dragType={dragType}
                      image={image}
                      colors={colors}
                      sizes={sizes}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      className="max-w-full max-h-full object-contain "
                    />
                    
                    {/* Image Tool Helper Tooltip */}
                    {activeTool === "image" && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-in fade-in-0 slide-in-from-top-2 z-50">
                        📸 Click anywhere on the canvas to upload an image
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground py-32">
                    <Square size={80} className="mb-4 opacity-30" strokeWidth={1} />
                    <p className="text-lg font-medium">Your canvas will appear here</p>
                    <p className="text-sm mt-2 opacity-70">Get started by uploading an image or creating a blank canvas</p>
                  </div>
                )}
              </div>

              {/* Drawing Tools & Properties Overlay - Left Side */}
              {image && (
                <>
                  {isToolsPanelOpen ? (
                    <div className="absolute top-4 left-4 w-64 max-h-[calc(100%-2rem)]overflow-hidden z-10">
                      <Card className="border-border bg-white/95 backdrop-blur-sm  shadow-xl ">
                          <CardHeader className="px-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-medium">Drawing Tools</CardTitle>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-fit w-fit aspect-square text-muted-foreground hover:text-foreground"
                                onClick={() => setIsToolsPanelOpen(false)}
                                title="Collapse tools"
                              >
                                <ChevronUp className="h-8 w-8" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 max-h-[calc(100vh-500px)] overflow-y-auto">
                            {/* Tools Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={activeTool === "draw" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "draw") {
                                    setActiveTool(null);
                                  } else {
                                    setActiveTool("draw");
                                  }
                                }}
                                disabled={isGenerating}
                                className="h-auto aspect-square flex flex-col items-center gap-1"
                              >
                                <Pen className="h-8 w-8" />
                                <span className="text-xs">Draw</span>
                              </Button>
                              <Button
                                variant={activeTool === "arrow" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "arrow") {
                                    setActiveTool(null);
                                  } else {
                                    setActiveTool("arrow");
                                  }
                                }}
                                disabled={isGenerating || activeTool === "mask"}
                                className="h-auto aspect-square flex flex-col items-center gap-1"
                              >
                                <ArrowRight className="h-8 w-8" />
                                <span className="text-xs">Arrow</span>
                              </Button>
                              <Button
                                variant={activeTool === "text" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "text") {
                                    setActiveTool(null);
                                  } else {
                                    setActiveTool("text");
                                  }
                                }}
                                disabled={isGenerating || activeTool === "mask"}
                                className="h-auto aspect-square flex flex-col items-center gap-1"
                              >
                                <Type className="h-8 w-8" />
                                <span className="text-xs tracking-tighter">Text</span>
                              </Button>
                              <Button
                                variant={activeTool === "image" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "image") {
                                    setActiveTool(null);
                                  } else {
                                    setActiveTool("image");
                                  }
                                }}
                                disabled={isGenerating || activeTool === "mask"}
                                className="h-full aspect-square flex flex-col items-center"
                              >
                                <Image className="h-8 w-8" />
                                <span className="text-xs">Image</span>
                              </Button>
                              <Button
                                variant={activeTool === "mask" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "mask") {
                                    setActiveTool(null);
                                    setMaskPrompt("");
                                  } else {
                                    setActiveTool("mask");
                                  }
                                }}
                                disabled={isGenerating}
                                className="h-auto aspect-square flex flex-col items-center gap-1"
                              >
                                <Lasso className="h-8 w-8" />
                                <span className="text-xs">Mask</span>
                              </Button>
                              <Button
                                variant={activeTool === "prompt" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (activeTool === "prompt") {
                                    setActiveTool(null);
                                  } else {
                                    setActiveTool("prompt");
                                  }
                                }}
                                disabled={isGenerating || activeTool === "mask"}
                                className="h-auto aspect-square flex flex-col items-center gap-1"
                              >
                                <Sparkles className="h-8 w-8" />
                                <span className="text-xs">Prompt</span>
                              </Button>
                            </div>

                            {/* Properties */}
                            {activeTool && activeTool !== "prompt" && (activeTool === "draw" || activeTool === "arrow" || activeTool === "text" || activeTool === "mask") && (
                              <div className="space-y-3 pt-2 border-t border-border">
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">Color</label>
                                  <input
                                    type="color"
                                    value={colors[activeTool as keyof typeof colors]}
                                    onChange={(e) => handleColorChange(activeTool, e.target.value)}
                                    className="w-full h-10 rounded cursor-pointer border border-border"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-muted-foreground">
                                      {activeTool === "text" ? "Font Size" : activeTool === "mask" ? "Brush Size" : "Thickness"}
                                    </label>
                                    <span className="text-xs font-medium">
                                      {activeTool === "draw" ? sizes.drawThickness :
                                       activeTool === "arrow" ? sizes.arrowThickness :
                                       activeTool === "text" ? sizes.fontSize :
                                       sizes.brushSize}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={activeTool === "text" ? 12 : activeTool === "mask" ? 10 : 1}
                                    max={activeTool === "text" ? 72 : activeTool === "mask" ? 100 : 20}
                                    value={
                                      activeTool === "draw" ? sizes.drawThickness :
                                      activeTool === "arrow" ? sizes.arrowThickness :
                                      activeTool === "text" ? sizes.fontSize :
                                      sizes.brushSize
                                    }
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (activeTool === "draw") handleSizeChange("drawThickness", value);
                                      else if (activeTool === "arrow") handleSizeChange("arrowThickness", value);
                                      else if (activeTool === "text") handleSizeChange("fontSize", value);
                                      else if (activeTool === "mask") handleSizeChange("brushSize", value);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="absolute top-4 left-4 z-10 ">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-9 shadow-xl"
                          onClick={() => setIsToolsPanelOpen(true)}
                          title="Show drawing tools"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Tools
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Generated Images Overlay - Right Side */}
                {gallery.length > 0 && (
                  <>
                    {isGalleryOpen ? (
                      <div className="absolute top-4 right-4 w-64 max-h-[calc(100%-2rem)] overflow-hidden z-10">
                        <Card className="border-border bg-white/95 backdrop-blur-sm shadow-xl">
                          <CardHeader className="">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold">Studio Gallery ({gallery.length})</CardTitle>
                              <div className="flex items-center gap-1">
                               
                                <Button 
                                  variant="destructive" 
                                    size="sm"
                                    className="h-fit w-fit aspect-square text-muted-foreground hover:text-foreground"
                                  onClick={() => { 
                                    setGallery([]); 
                                    try { 
                                      window.localStorage.removeItem("canvas_generated_gallery"); 
                                    } catch {} 
                                  }}
                                  title="Clear all"
                                >
                                  <Trash2 className="h-8 w-8 text-white" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-fit w-fit aspect-square text-muted-foreground hover:text-foreground"
                                  onClick={() => setIsGalleryOpen(false)}
                                  title="Collapse gallery"
                                >
                                  <ChevronUp className="h-8 w-8" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2 space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
                            {gallery.map((url, idx) => (
                              <div key={idx} className="relative border border-border rounded-md overflow-hidden bg-card hover:shadow-md transition-shadow group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Generated ${idx+1}`} className="w-full aspect-square object-cover" />
                                
                                {/* Delete button overlay */}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  onClick={() => removeFromGallery(idx)}
                                  title="Delete image"
                                >
                                  <X className="h-4 w-4" />
                                </Button>

                                <div className="p-1.5 space-y-1.5">
                                  <div className="flex gap-1.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs flex-1"
                                      onClick={async () => {
                                        try {
                                          const img = await loadImage(url);
                                          const maxWidth = config.canvas.maxWidth;
                                          const maxHeight = config.canvas.maxHeight;
                                          const canvasDims = calculateCanvasDimensions(
                                            img.width,
                                            img.height,
                                            maxWidth,
                                            maxHeight
                                          );
                                          setImage(img);
                                          setDimensions(canvasDims);
                                        } catch {}
                                      }}
                                    >
                                      Use
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs flex-1"
                                      onClick={() => { setGeneratedDataUrl(url); setPreviewOpen(true); }}
                                    >
                                      View
                                    </Button>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="text-xs w-full"
                                    onClick={() => {
                                      setTryOnGarmentUrl(url);
                                      setShowTryOnModal(true);
                                    }}
                                  >
                                    <ShirtIcon className="h-3 w-3 mr-1" />
                                    Try On
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-9 shadow-xl"
                          onClick={() => setIsGalleryOpen(true)}
                          title="Show generated images"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          {gallery.length}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Floating Zoom & Edit Controls - Bottom Center */}
                {image && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Card className="border-border bg-white/95 backdrop-blur-sm shadow-xl">
                      <CardContent className="">
                        <div className="flex items-center gap-2">
                          {/* Undo/Redo/Clear Section */}
                          <Button
                            onClick={undo}
                            disabled={!canUndo || isGenerating}
                            variant="ghost"
                            size="sm"
                            title="Undo (Ctrl+Z)"
                            className="h-8 w-8 p-0"
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            onClick={redo}
                            disabled={!canRedo || isGenerating}
                            variant="ghost"
                            size="sm"
                            title="Redo (Ctrl+Y)"
                            className="h-8 w-8 p-0"
                          >
                            <Redo className="h-4 w-4" />
                          </Button>

                          <Button
                            onClick={clearAll}
                            disabled={isGenerating}
                            variant="ghost"
                            size="sm"
                            title="Clear All"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="w-px h-6 bg-border mx-1" />

                          {/* Zoom Section */}
                          <Button
                            onClick={handleZoomOut}
                            disabled={isGenerating || zoomLevel <= 0.25}
                            variant="ghost"
                            size="sm"
                            title="Zoom Out (Ctrl + Scroll)"
                            className="h-8 w-8 p-0"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            onClick={handleZoomReset}
                            disabled={isGenerating || zoomLevel === 1.0}
                            variant="ghost"
                            size="sm"
                            title="Reset Zoom"
                            className="h-8 min-w-[70px] text-sm font-medium"
                          >
                            {Math.round(zoomLevel * 100)}%
                          </Button>
                          
                          <Button
                            onClick={handleZoomIn}
                            disabled={isGenerating || zoomLevel >= 3.0}
                            variant="ghost"
                            size="sm"
                            title="Zoom In (Ctrl + Scroll)"
                            className="h-8 w-8 p-0"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Mask Prompt Bar - Only show when mask tool is active */}
          <MaskPromptBar
            isActive={activeTool === "mask"}
            maskStrokesCount={maskStrokes.length}
            maskPrompt={maskPrompt}
            setMaskPrompt={setMaskPrompt}
            onSubmit={() => {
              if (apiClient) {
                handleGenerate(maskPrompt);
              } else {
                toast.error(`Demo Mode: Would generate with mask prompt: "${maskPrompt}"`);
              }
            }}
            onClear={() => { clearMaskStrokes(); setMaskPrompt(""); }}
            onCancel={() => { setActiveTool(null); setMaskPrompt(""); clearMaskStrokes(); }}
            isApiAvailable={!!apiClient}
          />

          {/* Actions Bar */}
          <MainActionsToolbar
            isVisible={!!image}
            isGenerating={isGenerating}
            isImageLoaded={!!image}
            isMaskActive={activeTool === "mask"}
            hasMaskSelection={maskStrokes.length > 0}
            maskPrompt={maskPrompt}
            onClickUpload={() => fileInputRef.current?.click()}
            onClickNew={() => {
              if (window.confirm("Create a new canvas? Any unsaved work will be lost.")) {
                setShowStartOptions(true);
                setImage(null);
                clearAll();
              }
            }}
            onDownload={handleDownload}
            onGenerate={() => {
              if (
                activeTool === "mask" &&
                maskStrokes.length > 0 &&
                maskPrompt.trim()
              ) {
                if (apiClient) {
                  handleGenerate(maskPrompt);
                } else {
                  toast.error(`Demo Mode: Would generate with mask prompt: "${maskPrompt}"`);
                }
              } else {
                if (apiClient) {
                  setShowPromptModal(true);
                } else {
                  toast.error("Demo Mode: Would open prompt modal for AI generation");
                }
              }
            }}
          />
      </main>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <input
        ref={overlayImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleOverlayImageUpload}
        className="hidden"
      />

      {/* Modals */}
      <TextInputModal
        isOpen={showTextModal}
        onClose={() => {
          setShowTextModal(false);
          setEditingTextId(null);
          setActiveTool(null);
        }}
        onSubmit={handleTextSubmit}
        initialText={
          editingTextId
            ? (annotations.find((a) => a.id === editingTextId) as any)?.text ||
              ""
            : ""
        }
        initialColor={
          editingTextId
            ? (annotations.find((a) => a.id === editingTextId) as any)?.color ||
              colors.text
            : colors.text
        }
        initialFontSize={
          editingTextId
            ? (annotations.find((a) => a.id === editingTextId) as any)
                ?.fontSize || sizes.fontSize
            : sizes.fontSize
        }
        isEditing={!!editingTextId}
      />

      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setActiveTool(null);
        }}
        onSubmit={(prompt, materialFile) => {
          if (apiClient) {
            // Store material file to include in next generation request
            materialFileRef.current = materialFile || null;
            handleGenerate(prompt);
          } else {
            toast.error(`Demo Mode: Would generate with prompt: "${prompt}"`);
            setShowPromptModal(false);
            setActiveTool(null);
          }
        }}
        title="Generate with AI"
        placeholder="Describe what you want to generate or edit..."
      />
      
      <GeneratedImageModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageDataUrl={generatedDataUrl}
        onSave={async () => {
          if (!generatedDataUrl || !apiClient) return;
          const res = await apiClient.saveGeneratedImage(generatedDataUrl);
          if (res.success) {
            setPreviewOpen(false);
            toast.success("Image saved successfully!");
          } else {
            toast.error(res.error || "Failed to save image");
          }
        }}
        onTryOn={() => {
          if (generatedDataUrl) {
            setTryOnGarmentUrl(generatedDataUrl);
            setShowTryOnModal(true);
          }
        }}
      />

      {/* Try-On Modal */}
      {tryOnGarmentUrl && (
        <TryOnModal
          isOpen={showTryOnModal}
          onClose={() => {
            setShowTryOnModal(false);
            setTryOnGarmentUrl(null);
          }}
          garmentImageUrl={tryOnGarmentUrl}
          onTryOnComplete={(resultUrl) => {
            addToGallery(resultUrl);
            toast.success("Virtual try-on completed! Added to gallery.");
          }}
        />
      )}

      {/* Welcome Modal - Shows on top of canvas */}
      <WelcomeStartModal
        isOpen={showStartOptions && !image}
        showSizeSelector={showSizeSelector}
        onOpenSizeSelector={() => setShowSizeSelector(true)}
        onCloseSizeSelector={() => setShowSizeSelector(false)}
        onClickUpload={() => fileInputRef.current?.click()}
        presetSizes={presetSizes}
        customWidth={customWidth}
        customHeight={customHeight}
        setCustomWidth={setCustomWidth}
        setCustomHeight={setCustomHeight}
        onCreateCustomSize={handleCustomSize}
        onSelectPreset={(w, h) => createBlankCanvas(w, h)}
      />
    </div>
  );
};