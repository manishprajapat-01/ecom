import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/services/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({ ...sessionCookieOptions(0), value: "" });
  return response;
}
