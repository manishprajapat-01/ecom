import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/services/auth";
import { deleteCategory, updateCategory } from "@/lib/services/catalog";
import { CategoryInputSchema } from "@/lib/validation/product";
import { apiError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const parsed = CategoryInputSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid category" }, { status: 400 });
    }
    const category = await updateCategory(id, parsed.data);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return apiError(error, "Failed to update category");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const result = await deleteCategory(id);
    revalidatePath("/", "layout");
    return NextResponse.json({
      success: true,
      ...result,
      message: result.archived
        ? "This category still has products, so it was hidden instead of deleted."
        : "Category deleted.",
    });
  } catch (error) {
    return apiError(error, "Failed to delete category");
  }
}
