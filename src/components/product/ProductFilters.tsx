"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, Star, X } from "lucide-react";
import type { CatalogCategory } from "@/lib/data/sample-catalog";

interface ProductFiltersProps {
  categories: CatalogCategory[];
  brands: string[];
  /** When rendering inside a category page, hide the category list */
  hideCategories?: boolean;
}

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 100000 },
  { label: "₹1,000 - ₹5,000", min: 100000, max: 500000 },
  { label: "₹5,000 - ₹20,000", min: 500000, max: 2000000 },
  { label: "Over ₹20,000", min: 2000000, max: 10000000 },
];

export function ProductFilters({ categories, brands, hideCategories = false }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentRating = searchParams.get("rating") || "";

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentBrand || currentMinPrice || currentMaxPrice || currentRating
  );

  return (
    <aside className="bg-white rounded-sm border border-gray-200 p-4 divide-y divide-gray-100 text-sm space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-bold text-gray-900 flex items-center gap-1.5 uppercase text-xs tracking-wider">
          <Filter className="w-4 h-4 text-gray-500" /> Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-[#2874f0] hover:underline"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Categories */}
      {!hideCategories && (
        <div className="pt-3">
          <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider mb-2">Categories</h4>
          <div className="space-y-1.5">
            <button
              onClick={() => updateFilter("category", null)}
              className={`block text-xs text-left w-full ${
                !currentCategory ? "text-[#2874f0] font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter("category", cat.slug)}
                className={`block text-xs text-left w-full truncate ${
                  currentCategory === cat.slug
                    ? "text-[#2874f0] font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Ranges */}
      <div className="pt-3">
        <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider mb-2">Price</h4>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range, idx) => {
            const isSelected =
              currentMinPrice === range.min.toString() && currentMaxPrice === range.max.toString();
            return (
              <label key={idx} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("minPrice", range.min.toString());
                      params.set("maxPrice", range.max.toString());
                      router.push(`${pathname}?${params.toString()}`);
                    } else {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("minPrice");
                      params.delete("maxPrice");
                      router.push(`${pathname}?${params.toString()}`);
                    }
                  }}
                  className="rounded text-[#2874f0] focus:ring-blue-500"
                />
                {range.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Customer Ratings */}
      <div className="pt-3">
        <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider mb-2">Customer Ratings</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <label key={stars} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="rating"
                checked={currentRating === stars.toString()}
                onChange={() => updateFilter("rating", stars.toString())}
                className="text-[#2874f0] focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 font-medium">
                {stars}★ & above
              </span>
            </label>
          ))}
          {currentRating && (
            <button
              onClick={() => updateFilter("rating", null)}
              className="text-[11px] text-gray-400 hover:text-gray-600 block mt-1"
            >
              Reset rating filter
            </button>
          )}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
      <div className="pt-3">
        <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider mb-2">Brand</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={currentBrand === brand}
                onChange={(e) => updateFilter("brand", e.target.checked ? brand : null)}
                className="rounded text-[#2874f0] focus:ring-blue-500"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>
      )}
    </aside>
  );
}
