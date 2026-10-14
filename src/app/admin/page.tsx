"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Sparkles,
  IndianRupee,
  ShoppingBag,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package,
  Layers,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Store,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge, PAYMENT_STYLES } from "@/components/admin/StatusBadge";
import { type OrderRecord } from "@/lib/order-types";
import { useAuth } from "@/context/AuthContext";
import { SITE_CONFIG } from "@/lib/config";

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
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="w-8 h-8 text-[#2874f0] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading Dashboard...</span>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard data");
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadStats();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#2874f0] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Store Overview &amp; Analytics...</span>
      </div>
    );
  }

  const revenuePaise = stats?.totalRevenuePaise ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const todayOrders = stats?.todayOrders ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const lowStockCount = stats?.lowStockCount ?? 0;
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const recentOrders = stats?.recentOrders ?? [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Storefront Management Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a3a8f] via-[#2874f0] to-[#1250b8] p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs font-bold text-yellow-300 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Frontend CMS Control Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome back, {user?.name || "Store Administrator"}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 leading-relaxed font-medium">
              You have full real-time control over the entire {SITE_CONFIG.storeName} storefront. Manage hero carousel slides, flash deals, categories, and customer orders directly from this console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/storefront"
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Manage Storefront</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(revenuePaise)}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>All-time net revenue</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2874f0] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{totalOrders}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              <span className="font-bold text-[#2874f0]">+{todayOrders} today</span> · Total volume
            </p>
          </div>
        </div>

        {/* Metric 3: Pending Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Fulfillment</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{pendingOrders}</h3>
            <Link
              href="/admin/orders?status=PENDING"
              className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 hover:underline"
            >
              <span>Review pending orders</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4: Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Products</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{totalProducts}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500">
              {lowStockCount > 0 ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} low stock
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy inventory
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Frontend Actions Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#2874f0]" />
            <h2 className="text-sm font-bold text-slate-800">Quick Storefront Actions</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">1-Click Configuration</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/storefront"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2874f0] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Edit Hero Banners</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Slides, badges &amp; CTAs</p>
            </div>
          </Link>

          <Link
            href="/admin/products/new"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Add New Product</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Upload images &amp; prices</p>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Manage Categories</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Nav strip &amp; hierarchy</p>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Track Shipments</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Update delivery statuses</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Customer Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#2874f0]" />
                <h2 className="text-sm font-bold text-slate-800">Recent Customer Orders</h2>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#2874f0] hover:underline flex items-center gap-1"
              >
                <span>View All ({totalOrders})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Orders Table */}
            <div className="mt-3 overflow-x-auto">
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No orders have been placed yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-3 font-mono font-bold text-slate-800">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                            {order.customer?.name || order.address?.fullName || "Guest Customer"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {order.customer?.phone || order.address?.phone}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="text-[11px] font-bold p-1 border rounded-lg border-slate-200 bg-white text-slate-700 outline-none focus:border-[#2874f0] cursor-pointer"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Showing latest {Math.min(5, recentOrders.length)} orders</span>
            <Link href="/admin/orders" className="text-[#2874f0] font-bold hover:underline">
              Go to Order Manager &rarr;
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Inventory Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-800">Inventory Watchlist</h2>
              </div>
              <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                &le; 15 units
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  All catalog products have sufficient inventory.
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || p.id}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-rose-100 text-rose-700">
                        {p.stock} left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/admin/products"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <span>Manage All Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
