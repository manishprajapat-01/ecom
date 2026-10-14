"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Truck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import type { StorefrontConfig } from "@/lib/services/storefront";

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/storefront")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      setConfig(data.config);
      setNotice({ type: "success", text: "Store settings saved and updated across the frontend!" });
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#2874f0] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Store Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Store &amp; Platform Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global store identity, customer support hotlines, delivery fee rules and policies.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <span>View Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Branding & Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-[#2874f0]" />
            <h2 className="text-sm font-bold text-slate-800">Store Identity &amp; Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Name</label>
              <input
                type="text"
                required
                value={config.storeSettings.storeName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    storeSettings: { ...config.storeSettings, storeName: e.target.value },
                  })
                }
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tagline</label>
              <input
                type="text"
                value={config.storeSettings.tagline}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    storeSettings: { ...config.storeSettings, tagline: e.target.value },
                  })
                }
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Support & Contact */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Customer Support &amp; Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Toll-Free Support Helpline</label>
              <input
                type="text"
                value={config.storeSettings.supportPhone}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    storeSettings: { ...config.storeSettings, supportPhone: e.target.value },
                  })
                }
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
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Shipping & Delivery Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">Shipping &amp; Delivery Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Free Shipping Order Minimum (₹)</label>
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
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Orders above this amount get 100% Free Shipping.</p>
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
                className="w-full p-2.5 border rounded-xl border-slate-200 focus:border-[#2874f0] outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Applied when cart total is below the free threshold.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
