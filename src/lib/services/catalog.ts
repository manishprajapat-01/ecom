import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../api";
import { IS_NEXT_BUILD, IS_PRODUCTION } from "../config";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_PRODUCTS,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogProductImage,
} from "../data/sample-catalog";

export type { CatalogCategory, CatalogProduct, CatalogProductImage };

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  Catalog service – Neon PostgreSQL via Prisma.
 *
 *  Reads fall back to the bundled sample catalog ONLY in development when the
 *  database is unreachable (so the storefront can be previewed before Neon is
 *  configured). Writes (admin product management) always go to the database.
 * ───────────────────────────────────────────────────────────────────────────
 */

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

let warnedAboutFallback = false;
function devFallback<T>(err: unknown, value: T): T {
  if (IS_NEXT_BUILD) return value;
  if (IS_PRODUCTION && !IS_NEXT_BUILD) throw err;
  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[catalog] Database unreachable – serving bundled sample catalog (development only). " +
        "Set DATABASE_URL and run `npm run db:push && npm run db:seed`.",
      (err as Error)?.message
    );
  }
  return value;
}

function mapProduct(p: ProductWithRelations): CatalogProduct {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDesc: p.shortDesc || "",
    longDesc: p.longDesc || "",
    brand: p.brand,
    categoryId: p.categoryId,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    regularPrice: p.regularPrice,
    sellingPrice: p.sellingPrice,
    discountPercent: p.discountPercent,
    sku: p.sku,
    stock: p.stock,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    rating: p.rating,
    reviewCount: p.reviewCount,
    specifications: (p.specifications as Record<string, string>) || {},
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || p.title,
      isPrimary: img.isPrimary,
      publicId: img.publicId || undefined,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      attributes: (v.attributes as Record<string, string>) || {},
    })),
  };
}

function mapCategory(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  isActive?: boolean;
}): CatalogCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: c.image || "",
    iconName: c.icon || "ShoppingBag",
    sortOrder: c.sortOrder,
    isActive: c.isActive ?? true,
  };
}

export type ProductSort = "price_asc" | "price_desc" | "rating_desc" | "popular" | "newest";
export const PRODUCT_SORTS: ProductSort[] = ["price_asc", "price_desc", "rating_desc", "popular", "newest"];

/** Coerce an untrusted query-string value into a valid sort option. */
export function parseProductSort(value: string | undefined): ProductSort {
  return (PRODUCT_SORTS as string[]).includes(value ?? "") ? (value as ProductSort) : "popular";
}

export interface ProductFilters {
  categorySlug?: string;
  brand?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  minRating?: number;
  search?: string;
  sort?: ProductSort;
  limit?: number;
  page?: number;
  /** Admin listing: include unpublished products */
  includeUnpublished?: boolean;
}

// ───────────────────────────── Categories ─────────────────────────────────

export async function getCategories(options: { includeInactive?: boolean } = {}): Promise<CatalogCategory[]> {
  try {
    const cats = await prisma.category.findMany({
      where: options.includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return cats.map(mapCategory);
  } catch (err) {
    return devFallback(err, SAMPLE_CATEGORIES);
  }
}

export async function getCategoryBySlug(slug: string): Promise<CatalogCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<CatalogCategory> {
  const created = await prisma.category.create({
    data: {
      name: data.name.trim(),
      slug: slugify(data.slug || data.name),
      description: data.description?.trim() || null,
      image: data.image || null,
      icon: data.icon || "ShoppingBag",
      sortOrder: data.sortOrder ?? 100,
      isActive: data.isActive ?? true,
    },
  });
  return mapCategory(created);
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; description: string; image: string; icon: string; sortOrder: number; isActive: boolean }>
): Promise<CatalogCategory> {
  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.slug !== undefined ? { slug: slugify(data.slug) } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.icon !== undefined ? { icon: data.icon || "ShoppingBag" } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
  return mapCategory(updated);
}

export async function deleteCategory(id: string): Promise<{ deleted: boolean; archived: boolean }> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, archived: true };
  }
  await prisma.category.delete({ where: { id } });
  return { deleted: true, archived: false };
}

// ───────────────────────────── Products ───────────────────────────────────

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (!filters.includeUnpublished) where.isPublished = true;
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.brand) where.brand = { equals: filters.brand, mode: "insensitive" };
  if (filters.minPricePaise !== undefined || filters.maxPricePaise !== undefined) {
    where.sellingPrice = {
      ...(filters.minPricePaise !== undefined ? { gte: filters.minPricePaise } : {}),
      ...(filters.maxPricePaise !== undefined ? { lte: filters.maxPricePaise } : {}),
    };
  }
  if (filters.minRating !== undefined) where.rating = { gte: filters.minRating };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { shortDesc: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
      { category: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  return where;
}

function buildOrderBy(sort: ProductFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ sellingPrice: "asc" }];
    case "price_desc":
      return [{ sellingPrice: "desc" }];
    case "rating_desc":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "popular":
    default:
      return [{ isFeatured: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }];
  }
}

function filterSample(filters: ProductFilters): CatalogProduct[] {
  let list = SAMPLE_PRODUCTS.filter((p) => filters.includeUnpublished || p.isPublished);
  if (filters.categorySlug) list = list.filter((p) => p.categorySlug === filters.categorySlug);
  if (filters.brand) list = list.filter((p) => p.brand.toLowerCase() === filters.brand!.toLowerCase());
  if (filters.minPricePaise !== undefined) list = list.filter((p) => p.sellingPrice >= filters.minPricePaise!);
  if (filters.maxPricePaise !== undefined) list = list.filter((p) => p.sellingPrice <= filters.maxPricePaise!);
  if (filters.minRating !== undefined) list = list.filter((p) => p.rating >= filters.minRating!);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }
  const sorted = [...list];
  if (filters.sort === "price_asc") sorted.sort((a, b) => a.sellingPrice - b.sellingPrice);
  else if (filters.sort === "price_desc") sorted.sort((a, b) => b.sellingPrice - a.sellingPrice);
  else if (filters.sort === "rating_desc") sorted.sort((a, b) => b.rating - a.rating);
  else sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  return sorted;
}

export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: CatalogProduct[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 200);
  const page = Math.max(filters.page ?? 1, 1);

  try {
    const where = buildWhere(filters);
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: buildOrderBy(filters.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: productInclude,
      }),
    ]);
    return { products: items.map(mapProduct), total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  } catch (err) {
    const list = devFallback(err, filterSample(filters));
    const start = (page - 1) * limit;
    return {
      products: list.slice(start, start + limit),
      total: list.length,
      page,
      totalPages: Math.max(1, Math.ceil(list.length / limit)),
    };
  }
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const p = await prisma.product.findUnique({ where: { slug }, include: productInclude });
    return p ? mapProduct(p) : null;
  } catch (err) {
    return devFallback(err, SAMPLE_PRODUCTS.find((p) => p.slug === slug) || null);
  }
}

export async function getProductById(id: string): Promise<CatalogProduct | null> {
  try {
    const p = await prisma.product.findUnique({ where: { id }, include: productInclude });
    return p ? mapProduct(p) : null;
  } catch (err) {
    return devFallback(err, SAMPLE_PRODUCTS.find((p) => p.id === id) || null);
  }
}

export async function getFeaturedProducts(limit = 8): Promise<CatalogProduct[]> {
  const { products } = await getProducts({ limit, sort: "popular" });
  return products;
}

/** Distinct brands for the filter sidebar */
export async function getBrands(categorySlug?: string): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isPublished: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });
    return rows.map((r) => r.brand);
  } catch (err) {
    return devFallback(err, Array.from(new Set(SAMPLE_PRODUCTS.map((p) => p.brand))).sort());
  }
}

// ───────────────────────── Admin: product writes ──────────────────────────

export interface ProductWriteInput {
  title: string;
  slug?: string;
  brand: string;
  categoryId?: string;
  categorySlug?: string;
  regularPrice: number; // paise
  sellingPrice: number; // paise
  stock: number;
  sku: string;
  shortDesc?: string;
  longDesc?: string;
  specifications?: Record<string, string>;
  isPublished?: boolean;
  isFeatured?: boolean;
  images?: Array<{ url: string; publicId?: string; alt?: string; isPrimary?: boolean }>;
}

async function resolveCategoryId(input: { categoryId?: string; categorySlug?: string }): Promise<string> {
  if (input.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (cat) return cat.id;
  }
  if (input.categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
    if (cat) return cat.id;
  }
  throw new HttpError("Selected category does not exist.", 400);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || `product-${Date.now()}`;
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    const clash = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function discountPercent(regular: number, selling: number): number {
  if (regular <= 0 || selling >= regular) return 0;
  return Math.round(((regular - selling) / regular) * 100);
}

function normaliseImages(images: ProductWriteInput["images"], title: string) {
  const list = (images || []).filter((i) => i.url);
  if (list.length === 0) return [];
  const hasPrimary = list.some((i) => i.isPrimary);
  return list.map((img, idx) => ({
    url: img.url,
    publicId: img.publicId || null,
    alt: img.alt || title,
    isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
    sortOrder: idx,
  }));
}

export async function addProduct(input: ProductWriteInput): Promise<CatalogProduct> {
  if (input.sellingPrice > input.regularPrice) {
    throw new HttpError("Selling price cannot be higher than the regular (MRP) price.", 400);
  }
  const categoryId = await resolveCategoryId(input);
  const slug = await uniqueSlug(input.slug || input.title);

  const skuClash = await prisma.product.findUnique({ where: { sku: input.sku }, select: { id: true } });
  if (skuClash) throw new HttpError(`SKU '${input.sku}' is already in use.`, 409);

  const created = await prisma.product.create({
    data: {
      title: input.title.trim(),
      slug,
      shortDesc: input.shortDesc?.trim() || null,
      longDesc: input.longDesc?.trim() || null,
      brand: input.brand.trim(),
      categoryId,
      regularPrice: input.regularPrice,
      sellingPrice: input.sellingPrice,
      discountPercent: discountPercent(input.regularPrice, input.sellingPrice),
      sku: input.sku.trim(),
      stock: input.stock,
      isPublished: input.isPublished ?? true,
      isFeatured: input.isFeatured ?? false,
      specifications: (input.specifications || {}) as Prisma.InputJsonValue,
      images: { create: normaliseImages(input.images, input.title) },
      inventoryMoves: input.stock > 0 ? { create: { quantityChange: input.stock, reason: "INITIAL_STOCK" } } : undefined,
    },
    include: productInclude,
  });
  return mapProduct(created);
}

export async function updateProduct(id: string, input: Partial<ProductWriteInput>): Promise<CatalogProduct> {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existing) throw new HttpError("Product not found", 404);

  const regular = input.regularPrice ?? existing.regularPrice;
  const selling = input.sellingPrice ?? existing.sellingPrice;
  if (selling > regular) {
    throw new HttpError("Selling price cannot be higher than the regular (MRP) price.", 400);
  }

  const categoryId = input.categoryId || input.categorySlug ? await resolveCategoryId(input) : existing.categoryId;
  const slug = input.slug !== undefined || (input.title && input.title !== existing.title)
    ? await uniqueSlug(input.slug || input.title || existing.title, id)
    : existing.slug;

  if (input.sku && input.sku !== existing.sku) {
    const skuClash = await prisma.product.findUnique({ where: { sku: input.sku }, select: { id: true } });
    if (skuClash) throw new HttpError(`SKU '${input.sku}' is already in use.`, 409);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      const imgs = normaliseImages(input.images, input.title || existing.title);
      if (imgs.length) {
        await tx.productImage.createMany({ data: imgs.map((img) => ({ ...img, productId: id })) });
      }
    }

    if (input.stock !== undefined && input.stock !== existing.stock) {
      await tx.inventoryMovement.create({
        data: { productId: id, quantityChange: input.stock - existing.stock, reason: "ADJUSTMENT", referenceId: "admin-edit" },
      });
    }

    return tx.product.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        slug,
        ...(input.shortDesc !== undefined ? { shortDesc: input.shortDesc.trim() || null } : {}),
        ...(input.longDesc !== undefined ? { longDesc: input.longDesc.trim() || null } : {}),
        ...(input.brand !== undefined ? { brand: input.brand.trim() } : {}),
        categoryId,
        regularPrice: regular,
        sellingPrice: selling,
        discountPercent: discountPercent(regular, selling),
        ...(input.sku !== undefined ? { sku: input.sku.trim() } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
        ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
        ...(input.specifications !== undefined ? { specifications: input.specifications as Prisma.InputJsonValue } : {}),
      },
      include: productInclude,
    });
  });

  return mapProduct(updated);
}

/**
 * Delete a product. Products that appear in past orders are archived (unpublished,
 * stock zeroed) instead, to preserve order history.
 */
export async function deleteProduct(id: string): Promise<{ deleted: boolean; archived: boolean; imagePublicIds: string[] }> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true, _count: { select: { orderItems: true } } },
  });
  if (!existing) throw new HttpError("Product not found", 404);

  const imagePublicIds = existing.images.map((i) => i.publicId).filter((p): p is string => Boolean(p));

  if (existing._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { isPublished: false, isFeatured: false, stock: 0 } });
    return { deleted: false, archived: true, imagePublicIds: [] };
  }

  await prisma.product.delete({ where: { id } });
  return { deleted: true, archived: false, imagePublicIds };
}
