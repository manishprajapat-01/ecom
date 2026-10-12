"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let recaptcha: RecaptchaVerifier | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
    auth.languageCode = "en";
  }
  return auth;
}

/**
 * Lazily create (and reuse) an invisible reCAPTCHA verifier bound to a container element id.
 */
export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  const authInstance = getFirebaseAuth();
  if (!recaptcha) {
    recaptcha = new RecaptchaVerifier(authInstance, containerId, { size: "invisible" });
  }
  return recaptcha;
}

export function resetRecaptcha() {
  try {
    recaptcha?.clear();
  } catch {
    // ignore
  }
  recaptcha = null;
}

/**
 * Send an OTP via Firebase to an Indian mobile number (10 digits, no country code).
 */
export async function sendFirebaseOtp(phone10: string, containerId: string): Promise<ConfirmationResult> {
  const authInstance = getFirebaseAuth();
  const verifier = getRecaptchaVerifier(containerId);
  try {
    return await signInWithPhoneNumber(authInstance, `+91${phone10}`, verifier);
  } catch (err) {
    // A failed attempt invalidates the reCAPTCHA token; rebuild it for the next try.
    resetRecaptcha();
    throw err;
  }
}

/**
 * Translate Firebase auth error codes into friendly messages.
 */
export function describeFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "The mobile number is invalid.";
    case "auth/too-many-requests":
      return "Too many attempts from this device. Please try again later.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Please check the code and try again.";
    case "auth/code-expired":
      return "This OTP has expired. Please request a new one.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Please try again later.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Please refresh and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return (err as Error)?.message || "Something went wrong. Please try again.";
  }
}
