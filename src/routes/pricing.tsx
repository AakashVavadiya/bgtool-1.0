import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Faq } from "@/components/Faq";
import { AdminStore, type PurchasePlanConfig } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { Wand2, Gift, Zap, ShieldCheck, Lock, Check, X, Sparkles, Minus, Tag, RefreshCw } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";
import { ProductHuntBadge } from "@/components/ProductHuntBadge";
import { initiateRazorpayCheckout } from "@/lib/razorpay";
import {
  getCurrentCurrency,
  formatCurrency,
  CURRENCY_CHANGED_EVENT,
  type CurrencyCode,
} from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildPageMeta, buildBreadcrumbsSchema } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () => {
    const pricingSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "bg.tools AI Image Toolkit",
      description: "AI Background Removal, Image Upscaling, and Photo Editing Tokens",
      brand: {
        "@type": "Brand",
        name: "bg.tools",
      },
      offers: [
        {
          "@type": "Offer",
          name: "Free Daily Allowance",
          price: "0",
          priceCurrency: "INR",
          description: "10 free daily Bronze Tokens with background removal and conversion tools.",
        },
        {
          "@type": "Offer",
          name: "Pay-as-you-go Gold Tokens",
          price: "199",
          priceCurrency: "INR",
          description: "One-time Gold Token packs that never expire.",
        },
        {
          "@type": "Offer",
          name: "Lite Monthly Subscription",
          price: "499",
          priceCurrency: "INR",
          description: "40 Silver Tokens per month with AI background and photo editor.",
        },
        {
          "@type": "Offer",
          name: "Pro Monthly Subscription",
          price: "1999",
          priceCurrency: "INR",
          description: "200 Silver Tokens per month with bulk editing and priority processing.",
        },
      ],
    };

    return buildPageMeta({
      title: "Pricing Plans & Token Packs — Free Daily Credits & Gold Packs | bg.tools",
      description:
        "Transparent pricing for bg.tools. Free 10 daily Bronze Tokens, Pay-as-you-go Gold Token packs from ₹199, and flexible Lite & Pro Silver token plans with commercial license.",
      path: "/pricing",
      keywords: [
        "bg.tools pricing",
        "background remover pricing",
        "ai photo editor cost",
        "gold tokens",
        "free daily ai credits",
      ],
      jsonLd: [
        buildBreadcrumbsSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]),
        pricingSchema,
      ],
    });
  },
  component: Pricing,
});

// CENTRALIZED PLAN CONFIGURATION

export interface PaygPack {
  credits: number;
  price: number;
  label: string;
}

export const PAYG_PACKS: PaygPack[] = [
  { credits: 5, price: 199, label: "5 Gold Tokens" },
  { credits: 10, price: 399, label: "10 Gold Tokens" },
  { credits: 75, price: 2499, label: "75 Gold Tokens" },
  { credits: 100, price: 999, label: "100 Gold Tokens" },
  { credits: 200, price: 5599, label: "200 Gold Tokens" },
  { credits: 500, price: 9999, label: "500 Gold Tokens" },
  { credits: 1200, price: 19999, label: "1,200 Gold Tokens" },
  { credits: 4000, price: 49999, label: "4,000 Gold Tokens" },
  { credits: 8000, price: 99999, label: "8,000 Gold Tokens" },
];

export const PRICING_CONFIG = {
  free: {
    name: "Free",
    priceText: "₹0",
    periodText: "/ day",
    tokenType: "bronze" as const,
    tokenQuota: "10 Bronze Tokens (Login Required)",
    costPerToken: null,
    features: [
      "10 Bronze Tokens, refreshed daily",
      "Need to login to claim 10 free daily credits",
      "Bronze Tokens expire every day",
      "Remove background",
      "All conversion tools",
      "High-speed AI processing",
      "Standard quality exports",
    ],
    buttonText: "Start free (Login)",
    buttonHref: "/login",
  },
  lite: {
    name: "Lite",
    monthlyPrice: 499,
    yearlyPrice: 4990, // 2 months free (₹4,990 vs ₹5,988)
    tokenType: "silver" as const,
    tokenQuota: "40 Silver Tokens per month",
    costPerTokenMonthly: 12.5,
    costPerTokenYearly: 10.4,
    badge: "Starter",
    features: [
      "40 Silver Tokens per month",
      "Silver Tokens expire in month",
      "AI photo editor",
      "Remove background",
      "AI background",
      "Erase & restore",
      "Bulk editing",
      "Max quality exports",
    ],
    buttonText: "Subscribe",
  },
  medium: {
    name: "Medium",
    monthlyPrice: 999,
    yearlyPrice: 9990, // 2 months free
    tokenType: "silver" as const,
    tokenQuota: "100 Silver Tokens per month",
    costPerTokenMonthly: 10.0,
    costPerTokenYearly: 8.3,
    badge: "Most Popular",
    features: [
      "100 Silver Tokens per month",
      "Silver Tokens expire in month",
      "AI photo editor & background removal",
      "AI generative background models",
      "Erase & restore brush tools",
      "Bulk editing up to 20 images",
      "Priority GPU processing pipeline",
      "Max quality 4K exports",
    ],
    buttonText: "Subscribe",
  },
  pro: {
    name: "Pro",
    monthlyPrice: 1999,
    yearlyPrice: 19990, // 2 months free (₹19,990 vs ₹23,988)
    tokenType: "silver" as const,
    tokenQuota: "200 Silver Tokens per month",
    costPerTokenMonthly: 10.0,
    costPerTokenYearly: 8.3,
    badge: "Studio Pro",
    features: [
      "200 Silver Tokens per month",
      "Silver Tokens expire in month",
      "Priority GPU processing pipeline",
      "Bulk editing & queue priority",
      "All AI models and 4K ultra downloads",
      "24/7 dedicated support",
    ],
    buttonText: "Subscribe",
  },
  payg: {
    name: "Pay-as-you-go",
    basePriceText: "from ₹199",
    periodText: "(one-time)",
    tokenType: "gold" as const,
    dropdownLabel: "Gold Tokens Pack",
    copy: "Gold Tokens never expire. Full access to all Pro features with zero limits. Top up anytime on top of your daily & monthly allowances.",
    packs: PAYG_PACKS,
    buttonText: "Buy now",
    features: [
      "Gold Tokens never expire",
      "All Pro & Lite features included",
      "Bulk editing & queue priority",
      "Max quality exports",
      "Zero recurring commitments",
    ],
  },
};

export interface ComparisonRow {
  feature: string;
  free: string | boolean;
  lite: string | boolean;
  medium: string | boolean;
  pro: string | boolean;
  payg: string | boolean;
}

export const COMPARISON_TABLE: ComparisonRow[] = [
  { feature: "Remove background", free: true, lite: true, medium: true, pro: true, payg: true },
  { feature: "All conversion tools", free: true, lite: true, medium: true, pro: true, payg: true },
  { feature: "High-speed AI processing", free: true, lite: true, medium: true, pro: true, payg: true },
  { feature: "Export quality", free: "Standard", lite: "Max", medium: "Max (4K)", pro: "Max (4K)", payg: "Max" },
  { feature: "AI photo editor", free: false, lite: true, medium: true, pro: true, payg: true },
  { feature: "AI background", free: false, lite: true, medium: true, pro: true, payg: true },
  { feature: "Erase & restore", free: false, lite: true, medium: true, pro: true, payg: true },
  { feature: "Bulk editing queue", free: false, lite: false, medium: true, pro: true, payg: true },
  { feature: "Token type", free: "Bronze", lite: "Silver", medium: "Silver", pro: "Silver", payg: "Gold" },
  { feature: "Token allowance", free: "10 / day", lite: "40 / mo", medium: "100 / mo", pro: "200 / mo", payg: "Custom Pack" },
  { feature: "Token expiry", free: "Expire every day", lite: "Expire in month", medium: "Expire in month", pro: "Expire in month", payg: "Never expire" },
];

function Pricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [paygPackCredits, setPaygPackCredits] = useState<string>("5");
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>(() => getCurrentCurrency());
  const [activeOffer, setActiveOffer] = useState<PurchasePlanConfig | null>(() =>
    AdminStore.getActiveFestivalOffer()
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    AuthUser.getCurrentUser()
  );

  const isYearly = billingPeriod === "yearly";

  useEffect(() => {
    const update = () => {
      setActiveOffer(AdminStore.getActiveFestivalOffer());
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

    AdminStore.fetchPlansFromServer().then(() => {
      setActiveOffer(AdminStore.getActiveFestivalOffer());
      setCurrentUser(AuthUser.getCurrentUser());
    });
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
      window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurrency);
    };
  }, []);

  const formatPrice = (amountINR: number) => formatCurrency(amountINR, currentCurrency);

  const selectedPaygPack: PaygPack =
    PAYG_PACKS.find((p) => String(p.credits) === paygPackCredits) ?? {
      credits: 5,
      price: 199,
      label: "5 Gold Tokens",
    };

  const paygCostPerToken = `~${formatPrice(Math.round((selectedPaygPack.price / selectedPaygPack.credits) * 10) / 10)}`;

  const handleBuy = (
    credits: number,
    name: string,
    priceINR: number,
    planType: "pack" | "subscription" | "festival" = "pack"
  ) => {
    navigate({
      to: "/cart",
      search: {
        plan: name,
        planType,
        credits,
        price: priceINR,
        period: billingPeriod,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero Header */}
      <section className="px-5 pt-16 md:px-10 md:pt-24 text-center max-w-4xl mx-auto">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          pricing
        </p>
        <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] md:text-6xl text-foreground">
          Pay for what you process<span className="text-accent">.</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-sm leading-relaxed text-muted-foreground md:text-base">
          Start for free with daily Bronze Tokens, subscribe for monthly Silver Tokens, or buy permanent Gold Token packs.
        </p>

        {/* Billing Toggle (Monthly / Yearly) */}
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            aria-pressed={!isYearly}
            className={`rounded-full px-5 py-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              !isYearly
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            aria-pressed={isYearly}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              isYearly
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Yearly</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
              2 months free
            </span>
          </button>
        </div>

        {/* Product Hunt Social Proof */}
        <div className="mt-8 flex justify-center">
          <ProductHuntBadge variant="compact" />
        </div>

      </section>

      {/* Main Pricing Cards Container */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 py-12 md:py-16 w-full">
        {/* Optional Active Festival Offer Promo Banner */}
        {activeOffer && (
          <div className="mb-12 overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-6 sm:p-8 shadow-xl shadow-amber-500/10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative h-28 w-28 sm:h-36 sm:w-48 shrink-0 overflow-hidden rounded-2xl border border-amber-500/30 bg-muted">
                  <img
                    src={activeOffer.imageUrl || "/images/festival-offer-banner.jpg"}
                    alt={activeOffer.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/celebration-gift-banner.jpg";
                    }}
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-slate-950 shadow-xs">
                    Festival
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-600 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-white shadow-xs">
                      {activeOffer.badge || "LIMITED TIME OFFER"}
                    </span>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Wand2 className="h-3.5 w-3.5 fill-current" />
                      Special Festive Pack
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black text-foreground">
                    {activeOffer.name}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {activeOffer.tagline || "Exclusive limited-time festive discount!"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-foreground">
                      {formatPrice(activeOffer.priceINR)}
                    </span>
                    {activeOffer.originalPriceINR && (
                      <span className="font-mono text-sm text-muted-foreground line-through">
                        {formatPrice(activeOffer.originalPriceINR)}
                      </span>
                    )}
                    <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-mono text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      {(activeOffer.credits + (activeOffer.bonusCredits || 0)).toLocaleString()} Credits
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleBuy(
                      activeOffer.credits + (activeOffer.bonusCredits || 0),
                      activeOffer.name,
                      activeOffer.priceINR,
                      "festival"
                    )
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Gift className="h-4 w-4" />
                  <span>Claim Offer ({formatPrice(activeOffer.priceINR)})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5 Responsive Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
          {/* Card 1: Free */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-medium">{PRICING_CONFIG.free.name}</h3>
                <TokenCoin type="bronze" size="sm" />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {currentUser ? "10 Bronze Tokens (Daily Allowance)" : PRICING_CONFIG.free.tokenQuota}
              </p>

              <div className="mt-6">
                <p className="font-display text-3xl sm:text-4xl font-medium">
                  {formatPrice(0)}{" "}
                  <span className="text-sm sm:text-base text-muted-foreground font-normal">
                    {PRICING_CONFIG.free.periodText}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  {currentUser ? "Always free • Active Plan" : "Always free • Login required"}
                </p>
              </div>

              {currentUser ? (
                currentUser.plan === "free" ? (
                  <div className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-full border border-border bg-muted/80 px-4 py-2.5 text-xs font-semibold text-foreground select-none cursor-default shadow-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Current Plan</span>
                  </div>
                ) : (
                  <div className="mt-6 w-full inline-flex justify-center items-center rounded-full border border-border/60 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground select-none cursor-default">
                    Included
                  </div>
                )
              ) : (
                <Link
                  to="/login"
                  search={{ redirect: "/pricing" }}
                  className="mt-6 w-full inline-flex justify-center items-center rounded-full border border-border bg-transparent px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {PRICING_CONFIG.free.buttonText}
                </Link>
              )}

              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                {PRICING_CONFIG.free.features.map((f) => {
                  const label =
                    currentUser && f.includes("Need to login")
                      ? "10 free daily credits active"
                      : f;
                  return (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Card 2: Lite */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-medium">{PRICING_CONFIG.lite.name}</h3>
                <TokenCoin type="silver" size="sm" />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {PRICING_CONFIG.lite.tokenQuota}
              </p>

              <div className="mt-6">
                <p className="font-display text-3xl sm:text-4xl font-medium">
                  {formatPrice(isYearly ? PRICING_CONFIG.lite.yearlyPrice : PRICING_CONFIG.lite.monthlyPrice)}{" "}
                  <span className="text-sm sm:text-base text-muted-foreground font-normal">
                    {isYearly ? "/ yr" : "/ mo"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
                  ~{formatPrice(isYearly ? PRICING_CONFIG.lite.costPerTokenYearly : PRICING_CONFIG.lite.costPerTokenMonthly)} / Token
                </p>
              </div>

              {currentUser?.plan === "lite" ? (
                <div className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-full border border-border bg-muted/80 px-4 py-2.5 text-xs font-semibold text-foreground select-none cursor-default shadow-xs">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Current Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleBuy(
                      40,
                      isYearly ? "Lite Yearly Plan (Silver Tokens)" : "Lite Monthly Plan (Silver Tokens)",
                      isYearly ? PRICING_CONFIG.lite.yearlyPrice : PRICING_CONFIG.lite.monthlyPrice,
                      "subscription"
                    )
                  }
                  className="mt-6 w-full inline-flex justify-center items-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-85 cursor-pointer"
                >
                  {PRICING_CONFIG.lite.buttonText}
                </button>
              )}

              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                {PRICING_CONFIG.lite.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 3: Medium (100 Tokens, ₹999/mo, MOST POPULAR) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-amber-500 bg-card p-5 md:p-6 shadow-xl shadow-amber-500/10">
            {/* Most Popular Badge */}
            <span className="absolute -top-3 right-5 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-sm animate-pulse">
              Most Popular
            </span>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-medium text-amber-500">{PRICING_CONFIG.medium.name}</h3>
                <TokenCoin type="silver" size="sm" showGlow />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {PRICING_CONFIG.medium.tokenQuota}
              </p>

              <div className="mt-6">
                <p className="font-display text-3xl sm:text-4xl font-medium">
                  {formatPrice(isYearly ? PRICING_CONFIG.medium.yearlyPrice : PRICING_CONFIG.medium.monthlyPrice)}{" "}
                  <span className="text-sm sm:text-base text-muted-foreground font-normal">
                    {isYearly ? "/ yr" : "/ mo"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-mono font-medium">
                  ~{formatPrice(isYearly ? PRICING_CONFIG.medium.costPerTokenYearly : PRICING_CONFIG.medium.costPerTokenMonthly)} / Token
                </p>
              </div>

              {currentUser?.plan === ("medium" as any) ? (
                <div className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-500 select-none cursor-default shadow-xs">
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                  <span>Current Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleBuy(
                      100,
                      isYearly ? "Medium Yearly Plan (Silver Tokens)" : "Medium Monthly Plan (Silver Tokens)",
                      isYearly ? PRICING_CONFIG.medium.yearlyPrice : PRICING_CONFIG.medium.monthlyPrice,
                      "subscription"
                    )
                  }
                  className="mt-6 w-full inline-flex justify-center items-center rounded-full bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/25 hover:bg-amber-400 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  {PRICING_CONFIG.medium.buttonText}
                </button>
              )}

              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                {PRICING_CONFIG.medium.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className={f.includes("AI photo") || f.includes("GPU") ? "font-bold text-foreground" : ""}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 4: Pro */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl font-medium">{PRICING_CONFIG.pro.name}</h3>
                  <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                    Studio Pro
                  </span>
                </div>
                <TokenCoin type="silver" size="sm" showGlow />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {PRICING_CONFIG.pro.tokenQuota}
              </p>

              <div className="mt-6">
                <p className="font-display text-3xl sm:text-4xl font-medium">
                  {formatPrice(isYearly ? PRICING_CONFIG.pro.yearlyPrice : PRICING_CONFIG.pro.monthlyPrice)}{" "}
                  <span className="text-sm sm:text-base text-muted-foreground font-normal">
                    {isYearly ? "/ yr" : "/ mo"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-mono font-medium">
                  ~{formatPrice(isYearly ? PRICING_CONFIG.pro.costPerTokenYearly : PRICING_CONFIG.pro.costPerTokenMonthly)} / Token
                </p>
              </div>

              {currentUser?.plan === "pro" ? (
                <div className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-full border border-border bg-muted/80 px-4 py-2.5 text-xs font-semibold text-foreground select-none cursor-default shadow-xs">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Current Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleBuy(
                      200,
                      isYearly ? "Pro Yearly Plan (Silver Tokens)" : "Pro Monthly Plan (Silver Tokens)",
                      isYearly ? PRICING_CONFIG.pro.yearlyPrice : PRICING_CONFIG.pro.monthlyPrice,
                      "subscription"
                    )
                  }
                  className="mt-6 w-full inline-flex justify-center items-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-85 cursor-pointer shadow-md"
                >
                  {PRICING_CONFIG.pro.buttonText}
                </button>
              )}

              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                {PRICING_CONFIG.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 5: Pay-as-you-go */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-medium">{PRICING_CONFIG.payg.name}</h3>
                <TokenCoin type="gold" size="sm" showGlow />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Permanent packs • Gold Tokens never expire
              </p>

              {/* Dynamic Pack Select Dropdown */}
              <div className="mt-4">
                <label
                  htmlFor="payg-select"
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  {PRICING_CONFIG.payg.dropdownLabel}
                </label>
                <Select value={paygPackCredits} onValueChange={setPaygPackCredits}>
                  <SelectTrigger id="payg-select" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYG_PACKS.map((p) => (
                      <SelectItem key={p.credits} value={String(p.credits)}>
                        {p.credits.toLocaleString("en-IN")} Gold Tokens — {formatPrice(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="font-display text-3xl sm:text-4xl font-medium">
                  {formatPrice(selectedPaygPack.price)}
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-mono font-medium">
                  {paygCostPerToken} / Gold Token
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleBuy(
                    selectedPaygPack.credits,
                    `${selectedPaygPack.credits} Gold Tokens Pack`,
                    selectedPaygPack.price,
                    "pack"
                  )
                }
                className="mt-6 w-full inline-flex justify-center items-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-85 cursor-pointer shadow-md"
              >
                {PRICING_CONFIG.payg.buttonText}
              </button>

              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                {PRICING_CONFIG.payg.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-medium md:text-4xl">
              Compare plans & features<span className="text-accent">.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Choose the exact tool capabilities and token allowance tailored to your creative workflow.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 sticky top-0 backdrop-blur z-10">
                  <th className="py-4 px-5 text-sm font-bold text-foreground">Feature</th>
                  <th className="py-4 px-4 text-sm font-bold text-center text-foreground">
                    Free
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-center text-foreground">
                    Lite
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-center text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    Medium (Popular)
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-center text-foreground">
                    Pro
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-center text-foreground">
                    Pay-as-you-go
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {COMPARISON_TABLE.map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderCell(row.free)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderCell(row.lite)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium bg-amber-500/5">
                      {renderCell(row.medium)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderCell(row.pro)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderCell(row.payg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Token Explainer */}
          <div className="mt-8 text-center max-w-3xl mx-auto space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              <span className="text-orange-600 dark:text-orange-400 font-bold">Bronze Tokens</span> are free daily allowance (login required, resets daily).{" "}
              <span className="text-slate-700 dark:text-slate-300 font-bold">Silver Tokens</span> are monthly subscriptions (Lite 40, Pro 200, resets monthly).{" "}
              <span className="text-amber-600 dark:text-amber-400 font-bold">Gold Tokens</span> are pay-as-you-go and never expire.
            </p>
            <p className="text-xs text-muted-foreground">
              Bronze Tokens power basic tools. Silver and Gold Tokens unlock full AI features, high-resolution downloads, and max-quality exports.
            </p>
          </div>
        </div>

        {/* Trust Line & Razorpay Security Assurance */}
        <div className="mt-14 rounded-2xl border border-border/80 bg-muted/20 p-6 text-center max-w-2xl mx-auto shadow-xs">
          <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 inline shrink-0" />
            <span>Cancel anytime. Secure payments via UPI, cards and net banking.</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-foreground/90">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              Secured by Razorpay Live
            </span>
            <span>•</span>
            <span>256-Bit SSL Encryption</span>
            <span>•</span>
            <span>Zero Tracking Guarantee</span>
          </div>
          <div className="mt-5 pt-4 border-t border-border/50 flex justify-center">
            <ProductHuntBadge variant="compact" />
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <Faq />

      <SiteFooter />
    </div>
  );
}

function renderCell(val: string | boolean) {
  if (typeof val === "boolean") {
    return val ? (
      <span
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        aria-label="Included"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
      </span>
    ) : (
      <span
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/60 text-muted-foreground/35"
        aria-label="Not included"
      >
        <Minus className="h-3.5 w-3.5 stroke-[2]" />
      </span>
    );
  }
  return <span className="font-medium text-foreground">{val}</span>;
}
