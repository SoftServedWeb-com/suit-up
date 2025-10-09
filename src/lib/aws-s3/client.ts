import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.TRIALROOM_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.TRIALROOM_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.TRIALROOM_AWS_SECRET_ACCESS_KEY!,
    },
  });
  
