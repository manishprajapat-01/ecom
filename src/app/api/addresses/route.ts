import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/auth";
import { createAddress, getUserAddresses } from "@/lib/services/address";
import { AddressInputSchema } from "@/lib/validation/address";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireSession();
    const addresses = await getUserAddresses(user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    return apiError(error, "Failed to load addresses");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSession();

    const parsed = AddressInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid address details" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const address = await createAddress(user.id, {
      ...data,
      landmark: data.landmark || undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    return apiError(error, "Failed to save address");
  }
}
