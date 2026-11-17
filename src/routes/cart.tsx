import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
import { initiateRazorpayCheckout } from "@/lib/razorpay";
import {
  getCurrentCurrency,
  formatCurrency,
  CURRENCY_CHANGED_EVENT,
  type CurrencyCode,
} from "@/lib/currency";
import { ArrowLeft, Check, CreditCard, Gift, Lock, RefreshCw, ShieldCheck, Sparkles, Tag, X, Zap, BadgePercent, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { buildPageMeta } from "@/lib/seo";

interface CartSearch {
  plan?: string;
  planType?: "pack" | "subscription" | "festival";
  credits?: number;
  price?: number;
  period?: "monthly" | "yearly";
}

export const Route = createFileRoute("/cart")({
  validateSearch: (search: Record<string, unknown>): CartSearch => {
    const rawPlan = search["plan"];
    const rawPlanType = search["planType"];
    const rawCredits = search["credits"];
    const rawPrice = search["price"];
    const rawPeriod = search["period"];

    return {
      plan: typeof rawPlan === "string" ? rawPlan : "Pro",
      planType:
        rawPlanType === "subscription" ||
        rawPlanType === "festival" ||
        rawPlanType === "pack"
          ? rawPlanType
          : "subscription",
      credits: Number(rawCredits) || 200,
      price: Number(rawPrice) || 1999,
      period: rawPeriod === "yearly" ? "yearly" : "monthly",
    };
  },
  head: () => {
    const seo = buildPageMeta({
      title: "Cart & Checkout | bg.tools",
      description: "Review your plan, apply coupon codes, and checkout securely with Razorpay on bg.tools.",
      path: "/cart",
    });
    return {
      meta: [
        ...seo.meta,
        { name: "robots", content: "noindex, nofollow" },
      ],
      links: seo.links,
    };
  },
  component: CartPage,
});

export function CartPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    AuthUser.getCurrentUser()
  );
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>(() =>
    getCurrentCurrency()
  );

  // Selected item configuration
  const [planName, setPlanName] = useState<string>(search.plan || "Pro");
  const [planType, setPlanType] = useState<"pack" | "subscription" | "festival">(
    search.planType || "subscription"
  );
  const [credits, setCredits] = useState<number>(search.credits || 200);
  const [basePriceINR, setBasePriceINR] = useState<number>(search.price || 1999);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    search.period || "monthly"
  );

  // Promocode state
  const [promoInput, setPromoInput] = useState<string>("");
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    description?: string;
  } | null>(null);

  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Sync user and currency
  useEffect(() => {
    const update = () => {
      setCurrentUser(AuthUser.getCurrentUser());
    };
    const handleCurrency = (e: any) => {
      if (e.detail?.currency) {
        setCurrentCurrency(e.detail.currency);
      }
    };

    window.addEventListener(REALTIME_EVENT_NAME, update);
    window.addEventListener("storage", update);
    window.addEventListener(CURRENCY_CHANGED_EVENT, handleCurrency);

    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
      window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurrency);
    };
  }, []);

  // Update billing period adjustments for subscription plans
  const isSubscription = planType === "subscription";

  const handlePeriodChange = (newPeriod: "monthly" | "yearly") => {
    setBillingPeriod(newPeriod);
    const lower = planName.toLowerCase();
    if (lower.includes("lite")) {
      setBasePriceINR(newPeriod === "yearly" ? 4990 : 499);
    } else if (lower.includes("medium")) {
      setBasePriceINR(newPeriod === "yearly" ? 9990 : 999);
    } else if (lower.includes("pro")) {
      setBasePriceINR(newPeriod === "yearly" ? 19990 : 1999);
    }
  };

  const formatPrice = (amountINR: number) =>
    formatCurrency(amountINR, currentCurrency);

  // Calculate discount
  const calculateDiscount = (rawPrice: number) => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === "percentage") {
      return Math.round((rawPrice * appliedPromo.discountValue) / 100);
    }
    return Math.min(rawPrice, appliedPromo.discountValue);
  };

  const discountAmount = calculateDiscount(basePriceINR);
  const finalPriceINR = Math.max(1, basePriceINR - discountAmount);

  // Apply promocode
  const handleApplyPromo = async (codeToTry?: string) => {
    const cleanCode = (codeToTry || promoInput).trim().toUpperCase();
    if (!cleanCode) {
      setPromoError("Please enter a valid coupon code.");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promocodes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, amount: basePriceINR }),
      });
      const data = await res.json();
      if (data.valid && data.promo) {
        setAppliedPromo({
          code: data.promo.code,
          discountType: data.promo.discountType,
          discountValue: data.promo.discountValue,
          description: data.promo.description,
        });
        setPromoInput(data.promo.code);
        setPromoError(null);
        toast.success(`Coupon "${data.promo.code}" applied successfully!`);
      } else {
        setPromoError(data.error || "Invalid or expired promo code.");
        setAppliedPromo(null);
      }
    } catch {
      setPromoError("Unable to validate coupon. Please check your connection.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
    toast.info("Coupon code removed.");
  };

  // Launch checkout
  const handleCheckout = () => {
    if (!currentUser) {
      toast.info("Please login or create an account to complete your purchase.");
      navigate({
        to: "/login",
        search: {
          redirect: window.location.pathname + window.location.search,
        },
      });
      return;
    }

    setIsProcessingPayment(true);
    initiateRazorpayCheckout({
      planName: `${planName}${isSubscription ? ` (${billingPeriod})` : ""}`,
      planType,
      credits,
      amountINR: finalPriceINR,
      currency: currentCurrency,
      promoCode: appliedPromo?.code,
      onSuccess: () => {
        setIsProcessingPayment(false);
        toast.success("Payment completed successfully! Redirecting to your purchase slip...");
        navigate({
          to: "/account",
        });
      },
      onError: (err) => {
        setIsProcessingPayment(false);
      },
      onCancel: () => {
        setIsProcessingPayment(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-foreground flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-zinc-800">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Pricing</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="font-extrabold text-orange-600 dark:text-orange-400">1. Cart</span>
            <span>/</span>
            <span>2. Secure Payment</span>
            <span>/</span>
            <span>3. Instant Delivery</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mt-8 mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Checkout & Cart Summary
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Review your plan, apply coupon codes, and proceed to secure checkout.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Item Card, Details, and Billing Guarantee (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Selected Plan Details Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
                    {planType === "pack" ? (
                      <TokenCoin type="gold" size="md" />
                    ) : planType === "festival" ? (
                      <Gift className="h-6 w-6 text-amber-500" />
                    ) : (
                      <TokenCoin type="silver" size="md" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                        {planName}
                      </h2>
                      <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                        {planType === "pack"
                          ? "One-Time Pack"
                          : planType === "festival"
                          ? "Festive Offer"
                          : "Subscription"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {credits.toLocaleString()} {planType === "pack" ? "Gold Tokens" : "Silver Tokens"} included
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-2xl font-black text-slate-950 dark:text-white">
                    {formatPrice(basePriceINR)}
                  </span>
                  {isSubscription && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      /{billingPeriod === "yearly" ? "year" : "month"}
                    </p>
                  )}
                </div>
              </div>

              {/* Billing Cycle Switcher for Subscriptions */}
              {isSubscription && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Billing Frequency
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Choose annual billing to receive 2 months free
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handlePeriodChange("monthly")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          billingPeriod === "monthly"
                            ? "bg-white dark:bg-zinc-900 text-slate-950 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange("yearly")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          billingPeriod === "yearly"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <span>Yearly</span>
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                          Save 17%
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Benefits Checklist */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Included Benefits:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Instant token credit upon payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Priority GPU compute pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>4K Ultra resolution image export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>GST tax invoice & payment slip</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Customer Billing Account
                </span>
                {currentUser && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Logged In
                  </span>
                )}
              </div>

              {currentUser ? (
                <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentUser.name}
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400 font-mono">
                      {currentUser.email}
                    </p>
                  </div>
                  <span className="rounded-xl border border-slate-200 dark:border-zinc-700 px-3 py-1 font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                    ID: {currentUser.id.slice(0, 10)}
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Not logged in
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tokens will be linked to your account upon login.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    search={{ redirect: "/cart" }}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-xs shadow-xs"
                  >
                    Login / Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Trust & Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">256-Bit SSL</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Encrypted payment via Razorpay</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
                <Zap className="h-5 w-5 text-orange-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Instant Credit</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tokens credited immediately</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
                <Lock className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Zero Storage</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Files auto-deleted after process</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Promocode Box & Order Summary Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-lg space-y-6 sticky top-24">
              <h3 className="font-display text-lg font-black text-slate-950 dark:text-white">
                Order Summary
              </h3>

              {/* Promocode / Coupon Box (Inside Cart) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Have a Promo Code?</span>
                  {appliedPromo && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Coupon Applied
                    </span>
                  )}
                </label>

                <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <Tag className="h-4 w-4 ml-2.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={promoInput}
                    disabled={Boolean(appliedPromo)}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!appliedPromo) handleApplyPromo();
                      }
                    }}
                    placeholder="Enter code (e.g. FESTIVE50)"
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden disabled:opacity-75"
                  />

                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="mr-1 inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isApplyingPromo || !promoInput.trim()}
                      onClick={() => handleApplyPromo()}
                      className="mr-1 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {isApplyingPromo ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Apply</span>
                    </button>
                  )}
                </div>

                {/* Error message */}
                {promoError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pl-1">
                    {promoError}
                  </p>
                )}

                {/* Applied success banner */}
                {appliedPromo && (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountType === "percentage" ? `${appliedPromo.discountValue}% OFF` : `₹${appliedPromo.discountValue} OFF`})
                      </span>
                    </span>
                    <span className="font-mono font-bold">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                  <span>Base Plan Price</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {formatPrice(basePriceINR)}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="h-3.5 w-3.5" />
                      <span>Coupon Discount ({appliedPromo.code})</span>
                    </span>
                    <span className="font-mono">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                  <span>Goods & Services Tax (GST 18%)</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">
                    Included in Total
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                  <span>Token Allocation</span>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    +{credits.toLocaleString()} Tokens
                  </span>
                </div>

                {/* Grand Total */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-display text-base font-black text-slate-950 dark:text-white block">
                      Total Due
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      One-time payment • No hidden fees
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                      {formatPrice(finalPriceINR)}
                    </span>
                    {appliedPromo && (
                      <span className="block text-[11px] font-mono text-slate-400 line-through">
                        {formatPrice(basePriceINR)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessingPayment}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Proceed to Pay via Razorpay ({formatPrice(finalPriceINR)})</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                By completing this purchase, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-slate-600">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-slate-600">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
