import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format paise into Indian Rupee string (₹)
 * E.g. 149900 -> "₹1,499" or "₹1,499.00"
 */
export function formatCurrency(amountInPaise: number, includeDecimals = false): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Convert Rupee string or number to integer paise
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(regularPrice: number, sellingPrice: number): number {
  if (regularPrice <= 0 || sellingPrice >= regularPrice) return 0;
  return Math.round(((regularPrice - sellingPrice) / regularPrice) * 100);
}
