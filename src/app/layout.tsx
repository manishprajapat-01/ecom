import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { SITE_CONFIG } from "@/lib/config";
import { getCategories } from "@/lib/services/catalog";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Online Shopping Site for Mobiles, Electronics, Furniture, Grocery, Lifestyle, Books & More. Best Offers! | Flipkart",
  description: "Shop for electronics, apparels & more using Flipkart. Free shipping & COD. Explore top brands & best deals in India.",
  keywords: ["online shopping", "flipkart", "india", "electronics", "fashion", "smartphones", "appliances", "grocery"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Flipkart - India's Favorite Shopping Destination",
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
              <StorefrontShell categories={categories}>{children}</StorefrontShell>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
