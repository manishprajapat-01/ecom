import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { SortBar } from "@/components/product/SortBar";
import { getBrands, getCategoryBySlug, getProducts, parseProductSort } from "@/lib/services/catalog";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const sort = parseProductSort(sParams.sort);
  const [{ products, total }, brands] = await Promise.all([
    getProducts({
      categorySlug: slug,
      brand: sParams.brand,
      minPricePaise: sParams.minPrice ? parseInt(sParams.minPrice, 10) : undefined,
      maxPricePaise: sParams.maxPrice ? parseInt(sParams.maxPrice, 10) : undefined,
      minRating: sParams.rating ? parseFloat(sParams.rating) : undefined,
      sort,
      limit: 30,
    }),
    getBrands(),
  ]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-blue-600">Categories</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">{category.name}</span>
      </nav>

      {/* Category Banner */}
      <div className="bg-white rounded-sm p-5 border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{category.name}</h1>
          <p className="text-xs text-gray-500 mt-1">{category.description}</p>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          {total} Items Available
        </span>
      </div>

      {/* Main Grid with Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-1">
          <ProductFilters categories={[]} brands={brands} hideCategories />
        </div>

        <div className="lg:col-span-3 space-y-3">
          <SortBar totalCount={total} />

          {products.length === 0 ? (
            <div className="bg-white rounded-sm p-12 text-center border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">No products in this category yet</h3>
              <p className="text-xs text-gray-500 mt-1">Check back soon for new inventory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
