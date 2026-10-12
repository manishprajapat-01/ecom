import Link from "next/link";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { DealsSection } from "@/components/home/DealsSection";
import { getProducts } from "@/lib/services/catalog";
import { BadgePercent, CreditCard, Gift, RotateCcw, Shield, Smartphone, Truck, Zap } from "lucide-react";

// Deals, prices and stock are live; render per request like the rest of the catalog.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products: topElectronics } = await getProducts({
    categorySlug: "electronics",
    limit: 4,
    sort: "popular",
  });

  const { products: topMobiles } = await getProducts({
    categorySlug: "mobiles-tablets",
    limit: 4,
    sort: "popular",
  });

  const { products: topFashion } = await getProducts({
    categorySlug: "fashion",
    limit: 4,
    sort: "popular",
  });

  const { products: topHome } = await getProducts({
    categorySlug: "home-kitchen",
    limit: 4,
    sort: "popular",
  });

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="grid grid-cols-4 bg-white border border-gray-100 rounded-sm shadow-xs text-center sm:hidden">
        <Link href="/products?sort=popular" className="px-2 py-2.5 border-r border-gray-100">
          <BadgePercent className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Top Deals</span>
        </Link>
        <Link href="/categories/mobiles-tablets" className="px-2 py-2.5 border-r border-gray-100">
          <Smartphone className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Mobiles</span>
        </Link>
        <Link href="/cart" className="px-2 py-2.5 border-r border-gray-100">
          <Truck className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Fast Ship</span>
        </Link>
        <Link href="/account/orders" className="px-2 py-2.5">
          <RotateCcw className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Orders</span>
        </Link>
      </div>

      <BannerCarousel />

      <div className="bg-white sm:bg-gradient-to-r sm:from-blue-700 sm:via-indigo-600 sm:to-blue-800 text-gray-900 sm:text-white rounded-sm px-3 sm:px-4 py-2.5 sm:py-3 shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm border border-gray-100 sm:border-0">
        <div className="flex min-w-0 items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#2874f0] sm:text-yellow-300 shrink-0" />
          <div className="min-w-0 truncate">
            <span className="font-bold">Bank Offers</span>
            <span className="ml-1 text-gray-600 sm:text-blue-100">10% instant discount, No Cost EMI</span>
          </div>
        </div>
        <Link
          href="/products"
          className="bg-[#2874f0] sm:bg-yellow-400 hover:bg-blue-700 sm:hover:bg-yellow-300 text-white sm:text-blue-950 font-bold px-3 py-1.5 rounded-sm text-[11px] sm:text-xs transition shrink-0"
        >
          VIEW
        </Link>
      </div>

      <DealsSection
        title="Best of Electronics & Gadgets"
        subtitle="Headphones, Smart Watches, Laptops & More"
        viewAllLink="/categories/electronics"
        products={topElectronics}
        isHot={true}
      />

      <DealsSection
        title="Top Smartphones & 5G Devices"
        subtitle="Latest Launches from Apple, Samsung, OnePlus & More"
        viewAllLink="/categories/mobiles-tablets"
        products={topMobiles}
      />

      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-sm p-3.5 sm:p-6 text-white shadow-xs flex flex-col justify-between min-h-[132px] sm:min-h-[160px]">
          <div>
            <span className="bg-emerald-800/80 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Home Fest
            </span>
            <h3 className="text-sm leading-5 sm:text-xl font-black mt-2">Up to 60% Off Kitchen Picks</h3>
            <p className="text-[10px] sm:text-xs text-emerald-100 mt-1">Top appliances and cookware</p>
          </div>
          <Link
            href="/categories/home-kitchen"
            className="self-start mt-3 sm:mt-4 bg-white text-emerald-800 font-bold text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm hover:bg-emerald-50 transition"
          >
            Explore
          </Link>
        </div>

        <div className="bg-gradient-to-r from-rose-600 to-pink-700 rounded-sm p-3.5 sm:p-6 text-white shadow-xs flex flex-col justify-between min-h-[132px] sm:min-h-[160px]">
          <div>
            <span className="bg-rose-800/80 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Festive Wardrobe
            </span>
            <h3 className="text-sm leading-5 sm:text-xl font-black mt-2">Fashion Starting Rs. 679</h3>
            <p className="text-[10px] sm:text-xs text-rose-100 mt-1">Easy 7-day exchanges</p>
          </div>
          <Link
            href="/categories/fashion"
            className="self-start mt-3 sm:mt-4 bg-white text-rose-800 font-bold text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm hover:bg-rose-50 transition"
          >
            Explore
          </Link>
        </div>
      </div>

      <DealsSection
        title="Trending Fashion & Apparel"
        subtitle="Handpicked Kurtas, Casual Shirts & Footwear"
        viewAllLink="/categories/fashion"
        products={topFashion}
      />

      <DealsSection
        title="Home & Kitchen Essentials"
        subtitle="Cookware, Appliances & Utensils for Every Indian Home"
        viewAllLink="/categories/home-kitchen"
        products={topHome}
      />

      <div className="bg-white rounded-sm p-3 sm:p-6 border border-gray-100 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[#2874f0]" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-800">Superfast Dispatch</h4>
          <p className="text-[10px] sm:text-xs text-gray-500">Within 24 hours</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#2874f0]" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-800">Genuine Assured</h4>
          <p className="text-[10px] sm:text-xs text-gray-500">Quality checked</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-[#2874f0]" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-800">Reward Coins</h4>
          <p className="text-[10px] sm:text-xs text-gray-500">On every order</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-[#2874f0]" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-800">Safe UPI & COD</h4>
          <p className="text-[10px] sm:text-xs text-gray-500">Cards supported</p>
        </div>
      </div>
    </div>
  );
}
