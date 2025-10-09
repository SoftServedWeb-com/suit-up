import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./client";
import mime from "mime";

const BUCKET_NAME = process.env.TRIALROOM_AWS_S3_BUCKET_NAME!;

export async function uploadToS3(file: File, prefix: string): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}-${
    file.name
  }`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.type,
    })
  );

  return `https://${BUCKET_NAME}.s3.${
    process.env.TRIALROOM_AWS_REGION || "us-east-1"
  }.amazonaws.com/${fileName}`;
}

// Helper function to convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}


export async function saveBase64ToS3(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `canvas-result-${Date.now()}-${crypto.randomUUID()}.png`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `https://${BUCKET_NAME}.s3.${
    process.env.TRIALROOM_AWS_REGION || "us-east-1"
  }.amazonaws.com/${fileName}`;
}


// Helper function to save generated image to S3
export async function saveGeneratedImageToS3(base64Data: string, mimeType: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = mime.getExtension(mimeType) || 'png';
    const fileName = `generated-tryon-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    };
  
    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Return the public URL
      return `https://${BUCKET_NAME}.s3.${process.env.TRIALROOM_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("S3 upload error for generated image:", error);
      throw new Error("Failed to save generated image. Please try again.");
    }
  }
  