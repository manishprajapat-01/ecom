"use client";

/**
 * Browser-side helpers for Razorpay Checkout.
 * UPI is shown first; on Android/iOS Razorpay opens installed UPI apps via UPI Intent,
 * on desktop it shows a UPI QR code – both handled natively by Razorpay Checkout.
 */

export interface PaymentSession {
  provider: "razorpay";
  mock: boolean;
  keyId: string | null;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  prefill: { name?: string; contact?: string; email?: string };
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailure {
  error: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

type PreferredMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  retry?: { enabled: boolean; max_count?: number };
  timeout?: number;
  config?: unknown;
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment gateway. Check your internet connection."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Checkout display configuration that puts the customer's chosen method first.
 */
function buildDisplayConfig(preferred: PreferredMethod) {
  const blocks = {
    upi: {
      name: "Pay via UPI",
      instruments: [{ method: "upi", flows: ["intent", "collect", "qr"] }],
    },
    card: { name: "Credit / Debit Cards", instruments: [{ method: "card" }] },
    netbanking: { name: "Net Banking", instruments: [{ method: "netbanking" }] },
    wallet: { name: "Wallets", instruments: [{ method: "wallet" }] },
  };
  const order: Record<PreferredMethod, string> = {
    UPI: "block.upi",
    CARD: "block.card",
    NETBANKING: "block.netbanking",
    WALLET: "block.wallet",
  };
  const sequence = [order[preferred], ...Object.values(order).filter((b) => b !== order[preferred])];

  return {
    display: {
      blocks,
      sequence,
      preferences: { show_default_blocks: true },
    },
  };
}

/**
 * Open Razorpay Checkout and resolve with the gateway's success payload.
 * Rejects with { dismissed: true } when the customer closes the modal, or with the failure payload.
 */
export function openRazorpayCheckout(params: {
  session: PaymentSession;
  storeName: string;
  description: string;
  preferredMethod: PreferredMethod;
  notes?: Record<string, string>;
}): Promise<RazorpaySuccess> {
  const { session, storeName, description, preferredMethod, notes } = params;

  return new Promise((resolve, reject) => {
    if (!window.Razorpay || !session.keyId) {
      reject(new Error("Payment gateway is not available."));
      return;
    }

    let settled = false;
    const rzp = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: storeName,
      description,
      order_id: session.razorpayOrderId,
      prefill: session.prefill,
      notes,
      theme: { color: "#2874f0" },
      retry: { enabled: true, max_count: 2 },
      timeout: 15 * 60,
      config: buildDisplayConfig(preferredMethod),
      handler: (response) => {
        settled = true;
        resolve(response);
      },
      modal: {
        confirm_close: true,
        escape: false,
        ondismiss: () => {
          if (!settled) {
            settled = true;
            reject({ dismissed: true });
          }
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      if (!settled) {
        settled = true;
        try {
          rzp.close();
        } catch {
          // ignore
        }
        reject(response);
      }
    });

    rzp.open();
  });
}
