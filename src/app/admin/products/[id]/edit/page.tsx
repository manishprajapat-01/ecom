import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="text-xs font-bold text-[#2874f0] hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="text-xs font-semibold text-gray-600 hover:text-[#2874f0] flex items-center gap-1"
        >
          View in store <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-white rounded-sm border border-gray-200 p-6 shadow-xs max-w-4xl">
        <h1 className="text-base font-bold text-gray-900 mb-1">Edit Product</h1>
        <p className="text-xs text-gray-500 mb-6 font-mono">{product.sku}</p>
        <ProductForm product={product} />
      </div>
    </div>
  );
}
