"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AddressForm } from "@/components/address/AddressForm";
import { useAuth } from "@/context/AuthContext";
import { Plus, MapPin, Trash2, CheckCircle2, Pencil, Loader2 } from "lucide-react";
import type { AddressData } from "@/lib/services/address";

function AddressesContent() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load addresses");
      setAddresses(data.addresses || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete address");
      }
      await loadAddresses();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleMakeDefault = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update address");
      }
      await loadAddresses();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <AccountSidebar />

      <div className="flex-1 w-full bg-white rounded-sm border border-gray-200 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2874f0]" /> Manage Addresses
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Save multiple delivery addresses for faster checkout</p>
          </div>

          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-[#2874f0] text-white font-bold text-xs rounded hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> ADD A NEW ADDRESS
            </button>
          )}
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">{error}</div>
        )}

        {isAdding && (
          <div className="p-4 border border-blue-200 rounded bg-blue-50/30">
            <h3 className="font-bold text-sm text-[#2874f0] uppercase tracking-wide mb-3">Add a New Address</h3>
            <AddressForm
              defaultName={user?.name || ""}
              defaultPhone={user?.phone || ""}
              onCancel={() => setIsAdding(false)}
              onSaved={() => {
                setIsAdding(false);
                loadAddresses();
              }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading addresses...
          </div>
        ) : addresses.length === 0 && !isAdding ? (
          <div className="py-10 text-center text-xs text-gray-500">
            <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            No saved addresses yet. Add one to speed up checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) =>
              editingId === addr.id ? (
                <div key={addr.id} className="p-4 border border-blue-200 rounded bg-blue-50/30">
                  <h3 className="font-bold text-sm text-[#2874f0] uppercase tracking-wide mb-3">Edit Address</h3>
                  <AddressForm
                    initial={addr}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      loadAddresses();
                    }}
                  />
                </div>
              ) : (
                <div
                  key={addr.id}
                  className="p-4 border border-gray-200 rounded-sm hover:border-gray-300 transition text-xs flex flex-col sm:flex-row justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-semibold rounded text-[10px] uppercase">
                        {addr.type}
                      </span>
                      {addr.isDefault && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                      <span className="text-gray-700 font-medium">{addr.phone}</span>
                    </div>
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      {addr.houseFlat}, {addr.street}
                      {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} -{" "}
                      <strong className="text-gray-900">{addr.pinCode}</strong>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setEditingId(addr.id);
                      }}
                      className="flex items-center gap-1 text-[#2874f0] font-bold hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleMakeDefault(addr.id)}
                        disabled={busyId === addr.id}
                        className="text-gray-600 font-semibold hover:text-gray-900 disabled:opacity-50"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={busyId === addr.id}
                      className="flex items-center gap-1 text-red-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountAddressesPage() {
  return (
    <RequireAuth>
      <AddressesContent />
    </RequireAuth>
  );
}
