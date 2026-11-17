import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Check, ArrowRight, X, Shield, Lock } from "lucide-react";

export interface GuestLoginDialogDetail {
  toolName?: string;
  toolSlug?: string;
  reason?: "base_exhausted" | "same_tool_exhausted" | "bonus_exhausted";
  message?: string;
}

export function openGuestLoginDialog(detail?: GuestLoginDialogDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bg:show_guest_login_dialog", { detail }));
  }
}

interface GuestLoginDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  toolName?: string;
  redirectUrl?: string;
}

export function GuestLoginDialog({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  toolName: initialToolName,
  redirectUrl,
}: GuestLoginDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [toolName, setToolName] = useState(initialToolName || "AI Tools");
  const [dialogDetail, setDialogDetail] = useState<GuestLoginDialogDetail | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvt = e as CustomEvent<GuestLoginDialogDetail>;
      if (customEvt.detail) {
        setDialogDetail(customEvt.detail);
        if (customEvt.detail.toolName) {
          setToolName(customEvt.detail.toolName);
        }
      }
      setInternalOpen(true);
    };

    window.addEventListener("bg:show_guest_login_dialog", handleOpen);
    return () => {
      window.removeEventListener("bg:show_guest_login_dialog", handleOpen);
    };
  }, []);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  if (!isOpen) return null;

  const currentPath =
    redirectUrl ||
    (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/tools");

  const isSameToolExhausted = dialogDetail?.reason === "same_tool_exhausted";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl border-t sm:border border-border bg-card p-5 sm:p-8 shadow-2xl text-center space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-7 sm:pb-8">
        {/* Mobile Pull Handle Indicator */}
        <div className="mx-auto -mt-1 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Badge */}
        <div className="flex justify-center pt-1 sm:pt-2">
          <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/20 to-amber-500/5 shadow-inner">
            <Gift className="h-8 w-8 sm:h-9 sm:w-9 text-amber-500" />
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-[11px] font-black shadow-md ring-2 ring-card">
              10
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Lock className="h-3 w-3 text-amber-500" />
          <span>
            {isSameToolExhausted
              ? "5 Free Uses on this Tool Completed"
              : "Free Guest Usage Completed"}
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h2
            id="guest-dialog-title"
            className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
          >
            {isSameToolExhausted
              ? "Try Another Tool or Sign In Free"
              : "Please Log In to Continue Free"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {isSameToolExhausted ? (
              <>
                You have finished your <strong className="text-foreground">5 free guest tries</strong> on{" "}
                <strong className="text-foreground">{toolName}</strong>. You can try{" "}
                <strong className="text-amber-500">another type of tool for 2 bonus chances</strong>, or sign in to get{" "}
                <strong className="text-foreground">10 free daily credits</strong>!
              </>
            ) : (
              <>
                You have used all <strong className="text-foreground">free guest tries</strong>. To keep using{" "}
                <strong className="text-foreground">{toolName}</strong> and all our 130+ tools, simply log in to claim your{" "}
                <strong className="text-foreground">10 free daily credits</strong>!
              </>
            )}
          </p>
        </div>

        {/* Benefit Items */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs space-y-2.5 text-left">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-foreground font-medium">
              <strong>10 Free Daily Credits</strong> refreshed every day automatically at midnight
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-foreground font-medium">
              Full access to AI Background Remover, Compress, Upscale, and PDF tools
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-foreground font-medium">
              High-speed AI processing and full-resolution image downloads
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-foreground font-medium">
              <strong>100% Free Forever</strong> — No credit card or payment required
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {isSameToolExhausted ? (
            <Link
              to="/tools"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-md hover:scale-[1.02] hover:opacity-95 transition-all cursor-pointer"
            >
              <span>Explore Other Tools (2 Free Bonus)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ redirect: currentPath }}
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-md hover:scale-[1.02] hover:opacity-90 transition-all cursor-pointer"
            >
              <span>Log In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <Link
            to="/signup"
            search={{ redirect: currentPath }}
            onClick={handleClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <span>Create Free Account (10 Daily)</span>
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
          <Shield className="h-3 w-3 text-emerald-500" />
          <span>Quick 10-second signup. Daily free credits guaranteed.</span>
        </p>
      </div>
    </div>
  );
}
