"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SessionUser } from "../lib/services/auth";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED } from "../lib/config";

type Result = { success: boolean; message: string };

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  demoLoginEnabled: boolean;
  refreshUser: () => Promise<void>;
  /** Development-only OTP (no Firebase configured). */
  sendDevOtp: (phone: string) => Promise<Result & { devOtp?: string }>;
  verifyDevOtp: (phone: string, otp: string, name?: string) => Promise<Result>;
  /** Production flow: exchange a Firebase ID token for a session. */
  loginWithFirebaseToken: (idToken: string, name?: string) => Promise<Result>;
  loginDemo: (role: "CUSTOMER" | "ADMIN") => Promise<Result>;
  updateProfile: (data: { name: string; email?: string }) => Promise<Result>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function postJson<T = Record<string, unknown>>(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = res.ok ? await res.json() : { user: null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const sendDevOtp = async (phone: string) => {
    try {
      const { ok, data } = await postJson<{ message?: string; devOtp?: string }>("/api/auth/send-otp", { phone });
      if (!ok) return { success: false, message: data.error || "Failed to send OTP" };
      return { success: true, message: data.message || "OTP sent", devOtp: data.devOtp };
    } catch (err) {
      return { success: false, message: (err as Error).message || "Network error sending OTP" };
    }
  };

  const verifyDevOtp = async (phone: string, otp: string, name?: string) => {
    try {
      const { ok, data } = await postJson<{ user?: SessionUser }>("/api/auth/verify-otp", { phone, otp, name });
      if (!ok || !data.user) return { success: false, message: data.error || "Failed to verify OTP" };
      setUser(data.user);
      return { success: true, message: "Logged in successfully" };
    } catch (err) {
      return { success: false, message: (err as Error).message || "Network error verifying OTP" };
    }
  };

  const loginWithFirebaseToken = async (idToken: string, name?: string) => {
    try {
      const { ok, data } = await postJson<{ user?: SessionUser }>("/api/auth/firebase", { idToken, name });
      if (!ok || !data.user) return { success: false, message: data.error || "Login failed" };
      setUser(data.user);
      return { success: true, message: "Logged in successfully" };
    } catch (err) {
      return { success: false, message: (err as Error).message || "Network error during login" };
    }
  };

  const loginDemo = async (role: "CUSTOMER" | "ADMIN") => {
    if (!DEMO_LOGIN_ENABLED) {
      return { success: false, message: "Demo login is disabled." };
    }
    const account = role === "ADMIN" ? DEMO_ACCOUNTS.admin : DEMO_ACCOUNTS.customer;
    return verifyDevOtp(account.phone, DEMO_ACCOUNTS.otp, account.name);
  };

  const updateProfile = async (payload: { name: string; email?: string }) => {
    try {
      const { ok, data } = await postJson<{ user?: SessionUser }>("/api/auth/profile", payload, "PUT");
      if (!ok || !data.user) return { success: false, message: data.error || "Failed to update profile" };
      setUser(data.user);
      return { success: true, message: "Profile updated" };
    } catch (err) {
      return { success: false, message: (err as Error).message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        demoLoginEnabled: DEMO_LOGIN_ENABLED,
        refreshUser,
        sendDevOtp,
        verifyDevOtp,
        loginWithFirebaseToken,
        loginDemo,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
