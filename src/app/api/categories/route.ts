import { NextResponse } from "next/server";
import { getCategories } from "@/lib/services/catalog";
import { apiError } from "@/lib/api";

/** Public: active categories for navigation and filters */
export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return apiError(error, "Failed to load categories");
  }
}
