"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Package,
  MapPin,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { SITE_CONFIG } from "@/lib/config";

export function Navbar() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1 rounded hover:bg-blue-700"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex flex-col items-start leading-none group">
              <span className="text-xl sm:text-2xl font-black italic tracking-wide text-white flex items-center gap-1">
                {SITE_CONFIG.storeName}
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </span>
              <span className="text-[11px] font-medium text-yellow-200 italic flex items-center gap-0.5 mt-0.5">
                Explore <span className="text-yellow-400 font-bold">Plus</span>
                <span className="text-yellow-300">✦</span>
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl relative hidden sm:block"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 rounded-sm py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner placeholder-gray-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 text-[#2874f0] hover:text-blue-700 flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Navigation Items */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Account / Login Dropdown */}
            <div className="relative">
              {user ? (
                <div
                  className="relative"
                  onMouseEnter={() => setIsAccountOpen(true)}
                  onMouseLeave={() => setIsAccountOpen(false)}
                >
                  <button className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-sm hover:bg-blue-600 rounded transition-colors">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.name || user.phone}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  {isAccountOpen && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white text-gray-800 rounded shadow-xl border border-gray-100 py-1.5 animate-fade-in text-sm font-medium">
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                          <p className="font-bold text-gray-900 truncate">{user.name || "Customer"}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                          {user.role === "ADMIN" && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                              ADMIN ACCESS
                            </span>
                          )}
                        </div>

                        <Link
                          href="/account"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          My Profile
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Package className="w-4 h-4 text-gray-500" />
                          Orders
                        </Link>
                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <MapPin className="w-4 h-4 text-gray-500" />
                          Saved Addresses
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Heart className="w-4 h-4 text-gray-500" />
                          Wishlist ({wishlistCount})
                        </Link>

                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold border-t border-b border-purple-100"
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                            Admin Dashboard
                          </Link>
                        )}

                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="bg-white text-[#2874f0] font-bold text-sm px-5 py-1.5 rounded-sm hover:bg-gray-100 transition shadow-sm"
                  >
                    Login
                  </Link>

                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-blue-600 rounded transition-colors hidden sm:flex items-center gap-1 font-semibold text-sm"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#2874f0]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 rounded font-bold text-sm transition-colors relative"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-yellow-400 text-blue-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#2874f0] shadow-sm animate-pulse">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for Products, Brands and More"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-sm py-2 pl-3 pr-10 text-sm focus:outline-none placeholder-gray-500 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 text-[#2874f0]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white text-gray-800 border-t border-blue-600 shadow-2xl py-3 px-4">
          <div className="space-y-2 font-medium text-sm">
            {user ? (
              <div className="pb-2 border-b border-gray-200">
                <p className="font-bold text-gray-900">{user.name || "Customer"}</p>
                <p className="text-xs text-gray-500">{user.phone}</p>
              </div>
            ) : (
              <div className="flex gap-2 pb-2 border-b border-gray-200">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-1.5 bg-[#2874f0] text-white text-xs font-bold rounded text-center"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}

            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-blue-600"
            >
              All Products & Deals
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-blue-600"
            >
              Wishlist ({wishlistCount})
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-blue-600"
            >
              My Orders
            </Link>
            <Link
              href="/account/addresses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-blue-600"
            >
              Saved Addresses
            </Link>
            <Link
              href="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-blue-600"
            >
              24x7 Customer Care
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-purple-700 font-bold"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
