import fs from "fs";
import path from "path";

export interface HeroBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  image: string;
  offerNote: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BankOffersConfig {
  enabled: boolean;
  title: string;
  description: string;
  badgeText: string;
  buttonText: string;
  buttonLink: string;
}

export interface PromoCard {
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  gradient: string;
  iconType: string;
  enabled: boolean;
}

export interface PromoCardsConfig {
  enabled: boolean;
  card1: PromoCard;
  card2: PromoCard;
}

export interface DealsSectionConfig {
  title: string;
  subtitle: string;
  viewAllLink: string;
  hasTimer: boolean;
  isHot: boolean;
  timerHours: number;
}

export interface FeaturedBrand {
  name: string;
  logo: string;
  deal: string;
  link: string;
}

export interface StoreSettingsConfig {
  storeName: string;
  tagline: string;
  announcementText: string;
  showAnnouncement: boolean;
  supportPhone: string;
  supportEmail: string;
  freeShippingThreshold: number;
  shippingFee: number;
}

export interface StorefrontConfig {
  banners: HeroBanner[];
  bankOffers: BankOffersConfig;
  promoCards: PromoCardsConfig;
  dealsSection: DealsSectionConfig;
  featuredBrands: FeaturedBrand[];
  storeSettings: StoreSettingsConfig;
}

const DEFAULT_CONFIG: StorefrontConfig = {
  banners: [
    {
      id: "banner-bbd",
      badge: "Big Billion Days Special",
      title: "India's Biggest Festival Sale",
      subtitle: "Up to 80% Off on Apple, Samsung, OnePlus & Laptops",
      ctaText: "Shop Deals Now",
      ctaLink: "/categories/electronics",
      bgColor: "from-[#1a3a8f] via-[#2874f0] to-[#1250b8]",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
      offerNote: "10% Instant Discount on SBI & Axis Bank Cards",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "banner-electronics",
      badge: "Mega Electronics Fest",
      title: "Top Gadgets & Best Selling Tech",
      subtitle: "Smartwatches, Earbuds, 4K Smart TVs starting ₹999",
      ctaText: "Explore Electronics",
      ctaLink: "/categories/electronics",
      bgColor: "from-[#0d233a] via-[#103b66] to-[#0a488f]",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      offerNote: "Extra ₹2,500 Exchange Bonus on Select Devices",
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "banner-fashion",
      badge: "Flipkart Fashion Carnival",
      title: "50-80% Off on Top Brands",
      subtitle: "Ethnic Kurtas, Casual Shirts, Running Shoes & Premium Watches",
      ctaText: "Grab Fashion Picks",
      ctaLink: "/categories/fashion",
      bgColor: "from-[#800f2f] via-[#a4133c] to-[#590d22]",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      offerNote: "Buy 2 Get 10% Extra Off | Free Returns & Exchanges",
      isActive: true,
      sortOrder: 3,
    },
    {
      id: "banner-appliances",
      badge: "Grand Kitchen & Home Upgrade",
      title: "Upgrade Your Home Essentials",
      subtitle: "Air Fryers, Microwaves, Cookware & Mixers from ₹499",
      ctaText: "Upgrade Today",
      ctaLink: "/categories/home-kitchen",
      bgColor: "from-[#0f4c3a] via-[#137547] to-[#0b3c2e]",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
      offerNote: "No Cost EMI Available up to 12 Months",
      isActive: true,
      sortOrder: 4,
    },
  ],
  bankOffers: {
    enabled: true,
    title: "Bank Offers:",
    description: "10% Instant Discount on SBI & Axis Bank Credit Cards | No Cost EMI on leading banks",
    badgeText: "Earn 4X SuperCoins",
    buttonText: "EXPLORE",
    buttonLink: "/products",
  },
  promoCards: {
    enabled: true,
    card1: {
      badge: "Flipkart Flights",
      title: "Domestic Flights Starting ₹1,499",
      subtitle: "Zero convenience fees on first booking with code FLYFK",
      buttonText: "Book Tickets",
      buttonLink: "/categories/electronics",
      gradient: "from-blue-700 via-indigo-700 to-blue-900",
      iconType: "Plane",
      enabled: true,
    },
    card2: {
      badge: "Flipkart Pay Later",
      title: "Instant Credit up to ₹1,00,000",
      subtitle: "Shop now & pay next month. 0% interest for 30 days",
      buttonText: "Activate Now",
      buttonLink: "/account",
      gradient: "from-emerald-700 via-teal-800 to-emerald-900",
      iconType: "Zap",
      enabled: true,
    },
  },
  dealsSection: {
    title: "Deals of the Day",
    subtitle: "Refreshes every 24 hours with massive price drops",
    viewAllLink: "/products",
    hasTimer: true,
    isHot: true,
    timerHours: 24,
  },
  featuredBrands: [
    { name: "Apple", logo: " Apple", deal: "Min 15% Off", link: "/products?search=Apple" },
    { name: "Samsung", logo: "SAMSUNG", deal: "Up to 30% Off", link: "/products?search=Samsung" },
    { name: "boAt", logo: "boAt", deal: "From ₹799", link: "/categories/electronics" },
    { name: "Sony", logo: "SONY", deal: "Up to 40% Off", link: "/categories/electronics" },
    { name: "Nike", logo: "NIKE", deal: "Min 40% Off", link: "/categories/fashion" },
    { name: "Puma", logo: "PUMA", deal: "Under ₹1,999", link: "/categories/fashion" },
    { name: "Philips", logo: "PHILIPS", deal: "From ₹1,299", link: "/categories/appliances" },
    { name: "OnePlus", logo: "1+ ONEPLUS", deal: "Best Value 5G", link: "/categories/mobiles-tablets" },
  ],
  storeSettings: {
    storeName: "Flipkart",
    tagline: "India's Favorite Shopping Destination",
    announcementText: "⚡ Special Festive Super Deals are Live! Free Express Delivery across India.",
    showAnnouncement: true,
    supportPhone: "1800 202 9898",
    supportEmail: "support@flipkart.com",
    freeShippingThreshold: 500,
    shippingFee: 40,
  },
};

const CMS_FILE_PATH = path.join(process.cwd(), "src", "lib", "data", "storefront-cms.json");

// In-memory cache to guarantee ultra-fast response & fallback
let memoryConfigCache: StorefrontConfig = { ...DEFAULT_CONFIG };

export async function getStorefrontConfig(): Promise<StorefrontConfig> {
  try {
    if (fs.existsSync(CMS_FILE_PATH)) {
      const data = fs.readFileSync(CMS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      memoryConfigCache = {
        banners: parsed.banners || DEFAULT_CONFIG.banners,
        bankOffers: { ...DEFAULT_CONFIG.bankOffers, ...parsed.bankOffers },
        promoCards: {
          enabled: parsed.promoCards?.enabled ?? DEFAULT_CONFIG.promoCards.enabled,
          card1: { ...DEFAULT_CONFIG.promoCards.card1, ...(parsed.promoCards?.card1 || {}) },
          card2: { ...DEFAULT_CONFIG.promoCards.card2, ...(parsed.promoCards?.card2 || {}) },
        },
        dealsSection: { ...DEFAULT_CONFIG.dealsSection, ...parsed.dealsSection },
        featuredBrands: parsed.featuredBrands || DEFAULT_CONFIG.featuredBrands,
        storeSettings: { ...DEFAULT_CONFIG.storeSettings, ...parsed.storeSettings },
      };
      return memoryConfigCache;
    }
  } catch (err) {
    console.warn("[storefront-service] Failed reading cms file, serving memory/default cache:", err);
  }
  return memoryConfigCache;
}

export async function updateStorefrontConfig(updates: Partial<StorefrontConfig>): Promise<StorefrontConfig> {
  const current = await getStorefrontConfig();
  const nextConfig: StorefrontConfig = {
    banners: updates.banners ? updates.banners : current.banners,
    bankOffers: updates.bankOffers ? { ...current.bankOffers, ...updates.bankOffers } : current.bankOffers,
    promoCards: updates.promoCards ? { ...current.promoCards, ...updates.promoCards } : current.promoCards,
    dealsSection: updates.dealsSection ? { ...current.dealsSection, ...updates.dealsSection } : current.dealsSection,
    featuredBrands: updates.featuredBrands ? updates.featuredBrands : current.featuredBrands,
    storeSettings: updates.storeSettings ? { ...current.storeSettings, ...updates.storeSettings } : current.storeSettings,
  };

  memoryConfigCache = nextConfig;

  try {
    const dir = path.dirname(CMS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(nextConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("[storefront-service] Failed writing cms file, updated in memory only:", err);
  }

  return nextConfig;
}
