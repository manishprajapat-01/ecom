import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/services/auth";
import { getOrderById, ORDER_STATUSES, updateOrderStatus } from "@/lib/services/order";
import { apiError } from "@/lib/api";

const UpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    return apiError(error, "Failed to fetch order");
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession();
    const { id } = await params;

    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const updated = await updateOrderStatus(id, parsed.data.status as (typeof ORDER_STATUSES)[number], admin.id);
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    return apiError(error, "Failed to update order");
  }
}
