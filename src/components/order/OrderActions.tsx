"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { usePayment } from "@/lib/use-payment";
import type { OrderRecord } from "@/lib/order-types";
import type { PaymentSession } from "@/lib/razorpay-client";

interface OrderActionsProps {
  order: Pick<OrderRecord, "id" | "orderNumber" | "status" | "paymentStatus" | "paymentMethod">;
}

/**
 * Customer actions on the order page: retry an unpaid online payment, cancel before shipping.
 */
export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const { pay, isPaying } = usePayment();
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canRetryPayment =
    order.paymentMethod !== "COD" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  const handleRetry = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/checkout/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment) throw new Error(data.error || "Could not restart payment");

      const outcome = await pay({
        orderId: order.id,
        orderNumber: order.orderNumber,
        session: data.payment as PaymentSession,
        preferredMethod: order.paymentMethod === "COD" ? "UPI" : order.paymentMethod,
      });

      if (outcome.status === "success") {
        router.replace(`/account/orders/${order.id}?payment=success`);
        router.refresh();
      } else {
        setMessage(outcome.message);
        router.refresh();
      }
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this order?")) return;
    setIsCancelling(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel order");
      router.refresh();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!canRetryPayment && !canCancel) return null;

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs text-xs space-y-3">
      {message && <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded">{message}</div>}

      <div className="flex flex-wrap gap-2">
        {canRetryPayment && (
          <button
            onClick={handleRetry}
            disabled={isPaying}
            className="flex-1 min-w-[160px] py-2.5 bg-[#fb641b] hover:bg-[#e05310] disabled:bg-gray-300 text-white font-bold rounded-sm flex items-center justify-center gap-1.5"
          >
            {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isPaying ? "Waiting for payment..." : "Complete Payment"}
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling || isPaying}
            className="flex-1 min-w-[160px] py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold rounded-sm flex items-center justify-center gap-1.5"
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
