<<<<<<< HEAD
# BharatBazaar — Production-Ready Indian E-Commerce Marketplace

An e-commerce marketplace platform inspired by the Flipkart shopping experience. Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, PostgreSQL (Neon / Prisma ORM), Firebase Mobile Phone Auth, Razorpay Payment Gateway, Google Maps Places Autocomplete, and Cloudinary image management.

---

## 🚀 Key Features & Highlights

### 🛒 Customer-Facing Storefront
- **Flipkart-Inspired Aesthetic**: Blue-and-white theme (`#2874f0`), Assured quality badges, yellow & orange action buttons, responsive banner carousels, and deals strips.
- **Top Category Navigation**: Mobiles & Tablets, Electronics, Fashion, Appliances, Home & Kitchen, Beauty & Grooming, Grocery, and Top Offers.
- **Dynamic Search & Multi-Faceted Filters**: Instant keyword search, brand checkboxes, price range filters, star rating filters, and popularity/price sorting.
- **Rich Product Detail Pages**: Multiple image thumbnail gallery, specifications table, variant selection (RAM/Storage/Color), real-time Indian PIN code delivery checker, and customer reviews.
- **Sticky Mobile Bottom Action Bar**: Instant **ADD TO CART** and **BUY NOW** buttons on mobile viewports.
- **Persistent Shopping Cart**: Real-time stock validation, automated free-shipping threshold (orders above ₹500), interactive coupons (`WELCOME100`, `SAVE10`, `SUPERDEAL`), and delivery fee calculation.
- **Persistent Wishlist**: Save favorite items with one-click **Move to Cart**.

### 🔐 Authentication & Indian Mobile Phone OTP
- **Firebase Phone Authentication**: Invisible reCAPTCHA + `signInWithPhoneNumber` on the client; the Firebase ID token is verified server-side with `firebase-admin` and exchanged for an app session. The account is created on first login and stored in PostgreSQL.
- **Phone Number Validation**: 10-digit Indian mobile numbers starting with 6–9 (`+91` prefixes are normalised).
- **Secure Sessions**: HMAC SHA256 signed JWT cookie (`bharat_bazaar_session`) — `httpOnly`, `sameSite: "lax"`, `secure` in production, 30-day expiry. Admin APIs re-check the `ADMIN` role in the database on every request.
- **Development fallback**: when Firebase isn't configured in development, a dev OTP is generated server-side (printed to the console). The universal `123456` code only works for the two demo accounts and only when demo login is enabled — never in production.

### 💳 Payments & Checkout Flow
- **Razorpay Checkout**: Server-side `razorpay.orders.create`, then Razorpay Checkout.js with **UPI first** (UPI Intent deep-link to GPay/PhonePe/Paytm/BHIM on mobile, UPI QR on desktop, collect by VPA), plus Cards, Net Banking and Wallets.
- **Order confirmed only after server-side verification**: HMAC SHA256 signature check (`order_id|payment_id`) **and** a `payments.fetch` double-check of status/amount before the order is marked `PAID`/`CONFIRMED`.
- **Failure handling**: cancelled/failed payments are recorded (`payment-failed`), the order stays `PENDING` and can be retried from the order page (`retry-payment`).
- **Webhook reconciler**: `/api/checkout/webhook` (`payment.captured`, `order.paid`, `payment.failed`) — always signature-verified, idempotent.
- **Inventory safety**: transactional order creation with atomic stock reservation, idempotency keys, address snapshot on the order, restock on cancellation.

### 🛡️ Admin Merchant Portal (`/admin`)
- **Server-guarded**: the admin layout redirects non-admins; every `/api/admin/*` route enforces 401/403.
- **Dashboard**: paid revenue, order counts (total / today / pending fulfilment), catalog size and low-stock alerts.
- **Products**: add / edit / delete with title, brand, category, MRP & selling price, stock, SKU, short & long description, specifications, publish & featured toggles. Products with order history are archived (unpublished) instead of hard-deleted.
- **Cloudinary Images**: multi-image upload (5 MB, JPEG/PNG/WebP/AVIF/GIF), primary image selection, removal (also deletes from Cloudinary).
- **Categories**: create / edit / hide / delete; drives the navigation strip and filters.
- **Orders & Fulfillment**: filter by status, expand for items + shipping address + Razorpay ids, update status (`PENDING` → `DELIVERED`, `CANCELLED`, `RETURNED`), CSV export.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React 19) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** + Lucide React Icons |
| Database & ORM | **PostgreSQL (Neon)** + **Prisma ORM** |
| Authentication | **Firebase Phone Auth** + HMAC Signed JWT HTTP-Only Cookies |
| Payments | **Razorpay** (UPI, RuPay, Cards, Net Banking, COD, Webhooks) |
| Media Hosting | **Cloudinary** (Secure uploads and transformations) |
| Maps & Places | **Google Maps Places API** (Address Autocomplete & PIN Code) |
| Validation | **Zod** schema validation across all endpoints |
| Testing | **Automated Test Suite** via `tsx --test` & Node.js Native Runner |

---

## 📂 Project Architecture

```
d:/ecom
├── src/
│   ├── app/                        # App Router Pages & API Routes
│   │   ├── (storefront)/
│   │   │   ├── page.tsx            # Homepage with Banners & Deal Grids
│   │   │   ├── products/           # Product Catalog & Filtering
│   │   │   │   └── [slug]/         # Product Detail Page
│   │   │   ├── categories/[slug]/  # Category Products Page
│   │   │   ├── cart/               # Shopping Cart & Coupon Discounts
│   │   │   ├── checkout/           # Checkout & Payment Initiation
│   │   │   ├── search/             # Keyword Search Results
│   │   │   ├── wishlist/           # Customer Wishlist
│   │   │   ├── login/              # Mobile OTP Verification
│   │   │   └── account/            # Account Profile, Orders & Addresses
│   │   │       ├── orders/[id]/    # Live Order Tracking Timeline
│   │   │       └── addresses/      # Saved Delivery Addresses
│   │   ├── admin/                  # Admin Dashboard & Merchant Portal (server-guarded layout)
│   │   │   ├── page.tsx            # Analytics Overview & Low Stock Alerts
│   │   │   ├── products/           # Product list, new, [id]/edit
│   │   │   ├── categories/         # Category management
│   │   │   └── orders/             # Order Status & CSV Export
│   │   ├── api/                    # Server-side API Endpoints
│   │   │   ├── auth/               # firebase (token exchange), send-otp/verify-otp (dev), me, logout, profile
│   │   │   ├── addresses/          # Address CRUD (user-scoped)
│   │   │   ├── location/           # pincode lookup, reverse-geocode
│   │   │   ├── checkout/           # create-order, verify-payment, payment-failed, retry-payment, webhook
│   │   │   ├── orders/             # Customer order history & cancellation
│   │   │   └── admin/              # stats, products, categories, orders, upload, export
│   │   ├── sitemap.ts              # Dynamic SEO XML Sitemap
│   │   └── robots.ts               # Robots.txt crawler rules
│   ├── components/                 # Modular UI Components
│   │   ├── layout/                 # Navbar, CategoryStrip, Footer, AccountSidebar
│   │   ├── home/                   # BannerCarousel, DealsSection
│   │   ├── product/                # ProductCard, ProductFilters, ProductDetailView
│   │   ├── address/                # AddressForm (PIN autofill, Google Places, geolocation)
│   │   ├── admin/                  # AdminShell, ProductForm, ImageUploader
│   │   ├── auth/                   # RequireAuth client gate
│   │   └── order/                  # OrderActions (retry payment / cancel)
│   ├── context/                    # React Context Providers
│   │   ├── AuthContext.tsx         # Session state & demo logins
│   │   ├── CartContext.tsx         # Persistent cart & server revalidation
│   │   └── WishlistContext.tsx     # Wishlist persistence
│   └── lib/                        # Business Logic & Infrastructure
│       ├── prisma.ts               # Prisma Client singleton
│       ├── config.ts               # Store configuration settings
│       ├── utils.ts                # Indian Rupee formatting & discounts
│       ├── services/               # Authoritative Services
│       │   ├── catalog.ts          # Products & categories
│       │   ├── pricing.ts          # Precise monetary calculation (paise)
│       │   ├── order.ts            # Orders, stock deductions, timelines
│       │   ├── payment.ts          # Razorpay order & HMAC verification
│       │   ├── auth.ts             # JWT cookie signing & Indian phone rules
│       │   ├── otp.ts              # OTP generation & rate limits
│       │   ├── address.ts          # PIN code validation & addresses
│       │   └── cloudinary.ts       # Cloudinary media uploads
│       ├── firebase/               # client.ts (phone auth), admin.ts (token verification)
│       ├── validation/             # Zod schemas (address, product, category)
│       ├── razorpay-client.ts      # Checkout.js loader & UPI-first display config
│       ├── use-payment.ts          # usePayment() hook → verify-payment / payment-failed
│       ├── google-maps.ts          # Maps JS loader & place parsing
│       └── data/                   # Sample catalog (seed data + dev-only read fallback)
├── prisma/
│   ├── schema.prisma               # Normalized PostgreSQL schema
│   └── seed.ts                     # Database seeding script
├── test/
│   └── ecommerce.test.ts           # Automated test suite
├── .env.example                    # Configuration template
└── package.json
```

---

## ⚡ Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in at least `DATABASE_URL` / `DIRECT_URL` (Neon) and `ADMIN_PHONES`:
```bash
cp .env.example .env
```

### 3. Create the Database Schema & Seed
```bash
npm run db:generate   # prisma generate
npm run db:push       # create tables on Neon
npm run db:seed       # categories, sample products, coupons, admin users from ADMIN_PHONES
```
A database is **required** for login, cart checkout, orders, addresses and the admin panel. In development the storefront can still *read* the bundled sample catalog if the database is unreachable; all writes need Postgres.

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000`.

### Development fallbacks (never active in production)
| Service not configured | Behaviour in `npm run dev` |
|---|---|
| Firebase | Dev OTP generated server-side and printed to the terminal |
| Razorpay | Mock gateway — "payment" succeeds instantly, order ids start with `order_mock_` |
| Cloudinary | Upload returns a placeholder image URL |
| Google Maps | Places search hidden; "use my location" stores coordinates but cannot auto-fill the address; PIN code autofill (India Post) still works |

In production (`NODE_ENV=production`) each of these throws a clear configuration error instead.

### Going live checklist
1. Set a strong `JWT_SECRET` (≥ 32 chars) and your real `ADMIN_PHONES`.
2. Firebase: enable Phone sign-in, add your domain to *Authorized domains*, set the 4 `NEXT_PUBLIC_FIREBASE_*` vars and `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. Razorpay: switch to live keys, enable UPI / Cards / Netbanking / Wallets, add the webhook `https://<domain>/api/checkout/webhook` with `payment.captured`, `payment.failed`, `order.paid` and set `RAZORPAY_WEBHOOK_SECRET`.
4. Cloudinary & Google Maps keys (restrict the browser Maps key by HTTP referrer).
5. Leave `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` empty.

---

## 📋 Credentials & External Services Checklist

| Service | Environment Variable | Where to Obtain |
|---|---|---|
| **Neon PostgreSQL** | `DATABASE_URL`, `DIRECT_URL` | [neon.tech](https://neon.tech) — Create a free PostgreSQL project and copy the connection string with `?sslmode=require`. |
| **Razorpay** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | [dashboard.razorpay.com](https://dashboard.razorpay.com) — Under **Settings > API Keys**, generate Test Key ID and Secret. Under **Webhooks**, add `https://your-domain.com/api/checkout/webhook`. |
| **Firebase Auth** | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` | [console.firebase.google.com](https://console.firebase.google.com) — Enable **Phone** under Authentication > Sign-in method and add your domain to Authorized domains. Download the service account JSON under Project Settings > Service accounts. |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [cloudinary.com](https://cloudinary.com) — Sign up for a free cloud account and copy credentials from the Dashboard. |
| **Google Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) — Enable **Maps JavaScript API**, **Places API** (browser key) and **Geocoding API** (server key). |
| **Admin access** | `ADMIN_PHONES` | Comma-separated mobile numbers that receive the `ADMIN` role on login / seed. |

---

## 🔐 Demo Credentials (development only)

Demo one-click logins appear in the navbar/login page only when `NODE_ENV !== "production"` (or `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` on a staging preview).

- **Demo Customer**: phone `9812345678`, OTP `123456`
- **Demo Admin**: phone `9876543210`, OTP `123456` → `/admin`

In production, log in with Firebase OTP using a number listed in `ADMIN_PHONES` to access the admin panel.
=======
# ecom
>>>>>>> c43aca125340d0db647f94effa996bec12ed1d57
