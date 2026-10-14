"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { CatalogCategory } from "@/lib/data/sample-catalog";

interface SubCategoryItem {
  title: string;
  link: string;
}

interface FlipkartCategoryConfig {
  name: string;
  slug: string;
  imageUrl: string;
  hasDropdown?: boolean;
  subcategories?: SubCategoryItem[];
}

const FLIPKART_CATEGORIES: FlipkartCategoryConfig[] = [
  {
    name: "Grocery",
    slug: "grocery",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: false,
  },
  {
    name: "Mobiles",
    slug: "mobiles-tablets",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Apple iPhones", link: "/products?search=Apple" },
      { title: "Samsung Galaxy 5G", link: "/products?search=Samsung" },
      { title: "Flagship Tablets", link: "/categories/mobiles-tablets" },
      { title: "Mobile Cases & Chargers", link: "/categories/mobiles-tablets" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Men's Casual Shirts", link: "/categories/fashion" },
      { title: "Women Ethnic Kurta Sets", link: "/categories/fashion" },
      { title: "Sports & Running Footwear", link: "/categories/fashion" },
      { title: "Watches & Accessories", link: "/categories/fashion" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Wireless Headphones & boAt", link: "/categories/electronics" },
      { title: "Smart Watches & Bands", link: "/categories/electronics" },
      { title: "Laptops & Computing", link: "/categories/electronics" },
      { title: "Bluetooth Speakers", link: "/categories/electronics" },
    ],
  },
  {
    name: "Home & Furniture",
    slug: "home-kitchen",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Cookware & Fry Pans", link: "/categories/home-kitchen" },
      { title: "Mixer Grinders & Kettles", link: "/categories/home-kitchen" },
      { title: "Home Decor & Furnishing", link: "/categories/home-kitchen" },
      { title: "Bedsheets & Curtains", link: "/categories/home-kitchen" },
    ],
  },
  {
    name: "Appliances",
    slug: "appliances",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Smart Televisions 4K", link: "/categories/appliances" },
      { title: "Air Conditioners", link: "/categories/appliances" },
      { title: "Refrigerators", link: "/categories/appliances" },
      { title: "Washing Machines", link: "/categories/appliances" },
    ],
  },
  {
    name: "Flight Bookings",
    slug: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: false,
  },
  {
    name: "Beauty, Toys & More",
    slug: "beauty",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: true,
    subcategories: [
      { title: "Skincare & Haircare", link: "/categories/beauty" },
      { title: "Men's Grooming Kits", link: "/categories/beauty" },
      { title: "Toys & Action Figures", link: "/categories/beauty" },
      { title: "Chocolates & Gift Hampers", link: "/categories/grocery" },
    ],
  },
  {
    name: "Top Offers",
    slug: "products",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=140&h=140&q=80",
    hasDropdown: false,
  },
];

export function CategoryStrip({ categories }: { categories?: CatalogCategory[] }) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div className="bg-white border-b border-gray-200 shadow-2xs relative z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto py-2.5 sm:py-3 gap-3 sm:gap-6 no-scrollbar snap-x snap-mandatory">
          {FLIPKART_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="relative shrink-0 flex flex-col items-center group snap-start cursor-pointer"
              onMouseEnter={() => cat.hasDropdown && setActiveDropdown(cat.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={cat.slug === "products" ? "/products" : `/categories/${cat.slug}`}
                className="flex flex-col items-center text-center group"
              >
                {/* Flipkart circular image container */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-[#2874f0] transition-transform duration-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="eager"
                  />
                </div>

                {/* Category Label */}
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[11px] sm:text-[13px] font-bold text-gray-800 group-hover:text-[#2874f0] transition-colors whitespace-nowrap">
                    {cat.name}
                  </span>
                  {cat.hasDropdown && (
                    <ChevronDown className={`w-3 h-3 text-gray-500 group-hover:text-[#2874f0] transition-transform ${
                      activeDropdown === cat.name ? "rotate-180" : ""
                    }`} />
                  )}
                </div>
              </Link>

              {/* Hover Flyout Dropdown Menu */}
              {cat.hasDropdown && activeDropdown === cat.name && cat.subcategories && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52 z-50">
                  <div className="bg-white rounded-sm shadow-xl border border-gray-100 py-1.5 animate-fade-in text-xs font-semibold">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.link}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                      >
                        {sub.title}
                      </Link>
                    ))}
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="block px-4 py-2 text-[#2874f0] hover:bg-blue-50 font-bold border-t border-gray-100 mt-1"
                    >
                      View All in {cat.name} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
