"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Search, Loader2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUSES, type OrderRecord, type OrderStatus } from "@/lib/order-types";
import { StatusBadge, PAYMENT_STYLES } from "@/components/admin/StatusBadge";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>(
    initialStatus && (ORDER_STATUSES as string[]).includes(initialStatus) ? (initialStatus as OrderStatus) : ""
  );
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    setIsLoading(true);
    fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load orders");
        if (cancelled) return;
        setOrders(data.orders || []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const q = search.toLowerCase();
  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.address.phone.includes(search) ||
      o.address.fullName.toLowerCase().includes(q) ||
      (o.customer?.phone || "").includes(search) ||
      (o.customer?.name || "").toLowerCase().includes(q) ||
      (o.razorpayPaymentId || "").toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Orders & Fulfillment</h1>
          <p className="text-xs text-gray-500">Track payments, update shipment status and manage fulfillment</p>
        </div>

        <a
          href="/api/admin/orders/export"
          download
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded border border-gray-300 flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-sm border border-gray-200 p-3 shadow-xs flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, phone or payment id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | OrderStatus)}
          className="p-1.5 border rounded bg-white text-xs font-medium"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-sm border border-gray-200 shadow-xs overflow-x-auto text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
              <th className="p-3 w-8"></th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const expanded = expandedId === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3">
                        <button onClick={() => setExpandedId(expanded ? null : order.id)} className="text-gray-400 hover:text-gray-700">
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3">
                        <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">{order.address.fullName || order.customer?.name || "—"}</p>
                        <p className="text-gray-400 text-[11px]">{order.address.phone || order.customer?.phone}</p>
                      </td>
                      <td className="p-3 text-gray-600">{order.items.reduce((n, i) => n + i.quantity, 0)} items</td>
                      <td className="p-3 font-bold text-gray-900">{formatCurrency(order.finalAmount)}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 font-bold rounded text-[10px] ${PAYMENT_STYLES[order.paymentStatus] || ""}`}>
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={order.status}
                          disabled={busyId === order.id}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="p-1 border rounded bg-white text-xs font-medium disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <h4 className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wider">Items</h4>
                              <ul className="divide-y divide-gray-200 bg-white border rounded">
                                {order.items.map((item) => (
                                  <li key={item.id} className="flex justify-between p-2 gap-3">
                                    <span className="text-gray-800 truncate">
                                      {item.title} <span className="text-gray-400">× {item.quantity}</span>
                                    </span>
                                    <span className="font-semibold shrink-0">{formatCurrency(item.total)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 text-[11px] text-gray-600 space-y-0.5">
                                <p>Subtotal: {formatCurrency(order.totalAmount)}</p>
                                {order.discountAmount > 0 && <p className="text-emerald-700">Discount: −{formatCurrency(order.discountAmount)}</p>}
                                <p>Delivery: {order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee)}</p>
                                <p className="font-bold text-gray-900">Total: {formatCurrency(order.finalAmount)}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Shipping Address
                              </h4>
                              <div className="bg-white border rounded p-2 text-gray-700 leading-relaxed">
                                <p className="font-semibold">{order.address.fullName}</p>
                                <p>
                                  {order.address.houseFlat}, {order.address.street}
                                </p>
                                {order.address.landmark && <p>Landmark: {order.address.landmark}</p>}
                                <p>
                                  {order.address.city}, {order.address.state} - {order.address.pinCode}
                                </p>
                                <p>Phone: {order.address.phone}</p>
                              </div>
                              <div className="mt-2 text-[11px] text-gray-500 space-y-0.5 font-mono break-all">
                                {order.razorpayOrderId && <p>RZP Order: {order.razorpayOrderId}</p>}
                                {order.razorpayPaymentId && <p>RZP Payment: {order.razorpayPaymentId}</p>}
                                {order.paidAt && <p className="font-sans">Paid at: {new Date(order.paidAt).toLocaleString("en-IN")}</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
