"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  MapPin,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Plus,
  Loader2,
  Building,
  Banknote,
  Wallet,
  QrCode,
  Pencil,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AddressForm } from "@/components/address/AddressForm";
import { usePayment } from "@/lib/use-payment";
import { formatCurrency } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/config";
import type { AddressData } from "@/lib/services/address";
import type { PaymentSession } from "@/lib/razorpay-client";

type PaymentMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "COD";

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  enabled: boolean;
}> = [
  {
    value: "UPI",
    title: "UPI (Google Pay, PhonePe, Paytm, BHIM)",
    subtitle: "Pay with any UPI app or scan QR – no extra charge",
    icon: <Smartphone className="w-4 h-4 text-emerald-600" />,
    enabled: SITE_CONFIG.features.enableRazorpay,
  },
  {
    value: "CARD",
    title: "Credit / Debit / ATM Card",
    subtitle: "Visa, Mastercard, RuPay, Amex",
    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
    enabled: SITE_CONFIG.features.enableRazorpay,
  },
  {
    value: "NETBANKING",
    title: "Net Banking",
    subtitle: "All major Indian banks",
    icon: <Building className="w-4 h-4 text-purple-600" />,
    enabled: SITE_CONFIG.features.enableRazorpay,
  },
  {
    value: "WALLET",
    title: "Wallets",
    subtitle: "Paytm, PhonePe, Amazon Pay, Mobikwik & more",
    icon: <Wallet className="w-4 h-4 text-pink-600" />,
    enabled: SITE_CONFIG.features.enableRazorpay,
  },
  {
    value: "COD",
    title: "Cash on Delivery",
    subtitle: "Pay cash or UPI to the delivery partner",
    icon: <Banknote className="w-4 h-4 text-amber-600" />,
    enabled: SITE_CONFIG.features.enableCashOnDelivery,
  },
];

function StepHeader({ step, title, done, icon }: { step: number; title: string; done?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        <span className="w-5 h-5 bg-[#2874f0] text-white rounded-full flex items-center justify-center text-[10px]">
          {step}
        </span>
        {title}
      </span>
      {done ? <Check className="w-4 h-4 text-emerald-600" /> : icon}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { items, summary, couponCode, clearCart } = useCart();
  const { user } = useAuth();
  const { pay, isPaying } = usePayment();

  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [isPlacing, setIsPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

  const isProcessing = isPlacing || isPaying;
  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId), [addresses, selectedAddressId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/addresses", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: AddressData[] = data.addresses || [];
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
        } else {
          setIsAddingNewAddress(true);
        }
      })
      .catch(() => setCheckoutError("Could not load your saved addresses."))
      .finally(() => !cancelled && setIsLoadingAddresses(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddressSaved = (address: AddressData) => {
    setAddresses((prev) => {
      const without = prev.filter((a) => a.id !== address.id);
      const next = address.isDefault ? without.map((a) => ({ ...a, isDefault: false })) : without;
      return [address, ...next];
    });
    setSelectedAddressId(address.id);
    setIsAddingNewAddress(false);
    setEditingAddressId(null);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }
    if (!selectedAddressId) {
      setCheckoutError("Please select or add a delivery address.");
      return;
    }

    setIsPlacing(true);
    setCheckoutError(null);

    try {
      // 1. Create the order on the server (prices/stock re-validated there)
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          paymentMethod,
          couponCode,
          idempotencyKey,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order) {
        throw new Error(orderData.error || "Failed to place order");
      }
      const order = orderData.order;

      // 2. COD → order confirmed immediately
      if (paymentMethod === "COD" || !orderData.payment) {
        clearCart();
        router.push(`/account/orders/${order.id}?placed=1`);
        return;
      }

      // 3. Online → open the payment gateway, then verify on the server
      setIsPlacing(false);
      const outcome = await pay({
        orderId: order.id,
        orderNumber: order.orderNumber,
        session: orderData.payment as PaymentSession,
        preferredMethod: paymentMethod,
      });

      if (outcome.status === "success") {
        clearCart();
        router.push(`/account/orders/${order.id}?payment=success`);
        return;
      }

      // Order exists but is unpaid – send the customer to the order page where they can retry.
      clearCart();
      router.push(`/account/orders/${order.id}?payment=${outcome.status}`);
    } catch (err) {
      setCheckoutError((err as Error).message || "An error occurred while placing your order.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-sm border p-8 text-center">
        <h2 className="text-lg font-bold text-gray-800">Your cart is empty!</h2>
        <Link href="/products" className="inline-block mt-4 px-6 py-2 bg-[#2874f0] text-white text-xs font-bold rounded-sm">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const visiblePaymentOptions = PAYMENT_OPTIONS.filter((o) => o.enabled);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-black text-gray-900">Checkout</h1>

      {checkoutError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">{checkoutError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-3">
          {/* STEP 1: Login */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <StepHeader step={1} title="Login" done />
            <div className="pt-3 text-xs">
              <p className="font-bold text-gray-900">{user?.name || "Customer"}</p>
              <p className="text-gray-500">+91 {user?.phone}</p>
            </div>
          </div>

          {/* STEP 2: Delivery Address */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <StepHeader step={2} title="Delivery Address" done={Boolean(selectedAddress)} icon={<MapPin className="w-4 h-4 text-[#2874f0]" />} />

            <div className="pt-3 space-y-3">
              {isLoadingAddresses ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading saved addresses...
                </div>
              ) : (
                addresses.map((addr) =>
                  editingAddressId === addr.id ? (
                    <div key={addr.id} className="p-3 border border-blue-200 rounded bg-blue-50/30">
                      <h4 className="font-bold text-xs text-[#2874f0] uppercase mb-3">Edit Address</h4>
                      <AddressForm initial={addr} onCancel={() => setEditingAddressId(null)} onSaved={handleAddressSaved} />
                    </div>
                  ) : (
                    <label
                      key={addr.id}
                      className={`block p-3 rounded border cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "border-[#2874f0] bg-blue-50/40 ring-1 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-[#2874f0] focus:ring-blue-500"
                        />
                        <div className="text-xs flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900">{addr.fullName}</span>
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase">
                              {addr.type}
                            </span>
                            <span className="text-gray-500">{addr.phone}</span>
                          </div>
                          <p className="text-gray-600 mt-1">
                            {addr.houseFlat}, {addr.street}
                            {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} -{" "}
                            <strong className="text-gray-900">{addr.pinCode}</strong>
                          </p>
                          {selectedAddressId === addr.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsAddingNewAddress(false);
                                setEditingAddressId(addr.id);
                              }}
                              className="mt-2 inline-flex items-center gap-1 text-[#2874f0] font-bold hover:underline"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                )
              )}

              {!isLoadingAddresses &&
                (!isAddingNewAddress ? (
                  <button
                    onClick={() => {
                      setEditingAddressId(null);
                      setIsAddingNewAddress(true);
                    }}
                    className="w-full py-2.5 border border-dashed border-[#2874f0] text-[#2874f0] font-bold text-xs rounded hover:bg-blue-50 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add a New Address
                  </button>
                ) : (
                  <div className="p-3 border border-gray-200 rounded bg-gray-50">
                    <h4 className="font-bold text-xs text-gray-800 uppercase mb-3">Add New Delivery Address</h4>
                    <AddressForm
                      defaultName={user?.name || ""}
                      defaultPhone={user?.phone || ""}
                      onCancel={addresses.length > 0 ? () => setIsAddingNewAddress(false) : undefined}
                      onSaved={handleAddressSaved}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* STEP 3: Order Summary */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <StepHeader step={3} title={`Order Summary (${items.length} item${items.length > 1 ? "s" : ""})`} />
            <div className="pt-3 divide-y divide-gray-100">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId || "def"}`} className="py-2.5 flex items-center gap-3">
                  <div className="w-14 h-14 relative bg-gray-50 border rounded p-1 shrink-0">
                    {item.image && <Image src={item.image} alt={item.title} fill sizes="56px" className="object-contain" />}
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-gray-900">{formatCurrency(item.sellingPricePaise * item.quantity)}</p>
                    {item.regularPricePaise > item.sellingPricePaise && (
                      <p className="text-gray-400 line-through">{formatCurrency(item.regularPricePaise * item.quantity)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: Payment Options */}
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <StepHeader step={4} title="Payment Options" />
            <div className="pt-3 space-y-2.5">
              {visiblePaymentOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`block p-3 rounded border cursor-pointer transition ${
                    paymentMethod === opt.value ? "border-[#2874f0] bg-blue-50/40" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="text-[#2874f0]"
                    />
                    {opt.icon}
                    <div className="text-xs flex-1">
                      <span className="font-bold text-gray-900">{opt.title}</span>
                      <p className="text-gray-500">{opt.subtitle}</p>
                    </div>
                  </div>

                  {opt.value === "UPI" && paymentMethod === "UPI" && (
                    <div className="mt-3 ml-6 pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>
                          <strong className="text-gray-800">On mobile:</strong> opens your UPI app directly (UPI Intent)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>
                          <strong className="text-gray-800">On desktop:</strong> scan a QR code with any UPI app
                        </span>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-20">
          <div className="bg-white rounded-sm border border-gray-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-3 border-b border-gray-100">Price Details</h3>

            <div className="py-3 space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Price ({summary.totalQuantity} item{summary.totalQuantity > 1 ? "s" : ""})</span>
                <span>{formatCurrency(summary.regularSubtotalPaise)}</span>
              </div>
              {summary.productSavingsPaise > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-emerald-700 font-semibold">- {formatCurrency(summary.productSavingsPaise)}</span>
                </div>
              )}
              {summary.couponDiscountPaise > 0 && (
                <div className="flex justify-between">
                  <span>Coupon ({summary.appliedCoupon?.code})</span>
                  <span className="text-emerald-700 font-semibold">- {formatCurrency(summary.couponDiscountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className={summary.isFreeShipping ? "text-emerald-700 font-bold" : ""}>
                  {summary.isFreeShipping ? "FREE" : formatCurrency(summary.shippingFeePaise)}
                </span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-base text-gray-900 border-t border-dashed border-gray-200">
                <span>Total Payable</span>
                <span>{formatCurrency(summary.finalPayablePaise)}</span>
              </div>
              {summary.productSavingsPaise + summary.couponDiscountPaise > 0 && (
                <p className="text-emerald-700 font-bold pt-2 border-t border-dashed border-gray-200">
                  You will save {formatCurrency(summary.productSavingsPaise + summary.couponDiscountPaise)} on this order
                </p>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing || isLoadingAddresses || !selectedAddressId}
              className="w-full mt-2 py-3 bg-[#fb641b] hover:bg-[#e05310] disabled:bg-gray-400 text-white font-bold text-sm rounded-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPaying ? "WAITING FOR PAYMENT..." : "PLACING ORDER..."}
                </>
              ) : paymentMethod === "COD" ? (
                <>PLACE ORDER</>
              ) : (
                <>PAY {formatCurrency(summary.finalPayablePaise)}</>
              )}
            </button>
            {!selectedAddressId && !isLoadingAddresses && (
              <p className="text-[11px] text-amber-700 mt-2 text-center">Add a delivery address to continue</p>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Payments are processed securely by Razorpay. Your order is confirmed only after the payment is verified on our server.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}
