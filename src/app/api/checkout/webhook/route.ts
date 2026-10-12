import { NextResponse } from "next/server";
import { verifyWebhookSignature, mapGatewayMethod } from "@/lib/services/payment";
import { confirmOrderPayment, markPaymentFailed } from "@/lib/services/order";
import { HttpError } from "@/lib/api";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method?: string;
  notes?: Record<string, string>;
  error_description?: string;
}

/**
 * Razorpay webhook – the authoritative source of payment truth.
 * Configure in the Razorpay dashboard with events: payment.captured, payment.failed, order.paid.
 * The signature is ALWAYS verified; unsigned/invalid requests are rejected.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: { event: string; payload?: { payment?: { entity?: RazorpayPaymentEntity } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) {
    // Events we don't handle are acknowledged so Razorpay stops retrying.
    return NextResponse.json({ status: "ignored" });
  }

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        await confirmOrderPayment({
          orderId: payment.notes?.orderId,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          method: mapGatewayMethod(payment.method, "UPI"),
          rawResponse: JSON.parse(JSON.stringify(payment)),
        });
        break;
      }
      case "payment.failed": {
        await markPaymentFailed({
          orderId: payment.notes?.orderId,
          razorpayOrderId: payment.order_id,
          reason: payment.error_description || "Payment failed at gateway",
          rawResponse: JSON.parse(JSON.stringify(payment)),
        });
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    if (error instanceof HttpError) {
      // Business-rule rejection (unknown order / mismatch) – acknowledge so Razorpay doesn't retry.
      console.warn("[razorpay webhook] rejected:", error.message);
      return NextResponse.json({ status: "rejected", reason: error.message });
    }
    console.error("[razorpay webhook] processing error:", error);
    // 500 makes Razorpay retry later (e.g. DB hiccup); payload is already signature-verified.
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
