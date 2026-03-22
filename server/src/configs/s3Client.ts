import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../configs/envs";

export const s3 = new S3Client({
  region: env.aws_region,
  credentials: {
    accessKeyId: env.aws_access_key_id,
    secretAccessKey: env.aws_secret_access_key,
  },
});