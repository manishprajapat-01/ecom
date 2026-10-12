import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  getOrCreateCustomerByPhone,
  sessionCookieOptions,
  signSessionToken,
  validateIndianPhoneNumber,
} from "@/lib/services/auth";
import { isFirebaseAdminConfigured, verifyFirebasePhoneToken } from "@/lib/firebase/admin";

const Schema = z.object({
  idToken: z.string().min(20, "Firebase ID token is required"),
  name: z.string().max(80).optional(),
});

/**
 * Exchange a Firebase Phone-Auth ID token for an application session.
 * The phone number is taken from the verified token – never from the client payload.
 */
export async function POST(req: Request) {
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        { error: "Phone verification is not configured on the server (FIREBASE_SERVICE_ACCOUNT_JSON missing)." },
        { status: 503 }
      );
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { idToken, name } = parsed.data;
    const { phoneNumber } = await verifyFirebasePhoneToken(idToken);

    const { isValid, cleaned } = validateIndianPhoneNumber(phoneNumber);
    if (!isValid) {
      return NextResponse.json({ error: "Only Indian (+91) mobile numbers are supported." }, { status: 400 });
    }

    const user = await getOrCreateCustomerByPhone(cleaned, name);
    const token = signSessionToken(user);

    const response = NextResponse.json({ success: true, user });
    response.cookies.set({ ...sessionCookieOptions(), value: token });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = (error as Error)?.message || "Authentication failed";
    const isTokenError = /token|expired|argument/i.test(message);
    return NextResponse.json(
      { error: isTokenError ? "Verification failed. Please request a new OTP." : message },
      { status: isTokenError ? 401 : 500 }
    );
  }
}
