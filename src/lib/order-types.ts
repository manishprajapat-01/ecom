/**
 * Order types & constants shared between server services and client components.
 * This module must stay free of server-only imports (prisma, next/headers, ...).
 */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "COD";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  landmark?: string | null;
  city: string;
  state: string;
  pinCode: string;
  type?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string | null;
  totalAmount: number; // paise
  discountAmount: number; // paise
  shippingFee: number; // paise
  taxAmount: number; // paise
  finalAmount: number; // paise
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  couponCode: string | null;
  idempotencyKey?: string | null;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    title: string;
    image: string;
    price: number; // paise
    quantity: number;
    total: number; // paise
  }>;
  address: ShippingAddressSnapshot;
  customer?: { name: string | null; phone: string };
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
