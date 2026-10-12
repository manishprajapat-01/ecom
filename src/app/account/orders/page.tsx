"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Package, Search, ChevronRight, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { OrderRecord } from "@/lib/order-types";

function statusBadge(order: OrderRecord) {
  if (order.status === "DELIVERED") {
    return (
      <span className="flex items-center gap-1.5 font-bold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" /> Delivered
      </span>
    );
  }
  if (order.status === "CANCELLED" || order.status === "RETURNED") {
    return (
      <span className="flex items-center gap-1.5 font-bold text-red-600">
        <XCircle className="w-4 h-4" /> {order.status === "RETURNED" ? "Returned" : "Cancelled"}
      </span>
    );
  }
  if (order.paymentMethod !== "COD" && order.paymentStatus !== "PAID") {
    return (
      <span className="flex items-center gap-1.5 font-bold text-amber-700">
        <AlertTriangle className="w-4 h-4" /> Payment Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 font-bold text-blue-700">
      <Clock className="w-4 h-4" /> <span className="uppercase">{order.status.replace(/_/g, " ")}</span>
    </span>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load orders");
        setOrders(data.orders || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const q = search.toLowerCase();
  const filteredOrders = orders.filter(
    (o) => o.orderNumber.toLowerCase().includes(q) || o.items.some((i) => i.title.toLowerCase().includes(q))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <AccountSidebar />

      <div className="flex-1 w-full space-y-4 min-w-0">
        <div className="bg-white rounded-sm border border-gray-200 p-3 shadow-xs flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your orders by product name or order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">{error}</div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-sm border border-gray-200 p-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-sm border border-gray-200 p-12 text-center shadow-xs">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No orders found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {orders.length === 0 ? "Looks like you haven't placed any orders yet." : "No orders match your search."}
            </p>
            <Link href="/products" className="inline-block mt-4 px-6 py-2 bg-[#2874f0] text-white text-xs font-bold rounded-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-sm border border-gray-200 hover:border-gray-300 transition shadow-xs divide-y divide-gray-100"
              >
                <div className="p-3 bg-gray-50/70 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-gray-500 text-[11px]">ORDER PLACED</span>
                      <p className="font-semibold text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px]">TOTAL</span>
                      <p className="font-bold text-gray-900">{formatCurrency(order.finalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px]">SHIP TO</span>
                      <p className="font-semibold text-gray-800 truncate max-w-[140px]">{order.address.fullName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-500 text-[11px]">ORDER #{order.orderNumber}</span>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-[#2874f0] font-bold hover:underline flex items-center gap-0.5 justify-end mt-0.5"
                    >
                      Order Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 relative bg-gray-50 border rounded p-1 shrink-0">
                        {item.image && <Image src={item.image} alt={item.title} fill sizes="64px" className="object-contain" />}
                      </div>

                      <div className="flex-1 text-xs min-w-0">
                        <Link href={`/account/orders/${order.id}`} className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-1">
                          {item.title}
                        </Link>
                        <p className="text-gray-500 mt-0.5">
                          Qty: {item.quantity} • {formatCurrency(item.price)} each
                        </p>
                      </div>

                      <div className="text-right text-xs shrink-0">
                        {statusBadge(order)}
                        <p className="text-[11px] text-gray-500 mt-1">
                          {order.paymentMethod} • {order.paymentStatus}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}
