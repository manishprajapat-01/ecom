import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  validateIndianPhoneNumber,
  getOrCreateCustomerByPhone,
  signSessionToken,
  sessionCookieOptions,
} from "@/lib/services/auth";
import { DEV_OTP_ENABLED, verifyStoredOtp } from "@/lib/services/otp";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED } from "@/lib/config";

const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  name: z.string().max(80).optional(),
});

/**
 * DEVELOPMENT-ONLY OTP verification (plus the one-click demo accounts when enabled).
 * Production verification goes through /api/auth/firebase.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { phone, otp, name } = parsed.data;
    const { isValid, cleaned } = validateIndianPhoneNumber(phone);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Indian mobile phone number" }, { status: 400 });
    }

    const isDemoAccount =
      DEMO_LOGIN_ENABLED &&
      (cleaned === DEMO_ACCOUNTS.customer.phone || cleaned === DEMO_ACCOUNTS.admin.phone);

    if (!DEV_OTP_ENABLED && !isDemoAccount) {
      return NextResponse.json(
        { error: "Development OTP is disabled. Use Firebase phone verification." },
        { status: 404 }
      );
    }

    const verification = verifyStoredOtp(cleaned, otp);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || "Invalid OTP code" }, { status: 400 });
    }

    const user = await getOrCreateCustomerByPhone(cleaned, name);
    const token = signSessionToken(user);

    const response = NextResponse.json({ success: true, message: "Authentication successful", user });
    response.cookies.set({ ...sessionCookieOptions(), value: token });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[verify-otp]", error);
    return NextResponse.json(
      { error: "Authentication failed. Please make sure the database is reachable and try again." },
      { status: 500 }
    );
  }
}
