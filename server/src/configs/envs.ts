import dotenv from "dotenv";
dotenv.config();

const node_env = process.env.NODE_ENV;
const port = process.env.PORT;
const aws_access_key_id = process.env.AWS_ACCESS_KEY_ID;
const aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
const aws_region = process.env.AWS_REGION;
const aws_bucket_name = process.env.AWS_BUCKET_NAME;

if(!node_env) throw new Error("'NODE_ENV' is not defined in environment variables");
if(!port) throw new Error("'PORT' is not defined in environment variables");
if(!aws_access_key_id) throw new Error("'AWS_ACCESS_KEY_ID' is not defined in environment variables");
if(!aws_secret_access_key) throw new Error("'AWS_SECRET_ACCESS_KEY' is not defined in environment variables");
if(!aws_region) throw new Error("'AWS_REGION' is not defined in environment variables");
if(!aws_bucket_name) throw new Error("'AWS_BUCKET_NAME' is not defined in environment variables");

export const env = {
  node_env,
  port,
  aws_access_key_id,
  aws_secret_access_key,
  aws_region,
  aws_bucket_name
}