import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../configs/s3Client";


export const getUploadUrl = async (fileName: string, fileType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
    ContentType: fileType,
  });

  return await getSignedUrl(s3, command, { expiresIn: 300 });
};

export const getDownloadUrl = async (fileName: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
  });

  return await getSignedUrl(s3, command, { expiresIn: 600 });
};