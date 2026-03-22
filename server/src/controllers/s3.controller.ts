import { Request, Response } from "express";
import { getUploadUrl, getDownloadUrl } from "../services/s3.service";
import { v4 as uuidV4 } from "uuid";

export const generateUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileType = "video/mp4" } = req.body;
    const key = `${uuidV4()}.${fileType.toString().split("/")[1]}`;

    const url = await getUploadUrl(key, fileType as string);

    res.status(200).json({ message: "Presigned upload url generated", key, url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Missing key" });
    }

    const url = await getDownloadUrl(key as string);

    res.status(200).json({ message: "Presigned download url generated", url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};