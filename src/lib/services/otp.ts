import crypto from "crypto";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED, FIREBASE_CLIENT_CONFIGURED, IS_PRODUCTION } from "../config";

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  DEVELOPMENT OTP FALLBACK
 *
 *  Production mobile verification is done by Firebase Phone Authentication
 *  (see src/lib/firebase/* and /api/auth/firebase). This module only exists so
 *  the app can be developed locally without a Firebase project.
 *
 *  It is enabled ONLY when:
 *    - NODE_ENV !== "production", AND
 *    - Firebase client config is NOT present.
 * ───────────────────────────────────────────────────────────────────────────
 */
export const DEV_OTP_ENABLED = !IS_PRODUCTION && !FIREBASE_CLIENT_CONFIGURED;

interface OtpRecord {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Generate 6 digit numeric OTP (cryptographically random)
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Check rate limit (max 3 OTP requests per 2 minutes per number)
 */
export function checkOtpRateLimit(phone: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(phone);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Store OTP with 5 minute expiration
 */
export function storeOtp(phone: string, code: string) {
  otpStore.set(phone, {
    phone,
    codeHash: hashCode(code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

/**
 * Verify a development OTP.
 * The fixed demo OTP is accepted only for the two demo accounts and only when demo login is enabled.
 */
export function verifyStoredOtp(phone: string, inputCode: string): { valid: boolean; error?: string } {
  const code = inputCode.trim();

  const isDemoPhone = phone === DEMO_ACCOUNTS.customer.phone || phone === DEMO_ACCOUNTS.admin.phone;
  if (DEMO_LOGIN_ENABLED && isDemoPhone && code === DEMO_ACCOUNTS.otp) {
    otpStore.delete(phone);
    return { valid: true };
  }

  const record = otpStore.get(phone);
  if (!record) {
    return { valid: false, error: "OTP expired or not requested. Please request a new OTP." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, error: "OTP has expired. Please request a new OTP." };
  }

  record.attempts += 1;
  if (record.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(phone);
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const received = Buffer.from(hashCode(code), "hex");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return { valid: false, error: "Incorrect OTP. Please enter the 6-digit code received." };
  }

  // Clear upon success
  otpStore.delete(phone);
  return { valid: true };
}
