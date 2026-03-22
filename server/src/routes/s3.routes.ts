import { Router } from "express";
import { generateUploadUrl, generateDownloadUrl } from "../controllers/s3.controller";

const router = Router();

/** @swagger
 * /api/s3/upload-url:
 *   get:
 *     summary: Generate a presigned upload URL
 *     parameters:
 *       - in: body
 *         name: fileType
 *         schema:
 *           type: string
 *         description: The type of the file to upload
 *     responses:
 *       200:
 *         description: A presigned upload URL
 *       500:
 *         description: Internal server error
 */
router.get("/upload-url", generateUploadUrl);
/** @swagger
 * /api/s3/download-url:
 *   get:
 *     summary: Generate a presigned download URL
 *     parameters:
 *       - in: body
 *         name: key
 *         schema:
 *           type: string
 *         description: The key of the file to download
 *     responses:
 *       200:
 *         description: A presigned download URL
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/download-url", generateDownloadUrl);

export { router as s3Router };