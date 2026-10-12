import { SITE_CONFIG } from "../config";
import { SAMPLE_COUPONS } from "../data/sample-catalog";

export interface PricingItem {
  productId: string;
  variantId?: string | null;
  unitPricePaise: number;
  quantity: number;
}

export interface CouponInfo {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}

export interface OrderCalculationResult {
  itemsSubtotalPaise: number;
  regularSubtotalPaise: number;
  productSavingsPaise: number;
  couponDiscountPaise: number;
  appliedCoupon?: CouponInfo;
  shippingFeePaise: number;
  isFreeShipping: boolean;
  finalPayablePaise: number;
  totalQuantity: number;
  errors?: string[];
}

/**
 * Validate coupon code and get coupon rules
 */
export function validateCoupon(code: string, subtotalPaise: number): {
  isValid: boolean;
  coupon?: CouponInfo;
  discountPaise: number;
  errorMessage?: string;
} {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = SAMPLE_COUPONS.find((c) => c.code === normalizedCode);

  if (!coupon) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon code '${code}' is invalid or expired.`,
    };
  }

  if (subtotalPaise < coupon.minOrderValue) {
    const minRupees = Math.round(coupon.minOrderValue / 100);
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon '${coupon.code}' requires a minimum order value of ₹${minRupees}.`,
    };
  }

  let discountPaise = 0;
  if (coupon.discountType === "FIXED") {
    discountPaise = coupon.discountValue;
  } else if (coupon.discountType === "PERCENTAGE") {
    discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discountPaise > coupon.maxDiscount) {
      discountPaise = coupon.maxDiscount;
    }
  }

  // Discount cannot exceed subtotal
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return {
    isValid: true,
    coupon: coupon as CouponInfo,
    discountPaise,
  };
}

/**
 * Authoritative Server-side Price Calculation
 * All values in integer paise
 */
export function calculateOrderAmounts(
  items: Array<{
    regularPricePaise: number;
    sellingPricePaise: number;
    quantity: number;
  }>,
  couponCode?: string | null
): OrderCalculationResult {
  let itemsSubtotalPaise = 0;
  let regularSubtotalPaise = 0;
  let totalQuantity = 0;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    itemsSubtotalPaise += item.sellingPricePaise * item.quantity;
    regularSubtotalPaise += item.regularPricePaise * item.quantity;
    totalQuantity += item.quantity;
  }

  const productSavingsPaise = Math.max(0, regularSubtotalPaise - itemsSubtotalPaise);

  // Free shipping check
  const isFreeShipping = itemsSubtotalPaise >= SITE_CONFIG.freeShippingThresholdPaise;
  const shippingFeePaise = totalQuantity === 0 ? 0 : isFreeShipping ? 0 : SITE_CONFIG.defaultShippingFeePaise;

  let couponDiscountPaise = 0;
  let appliedCoupon: CouponInfo | undefined;
  const errors: string[] = [];

  if (couponCode) {
    const couponResult = validateCoupon(couponCode, itemsSubtotalPaise);
    if (couponResult.isValid && couponResult.coupon) {
      couponDiscountPaise = couponResult.discountPaise;
      appliedCoupon = couponResult.coupon;
    } else if (couponResult.errorMessage) {
      errors.push(couponResult.errorMessage);
    }
  }

  const finalPayablePaise = Math.max(
    0,
    itemsSubtotalPaise - couponDiscountPaise + shippingFeePaise
  );

  return {
    itemsSubtotalPaise,
    regularSubtotalPaise,
    productSavingsPaise,
    couponDiscountPaise,
    appliedCoupon,
    shippingFeePaise,
    isFreeShipping,
    finalPayablePaise,
    totalQuantity,
    errors: errors.length > 0 ? errors : undefined,
  };
}
