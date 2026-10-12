"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import type { CatalogProduct } from "@/lib/data/sample-catalog";
import { ProductCard } from "../product/ProductCard";

interface DealsSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink: string;
  products: CatalogProduct[];
  isHot?: boolean;
}

export function DealsSection({
  title,
  subtitle,
  viewAllLink,
  products,
  isHot = false,
}: DealsSectionProps) {
  return (
    <section className="bg-white rounded-sm shadow-xs border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex min-w-0 items-center gap-2">
          {isHot && <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 shrink-0" />}
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 truncate">
              {title}
            </h2>
            {subtitle && <p className="hidden sm:block text-xs text-gray-500 font-medium">{subtitle}</p>}
          </div>
        </div>

        <Link
          href={viewAllLink}
          className="bg-[#2874f0] hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm flex items-center gap-1 transition shadow-xs shrink-0"
        >
          VIEW ALL
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-2.5 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-4 px-3.5 sm:px-5 py-3.5 sm:py-5 no-scrollbar snap-x snap-mandatory">
        {products.map((product) => (
          <div key={product.id} className="min-w-[152px] max-w-[152px] sm:min-w-0 sm:max-w-none snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
