import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AdminStore, type PurchasePlanConfig } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { initiateRazorpayCheckout } from "@/lib/razorpay";
import { formatCurrency, getCurrentCurrency, CURRENCY_CHANGED_EVENT, type CurrencyCode } from "@/lib/currency";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import {
  X,
  Wand2,
  CheckCircle2,
  Zap,
  Gift,
  ShieldCheck,
  Flame,
  ArrowRight,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export const OPEN_FESTIVAL_DIALOG_EVENT = "open_festival_dialog";

export function openFestivalOffersDialog() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_FESTIVAL_DIALOG_EVENT));
  }
}

interface FestivalOffersDialogProps {
  customOffer?: PurchasePlanConfig | null;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function FestivalOffersDialog({
  customOffer,
  forceOpen,
  onClose,
}: FestivalOffersDialogProps) {
  const [isOpen, setIsOpen] = useState(() => Boolean(forceOpen));
  const [offer, setOffer] = useState<PurchasePlanConfig | null>(() => {
    return customOffer || AdminStore.getActiveFestivalOffer();
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>(() => getCurrentCurrency());

  const routerState = useRouterState();
  const currentPath = routerState?.location?.pathname || "";
  const isAdminRoute = currentPath.startsWith("/admin");

  // Keep state synchronized if props change
  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (customOffer !== undefined) {
      setOffer(customOffer);
      if (customOffer && forceOpen) {
        setIsOpen(true);
      }
    }
  }, [customOffer, forceOpen]);

  const handleClose = () => {
    if (!isAdminRoute && !customOffer) {
      try {
        sessionStorage.setItem("bg.festival_dialog.dismissed", "true");
      } catch {
        /* ignore */
      }
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleCurr = (e: any) => {
      if (e.detail?.currency) {
        setCurrentCurrency(e.detail.currency);
      }
    };
    window.addEventListener(CURRENCY_CHANGED_EVENT, handleCurr);

    if (customOffer) {
      setOffer(customOffer);
      if (forceOpen) setIsOpen(true);
      return () => window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurr);
    }

    const refreshOffer = () => {
      const active = AdminStore.getActiveFestivalOffer();
      setOffer(active);
    };

    // Auto-fetch fresh plans from server on mount
    AdminStore.fetchPlansFromServer().then((plans) => {
      const active = plans.find((p) => p.active && p.isFestivalOffer && p.showInFestivalDialog) || null;
      setOffer(active);
    });

    window.addEventListener(REALTIME_EVENT_NAME, refreshOffer);
    window.addEventListener("storage", refreshOffer);

    // Listener for manual triggers (e.g. from header pill or pricing button)
    const handleOpenTrigger = () => {
      refreshOffer();
      setIsOpen(true);
    };
    window.addEventListener(OPEN_FESTIVAL_DIALOG_EVENT, handleOpenTrigger);

    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, refreshOffer);
      window.removeEventListener("storage", refreshOffer);
      window.removeEventListener(OPEN_FESTIVAL_DIALOG_EVENT, handleOpenTrigger);
      window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurr);
    };
  }, [customOffer, forceOpen, isAdminRoute]);

  if (!isOpen || !offer) return null;

  const totalCredits = offer.credits + (offer.bonusCredits || 0);
  const hasDiscount = offer.originalPriceINR && offer.originalPriceINR > offer.priceINR;
  const discountPercent = hasDiscount
    ? Math.round(((offer.originalPriceINR! - offer.priceINR) / offer.originalPriceINR!) * 100)
    : 0;

  const handleClaimOffer = () => {
    if (isAdminRoute || customOffer) {
      toast.info("Preview Mode: In customer view, this directs to checkout.");
      handleClose();
      return;
    }
    handleClose();
    if (typeof window !== "undefined") {
      window.location.href = `/cart?plan=${encodeURIComponent(offer.name)}&planType=festival&credits=${totalCredits}&price=${offer.priceINR}`;
    }
  };

  const bannerImg = offer.imageUrl || "/images/festival-offer-banner.jpg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-card text-foreground shadow-2xl shadow-amber-500/15 transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white/95 backdrop-blur-md hover:bg-black hover:text-white transition-all cursor-pointer shadow-lg ring-1 ring-white/20 active:scale-90"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Festive Banner Image */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-muted">
          <img
            src={bannerImg}
            alt={offer.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
            onError={(e) => {
              // Fallback to celebration banner if custom fails
              (e.target as HTMLImageElement).src = "/images/celebration-gift-banner.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 font-mono text-[11px] font-extrabold uppercase text-slate-950 shadow-md shadow-amber-500/30 animate-pulse">
              <Wand2 className="h-3.5 w-3.5 fill-current" />
              <span>Special Festival Offer</span>
            </span>

            {discountPercent > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 font-mono text-[11px] font-extrabold text-white shadow-md">
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>SAVE {discountPercent}%</span>
              </span>
            )}
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3 left-6 right-6 z-10">
            <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              {offer.name}
            </h3>
            {offer.tagline && (
              <p className="mt-1 text-xs sm:text-sm font-medium text-amber-200 drop-shadow">
                {offer.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Price & Credits Value Highlight Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Festival Pricing
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-3xl sm:text-4xl font-black text-foreground">
                  {formatCurrency(offer.priceINR, currentCurrency)}
                </span>
                {hasDiscount && (
                  <span className="font-mono text-base font-semibold text-muted-foreground line-through">
                    {formatCurrency(offer.originalPriceINR!, currentCurrency)}
                  </span>
                )}
                {offer.billingPeriod === "one-time" ? (
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                    One-time payment
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-medium">/{offer.billingPeriod}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Credits Unlocked
              </span>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-black text-amber-500">
                <Zap className="h-5 w-5 fill-current text-amber-500" />
                <span>{totalCredits.toLocaleString()} Credits</span>
              </div>
              {offer.bonusCredits && offer.bonusCredits > 0 ? (
                <span className="text-[11px] font-bold text-emerald-500">
                  Includes +{offer.bonusCredits} Free Bonus Credits!
                </span>
              ) : null}
            </div>
          </div>

          {/* Features Checklist */}
          {offer.features && offer.features.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What's included in this offer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-foreground/90">
                {offer.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleClaimOffer}
              disabled={isClaiming}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Gift className="h-5 w-5" />
              <span>
                {isAdminRoute || customOffer
                  ? `Claim Offer (${formatCurrency(offer.priceINR, currentCurrency)})`
                  : isClaiming
                  ? "Adding Credits..."
                  : `Claim Offer (${formatCurrency(offer.priceINR, currentCurrency)})`}
              </span>
            </button>

            {isAdminRoute || customOffer || onClose ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/80 hover:bg-secondary px-6 py-4 text-xs font-bold text-foreground transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <X className="h-4 w-4" />
                <span>Close Preview</span>
              </button>
            ) : (
              <Link
                to="/pricing"
                onClick={handleClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/60 px-5 py-4 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <span>All Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-medium pt-1 border-t border-border">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Instant Credit Activation
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Credits Never Expire
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
