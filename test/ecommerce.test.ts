import { test, describe } from "node:test";
import assert from "node:assert";

// Pricing and monetary calculations
import { calculateDiscount, formatCurrency } from "../src/lib/utils";
import {
  calculateOrderAmounts,
  validateCoupon,
} from "../src/lib/services/pricing";

// Phone and Auth
import {
  validateIndianPhoneNumber,
  signSessionToken,
  verifySessionToken,
} from "../src/lib/services/auth";
import {
  generateOtp,
  storeOtp,
  verifyStoredOtp,
} from "../src/lib/services/otp";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED } from "../src/lib/config";

// Orders & Payments
import {
  generateOrderNumber,
  createOrder,
} from "../src/lib/services/order";
import {
  isMockPaymentMode,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../src/lib/services/payment";
import crypto from "node:crypto";

describe("Monetary & Price Calculations", () => {
  test("calculates discount percentage accurately", () => {
    // Regular ₹1000, Selling ₹700 -> 30% discount
    const discount = calculateDiscount(100000, 70000);
    assert.strictEqual(discount, 30);

    // No discount if prices match
    assert.strictEqual(calculateDiscount(50000, 50000), 0);
  });

  test("formats paise into Indian Rupee symbol string without float errors", () => {
    const formatted = formatCurrency(6599900);
    assert.ok(formatted.includes("65,999"));
  });

  test("calculates order subtotal and applies free shipping above ₹500", () => {
    const itemsAboveThreshold = [
      {
        regularPricePaise: 100000, // ₹1000
        sellingPricePaise: 80000,  // ₹800
        quantity: 1,
      },
    ];

    const result = calculateOrderAmounts(itemsAboveThreshold);
    assert.strictEqual(result.itemsSubtotalPaise, 80000);
    assert.strictEqual(result.shippingFeePaise, 0);
    assert.strictEqual(result.isFreeShipping, true);
    assert.strictEqual(result.finalPayablePaise, 80000);
  });

  test("applies delivery charge of ₹40 when order is below ₹500 threshold", () => {
    const itemsBelowThreshold = [
      {
        regularPricePaise: 30000, // ₹300
        sellingPricePaise: 25000, // ₹250
        quantity: 1,
      },
    ];

    const result = calculateOrderAmounts(itemsBelowThreshold);
    assert.strictEqual(result.itemsSubtotalPaise, 25000);
    assert.strictEqual(result.shippingFeePaise, 4000); // ₹40
    assert.strictEqual(result.isFreeShipping, false);
    assert.strictEqual(result.finalPayablePaise, 29000); // 250 + 40 = 290
  });

  test("validates coupon codes and enforces min order value", () => {
    // WELCOME100 requires min ₹499 (49900 paise)
    const invalidBelowMin = validateCoupon("WELCOME100", 30000);
    assert.strictEqual(invalidBelowMin.isValid, false);
    assert.ok(invalidBelowMin.errorMessage?.includes("minimum order value"));

    const validAboveMin = validateCoupon("WELCOME100", 60000);
    assert.strictEqual(validAboveMin.isValid, true);
    assert.strictEqual(validAboveMin.discountPaise, 10000); // Flat ₹100
  });

  test("caps percentage coupons at maximum discount limit", () => {
    // SAVE10: 10% discount capped at ₹500 (50000 paise)
    // On order of ₹10,000 (1000000 paise), 10% is ₹1,000, so it must cap at ₹500
    const couponResult = validateCoupon("SAVE10", 1000000);
    assert.strictEqual(couponResult.isValid, true);
    assert.strictEqual(couponResult.discountPaise, 50000);
  });
});

describe("Authentication & Mobile OTP", () => {
  test("validates authentic 10-digit Indian phone numbers", () => {
    const valid = validateIndianPhoneNumber("9876543210");
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.cleaned, "9876543210");

    const validWithCountryCode = validateIndianPhoneNumber("+91 98123 45678");
    assert.strictEqual(validWithCountryCode.isValid, true);
    assert.strictEqual(validWithCountryCode.cleaned, "9812345678");

    const invalidShort = validateIndianPhoneNumber("12345");
    assert.strictEqual(invalidShort.isValid, false);

    const invalidPrefix = validateIndianPhoneNumber("1234567890"); // doesn't start with 6-9
    assert.strictEqual(invalidPrefix.isValid, false);
  });

  test("generates and verifies 6-digit OTP (dev fallback)", () => {
    const phone = "9876512345";
    const otp = generateOtp();
    assert.strictEqual(otp.length, 6);
    assert.match(otp, /^\d{6}$/);

    storeOtp(phone, otp);

    // Incorrect code fails without consuming the OTP
    const wrong = verifyStoredOtp(phone, "000000");
    assert.strictEqual(wrong.valid, false);

    // The universal "123456" bypass must NOT work for arbitrary numbers
    const bypass = verifyStoredOtp(phone, "123456");
    assert.strictEqual(bypass.valid, otp === "123456");

    // The real code succeeds exactly once
    const ok = verifyStoredOtp(phone, otp);
    assert.strictEqual(ok.valid, true);
    const replay = verifyStoredOtp(phone, otp);
    assert.strictEqual(replay.valid, false);
  });

  test("demo OTP only works for demo accounts when demo login is enabled", () => {
    const result = verifyStoredOtp(DEMO_ACCOUNTS.customer.phone, DEMO_ACCOUNTS.otp);
    assert.strictEqual(result.valid, DEMO_LOGIN_ENABLED);
  });

  test("signs and authoritatively verifies JWT session tokens", () => {
    const user = {
      id: "usr-test-1",
      phone: "9876543210",
      name: "Admin Officer",
      email: "admin@bharatbazaar.in",
      role: "ADMIN" as const,
    };

    const token = signSessionToken(user);
    assert.ok(typeof token === "string" && token.length > 20);

    const decoded = verifySessionToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded.id, user.id);
    assert.strictEqual(decoded.role, "ADMIN");
  });
});

describe("Order & Inventory Safeguards", () => {
  test("generates human-friendly order format ODR-YYYYMMDD-XXXX", () => {
    const orderNo = generateOrderNumber();
    assert.ok(orderNo.startsWith("ODR-"));
    const parts = orderNo.split("-");
    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[1].length, 8); // YYYYMMDD
  });

  test("prevents order placement with empty cart", async () => {
    await assert.rejects(
      async () => {
        await createOrder({
          userId: "usr-test",
          addressId: "addr-test",
          items: [],
          paymentMethod: "UPI",
        });
      },
      {
        message: "Cannot place an order with an empty cart",
      }
    );
  });
});

describe("Razorpay & Payment Gateway Verification", () => {
  test("mock gateway signatures are accepted only in mock mode", () => {
    const valid = verifyPaymentSignature({
      razorpayOrderId: "order_mock_123456",
      razorpayPaymentId: "pay_mock_78910",
      razorpaySignature: "mock_sig_anything",
    });
    assert.strictEqual(valid, isMockPaymentMode());
  });

  test("rejects a forged signature for a real Razorpay order id", () => {
    const valid = verifyPaymentSignature({
      razorpayOrderId: "order_Nq1ABCDEFGHIJK",
      razorpayPaymentId: "pay_Nq1LMNOPQRSTUV",
      razorpaySignature: "deadbeef",
    });
    assert.strictEqual(valid, false);
  });

  test("webhook signature verification uses HMAC-SHA256 of the raw body", () => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = JSON.stringify({ event: "payment.captured" });
    if (!secret) {
      // Unconfigured: every webhook must be rejected
      assert.strictEqual(verifyWebhookSignature(body, "anything"), false);
      return;
    }
    const good = crypto.createHmac("sha256", secret).update(body).digest("hex");
    assert.strictEqual(verifyWebhookSignature(body, good), true);
    assert.strictEqual(verifyWebhookSignature(body, "bad"), false);
  });
});
