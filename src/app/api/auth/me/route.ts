import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/services/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
