"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Heart,
  ShieldAlert,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AccountSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-full lg:w-64 space-y-3 shrink-0">
      {/* Profile Card */}
      <div className="bg-white rounded-sm border border-gray-200 p-4 flex items-center gap-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2874f0] flex items-center justify-center font-bold text-lg shrink-0">
          {user?.name ? user.name[0].toUpperCase() : "U"}
        </div>
        <div className="overflow-hidden">
          <p className="text-[11px] text-gray-500 font-medium">Hello,</p>
          <p className="text-sm font-bold text-gray-900 truncate">
            {user?.name || user?.phone || "Valued Customer"}
          </p>
          {user?.role === "ADMIN" && (
            <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-sm border border-gray-200 shadow-xs divide-y divide-gray-100 text-xs">
        <div className="p-3">
          <Link
            href="/account/orders"
            className={`flex items-center gap-3 p-2 rounded transition-colors font-semibold ${
              pathname.startsWith("/account/orders")
                ? "bg-blue-50 text-[#2874f0]"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Package className="w-4 h-4 text-blue-600" />
            MY ORDERS
          </Link>
        </div>

        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
            Account Settings
          </p>
          <Link
            href="/account"
            className={`flex items-center gap-3 p-2 rounded transition-colors font-medium ${
              pathname === "/account"
                ? "bg-blue-50 text-[#2874f0] font-bold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Information
          </Link>
          <Link
            href="/account/addresses"
            className={`flex items-center gap-3 p-2 rounded transition-colors font-medium ${
              pathname === "/account/addresses"
                ? "bg-blue-50 text-[#2874f0] font-bold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Manage Addresses
          </Link>
        </div>

        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
            My Stuff
          </p>
          <Link
            href="/wishlist"
            className={`flex items-center gap-3 p-2 rounded transition-colors font-medium ${
              pathname === "/wishlist"
                ? "bg-blue-50 text-[#2874f0] font-bold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Heart className="w-4 h-4" />
            My Wishlist
          </Link>
        </div>

        {user?.role === "ADMIN" && (
          <div className="p-3 bg-purple-50/50">
            <Link
              href="/admin"
              className="flex items-center gap-3 p-2 rounded text-purple-700 font-bold hover:bg-purple-100 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Admin Portal
            </Link>
          </div>
        )}

        <div className="p-3">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 p-2 rounded text-red-600 hover:bg-red-50 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
