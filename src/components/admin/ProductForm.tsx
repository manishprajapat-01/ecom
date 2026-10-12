"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import type { CatalogCategory, CatalogProduct } from "@/lib/data/sample-catalog";
import { formatCurrency } from "@/lib/utils";

interface ProductFormProps {
  product?: CatalogProduct;
}

interface SpecRow {
  key: string;
  value: string;
}

const inputClass =
  "w-full p-2.5 border rounded border-gray-300 bg-white text-xs focus:outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-blue-100";

function toRupees(paise?: number) {
  return paise === undefined ? "" : (paise / 100).toString();
}

/**
 * Shared Add / Edit product form for the admin panel.
 */
export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [title, setTitle] = useState(product?.title ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [regularPriceRupees, setRegularPriceRupees] = useState(toRupees(product?.regularPrice));
  const [sellingPriceRupees, setSellingPriceRupees] = useState(toRupees(product?.sellingPrice));
  const [stock, setStock] = useState(product ? String(product.stock) : "50");
  const [sku, setSku] = useState(() => product?.sku ?? `SKU-${Date.now().toString().slice(-6)}`);
  const [shortDesc, setShortDesc] = useState(product?.shortDesc ?? "");
  const [longDesc, setLongDesc] = useState(product?.longDesc ?? "");
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [images, setImages] = useState<UploadedImage[]>(
    product?.images.map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt, isPrimary: i.isPrimary })) ?? []
  );
  const [specs, setSpecs] = useState<SpecRow[]>(
    product ? Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value })) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: CatalogCategory[] = data.categories || [];
        setCategories(list);
        // Preselect the first active category for new products only
        setCategoryId((current) => current || list.find((c) => c.isActive !== false)?.id || "");
      })
      .catch(() => {
        if (!cancelled) setErrorMsg("Could not load categories");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const regPaise = Math.round(parseFloat(regularPriceRupees || "0") * 100);
  const sellPaise = Math.round(parseFloat(sellingPriceRupees || "0") * 100);
  const discount = useMemo(
    () => (regPaise > 0 && sellPaise < regPaise ? Math.round(((regPaise - sellPaise) / regPaise) * 100) : 0),
    [regPaise, sellPaise]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!categoryId) return setErrorMsg("Please choose a category.");
    if (!Number.isFinite(regPaise) || regPaise < 100) return setErrorMsg("Enter a valid regular price (min ₹1).");
    if (!Number.isFinite(sellPaise) || sellPaise < 100) return setErrorMsg("Enter a valid selling price (min ₹1).");
    if (sellPaise > regPaise) return setErrorMsg("Selling price cannot be higher than the regular price.");
    if (images.length === 0) return setErrorMsg("Add at least one product image.");

    const specifications: Record<string, string> = {};
    for (const row of specs) {
      if (row.key.trim() && row.value.trim()) specifications[row.key.trim()] = row.value.trim();
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brand,
          categoryId,
          regularPrice: regPaise,
          sellingPrice: sellPaise,
          stock: parseInt(stock, 10) || 0,
          sku,
          shortDesc,
          longDesc,
          specifications,
          isPublished,
          isFeatured,
          images: images.map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt || title, isPrimary: Boolean(i.isPrimary) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-medium">{errorMsg}</div>
      )}

      {/* Basic info */}
      <section className="space-y-3">
        <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-gray-700 mb-1">Product Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required minLength={3} placeholder="e.g. Sony WH-1000XM5 Wireless Headphones" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Brand *</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} required placeholder="e.g. Sony" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} required>
              {categories.length === 0 && <option value="">Loading categories...</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive === false ? " (hidden)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">SKU Code *</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className={`${inputClass} font-mono`} required minLength={3} />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Stock Quantity *</label>
            <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} required />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-3">
        <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Regular / MRP (₹) *</label>
            <input type="number" min={1} step="0.01" value={regularPriceRupees} onChange={(e) => setRegularPriceRupees(e.target.value)} className={inputClass} required placeholder="2999" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Selling Price (₹) *</label>
            <input type="number" min={1} step="0.01" value={sellingPriceRupees} onChange={(e) => setSellingPriceRupees(e.target.value)} className={inputClass} required placeholder="1999" />
          </div>
          <div className="flex flex-col justify-end">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
              <span className="font-bold">{discount}% off</span>
              {sellPaise > 0 && <span className="ml-2 text-emerald-700">Customer pays {formatCurrency(sellPaise)}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="space-y-3">
        <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Product Images (Cloudinary) *</h3>
        <ImageUploader images={images} onChange={setImages} />
      </section>

      {/* Descriptions */}
      <section className="space-y-3">
        <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Description</h3>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Short Description / Highlights</label>
          <input type="text" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className={inputClass} maxLength={300} placeholder="Key selling points shown on listing cards" />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Full Description</label>
          <textarea rows={5} value={longDesc} onChange={(e) => setLongDesc(e.target.value)} className={inputClass} placeholder="Detailed description" />
        </div>
      </section>

      {/* Specifications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Specifications</h3>
          <button
            type="button"
            onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])}
            className="flex items-center gap-1 text-[#2874f0] font-bold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
        </div>
        {specs.length === 0 && <p className="text-gray-400">No specifications yet (e.g. RAM → 8 GB, Colour → Black).</p>}
        <div className="space-y-2">
          {specs.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
              <input
                type="text"
                placeholder="Attribute (e.g. RAM)"
                value={row.key}
                onChange={(e) => setSpecs((s) => s.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Value (e.g. 8 GB)"
                value={row.value}
                onChange={(e) => setSpecs((s) => s.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))}
                className={inputClass}
              />
              <button type="button" onClick={() => setSpecs((s) => s.filter((_, i) => i !== idx))} className="p-2 text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Visibility */}
      <section className="flex flex-wrap gap-6 p-3 bg-gray-50 border border-gray-200 rounded">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded text-[#2874f0]" />
          <span className="font-semibold text-gray-800">Published (visible in store)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded text-[#2874f0]" />
          <span className="font-semibold text-gray-800">Featured (shown first in deals)</span>
        </label>
      </section>

      <div className="pt-4 flex justify-end gap-3 border-t">
        <button type="button" onClick={() => router.push("/admin/products")} className="px-5 py-2.5 border border-gray-300 font-bold rounded text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#2874f0] hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded shadow-xs flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Publish Product"}
        </button>
      </div>
    </form>
  );
}
