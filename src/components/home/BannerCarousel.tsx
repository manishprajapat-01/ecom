"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Sparkles } from "lucide-react";

interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  image: string;
  offerNote: string;
}

const FLIPKART_BANNERS: PromoBanner[] = [
  {
    id: "banner-bbd",
    badge: "Big Billion Days Special",
    title: "India's Biggest Festival Sale",
    subtitle: "Up to 80% Off on Apple, Samsung, OnePlus & Laptops",
    ctaText: "Shop Deals Now",
    ctaLink: "/categories/electronics",
    bgColor: "from-[#1a3a8f] via-[#2874f0] to-[#1250b8]",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    offerNote: "10% Instant Discount on SBI & Axis Bank Cards",
  },
  {
    id: "banner-electronics",
    badge: "Mega Electronics Fest",
    title: "Top Gadgets & Best Selling Tech",
    subtitle: "Smartwatches, Earbuds, 4K Smart TVs starting ₹999",
    ctaText: "Explore Electronics",
    ctaLink: "/categories/electronics",
    bgColor: "from-[#0d233a] via-[#103b66] to-[#0a488f]",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    offerNote: "Extra ₹2,500 Exchange Bonus on Select Devices",
  },
  {
    id: "banner-fashion",
    badge: "Flipkart Fashion Carnival",
    title: "50-80% Off on Top Brands",
    subtitle: "Ethnic Kurtas, Casual Shirts, Running Shoes & Premium Watches",
    ctaText: "Grab Fashion Picks",
    ctaLink: "/categories/fashion",
    bgColor: "from-[#800f2f] via-[#a4133c] to-[#590d22]",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    offerNote: "Buy 2 Get 10% Extra Off | Free Returns & Exchanges",
  },
  {
    id: "banner-appliances",
    badge: "Grand Kitchen & Home Upgrade",
    title: "Upgrade Your Home Essentials",
    subtitle: "Air Fryers, Microwaves, Cookware & Mixers from ₹499",
    ctaText: "Upgrade Today",
    ctaLink: "/categories/home-kitchen",
    bgColor: "from-[#0f4c3a] via-[#137547] to-[#0b3c2e]",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    offerNote: "No Cost EMI Available up to 12 Months",
  },
];

export function BannerCarousel({ initialBanners }: { initialBanners?: PromoBanner[] }) {
  const activeBanners = (initialBanners && initialBanners.length > 0)
    ? initialBanners
    : FLIPKART_BANNERS;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % activeBanners.length);
  };

  const banner = activeBanners[current] || activeBanners[0];

  return (
    <div className="relative w-full overflow-hidden bg-white rounded-xs shadow-xs group">
      <div
        className={`relative min-h-[170px] sm:min-h-[290px] md:min-h-[330px] bg-gradient-to-r ${banner.bgColor} transition-all duration-700 flex items-center`}
      >
        {/* Background Image Overlay with subtle blend */}
        <div className="absolute inset-0 opacity-25 sm:opacity-30 mix-blend-overlay">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Banner Content Container */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-12 py-5 sm:py-8 flex flex-col items-start justify-center text-white z-10">
          {/* Badge */}
          <div className="flex items-center gap-1.5 bg-[#ffe500] text-blue-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-xs uppercase mb-2 shadow-xs">
            <Zap className="w-3 h-3 fill-current text-blue-950" />
            <span>{banner.badge}</span>
          </div>

          {/* Heading */}
          <h2 className="max-w-[75%] sm:max-w-2xl text-[20px] leading-6 sm:text-4xl md:text-5xl sm:leading-tight font-black tracking-tight mb-1 sm:mb-2 drop-shadow-md">
            {banner.title}
          </h2>

          {/* Subtitle */}
          <p className="max-w-[80%] sm:max-w-xl text-[11px] leading-4 sm:text-base text-blue-100 mb-2 sm:mb-4 font-medium drop-shadow">
            {banner.subtitle}
          </p>

          {/* Offer Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-yellow-300 font-semibold mb-4 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{banner.offerNote}</span>
          </div>

          {/* CTA Button */}
          <Link
            href={banner.ctaLink}
            className="inline-flex items-center gap-2 bg-[#ffe500] hover:bg-yellow-400 text-blue-950 font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xs shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm tracking-wide"
          >
            <span>{banner.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Prev Arrow */}
      <button
        onClick={prevSlide}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-20 bg-white/80 hover:bg-white text-gray-800 items-center justify-center rounded-r shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next Arrow */}
      <button
        onClick={nextSlide}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-20 bg-white/80 hover:bg-white text-gray-800 items-center justify-center rounded-l shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {activeBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
              current === index
                ? "bg-white w-6 sm:w-8"
                : "bg-white/50 hover:bg-white/80 w-1.5 sm:w-2"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
