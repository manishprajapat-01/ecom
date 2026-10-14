"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Layers, Loader2, Pencil, Plus, Trash2, Check, X } from "lucide-react";
import type { CatalogCategory } from "@/lib/data/sample-catalog";

interface AdminCategory extends CatalogCategory {
  isActive?: boolean;
}

const ICON_OPTIONS = ["Smartphone", "Laptop", "Shirt", "Tv", "Home", "Sparkles", "ShoppingBag", "Tag"];

const inputClass =
  "w-full p-2 border rounded border-gray-300 bg-white text-xs focus:outline-none focus:border-[#2874f0]";

interface FormState {
  name: string;
  description: string;
  icon: string;
  image: string;
  sortOrder: string;
}

const emptyForm: FormState = { name: "", description: "", icon: "ShoppingBag", image: "", sortOrder: "100" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load categories");
      setCategories(data.categories || []);
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (cat: AdminCategory) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description,
      icon: cat.iconName,
      image: cat.image,
      sortOrder: String(cat.sortOrder),
    });
  };

  const reset = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        image: form.image,
        sortOrder: parseInt(form.sortOrder, 10) || 100,
      };
      const res = await fetch(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");
      setNotice({ type: "success", text: editingId ? "Category updated." : "Category created." });
      reset();
      await load();
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (cat: AdminCategory) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");
      setNotice({ type: "success", text: data.message });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    }
  };

  const toggleActive = async (cat: AdminCategory) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: cat.isActive === false }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      await load();
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    }
  };

  const renderForm = () => (
    <form onSubmit={save} className="p-4 border border-blue-200 rounded bg-blue-50/30 space-y-3 text-xs">
      <h3 className="font-bold text-gray-900">{editingId ? "Edit Category" : "New Category"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="text" placeholder="Category name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required minLength={2} />
        <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass}>
          {ICON_OPTIONS.map((i) => (
            <option key={i} value={i}>
              Icon: {i}
            </option>
          ))}
        </select>
        <input type="text" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
        <input type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputClass} min={0} />
        <input type="url" placeholder="Banner image URL (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={`${inputClass} sm:col-span-2`} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={reset} className="px-4 py-2 font-bold text-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="px-5 py-2 bg-[#2874f0] text-white font-bold rounded flex items-center gap-1.5 disabled:bg-gray-300">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" /> Categories & Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Categories appear in the storefront strip navigation and product filters</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setForm(emptyForm);
              setIsAdding(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
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

      {isAdding && renderForm()}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-x-auto text-xs p-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Icon</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading...
                </td>
              </tr>
            ) : (
              categories.map((cat) =>
                editingId === cat.id ? (
                  <tr key={cat.id}>
                    <td colSpan={6} className="p-3">
                      {renderForm()}
                    </td>
                  </tr>
                ) : (
                  <tr key={cat.id} className={`hover:bg-gray-50 ${cat.isActive === false ? "opacity-60" : ""}`}>
                    <td className="p-3 text-gray-500">{cat.sortOrder}</td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-gray-400 text-[11px] truncate max-w-xs">{cat.description}</p>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-gray-600">{cat.slug}</td>
                    <td className="p-3 text-gray-600">{cat.iconName}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-semibold ${
                          cat.isActive === false
                            ? "bg-gray-100 text-gray-600 border-gray-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {cat.isActive === false ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {cat.isActive === false ? "Hidden" : "Active"}
                      </button>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-[#2874f0]" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(cat)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
