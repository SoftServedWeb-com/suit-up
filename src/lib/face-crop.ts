// utils/face-crop.ts
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the MediaPipe Face Detector
 * This is a singleton - only initializes once
 */
export async function initializeFaceDetector(): Promise<void> {
  // Return existing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Return immediately if already initialized
  if (faceDetector) {
    return;
  }

  initializationPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      });
      
      console.log("Face detector initialized successfully");
    } catch (error) {
      console.error("Failed to initialize face detector:", error);
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Detect if an image contains a face
 */
export async function detectFace(imageElement: HTMLImageElement): Promise<boolean> {
  if (!faceDetector) {
    await initializeFaceDetector();
  }
  
  if (!faceDetector) {
    throw new Error("Face detector not initialized");
  }

  try {
    const detections = faceDetector.detect(imageElement);
    return detections.detections.length > 0;
  } catch (error) {
    console.error("Face detection failed:", error);
    return false;
  }
}

/**
 * Crop image from neck down if face is detected
 * @param imageElement - The image element to process
 * @param neckOffsetRatio - How far below the face to start the crop (0.3 = 30% of face height)
 * @returns Cropped image blob or null if no face detected
 */
export async function cropFromNeck(
  imageElement: HTMLImageElement,
  neckOffsetRatio: number = 0.3
): Promise<Blob | null> {
  if (!faceDetector) {
    await initializeFaceDetector();
  }
  
  if (!faceDetector) {
    throw new Error("Face detector not initialized");
  }

  try {
    const detections = faceDetector.detect(imageElement);
    
    if (detections.detections.length === 0) {
      console.log("No face detected in image");
      return null;
    }

    // Get the first detected face
    const face = detections.detections[0];
    const boundingBox = face.boundingBox;
    
    if (!boundingBox) {
      console.log("No bounding box found for detected face");
      return null;
    }

    // Calculate crop coordinates
    // MediaPipe returns normalized coordinates (0-1), so multiply by image dimensions
    const faceX = boundingBox.originX;
    const faceY = boundingBox.originY;
    const faceWidth = boundingBox.width;
    const faceHeight = boundingBox.height;
    
    // Calculate neck position (below the face bounding box)
    const neckY = faceY + faceHeight + (faceHeight * neckOffsetRatio);
    
    // Create canvas for cropping
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas size to the cropped area (from neck to bottom of image)
    const cropY = Math.min(neckY, 1) * imageElement.height;
    const cropHeight = imageElement.height - cropY;
    
    canvas.width = imageElement.width;
    canvas.height = cropHeight;
    
    // Draw the cropped portion
    ctx.drawImage(
      imageElement,
      0, cropY, // Source x, y
      imageElement.width, cropHeight, // Source width, height
      0, 0, // Destination x, y
      imageElement.width, cropHeight // Destination width, height
    );
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
    
  } catch (error) {
    console.error("Failed to crop image:", error);
    return null;
  }
}

/**
 * Process a File object: detect face and crop if needed
 * @param file - The image file to process
 * @param neckOffsetRatio - How far below the face to start the crop
 * @returns Object with processed file and metadata
 */
// utils/face-crop.ts - Update the processGarmentImage function with detailed logging:

export async function processGarmentImage(
  file: File,
  neckOffsetRatio: number = 0.3
): Promise<{
  file: File;
  hasFace: boolean;
  wasCropped: boolean;
}> {
  console.log("🎯 Starting processGarmentImage for file:", file.name, "size:", file.size);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      console.log("📖 File read successfully");
      const img = new Image();
      
      img.onload = async () => {
        console.log("🖼️ Image loaded:", img.width, "x", img.height);
        
        try {
          // Initialize detector if needed
          if (!faceDetector) {
            console.log("🔧 Face detector not ready, initializing...");
            await initializeFaceDetector();
          }
          
          // Check if image has a face
          console.log("🔍 Starting face detection...");
          const detections = faceDetector!.detect(img);
          console.log("✅ Face detection complete. Detections found:", detections.detections.length);
          
          if (detections.detections.length === 0) {
            console.log("❌ No face detected, returning original file");
            resolve({
              file,
              hasFace: false,
              wasCropped: false,
            });
            return;
          }
          
          // Get face bounding box
          const face = detections.detections[0];
          const boundingBox = face.boundingBox;
          console.log("📦 Face bounding box:", boundingBox);
          
          if (!boundingBox) {
            console.log("⚠️ No bounding box found, returning original");
            resolve({
              file,
              hasFace: true,
              wasCropped: false,
            });
            return;
          }
          
          // Calculate crop coordinates
          const faceY = boundingBox.originY;
          const faceHeight = boundingBox.height;
          const neckY = faceY + faceHeight + (faceHeight * neckOffsetRatio);
          const cropY = Math.min(neckY, 1) * img.height;
          const cropHeight = img.height - cropY;
          
          console.log("📐 Crop calculations:");
          console.log("  - Face Y:", faceY, "Face Height:", faceHeight);
          console.log("  - Neck Y:", neckY, "Offset ratio:", neckOffsetRatio);
          console.log("  - Crop Y (pixels):", cropY);
          console.log("  - Crop Height:", cropHeight);
          
          // Create canvas for cropping
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error("❌ Failed to get canvas context");
            throw new Error("Failed to get canvas context");
          }
          
          canvas.width = img.width;
          canvas.height = cropHeight;
          console.log("🎨 Canvas size set to:", canvas.width, "x", canvas.height);
          
          // Draw the cropped portion
          ctx.drawImage(
            img,
            0, cropY, // Source x, y
            img.width, cropHeight, // Source width, height
            0, 0, // Destination x, y
            img.width, cropHeight // Destination width, height
          );
          console.log("✂️ Image cropped and drawn to canvas");
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error("❌ Failed to create blob from canvas");
              resolve({
                file,
                hasFace: true,
                wasCropped: false,
              });
              return;
            }
            
            console.log("📦 Blob created, size:", blob.size);
            
            // Create new File from cropped blob
            const croppedFile = new File(
              [blob],
              `cropped_${file.name}`,
              { type: 'image/jpeg' }
            );
            
            console.log("✅ Cropped file created:", croppedFile.name, "size:", croppedFile.size);
            console.log("📊 Size comparison - Original:", file.size, "Cropped:", croppedFile.size);
            const urlNew = URL.createObjectURL(croppedFile);
            console.log("🔗 Cropped file URL:", urlNew);
            
            resolve({
              file: croppedFile,
              hasFace: true,
              wasCropped: true,
            });
          }, 'image/jpeg', 0.95);
          
        } catch (error) {
          console.error("❌ Error during processing:", error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error("❌ Failed to load image");
        reject(new Error("Failed to load image"));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      console.error("❌ Failed to read file");
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Process image from URL
 */
export async function processGarmentImageFromUrl(
  url: string,
  neckOffsetRatio: number = 0.3
): Promise<{
  blob: Blob | null;
  hasFace: boolean;
  wasCropped: boolean;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for CORS
    
    img.onload = async () => {
      try {
        const hasFace = await detectFace(img);
        
        if (!hasFace) {
          resolve({
            blob: null,
            hasFace: false,
            wasCropped: false,
          });
          return;
        }
        
        const croppedBlob = await cropFromNeck(img, neckOffsetRatio);
        
        resolve({
          blob: croppedBlob,
          hasFace: true,
          wasCropped: croppedBlob !== null,
        });
      } catch (error) {
        console.error("Error processing image from URL:", error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image from URL"));
    };
    
    img.src = url;
  });
}

/**
 * Clean up resources
 */
export function cleanup() {
  if (faceDetector) {
    faceDetector.close();
    faceDetector = null;
    initializationPromise = null;
  }
}