"use client";

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

export default function ImageCropper() {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null
  );
  const [cropperInitialized, setCropperInitialized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  useEffect(() => {
    const createFaceLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/models/blaze_face_short_range.tflite`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1,
      });
      setFaceLandmarker(landmarker);
      setCropperInitialized(true);
    };
    createFaceLandmarker();
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const image = new Image();
        image.src = e.target?.result as string;
        image.onload = async () => {
          if (faceLandmarker) {
            const landmarks = faceLandmarker.detect(image);
            if (landmarks.faceLandmarks.length > 0) {
              const face = landmarks.faceLandmarks[0];

              // Key landmarks for cropping from the neck
              const chin = face[175]; // A good point on the chin
              const leftJaw = face[172];
              const rightJaw = face[397];

              const nose = face[1];

              // Calculate the crop box
              const faceWidth = Math.abs(leftJaw.x - rightJaw.x) * image.width;
              const cropX =
                Math.min(leftJaw.x, rightJaw.x) * image.width - faceWidth * 0.2;
              const cropY = nose.y * image.height - faceWidth * 0.5;
              const cropWidth = faceWidth * 1.4;
              const cropHeight = (chin.y - nose.y) * image.height + faceWidth;

              // Crop the image
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(
                    image,
                    cropX,
                    cropY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight
                  );
                  setCroppedImage(canvas.toDataURL("image/png"));
                }
              }
            }
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {cropperInitialized ? (
        <p>Image cropper is ready.</p>
      ) : (
        <p>Initializing image cropper...</p>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {croppedImage && (
        <div>
          <h2>Cropped Image</h2>
          <img src={croppedImage} alt="Cropped face" />
        </div>
      )}
    </div>
  );
}