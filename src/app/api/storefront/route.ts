import { NextResponse } from "next/server";
import { getStorefrontConfig } from "@/lib/services/storefront";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getStorefrontConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load storefront" },
      { status: 500 }
    );
  }
}
