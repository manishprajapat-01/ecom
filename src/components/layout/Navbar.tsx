"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Store,
  HelpCircle,
  Bell,
  Download,
  Gift,
  Coins,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { FlipkartLogo } from "./FlipkartLogo";

const POPULAR_SEARCHES = [
  "iPhone 15",
  "Smart Watch",
  "Wireless Earbuds",
  "5G Smartphone",
  "Running Shoes",
  "T-Shirts",
  "Laptop",
  "Smart TV 43 Inch",
];

export function Navbar() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded hover:bg-blue-700 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <FlipkartLogo variant="white" size="md" showSubtext={true} />
          </div>

          {/* Desktop Search Bar with Trending Suggestions */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-white text-gray-900 rounded-xs py-2.5 pl-4 pr-11 text-sm focus:outline-none shadow-sm placeholder-gray-500 font-normal"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 text-[#2874f0] hover:text-blue-700 flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Search Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white text-gray-800 rounded-sm shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#2874f0]" />
                    Discover More
                  </span>
                  <span className="text-[10px] text-gray-400">Popular on Flipkart</span>
                </div>
                <div className="py-1">
                  {POPULAR_SEARCHES.filter((item) =>
                    item.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-[#2874f0] flex items-center gap-3 transition-colors text-gray-700"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Navigation Items */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Account / Login Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsAccountOpen(true)}
              onMouseLeave={() => setIsAccountOpen(false)}
            >
              {user ? (
                <button className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-sm hover:bg-blue-600 rounded transition-colors">
                  <User className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{user.name || user.phone}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${isAccountOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-white text-[#2874f0] font-bold text-sm px-7 py-1 rounded-xs hover:bg-gray-50 transition shadow-xs inline-block tracking-wide"
                >
                  Login
                </Link>
              )}

              {/* Flyout Menu (Works for both Logged In & Logged Out) */}
              {isAccountOpen && (
                <div className="absolute right-0 top-full pt-2 w-60 z-50">
                  <div className="bg-white text-gray-800 rounded-sm shadow-2xl border border-gray-100 py-1.5 animate-fade-in text-sm font-medium">
                    {!user ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-600">New customer?</span>
                          <Link href="/login" className="text-[#2874f0] font-bold hover:underline">
                            Sign Up
                          </Link>
                        </div>
                        <Link
                          href="/login"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          My Profile
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <Coins className="w-4 h-4 text-yellow-500" />
                          Flipkart Plus Zone
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <Package className="w-4 h-4 text-gray-500" />
                          Orders
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <Heart className="w-4 h-4 text-gray-500" />
                          Wishlist ({wishlistCount})
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <Gift className="w-4 h-4 text-gray-500" />
                          Rewards
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                        >
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          Gift Cards
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                          <p className="font-bold text-gray-900 truncate">{user.name || "Flipkart Customer"}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                          {user.role === "ADMIN" && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                              ADMIN ACCESS
                            </span>
                          )}
                        </div>

                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0]"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          My Profile
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0]"
                        >
                          <Coins className="w-4 h-4 text-yellow-500" />
                          Flipkart Plus Zone
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0]"
                        >
                          <Package className="w-4 h-4 text-gray-500" />
                          Orders
                        </Link>
                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0]"
                        >
                          <MapPin className="w-4 h-4 text-gray-500" />
                          Saved Addresses
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#2874f0]"
                        >
                          <Heart className="w-4 h-4 text-gray-500" />
                          Wishlist ({wishlistCount})
                        </Link>

                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold border-t border-b border-purple-100"
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                            Admin Dashboard
                          </Link>
                        )}

                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 text-left border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Become a Seller link (Iconic Flipkart Header element) */}
            <Link
              href="/admin"
              className="hidden lg:flex items-center gap-1.5 font-bold text-sm hover:text-yellow-200 transition-colors"
              title="Become a Seller on Flipkart"
            >
              <Store className="w-4 h-4" />
              <span>Become a Seller</span>
            </Link>

            {/* "More" Dropdown Menu */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setIsMoreOpen(true)}
              onMouseLeave={() => setIsMoreOpen(false)}
            >
              <button className="flex items-center gap-1 font-bold text-sm hover:text-yellow-200 transition-colors py-1.5">
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50">
                  <div className="bg-white text-gray-800 rounded-sm shadow-2xl border border-gray-100 py-1.5 animate-fade-in text-sm font-medium">
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                    >
                      <Bell className="w-4 h-4 text-gray-500" />
                      Notification Preferences
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      24x7 Customer Care
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874f0] transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      Advertise
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874f0] transition-colors border-t border-gray-100"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                      Download App
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon & Label */}
            <Link
              href="/cart"
              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-blue-600 rounded font-bold text-sm transition-colors relative"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#ffe500] text-blue-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#2874f0] shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for Products, Brands and More"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-xs py-2 pl-3.5 pr-10 text-sm focus:outline-none placeholder-gray-500 shadow-inner"
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
              <div className="pb-3 border-b border-gray-200">
                <p className="font-bold text-gray-900">{user.name || "Flipkart Customer"}</p>
                <p className="text-xs text-gray-500">{user.phone}</p>
              </div>
            ) : (
              <div className="flex gap-2 pb-3 border-b border-gray-200">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-2 bg-[#2874f0] text-white text-xs font-bold rounded text-center shadow-xs"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}

            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-[#2874f0] font-semibold text-gray-700"
            >
              All Products & Top Offers
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 hover:text-[#2874f0] text-gray-700"
            >
              <span>My Wishlist</span>
              <span className="text-xs font-bold bg-blue-50 text-[#2874f0] px-2 py-0.5 rounded-full">
                {wishlistCount}
              </span>
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-[#2874f0] text-gray-700"
            >
              My Orders
            </Link>
            <Link
              href="/account/addresses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-[#2874f0] text-gray-700"
            >
              Saved Addresses
            </Link>
            <Link
              href="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 hover:text-[#2874f0] text-gray-700"
            >
              24x7 Customer Care & Help
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#2874f0] font-bold"
            >
              Become a Seller / Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
