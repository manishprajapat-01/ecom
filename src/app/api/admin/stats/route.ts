import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { getAllOrders } from "@/lib/services/order";
import { getDevCatalog } from "@/lib/services/catalog";
import { apiError } from "@/lib/api";
import { IS_PRODUCTION } from "@/lib/config";

const LOW_STOCK_THRESHOLD = 15;

export async function GET() {
  try {
    await requireAdminSession();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    try {
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

      if (totalOrders > 0 || totalProducts > 0) {
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
      }
    } catch (err) {
      if (IS_PRODUCTION) throw err;
    }

    if (!IS_PRODUCTION) {
      const allOrders = await getAllOrders({ limit: 500 });
      const devCatalog = getDevCatalog();
      const allProducts = devCatalog.products;

      const revenuePaise = allOrders
        .filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED" && o.status !== "RETURNED")
        .reduce((sum, o) => sum + o.finalAmount, 0);

      const pendingOrders = allOrders.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status)).length;
      const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday).length;

      const lowStock = allProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);

      return NextResponse.json({
        totalRevenuePaise: revenuePaise,
        totalOrders: allOrders.length,
        pendingOrders,
        todayOrders,
        totalProducts: allProducts.length,
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock.slice(0, 6).map((p) => ({
          id: p.id,
          title: p.title,
          stock: p.stock,
          sku: p.sku,
        })),
        recentOrders: allOrders.slice(0, 6),
      });
    }

    return NextResponse.json({ error: "No data available" }, { status: 404 });
  } catch (error) {
    return apiError(error, "Failed to load stats");
  }
}
