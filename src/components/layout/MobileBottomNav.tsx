"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3X3, Home, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const hiddenRoutes = ["/login", "/admin"];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { itemCount } = useCart();

  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  const accountHref = user ? "/account" : "/login?next=/account";
  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    {
      href: "/products",
      label: "Categories",
      icon: Grid3X3,
      active: pathname === "/products" || pathname.startsWith("/categories"),
    },
    {
      href: accountHref,
      label: "Account",
      icon: User,
      active: pathname.startsWith("/account"),
    },
    {
      href: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      active: pathname === "/cart",
      count: itemCount,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] sm:hidden">
      <div className="grid h-full grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                item.active ? "text-[#2874f0]" : "text-gray-700"
              }`}
            >
              <span className="relative">
                <Icon className={`h-6 w-6 ${item.active ? "stroke-[2.6]" : "stroke-2"}`} />
                {item.count ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-black leading-none text-blue-900">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                ) : null}
              </span>
              <span className={item.active ? "font-bold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
