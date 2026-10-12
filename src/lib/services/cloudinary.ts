import { v2 as cloudinary } from "cloudinary";
import { IS_PRODUCTION } from "../config";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export const PRODUCT_IMAGE_FOLDER = "bharat_bazaar/products";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Upload an image (data URI or https URL) to Cloudinary.
 * Images are optimised (auto quality / format) and capped at 1600px on the long edge.
 */
export async function uploadToCloudinary(
  dataUriOrUrl: string,
  folder = PRODUCT_IMAGE_FOLDER
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    if (IS_PRODUCTION) {
      throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
    }
    // Development placeholder so the admin UI can be exercised without credentials.
    return {
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      publicId: `${folder}/dev_placeholder_${Date.now()}`,
      width: 800,
      height: 800,
      format: "jpg",
    };
  }

  const result = await cloudinary.uploader.upload(dataUriOrUrl, {
    folder,
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
    transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto", fetch_format: "auto" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete an asset from Cloudinary (no-op when not configured).
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured || !publicId) return true;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}
