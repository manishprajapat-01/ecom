import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/services/auth";
import { getStorefrontConfig, updateStorefrontConfig } from "@/lib/services/storefront";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const config = await getStorefrontConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return apiError(error, "Failed to load storefront configuration");
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();

    const updated = await updateStorefrontConfig(body);

    // Revalidate paths so storefront updates immediately
    try {
      revalidatePath("/");
      revalidatePath("/products");
    } catch {
      // ignore in local dev if next cache is not active
    }

    return NextResponse.json({
      success: true,
      message: "Storefront configuration updated successfully",
      config: updated,
    });
  } catch (error) {
    return apiError(error, "Failed to update storefront configuration");
  }
}
