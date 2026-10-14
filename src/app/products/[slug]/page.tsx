import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/services/catalog";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { DealsSection } from "@/components/home/DealsSection";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.title} - Best Price Online | Flipkart`,
    description: product.shortDesc || `Buy ${product.title} at best price with fast delivery and authentic assurance.`,
    openGraph: {
      title: product.title,
      description: product.shortDesc,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Similar products from same category
  const { products: similarProducts } = await getProducts({
    categorySlug: product.categorySlug,
    limit: 4,
  });

  return (
    <div className="space-y-4 pb-12 sm:pb-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/categories/${product.categorySlug}`} className="hover:text-blue-600">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-gray-800 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Stage */}
      <ProductDetailView product={product} />

      {/* Similar / Recommended Products */}
      {similarProducts.length > 0 && (
        <DealsSection
          title="Similar Products You May Like"
          viewAllLink={`/categories/${product.categorySlug}`}
          products={similarProducts.filter((p) => p.id !== product.id)}
        />
      )}
    </div>
  );
}
