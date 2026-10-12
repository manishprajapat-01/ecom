"use client";

import React, { useEffect, useState } from "react";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { User, Loader2, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);
    const result = await updateProfile({ name, email });
    setIsSaving(false);
    setNotice({ type: result.success ? "success" : "error", text: result.success ? "Profile updated successfully!" : result.message });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <AccountSidebar />

      <div className="flex-1 w-full bg-white rounded-sm border border-gray-200 p-6 shadow-xs space-y-6">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#2874f0]" /> Personal Information
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your personal profile and contact preferences</p>
        </div>

        {notice && (
          <div
            className={`p-3 border text-xs rounded font-medium ${
              notice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {notice.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 max-w-lg text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border rounded border-gray-300 focus:outline-none focus:border-[#2874f0]"
              placeholder="Your full name"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Mobile Number</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled
                value={user?.phone ? `+91 ${user.phone}` : ""}
                className="w-full p-2.5 border rounded bg-gray-50 text-gray-500 font-mono"
              />
              <span className="text-emerald-600 font-bold text-[11px] shrink-0 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email Address (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded border-gray-300 focus:outline-none focus:border-[#2874f0]"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#2874f0] hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-sm transition flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </form>

        <div className="pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-2">
          <h3 className="font-bold text-gray-800 text-xs">FAQs</h3>
          <p>
            <strong>Can I change my mobile number?</strong>
            <br />
            Your login identity is linked to your verified mobile number. To change it, please contact {SITE_CONFIG.storeName} support.
          </p>
          <p>
            <strong>Why add an email?</strong>
            <br />
            Order confirmations and invoices will also be sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
