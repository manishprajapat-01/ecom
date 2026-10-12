import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  requireSession,
  sessionCookieOptions,
  signSessionToken,
  updateUserProfile,
} from "@/lib/services/auth";

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]).optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const parsed = ProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const user = await updateUserProfile(session.id, {
      name: parsed.data.name,
      email: parsed.data.email === undefined ? undefined : parsed.data.email || null,
    });

    // Re-issue the session cookie so the cached name/email in the JWT stay in sync.
    const response = NextResponse.json({ success: true, user });
    response.cookies.set({ ...sessionCookieOptions(), value: signSessionToken(user) });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = (error as { code?: string })?.code === "P2002"
      ? "This email is already linked to another account."
      : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
