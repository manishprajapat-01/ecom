"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, KeyRound, Loader2, Sparkles, X } from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { FIREBASE_CLIENT_CONFIGURED, SITE_CONFIG } from "@/lib/config";

const RECAPTCHA_CONTAINER_ID = "firebase-recaptcha-container";
const GENERIC_LOGIN_ERROR = "Something went wrong. Please try again later.";

function safeNextPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isSessionLoading, sendDevOtp, verifyDevOtp, loginWithFirebaseToken } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const nextPath = safeNextPath(searchParams.get("next"), "/account");
  const canContinue = step === "PHONE" ? phone.length === 10 : otp.length === 6;

  useEffect(() => {
    if (!isSessionLoading && user) {
      router.replace(user.role === "ADMIN" && nextPath === "/account" ? "/admin" : nextPath);
    }
  }, [isSessionLoading, user, router, nextPath]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (FIREBASE_CLIENT_CONFIGURED) {
        const { sendFirebaseOtp, describeFirebaseError } = await import("@/lib/firebase/client");
        try {
          confirmationRef.current = await sendFirebaseOtp(phone, RECAPTCHA_CONTAINER_ID);
          setStep("OTP");
          setResendIn(30);
        } catch (err) {
          setErrorMsg(describeFirebaseError(err));
        }
      } else {
        const result = await sendDevOtp(phone);
        if (result.success) {
          setStep("OTP");
          setResendIn(30);
        } else {
          setErrorMsg(GENERIC_LOGIN_ERROR);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let result: { success: boolean; message: string };

      if (FIREBASE_CLIENT_CONFIGURED) {
        const { describeFirebaseError } = await import("@/lib/firebase/client");
        if (!confirmationRef.current) {
          setErrorMsg("Please request an OTP first.");
          return;
        }
        try {
          const credential = await confirmationRef.current.confirm(otp);
          const idToken = await credential.user.getIdToken();
          result = await loginWithFirebaseToken(idToken, fullName || undefined);
        } catch (err) {
          setErrorMsg(describeFirebaseError(err));
          return;
        }
      } else {
        result = await verifyDevOtp(phone, otp, fullName || undefined);
      }

      if (result.success) {
        router.replace(nextPath);
      } else {
        setErrorMsg(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-[#f1f3f6] overflow-y-auto">
      <div className="min-h-dvh md:min-h-screen flex flex-col md:items-center md:justify-center">
        <div className="w-full md:max-w-[380px] md:min-h-[640px] md:shadow-xl md:border md:border-gray-200 md:bg-white md:overflow-hidden">
          <div className="h-16 bg-[#2874f0] text-white flex items-center justify-between px-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="p-1 -ml-1"
              aria-label="Close login"
            >
              <X className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2 font-black italic text-xl tracking-tight">
              {SITE_CONFIG.storeName}
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-yellow-400 text-[#2874f0] not-italic">
                <Sparkles className="w-4 h-4" />
              </span>
            </Link>

            <span className="w-6" />
          </div>

          <div className="relative -mt-1 flex-1 bg-white rounded-t-lg px-6 pt-8 pb-24 min-h-[calc(100dvh-4rem)] md:min-h-[576px]">
            <div className="mb-7">
              <h1 className="text-base font-bold text-gray-900">Log in for the best experience</h1>
              <p className="mt-2 text-sm text-gray-500">
                {step === "PHONE" ? "Enter your phone number to continue" : "Enter the OTP sent to your phone"}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {step === "PHONE" ? (
              <form id="login-phone-form" onSubmit={handleSendOtp} className="space-y-5">
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#2874f0]">
                    Phone Number
                  </label>
                  <div className="flex h-14 items-center rounded-sm border-2 border-[#2874f0] bg-white">
                    <span className="flex items-center gap-0.5 px-3 text-sm font-semibold text-gray-800">
                      +91 <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-full flex-1 px-1 text-sm font-medium text-gray-900 outline-none"
                      required
                      autoFocus
                      aria-label="Phone number"
                    />
                  </div>
                </div>

                <p className="pt-4 text-xs leading-4 text-gray-500">
                  By continuing, you confirm that you are above 18 years of age, and you agree to the{" "}
                  {SITE_CONFIG.storeName}&apos;s{" "}
                  <Link href="/terms" className="text-[#2874f0]">
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-[#2874f0]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            ) : (
              <form id="login-otp-form" onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">OTP sent to</span>
                    <p className="text-sm font-bold text-gray-900">+91 {phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setOtp("");
                      confirmationRef.current = null;
                    }}
                    className="text-sm font-semibold text-[#2874f0]"
                  >
                    Change
                  </button>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#2874f0]">
                    OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-14 w-full rounded-sm border-2 border-[#2874f0] px-4 pr-11 text-center text-lg font-bold tracking-widest text-gray-900 outline-none"
                    required
                    autoFocus
                  />
                  <KeyRound className="absolute right-3 top-5 w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>OTP sent</span>
                  <button
                    type="button"
                    disabled={resendIn > 0 || isLoading}
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-[#2874f0] disabled:text-gray-400"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            <div id={RECAPTCHA_CONTAINER_ID} />

            <div className="fixed bottom-0 left-0 right-0 z-[101] bg-white px-2 pb-2 pt-2 border-t border-gray-200 md:absolute">
              <button
                type="submit"
                form={step === "PHONE" ? "login-phone-form" : "login-otp-form"}
                disabled={!canContinue || isLoading}
                className="h-11 w-full rounded-sm bg-[#fb641b] text-sm font-bold text-white transition disabled:bg-gray-300"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {step === "PHONE" ? "SENDING OTP..." : "VERIFYING..."}
                  </span>
                ) : step === "PHONE" ? (
                  "Continue"
                ) : (
                  "Verify & Login"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
