import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../api";
import { calculateOrderAmounts } from "./pricing";

import type { OrderRecord, OrderStatus, PaymentMethod, PaymentStatus, ShippingAddressSnapshot } from "../order-types";
import { ORDER_STATUSES } from "../order-types";

export type { OrderRecord, OrderStatus, PaymentMethod, PaymentStatus, ShippingAddressSnapshot } from "../order-types";
export { ORDER_STATUSES } from "../order-types";

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
    const existing = await prisma.order.findFirst({
      where: { idempotencyKey, userId },
      include: orderInclude,
    });
    if (existing) return mapOrder(existing);
  }

  // Address must belong to the customer
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
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

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isPublished: true },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const verified = lines.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new HttpError("One of the items in your cart is no longer available.", 400);
    }
    const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId) : undefined;
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
    return {
      productId: product.id,
      variantId: variant?.id || null,
      title: variant ? `${product.title} (${variant.title})` : product.title,
      image: product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "",
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
}

/**
 * Link a freshly created gateway order to our order and open a PENDING payment record.
 */
export async function attachGatewayOrder(orderId: string, razorpayOrderId: string, amountPaise: number, method: PaymentMethod) {
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
}

/**
 * Fetch an order that is eligible for a payment retry (online, unpaid, not cancelled).
 */
export async function getRetryableOrder(orderId: string, userId: string): Promise<OrderRecord> {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });
  if (!order) throw new HttpError("Order not found", 404);
  if (order.paymentMethod === "COD") throw new HttpError("Cash on Delivery orders do not need online payment.", 400);
  if (order.paymentStatus === "PAID") throw new HttpError("This order is already paid.", 400);
  if (order.status === "CANCELLED") throw new HttpError("This order has been cancelled.", 400);
  return mapOrder(order);
}

/**
 * Get customer orders
 */
export async function getUserOrders(userId: string): Promise<OrderRecord[]> {
  const list = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  return list.map(mapOrder);
}

/**
 * Get order by ID (or order number). Pass userId to enforce ownership for customers.
 */
export async function getOrderById(idOrNumber: string, userId?: string): Promise<OrderRecord | null> {
  const o = await prisma.order.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      ...(userId ? { userId } : {}),
    },
    include: orderInclude,
  });
  return o ? mapOrder(o) : null;
}

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
  const list = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: orderInclude,
  });
  return list.map(mapOrder);
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
}

/**
 * Customer: cancel an order that hasn't shipped yet.
 */
export async function cancelOrderByCustomer(orderId: string, userId: string): Promise<OrderRecord> {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new HttpError("Order not found", 404);
  if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
    throw new HttpError("This order can no longer be cancelled. Please contact support.", 400);
  }
  return updateOrderStatus(orderId, "CANCELLED");
}
