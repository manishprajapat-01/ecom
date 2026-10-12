"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, BadgePercent } from "lucide-react";
import { SAMPLE_BANNERS } from "@/lib/data/sample-catalog";

export function BannerCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SAMPLE_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + SAMPLE_BANNERS.length) % SAMPLE_BANNERS.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SAMPLE_BANNERS.length);
  };

  const banner = SAMPLE_BANNERS[current];

  return (
    <div className="relative w-full overflow-hidden bg-white rounded-sm shadow-sm group">
      <div className={`relative min-h-[154px] sm:min-h-[280px] md:min-h-[320px] bg-gradient-to-r ${banner.bgColor} transition-all duration-700 flex items-center`}>
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-25 sm:opacity-20 mix-blend-overlay">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Banner Content */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-12 py-5 sm:py-8 flex flex-col items-start justify-center text-white z-10">
          <span className="inline-flex items-center gap-1 bg-yellow-400 text-blue-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded uppercase mb-2 shadow-xs">
            <BadgePercent className="w-3 h-3" />
            {banner.badge}
          </span>
          <h2 className="max-w-[70%] sm:max-w-xl text-[22px] leading-6 sm:text-4xl md:text-5xl sm:leading-tight font-black tracking-tight mb-1.5 sm:mb-2 drop-shadow-md">
            {banner.title}
          </h2>
          <p className="max-w-[76%] sm:max-w-xl text-[11px] leading-4 sm:text-lg text-blue-100 mb-3 sm:mb-5 font-medium drop-shadow">
            {banner.subtitle}
          </p>
          <Link
            href={banner.ctaLink}
            className="inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-sm shadow-md transition-transform transform hover:-translate-y-0.5 active:translate-y-0 text-[11px] sm:text-sm"
          >
            {banner.ctaText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Prev / Next Arrows */}
      <button
        onClick={prevSlide}
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-16 bg-white/70 hover:bg-white text-gray-800 items-center justify-center rounded-r shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-20"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-16 bg-white/70 hover:bg-white text-gray-800 items-center justify-center rounded-l shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-20"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SAMPLE_BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 sm:h-2.5 rounded-full transition-all ${
              current === index ? "bg-white w-5 sm:w-6" : "bg-white/50 hover:bg-white/80 w-1.5 sm:w-2.5"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
