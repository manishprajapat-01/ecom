import Link from "next/link";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { DealsSection } from "@/components/home/DealsSection";
import { getProducts } from "@/lib/services/catalog";
import { getStorefrontConfig } from "@/lib/services/storefront";
import {
  BadgePercent,
  CreditCard,
  Gift,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Truck,
  Zap,
  Plane,
  Coins,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [storefront, { products: topElectronics }, { products: topMobiles }, { products: topFashion }, { products: topHome }] =
    await Promise.all([
      getStorefrontConfig(),
      getProducts({ categorySlug: "electronics", limit: 6, sort: "popular" }),
      getProducts({ categorySlug: "mobiles-tablets", limit: 6, sort: "popular" }),
      getProducts({ categorySlug: "fashion", limit: 6, sort: "popular" }),
      getProducts({ categorySlug: "home-kitchen", limit: 6, sort: "popular" }),
    ]);

  const activeBanners = storefront.banners.filter((b) => b.isActive !== false);
  const { bankOffers, promoCards, dealsSection, featuredBrands, storeSettings } = storefront;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Announcement Notification Strip if active */}
      {storeSettings?.showAnnouncement && storeSettings?.announcementText && (
        <div className="bg-[#2874f0] text-white px-3 py-1.5 sm:py-2 text-xs font-semibold text-center rounded-xs shadow-2xs flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span>{storeSettings.announcementText}</span>
        </div>
      )}

      {/* Mobile Quick Action Strip */}
      <div className="grid grid-cols-4 bg-white border border-gray-200 rounded-xs shadow-2xs text-center sm:hidden">
        <Link href="/products?sort=popular" className="px-2 py-2.5 border-r border-gray-100 hover:bg-blue-50">
          <BadgePercent className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Top Deals</span>
        </Link>
        <Link href="/categories/mobiles-tablets" className="px-2 py-2.5 border-r border-gray-100 hover:bg-blue-50">
          <Smartphone className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Mobiles</span>
        </Link>
        <Link href="/cart" className="px-2 py-2.5 border-r border-gray-100 hover:bg-blue-50">
          <Truck className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Fast Ship</span>
        </Link>
        <Link href="/account/orders" className="px-2 py-2.5 hover:bg-blue-50">
          <RotateCcw className="w-5 h-5 mx-auto text-[#2874f0]" />
          <span className="mt-1 block text-[10px] leading-3 font-bold text-gray-700">Orders</span>
        </Link>
      </div>

      {/* Hero Carousel Banner Managed by Admin */}
      <BannerCarousel initialBanners={activeBanners} />

      {/* Bank Offers & SuperCoins Banner Strip */}
      {bankOffers?.enabled && (
        <div className="bg-white border border-gray-200 rounded-xs p-2.5 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#2874f0] font-black">
              <CreditCard className="w-5 h-5 shrink-0" />
              <span>{bankOffers.title || "Bank Offers:"}</span>
            </div>
            <p className="text-gray-700 font-medium text-xs truncate">
              {bankOffers.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {bankOffers.badgeText && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                <Coins className="w-3.5 h-3.5 text-yellow-600" />
                {bankOffers.badgeText}
              </span>
            )}
            <Link
              href={bankOffers.buttonLink || "/products"}
              className="bg-[#2874f0] hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-xs text-[11px] sm:text-xs transition"
            >
              {bankOffers.buttonText || "EXPLORE"}
            </Link>
          </div>
        </div>
      )}

      {/* Deals of the Day (Live Flash Deals with Timer) */}
      <DealsSection
        title={dealsSection?.title || "Deals of the Day"}
        subtitle={dealsSection?.subtitle || "Refreshes every 24 hours with massive price drops"}
        viewAllLink={dealsSection?.viewAllLink || "/products"}
        products={topElectronics}
        isHot={dealsSection?.isHot ?? true}
        hasTimer={dealsSection?.hasTimer ?? true}
      />

      {/* Best of Electronics */}
      <DealsSection
        title="Best of Electronics & Gadgets"
        subtitle="Noise, boAt, Apple, Sony & Top Rated Brands"
        viewAllLink="/categories/electronics"
        products={topElectronics}
      />

      {/* Promotional Cards Strip (Flights + Pay Later) */}
      {promoCards?.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Promo Card 1 */}
          {promoCards.card1?.enabled !== false && (
            <div className={`bg-gradient-to-r ${promoCards.card1?.gradient || "from-blue-700 via-indigo-700 to-blue-900"} rounded-xs p-4 sm:p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden group`}>
              <div className="relative z-10 max-w-[70%]">
                <span className="inline-flex items-center gap-1 bg-[#ffe500] text-blue-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-xs uppercase">
                  <Plane className="w-3 h-3" />
                  {promoCards.card1?.badge || "Flipkart Flights"}
                </span>
                <h3 className="text-base sm:text-2xl font-black mt-2 leading-tight">
                  {promoCards.card1?.title}
                </h3>
                <p className="text-xs text-blue-100 mt-1">{promoCards.card1?.subtitle}</p>
                <Link
                  href={promoCards.card1?.buttonLink || "/categories/electronics"}
                  className="inline-block mt-3 bg-white text-[#2874f0] font-black text-xs px-4 py-1.5 rounded-xs hover:bg-yellow-300 hover:text-blue-950 transition"
                >
                  {promoCards.card1?.buttonText || "Book Tickets"}
                </Link>
              </div>
              <div className="text-white/20 group-hover:scale-110 transition-transform duration-300">
                <Plane className="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
            </div>
          )}

          {/* Promo Card 2 */}
          {promoCards.card2?.enabled !== false && (
            <div className={`bg-gradient-to-r ${promoCards.card2?.gradient || "from-emerald-700 via-teal-800 to-emerald-900"} rounded-xs p-4 sm:p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden group`}>
              <div className="relative z-10 max-w-[70%]">
                <span className="inline-flex items-center gap-1 bg-[#ffe500] text-emerald-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-xs uppercase">
                  <Zap className="w-3 h-3" />
                  {promoCards.card2?.badge || "Flipkart Pay Later"}
                </span>
                <h3 className="text-base sm:text-2xl font-black mt-2 leading-tight">
                  {promoCards.card2?.title}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">{promoCards.card2?.subtitle}</p>
                <Link
                  href={promoCards.card2?.buttonLink || "/account"}
                  className="inline-block mt-3 bg-white text-emerald-800 font-black text-xs px-4 py-1.5 rounded-xs hover:bg-yellow-300 hover:text-emerald-950 transition"
                >
                  {promoCards.card2?.buttonText || "Activate Now"}
                </Link>
              </div>
              <div className="text-white/20 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Smartphones & 5G Devices */}
      <DealsSection
        title="Top Smartphones & Flagships"
        subtitle="Latest 5G launches from Apple, Samsung, OnePlus & Realme"
        viewAllLink="/categories/mobiles-tablets"
        products={topMobiles}
      />

      {/* Trending Fashion & Apparel */}
      <DealsSection
        title="Trending Fashion & Apparel"
        subtitle="Kurtas, Casual Shirts, Running Shoes & Premium Watches"
        viewAllLink="/categories/fashion"
        products={topFashion}
      />

      {/* Home & Kitchen Essentials */}
      <DealsSection
        title="Home & Kitchen Essentials"
        subtitle="Cookware, Kitchen Appliances, Mixers & Decor"
        viewAllLink="/categories/home-kitchen"
        products={topHome}
      />

      {/* Featured Brands Grid Managed by Admin */}
      {featuredBrands && featuredBrands.length > 0 && (
        <section className="bg-white rounded-xs p-4 sm:p-6 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2874f0]" />
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                Featured Brands on {storeSettings?.storeName || "Flipkart"}
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-semibold">100% Brand Warranty</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {featuredBrands.map((b) => (
              <Link
                key={b.name}
                href={b.link}
                className="border border-gray-100 hover:border-blue-300 rounded-xs p-3 text-center flex flex-col items-center justify-center hover:shadow-sm transition group"
              >
                <span className="font-black text-gray-800 group-hover:text-[#2874f0] text-sm tracking-wide">
                  {b.logo}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold mt-1">
                  {b.deal}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flipkart Trust & Assurance Badges */}
      <div className="bg-white rounded-xs p-4 sm:p-6 border border-gray-200 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-black text-xs sm:text-sm text-gray-900">
            {storeSettings?.storeName || "Flipkart"} Assured
          </h4>
          <p className="text-[11px] text-gray-500">Rigorous 6-step quality check on products</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h4 className="font-black text-xs sm:text-sm text-gray-900">Superfast Delivery</h4>
          <p className="text-[11px] text-gray-500">Fast delivery across 19,000+ PIN codes</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h4 className="font-black text-xs sm:text-sm text-gray-900">Easy 7-Day Returns</h4>
          <p className="text-[11px] text-gray-500">Hassle-free replacement or full refund</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <h4 className="font-black text-xs sm:text-sm text-gray-900">SuperCoins Rewards</h4>
          <p className="text-[11px] text-gray-500">Earn coins and redeem for extra savings</p>
        </div>
      </div>

      {/* SEO & Brand Story Informational Footer Box */}
      <section className="bg-white rounded-xs p-4 sm:p-6 border border-gray-200 shadow-2xs text-gray-600 text-xs leading-relaxed space-y-4">
        <div>
          <h3 className="font-bold text-gray-800 text-sm mb-1">
            {storeSettings?.storeName || "Flipkart"}: The One-stop Shopping Destination
          </h3>
          <p>
            E-commerce is revolutionizing the way we all shop in India. Why hop from one store to another in search of the latest mobile phone when you can find it on the Internet in a single click? Not only mobiles, {storeSettings?.storeName || "Flipkart"} houses everything you can possibly imagine, from trending electronics like laptops, tablets, smartphones, and mobile accessories to in-vogue fashion staples like clothing, footwear, jewellery and accessories.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-800 text-xs mb-1">
            Safe & Easy Payment Options
          </h4>
          <p>
            Pay with ease using your preferred method: Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, Net Banking, and Pay Later EMI. All transactions are securely processed with 256-bit encryption.
          </p>
        </div>
      </section>
    </div>
  );
}
