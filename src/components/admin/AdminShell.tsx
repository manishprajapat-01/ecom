"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, ArrowLeft, Shield, Layers } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

interface AdminShellProps {
  adminName: string;
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Products Catalog", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Orders & Fulfillment", href: "/admin/orders", icon: ShoppingBag },
];

export function AdminShell({ adminName, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {/* Admin Top Header Banner */}
      <div className="bg-[#172337] text-white p-3.5 rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-purple-600 rounded">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide flex items-center gap-2">
              {SITE_CONFIG.storeName} Merchant Portal
              <span className="text-[10px] bg-purple-500/50 text-purple-200 px-2 py-0.5 rounded font-mono uppercase">
                ADMIN CONSOLE
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">Logged in as {adminName}</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> View Storefront
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Admin Navigation Sidebar */}
        <aside className="md:col-span-3 bg-white rounded-sm border border-gray-200 p-2 shadow-xs flex md:flex-col gap-1 overflow-x-auto text-xs">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold transition-colors whitespace-nowrap ${
                  isActive ? "bg-[#2874f0] text-white shadow-xs" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Admin Main Body */}
        <main className="md:col-span-9 min-w-0">{children}</main>
      </div>
    </div>
  );
}
