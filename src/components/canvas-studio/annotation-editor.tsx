'use client'

import React, { useState, useRef, useCallback } from "react";
import { Square, Home } from "lucide-react";
import { useAnnotations } from "@/lib/hooks";
import { AnnotationCanvas } from "./canvas";
import { DrawingToolbar, PropertiesPanel } from "./toolbars";
import { TextInputModal, PromptInputModal, GeneratedImageModal } from "./modals";
import {
  loadImage,
  calculateCanvasDimensions,
  canvasToDataURL,
} from "./utils";
import WelcomeStartModal from "./WelcomeStartModal";
import GeneratedGallery from "./GeneratedGallery";
import MaskPromptBar from "./MaskPromptBar";
import MainActionsToolbar from "./MainActionsToolbar";

import type { AnnotationConfig, GenerationRequest } from "./annotation-types";

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

  const addToGallery = (dataUrl: string) => {
    setGallery((prev) => {
      const next = [dataUrl, ...prev].slice(0, 24);
      try {
        window.localStorage.setItem("canvas_generated_gallery", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);
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

      if (
        activeTool === "draw" ||
        activeTool === "arrow" ||
        activeTool === "mask"
      ) {
        startDrawing(point);
      }
    },
    [
      activeTool,
      annotations,
      selectedAnnotationId,
      startDragging,
      startDrawing,
      stopDragging,
    ]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);
      const point = { x, y, timestamp: Date.now() };

      if (isDragging) {
        continueDragging(point);
        return;
      }

      if (isDrawing) {
        continueDrawing(point);
        return;
      }
    },
    [isDrawing, isDragging, continueDrawing, continueDragging]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);
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
    [isDrawing, isDragging, activeTool, colors, sizes, endDrawing, stopDragging]
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
        } else {
          throw new Error(response.error?.message || "Generation failed");
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
    <div className={`relative h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 overflow-hidden ${className}`}>
      {/* Top Left - Home Button & Canvas Info (only show when canvas is active) */}
      {image && (
        <div className="fixed top-6 left-6 z-30 space-y-3">
          <button
            onClick={() => {
              if (window.confirm("Go back to start? Any unsaved work will be lost.")) {
                setShowStartOptions(true);
                setImage(null);
                clearAll();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xl border border-slate-300 rounded-xl hover:bg-white transition-all duration-200 shadow-lg text-slate-700 hover:text-slate-900 font-medium text-sm"
            title="Back to start"
          >
            <Home size={16} />
            <span>Home</span>
          </button>
          
          {/* Canvas Dimensions Indicator */}
          <div className="px-3 py-2 bg-white/90 backdrop-blur-xl border border-slate-300 rounded-xl shadow-lg">
            <p className="text-xs text-slate-600 font-medium">
              Canvas: {dimensions.width} × {dimensions.height}px
            </p>
          </div>
        </div>
      )}

      {/* Full Screen Canvas */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {image ? (
          <div
            className="relative w-full max-h-full flex items-center justify-center"
            style={{ maxWidth: `min(100%, ${config.canvas.maxWidth}px)` }}
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
              className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 pointer-events-none">
            <Square size={80} className="mb-4 opacity-20" strokeWidth={1} />
            <p className="text-sm font-medium opacity-40">Your canvas will appear here</p>
          </div>
        )}
      </div>

      {/* Left Overlay - Drawing Toolbar (only show when canvas is active) */}
      {image && (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="space-y-4">
            <DrawingToolbar
              activeTool={activeTool}
              onToolSelect={(tool) => {
                if (tool === activeTool) {
                  setActiveTool(null);
                  if (tool === "mask") {
                    setMaskPrompt("");
                  }
                } else {
                  setActiveTool(tool);
                }
              }}
              isMaskToolActive={activeTool === "mask"}
              isGenerating={isGenerating}
              className="bg-white/90 backdrop-blur-xl border-slate-300"
            />

            <PropertiesPanel
              activeTool={activeTool}
              colors={colors}
              sizes={sizes}
              onColorChange={handleColorChange}
              onSizeChange={handleSizeChange}
              className="bg-white/90 backdrop-blur-xl border-slate-300"
            />
          </div>
        </div>
      )}

      {/* Right Overlay - Gallery (only show when canvas is active) */}
      <GeneratedGallery
        isVisible={!!image}
        gallery={gallery}
        onUseImage={(img) => {
          // Recompute to respect max width while preserving aspect ratio
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
        }}
        onView={(url) => { setGeneratedDataUrl(url); setPreviewOpen(true); }}
        onClearAll={() => { setGallery([]); try { window.localStorage.removeItem("canvas_generated_gallery"); } catch {} }}
      />

      {/* Bottom Toolbar - Main Actions (only show when canvas is active) */}
      <MainActionsToolbar
        isVisible={!!image}
        canUndo={canUndo}
        canRedo={canRedo}
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
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
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
              alert(`Demo Mode: Would generate with mask prompt: "${maskPrompt}"`);
            }
          } else {
            if (apiClient) {
              setShowPromptModal(true);
            } else {
              alert("Demo Mode: Would open prompt modal for AI generation");
            }
          }
        }}
      />

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
            alert(`Demo Mode: Would generate with prompt: "${prompt}"`);
            setShowPromptModal(false);
            setActiveTool(null);
          }
        }}
        title="Generate with AI"
        placeholder="Describe what you want to generate or edit..."
      />

      {/* Mask Prompt Modal */}
      <MaskPromptBar
        isActive={activeTool === "mask"}
        maskStrokesCount={maskStrokes.length}
        maskPrompt={maskPrompt}
        setMaskPrompt={setMaskPrompt}
        onSubmit={() => {
          if (apiClient) {
            handleGenerate(maskPrompt);
          } else {
            alert(`Demo Mode: Would generate with mask prompt: "${maskPrompt}"`);
          }
        }}
        onClear={() => { clearMaskStrokes(); setMaskPrompt(""); }}
        onCancel={() => { setActiveTool(null); setMaskPrompt(""); clearMaskStrokes(); }}
        isApiAvailable={!!apiClient}
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
          }
        }}
      />

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