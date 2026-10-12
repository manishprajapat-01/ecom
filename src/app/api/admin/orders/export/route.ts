import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import { getAllOrders } from "@/lib/services/order";
import { apiError } from "@/lib/api";

function csvCell(value: unknown): string {
  const str = String(value ?? "");
  // Neutralise spreadsheet formula injection and escape quotes
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdminSession();
    const orders = await getAllOrders({ limit: 5000 });

    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Phone",
      "City",
      "PIN Code",
      "Items Count",
      "Payment Method",
      "Payment Status",
      "Payment Ref",
      "Fulfillment Status",
      "Subtotal (₹)",
      "Discount (₹)",
      "Shipping (₹)",
      "Total (₹)",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString().split("T")[0],
      o.address.fullName || o.customer?.name || "",
      o.address.phone || o.customer?.phone || "",
      o.address.city,
      o.address.pinCode,
      o.items.reduce((acc, i) => acc + i.quantity, 0),
      o.paymentMethod,
      o.paymentStatus,
      o.razorpayPaymentId || "",
      o.status,
      (o.totalAmount / 100).toFixed(2),
      (o.discountAmount / 100).toFixed(2),
      (o.shippingFee / 100).toFixed(2),
      (o.finalAmount / 100).toFixed(2),
    ]);

    const csvContent = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");

    return new NextResponse(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=orders-export-${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    return apiError(error, "Failed to export orders");
  }
}
