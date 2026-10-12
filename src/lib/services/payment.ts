import crypto from "crypto";
import Razorpay from "razorpay";
import { IS_PRODUCTION } from "../config";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

const DEMO_KEY_PREFIX = "rzp_test_demo";
const MOCK_ORDER_PREFIX = "order_mock_";

/**
 * Real Razorpay credentials are present (test or live keys).
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    RAZORPAY_KEY_ID &&
      RAZORPAY_KEY_SECRET &&
      /^rzp_(test|live)_/.test(RAZORPAY_KEY_ID) &&
      !RAZORPAY_KEY_ID.startsWith(DEMO_KEY_PREFIX)
  );
}

/**
 * Mock payment mode: only possible outside production when no real keys are set.
 * In this mode the checkout simulates a successful payment so the flow can be developed locally.
 */
export function isMockPaymentMode(): boolean {
  return !IS_PRODUCTION && !isRazorpayConfigured();
}

export function getRazorpayKeyId(): string {
  return RAZORPAY_KEY_ID;
}

export function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
  isMock: boolean;
}

/**
 * Create a Razorpay Order for the given amount.
 * @param amountPaise Amount in INR paise (e.g. 149900 = ₹1,499.00)
 * @param receipt Internal order number
 * @param notes Key/values echoed back by Razorpay in webhooks (we store our orderId here)
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string> = {}
): Promise<GatewayOrder> {
  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    throw new Error("Payment amount must be at least ₹1.");
  }

  if (isMockPaymentMode()) {
    return {
      id: `${MOCK_ORDER_PREFIX}${crypto.randomBytes(7).toString("hex")}`,
      amount: amountPaise,
      currency: "INR",
      isMock: true,
    };
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    isMock: false,
  };
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Razorpay payment signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  // Simulated payments are accepted ONLY in mock mode (never in production).
  if (razorpayOrderId.startsWith(MOCK_ORDER_PREFIX)) {
    return isMockPaymentMode();
  }

  if (!RAZORPAY_KEY_SECRET) return false;

  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return safeEqualHex(generatedSignature, razorpaySignature);
}

/**
 * Verify Razorpay Webhook signature (HMAC-SHA256 of raw body with the webhook secret)
 */
export function verifyWebhookSignature(body: string, receivedSignature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET || !receivedSignature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return safeEqualHex(expectedSignature, receivedSignature);
}

/**
 * Fetch a payment from Razorpay and confirm it is captured for the expected order & amount.
 * Used as a second line of defence after signature verification.
 */
export async function fetchCapturedPayment(razorpayPaymentId: string): Promise<{
  orderId: string;
  amount: number;
  status: string;
  method: string;
} | null> {
  if (isMockPaymentMode()) return null;
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    return {
      orderId: String(payment.order_id || ""),
      amount: Number(payment.amount),
      status: String(payment.status),
      method: String(payment.method || ""),
    };
  } catch (err) {
    console.error("[razorpay] payment fetch failed:", err);
    return null;
  }
}

/**
 * Map Razorpay's payment method string onto our PaymentMethod enum.
 */
export function mapGatewayMethod(method: string | undefined, fallback: "UPI" | "CARD" | "NETBANKING" | "WALLET") {
  switch ((method || "").toLowerCase()) {
    case "upi":
      return "UPI" as const;
    case "card":
      return "CARD" as const;
    case "netbanking":
      return "NETBANKING" as const;
    case "wallet":
      return "WALLET" as const;
    default:
      return fallback;
  }
}
