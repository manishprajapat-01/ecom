"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Plane,
  Zap,
  Flame,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  Store,
  Loader2,
} from "lucide-react";
import type {
  StorefrontConfig,
  HeroBanner,
  FeaturedBrand,
} from "@/lib/services/storefront";

const GRADIENT_PRESETS = [
  { label: "Classic Flipkart Blue", value: "from-[#1a3a8f] via-[#2874f0] to-[#1250b8]" },
  { label: "Midnight Dark Tech", value: "from-[#0d233a] via-[#103b66] to-[#0a488f]" },
  { label: "Festive Crimson / Wine", value: "from-[#800f2f] via-[#a4133c] to-[#590d22]" },
  { label: "Forest Emerald Green", value: "from-[#0f4c3a] via-[#137547] to-[#0b3c2e]" },
  { label: "Royal Purple Glow", value: "from-purple-900 via-indigo-900 to-blue-900" },
  { label: "Deep Sunset Amber", value: "from-[#782808] via-[#a8420c] to-[#c2410c]" },
];

export default function AdminStorefrontPage() {
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"banners" | "offers" | "promo_cards" | "deals" | "brands" | "branding">("banners");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Editor state for Banners
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);

  // Modal / Editor state for Brands
  const [editingBrand, setEditingBrand] = useState<{ index: number; brand: FeaturedBrand } | null>(null);
  const [isNewBrand, setIsNewBrand] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/storefront", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load storefront configuration");
      setConfig(data.config);
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async (nextConfig?: StorefrontConfig) => {
    const payload = nextConfig || config;
    if (!payload) return;
    setIsSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update configuration");
      setConfig(data.config);
      setNotice({ type: "success", text: "Storefront updated successfully! Changes are live on the homepage." });
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────── BANNER HANDLERS ──────────────────────────
  const handleToggleBanner = (id: string) => {
    if (!config) return;
    const updated = {
      ...config,
      banners: config.banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleDeleteBanner = (id: string) => {
    if (!config) return;
    if (!confirm("Are you sure you want to delete this hero banner?")) return;
    const updated = {
      ...config,
      banners: config.banners.filter((b) => b.id !== id),
    };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !editingBanner) return;
    let nextBanners = [...config.banners];
    if (isNewBanner) {
      nextBanners.push({
        ...editingBanner,
        id: editingBanner.id || `banner-${Date.now().toString().slice(-6)}`,
      });
    } else {
      nextBanners = nextBanners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
    }
    const updated = { ...config, banners: nextBanners };
    setConfig(updated);
    saveConfig(updated);
    setEditingBanner(null);
    setIsNewBanner(false);
  };

  // ────────────────────────── BRAND HANDLERS ──────────────────────────
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !editingBrand) return;
    let nextBrands = [...config.featuredBrands];
    if (isNewBrand) {
      nextBrands.push(editingBrand.brand);
    } else {
      nextBrands[editingBrand.index] = editingBrand.brand;
    }
    const updated = { ...config, featuredBrands: nextBrands };
    setConfig(updated);
    saveConfig(updated);
    setEditingBrand(null);
    setIsNewBrand(false);
  };

  const handleDeleteBrand = (index: number) => {
    if (!config) return;
    if (!confirm("Remove this brand from the storefront?")) return;
    const nextBrands = config.featuredBrands.filter((_, idx) => idx !== index);
    const updated = { ...config, featuredBrands: nextBrands };
    setConfig(updated);
    saveConfig(updated);
  };

  if (isLoading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#2874f0] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Storefront Management Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#2874f0]">
              LIVE STOREFRONT CMS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Storefront &amp; Frontend Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your homepage hero banners, promotional offers, deals timer, brands showcase, and store announcements in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <span>Live Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => saveConfig()}
            disabled={isSaving}
            className="px-4 py-2 bg-[#2874f0] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab("banners")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "banners"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Hero Banners Carousel ({config.banners.length})
        </button>

        <button
          onClick={() => setActiveTab("offers")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "offers"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Bank Offers &amp; Strip
        </button>

        <button
          onClick={() => setActiveTab("promo_cards")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "promo_cards"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Promo Cards (Flights &amp; Pay Later)
        </button>

        <button
          onClick={() => setActiveTab("deals")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "deals"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Deals &amp; Flash Timer
        </button>

        <button
          onClick={() => setActiveTab("brands")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "brands"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Featured Brands ({config.featuredBrands.length})
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2.5 rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "branding"
              ? "border-[#2874f0] text-[#2874f0] bg-blue-50/50"
              : "border-transparent hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Store Branding &amp; Notice
        </button>
      </div>

      {/* ────────────────────────── TAB 1: HERO BANNERS ────────────────────────── */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Homepage Hero Carousel Banners</h2>
              <p className="text-xs text-slate-500">
                These slides auto-rotate at the very top of your storefront. You can customize images, badges, gradients and CTA buttons.
              </p>
            </div>

            <button
              onClick={() => {
                setIsNewBanner(true);
                setEditingBanner({
                  id: `banner-${Date.now()}`,
                  badge: "Mega Sale",
                  title: "Festival Exclusive Deals",
                  subtitle: "Up to 70% Off on Top Rated Gadgets & Lifestyle",
                  ctaText: "Shop Deals Now",
                  ctaLink: "/products",
                  bgColor: "from-[#1a3a8f] via-[#2874f0] to-[#1250b8]",
                  image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
                  offerNote: "Extra 10% Off on Leading Bank Cards",
                  isActive: true,
                  sortOrder: config.banners.length + 1,
                });
              }}
              className="px-3.5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Banner Slide</span>
            </button>
          </div>

          {/* Banners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.banners.map((b) => (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs relative flex flex-col justify-between transition-all ${
                  b.isActive ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
                }`}
              >
                <div>
                  {/* Miniature Visual Preview of the Banner */}
                  <div
                    className={`relative h-36 rounded-xl bg-gradient-to-r ${b.bgColor} p-4 text-white overflow-hidden shadow-xs flex flex-col justify-between`}
                  >
                    <div className="absolute inset-0 opacity-25 mix-blend-overlay">
                      {b.image && (
                        <Image
                          src={b.image}
                          alt={b.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="relative z-10">
                      <span className="bg-[#ffe500] text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-xs uppercase">
                        {b.badge}
                      </span>
                      <h4 className="font-black text-sm line-clamp-1 mt-1 drop-shadow-sm">{b.title}</h4>
                      <p className="text-[10px] text-blue-100 line-clamp-1 mt-0.5">{b.subtitle}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] text-yellow-300 font-semibold truncate max-w-[60%]">
                        {b.offerNote}
                      </span>
                      <span className="bg-[#ffe500] text-blue-950 font-black text-[10px] px-2.5 py-1 rounded-xs flex items-center gap-1">
                        <span>{b.ctaText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Banner Specs & Details */}
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Target Link:</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">{b.ctaLink}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBanner(b.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {b.isActive ? "● Active on Store" : "○ Inactive"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewBanner(false);
                        setEditingBanner({ ...b });
                      }}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                      title="Edit Banner"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(b.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* EDIT / CREATE BANNER MODAL */}
          {editingBanner && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative my-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {isNewBanner ? "Add New Hero Banner" : "Edit Hero Banner"}
                    </h3>
                    <p className="text-xs text-slate-500">Configure slide appearance and button behavior</p>
                  </div>
                  <button
                    onClick={() => setEditingBanner(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Live Preview Box */}
                <div className="mb-6">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Live Banner Preview:
                  </span>
                  <div
                    className={`relative min-h-[140px] rounded-2xl bg-gradient-to-r ${editingBanner.bgColor} p-4 text-white overflow-hidden shadow-sm flex flex-col justify-between`}
                  >
                    <div className="absolute inset-0 opacity-25 mix-blend-overlay">
                      {editingBanner.image && (
                        <Image
                          src={editingBanner.image}
                          alt="preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="relative z-10">
                      <span className="bg-[#ffe500] text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-xs uppercase">
                        {editingBanner.badge || "Badge"}
                      </span>
                      <h4 className="font-black text-base mt-1 drop-shadow-sm">{editingBanner.title || "Headline"}</h4>
                      <p className="text-xs text-blue-100 mt-0.5">{editingBanner.subtitle || "Subtitle"}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-3">
                      <span className="text-xs text-yellow-300 font-semibold">{editingBanner.offerNote}</span>
                      <span className="bg-[#ffe500] text-blue-950 font-black text-xs px-3 py-1.5 rounded-xs flex items-center gap-1.5">
                        <span>{editingBanner.ctaText || "Shop Now"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSaveBanner} className="space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Badge Tag</label>
                      <input
                        type="text"
                        required
                        value={editingBanner.badge}
                        onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                        placeholder="Big Billion Days Special"
                        className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Offer Note (Optional)</label>
                      <input
                        type="text"
                        value={editingBanner.offerNote}
                        onChange={(e) => setEditingBanner({ ...editingBanner, offerNote: e.target.value })}
                        placeholder="10% Instant Discount on Bank Cards"
                        className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Banner Headline Title</label>
                    <input
                      type="text"
                      required
                      value={editingBanner.title}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      placeholder="India's Biggest Festival Sale"
                      className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Subtitle / Deal Highlights</label>
                    <input
                      type="text"
                      required
                      value={editingBanner.subtitle}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      placeholder="Up to 80% Off on Apple, Samsung, OnePlus & Laptops"
                      className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Button CTA Text</label>
                      <input
                        type="text"
                        required
                        value={editingBanner.ctaText}
                        onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                        placeholder="Shop Deals Now"
                        className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Button Target Link</label>
                      <input
                        type="text"
                        required
                        value={editingBanner.ctaLink}
                        onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                        placeholder="/categories/electronics"
                        className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Background Image URL</label>
                    <input
                      type="url"
                      required
                      value={editingBanner.image}
                      onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Color Gradient Preset</label>
                    <select
                      value={editingBanner.bgColor}
                      onChange={(e) => setEditingBanner({ ...editingBanner, bgColor: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none bg-white"
                    >
                      {GRADIENT_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editingBanner.isActive}
                        onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#2874f0] rounded"
                      />
                      <span>Make this banner slide active immediately</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingBanner(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                    >
                      Save Banner Slide
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────── TAB 2: BANK OFFERS STRIP ────────────────────────── */}
      {activeTab === "offers" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Bank Offers &amp; Rewards Strip</h2>
              <p className="text-xs text-slate-500">
                The horizontal announcement strip that sits right beneath the carousel on the homepage.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.bankOffers.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bankOffers: { ...config.bankOffers, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-[#2874f0] rounded"
              />
              <span>Strip Active</span>
            </label>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Prefix Label</label>
                <input
                  type="text"
                  value={config.bankOffers.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bankOffers: { ...config.bankOffers, title: e.target.value },
                    })
                  }
                  placeholder="Bank Offers:"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SuperCoins / Reward Badge Text</label>
                <input
                  type="text"
                  value={config.bankOffers.badgeText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bankOffers: { ...config.bankOffers, badgeText: e.target.value },
                    })
                  }
                  placeholder="Earn 4X SuperCoins"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Offer Description Text</label>
              <input
                type="text"
                value={config.bankOffers.description}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bankOffers: { ...config.bankOffers, description: e.target.value },
                  })
                }
                placeholder="10% Instant Discount on SBI & Axis Bank Credit Cards | No Cost EMI on leading banks"
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Button Text</label>
                <input
                  type="text"
                  value={config.bankOffers.buttonText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bankOffers: { ...config.bankOffers, buttonText: e.target.value },
                    })
                  }
                  placeholder="EXPLORE"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Button Target Link</label>
                <input
                  type="text"
                  value={config.bankOffers.buttonLink}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bankOffers: { ...config.bankOffers, buttonLink: e.target.value },
                    })
                  }
                  placeholder="/products"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Update Bank Offers
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────── TAB 3: PROMO CARDS (FLIGHTS & PAY LATER) ────────────────────────── */}
      {activeTab === "promo_cards" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Promotional Feature Cards Strip</h2>
              <p className="text-xs text-slate-500">
                The high-impact promo banners positioned in the middle of the homepage.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.promoCards.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoCards: { ...config.promoCards, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-[#2874f0] rounded"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo Card 1: Flights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-blue-600" /> Promo Card 1 (Flights)
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={config.promoCards.card1.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card1: { ...config.promoCards.card1, enabled: e.target.checked },
                        },
                      })
                    }
                    className="w-4 h-4 text-[#2874f0] rounded"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Badge</label>
                  <input
                    type="text"
                    value={config.promoCards.card1.badge}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card1: { ...config.promoCards.card1, badge: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Headline</label>
                  <input
                    type="text"
                    value={config.promoCards.card1.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card1: { ...config.promoCards.card1, title: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subtitle / Note</label>
                  <input
                    type="text"
                    value={config.promoCards.card1.subtitle}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card1: { ...config.promoCards.card1, subtitle: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Button Text</label>
                    <input
                      type="text"
                      value={config.promoCards.card1.buttonText}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          promoCards: {
                            ...config.promoCards,
                            card1: { ...config.promoCards.card1, buttonText: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Button Link</label>
                    <input
                      type="text"
                      value={config.promoCards.card1.buttonLink}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          promoCards: {
                            ...config.promoCards,
                            card1: { ...config.promoCards.card1, buttonLink: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card 2: Pay Later */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" /> Promo Card 2 (Pay Later)
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={config.promoCards.card2.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card2: { ...config.promoCards.card2, enabled: e.target.checked },
                        },
                      })
                    }
                    className="w-4 h-4 text-[#2874f0] rounded"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Badge</label>
                  <input
                    type="text"
                    value={config.promoCards.card2.badge}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card2: { ...config.promoCards.card2, badge: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Headline</label>
                  <input
                    type="text"
                    value={config.promoCards.card2.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card2: { ...config.promoCards.card2, title: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subtitle / Note</label>
                  <input
                    type="text"
                    value={config.promoCards.card2.subtitle}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        promoCards: {
                          ...config.promoCards,
                          card2: { ...config.promoCards.card2, subtitle: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Button Text</label>
                    <input
                      type="text"
                      value={config.promoCards.card2.buttonText}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          promoCards: {
                            ...config.promoCards,
                            card2: { ...config.promoCards.card2, buttonText: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Button Link</label>
                    <input
                      type="text"
                      value={config.promoCards.card2.buttonLink}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          promoCards: {
                            ...config.promoCards,
                            card2: { ...config.promoCards.card2, buttonLink: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Promotional Cards
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────── TAB 4: DEALS & FLASH TIMER ────────────────────────── */}
      {activeTab === "deals" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Deals of the Day &amp; Flash Sales</h2>
            <p className="text-xs text-slate-500">
              Customize the flash deals section title, subtitle, timer duration and view-all link.
            </p>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.dealsSection.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsSection: { ...config.dealsSection, title: e.target.value },
                    })
                  }
                  placeholder="Deals of the Day"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">View All Link</label>
                <input
                  type="text"
                  value={config.dealsSection.viewAllLink}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsSection: { ...config.dealsSection, viewAllLink: e.target.value },
                    })
                  }
                  placeholder="/products"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Section Subtitle</label>
              <input
                type="text"
                value={config.dealsSection.subtitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dealsSection: { ...config.dealsSection, subtitle: e.target.value },
                  })
                }
                placeholder="Refreshes every 24 hours with massive price drops"
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.dealsSection.hasTimer}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsSection: { ...config.dealsSection, hasTimer: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#2874f0] rounded"
                />
                <span>Display Flash Countdown Timer</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.dealsSection.isHot}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsSection: { ...config.dealsSection, isHot: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#2874f0] rounded"
                />
                <span>Highlight with Hot Deals Pulse Badge</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Deals Settings
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────── TAB 5: FEATURED BRANDS ────────────────────────── */}
      {activeTab === "brands" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Featured Brands Showcase Strip</h2>
              <p className="text-xs text-slate-500">
                Manage the brand badges displayed on your homepage with warranty guarantee.
              </p>
            </div>

            <button
              onClick={() => {
                setIsNewBrand(true);
                setEditingBrand({
                  index: config.featuredBrands.length,
                  brand: { name: "", logo: "", deal: "Min 20% Off", link: "/products" },
                });
              }}
              className="px-3.5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {config.featuredBrands.map((b, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-3 text-center flex flex-col items-center justify-between shadow-2xs group relative hover:border-blue-300 transition"
              >
                <div className="my-2">
                  <span className="font-black text-slate-800 text-sm">{b.logo || b.name}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">{b.deal}</span>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setIsNewBrand(false);
                      setEditingBrand({ index: idx, brand: { ...b } });
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(idx)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* EDIT / CREATE BRAND MODAL */}
          {editingBrand && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl">
                <h3 className="text-base font-black text-slate-900 mb-1">
                  {isNewBrand ? "Add Featured Brand" : "Edit Featured Brand"}
                </h3>
                <p className="text-xs text-slate-500 mb-4">Set brand display logo text and discount deal</p>

                <form onSubmit={handleSaveBrand} className="space-y-3 text-xs font-medium">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Brand Name</label>
                    <input
                      type="text"
                      required
                      value={editingBrand.brand.name}
                      onChange={(e) =>
                        setEditingBrand({
                          ...editingBrand,
                          brand: { ...editingBrand.brand, name: e.target.value },
                        })
                      }
                      placeholder="e.g. Apple"
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Logo Text or Symbol</label>
                    <input
                      type="text"
                      required
                      value={editingBrand.brand.logo}
                      onChange={(e) =>
                        setEditingBrand({
                          ...editingBrand,
                          brand: { ...editingBrand.brand, logo: e.target.value },
                        })
                      }
                      placeholder="e.g.  Apple or SAMSUNG"
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Deal / Discount Text</label>
                    <input
                      type="text"
                      required
                      value={editingBrand.brand.deal}
                      onChange={(e) =>
                        setEditingBrand({
                          ...editingBrand,
                          brand: { ...editingBrand.brand, deal: e.target.value },
                        })
                      }
                      placeholder="Min 20% Off"
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Search Link</label>
                    <input
                      type="text"
                      required
                      value={editingBrand.brand.link}
                      onChange={(e) =>
                        setEditingBrand({
                          ...editingBrand,
                          brand: { ...editingBrand.brand, link: e.target.value },
                        })
                      }
                      placeholder="/products?search=Apple"
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingBrand(null)}
                      className="px-4 py-2 border rounded-xl border-slate-200 text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#2874f0] text-white rounded-xl font-bold"
                    >
                      Save Brand
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────── TAB 6: BRANDING & ANNOUNCEMENT ────────────────────────── */}
      {activeTab === "branding" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Store Branding &amp; Announcement Bar</h2>
            <p className="text-xs text-slate-500">
              Configure store name, top announcement ticker, support contacts and shipping rules.
            </p>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Store Name</label>
                <input
                  type="text"
                  value={config.storeSettings.storeName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: { ...config.storeSettings, storeName: e.target.value },
                    })
                  }
                  placeholder="Flipkart"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Store Tagline</label>
                <input
                  type="text"
                  value={config.storeSettings.tagline}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: { ...config.storeSettings, tagline: e.target.value },
                    })
                  }
                  placeholder="India's Favorite Shopping Destination"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold">Top Announcement Ticker Text</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold">
                  <input
                    type="checkbox"
                    checked={config.storeSettings.showAnnouncement}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        storeSettings: { ...config.storeSettings, showAnnouncement: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#2874f0] rounded"
                  />
                  <span>Show Ticker on Frontend</span>
                </label>
              </div>
              <input
                type="text"
                value={config.storeSettings.announcementText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    storeSettings: { ...config.storeSettings, announcementText: e.target.value },
                  })
                }
                placeholder="⚡ Special Festive Super Deals are Live! Free Express Delivery across India."
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Support Phone Helpline</label>
                <input
                  type="text"
                  value={config.storeSettings.supportPhone}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: { ...config.storeSettings, supportPhone: e.target.value },
                    })
                  }
                  placeholder="1800 202 9898"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Support Email Address</label>
                <input
                  type="email"
                  value={config.storeSettings.supportEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: { ...config.storeSettings, supportEmail: e.target.value },
                    })
                  }
                  placeholder="support@flipkart.com"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Free Delivery Minimum (₹)</label>
                <input
                  type="number"
                  value={config.storeSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: {
                        ...config.storeSettings,
                        freeShippingThreshold: Number(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="500"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={config.storeSettings.shippingFee}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storeSettings: {
                        ...config.storeSettings,
                        shippingFee: Number(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="40"
                  className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Store Branding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
