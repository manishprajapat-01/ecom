"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2, Link as LinkIcon } from "lucide-react";

export interface UploadedImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}

/**
 * Multi-image uploader for products – uploads to Cloudinary via /api/admin/upload.
 * Also accepts a pasted https image URL for quick entry.
 */
export function ImageUploader({ images, onChange, max = 8 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const addImages = (next: UploadedImage[]) => {
    const merged = [...images, ...next].slice(0, max);
    if (!merged.some((i) => i.isPrimary) && merged.length) merged[0] = { ...merged[0], isPrimary: true };
    onChange(merged);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);

    const uploaded: UploadedImage[] = [];
    try {
      for (const file of Array.from(files).slice(0, max - images.length)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
        uploaded.push({ url: data.url, publicId: data.publicId, alt: file.name.replace(/\.[^.]+$/, "") });
      }
      addImages(uploaded);
    } catch (err) {
      setError((err as Error).message);
      if (uploaded.length) addImages(uploaded);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!/^https:\/\/.+/i.test(url)) {
      setError("Enter a valid https image URL");
      return;
    }
    setError(null);
    addImages([{ url }]);
    setUrlInput("");
  };

  const remove = async (index: number) => {
    const target = images[index];
    const next = images.filter((_, i) => i !== index);
    if (target.isPrimary && next.length) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
    if (target.publicId) {
      fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: target.publicId }),
      }).catch(() => {});
    }
  };

  const makePrimary = (index: number) => {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {images.map((img, idx) => (
          <div
            key={`${img.url}-${idx}`}
            className={`relative aspect-square bg-gray-50 border rounded overflow-hidden group ${
              img.isPrimary ? "border-[#2874f0] ring-2 ring-blue-100" : "border-gray-200"
            }`}
          >
            <Image src={img.url} alt={img.alt || "Product image"} fill sizes="120px" className="object-contain p-1" unoptimized={!img.url.includes("res.cloudinary.com")} />
            {img.isPrimary && (
              <span className="absolute top-1 left-1 bg-[#2874f0] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                PRIMARY
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-center gap-2 py-1 opacity-0 group-hover:opacity-100 transition">
              {!img.isPrimary && (
                <button type="button" onClick={() => makePrimary(idx)} title="Set as primary" className="text-yellow-300 hover:text-yellow-200">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={() => remove(idx)} title="Remove" className="text-red-300 hover:text-red-200">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square border-2 border-dashed border-gray-300 hover:border-[#2874f0] rounded flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#2874f0] transition disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-[10px] font-bold">{isUploading ? "Uploading..." : "Upload"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="url"
            placeholder="...or paste an https image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            className="w-full pl-8 pr-2 py-2 border rounded border-gray-300 text-xs focus:outline-none focus:border-[#2874f0]"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput || images.length >= max}
          className="px-3 py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Add URL
        </button>
      </div>

      <p className="text-[11px] text-gray-500">
        JPG, PNG, WEBP up to 5 MB each · {images.length}/{max} images · Hover an image to set it as primary or remove it.
      </p>
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}
