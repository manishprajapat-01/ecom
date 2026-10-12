import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "@/lib/services/cloudinary";
import { apiError } from "@/lib/api";

/**
 * Admin image upload → Cloudinary.
 * Accepts either multipart/form-data with a `file` field, or JSON `{ image: "data:image/...;base64,..." }`.
 */
export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const contentType = req.headers.get("content-type") || "";
    let dataUri: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Only JPG, PNG, WEBP, AVIF or GIF images are allowed" }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      const body = await req.json().catch(() => ({}));
      const image = typeof body.image === "string" ? body.image : "";
      if (!image.startsWith("data:image/")) {
        return NextResponse.json({ error: "Provide an image file or a data URI" }, { status: 400 });
      }
      // base64 expands by ~4/3 – enforce the same size budget
      if (image.length > MAX_UPLOAD_BYTES * 1.4) {
        return NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 400 });
      }
      dataUri = image;
    }

    const uploaded = await uploadToCloudinary(dataUri);
    return NextResponse.json({ success: true, ...uploaded });
  } catch (error) {
    return apiError(error, "Failed to upload image");
  }
}

/** Remove an uploaded image that is no longer referenced (e.g. removed from the form before saving). */
export async function DELETE(req: Request) {
  try {
    await requireAdminSession();
    const { publicId } = await req.json().catch(() => ({}));
    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }
    const ok = await deleteFromCloudinary(publicId);
    return NextResponse.json({ success: ok });
  } catch (error) {
    return apiError(error, "Failed to delete image");
  }
}
