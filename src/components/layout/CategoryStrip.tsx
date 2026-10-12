"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Shirt,
  Tv,
  Home,
  Sparkles,
  ShoppingBag,
  Tag,
} from "lucide-react";
import type { CatalogCategory } from "@/lib/data/sample-catalog";

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-5 h-5" />,
  Laptop: <Laptop className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Tv: <Tv className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
};

export function CategoryStrip({ categories }: { categories: CatalogCategory[] }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-stretch sm:items-center sm:justify-between overflow-x-auto py-2 gap-2 sm:gap-8 no-scrollbar snap-x snap-mandatory">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex flex-col items-center justify-start gap-1 group min-w-[76px] sm:min-w-[70px] text-center snap-start"
            >
              <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center group-hover:bg-[#2874f0] group-hover:text-white transition-all transform group-hover:scale-105 shadow-xs">
                {iconMap[category.iconName] || <ShoppingBag className="w-5 h-5" />}
              </div>
              <span className="max-w-[72px] sm:max-w-none text-[11px] sm:text-xs leading-3 sm:leading-normal font-semibold text-gray-700 group-hover:text-[#2874f0] transition-colors line-clamp-2">
                {category.name}
              </span>
            </Link>
          ))}

          {/* Top Offers / All Products */}
          <Link
            href="/products"
            className="flex flex-col items-center justify-start gap-1 group min-w-[76px] sm:min-w-[70px] text-center snap-start"
          >
            <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:scale-105 shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs leading-3 sm:leading-normal font-semibold text-amber-700 group-hover:text-amber-800 transition-colors">
              Top Offers
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
