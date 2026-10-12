"use client";

import React, { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import type { AddressData } from "@/lib/services/address";
import { AddressInputSchema, INDIAN_STATES } from "@/lib/validation/address";
import { GOOGLE_MAPS_BROWSER_KEY } from "@/lib/config";

export interface AddressFormValues {
  fullName: string;
  phone: string;
  pinCode: string;
  state: string;
  city: string;
  street: string;
  houseFlat: string;
  landmark: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

interface AddressFormProps {
  initial?: Partial<AddressData>;
  defaultPhone?: string;
  defaultName?: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSaved: (address: AddressData) => void;
}

const emptyValues = (initial?: Partial<AddressData>, defaultName = "", defaultPhone = ""): AddressFormValues => ({
  fullName: initial?.fullName ?? defaultName,
  phone: initial?.phone ?? defaultPhone,
  pinCode: initial?.pinCode ?? "",
  state: initial?.state ?? "",
  city: initial?.city ?? "",
  street: initial?.street ?? "",
  houseFlat: initial?.houseFlat ?? "",
  landmark: initial?.landmark ?? "",
  type: initial?.type ?? "HOME",
  isDefault: initial?.isDefault ?? false,
  latitude: initial?.latitude,
  longitude: initial?.longitude,
});

const inputClass =
  "w-full p-2.5 border rounded border-gray-300 bg-white text-xs text-gray-900 focus:outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-blue-100 disabled:bg-gray-50";

/**
 * Flipkart-style address form shared by Checkout and My Account.
 * - PIN code autofills City/State (India Post API)
 * - "Use my current location" (Geolocation + Google reverse geocoding)
 * - Google Places autocomplete for searching an area (when a Maps key is configured)
 */
export function AddressForm({ initial, defaultName, defaultPhone, submitLabel, onCancel, onSaved }: AddressFormProps) {
  const isEdit = Boolean(initial?.id);
  const [values, setValues] = useState<AddressFormValues>(() => emptyValues(initial, defaultName, defaultPhone));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const placesInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [placesReady, setPlacesReady] = useState(false);

  const set = <K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Google Places Autocomplete ───────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_MAPS_BROWSER_KEY || !placesInputRef.current || autocompleteRef.current) return;
    let cancelled = false;

    import("@/lib/google-maps")
      .then(async ({ loadGoogleMaps, parsePlace }) => {
        const google = await loadGoogleMaps(GOOGLE_MAPS_BROWSER_KEY);
        if (cancelled || !placesInputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(placesInputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "geometry", "formatted_address", "name"],
          types: ["geocode", "establishment"],
        });
        autocomplete.addListener("place_changed", () => {
          const parsed = parsePlace(autocomplete.getPlace());
          setValues((prev) => ({
            ...prev,
            houseFlat: parsed.houseFlat || prev.houseFlat,
            street: parsed.street || prev.street,
            city: parsed.city || prev.city,
            state: parsed.state || prev.state,
            pinCode: parsed.pinCode || prev.pinCode,
            latitude: parsed.latitude ?? prev.latitude,
            longitude: parsed.longitude ?? prev.longitude,
          }));
          setLocationNote(parsed.formattedAddress ? `Selected: ${parsed.formattedAddress}` : null);
        });
        autocompleteRef.current = autocomplete;
        setPlacesReady(true);
      })
      .catch((err) => console.warn("Google Places unavailable:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // ── PIN code → City/State autofill ──────────────────────────────────────
  useEffect(() => {
    if (!/^[1-9][0-9]{5}$/.test(values.pinCode)) {
      setAreaSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setIsPinLoading(true);
    fetch(`/api/location/pincode/${values.pinCode}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.found) return;
        setValues((prev) => ({
          ...prev,
          city: prev.city || data.city,
          state: INDIAN_STATES.includes(data.state) ? data.state : prev.state || data.state,
        }));
        setAreaSuggestions(data.areas || []);
      })
      .catch(() => {})
      .finally(() => setIsPinLoading(false));
    return () => controller.abort();
  }, [values.pinCode]);

  // ── Geolocation ─────────────────────────────────────────────────────────
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Your browser does not support location access.");
      return;
    }
    setIsLocating(true);
    setFormError(null);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (!res.ok) {
            setValues((prev) => ({ ...prev, latitude, longitude }));
            setLocationNote(
              res.status === 503
                ? "Location captured. Add a Google Maps key to auto-fill the address."
                : data.error || "Could not resolve your address; please fill it manually."
            );
            return;
          }
          setValues((prev) => ({
            ...prev,
            houseFlat: data.houseFlat || prev.houseFlat,
            street: data.street || prev.street,
            city: data.city || prev.city,
            state: data.state || prev.state,
            pinCode: data.pinCode || prev.pinCode,
            latitude,
            longitude,
          }));
          setLocationNote(data.formattedAddress ? `Detected: ${data.formattedAddress}` : "Location detected.");
        } catch {
          setFormError("Could not detect your address. Please fill it manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setFormError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please allow location access or enter the address manually."
            : "Unable to fetch your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = AddressInputSchema.safeParse({
      ...values,
      landmark: values.landmark || undefined,
      latitude: values.latitude ?? undefined,
      longitude: values.longitude ?? undefined,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/addresses/${initial!.id}` : "/api/addresses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok || !data.address) {
        throw new Error(data.error || "Failed to save address");
      }
      onSaved(data.address as AddressData);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorText = (key: keyof AddressFormValues) =>
    fieldErrors[key] ? <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs" noValidate>
      {formError && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded font-medium">{formError}</div>
      )}

      {/* Location helpers */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2874f0] hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded shadow-xs transition"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Use my current location
        </button>

        {GOOGLE_MAPS_BROWSER_KEY && (
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              ref={placesInputRef}
              type="text"
              placeholder={placesReady ? "Search area, street, landmark..." : "Loading Google Maps..."}
              className={`${inputClass} pl-8`}
              disabled={!placesReady}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            />
          </div>
        )}
      </div>
      {locationNote && (
        <p className="text-[11px] text-emerald-700 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {locationNote}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            placeholder="Full Name *"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
          {errorText("fullName")}
        </div>
        <div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number *"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={inputClass}
            autoComplete="tel-national"
          />
          {errorText("phone")}
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Pincode *"
            value={values.pinCode}
            onChange={(e) => set("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inputClass}
            autoComplete="postal-code"
          />
          {isPinLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-2.5 top-2.5" />}
          {errorText("pinCode")}
        </div>
        <div>
          <input
            type="text"
            placeholder="Locality / Area / Street *"
            value={values.street}
            onChange={(e) => set("street", e.target.value)}
            className={inputClass}
            list={areaSuggestions.length ? "address-area-suggestions" : undefined}
            autoComplete="address-line2"
          />
          {areaSuggestions.length > 0 && (
            <datalist id="address-area-suggestions">
              {areaSuggestions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          )}
          {errorText("street")}
        </div>

        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Flat / House No. / Building / Company *"
            value={values.houseFlat}
            onChange={(e) => set("houseFlat", e.target.value)}
            className={inputClass}
            autoComplete="address-line1"
          />
          {errorText("houseFlat")}
        </div>

        <div>
          <input
            type="text"
            placeholder="City / District / Town *"
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClass}
            autoComplete="address-level2"
          />
          {errorText("city")}
        </div>
        <div>
          <select
            value={values.state}
            onChange={(e) => set("state", e.target.value)}
            className={inputClass}
            autoComplete="address-level1"
          >
            <option value="">-- Select State --</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {values.state && !INDIAN_STATES.includes(values.state as (typeof INDIAN_STATES)[number]) && (
              <option value={values.state}>{values.state}</option>
            )}
          </select>
          {errorText("state")}
        </div>

        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Landmark (Optional)"
            value={values.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Address type */}
      <div>
        <p className="font-semibold text-gray-700 mb-1.5">Address Type</p>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["HOME", "Home (All day delivery)"],
              ["WORK", "Work (Delivery between 10 AM - 5 PM)"],
              ["OTHER", "Other"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="addressType"
                value={value}
                checked={values.type === value}
                onChange={() => set("type", value)}
                className="text-[#2874f0]"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="rounded text-[#2874f0]"
        />
        <span className="text-gray-700">Make this my default address</span>
      </label>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[#fb641b] hover:bg-[#e05310] disabled:bg-gray-300 text-white font-bold rounded shadow-xs uppercase tracking-wide flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel || (isEdit ? "Save Changes" : "Save and Deliver Here")}
        </button>
      </div>
    </form>
  );
}
