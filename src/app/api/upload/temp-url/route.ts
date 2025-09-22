import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.TRIALROOM_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.TRIALROOM_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TRIALROOM_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.TRIALROOM_AWS_S3_BUCKET_NAME!;

async function uploadToS3(file: File, prefix: string): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name || `upload.${mime.getExtension(file.type) || "bin"}`;
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.type,
    })
  );

  return `https://${BUCKET_NAME}.s3.${process.env.TRIALROOM_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
}

// POST /api/upload/temp-url
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const prefix = (form.get("prefix") as string) || "garment";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const url = await uploadToS3(file, prefix);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("temp-url upload error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Upload failed" }, { status: 500 });
  }
}


