import { useState, useCallback, useRef } from "react";
import type {
  Annotation,
  AnnotationHistory,
  MaskStroke,
  Point,
  ToolType,
  DrawAnnotation,
  ArrowAnnotation,
  TextAnnotation,
  ImageAnnotation,
} from "@/components/canvas-studio/annotation-types";
import { generateId } from "@/components/canvas-studio/utils";


interface UseAnnotationsProps {
  maxHistorySize?: number;
}

export const useAnnotations = ({
  maxHistorySize = 50,
}: UseAnnotationsProps = {}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [maskStrokes, setMaskStrokes] = useState<MaskStroke[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // History management
  const [history, setHistory] = useState<AnnotationHistory[]>([
    { annotations: [], maskStrokes: [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selection states
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<
    "annotation" | "arrow-start" | "arrow-end" | "image-resize-tl" | "image-resize-tr" | "image-resize-bl" | "image-resize-br" | null
  >(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [initialImageDimensions, setInitialImageDimensions] = useState<{ width: number; height: number; x: number; y: number }>({ width: 0, height: 0, x: 0, y: 0 });

  // Refs for drawing state
  const startPos = useRef<Point>({ x: 0, y: 0 });
  const currentMousePos = useRef<Point>({ x: 0, y: 0 });

  // Add to history
  const addToHistory = useCallback(
    (newAnnotations: Annotation[], newMaskStrokes: MaskStroke[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          annotations: [...newAnnotations],
          maskStrokes: [...newMaskStrokes],
        });

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    },
    [historyIndex, maxHistorySize]
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setAnnotations(state.annotations);
      setMaskStrokes(state.maskStrokes);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setAnnotations(state.annotations);
      setMaskStrokes(state.maskStrokes);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Clear all annotations
  const clearAll = useCallback(() => {
    setAnnotations([]);
    setMaskStrokes([]);
    setCurrentPath([]);
    setSelectedAnnotationId(null);
    addToHistory([], []);
  }, [addToHistory]);

  // Add draw annotation
  const addDrawAnnotation = useCallback(
    (path: Point[], color: string, thickness: number) => {
      if (path.length < 2) return;

      const annotation: DrawAnnotation = {
        id: generateId(),
        type: "draw",
        path,
        color,
        thickness,
        timestamp: Date.now(),
      };

      const newAnnotations = [...annotations, annotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Add arrow annotation
  const addArrowAnnotation = useCallback(
    (start: Point, end: Point, color: string, thickness: number) => {
      const annotation: ArrowAnnotation = {
        id: generateId(),
        type: "arrow",
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        color,
        thickness,
        timestamp: Date.now(),
      };

      const newAnnotations = [...annotations, annotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Add text annotation
  const addTextAnnotation = useCallback(
    (x: number, y: number, text: string, color: string, fontSize: number) => {
      const annotation: TextAnnotation = {
        id: generateId(),
        type: "text",
        x,
        y,
        text,
        color,
        fontSize,
        timestamp: Date.now(),
      };

      const newAnnotations = [...annotations, annotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Add image annotation
  const addImageAnnotation = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      imageElement: HTMLImageElement,
      rotation: number = 0
    ) => {
      const annotation: ImageAnnotation = {
        id: generateId(),
        type: "image",
        x,
        y,
        width,
        height,
        rotation,
        imageElement,
        timestamp: Date.now(),
      };

      const newAnnotations = [...annotations, annotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Update text annotation
  const updateTextAnnotation = useCallback(
    (id: string, updates: Partial<TextAnnotation>) => {
      const newAnnotations = annotations.map((ann) =>
        ann.id === id && ann.type === "text" ? { ...ann, ...updates } : ann
      );
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Delete annotation
  const deleteAnnotation = useCallback(
    (id: string) => {
      const newAnnotations = annotations.filter((ann) => ann.id !== id);
      setAnnotations(newAnnotations);
      setSelectedAnnotationId(null);
      addToHistory(newAnnotations, maskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Add mask strokes
  const addMaskStrokes = useCallback(
    (strokes: MaskStroke[]) => {
      const newMaskStrokes = [...maskStrokes, ...strokes];
      setMaskStrokes(newMaskStrokes);
      addToHistory(annotations, newMaskStrokes);
    },
    [annotations, maskStrokes, addToHistory]
  );

  // Clear mask strokes
  const clearMaskStrokes = useCallback(() => {
    setMaskStrokes([]);
    addToHistory(annotations, []);
  }, [annotations, addToHistory]);

  // Check if point is inside text annotation
  const getClickedTextAnnotation = useCallback(
    (point: Point, textAnnotations: Annotation[]) => {
      for (let i = textAnnotations.length - 1; i >= 0; i--) {
        const ann = textAnnotations[i];
        if (ann.type === "text") {
          const textAnn = ann as TextAnnotation;
          // Simple bounding box check - approximate text dimensions
          const textWidth = textAnn.text.length * textAnn.fontSize * 0.6; // Rough estimate
          const textHeight = textAnn.fontSize;

          if (
            point.x >= textAnn.x - 5 &&
            point.x <= textAnn.x + textWidth + 5 &&
            point.y >= textAnn.y - textHeight &&
            point.y <= textAnn.y + 5
          ) {
            return { annotation: textAnn, index: i };
          }
        }
      }
      return null;
    },
    []
  );

  // Check if point is near arrow endpoints
  const getClickedArrowInfo = useCallback(
    (point: Point, arrowAnnotations: Annotation[]) => {
      const tolerance = 15; // Click tolerance in pixels

      for (let i = arrowAnnotations.length - 1; i >= 0; i--) {
        const ann = arrowAnnotations[i];
        if (ann.type === "arrow") {
          const arrowAnn = ann as ArrowAnnotation;

          // Check start point
          const startDist = Math.sqrt(
            Math.pow(point.x - arrowAnn.startX, 2) +
              Math.pow(point.y - arrowAnn.startY, 2)
          );
          if (startDist <= tolerance) {
            return {
              annotation: arrowAnn,
              index: i,
              dragType: "arrow-start" as const,
            };
          }

          // Check end point
          const endDist = Math.sqrt(
            Math.pow(point.x - arrowAnn.endX, 2) +
              Math.pow(point.y - arrowAnn.endY, 2)
          );
          if (endDist <= tolerance) {
            return {
              annotation: arrowAnn,
              index: i,
              dragType: "arrow-end" as const,
            };
          }

          // Check line (for moving whole arrow)
          const lineDistance = distanceFromPointToLine(
            point,
            { x: arrowAnn.startX, y: arrowAnn.startY },
            { x: arrowAnn.endX, y: arrowAnn.endY }
          );
          if (lineDistance <= tolerance) {
            return {
              annotation: arrowAnn,
              index: i,
              dragType: "annotation" as const,
            };
          }
        }
      }
      return null;
    },
    []
  );

  // Check if point is inside image annotation or on resize handles
  const getClickedImageAnnotation = useCallback(
    (point: Point, imageAnnotations: Annotation[]) => {
      const handleSize = 12; // Size of resize handles
      const handleTolerance = 6; // Extra pixels for easier clicking

      for (let i = imageAnnotations.length - 1; i >= 0; i--) {
        const ann = imageAnnotations[i];
        if (ann.type === "image") {
          const imgAnn = ann as ImageAnnotation;

          // Check resize handles for selected images
          if (ann.id === selectedAnnotationId) {
            // Top-left handle
            if (
              Math.abs(point.x - imgAnn.x) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - imgAnn.y) <= handleSize / 2 + handleTolerance
            ) {
              return { annotation: imgAnn, index: i, dragType: "image-resize-tl" as const };
            }

            // Top-right handle
            if (
              Math.abs(point.x - (imgAnn.x + imgAnn.width)) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - imgAnn.y) <= handleSize / 2 + handleTolerance
            ) {
              return { annotation: imgAnn, index: i, dragType: "image-resize-tr" as const };
            }

            // Bottom-left handle
            if (
              Math.abs(point.x - imgAnn.x) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - (imgAnn.y + imgAnn.height)) <= handleSize / 2 + handleTolerance
            ) {
              return { annotation: imgAnn, index: i, dragType: "image-resize-bl" as const };
            }

            // Bottom-right handle
            if (
              Math.abs(point.x - (imgAnn.x + imgAnn.width)) <= handleSize / 2 + handleTolerance &&
              Math.abs(point.y - (imgAnn.y + imgAnn.height)) <= handleSize / 2 + handleTolerance
            ) {
              return { annotation: imgAnn, index: i, dragType: "image-resize-br" as const };
            }
          }

          // Check if point is inside image (for moving)
          if (
            point.x >= imgAnn.x &&
            point.x <= imgAnn.x + imgAnn.width &&
            point.y >= imgAnn.y &&
            point.y <= imgAnn.y + imgAnn.height
          ) {
            return { annotation: imgAnn, index: i, dragType: "annotation" as const };
          }
        }
      }
      return null;
    },
    [selectedAnnotationId]
  );

  // Helper function for line distance calculation
  const distanceFromPointToLine = (
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  // Start dragging annotation
  const startDragging = useCallback(
    (point: Point) => {
      // Check for text annotations first
      const textResult = getClickedTextAnnotation(point, annotations);
      if (textResult) {
        setSelectedAnnotationId(textResult.annotation.id);
        setIsDragging(true);
        setDragType("annotation");
        setDragOffset({
          x: point.x - textResult.annotation.x,
          y: point.y - textResult.annotation.y,
        });
        return true;
      }

      // Check for arrow annotations
      const arrowResult = getClickedArrowInfo(point, annotations);
      if (arrowResult) {
        setSelectedAnnotationId(arrowResult.annotation.id);
        setIsDragging(true);
        setDragType(arrowResult.dragType);

        if (arrowResult.dragType === "arrow-start") {
          setDragOffset({ x: 0, y: 0 });
        } else if (arrowResult.dragType === "arrow-end") {
          setDragOffset({ x: 0, y: 0 });
        } else {
          // Whole arrow dragging
          const centerX =
            (arrowResult.annotation.startX + arrowResult.annotation.endX) / 2;
          const centerY =
            (arrowResult.annotation.startY + arrowResult.annotation.endY) / 2;
          setDragOffset({
            x: point.x - centerX,
            y: point.y - centerY,
          });
        }
        return true;
      }

      // Check for image annotations
      const imageResult = getClickedImageAnnotation(point, annotations);
      if (imageResult) {
        setSelectedAnnotationId(imageResult.annotation.id);
        setIsDragging(true);
        setDragType(imageResult.dragType);
        
        if (imageResult.dragType === "annotation") {
          // Moving the image
          setDragOffset({
            x: point.x - imageResult.annotation.x,
            y: point.y - imageResult.annotation.y,
          });
        } else {
          // Resizing the image - store initial dimensions
          setInitialImageDimensions({
            width: imageResult.annotation.width,
            height: imageResult.annotation.height,
            x: imageResult.annotation.x,
            y: imageResult.annotation.y,
          });
          setDragOffset({ x: point.x, y: point.y }); // Store initial click position
        }
        return true;
      }

      return false;
    },
    [
      annotations,
      getClickedTextAnnotation,
      getClickedArrowInfo,
      getClickedImageAnnotation,
    ]
  );

  // Continue dragging
  const continueDragging = useCallback(
    (point: Point) => {
      if (!isDragging || !selectedAnnotationId) return;

      const newAnnotations = annotations.map((ann) => {
        if (ann.id !== selectedAnnotationId) return ann;

        if (ann.type === "text") {
          return {
            ...ann,
            x: point.x - dragOffset.x,
            y: point.y - dragOffset.y,
          };
        } else if (ann.type === "arrow") {
          const arrowAnn = ann as ArrowAnnotation;

          if (dragType === "arrow-start") {
            return {
              ...arrowAnn,
              startX: point.x,
              startY: point.y,
            };
          } else if (dragType === "arrow-end") {
            return {
              ...arrowAnn,
              endX: point.x,
              endY: point.y,
            };
          } else {
            // Move whole arrow
            const deltaX =
              point.x - dragOffset.x - (arrowAnn.startX + arrowAnn.endX) / 2;
            const deltaY =
              point.y - dragOffset.y - (arrowAnn.startY + arrowAnn.endY) / 2;

            return {
              ...arrowAnn,
              startX: arrowAnn.startX + deltaX,
              startY: arrowAnn.startY + deltaY,
              endX: arrowAnn.endX + deltaX,
              endY: arrowAnn.endY + deltaY,
            };
          }
        } else if (ann.type === "image") {
          const imgAnn = ann as ImageAnnotation;
          
          // Handle resizing
          if (dragType?.startsWith("image-resize-")) {
            const minSize = 20; // Minimum image size
            let newX = imgAnn.x;
            let newY = imgAnn.y;
            let newWidth = imgAnn.width;
            let newHeight = imgAnn.height;
            
            const deltaX = point.x - dragOffset.x;
            const deltaY = point.y - dragOffset.y;
            
            // Maintain aspect ratio
            const aspectRatio = initialImageDimensions.width / initialImageDimensions.height;
            
            if (dragType === "image-resize-tl") {
              // Top-left: resize from top-left corner
              newWidth = Math.max(minSize, initialImageDimensions.width - deltaX);
              newHeight = newWidth / aspectRatio;
              newX = initialImageDimensions.x + initialImageDimensions.width - newWidth;
              newY = initialImageDimensions.y + initialImageDimensions.height - newHeight;
            } else if (dragType === "image-resize-tr") {
              // Top-right: resize from top-right corner
              newWidth = Math.max(minSize, initialImageDimensions.width + deltaX);
              newHeight = newWidth / aspectRatio;
              newY = initialImageDimensions.y + initialImageDimensions.height - newHeight;
            } else if (dragType === "image-resize-bl") {
              // Bottom-left: resize from bottom-left corner
              newWidth = Math.max(minSize, initialImageDimensions.width - deltaX);
              newHeight = newWidth / aspectRatio;
              newX = initialImageDimensions.x + initialImageDimensions.width - newWidth;
            } else if (dragType === "image-resize-br") {
              // Bottom-right: resize from bottom-right corner
              newWidth = Math.max(minSize, initialImageDimensions.width + deltaX);
              newHeight = newWidth / aspectRatio;
            }
            
            return {
              ...imgAnn,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            };
          }
          
          // Handle moving
          return {
            ...ann,
            x: point.x - dragOffset.x,
            y: point.y - dragOffset.y,
          };
        }

        return ann;
      });

      setAnnotations(newAnnotations);
    },
    [isDragging, selectedAnnotationId, annotations, dragOffset, dragType, initialImageDimensions]
  );

  // Stop dragging
  const stopDragging = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragType(null);
      addToHistory(annotations, maskStrokes);
    }
  }, [isDragging, annotations, maskStrokes, addToHistory]);

  // Start drawing
  const startDrawing = useCallback((point: Point) => {
    setIsDrawing(true);
    setCurrentPath([point]);
    startPos.current = point;
    currentMousePos.current = point;
  }, []);

  // Continue drawing
  const continueDrawing = useCallback(
    (point: Point) => {
      if (!isDrawing) return;

      currentMousePos.current = point;

      if (activeTool === "draw" || activeTool === "mask") {
        setCurrentPath((prev) => [...prev, point]);
      }
    },
    [isDrawing, activeTool]
  );

  // End drawing
  const endDrawing = useCallback(
    (point: Point, color: string, thickness: number) => {
      if (!isDrawing) return;

      setIsDrawing(false);
      currentMousePos.current = point;

      if (activeTool === "draw" && currentPath.length > 1) {
        addDrawAnnotation(currentPath, color, thickness);
      } else if (activeTool === "arrow") {
        addArrowAnnotation(startPos.current, point, color, thickness);
      } else if (activeTool === "mask" && currentPath.length > 0) {
        const strokes: MaskStroke[] = currentPath.map((p) => ({
          x: p.x,
          y: p.y,
          size: thickness,
        }));
        addMaskStrokes(strokes);
      }

      setCurrentPath([]);
    },
    [
      isDrawing,
      activeTool,
      currentPath,
      addDrawAnnotation,
      addArrowAnnotation,
      addMaskStrokes,
    ]
  );

  return {
    // State
    annotations,
    maskStrokes,
    activeTool,
    isDrawing,
    currentPath,
    selectedAnnotationId,
    isDragging,
    dragType,

    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Drawing state
    startPos: startPos.current,
    currentMousePos: currentMousePos.current,

    // Actions
    setActiveTool,
    setSelectedAnnotationId,
    startDrawing,
    continueDrawing,
    endDrawing,

    // Annotation management
    addTextAnnotation,
    addImageAnnotation,
    updateTextAnnotation,
    deleteAnnotation,
    clearAll,

    // Dragging
    startDragging,
    continueDragging,
    stopDragging,

    // Mask management
    clearMaskStrokes,

    // History
    undo,
    redo,
  };
};
