"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingCart, Star } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/data/sample-catalog";

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product: CatalogProduct) => {
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
    removeFromWishlist(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-sm border border-gray-200 p-12 text-center shadow-xs">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Empty Wishlist</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          You have no items in your wishlist. Start adding items you love to keep track of deals and price drops!
        </p>
        <Link
          href="/products"
          className="inline-block mt-6 px-6 py-2.5 bg-[#2874f0] hover:bg-blue-700 text-white font-bold text-xs rounded-sm shadow-md transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-current" /> My Wishlist ({items.length})
        </h1>
      </div>

      <div className="bg-white rounded-sm border border-gray-200 divide-y divide-gray-100 shadow-xs">
        {items.map((prod) => (
          <div key={prod.id} className="p-4 flex gap-4 items-center">
            <Link
              href={`/products/${prod.slug}`}
              className="w-24 h-24 relative bg-gray-50 border rounded p-1 shrink-0"
            >
              <Image
                src={prod.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"}
                alt={prod.title}
                fill
                className="object-contain p-1"
              />
            </Link>

            <div className="flex-1 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {prod.brand}
              </span>
              <Link
                href={`/products/${prod.slug}`}
                className="block font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
              >
                {prod.title}
              </Link>

              {prod.rating > 0 && (
                <div className="flex items-center gap-1 my-1">
                  <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white font-bold text-[10px] px-1 py-0.2 rounded">
                    {prod.rating.toFixed(1)} <Star className="w-2 h-2 fill-current" />
                  </span>
                  <span className="text-gray-400 text-[11px]">({prod.reviewCount})</span>
                </div>
              )}

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(prod.sellingPrice)}
                </span>
                {prod.regularPrice > prod.sellingPrice && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(prod.regularPrice)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {prod.discountPercent}% off
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => handleMoveToCart(prod)}
                className="px-4 py-2 bg-[#ff9f00] hover:bg-[#f39100] text-white font-bold text-xs rounded-sm shadow-xs flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
              </button>

              <button
                onClick={() => removeFromWishlist(prod.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
