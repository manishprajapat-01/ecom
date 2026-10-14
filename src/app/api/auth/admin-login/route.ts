import { NextResponse } from "next/server";
import { z } from "zod";
import { signSessionToken, sessionCookieOptions, type SessionUser } from "@/lib/services/auth";
import { ADMIN_CREDENTIALS } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const AdminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AdminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check against configured institutional admin credentials
    const isConfiguredAdmin =
      normalizedEmail === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;

    // 2. Check against database if reachable
    let dbAdminUser = null;
    try {
      dbAdminUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          role: "ADMIN",
          isActive: true,
        },
      });
    } catch (err) {
      // Database might be offline in local dev mode, proceed with configured credentials check
      console.warn("[admin-login] Database check skipped:", err);
    }

    if (!isConfiguredAdmin && !dbAdminUser) {
      return NextResponse.json(
        { error: "Invalid admin email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Build the admin session object
    const sessionUser: SessionUser = {
      id: dbAdminUser?.id || "admin-aadi-mahajani",
      phone: dbAdminUser?.phone || "9876543210",
      name: dbAdminUser?.name || ADMIN_CREDENTIALS.name,
      email: normalizedEmail,
      role: "ADMIN",
    };

    const token = signSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      user: sessionUser,
    });

    response.cookies.set({
      ...sessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    console.error("[admin-login] Error during admin login:", error);
    return NextResponse.json(
      { error: "Internal server error during admin login" },
      { status: 500 }
    );
  }
}
