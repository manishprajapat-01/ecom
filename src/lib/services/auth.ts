import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED, IS_PRODUCTION } from "../config";

const DEFAULT_DEV_SECRET = "flipkart-dev-only-session-secret-change-me-in-production";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (IS_PRODUCTION && (!secret || secret.length < 32)) {
    throw new Error("JWT_SECRET must be set to a random string of at least 32 characters in production.");
  }
  return secret || DEFAULT_DEV_SECRET;
}

export const SESSION_COOKIE_NAME = "bharat_bazaar_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: "CUSTOMER" | "ADMIN";
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Sign JWT session token
 */
export function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

/**
 * Verify JWT session token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (!decoded.sub || typeof decoded.sub !== "string") return null;
    return {
      id: decoded.sub,
      phone: String(decoded.phone || ""),
      name: (decoded.name as string | null) || null,
      email: (decoded.email as string | null) || null,
      role: decoded.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
    };
  } catch {
    return null;
  }
}

/**
 * Cookie attributes used for the session cookie (login + logout share them).
 */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Get current session user from incoming HTTP cookies (Server Side)
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Require any logged-in user. Throws AuthError(401) otherwise.
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Please login to continue.", 401);
  }
  return user;
}

/**
 * Enforce Admin authorization. Throws AuthError(401/403) otherwise.
 * The role is re-checked against the database so a demoted admin loses access immediately.
 */
export async function requireAdminSession(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== "ADMIN") {
    throw new AuthError("Admin privileges required.", 403);
  }
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });
    if (dbUser && (dbUser.role !== "ADMIN" || !dbUser.isActive)) {
      throw new AuthError("Admin privileges required.", 403);
    }
  } catch (err) {
    if (IS_PRODUCTION) {
      throw new AuthError("Admin privileges verification failed.", 403);
    }
    // In development mode, allow configured admin session
  }
  return user;
}

/**
 * Validate Indian 10-digit mobile number
 */
export function validateIndianPhoneNumber(phone: string): { isValid: boolean; cleaned: string; formatted: string } {
  // Strip non-digits
  let digits = phone.replace(/\D/g, "");

  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Indian numbers must be 10 digits and start with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(digits);

  return {
    isValid,
    cleaned: digits,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
}

/**
 * Phone numbers that are automatically promoted to ADMIN on login.
 * Configure with ADMIN_PHONES="9876543210,9811111111".
 */
export function getConfiguredAdminPhones(): string[] {
  return (process.env.ADMIN_PHONES || "")
    .split(",")
    .map((p) => validateIndianPhoneNumber(p))
    .filter((p) => p.isValid)
    .map((p) => p.cleaned);
}

/**
 * Find or create user by (already verified) phone number.
 * The caller MUST have verified ownership of the phone number (Firebase OTP) before calling this.
 */
export async function getOrCreateCustomerByPhone(phone: string, name?: string): Promise<SessionUser> {
  const { cleaned, isValid } = validateIndianPhoneNumber(phone);
  if (!isValid) {
    throw new AuthError("Invalid Indian mobile number.", 400);
  }

  const shouldBeAdmin =
    getConfiguredAdminPhones().includes(cleaned) ||
    (DEMO_LOGIN_ENABLED && cleaned === DEMO_ACCOUNTS.admin.phone);
  const trimmedName = name?.trim() || undefined;

  try {
    const user = await prisma.user.upsert({
      where: { phone: cleaned },
      update: {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(shouldBeAdmin ? { role: "ADMIN" } : {}),
      },
      create: {
        phone: cleaned,
        name: trimmedName || `Customer ${cleaned.slice(-4)}`,
        role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
      },
    });

    if (!user.isActive) {
      throw new AuthError("This account has been deactivated. Please contact support.", 403);
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.warn("[auth] DB unreachable, returning dev fallback user:", err);
      return {
        id: "demo-user-" + cleaned,
        phone: cleaned,
        name: trimmedName || (shouldBeAdmin ? "Aadi Kiran Mahajani" : `Customer ${cleaned.slice(-4)}`),
        email: shouldBeAdmin ? "aadi28x6@gmail.com" : null,
        role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
      };
    }
    throw err;
  }
}

/**
 * Update the profile fields a customer is allowed to edit.
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; email?: string | null }
): Promise<SessionUser> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.name !== undefined ? { name: updates.name.trim() || null } : {}),
        ...(updates.email !== undefined ? { email: updates.email ? updates.email.trim().toLowerCase() : null } : {}),
      },
    });
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.warn("[auth] DB unreachable during updateUserProfile, returning updated session user:", err);
      return {
        id: userId,
        phone: "9812345678",
        name: updates.name !== undefined ? (updates.name.trim() || null) : "Rahul Sharma",
        email: updates.email !== undefined ? (updates.email ? updates.email.trim().toLowerCase() : null) : null,
        role: "CUSTOMER",
      };
    }
    throw err;
  }
}
