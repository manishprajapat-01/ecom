import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/services/auth";
import { attachGatewayOrder, createOrder } from "@/lib/services/order";
import { createRazorpayOrder, getRazorpayKeyId, isMockPaymentMode } from "@/lib/services/payment";
import { apiError } from "@/lib/api";
import { SITE_CONFIG } from "@/lib/config";

const CreateOrderSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1, "At least one item required"),
  paymentMethod: z.enum(["UPI", "CARD", "NETBANKING", "WALLET", "COD"]),
  couponCode: z.string().nullable().optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireSession();

    const parsed = CreateOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid order payload" },
        { status: 400 }
      );
    }

    const { addressId, items, paymentMethod, couponCode, idempotencyKey } = parsed.data;

    if (paymentMethod === "COD" && !SITE_CONFIG.features.enableCashOnDelivery) {
      return NextResponse.json({ error: "Cash on Delivery is currently unavailable." }, { status: 400 });
    }

    // Server-side price/stock validation + atomic stock reservation
    const order = await createOrder({
      userId: user.id,
      addressId,
      items,
      paymentMethod,
      couponCode,
      idempotencyKey,
    });

    if (paymentMethod === "COD") {
      return NextResponse.json({ success: true, order, payment: null });
    }

    // Reuse the gateway order on an idempotent replay, otherwise create one.
    let razorpayOrderId = order.razorpayOrderId;
    if (!razorpayOrderId) {
      const gatewayOrder = await createRazorpayOrder(order.finalAmount, order.orderNumber, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
      });
      await attachGatewayOrder(order.id, gatewayOrder.id, order.finalAmount, paymentMethod);
      razorpayOrderId = gatewayOrder.id;
    }

    return NextResponse.json({
      success: true,
      order: { ...order, razorpayOrderId },
      payment: {
        provider: "razorpay",
        mock: isMockPaymentMode(),
        keyId: isMockPaymentMode() ? null : getRazorpayKeyId(),
        razorpayOrderId,
        amount: order.finalAmount,
        currency: "INR",
        prefill: {
          name: order.address.fullName || user.name || "",
          contact: `+91${order.address.phone || user.phone}`,
          email: user.email || undefined,
        },
      },
    });
  } catch (error) {
    return apiError(error, "Failed to process order");
  }
}
