import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import { getAllOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/services/order";
import { apiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || undefined;
    const status = ORDER_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;
    const search = searchParams.get("q") || undefined;

    const orders = await getAllOrders({ status, search });
    return NextResponse.json({ orders });
  } catch (error) {
    return apiError(error, "Failed to load orders");
  }
}
