import assert from "node:assert";
import crypto from "node:crypto";
import { handleCreatePaymentOrder, handleVerifyPayment } from "../src/lib/security/payments-server";
import { paymentsRepo } from "../src/lib/db/payments-repo";

async function runRazorpayVerificationTest() {
  console.log("Testing Razorpay Order Creation & Verification Flow...");

  // 1. Create order
  const orderReq = new Request("http://localhost:5173/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planName: "10 Gold Tokens Pack",
      planType: "pack",
      credits: 10,
      amount: 399,
    }),
  });

  const orderRes = await handleCreatePaymentOrder(orderReq, "127.0.0.1");
  assert.strictEqual(orderRes.status, 200, "Create order should return 200");
  const orderData = await orderRes.json();
  console.log("Order created:", orderData);

  assert.ok(orderData.orderId, "Should return Razorpay orderId");
  assert.strictEqual(orderData.amount, 39900, "Amount should be 39900 paise");
  assert.strictEqual(orderData.currency, "INR", "Currency should be INR");

  // 2. Verify payment with valid HMAC signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "N6eXMvEK15PJ5inBzzK7LI0n";
  const fakePaymentId = `pay_${Date.now()}`;
  const signaturePayload = `${orderData.orderId}|${fakePaymentId}`;
  const validSignature = crypto
    .createHmac("sha256", keySecret)
    .update(signaturePayload)
    .digest("hex");

  const verifyReq = new Request("http://localhost:5173/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
    }),
  });

  const verifyRes = await handleVerifyPayment(verifyReq, "127.0.0.1");
  assert.strictEqual(verifyRes.status, 200, "Verify should return 200 with valid signature");
  const verifyData = await verifyRes.json();
  console.log("Verification response:", verifyData);
  assert.strictEqual(verifyData.success, true);
  assert.strictEqual(verifyData.credits, 10);

  // 3. Replay attack rejection
  const replayReq = new Request("http://localhost:5173/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
    }),
  });
  const replayRes = await handleVerifyPayment(replayReq, "127.0.0.1");
  const replayData = await replayRes.json();
  console.log("Replay check:", replayData);
  assert.strictEqual(replayData.success, true);
  assert.strictEqual(replayData.message, "Payment already verified");

  // 4. Invalid signature rejection
  const badVerifyReq = new Request("http://localhost:5173/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: "pay_tampered",
      razorpay_signature: "invalid_sig_abc123",
    }),
  });

  const badRes = await handleVerifyPayment(badVerifyReq, "127.0.0.1");
  assert.strictEqual(badRes.status, 400, "Tampered signature should return 400");
  console.log("Invalid signature correctly blocked!");

  console.log("ALL RAZORPAY PAYMENT TESTS PASSED SUCCESSFULLY!");
}

runRazorpayVerificationTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
