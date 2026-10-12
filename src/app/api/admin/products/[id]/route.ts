import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteProduct, getProductById, updateProduct } from "@/lib/services/catalog";
import { deleteFromCloudinary } from "@/lib/services/cloudinary";
import { requireAdminSession } from "@/lib/services/auth";
import { ProductUpdateSchema } from "@/lib/validation/product";
import { apiError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error, "Failed to fetch product");
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const parsed = ProductUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product input" },
        { status: 400 }
      );
    }

    const updated = await updateProduct(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${updated.slug}`);
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return apiError(error, "Failed to update product");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const result = await deleteProduct(id);
    // Best-effort cleanup of Cloudinary assets for hard-deleted products
    await Promise.allSettled(result.imagePublicIds.map((publicId) => deleteFromCloudinary(publicId)));

    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({
      success: true,
      archived: result.archived,
      message: result.archived
        ? "This product has past orders, so it was unpublished and its stock set to 0 instead of being deleted."
        : "Product deleted.",
    });
  } catch (error) {
    return apiError(error, "Failed to delete product");
  }
}
