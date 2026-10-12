import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/lib/services/catalog";
import { Search as SearchIcon, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const { products, total } = await getProducts({
    search: q,
    limit: 50,
  });

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">Search Results</span>
      </nav>

      <div className="bg-white rounded-sm p-5 border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-[#2874f0]" />
            Search results for &ldquo;{q}&rdquo;
          </h1>
          <p className="text-xs text-gray-500 mt-1">Found {total} products matching your query</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-sm p-12 text-center border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">No results found for &ldquo;{q}&rdquo;</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try checking your spelling, using more general terms, or browse our top categories.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/products"
              className="px-4 py-2 bg-[#2874f0] text-white text-xs font-bold rounded-sm hover:bg-blue-700"
            >
              Explore All Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
