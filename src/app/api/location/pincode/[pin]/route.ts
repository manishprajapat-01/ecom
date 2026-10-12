import { NextResponse } from "next/server";
import { validateIndianPinCode } from "@/lib/services/address";

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Block?: string;
}

interface PincodeApiResponse {
  Status: "Success" | "Error" | "404";
  Message?: string;
  PostOffice?: PostOffice[] | null;
}

/**
 * PIN code → city/state/localities lookup using the free India Post API.
 * Proxied through the server so the client never depends on third-party CORS.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  if (!validateIndianPinCode(pin)) {
    return NextResponse.json({ error: "Enter a valid 6-digit PIN code" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 60 * 60 * 24 * 30 }, // PIN data rarely changes – cache 30 days
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const data = (await res.json()) as PincodeApiResponse[];
    const result = data?.[0];
    const offices = result?.PostOffice || [];

    if (result?.Status !== "Success" || offices.length === 0) {
      return NextResponse.json({ found: false, error: "PIN code not found" }, { status: 404 });
    }

    const first = offices[0];
    return NextResponse.json({
      found: true,
      pinCode: pin,
      city: first.District,
      state: first.State,
      areas: Array.from(new Set(offices.map((o) => o.Name))).slice(0, 25),
    });
  } catch (error) {
    console.error("[pincode lookup]", error);
    return NextResponse.json({ found: false, error: "PIN code lookup is temporarily unavailable" }, { status: 503 });
  }
}
