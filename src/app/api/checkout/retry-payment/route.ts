import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/services/auth";
import { attachGatewayOrder, getRetryableOrder } from "@/lib/services/order";
import { createRazorpayOrder, getRazorpayKeyId, isMockPaymentMode } from "@/lib/services/payment";
import { apiError } from "@/lib/api";

const Schema = z.object({
  orderId: z.string().min(1),
});

/**
 * Create a fresh gateway order for an unpaid online order so the customer can pay again.
 */
export async function POST(req: Request) {
  try {
    const user = await requireSession();
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await getRetryableOrder(parsed.data.orderId, user.id);

    const gatewayOrder = await createRazorpayOrder(order.finalAmount, order.orderNumber, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.id,
    });
    await attachGatewayOrder(order.id, gatewayOrder.id, order.finalAmount, order.paymentMethod);

    return NextResponse.json({
      success: true,
      order: { ...order, razorpayOrderId: gatewayOrder.id, paymentStatus: "PENDING" },
      payment: {
        provider: "razorpay",
        mock: isMockPaymentMode(),
        keyId: isMockPaymentMode() ? null : getRazorpayKeyId(),
        razorpayOrderId: gatewayOrder.id,
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
    return apiError(error, "Failed to restart payment");
  }
}
