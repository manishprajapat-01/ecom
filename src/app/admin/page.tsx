"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Plus,
  Clock,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUSES, type OrderRecord } from "@/lib/order-types";
import { StatusBadge, PAYMENT_STYLES } from "@/components/admin/StatusBadge";

interface AdminStats {
  totalRevenuePaise: number;
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Array<{ id: string; title: string; stock: number; sku?: string }>;
  recentOrders: OrderRecord[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update order status");
      return;
    }
    loadStats();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-sm border border-gray-200 p-8 text-center text-xs text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 rounded-sm border border-red-200 p-8 text-center text-xs text-red-700 font-medium">
        {error || "Dashboard data unavailable."}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Revenue (paid)",
      value: formatCurrency(stats.totalRevenuePaise),
      sub: "Verified Razorpay payments",
      icon: IndianRupee,
      color: "text-emerald-600",
    },
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      sub: `${stats.todayOrders} placed today`,
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      label: "Pending Fulfilment",
      value: String(stats.pendingOrders),
      sub: "Awaiting processing / shipping",
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Catalog Items",
      value: String(stats.totalProducts),
      sub: `${stats.lowStockCount} low on stock`,
      icon: Package,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">{error}</div>}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
              <span>{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{card.value}</div>
            <span className={`text-[10px] ${card.color} font-bold flex items-center gap-0.5 mt-1`}>
              <ArrowUpRight className="w-3 h-3" /> {card.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 border rounded-sm">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="px-3 py-1.5 bg-[#2874f0] text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-blue-700 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Product
          </Link>
          <Link
            href="/admin/orders?status=PENDING"
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-xs font-bold rounded flex items-center gap-1 hover:bg-gray-200 border border-gray-300"
          >
            <Clock className="w-3.5 h-3.5" /> Pending Orders
          </Link>
          <a
            href="/api/admin/orders/export"
            download
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-xs font-bold rounded flex items-center gap-1 hover:bg-gray-200 border border-gray-300"
          >
            <Download className="w-3.5 h-3.5" /> Export Orders CSV
          </a>
        </div>

        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </span>
      </div>

      {/* Low Stock */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Low Stock Alert (&le;15 units remaining)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {stats.lowStockProducts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="bg-white p-2 rounded border border-amber-100 flex justify-between hover:border-amber-300"
              >
                <span className="truncate max-w-[180px] font-medium text-gray-800">{p.title}</span>
                <span className={`font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs text-[#2874f0] font-bold hover:underline">
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Items</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Payment</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-bold text-gray-900 font-mono">{order.orderNumber}</td>
                    <td className="py-2.5 text-gray-700">{order.address.fullName || order.customer?.name || "—"}</td>
                    <td className="py-2.5 text-gray-600">{order.items.reduce((n, i) => n + i.quantity, 0)} items</td>
                    <td className="py-2.5 font-bold text-gray-900">{formatCurrency(order.finalAmount)}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 font-bold rounded text-[10px] ${PAYMENT_STYLES[order.paymentStatus] || ""}`}>
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="p-1 border rounded bg-white text-xs font-medium"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
