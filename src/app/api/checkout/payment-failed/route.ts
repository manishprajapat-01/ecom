import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/services/auth";
import { markPaymentFailed } from "@/lib/services/order";
import { apiError } from "@/lib/api";

const Schema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().optional(),
  reason: z.string().max(300).optional(),
});

/**
 * The browser reports a failed / dismissed Razorpay payment.
 * The order remains PENDING (unpaid) so the customer can retry from the order page.
 */
export async function POST(req: Request) {
  try {
    const user = await requireSession();
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await markPaymentFailed({
      orderId: parsed.data.orderId,
      razorpayOrderId: parsed.data.razorpayOrderId,
      userId: user.id,
      reason: parsed.data.reason || "Payment cancelled by customer",
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return apiError(error, "Failed to record payment failure");
  }
}
