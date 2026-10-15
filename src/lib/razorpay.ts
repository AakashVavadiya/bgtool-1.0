import { AuthUser } from "./auth-user";
import { AdminStore } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "./telemetry";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function getRazorpayKeyId(): string {
  if (typeof window !== "undefined") {
    const metaKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
    if (metaKey) return metaKey;
  }
  return "rzp_live_Tmz4jrhCLp8whx";
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    // 1. Double check window.Razorpay
    if (window.Razorpay) {
      return resolve(true);
    }

    // 2. Check if script tag is already in DOM (e.g. from RootShell)
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.Razorpay) return resolve(true);
      
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(poll);
          resolve(true);
        } else if (attempts > 25) {
          clearInterval(poll);
          resolve(!!window.Razorpay);
        }
      }, 100);

      existing.addEventListener("load", () => {
        clearInterval(poll);
        resolve(true);
      });
      existing.addEventListener("error", (e) => {
        console.error("Existing Razorpay script failed to load:", e);
        clearInterval(poll);
        resolve(false);
      });
      return;
    }

    // 3. Dynamically inject if not in DOM
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = (err) => {
      console.error("Failed to inject Razorpay Checkout SDK:", err);
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}

import { getCurrentCurrency, type CurrencyCode } from "./currency";

export interface CheckoutOptions {
  planName: string;
  planType?: "pack" | "subscription" | "festival" | undefined;
  credits: number;
  amountINR: number;
  currency?: CurrencyCode | undefined;
  onSuccess?: ((paymentId: string) => void) | undefined;
  onError?: ((error: string) => void) | undefined;
  onCancel?: (() => void) | undefined;
}

/**
 * Sanitizes input text for Razorpay's options and metadata notes.
 * Razorpay rejects emojis (4-byte UTF-8 sequences), surrogate pairs,
 * control characters, and non-ASCII characters with:
 * "The notes field should contain valid UTF-8 encoded characters."
 */
export function sanitizeRazorpayNoteText(val: unknown, maxLen = 40): string {
  if (val === null || val === undefined) return "";
  let str = String(val);

  try {
    str = str.normalize("NFC");
  } catch {}

  str = str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...");

  str = str.replace(/[\u{10000}-\u{10FFFF}]/gu, "");
  str = str.replace(/[\uD800-\uDFFF]/g, "");
  str = str.replace(/[^\x20-\x7E]/g, " ");
  str = str.replace(/\s+/g, " ").trim();

  return str.slice(0, maxLen);
}

/**
 * Launch Razorpay Live checkout modal for purchasing BG Tokens
 */
export async function initiateRazorpayCheckout({
  planName,
  planType = "pack",
  credits,
  amountINR,
  currency,
  onSuccess,
  onError,
  onCancel,
}: CheckoutOptions): Promise<void> {
  const currentUser = AuthUser.getCurrentUser();

  if (!currentUser) {
    toast.error("Please sign in or create an account to purchase tokens so they are permanently saved to your profile.", {
      action: {
        label: "Sign In",
        onClick: () => {
          window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
        },
      },
      duration: 6000,
    });
    onError?.("Authentication required");
    return;
  }

  const activeCurrency = currency || getCurrentCurrency();
  const toastId = toast.loading("Initializing secure Razorpay payment gateway...");

  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      toast.dismiss(toastId);
      toast.error("Could not load Razorpay payment gateway. If you are using an ad-blocker, please allow checkout.razorpay.com and retry.", {
        duration: 8000,
        action: {
          label: "Retry",
          onClick: () => {
            initiateRazorpayCheckout({ planName, planType, credits, amountINR, currency: activeCurrency, onSuccess, onError, onCancel });
          },
        },
      });
      onError?.("Razorpay script load error");
      return;
    }

    const cleanPlanName = sanitizeRazorpayNoteText(planName, 40) || "Token Plan";

    // Step 1: Create Order on backend
    const createRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        planName: cleanPlanName,
        planType,
        credits,
        amount: amountINR,
        currency: activeCurrency,
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      toast.dismiss(toastId);
      const msg = errData?.message || errData?.error || "Failed to initialize payment order.";
      toast.error(msg);
      onError?.(msg);
      return;
    }

    const orderData = await createRes.json();
    toast.dismiss(toastId);

    const razorpayKey = orderData.keyId || getRazorpayKeyId();

    const safeDescription = sanitizeRazorpayNoteText(
      `${credits.toLocaleString("en-IN")} Gold Tokens - ${cleanPlanName}`,
      120
    );

    const safeNotes: Record<string, string> = {
      userId: sanitizeRazorpayNoteText(currentUser.id, 40) || "guest",
      credits: String(credits),
      planName: cleanPlanName,
    };

    // Step 2: Open Razorpay Checkout modal
    const options = {
      key: razorpayKey,
      amount: orderData.amount, // in paise
      currency: orderData.currency || "INR",
      name: "bg.tools",
      description: safeDescription,
      image: "https://bg.tools/favicon.ico",
      order_id: orderData.orderId,
      prefill: {
        name: sanitizeRazorpayNoteText(currentUser.name || "", 50),
        email: sanitizeRazorpayNoteText(currentUser.email || "", 60),
      },
      notes: safeNotes,
      theme: {
        color: "#f59e0b", // Gold / Amber theme for Gold Tokens
      },
      modal: {
        ondismiss: () => {
          toast.info("Payment was cancelled.");
          onCancel?.();
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const verifyToastId = toast.loading("Verifying payment with bank & crediting tokens...");

        try {
          // Step 3: Verify signature on backend
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (!verifyRes.ok) {
            const errData = await verifyRes.json().catch(() => ({}));
            toast.dismiss(verifyToastId);
            const msg = errData?.message || errData?.error || "Payment verification failed.";
            toast.error(msg);
            onError?.(msg);
            return;
          }

          const verifyData = await verifyRes.json();
          toast.dismiss(verifyToastId);

          // Refresh user session so header token counter updates instantly
          await AuthUser.refreshSession();

          // Sync transaction into admin store cache for visibility
          const newTxn = {
            id: response.razorpay_payment_id,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            type: planType === "subscription" ? ("subscription" as const) : ("pack" as const),
            planName,
            creditsPurchased: credits,
            amountINR,
            currency: "INR",
            status: "completed" as const,
            paymentMethod: "UPI" as const,
            date: new Date().toISOString(),
          };
          const existingPurchases = AdminStore.getPurchases();
          AdminStore.savePurchases([newTxn, ...existingPurchases]);

          window.dispatchEvent(
            new CustomEvent(REALTIME_EVENT_NAME, {
              detail: { type: "purchase_completed", txnId: response.razorpay_payment_id },
            })
          );

          toast.success(
            `🎉 Payment Successful! Added ${credits.toLocaleString("en-IN")} Gold Tokens to your account! (Ref: ${response.razorpay_payment_id})`,
            { duration: 7000 }
          );

          onSuccess?.(response.razorpay_payment_id);
        } catch (verifyErr: any) {
          toast.dismiss(verifyToastId);
          console.error("Verification error:", verifyErr);
          toast.error("Network error while verifying payment. If amount was debited, your tokens will be credited automatically.");
          onError?.(verifyErr?.message || "Verification network error");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (failedRes: any) => {
      const errReason = failedRes?.error?.description || "Payment failed at bank";
      toast.error(`Payment failed: ${errReason}`);
      onError?.(errReason);
    });

    rzp.open();
  } catch (err: any) {
    toast.dismiss(toastId);
    console.error("Checkout initiation error:", err);
    toast.error(`Could not launch checkout: ${err?.message || "Unknown error"}`);
    onError?.(err?.message || "Checkout error");
  }
}
