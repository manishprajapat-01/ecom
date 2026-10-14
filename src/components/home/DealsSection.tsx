"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Flame } from "lucide-react";
import type { CatalogProduct } from "@/lib/data/sample-catalog";
import { ProductCard } from "../product/ProductCard";

interface DealsSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink: string;
  products: CatalogProduct[];
  isHot?: boolean;
  hasTimer?: boolean;
  bannerImage?: string;
}

export function DealsSection({
  title,
  subtitle,
  viewAllLink,
  products,
  isHot = false,
  hasTimer = false,
  bannerImage,
}: DealsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live countdown timer for Flipkart Deals of the Day (e.g. 18h 42m 19s)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 20 });

  useEffect(() => {
    if (!hasTimer) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimer]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden relative group">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isHot && <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500 shrink-0 animate-pulse" />}
            <div>
              <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                {title}
              </h2>
              {subtitle && (
                <p className="hidden sm:block text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Flipkart Flash Sale Countdown Timer */}
          {hasTimer && (
            <div className="hidden sm:flex items-center gap-1.5 ml-4 bg-blue-50 text-[#2874f0] px-3 py-1 rounded-full border border-blue-100 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {pad(timeLeft.hours)} : {pad(timeLeft.minutes)} : {pad(timeLeft.seconds)} Left
              </span>
            </div>
          )}
        </div>

        {/* View All Button */}
        <Link
          href={viewAllLink}
          className="bg-[#2874f0] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xs flex items-center gap-1.5 transition shadow-xs shrink-0 tracking-wide"
        >
          VIEW ALL
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Product Strip Container with Scroll Arrows */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll("left")}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-9 h-20 bg-white/95 hover:bg-white text-gray-700 items-center justify-center rounded-r-md shadow-md z-20 border border-gray-200 border-l-0 transition-opacity opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Products Horizontal Scroll */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 sm:gap-4 p-3.5 sm:p-5 no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-[160px] max-w-[160px] sm:min-w-[210px] sm:max-w-[210px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll("right")}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-9 h-20 bg-white/95 hover:bg-white text-gray-700 items-center justify-center rounded-l-md shadow-md z-20 border border-gray-200 border-r-0 transition-opacity opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
