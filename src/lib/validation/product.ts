import { z } from "zod";

const ImageSchema = z.object({
  url: z.string().url("Image URL must be valid"),
  publicId: z.string().optional(),
  alt: z.string().max(160).optional(),
  isPrimary: z.boolean().optional(),
});

export const ProductInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    brand: z.string().trim().min(1, "Brand is required").max(80),
    categoryId: z.string().min(1).optional(),
    categorySlug: z.string().min(1).optional(),
    regularPrice: z.number().int("Price must be in paise").min(100, "Price must be at least ₹1"),
    sellingPrice: z.number().int("Price must be in paise").min(100, "Price must be at least ₹1"),
    stock: z.number().int().min(0).max(1_000_000),
    sku: z.string().trim().min(3, "SKU must be at least 3 characters").max(60),
    shortDesc: z.string().trim().max(300).optional(),
    longDesc: z.string().trim().max(10_000).optional(),
    specifications: z.record(z.string().max(80), z.string().max(500)).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(ImageSchema).max(8, "Up to 8 images are allowed").optional(),
  })
  .refine((d) => d.categoryId || d.categorySlug, { message: "Category is required", path: ["categoryId"] })
  .refine((d) => d.sellingPrice <= d.regularPrice, {
    message: "Selling price cannot exceed the regular (MRP) price",
    path: ["sellingPrice"],
  });

export const ProductUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  brand: z.string().trim().min(1).max(80).optional(),
  categoryId: z.string().min(1).optional(),
  categorySlug: z.string().min(1).optional(),
  regularPrice: z.number().int().min(100).optional(),
  sellingPrice: z.number().int().min(100).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  sku: z.string().trim().min(3).max(60).optional(),
  shortDesc: z.string().trim().max(300).optional(),
  longDesc: z.string().trim().max(10_000).optional(),
  specifications: z.record(z.string().max(80), z.string().max(500)).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(ImageSchema).max(8).optional(),
});

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  image: z.union([z.string().url(), z.literal("")]).optional(),
  icon: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});
