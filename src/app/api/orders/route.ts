import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/auth";
import { getUserOrders } from "@/lib/services/order";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireSession();
    const orders = await getUserOrders(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    return apiError(error, "Failed to load orders");
  }
}
