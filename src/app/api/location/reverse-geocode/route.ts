import { NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

interface GeocodeComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  formatted_address: string;
  address_components: GeocodeComponent[];
}

function pick(components: GeocodeComponent[], ...types: string[]): string {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match) return match.long_name;
  }
  return "";
}

/**
 * Convert device coordinates into address fields using the Google Geocoding API.
 * Uses a server-side key when available (GOOGLE_MAPS_SERVER_API_KEY) and falls back
 * to the browser key.
 */
export async function GET(req: Request) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ lat: searchParams.get("lat"), lng: searchParams.get("lng") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  const { lat, lng } = parsed.data;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("region", "in");
    url.searchParams.set("language", "en");

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { status: string; results: GeocodeResult[]; error_message?: string };

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        { error: data.error_message || "Could not determine address for this location" },
        { status: 404 }
      );
    }

    // Prefer the most specific result that has a postal code.
    const best = data.results.find((r) => r.address_components.some((c) => c.types.includes("postal_code"))) || data.results[0];
    const c = best.address_components;

    const streetParts = [
      pick(c, "premise", "subpremise"),
      pick(c, "route"),
      pick(c, "sublocality_level_2"),
      pick(c, "sublocality_level_1", "sublocality", "neighborhood"),
    ].filter(Boolean);

    return NextResponse.json({
      formattedAddress: best.formatted_address,
      houseFlat: pick(c, "premise", "subpremise", "street_number"),
      street: Array.from(new Set(streetParts)).join(", "),
      city: pick(c, "locality", "administrative_area_level_3", "administrative_area_level_2"),
      state: pick(c, "administrative_area_level_1"),
      pinCode: pick(c, "postal_code"),
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error("[reverse-geocode]", error);
    return NextResponse.json({ error: "Location lookup failed" }, { status: 502 });
  }
}
