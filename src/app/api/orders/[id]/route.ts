import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/services/auth";
import { cancelOrderByCustomer, getOrderById } from "@/lib/services/order";
import { apiError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;

    // Admins may look up any order; customers only their own.
    const order = await getOrderById(id, user.role === "ADMIN" ? undefined : user.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return apiError(error, "Failed to fetch order");
  }
}

const ActionSchema = z.object({
  action: z.literal("cancel"),
});

/**
 * Customer actions on their own order (currently: cancel before shipping).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const order = await cancelOrderByCustomer(id, user.id);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return apiError(error, "Failed to update order");
  }
}
