import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProducts, addProduct } from "@/lib/services/catalog";
import { requireAdminSession } from "@/lib/services/auth";
import { ProductInputSchema } from "@/lib/validation/product";
import { apiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || undefined;
    const page = Number(searchParams.get("page") || 1);

    const result = await getProducts({ limit: 100, page, search, includeUnpublished: true, sort: "newest" });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, "Failed to load products");
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminSession();

    const parsed = ProductInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product input" },
        { status: 400 }
      );
    }

    const created = await addProduct(parsed.data);
    console.log(`[admin] ${admin.phone} created product ${created.sku}`);

    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ success: true, product: created });
  } catch (error) {
    return apiError(error, "Failed to create product");
  }
}
