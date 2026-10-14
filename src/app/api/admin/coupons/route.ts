import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { IS_PRODUCTION } from "@/lib/config";

const DEV_COUPONS_FILE = path.join(process.cwd(), "src", "lib", "data", "dev-coupons.json");

function loadDevCoupons(): any[] {
  try {
    if (fs.existsSync(DEV_COUPONS_FILE)) {
      return JSON.parse(fs.readFileSync(DEV_COUPONS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load dev coupons:", e);
  }
  return [];
}

function persistDevCoupons(coupons: any[]) {
  try {
    fs.writeFileSync(DEV_COUPONS_FILE, JSON.stringify(coupons, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist dev coupons:", e);
  }
}

const globalForCoupons = globalThis as unknown as {
  devCoupons?: any[];
};

if (!globalForCoupons.devCoupons) {
  globalForCoupons.devCoupons = loadDevCoupons();
}

export function getDevCoupons(): any[] {
  if (!globalForCoupons.devCoupons || globalForCoupons.devCoupons.length === 0) {
    globalForCoupons.devCoupons = loadDevCoupons();
  }
  return globalForCoupons.devCoupons;
}

export function saveDevCoupons(coupons: any[]) {
  globalForCoupons.devCoupons = coupons;
  persistDevCoupons(coupons);
}

export async function GET() {
  try {
    await requireAdminSession();
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (coupons.length > 0) {
        return NextResponse.json({ coupons });
      }
    } catch (err) {
      if (IS_PRODUCTION) throw err;
    }
    return NextResponse.json({ coupons: getDevCoupons() });
  } catch (error) {
    return apiError(error, "Failed to load coupons");
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const newCoupon = {
      id: `cpn-${Date.now()}`,
      code: String(body.code || "").trim().toUpperCase(),
      description: body.description || null,
      discountType: body.discountType || "PERCENTAGE",
      discountValue: Number(body.discountValue) || 10,
      minOrderValue: Number(body.minOrderValue) || 0,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      validTo: body.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: Number(body.usageLimit) || 1000,
      usedCount: 0,
      isActive: body.isActive ?? true,
    };

    try {
      const created = await prisma.coupon.create({
        data: {
          code: newCoupon.code,
          description: newCoupon.description,
          discountType: newCoupon.discountType as any,
          discountValue: newCoupon.discountValue,
          minOrderValue: newCoupon.minOrderValue,
          maxDiscount: newCoupon.maxDiscount,
          validTo: new Date(newCoupon.validTo),
          usageLimit: newCoupon.usageLimit,
          isActive: newCoupon.isActive,
        },
      });
      return NextResponse.json({ success: true, coupon: created });
    } catch (err) {
      if (IS_PRODUCTION) throw err;
      const coupons = getDevCoupons();
      coupons.unshift(newCoupon);
      saveDevCoupons(coupons);
      return NextResponse.json({ success: true, coupon: newCoupon });
    }
  } catch (error) {
    return apiError(error, "Failed to create coupon");
  }
}
