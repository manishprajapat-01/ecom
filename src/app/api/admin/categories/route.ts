import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/services/auth";
import { createCategory, getCategories } from "@/lib/services/catalog";
import { CategoryInputSchema } from "@/lib/validation/product";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdminSession();
    const categories = await getCategories({ includeInactive: true });
    return NextResponse.json({ categories });
  } catch (error) {
    return apiError(error, "Failed to load categories");
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const parsed = CategoryInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid category" }, { status: 400 });
    }
    const category = await createCategory({ ...parsed.data, image: parsed.data.image || undefined });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return apiError(error, "Failed to create category");
  }
}
