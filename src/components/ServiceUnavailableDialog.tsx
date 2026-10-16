import { useEffect } from "react";
import { ShieldAlert, X, ArrowLeft, Globe } from "lucide-react";

interface ServiceUnavailableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeCountry?: (() => void) | undefined;
  countryName?: string | undefined;
  flagCode?: string | undefined;
}

export function ServiceUnavailableDialog({
  isOpen,
  onClose,
  onChangeCountry,
  countryName = "Pakistan",
  flagCode = "pk",
}: ServiceUnavailableDialogProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-unavailable-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl border-t sm:border border-rose-500/30 bg-card p-6 sm:p-7 shadow-2xl text-center space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Mobile Pull Handle */}
        <div className="mx-auto -mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-20 w-32 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="flex justify-center pt-1">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-inner">
            <ShieldAlert className="h-10 w-10 animate-pulse" />
            <img
              src={`https://flagcdn.com/w40/${flagCode}.png`}
              alt={countryName}
              className="absolute -bottom-1 -right-1 w-6 h-4 object-cover rounded-xs border-2 border-card shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Region Restricted Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
          <Globe className="h-3.5 w-3.5" />
          <span>Region Restricted</span>
        </div>

        {/* Main Title & Description */}
        <div className="space-y-2.5">
          <h2
            id="service-unavailable-title"
            className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight"
          >
            Our Service Not Available For You
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We do not serve our website, AI background remover, or account features in{" "}
            <span className="font-semibold text-foreground">{countryName}</span>.
            Registration and access from this location are currently unavailable.
          </p>
        </div>

        {/* Reason Box */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-left space-y-1.5">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Why are you seeing this?</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Due to regional compliance and operational restrictions, services for users selecting +92 ({countryName}) are disabled.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onChangeCountry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onChangeCountry();
              }}
              className="w-full h-12 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Select Another Country</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-2xl border border-border bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
