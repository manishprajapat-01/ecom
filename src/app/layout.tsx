import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryStrip } from "@/components/layout/CategoryStrip";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { SITE_CONFIG } from "@/lib/config";
import { getCategories } from "@/lib/services/catalog";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${SITE_CONFIG.storeName} - Online Shopping Marketplace India`,
  description: "Shop Mobiles, Laptops, Electronics, Fashion, Home Appliances, Kitchen Essentials, and Groceries at best prices with fast delivery and authentic assurance.",
  keywords: ["online shopping", "e-commerce", "india", "electronics", "fashion", "smartphones", "appliances"],
  openGraph: {
    title: `${SITE_CONFIG.storeName} - India's Favorite Shopping Destination`,
    description: "Best deals on smartphones, electronics, fashion, and home appliances.",
    url: SITE_CONFIG.appUrl,
    siteName: SITE_CONFIG.storeName,
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Navigation categories are non-critical: never let a DB hiccup take down every page.
  const categories = await getCategories().catch((err) => {
    console.error("[layout] Failed to load categories", err);
    return [];
  });
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#f1f3f6]`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <CategoryStrip categories={categories} />
              <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-20 sm:py-4">
                {children}
              </main>
              <MobileBottomNav />
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
