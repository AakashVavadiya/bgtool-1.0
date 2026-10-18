import { useNavigate } from "@tanstack/react-router";
import { X, ArrowRight, ShieldCheck } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";

export interface AddCreditsDialogDetail {
  toolName?: string;
  toolSlug?: string;
  creditCost?: number;
  currentCredits?: number;
}

export function openAddCreditsDialog(detail?: AddCreditsDialogDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bg:show_add_credits_dialog", { detail }));
  }
}

// Alias for semantic clarity
export const openAddTokensDialog = openAddCreditsDialog;

interface AddCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
  toolSlug?: string;
  creditCost?: number;
  currentCredits?: number;
}

export function AddCreditsDialog({
  isOpen,
  onClose,
  toolName = "Tool",
  creditCost = 1,
  currentCredits = 0,
}: AddCreditsDialogProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAddTokens = () => {
    onClose();
    navigate({ to: "/pricing" });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      {/* Background glow */}
      <div className="absolute w-[440px] h-[440px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon & Tag */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 shadow-inner">
            <TokenCoin type="gold" size="lg" showGlow />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <TokenCoin type="gold" size="xs" />
            <span>Tokens Needed</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Get Gold Tokens to Continue
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
            You need <strong className="text-foreground">{creditCost} token{creditCost === 1 ? "" : "s"}</strong> to process with{" "}
            <strong className="text-foreground">{toolName}</strong>. Your current balance is{" "}
            <strong className="text-amber-500 font-mono">{currentCredits} token{currentCredits === 1 ? "" : "s"}</strong>.
          </p>
        </div>

        {/* Token Info Card (No prices shown) */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs space-y-2.5 text-left">
          <div className="flex items-start gap-2.5">
            <TokenCoin type="silver" size="sm" className="mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Daily Free Silver Tokens</strong> renew automatically every midnight at 12:00 AM.
            </div>
          </div>
          <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
            <TokenCoin type="gold" size="sm" className="mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-amber-500 font-extrabold">Purchased Gold Tokens</strong> never expire, support full AI processing, and let you create without waiting.
            </div>
          </div>
        </div>

        {/* Action Buttons: Only "Add Tokens" button navigating directly to /pricing */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddTokens}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-4 text-base font-black text-background shadow-xl hover:scale-[1.02] hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            <TokenCoin type="gold" size="xs" showGlow />
            <span>Add Tokens</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <span>Cancel</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Secured checkout powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
}
