"use client";

/// <reference types="google.maps" />

let loaderPromise: Promise<typeof google> | null = null;

/**
 * Load the Google Maps JavaScript API (Places library) exactly once.
 */
export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in the browser"));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = "__bbGoogleMapsReady";
    (window as unknown as Record<string, unknown>)[callbackName] = () => resolve(window.google);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&region=IN&language=en&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export interface ParsedPlace {
  houseFlat: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
}

/**
 * Map Google address components onto our address fields.
 */
export function parsePlace(place: google.maps.places.PlaceResult): ParsedPlace {
  const components = place.address_components || [];
  const get = (...types: string[]) => {
    for (const type of types) {
      const match = components.find((c) => c.types.includes(type));
      if (match) return match.long_name;
    }
    return "";
  };

  const streetParts = [
    get("route"),
    get("sublocality_level_2"),
    get("sublocality_level_1", "sublocality", "neighborhood"),
  ].filter(Boolean);

  return {
    houseFlat: get("premise", "subpremise", "street_number"),
    street: Array.from(new Set(streetParts)).join(", ") || (place.name ?? ""),
    city: get("locality", "administrative_area_level_3", "administrative_area_level_2"),
    state: get("administrative_area_level_1"),
    pinCode: get("postal_code"),
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
    formattedAddress: place.formatted_address || "",
  };
}
