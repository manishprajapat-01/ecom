import { NextResponse } from "next/server";
import { z } from "zod";
import { validateIndianPhoneNumber } from "@/lib/services/auth";
import { DEV_OTP_ENABLED, generateOtp, storeOtp, checkOtpRateLimit } from "@/lib/services/otp";

const SendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

/**
 * DEVELOPMENT-ONLY OTP dispatch.
 * In production (or whenever Firebase is configured) phone verification is handled
 * entirely by Firebase Phone Auth on the client and /api/auth/firebase on the server.
 */
export async function POST(req: Request) {
  if (!DEV_OTP_ENABLED) {
    return NextResponse.json(
      { error: "Development OTP is disabled. Use Firebase phone verification." },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { isValid, cleaned, formatted } = validateIndianPhoneNumber(parsed.data.phone);
    if (!isValid) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)" },
        { status: 400 }
      );
    }

    const rateCheck = checkOtpRateLimit(cleaned);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many OTP requests. Please wait ${rateCheck.waitSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    storeOtp(cleaned, otp);
    console.log(`[DEV OTP] Code for ${formatted}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${formatted}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to process OTP request" },
      { status: 500 }
    );
  }
}
