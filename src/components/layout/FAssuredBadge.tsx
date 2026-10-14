import React from "react";

interface FAssuredBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function FAssuredBadge({ size = "sm", className = "" }: FAssuredBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 select-none ${
        size === "sm" ? "h-4 text-[10px]" : "h-5 text-xs"
      } ${className}`}
      title="Flipkart Assured: 6 Quality Checks & Fast Delivery"
    >
      <span className="bg-gradient-to-r from-blue-700 via-[#2874f0] to-blue-600 text-white font-black italic px-1 rounded-l-xs flex items-center tracking-tight shadow-2xs">
        <span className="text-[#ffe500] font-black mr-0.5">f</span>Assured
      </span>
      {/* Plus star emblem */}
      <span className="bg-yellow-400 text-blue-900 font-bold px-0.5 rounded-r-xs flex items-center justify-center">
        <svg
          className="w-2.5 h-2.5 fill-current text-blue-900"
          viewBox="0 0 24 24"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </span>
    </span>
  );
}
