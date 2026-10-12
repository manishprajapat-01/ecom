import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { getAllOrders } from "@/lib/services/order";
import { apiError } from "@/lib/api";

const LOW_STOCK_THRESHOLD = 15;

export async function GET() {
  try {
    await requireAdminSession();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [revenue, totalOrders, pendingOrders, todayOrders, totalProducts, lowStockCount, lowStockProducts, recentOrders] =
      await Promise.all([
        prisma.order.aggregate({
          _sum: { finalAmount: true },
          where: { paymentStatus: "PAID", status: { notIn: ["CANCELLED", "RETURNED"] } },
        }),
        prisma.order.count(),
        prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD }, isPublished: true } }),
        prisma.product.findMany({
          where: { stock: { lte: LOW_STOCK_THRESHOLD }, isPublished: true },
          orderBy: { stock: "asc" },
          take: 6,
          select: { id: true, title: true, stock: true, sku: true },
        }),
        getAllOrders({ limit: 6 }),
      ]);

    return NextResponse.json({
      totalRevenuePaise: revenue._sum.finalAmount || 0,
      totalOrders,
      pendingOrders,
      todayOrders,
      totalProducts,
      lowStockCount,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    return apiError(error, "Failed to load stats");
  }
}
