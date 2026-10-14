"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TicketPercent,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Percent,
  IndianRupee,
  Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formValue, setFormValue] = useState("10");
  const [formMinOrder, setFormMinOrder] = useState("500");
  const [formMaxDiscount, setFormMaxDiscount] = useState("200");
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load coupons");
      setCoupons(data.coupons || []);
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          description: formDesc,
          discountType: formType,
          discountValue: formType === "PERCENTAGE" ? Number(formValue) : Number(formValue) * 100,
          minOrderValue: Number(formMinOrder) * 100,
          maxDiscount: formType === "PERCENTAGE" && formMaxDiscount ? Number(formMaxDiscount) * 100 : null,
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");
      setNotice({ type: "success", text: "Coupon code created successfully!" });
      setIsModalOpen(false);
      setFormCode("");
      setFormDesc("");
      await loadCoupons();
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Coupons &amp; Promotional Discounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create discount vouchers, festival promos, and checkout promo codes for your shoppers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#2874f0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
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

      {/* Coupons List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#2874f0]" />
            <span className="text-xs text-slate-400">Loading coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No coupon codes created yet. Click "Create Coupon Code" above to make your first offer!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-sm px-2.5 py-1 bg-blue-50 text-[#2874f0] rounded-lg border border-blue-200/60">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        coupon.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 mt-2">
                    {coupon.description || "Special promotional offer"}
                  </p>

                  <div className="mt-3 text-xs space-y-1 text-slate-500">
                    <p>
                      <strong className="text-slate-700">Discount:</strong>{" "}
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : formatCurrency(coupon.discountValue) + " FLAT"}
                    </p>
                    <p>
                      <strong className="text-slate-700">Min Order:</strong>{" "}
                      {formatCurrency(coupon.minOrderValue)}
                    </p>
                    <p>
                      <strong className="text-slate-700">Used:</strong>{" "}
                      {coupon.usedCount} times
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">Create New Coupon</h3>
            <p className="text-xs text-slate-500 mb-4">Set promo code, discount rates and order minimums</p>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI50"
                  className="w-full p-2.5 border rounded-xl border-slate-200 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. 50% Off on purchases above ₹999"
                  className="w-full p-2.5 border rounded-xl border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl border-slate-200 bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Cash (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Value {formType === "PERCENTAGE" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="10"
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="499"
                    className="w-full p-2.5 border rounded-xl border-slate-200"
                  />
                </div>

                {formType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Cap (₹)</label>
                    <input
                      type="number"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                      placeholder="200"
                      className="w-full p-2.5 border rounded-xl border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2874f0] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
