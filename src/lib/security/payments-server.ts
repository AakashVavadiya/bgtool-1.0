import crypto from "crypto";
import { paymentsRepo } from "../db/payments-repo";
import { toSafeUser } from "../db/users-repo";
import { getUserFromRequest } from "./auth-user-server";
import { isAuthorizedAdmin } from "./auth-admin";
import { applySecurityHeaders, createSafeErrorResponse } from "./headers";
import { MemoryRateLimiter } from "./rate-limiter";

// Rate limiter for payment creation & verification (15 per minute per IP)
const paymentsLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  name: "payments",
});

function getRazorpayCredentials() {
  const keyId = process.env["RAZORPAY_KEY_ID"] || "rzp_live_Tmz4jrhCLp8whx";
  const keySecret = process.env["RAZORPAY_KEY_SECRET"] || "N6eXMvEK15PJ5inBzzK7LI0n";
  return { keyId, keySecret };
}

/**
 * POST /api/payments/create-order
 * Initiates Razorpay Order via Live API and logs order in SQLite
 */
export async function handleCreatePaymentOrder(
  request: Request,
  clientIp: string
): Promise<Response> {
  const rate = paymentsLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many payment requests. Please wait ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = await request.json();
    const { planName, planType = "pack", credits, amount } = body;

    if (!planName || typeof planName !== "string") {
      return applySecurityHeaders(createSafeErrorResponse(400, "Missing or invalid plan name."));
    }

    const numCredits = Number(credits);
    const numAmount = Number(amount);

    if (isNaN(numCredits) || numCredits <= 0) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Invalid credits count."));
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Invalid payment amount."));
    }

    // Identify user if logged in
    const auth = getUserFromRequest(request);
    const user = auth?.user || null;

    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      return applySecurityHeaders(
        createSafeErrorResponse(500, "Razorpay payment gateway keys are not configured.")
      );
    }

    // Convert amount in INR to Paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(numAmount * 100);
    const receipt = `rcpt_${Date.now().toString(36)}_${Math.floor(100 + Math.random() * 900)}`;

    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: user?.id || "guest",
          userEmail: user?.email || "",
          planName: planName.slice(0, 40),
          credits: String(numCredits),
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errorJson = await rzpResponse.json().catch(() => ({}));
      console.error("[Razorpay API Error]", errorJson);
      const errDescription = errorJson?.error?.description || "Failed to create Razorpay payment order.";
      return applySecurityHeaders(createSafeErrorResponse(502, errDescription));
    }

    const rzpOrder = await rzpResponse.json();

    // Persist order in local SQLite database
    paymentsRepo.createOrder({
      orderId: rzpOrder.id,
      userId: user?.id || null,
      userName: user?.name || null,
      userEmail: user?.email || null,
      planName,
      planType,
      credits: numCredits,
      amountINR: numAmount,
      currency: rzpOrder.currency || "INR",
      receipt: rzpOrder.receipt || receipt,
    });

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          orderId: rzpOrder.id,
          amount: rzpOrder.amount, // in paise
          currency: rzpOrder.currency,
          keyId: keyId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  } catch (err: any) {
    console.error("[Payments Create Order Error]", err);
    return applySecurityHeaders(
      createSafeErrorResponse(500, "Server error occurred while initializing payment order.")
    );
  }
}

/**
 * POST /api/payments/verify
 * Cryptographically verifies Razorpay signature, updates payment status, and credits user account
 */
export async function handleVerifyPayment(
  request: Request,
  clientIp: string
): Promise<Response> {
  const rate = paymentsLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many verification requests. Please wait ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = await request.json();
    const orderId = body.orderId || body.razorpay_order_id;
    const paymentId = body.paymentId || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Missing required verification parameters (orderId, paymentId, signature).")
      );
    }

    const { keySecret } = getRazorpayCredentials();

    if (!keySecret) {
      return applySecurityHeaders(
        createSafeErrorResponse(500, "Razorpay payment gateway secret is not configured.")
      );
    }

    // HMAC SHA256 Signature computation: order_id + "|" + payment_id
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(generatedSignature, "utf8");
    const actualBuffer = Buffer.from(String(signature), "utf8");

    const isValid =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!isValid) {
      console.warn(`[Razorpay Signature Mismatch] Order: ${orderId}, Payment: ${paymentId}`);
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Invalid payment signature. Authentication failed.")
      );
    }

    // Complete transaction in SQLite
    const result = paymentsRepo.completePayment({
      orderId,
      paymentId,
      signature,
      paymentMethod: "Razorpay",
    });

    if (!result.success) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, result.error || "Failed to process payment completion.")
      );
    }

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: result.alreadyCompleted
            ? "Payment already verified"
            : "Payment verified successfully. Tokens credited to your account.",
          paymentId,
          credits: result.payment?.credits,
          user: result.user ? toSafeUser(result.user) : null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  } catch (err: any) {
    console.error("[Payments Verify Error]", err);
    return applySecurityHeaders(
      createSafeErrorResponse(500, "Server error occurred while verifying payment.")
    );
  }
}

/**
 * GET /api/payments/orders
 * Returns recent transactions for Administrator oversight
 */
export async function handleListPayments(request: Request): Promise<Response> {
  if (!isAuthorizedAdmin(request)) {
    return applySecurityHeaders(
      createSafeErrorResponse(401, "Administrator authentication required to inspect payment logs.")
    );
  }

  try {
    const list = paymentsRepo.getAll(200);
    return applySecurityHeaders(
      new Response(JSON.stringify(list), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (err: any) {
    console.error("[Payments List Error]", err);
    return applySecurityHeaders(
      createSafeErrorResponse(500, "Failed to retrieve payment records.")
    );
  }
}

/**
 * DELETE /api/payments/orders?id=...
 * Deletes payment order from SQLite (admin only)
 */
export async function handleDeletePaymentOrder(request: Request): Promise<Response> {
  if (!isAuthorizedAdmin(request)) {
    return applySecurityHeaders(
      createSafeErrorResponse(401, "Administrator authentication required to delete orders.")
    );
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Missing order id."));
    }

    paymentsRepo.deleteOrder(id);
    return applySecurityHeaders(
      new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (err: any) {
    return applySecurityHeaders(createSafeErrorResponse(500, "Failed to delete order."));
  }
}
