"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, Pencil, Search, CheckCircle, EyeOff, Loader2, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/data/sample-catalog";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setProducts(data.products || []);
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (product: CatalogProduct) => {
    if (!confirm(`Delete "${product.title}"?`)) return;
    setBusyId(product.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      setNotice({ type: "success", text: data.message });
      await loadProducts();
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const togglePublished = async (product: CatalogProduct) => {
    setBusyId(product.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !product.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p)));
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const q = search.toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {products.length} products total · {products.filter((p) => p.isPublished).length} published in store
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {notice && (
        <div
          className={`p-4 border text-xs rounded-xl font-medium ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search catalog by title, brand, SKU or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-x-auto text-xs p-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading products...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {products.length === 0 ? "No products yet. Add your first product." : "No products match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((prod) => (
                <tr key={prod.id} className={`hover:bg-gray-50 ${!prod.isPublished ? "opacity-70" : ""}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative bg-gray-50 border rounded p-1 shrink-0">
                        {prod.images[0]?.url && (
                          <Image src={prod.images[0].url} alt={prod.title} fill sizes="40px" className="object-contain" />
                        )}
                      </div>
                      <div className="max-w-xs min-w-0">
                        <p className="font-semibold text-gray-900 truncate flex items-center gap-1">
                          {prod.isFeatured && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                          {prod.title}
                        </p>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{prod.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{prod.categoryName}</td>
                  <td className="p-3 font-mono text-[11px] text-gray-600">{prod.sku}</td>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{formatCurrency(prod.sellingPrice)}</p>
                    {prod.discountPercent > 0 && (
                      <p className="text-[10px] text-gray-400">
                        <span className="line-through">{formatCurrency(prod.regularPrice)}</span>{" "}
                        <span className="text-emerald-700 font-bold">{prod.discountPercent}% off</span>
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${prod.stock === 0 ? "text-red-600" : prod.stock <= 15 ? "text-amber-600" : "text-emerald-700"}`}>
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => togglePublished(prod)}
                      disabled={busyId === prod.id}
                      title="Toggle visibility"
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border transition disabled:opacity-50 ${
                        prod.isPublished
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          : "text-gray-600 bg-gray-100 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {prod.isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {prod.isPublished ? "Published" : "Hidden"}
                    </button>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/products/${prod.id}/edit`}
                      className="inline-flex p-1.5 text-gray-400 hover:text-[#2874f0] transition"
                      title="Edit product"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(prod)}
                      disabled={busyId === prod.id}
                      className="inline-flex p-1.5 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
