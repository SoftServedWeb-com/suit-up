// Core types for the annotation system

export interface Point {
    x: number;
    y: number;
    timestamp?: number;
  }
  
  export interface CanvasDimensions {
    width: number;
    height: number;
  }
  
  export interface DrawAnnotation {
    id: string;
    type: "draw";
    path: Point[];
    color: string;
    thickness: number;
    timestamp: number;
  }
  
  export interface ArrowAnnotation {
    id: string;
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    thickness: number;
    timestamp: number;
  }
  
  export interface TextAnnotation {
    id: string;
    type: "text";
    x: number;
    y: number;
    text: string;
    color: string;
    fontSize: number;
    timestamp: number;
  }
  
  export interface ImageAnnotation {
    id: string;
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    imageElement: HTMLImageElement;
    timestamp: number;
  }
  
  export interface MaskStroke {
    x: number;
    y: number;
    size: number;
  }
  
  export type Annotation =
    | DrawAnnotation
    | ArrowAnnotation
    | TextAnnotation
    | ImageAnnotation;
  
  export type ToolType =
    | "draw"
    | "arrow"
    | "text"
    | "image"
    | "mask"
    | "prompt"
    | null;
  
  export interface AnnotationState {
    annotations: Annotation[];
    maskStrokes: MaskStroke[];
    activeTool: ToolType;
    isDrawing: boolean;
    currentPath: Point[];
  }
  
  export interface AnnotationHistory {
    annotations: Annotation[];
    maskStrokes: MaskStroke[];
  }
  
// Generation request/response types
export interface GenerationRequest {
    imageData: string; // base64 encoded image
    maskData?: any[]; // mask strokes array for Nano Banana API
    prompt?: string;
    strength?: number; // 0-1, how much to change the image
    guidance?: number; // 1-20, how closely to follow the prompt
    steps?: number; // number of inference steps
    seed?: number; // for reproducible results
  }
  
  
  export interface GenerationResponse {
    success: boolean;
    result?: {
      output: string; // URL or base64 of generated image
      requestId?: string;
    };
    error?: string;
  }
  
  // Configuration types
  export interface AnnotationConfig {
    colors: {
      draw: string;
      arrow: string;
      text: string;
      mask: string;
    };
    defaultSizes: {
      drawThickness: number;
      arrowThickness: number;
      fontSize: number;
      brushSize: number;
    };
    canvas: {
      maxWidth: number;
      maxHeight: number;
      backgroundColor: string;
    };
  }

  
