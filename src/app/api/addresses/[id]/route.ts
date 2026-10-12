import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/auth";
import { deleteAddress, updateAddress } from "@/lib/services/address";
import { AddressInputSchema } from "@/lib/validation/address";
import { apiError } from "@/lib/api";

const AddressPatchSchema = AddressInputSchema.partial();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const parsed = AddressPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid address details" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const address = await updateAddress(id, user.id, {
      ...data,
      landmark: data.landmark === undefined ? undefined : data.landmark || undefined,
      latitude: data.latitude === undefined ? undefined : data.latitude ?? undefined,
      longitude: data.longitude === undefined ? undefined : data.longitude ?? undefined,
    });
    return NextResponse.json({ success: true, address });
  } catch (error) {
    return apiError(error, "Failed to update address");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    await deleteAddress(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete address");
  }
}
