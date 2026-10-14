import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Check, ArrowRight, X, Shield, Lock } from "lucide-react";

export interface GuestLoginDialogDetail {
  toolName?: string;
  toolSlug?: string;
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

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvt = e as CustomEvent<GuestLoginDialogDetail>;
      if (customEvt.detail?.toolName) {
        setToolName(customEvt.detail.toolName);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-dialog-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-scale-in">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Badge */}
        <div className="flex justify-center pt-2">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/60 text-foreground shadow-xs">
            <Sparkles className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3 w-3 text-amber-500" />
          <span>5 Free Guest Uses Completed</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h2
            id="guest-dialog-title"
            className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
          >
            Please Log In to Continue Free
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            You have used all <strong className="text-foreground">5 free guest tries</strong>. To keep using{" "}
            <strong className="text-foreground">{toolName}</strong> and all our AI tools, simply log in to claim your{" "}
            <strong className="text-foreground">10 free daily credits</strong>!
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
          <Link
            to="/login"
            search={{ redirect: currentPath }}
            onClick={handleClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-md hover:scale-[1.02] hover:opacity-90 transition-all cursor-pointer"
          >
            <span>Log In & Claim 10 Free Credits</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/signup"
            search={{ redirect: currentPath }}
            onClick={handleClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <span>Create Free Account</span>
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
