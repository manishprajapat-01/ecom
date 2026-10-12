"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, ShoppingCart, Check } from "lucide-react";
import type { CatalogProduct } from "@/lib/data/sample-catalog";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: CatalogProduct;
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { addToCart, items } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const isInCart = items.some((i) => i.productId === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      brand: product.brand,
      image: product.images[0]?.url || "",
      regularPricePaise: product.regularPrice,
      sellingPricePaise: product.sellingPrice,
      stock: product.stock,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const primaryImage = product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="group bg-white rounded border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 flex flex-col relative overflow-hidden h-full">
      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 p-1.5 rounded-full transition-colors ${
          isFavorited
            ? "text-red-500 bg-red-50"
            : "text-gray-400 hover:text-red-500 bg-white/80 hover:bg-white"
        } shadow-xs`}
        aria-label="Add to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
      </button>

      {/* Image Link */}
      <Link href={`/products/${product.slug}`} className="block relative pt-[95%] bg-gray-50/50 overflow-hidden">
        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {product.discountPercent >= 20 && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
            {product.discountPercent}% OFF
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase truncate">
              {product.brand}
            </span>
            {/* Flipkart-like Assured Badge */}
            <span className="inline-flex items-center text-[10px] bg-blue-50 text-[#2874f0] font-black px-1 py-0.2 rounded italic border border-blue-100">
              Assured ✦
            </span>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-[11px] sm:text-sm font-medium text-gray-800 hover:text-[#2874f0] line-clamp-2 leading-snug transition-colors min-h-[30px] sm:min-h-0"
            title={product.title}
          >
            {product.title}
          </Link>
        </div>

        <div>
          {/* Rating Badge */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1.5 my-1">
              <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white font-bold text-[11px] px-1.5 py-0.5 rounded">
                {product.rating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-current" />
              </span>
              <span className="text-gray-400 text-[11px] sm:text-xs font-medium">
                ({product.reviewCount.toLocaleString()})
              </span>
            </div>
          )}

          {/* Pricing Row */}
          <div className="flex items-baseline flex-wrap gap-2 mt-1">
            <span className="text-sm sm:text-lg font-bold text-gray-900">
              {formatCurrency(product.sellingPrice)}
            </span>
            {product.regularPrice > product.sellingPrice && (
              <>
                <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                  {formatCurrency(product.regularPrice)}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-600">
                  {product.discountPercent}% off
                </span>
              </>
            )}
          </div>

          <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1 truncate">
            Free delivery • <span className="text-emerald-700 font-semibold">Bank Offer</span>
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1.5 sm:pt-2 border-t border-gray-100 mt-1">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`w-full min-h-8 py-1.5 px-2 sm:px-3 rounded text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              product.stock <= 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : isInCart
                ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                : "bg-blue-50 text-[#2874f0] hover:bg-[#2874f0] hover:text-white"
            }`}
          >
            {product.stock <= 0 ? (
              "Out of Stock"
            ) : isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added in Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
