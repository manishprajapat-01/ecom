import Link from "next/link";
import { ProductFilters } from "@/components/product/ProductFilters";
import { SortBar } from "@/components/product/SortBar";
import { ProductCard } from "@/components/product/ProductCard";
import { getBrands, getCategories, getProducts, parseProductSort } from "@/lib/services/catalog";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const category = params.category;
  const brand = params.brand;
  const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;
  const rating = params.rating ? parseFloat(params.rating) : undefined;
  const search = params.q || params.search;
  const sort = parseProductSort(params.sort);

  const [{ products, total }, categories, brands] = await Promise.all([
    getProducts({
      categorySlug: category,
      brand,
      minPricePaise: minPrice,
      maxPricePaise: maxPrice,
      minRating: rating,
      search,
      sort,
      limit: 40,
    }),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-blue-600">Products</Link>
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 font-semibold capitalize">{category.replace(/-/g, " ")}</span>
          </>
        )}
      </nav>

      {/* Main Grid with Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ProductFilters categories={categories} brands={brands} />
        </div>

        {/* Products Listing Area */}
        <div className="lg:col-span-3 space-y-3">
          <SortBar totalCount={total} />

          {products.length === 0 ? (
            <div className="bg-white rounded-sm p-12 text-center border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">No Products Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                We couldn&apos;t find any items matching your current filters. Try clearing your filters or searching for something else.
              </p>
              <Link
                href="/products"
                className="inline-block mt-4 px-4 py-2 bg-[#2874f0] text-white text-xs font-bold rounded-sm hover:bg-blue-700"
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
