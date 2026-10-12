"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { calculateOrderAmounts, type OrderCalculationResult } from "../lib/services/pricing";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  slug: string;
  brand: string;
  image: string;
  regularPricePaise: number;
  sellingPricePaise: number;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  couponCode: string | null;
  summary: OrderCalculationResult;
  couponError: string | null;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "bharat_bazaar_cart_v1";
const COUPON_KEY = "bharat_bazaar_coupon_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCoupon = localStorage.getItem(COUPON_KEY);
      if (savedCoupon) {
        setCouponCode(savedCoupon);
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (couponCode) {
        localStorage.setItem(COUPON_KEY, couponCode);
      } else {
        localStorage.removeItem(COUPON_KEY);
      }
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [items, couponCode, isLoaded]);

  // Server-authoritative calculation
  const summary = calculateOrderAmounts(
    items.map((i) => ({
      regularPricePaise: i.regularPricePaise,
      sellingPricePaise: i.sellingPricePaise,
      quantity: i.quantity,
    })),
    couponCode
  );

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const addToCart = (product: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.productId && i.variantId === product.variantId
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = Math.min(next[existingIndex].quantity + quantity, product.stock);
        next[existingIndex] = { ...next[existingIndex], quantity: newQty };
        return next;
      } else {
        const addQty = Math.min(quantity, product.stock);
        return [...prev, { ...product, quantity: addQty }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantId === variantId) {
          const clampedQty = Math.min(quantity, i.stock);
          return { ...i, quantity: clampedQty };
        }
        return i;
      })
    );
  };

  const applyCoupon = (code: string): boolean => {
    setCouponError(null);
    const testSummary = calculateOrderAmounts(
      items.map((i) => ({
        regularPricePaise: i.regularPricePaise,
        sellingPricePaise: i.sellingPricePaise,
        quantity: i.quantity,
      })),
      code
    );

    if (testSummary.errors && testSummary.errors.length > 0) {
      setCouponError(testSummary.errors[0]);
      return false;
    }

    setCouponCode(code.trim().toUpperCase());
    return true;
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponError(null);
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        couponCode,
        couponError,
        summary,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
