"use client";

import React from "react";
import Link from "next/link";

interface FlipkartLogoProps {
  variant?: "white" | "blue" | "dark";
  size?: "sm" | "md" | "lg";
  showSubtext?: boolean;
  className?: string;
}

export function FlipkartLogo({
  variant = "white",
  size = "md",
  showSubtext = true,
  className = "",
}: FlipkartLogoProps) {
  const isWhite = variant === "white";
  const isDark = variant === "dark";

  return (
    <Link
      href="/"
      className={`inline-flex flex-col items-start leading-none group select-none ${className}`}
      title="Flipkart"
    >
      <div className="flex items-center gap-1.5">
        {/* Authentic Flipkart Bag Emblem */}
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-transform group-hover:scale-105">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
            {/* Shopping bag body */}
            <path
              d="M6 10C6 8.89543 6.89543 8 8 8H24C25.1046 8 26 8.89543 26 10L27.5 27C27.5 28.6569 26.1569 30 24.5 30H7.5C5.84315 30 4.5 28.6569 4.5 27L6 10Z"
              fill="#FFE11B"
            />
            {/* Bag handle */}
            <path
              d="M11 9V6C11 3.79086 12.7909 2 15 2H17C19.2091 2 21 3.79086 21 6V9"
              stroke="#2874F0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Stylized 'f' on bag */}
            <path
              d="M17.5 13H14.5C13.6716 13 13 13.6716 13 14.5V17H11.5V19.5H13V26H16V19.5H18L18.5 17H16V15.5C16 15.2239 16.2239 15 16.5 15H17.5V13Z"
              fill="#2874F0"
            />
            {/* Speed lines */}
            <path d="M7 14L9 14" stroke="#2874F0" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 18L8.5 18" stroke="#2874F0" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Brand Text */}
        <span
          className={`font-black italic tracking-wide ${
            size === "sm"
              ? "text-lg sm:text-xl"
              : size === "lg"
              ? "text-2xl sm:text-3xl"
              : "text-xl sm:text-2xl"
          } ${
            isWhite
              ? "text-white"
              : isDark
              ? "text-gray-900"
              : "text-[#2874f0]"
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          Flipkart
        </span>
      </div>

      {/* Subtext: Explore Plus */}
      {showSubtext && (
        <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-[11px] font-semibold italic pl-7 sm:pl-8">
          <span className={isWhite ? "text-gray-200" : isDark ? "text-gray-500" : "text-gray-600"}>
            Explore
          </span>
          <span className="text-[#ffe500] font-bold drop-shadow-xs flex items-center gap-0.5">
            Plus
            {/* Flipkart Plus Golden Star */}
            <svg
              className="w-2.5 h-2.5 fill-current text-[#ffe500]"
              viewBox="0 0 24 24"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </span>
        </div>
      )}
    </Link>
  );
}
