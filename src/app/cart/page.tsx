"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Tag,
  ArrowRight,
  ShoppingBag,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { SAMPLE_COUPONS } from "@/lib/data/sample-catalog";
import { FAssuredBadge } from "@/components/layout/FAssuredBadge";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    summary,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    couponCode,
    couponError,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponAppliedSuccess, setCouponAppliedSuccess] = useState(false);

  const handleApplyCoupon = (codeToApply: string) => {
    const success = applyCoupon(codeToApply);
    if (success) {
      setCouponAppliedSuccess(true);
      setInputCoupon("");
      setTimeout(() => setCouponAppliedSuccess(false), 3000);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-white rounded-sm border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-32 h-32 mx-auto relative mb-4 opacity-75">
          <ShoppingBag className="w-full h-full text-blue-200 stroke-1" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty!</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Explore our wide range of products and discover great deals across electronics, fashion, and home essentials.
        </p>
        <Link
          href="/products"
          className="inline-block mt-6 px-8 py-2.5 bg-[#2874f0] hover:bg-blue-700 text-white font-bold text-sm rounded-sm shadow-md transition"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-gray-900">
        Shopping Cart ({itemCount} {itemCount === 1 ? "Item" : "Items"})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white rounded-sm border border-gray-200 divide-y divide-gray-100 shadow-xs">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId || "default"}`} className="p-4 flex gap-4">
                {/* Product Thumbnail */}
                <Link
                  href={`/products/${item.slug}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 relative bg-gray-50 rounded border border-gray-100 shrink-0 p-2"
                >
                  <Image
                    src={item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"}
                    alt={item.title}
                    fill
                    className="object-contain p-1"
                  />
                </Link>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {item.brand}
                      </span>
                      <FAssuredBadge size="sm" />
                    </div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="block text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                    >
                      {item.title}
                    </Link>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(item.sellingPricePaise)}
                      </span>
                      {item.regularPricePaise > item.sellingPricePaise && (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.regularPricePaise)}
                          </span>
                          <span className="text-xs font-bold text-emerald-600">
                            {Math.round(((item.regularPricePaise - item.sellingPricePaise) / item.regularPricePaise) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-800 border-x border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        disabled={item.quantity >= item.stock}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Place Order Footer Strip */}
            <div className="p-4 bg-gray-50/70 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Order Total</p>
                <p className="text-lg font-black text-gray-900">{formatCurrency(summary.finalPayablePaise)}</p>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="bg-[#fb641b] hover:bg-[#e05310] text-white font-bold text-sm px-8 py-3 rounded-sm shadow-md transition flex items-center gap-2"
              >
                PLACE ORDER <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Price Details & Coupons */}
        <div className="lg:col-span-4 space-y-3">
          {/* Coupons Card */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#2874f0]" /> Apply Coupons
            </h3>

            {couponCode ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-800">
                <span className="font-bold flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  &lsquo;{couponCode}&rsquo; applied!
                </span>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:underline uppercase"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs uppercase font-medium focus:outline-none focus:border-[#2874f0]"
                  />
                  <button
                    onClick={() => handleApplyCoupon(inputCoupon)}
                    disabled={!inputCoupon.trim()}
                    className="px-4 py-1.5 bg-[#2874f0] text-white font-bold text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-xs text-red-600 font-medium">{couponError}</p>
                )}

                {/* Available Coupons Suggestions */}
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Available Offers</span>
                  {SAMPLE_COUPONS.map((coup) => (
                    <div
                      key={coup.code}
                      onClick={() => handleApplyCoupon(coup.code)}
                      className="p-2 border border-dashed border-blue-200 rounded hover:bg-blue-50/50 cursor-pointer text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#2874f0]">{coup.code}</span>
                        <span className="text-[10px] text-blue-700 font-semibold">TAP TO APPLY</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{coup.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown Card */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-3 border-b border-gray-100">
              Price Details
            </h3>

            <div className="py-3 space-y-2.5 text-xs text-gray-700 divide-y divide-gray-100">
              <div className="flex justify-between">
                <span>Price ({itemCount} items)</span>
                <span>{formatCurrency(summary.regularSubtotalPaise)}</span>
              </div>

              <div className="flex justify-between pt-2">
                <span>Discount</span>
                <span className="text-emerald-700 font-semibold">
                  - {formatCurrency(summary.productSavingsPaise)}
                </span>
              </div>

              {summary.couponDiscountPaise > 0 && (
                <div className="flex justify-between pt-2">
                  <span>Coupon Discount ({couponCode})</span>
                  <span className="text-emerald-700 font-semibold">
                    - {formatCurrency(summary.couponDiscountPaise)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <span>Delivery Charges</span>
                <span>
                  {summary.isFreeShipping ? (
                    <span className="text-emerald-700 font-bold">
                      <span className="line-through text-gray-400 font-normal mr-1">₹40</span> FREE
                    </span>
                  ) : (
                    formatCurrency(summary.shippingFeePaise)
                  )}
                </span>
              </div>

              <div className="flex justify-between pt-3 font-bold text-sm text-gray-900 border-t border-gray-200">
                <span>Total Amount</span>
                <span>{formatCurrency(summary.finalPayablePaise)}</span>
              </div>
            </div>

            {summary.productSavingsPaise + summary.couponDiscountPaise > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs text-emerald-700 font-bold">
                You will save {formatCurrency(summary.productSavingsPaise + summary.couponDiscountPaise)} on this order!
              </div>
            )}
          </div>

          {/* Trust Promise */}
          <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Safe and Secure Payments. 100% Authentic products guaranteed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
