import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export default function AddProductPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Products Catalog
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Add New Product</h1>
        <p className="text-xs text-slate-500 mb-6">Upload images, set pricing, inventory, and publish to your store.</p>
        <ProductForm />
      </div>
    </div>
  );
}
