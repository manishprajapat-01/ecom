"use client";

import { useCallback, useState } from "react";
import { SITE_CONFIG } from "./config";
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  type PaymentSession,
  type RazorpayFailure,
} from "./razorpay-client";
import type { OrderRecord } from "./services/order";

export type PaymentOutcome =
  | { status: "success"; order: OrderRecord }
  | { status: "failed"; message: string; order?: OrderRecord }
  | { status: "cancelled"; message: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/**
 * Runs an online payment for an order end-to-end:
 *   open gateway → verify signature on the server → return the confirmed order.
 * In mock mode (no Razorpay keys, development only) a simulated payment is verified instead.
 */
export function usePayment() {
  const [isPaying, setIsPaying] = useState(false);

  const pay = useCallback(
    async (params: {
      orderId: string;
      orderNumber: string;
      session: PaymentSession;
      preferredMethod: "UPI" | "CARD" | "NETBANKING" | "WALLET";
    }): Promise<PaymentOutcome> => {
      const { orderId, orderNumber, session, preferredMethod } = params;
      setIsPaying(true);

      try {
        let gatewayResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

        if (session.mock) {
          // Simulated gateway (development only). The server accepts this only in mock mode.
          await new Promise((r) => setTimeout(r, 900));
          gatewayResponse = {
            razorpay_order_id: session.razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock",
          };
        } else {
          await loadRazorpayScript();
          try {
            gatewayResponse = await openRazorpayCheckout({
              session,
              storeName: SITE_CONFIG.storeName,
              description: `Order ${orderNumber}`,
              preferredMethod,
              notes: { orderId, orderNumber },
            });
          } catch (err) {
            const dismissed = (err as { dismissed?: boolean })?.dismissed;
            const failure = (err as RazorpayFailure)?.error;
            const message = dismissed
              ? "Payment was cancelled. You can retry from your orders page."
              : failure?.description || (err as Error)?.message || "Payment failed. Please try again.";

            const { data } = await postJson("/api/checkout/payment-failed", {
              orderId,
              razorpayOrderId: session.razorpayOrderId,
              reason: dismissed ? "Checkout dismissed by customer" : message,
            });
            return dismissed
              ? { status: "cancelled", message }
              : { status: "failed", message, order: data.order };
          }
        }

        const { ok, data } = await postJson("/api/checkout/verify-payment", {
          orderId,
          razorpayOrderId: gatewayResponse.razorpay_order_id,
          razorpayPaymentId: gatewayResponse.razorpay_payment_id,
          razorpaySignature: gatewayResponse.razorpay_signature,
        });

        if (!ok || !data.order) {
          return {
            status: "failed",
            message: data.error || "We could not verify your payment. If money was deducted it will be refunded automatically.",
          };
        }
        return { status: "success", order: data.order as OrderRecord };
      } finally {
        setIsPaying(false);
      }
    },
    []
  );

  return { pay, isPaying };
}
