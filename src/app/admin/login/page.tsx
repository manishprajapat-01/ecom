"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Store,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_CREDENTIALS, SITE_CONFIG } from "@/lib/config";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d233a] flex items-center justify-center text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-[#2874f0]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";
  const { user, loginAdmin, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as ADMIN, immediately route to /admin
  useEffect(() => {
    if (!isAuthLoading && user && user.role === "ADMIN") {
      router.replace(nextUrl);
    }
  }, [user, isAuthLoading, router, nextUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both admin email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginAdmin(email.trim(), password);
      if (result.success) {
        router.replace(nextUrl);
      } else {
        setErrorMessage(result.message || "Invalid admin credentials");
      }
    } catch (err) {
      setErrorMessage((err as Error).message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(ADMIN_CREDENTIALS.email);
    setPassword(ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#07172c] bg-radial from-[#0e2c52] to-[#06162a] text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Institutional Badges */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/10 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2874f0] flex items-center justify-center text-white shadow-xs">
            <Store className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <span className="text-sm font-black text-white">{SITE_CONFIG.storeName}</span>
            <span className="text-[10px] font-bold text-blue-200 ml-1.5 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
              Admin Gateway
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100 relative">
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1a3a8f] to-[#2874f0] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Store className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  {SITE_CONFIG.storeName}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2874f0]"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#2874f0] bg-blue-50 px-2 py-0.5 rounded-full">
                  Store Control Center
                </span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <ShieldCheck className="w-5 h-5 text-[#2874f0]" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-4">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Administrator Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your admin credentials to manage store banners, catalog, and fulfillments.
            </p>
          </div>

          {/* Quick Demo Autofill Pill */}
          <div className="mb-5 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Default Credentials:
              </span>
              <span className="font-mono text-slate-600 text-[11px]">
                {ADMIN_CREDENTIALS.email} / {ADMIN_CREDENTIALS.password}
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-[#2874f0] font-bold text-xs rounded-lg border border-blue-200 shadow-2xs transition whitespace-nowrap cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="admin-email-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  id="admin-email-input"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aadi28x6@gmail.com"
                  autoComplete="email"
                  required
                  autoFocus
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-[#2874f0] focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-none transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password-input" className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <span
                  className="text-[11px] text-[#2874f0] font-semibold cursor-pointer hover:underline"
                  onClick={handleFillDemo}
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  id="admin-password-input"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 pl-10 pr-11 bg-slate-50 border border-slate-200 focus:border-[#2874f0] focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-4 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="admin-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2874f0] focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 font-medium">Remember this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#2874f0] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Default Admin Account
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-bold text-[#2874f0] hover:underline"
                >
                  Fill Form
                </button>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-600">
                <div className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-800">{ADMIN_CREDENTIALS.email}</span>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400">Password:</span>
                  <span className="font-semibold text-slate-800">{ADMIN_CREDENTIALS.password}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Login Link */}
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-500 hover:text-[#2874f0] transition"
            >
              Switch to Customer Mobile Login &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-400 z-10 pt-4">
        <span>{SITE_CONFIG.storeName} Admin Platform &copy; 2026. Secure Access.</span>
      </div>
    </div>
  );
}
