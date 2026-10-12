"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  ShieldCheck,
  RotateCcw,
  Truck,
  CheckCircle2,
  MapPin,
  Tag,
  Check,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/data/sample-catalog";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export function ProductDetailView({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const { addToCart, items } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [pinCode, setPinCode] = useState("");
  const [pinChecked, setPinChecked] = useState(false);
  const [isCopiedAlert, setIsCopiedAlert] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const isInCart = items.some((i) => i.productId === product.id);

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product.sellingPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        variantId: selectedVariantId,
        title: product.title + (selectedVariant ? ` (${selectedVariant.title})` : ""),
        slug: product.slug,
        brand: product.brand,
        image: product.images[0]?.url || "",
        regularPricePaise: product.regularPrice,
        sellingPricePaise: currentPrice,
        stock: currentStock,
      },
      1
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      setPinChecked(true);
    }
  };

  const images = product.images.length > 0 ? product.images : [
    {
      id: "fallback-img",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      alt: product.title,
      isPrimary: true,
    },
  ];

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-4 sm:p-6 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery & Desktop CTA Buttons */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex gap-4">
            {/* Thumbnails (vertical on larger screens) */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 relative border rounded overflow-hidden p-1 transition-all ${
                      selectedImageIndex === idx
                        ? "border-[#2874f0] ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-square bg-gray-50/50 rounded border border-gray-100 p-4 flex items-center justify-center">
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-3 right-3 p-2 rounded-full border shadow-xs z-10 ${
                  isFavorited
                    ? "bg-red-50 text-red-500 border-red-200"
                    : "bg-white text-gray-400 hover:text-red-500 border-gray-200"
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>

              <div className="relative w-full h-full">
                <Image
                  src={images[selectedImageIndex]?.url || images[0].url}
                  alt={product.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Desktop Dual Action Buttons: Yellow Add to Cart & Orange Buy Now */}
          <div className="hidden sm:grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
              className={`py-3 px-4 font-bold rounded-sm text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 ${
                currentStock <= 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : isInCart
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-[#ff9f00] hover:bg-[#f39100] text-white"
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-5 h-5" /> ITEM IN CART
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" /> ADD TO CART
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={currentStock <= 0}
              className={`py-3 px-4 font-bold rounded-sm text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 ${
                currentStock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#fb641b] hover:bg-[#e05310] text-white"
              }`}
            >
              <Zap className="w-5 h-5 fill-current" /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Column: Details, Pricing, Specs */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Brand & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="inline-flex items-center text-xs bg-blue-50 text-[#2874f0] font-black px-1.5 py-0.5 rounded italic border border-blue-100">
                Assured ✦
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Rating Badge */}
          {product.rating > 0 && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 bg-emerald-700 text-white font-bold text-xs px-2 py-0.5 rounded shadow-xs">
                {product.rating.toFixed(1)} <Star className="w-3 h-3 fill-current" />
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {product.reviewCount.toLocaleString()} Ratings & Reviews
              </span>
            </div>
          )}

          {/* Special Price Tag */}
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
            Special Price
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline flex-wrap gap-3 pb-3 border-b border-gray-100">
            <span className="text-3xl font-black text-gray-900">
              {formatCurrency(currentPrice)}
            </span>
            {product.regularPrice > currentPrice && (
              <>
                <span className="text-base text-gray-500 line-through">
                  {formatCurrency(product.regularPrice)}
                </span>
                <span className="text-base font-bold text-emerald-600">
                  {product.discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Available Offers */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
              Available Offers
            </h3>
            <div className="space-y-1.5 text-gray-700">
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bank Offer:</strong> 10% instant discount on leading Credit/Debit cards up to ₹1,500.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Special Price:</strong> Get extra 15% off (price inclusive of cashback/coupon).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Partner Offer:</strong> Sign up for BharatBazaar Pay Later and get ₹100 Welcome Gift Card.
                </span>
              </div>
            </div>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="py-2 border-t border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Variant
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                      selectedVariantId === v.id
                        ? "border-[#2874f0] bg-blue-50 text-[#2874f0] font-bold"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {v.title} — {formatCurrency(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery & PIN Code Checker */}
          <div className="space-y-2 py-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#2874f0]" /> Delivery
            </h3>

            <form onSubmit={handlePinCheck} className="flex gap-2 max-w-xs">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setPinChecked(false);
                }}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#2874f0]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#2874f0] text-white text-xs font-bold rounded hover:bg-blue-700"
              >
                Check
              </button>
            </form>

            {pinChecked && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4" />
                Delivery by Tomorrow, 11:00 PM | Free ₹40
              </div>
            )}
          </div>

          {/* Highlights / Short Description */}
          <div className="text-xs text-gray-700 space-y-1 py-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-gray-900">
              Highlights
            </h3>
            <p className="leading-relaxed">{product.shortDesc}</p>
          </div>

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="py-2 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Specifications</h3>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded text-xs">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 py-2 px-3">
                    <span className="text-gray-500 font-medium">{key}</span>
                    <span className="col-span-2 text-gray-800 font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Description */}
          <div className="py-2 border-t border-gray-100 text-xs text-gray-700">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Product Description</h3>
            <p className="leading-relaxed whitespace-pre-line">{product.longDesc}</p>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 grid grid-cols-2 gap-2 shadow-2xl">
        <button
          onClick={handleAddToCart}
          disabled={currentStock <= 0}
          className={`py-3 font-bold rounded text-xs flex items-center justify-center gap-1.5 ${
            currentStock <= 0
              ? "bg-gray-200 text-gray-500"
              : isInCart
              ? "bg-amber-100 text-amber-900"
              : "bg-[#ff9f00] text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> {isInCart ? "IN CART" : "ADD TO CART"}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={currentStock <= 0}
          className={`py-3 font-bold rounded text-xs flex items-center justify-center gap-1.5 ${
            currentStock <= 0
              ? "bg-gray-300 text-gray-500"
              : "bg-[#fb641b] text-white"
          }`}
        >
          <Zap className="w-4 h-4 fill-current" /> BUY NOW
        </button>
      </div>
    </div>
  );
}
