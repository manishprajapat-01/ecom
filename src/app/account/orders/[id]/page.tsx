import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/services/auth";
import { getOrderById } from "@/lib/services/order";
import { formatCurrency } from "@/lib/utils";
import { OrderActions } from "@/components/order/OrderActions";
import {
  ChevronLeft,
  CheckCircle2,
  MapPin,
  PhoneCall,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<string, string> = {
  UPI: "UPI",
  CARD: "Credit / Debit Card",
  NETBANKING: "Net Banking",
  WALLET: "Wallet",
  COD: "Cash on Delivery",
};

function StatusBanner({ payment, placed }: { payment?: string; placed?: string }) {
  if (payment === "success") {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs flex items-center gap-2 font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Payment successful! Your order has been confirmed.
      </div>
    );
  }
  if (payment === "failed") {
    return (
      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs flex items-center gap-2 font-semibold">
        <XCircle className="w-4 h-4" /> Payment failed. No money has been captured – you can complete the payment below.
      </div>
    );
  }
  if (payment === "cancelled") {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4" /> Payment was cancelled. Your order is saved – complete the payment to confirm it.
      </div>
    );
  }
  if (placed) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs flex items-center gap-2 font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Order placed successfully! Pay on delivery.
      </div>
    );
  }
  return null;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; placed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account/orders/${id}`)}`);
  }

  // Customers can only see their own orders; admins can open any order.
  const order = await getOrderById(id, user.role === "ADMIN" ? undefined : user.id);
  if (!order) {
    notFound();
  }

  const isCancelled = order.status === "CANCELLED" || order.status === "RETURNED";
  const isUnpaidOnline = order.paymentMethod !== "COD" && order.paymentStatus !== "PAID";

  const steps = [
    { label: "Order Placed", date: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), active: true },
    {
      label: "Confirmed",
      date: order.paymentMethod === "COD" ? "Pay on delivery" : order.paymentStatus === "PAID" ? "Payment received" : "Awaiting payment",
      active: order.status !== "PENDING",
    },
    { label: "Shipped", date: "Dispatched", active: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) },
    { label: "Out for Delivery", date: "With delivery partner", active: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) },
    { label: "Delivered", date: order.status === "DELIVERED" ? "Delivered" : "Expected soon", active: order.status === "DELIVERED" },
  ];

  const paymentBadge = isCancelled
    ? { text: order.paymentStatus === "REFUNDED" ? "REFUNDED" : "CANCELLED", cls: "bg-red-50 text-red-700 border-red-200" }
    : order.paymentStatus === "PAID"
      ? { text: order.paymentMethod === "COD" ? "PAID ON DELIVERY" : "PAID ONLINE", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" }
      : order.paymentMethod === "COD"
        ? { text: "CASH ON DELIVERY", cls: "bg-amber-50 text-amber-800 border-amber-200" }
        : order.paymentStatus === "FAILED"
          ? { text: "PAYMENT FAILED", cls: "bg-red-50 text-red-700 border-red-200" }
          : { text: "PAYMENT PENDING", cls: "bg-amber-50 text-amber-800 border-amber-200" };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/account/orders" className="text-xs font-bold text-[#2874f0] hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <span className="text-xs text-gray-500 font-medium">Order ID: {order.orderNumber}</span>
      </div>

      <StatusBanner payment={query.payment} placed={query.placed} />

      {isUnpaidOnline && !isCancelled && !query.payment && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs flex items-center gap-2 font-semibold">
          <Clock className="w-4 h-4" /> This order is awaiting payment. Complete the payment to confirm it.
        </div>
      )}

      {/* Delivery Tracking */}
      <div className="bg-white rounded-sm border border-gray-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{isCancelled ? "Order Cancelled" : "Delivery Status"}</h2>
            <p className="text-xs text-gray-500">
              Current Status:{" "}
              <strong className={`uppercase ${isCancelled ? "text-red-600" : "text-emerald-700"}`}>
                {order.status.replace(/_/g, " ")}
              </strong>
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${paymentBadge.cls}`}>{paymentBadge.text}</span>
        </div>

        {!isCancelled && (
          <div className="py-8 px-2 sm:px-6 overflow-x-auto">
            <div className="flex items-center justify-between relative min-w-[480px]">
              <div className="absolute top-3.5 left-0 right-0 h-1 bg-gray-200 z-0" />
              {steps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center w-1/5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      step.active ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step.active ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`mt-2 text-[11px] sm:text-xs font-semibold ${step.active ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-400 hidden sm:block">{step.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-3 border-b border-gray-100">
              Items ({order.items.length})
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="w-20 h-20 relative bg-gray-50 border rounded p-1 shrink-0">
                    {item.image && <Image src={item.image} alt={item.title} fill sizes="80px" className="object-contain" />}
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <Link href={`/products`} className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-[#2874f0]">
                      {item.title}
                    </Link>
                    <p className="text-gray-500 mt-1">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                    <p className="font-bold text-gray-900 text-sm mt-1">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <OrderActions
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              paymentStatus: order.paymentStatus,
              paymentMethod: order.paymentMethod,
            }}
          />
        </div>

        {/* Address & Payment */}
        <div className="space-y-4">
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs text-xs space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <MapPin className="w-4 h-4 text-[#2874f0]" /> Delivery Address
            </h3>
            <p className="font-bold text-gray-900">{order.address.fullName}</p>
            <p className="text-gray-600 leading-relaxed">
              {order.address.houseFlat}, {order.address.street}
              {order.address.landmark ? `, ${order.address.landmark}` : ""}
              <br />
              {order.address.city}, {order.address.state} - {order.address.pinCode}
            </p>
            <p className="text-gray-700 font-medium">Phone: +91 {order.address.phone}</p>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs text-xs space-y-2">
            <h3 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#2874f0]" /> Payment Summary
            </h3>
            <div className="space-y-1.5 text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>- {formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm text-gray-900">
                <span>{order.paymentStatus === "PAID" ? "Total Paid" : "Total Payable"}</span>
                <span>{formatCurrency(order.finalAmount)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-0.5">
              <p>
                Payment Method: <strong>{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</strong>
              </p>
              <p>
                Payment Status: <strong>{order.paymentStatus}</strong>
              </p>
              {order.razorpayPaymentId && (
                <p className="font-mono text-[10px] text-gray-400">Ref: {order.razorpayPaymentId}</p>
              )}
              {order.paidAt && <p>Paid on {new Date(order.paidAt).toLocaleString("en-IN")}</p>}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#2874f0]" />
              <span className="font-semibold">Need help with this order?</span>
            </div>
            <Link href="/help" className="font-bold underline text-blue-700 whitespace-nowrap">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
