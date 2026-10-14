import fs from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../api";
import { calculateOrderAmounts } from "./pricing";
import { IS_PRODUCTION } from "../config";
import { SAMPLE_PRODUCTS } from "../data/sample-catalog";
import { getUserAddresses } from "./address";

import type { OrderRecord, OrderStatus, PaymentMethod, PaymentStatus, ShippingAddressSnapshot } from "../order-types";
import { ORDER_STATUSES } from "../order-types";

export type { OrderRecord, OrderStatus, PaymentMethod, PaymentStatus, ShippingAddressSnapshot } from "../order-types";
export { ORDER_STATUSES } from "../order-types";

const DEV_ORDERS_FILE = path.join(process.cwd(), "src", "lib", "data", "dev-orders.json");

function loadDevOrders(): OrderRecord[] {
  try {
    if (fs.existsSync(DEV_ORDERS_FILE)) {
      const data = fs.readFileSync(DEV_ORDERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load dev orders from file:", e);
  }
  return [];
}

function persistDevOrders(orders: OrderRecord[]) {
  try {
    fs.writeFileSync(DEV_ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist dev orders to file:", e);
  }
}

const globalForOrders = globalThis as unknown as {
  devOrders?: OrderRecord[];
};

if (!globalForOrders.devOrders) {
  globalForOrders.devOrders = loadDevOrders();
}

function getDevOrders(): OrderRecord[] {
  if (!globalForOrders.devOrders || globalForOrders.devOrders.length === 0) {
    globalForOrders.devOrders = loadDevOrders();
  }
  return globalForOrders.devOrders;
}

function saveDevOrders(orders: OrderRecord[]) {
  globalForOrders.devOrders = orders;
  persistDevOrders(orders);
}

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "desc" as const } },
  user: { select: { name: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function mapOrder(o: OrderWithRelations): OrderRecord {
  const paidPayment = o.payments.find((p) => p.status === "PAID") || o.payments[0];
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId,
    addressId: o.addressId,
    totalAmount: o.totalAmount,
    discountAmount: o.discountAmount,
    shippingFee: o.shippingFee,
    taxAmount: o.taxAmount,
    finalAmount: o.finalAmount,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    razorpayOrderId: o.razorpayOrderId,
    razorpayPaymentId: paidPayment?.razorpayPaymentId || null,
    couponCode: o.couponCode,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      title: i.title,
      image: i.image || "",
      price: i.price,
      quantity: i.quantity,
      total: i.total,
    })),
    address: (o.shippingAddress as unknown as ShippingAddressSnapshot) || {
      fullName: "",
      phone: "",
      houseFlat: "",
      street: "",
      city: "",
      state: "",
      pinCode: "",
    },
    customer: o.user ? { name: o.user.name, phone: o.user.phone } : undefined,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

/**
 * Generate human-friendly order number: ODR-YYYYMMDD-XXXXXX
 */
export function generateOrderNumber(): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `ODR-${dateStr}-${randomSuffix}`;
}

/**
 * Create a PENDING (online) or CONFIRMED (COD) order.
 * Prices, discounts and stock are all re-validated on the server inside one transaction.
 */
export async function createOrder(params: {
  userId: string;
  addressId: string;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  idempotencyKey?: string;
}): Promise<OrderRecord> {
  const { userId, addressId, items, paymentMethod, couponCode, idempotencyKey } = params;

  if (!items || items.length === 0) {
    throw new HttpError("Cannot place an order with an empty cart", 400);
  }

  // Idempotent re-submission (e.g. double click / network retry)
  if (idempotencyKey) {
    try {
      const existing = await prisma.order.findFirst({
        where: { idempotencyKey, userId },
        include: orderInclude,
      });
      if (existing) return mapOrder(existing);
    } catch (err) {
      if (IS_PRODUCTION) throw err;
      const memExisting = getDevOrders().find(
        (o) => o.idempotencyKey === idempotencyKey && o.userId === userId
      );
      if (memExisting) return memExisting;
    }
  }

  // Address must belong to the customer
  let address: any = null;
  try {
    address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (!address && !IS_PRODUCTION) {
    const addrs = await getUserAddresses(userId);
    address = addrs.find((a) => a.id === addressId) || addrs[0] || {
      id: addressId || "demo-addr",
      fullName: "Rahul Sharma",
      phone: "9812345678",
      houseFlat: "Flat 204, Green Heights",
      street: "Tonk Road",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302015",
      type: "HOME",
    };
  }
  if (!address) {
    throw new HttpError("Selected delivery address was not found. Please choose another address.", 400);
  }

  // Merge duplicate lines (same product + variant)
  const merged = new Map<string, OrderItemInput>();
  for (const item of items) {
    const key = `${item.productId}::${item.variantId || ""}`;
    const prev = merged.get(key);
    merged.set(key, { ...item, quantity: (prev?.quantity || 0) + item.quantity });
  }
  const lines = Array.from(merged.values());

  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { id: { in: lines.map((l) => l.productId) }, isPublished: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    });
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (products.length === 0 && !IS_PRODUCTION) {
    products = SAMPLE_PRODUCTS.filter((p) => lines.some((l) => l.productId === p.id)).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      regularPrice: p.regularPrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      images: p.images,
      variants: p.variants || [],
    }));
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const verified = lines.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new HttpError("One of the items in your cart is no longer available.", 400);
    }
    const variant = line.variantId
      ? (product.variants as Array<{ id: string; stock: number; price: number; title: string }>).find(
          (v) => v.id === line.variantId
        )
      : undefined;
    if (line.variantId && !variant) {
      throw new HttpError(`The selected variant of '${product.title}' is no longer available.`, 400);
    }
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock < line.quantity) {
      throw new HttpError(
        availableStock === 0
          ? `'${product.title}' is out of stock.`
          : `Only ${availableStock} unit(s) of '${product.title}' left in stock.`,
        400
      );
    }
    const unitPrice = variant ? variant.price : product.sellingPrice;
    const prodImages = (product.images || []) as Array<{ isPrimary?: boolean; url: string }>;
    return {
      productId: product.id,
      variantId: variant?.id || null,
      title: variant ? `${product.title} (${variant.title})` : product.title,
      image: prodImages.find((i) => i.isPrimary)?.url || prodImages[0]?.url || "",
      regularPricePaise: Math.max(product.regularPrice, unitPrice),
      sellingPricePaise: unitPrice,
      quantity: line.quantity,
    };
  });

  const summary = calculateOrderAmounts(
    verified.map((v) => ({
      regularPricePaise: v.regularPricePaise,
      sellingPricePaise: v.sellingPricePaise,
      quantity: v.quantity,
    })),
    couponCode
  );
  if (summary.errors?.length) {
    throw new HttpError(summary.errors[0], 400);
  }

  const isCod = paymentMethod === "COD";
  const shippingAddress: ShippingAddressSnapshot = {
    fullName: address.fullName,
    phone: address.phone,
    houseFlat: address.houseFlat,
    street: address.street,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    type: address.type,
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Atomic stock reservation – fails if a concurrent order took the last units.
      for (const v of verified) {
        if (v.variantId) {
          const res = await tx.productVariant.updateMany({
            where: { id: v.variantId, stock: { gte: v.quantity } },
            data: { stock: { decrement: v.quantity } },
          });
          if (res.count === 0) throw new HttpError(`'${v.title}' just went out of stock.`, 409);
        } else {
          const res = await tx.product.updateMany({
            where: { id: v.productId, stock: { gte: v.quantity } },
            data: { stock: { decrement: v.quantity } },
          });
          if (res.count === 0) throw new HttpError(`'${v.title}' just went out of stock.`, 409);
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId: address.id,
          shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
          totalAmount: summary.itemsSubtotalPaise,
          discountAmount: summary.couponDiscountPaise,
          shippingFee: summary.shippingFeePaise,
          taxAmount: 0,
          finalAmount: summary.finalPayablePaise,
          status: isCod ? "CONFIRMED" : "PENDING",
          paymentStatus: "PENDING",
          paymentMethod,
          couponCode: summary.appliedCoupon?.code || null,
          idempotencyKey: idempotencyKey || null,
          items: {
            create: verified.map((v) => ({
              productId: v.productId,
              variantId: v.variantId,
              title: v.title,
              image: v.image,
              price: v.sellingPricePaise,
              quantity: v.quantity,
              total: v.sellingPricePaise * v.quantity,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.inventoryMovement.createMany({
        data: verified.map((v) => ({
          productId: v.productId,
          variantId: v.variantId,
          quantityChange: -v.quantity,
          reason: "SALE",
          referenceId: order.id,
        })),
      });

      return order;
    });

    return mapOrder(created);
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.warn("[orders] DB unreachable during transaction, storing demo order in memory:", (err as Error).message);
      const newOrder: OrderRecord = {
        id: `ord-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        userId,
        addressId: address.id,
        totalAmount: summary.itemsSubtotalPaise,
        discountAmount: summary.couponDiscountPaise,
        shippingFee: summary.shippingFeePaise,
        taxAmount: 0,
        finalAmount: summary.finalPayablePaise,
        status: isCod ? "CONFIRMED" : "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        razorpayOrderId: null,
        razorpayPaymentId: null,
        couponCode: summary.appliedCoupon?.code || null,
        items: verified.map((v, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          productId: v.productId,
          variantId: v.variantId,
          title: v.title,
          image: v.image,
          price: v.sellingPricePaise,
          quantity: v.quantity,
          total: v.sellingPricePaise * v.quantity,
        })),
        address: shippingAddress,
        customer: { name: address.fullName, phone: address.phone },
        paidAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const orders = getDevOrders();
      orders.unshift(newOrder);
      saveDevOrders(orders);
      return newOrder;
    }
    throw err;
  }
}

/**
 * Link a freshly created gateway order to our order and open a PENDING payment record.
 */
export async function attachGatewayOrder(orderId: string, razorpayOrderId: string, amountPaise: number, method: PaymentMethod) {
  try {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { razorpayOrderId, paymentStatus: "PENDING" },
      }),
      prisma.payment.create({
        data: {
          orderId,
          razorpayOrderId,
          amount: amountPaise,
          currency: "INR",
          status: "PENDING",
          method,
        },
      }),
    ]);
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        orders[idx] = {
          ...orders[idx],
          razorpayOrderId,
          paymentStatus: "PENDING",
          paymentMethod: method,
        };
        saveDevOrders(orders);
      }
      return;
    }
    throw err;
  }
}

/**
 * Mark an order as paid after the payment has been verified server-side.
 * Idempotent: a second call (e.g. webhook after client verification) is a no-op.
 */
export async function confirmOrderPayment(params: {
  orderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  userId?: string;
  method?: PaymentMethod;
  rawResponse?: Prisma.InputJsonValue;
}): Promise<OrderRecord> {
  const { orderId, razorpayOrderId, razorpayPaymentId, userId, method, rawResponse } = params;

  try {
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId, ...(userId ? { userId } : {}) } : { razorpayOrderId },
      include: orderInclude,
    });
    if (!order) {
      throw new HttpError("Order not found", 404);
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new HttpError("This payment does not belong to the given order.", 400);
    }
    if (order.paymentStatus === "PAID") {
      return mapOrder(order);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const pending = await tx.payment.findFirst({
        where: { orderId: order.id, razorpayOrderId, razorpayPaymentId: null },
        orderBy: { createdAt: "desc" },
      });

      const paymentData = {
        razorpayPaymentId,
        status: "PAID" as const,
        ...(method ? { method } : {}),
        ...(rawResponse !== undefined ? { rawResponse } : {}),
      };

      if (pending) {
        await tx.payment.update({ where: { id: pending.id }, data: paymentData });
      } else {
        await tx.payment.upsert({
          where: { razorpayPaymentId },
          update: paymentData,
          create: {
            orderId: order.id,
            razorpayOrderId,
            amount: order.finalAmount,
            currency: "INR",
            method: method || order.paymentMethod,
            ...paymentData,
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: order.status === "PENDING" ? "CONFIRMED" : order.status,
          paymentStatus: "PAID",
          paidAt: new Date(),
          ...(method ? { paymentMethod: method } : {}),
        },
        include: orderInclude,
      });
    });

    return mapOrder(updated);
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const idx = orders.findIndex((o) => o.id === orderId || o.razorpayOrderId === razorpayOrderId);
      if (idx !== -1) {
        orders[idx] = {
          ...orders[idx],
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paidAt: new Date().toISOString(),
          razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
        saveDevOrders(orders);
        return orders[idx];
      }
    }
    throw err;
  }
}

/**
 * Record a failed/abandoned payment attempt. The order stays PENDING so the customer can retry.
 */
export async function markPaymentFailed(params: {
  orderId?: string;
  razorpayOrderId?: string;
  userId?: string;
  reason?: string;
  rawResponse?: Prisma.InputJsonValue;
}): Promise<OrderRecord | null> {
  const { orderId, razorpayOrderId, userId, reason, rawResponse } = params;
  try {
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId, ...(userId ? { userId } : {}) } : { razorpayOrderId },
      include: orderInclude,
    });
    if (!order || order.paymentStatus === "PAID") return order ? mapOrder(order) : null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING", ...(razorpayOrderId ? { razorpayOrderId } : {}) },
        data: { status: "FAILED", ...(rawResponse !== undefined ? { rawResponse } : {}) },
      });
      return tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          notes: reason ? `Payment failed: ${reason}`.slice(0, 500) : order.notes,
        },
        include: orderInclude,
      });
    });
    return mapOrder(updated);
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const idx = orders.findIndex((o) => o.id === orderId || o.razorpayOrderId === razorpayOrderId);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], paymentStatus: "FAILED", updatedAt: new Date().toISOString() };
        saveDevOrders(orders);
        return orders[idx];
      }
    }
    throw err;
  }
}

/**
 * Fetch an order that is eligible for a payment retry (online, unpaid, not cancelled).
 */
export async function getRetryableOrder(orderId: string, userId: string): Promise<OrderRecord> {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });
    if (!order) throw new HttpError("Order not found", 404);
    if (order.paymentMethod === "COD") throw new HttpError("Cash on Delivery orders do not need online payment.", 400);
    if (order.paymentStatus === "PAID") throw new HttpError("This order is already paid.", 400);
    if (order.status === "CANCELLED") throw new HttpError("This order has been cancelled.", 400);
    return mapOrder(order);
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const found = orders.find((o) => o.id === orderId && (!userId || o.userId === userId || o.userId === "demo-user-1"));
      if (found) return found;
    }
    throw err;
  }
}

/**
 * Get customer orders
 */
export async function getUserOrders(userId: string): Promise<OrderRecord[]> {
  try {
    const list = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
    if (list.length > 0) return list.map(mapOrder);
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (!IS_PRODUCTION) {
    const orders = getDevOrders();
    return orders.filter((o) => !userId || o.userId === userId || o.userId === "demo-user-1");
  }
  return [];
}

/**
 * Get order by ID (or order number). Pass userId to enforce ownership for customers.
 */
export async function getOrderById(idOrNumber: string, userId?: string): Promise<OrderRecord | null> {
  try {
    const o = await prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
        ...(userId ? { userId } : {}),
      },
      include: orderInclude,
    });
    if (o) return mapOrder(o);
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (!IS_PRODUCTION) {
    const orders = getDevOrders();
    return (
      orders.find(
        (o) =>
          (o.id === idOrNumber || o.orderNumber === idOrNumber) &&
          (!userId || o.userId === userId || o.userId === "demo-user-1" || !o.userId)
      ) || null
    );
  }
  return null;
}

const SAMPLE_FALLBACK_ORDERS: OrderRecord[] = [
  {
    id: "ord-1",
    orderNumber: "OD20261014-9842",
    userId: "demo-user-1",
    addressId: "addr-1",
    totalAmount: 7999900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    finalAmount: 7999900,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    razorpayOrderId: "order_demo_1",
    razorpayPaymentId: "pay_demo_1",
    couponCode: null,
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        variantId: null,
        title: "Apple iPhone 15 (128 GB) - Blue",
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80",
        price: 7999900,
        quantity: 1,
        total: 7999900,
      },
    ],
    address: {
      fullName: "Aadi Kiran Mahajani",
      phone: "9876543210",
      houseFlat: "Flat 402, Royal Residency",
      street: "Malviya Nagar",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302017",
    },
    customer: { name: "Aadi Kiran Mahajani", phone: "9876543210" },
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-2",
    orderNumber: "OD20261014-5512",
    userId: "demo-user-2",
    addressId: "addr-2",
    totalAmount: 2499900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    finalAmount: 2499900,
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    razorpayOrderId: "order_demo_2",
    razorpayPaymentId: "pay_demo_2",
    couponCode: "FLIPKART10",
    items: [
      {
        id: "item-2",
        productId: "prod-2",
        variantId: null,
        title: "Sony WH-1000XM5 Wireless Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
        price: 2499900,
        quantity: 1,
        total: 2499900,
      },
    ],
    address: {
      fullName: "Sneha Verma",
      phone: "9823456789",
      houseFlat: "B-12, Vaishali Nagar",
      street: "Amrapali Circle",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302021",
    },
    customer: { name: "Sneha Verma", phone: "9823456789" },
    paidAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-3",
    orderNumber: "OD20261014-1189",
    userId: "demo-user-3",
    addressId: "addr-3",
    totalAmount: 189900,
    discountAmount: 0,
    shippingFee: 4000,
    taxAmount: 0,
    finalAmount: 193900,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    razorpayOrderId: null,
    razorpayPaymentId: null,
    couponCode: null,
    items: [
      {
        id: "item-3",
        productId: "prod-3",
        variantId: null,
        title: "Men Slim Fit Cotton Casual Shirt",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        price: 94950,
        quantity: 2,
        total: 189900,
      },
    ],
    address: {
      fullName: "Rohan Mehra",
      phone: "9811223344",
      houseFlat: "House 54, Sector 14",
      street: "MG Road",
      city: "Gurugram",
      state: "Haryana",
      pinCode: "122001",
    },
    customer: { name: "Rohan Mehra", phone: "9811223344" },
    paidAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];



/**
 * Admin: list orders with optional filters
 */
export async function getAllOrders(filters: { status?: OrderStatus; search?: string; limit?: number } = {}): Promise<OrderRecord[]> {
  const { status, search, limit = 200 } = filters;
  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { phone: { contains: search } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  try {
    const list = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: orderInclude,
    });
    if (list.length > 0) return list.map(mapOrder);
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (!IS_PRODUCTION) {
    const orders = getDevOrders();
    let filtered = [...orders];
    if (status) filtered = filtered.filter((o) => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer?.phone?.includes(q) ||
          o.customer?.name?.toLowerCase().includes(q)
      );
    }
    return filtered.slice(0, limit);
  }
  return [];
}

/**
 * Restore stock for every item of an order (used on cancellation).
 */
async function restockOrderItems(tx: Prisma.TransactionClient, orderId: string, reason: "RETURN" | "ADJUSTMENT") {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    } else {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
  }
  if (items.length) {
    await tx.inventoryMovement.createMany({
      data: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantityChange: i.quantity,
        reason,
        referenceId: orderId,
      })),
    });
  }
}

/**
 * Admin: Update order fulfillment status (restocks on cancellation, settles COD on delivery).
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus, adminId?: string): Promise<OrderRecord> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new HttpError("Order not found", 404);
    if (order.status === status) {
      const same = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
      return mapOrder(same!);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const becomingCancelled = (status === "CANCELLED" || status === "RETURNED") && !["CANCELLED", "RETURNED"].includes(order.status);
      if (becomingCancelled) {
        await restockOrderItems(tx, orderId, status === "RETURNED" ? "RETURN" : "ADJUSTMENT");
      }

      const paymentStatus =
        status === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
          ? "PAID"
          : becomingCancelled && order.paymentStatus === "PAID"
            ? "REFUNDED"
            : order.paymentStatus;

      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          paymentStatus,
          ...(paymentStatus === "PAID" && order.paymentStatus !== "PAID" ? { paidAt: new Date() } : {}),
        },
        include: orderInclude,
      });

      if (adminId) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "UPDATE_ORDER_STATUS",
            entityType: "Order",
            entityId: orderId,
            details: { from: order.status, to: status },
          },
        });
      }
      return result;
    });

    return mapOrder(updated);
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        orders[idx] = {
          ...orders[idx],
          status,
          updatedAt: new Date().toISOString(),
        };
        saveDevOrders(orders);
        return orders[idx];
      }
    }
    throw err;
  }
}

/**
 * Customer: cancel an order that hasn't shipped yet.
 */
export async function cancelOrderByCustomer(orderId: string, userId: string): Promise<OrderRecord> {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new HttpError("Order not found", 404);
    if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
      throw new HttpError("This order can no longer be cancelled. Please contact support.", 400);
    }
  } catch (err) {
    if (!IS_PRODUCTION) {
      const orders = getDevOrders();
      const mem = orders.find((o) => o.id === orderId && (!userId || o.userId === userId || o.userId === "demo-user-1"));
      if (!mem) throw new HttpError("Order not found", 404);
      if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(mem.status)) {
        throw new HttpError("This order can no longer be cancelled. Please contact support.", 400);
      }
    } else {
      throw err;
    }
  }
  return updateOrderStatus(orderId, "CANCELLED");
}

