import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AdminStore, type SiteDialogSettings, type SiteDialogType } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { X, Info, AlertTriangle, AlertCircle, Flame, Check, Copy, ArrowRight } from "lucide-react";

const STORAGE_KEY_ONCE = "bg.site_dialog.dismissed_v1";
const STORAGE_KEY_SESSION = "bg.site_dialog.session_dismissed_v1";

interface GlobalSiteDialogProps {
  previewMode?: boolean;
  previewSettings?: SiteDialogSettings;
  onPreviewClose?: () => void;
}

export function GlobalSiteDialog({
  previewMode = false,
  previewSettings,
  onPreviewClose,
}: GlobalSiteDialogProps) {
  const routerState = useRouterState();
  const currentPath = routerState?.location?.pathname || "/";
  const [settings, setSettings] = useState<SiteDialogSettings>(() => {
    return previewSettings || AdminStore.getUiSettings().siteDialog;
  });
  const [isOpen, setIsOpen] = useState(previewMode);
  const [copied, setCopied] = useState(false);

  // Sync settings from AdminStore in real time
  useEffect(() => {
    if (previewMode && previewSettings) {
      setSettings(previewSettings);
      setIsOpen(true);
      return;
    }

    const sync = () => {
      const s = AdminStore.getUiSettings().siteDialog;
      setSettings(s);
    };

    window.addEventListener(REALTIME_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [previewMode, previewSettings]);

  // Determine visibility based on page targeting, frequency, and delay
  // Currently hidden on website startup (kept intact for Admin Preview & future activation)
  const AUTO_OPEN_ON_STARTUP = false;

  useEffect(() => {
    if (previewMode) return;

    if (!AUTO_OPEN_ON_STARTUP || !settings.enabled) {
      setIsOpen(false);
      return;
    }

    // Check target page filter
    if (settings.targetPages === "home" && currentPath !== "/") {
      setIsOpen(false);
      return;
    }
    if (settings.targetPages === "pricing" && !currentPath.startsWith("/pricing")) {
      setIsOpen(false);
      return;
    }
    if (settings.targetPages === "tools" && !currentPath.startsWith("/tools")) {
      setIsOpen(false);
      return;
    }

    // Check frequency dismissal
    if (settings.frequency === "once") {
      try {
        if (localStorage.getItem(STORAGE_KEY_ONCE) === "true") {
          setIsOpen(false);
          return;
        }
      } catch {
        /* ignore */
      }
    } else if (settings.frequency === "session") {
      try {
        if (sessionStorage.getItem(STORAGE_KEY_SESSION) === "true") {
          setIsOpen(false);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // Delay auto-open for polished entrance
    const delayMs = Math.max(200, (settings.autoOpenDelaySeconds || 1) * 1000);
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [settings, currentPath, previewMode]);

  const handleDismiss = () => {
    setIsOpen(false);

    if (previewMode) {
      onPreviewClose?.();
      return;
    }

    try {
      if (settings.frequency === "once") {
        localStorage.setItem(STORAGE_KEY_ONCE, "true");
      } else if (settings.frequency === "session") {
        sessionStorage.setItem(STORAGE_KEY_SESSION, "true");
      }
    } catch {
      /* ignore */
    }
  };

  const handleCopyCode = () => {
    if (!settings.couponCode) return;
    navigator.clipboard?.writeText(settings.couponCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!isOpen) return null;

  // Theme styling based on Dialog Type
  const getTypeConfig = (type: SiteDialogType) => {
    switch (type) {
      case "offer":
        return {
          icon: Flame,
          badgeBg: "bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400",
          iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
          accentBorder: "border-rose-500/30 dark:border-rose-500/20",
          accentGlow: "from-rose-500/10 via-amber-500/5 to-transparent",
          btnBg: "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/25",
        };
      case "alert":
        return {
          icon: AlertCircle,
          badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400",
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
          accentBorder: "border-amber-500/30 dark:border-amber-500/20",
          accentGlow: "from-amber-500/10 via-orange-500/5 to-transparent",
          btnBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/25",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400",
          iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
          accentBorder: "border-rose-500/40 dark:border-rose-500/30",
          accentGlow: "from-rose-500/15 via-red-500/5 to-transparent",
          btnBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25",
        };
      case "info":
      default:
        return {
          icon: Info,
          badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400",
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
          accentBorder: "border-blue-500/30 dark:border-blue-500/20",
          accentGlow: "from-blue-500/10 via-indigo-500/5 to-transparent",
          btnBg: "bg-foreground hover:opacity-90 text-background shadow-xs",
        };
    }
  };

  const styleConfig = getTypeConfig(settings.type);
  const IconComponent = styleConfig.icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        settings.displayMode === "bottom-sheet"
          ? "items-end sm:items-center justify-center p-0 sm:p-4"
          : settings.displayMode === "floating-card"
          ? "items-end justify-end p-4 sm:p-6 pointer-events-none"
          : "items-end sm:items-center justify-center p-0 sm:p-4"
      }`}
    >
      {/* Backdrop for Modal Mode */}
      {settings.displayMode !== "floating-card" && (
        <div
          onClick={handleDismiss}
          className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        />
      )}

      {/* Main Dialog Container: Mobile Bottom-Sheet on small screens, centered modal on desktop */}
      <div
        className={`relative z-10 w-full max-w-lg pointer-events-auto transform transition-all duration-300 animate-in fade-in zoom-in-95 ${
          settings.displayMode === "bottom-sheet"
            ? "rounded-t-3xl sm:rounded-3xl border-t sm:border border-border bg-card shadow-2xl p-6 sm:p-8"
            : settings.displayMode === "floating-card"
            ? "rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-6 max-w-md"
            : "rounded-t-3xl sm:rounded-3xl border-t sm:border border-border bg-card shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        } ${styleConfig.accentBorder}`}
      >
        {/* Mobile Swipe Handle Pill (Mobile View only) */}
        <div className="sm:hidden flex justify-center -mt-2 mb-4">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Ambient Top Glow */}
        <div
          className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${styleConfig.accentGlow} pointer-events-none rounded-t-3xl`}
        />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-2xl border border-border/80 bg-background/80 p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          aria-label="Close Announcement Dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Content */}
        <div className="flex items-start gap-3.5 pr-8">
          {settings.showIcon && (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styleConfig.iconBg} ring-1 shadow-xs`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
          )}

          <div className="space-y-1.5">
            {settings.badgeText && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide uppercase shadow-2xs ${styleConfig.badgeBg}`}
              >
                <span>{settings.badgeText}</span>
              </span>
            )}

            <h3 className="font-display text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug">
              {settings.title}
            </h3>
          </div>
        </div>

        {/* Body Message */}
        <div className="mt-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {settings.message}
        </div>

        {/* Optional Coupon Code Box (For New Offer Mode) */}
        {settings.type === "offer" && settings.couponCode && (
          <div className="mt-4 rounded-2xl border border-dashed border-rose-500/40 bg-rose-500/5 p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Discount Coupon Code
              </span>
              <p className="font-mono text-sm font-black text-foreground tracking-wider mt-0.5">
                {settings.couponCode}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          {settings.secondaryText && (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <span>{settings.secondaryText}</span>
            </button>
          )}

          {settings.ctaText && (
            <Link
              to={settings.ctaLink || "/pricing"}
              onClick={handleDismiss}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-extrabold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${styleConfig.btnBg}`}
            >
              <span>{settings.ctaText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
