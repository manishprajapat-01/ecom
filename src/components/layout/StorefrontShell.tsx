"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryStrip } from "@/components/layout/CategoryStrip";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import type { CatalogCategory } from "@/lib/data/sample-catalog";

interface StorefrontShellProps {
  categories: CatalogCategory[];
  children: React.ReactNode;
}

export function StorefrontShell({ categories, children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-screen w-full bg-[#f4f7fc] text-slate-900">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <CategoryStrip categories={categories} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-20 sm:py-4">
        {children}
      </main>
      <MobileBottomNav />
      <Footer />
    </>
  );
}
