export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_NEXT_BUILD = process.env.NEXT_PHASE === "phase-production-build";

/**
 * Demo one-click logins (Customer / Admin) are a development convenience only.
 * They are enabled when NOT in production, or when explicitly turned on via
 * NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true (e.g. for a staging preview).
 */
export const DEMO_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" || !IS_PRODUCTION;

/** Firebase Phone Auth is active when the public client config is present. */
export const FIREBASE_CLIENT_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

export const GOOGLE_MAPS_BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const DEMO_ACCOUNTS = {
  customer: { phone: "9812345678", name: "Rahul Sharma" },
  admin: { phone: "9876543210", name: "Admin Manager" },
  otp: "123456",
};

export const ADMIN_CREDENTIALS = {
  email: (process.env.ADMIN_EMAIL || "aadi28x6@gmail.com").trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || "admin123",
  name: "Aadi Kiran Mahajani",
};

export const SITE_CONFIG = {
  storeName: process.env.STORE_NAME || "Flipkart",
  tagline: "India's Favorite Shopping Destination",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  currency: "INR",
  currencySymbol: "₹",
  freeShippingThresholdPaise: 50000, // ₹500
  defaultShippingFeePaise: 4000,     // ₹40
  supportPhone: "1800 202 9898",
  supportEmail: "support@flipkart.com",
  address: "Buildings Alyssa, Begonia & Clove Embassy Tech Village, Outer Ring Road, Devarabeesanahalli Village, Bengaluru, 560103, Karnataka, India",
  features: {
    enableCashOnDelivery: true,
    enableRazorpay: true,
    enableGoogleMapsAutocomplete: true,
    enableFirebaseOtp: true,
  },
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com",
    instagram: "https://instagram.com",
  },
};
