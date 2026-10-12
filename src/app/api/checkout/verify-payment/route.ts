import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/services/auth";
import { fetchCapturedPayment, mapGatewayMethod, verifyPaymentSignature } from "@/lib/services/payment";
import { confirmOrderPayment, getOrderById, markPaymentFailed } from "@/lib/services/order";
import { apiError } from "@/lib/api";

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

/**
 * Called by the browser after Razorpay Checkout reports success.
 * The order is confirmed ONLY if the HMAC signature (and, for real payments,
 * the captured payment fetched from Razorpay) match our stored order.
 */
export async function POST(req: Request) {
  try {
    const user = await requireSession();

    const parsed = VerifyPaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment verification payload" }, { status: 400 });
    }
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    // Ownership + order ↔ gateway-order binding
    const order = await getOrderById(orderId, user.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already confirmed", order });
    }

    const signatureOk = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!signatureOk) {
      await markPaymentFailed({ orderId, userId: user.id, reason: "Invalid payment signature" });
      return NextResponse.json(
        { error: "Payment verification failed: invalid signature" },
        { status: 400 }
      );
    }

    // Second check for real gateway payments: amount & order must match what Razorpay captured.
    let method = order.paymentMethod;
    const gatewayPayment = await fetchCapturedPayment(razorpayPaymentId);
    if (gatewayPayment) {
      const captured = gatewayPayment.status === "captured" || gatewayPayment.status === "authorized";
      if (!captured || gatewayPayment.orderId !== razorpayOrderId || gatewayPayment.amount !== order.finalAmount) {
        await markPaymentFailed({ orderId, userId: user.id, reason: `Gateway mismatch (${gatewayPayment.status})` });
        return NextResponse.json({ error: "Payment could not be confirmed with the gateway" }, { status: 400 });
      }
      if (method !== "COD") {
        method = mapGatewayMethod(gatewayPayment.method, method);
      }
    }

    const updatedOrder = await confirmOrderPayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      userId: user.id,
      method: method === "COD" ? undefined : method,
      rawResponse: { razorpayPaymentId, razorpaySignature, source: "client-verify" },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and order confirmed",
      order: updatedOrder,
    });
  } catch (error) {
    return apiError(error, "Payment verification failed");
  }
}
