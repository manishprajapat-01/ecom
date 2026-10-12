"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORT_OPTIONS = [
  { id: "popular", label: "Popularity" },
  { id: "price_asc", label: "Price -- Low to High" },
  { id: "price_desc", label: "Price -- High to Low" },
  { id: "rating_desc", label: "Customer Rating" },
  { id: "newest", label: "Newest First" },
];

export function SortBar({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "popular";

  const handleSortChange = (sortId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortId);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-sm border border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-800">Sort By:</span>
        <div className="flex items-center flex-wrap gap-1 sm:gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSortChange(opt.id)}
              className={`px-2.5 py-1 rounded transition-colors ${
                currentSort === opt.id
                  ? "text-[#2874f0] font-bold border-b-2 border-[#2874f0]"
                  : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-gray-500 font-medium text-[11px]">
        Showing <span className="font-bold text-gray-800">{totalCount}</span> items
      </div>
    </div>
  );
}
