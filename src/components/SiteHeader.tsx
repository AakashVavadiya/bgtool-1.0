import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminStore, type PurchasePlanConfig, type UiEditSettings } from "@/admin/lib/admin-store";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { Wand2, LogOut, ChevronDown, Menu, X, ArrowRight, Settings } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";

const links = [
  { label: "Home.", to: "/" },
  { label: "Models.", to: "/models" },
  { label: "Tools.", to: "/tools" },
  { label: "Pricing.", to: "/pricing" },
  { label: "FAQ.", to: "/pricing", hash: "faq" },
] as const;

function renderTabLabel(label: string) {
  if (label === "FAQ.") {
    return (
      <span className="notranslate">
        FAQ<span className="text-accent font-bold">.</span>
      </span>
    );
  }
  if (label.endsWith(".")) {
    return (
      <>
        {label.slice(0, -1)}
        <span className="text-accent font-bold">.</span>
      </>
    );
  }
  return label;
}

const announcementColors: Record<string, string> = {
  amber: "bg-amber-500 text-amber-950 hover:bg-amber-400",
  emerald: "bg-emerald-600 text-white hover:bg-emerald-500",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-500",
  rose: "bg-rose-600 text-white hover:bg-rose-500",
  violet: "bg-violet-600 text-white hover:bg-violet-500",
};

export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const [uiSettings, setUiSettings] = useState<UiEditSettings>(() => AdminStore.getUiSettings());
  const [activeOffer, setActiveOffer] = useState<PurchasePlanConfig | null>(() => AdminStore.getActiveFestivalOffer());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setUiSettings(AdminStore.getUiSettings());
      setActiveOffer(AdminStore.getActiveFestivalOffer());
      setCurrentUser(AuthUser.getCurrentUser());
    };
    window.addEventListener(REALTIME_EVENT_NAME, update);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    AuthUser.logout();
    setCurrentUser(null);
    setProfileOpen(false);
    window.location.reload();
  };

  // Filter links dynamically according to page tree and AI toggles
  const visibleLinks = links.filter((l) => {
    if (l.to === "/models") {
      return (
        uiSettings.aiMasterEnabled &&
        uiSettings.aiModelsPageEnabled &&
        uiSettings.aiHeaderLinksEnabled &&
        AdminStore.isPageEnabled("/models")
      );
    }
    if (l.to === "/tools") {
      return uiSettings.showToolsLink && AdminStore.isPageEnabled("/tools");
    }
    if (l.to === "/pricing") {
      if ("hash" in l && l.hash === "faq") {
        return uiSettings.showFaqLink && AdminStore.isPageEnabled("/pricing");
      }
      return uiSettings.showPricingLink && AdminStore.isPageEnabled("/pricing");
    }
    return AdminStore.isPageEnabled(l.to);
  });

  const isHeaderSticky = floating || (uiSettings.structure?.headerSticky ?? true);
  const containerMaxWidthClass =
    uiSettings.structure?.containerMaxWidth === "boxed"
      ? "max-w-[1280px] mx-auto"
      : uiSettings.structure?.containerMaxWidth === "wide"
      ? "max-w-[1440px] mx-auto"
      : "w-full";

  return (
    <header className={isHeaderSticky ? "sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all" : "relative z-50 border-b border-border bg-background transition-all"}>
      {/* Top Announcement Bar if enabled in Pro Settings */}
      {uiSettings.announcementEnabled && uiSettings.announcementText && (
        <div
          className={`w-full py-1.5 px-4 text-center text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
            announcementColors[uiSettings.announcementBgColor] || announcementColors["amber"]
          }`}
        >
          {uiSettings.announcementLink ? (
            <Link to={uiSettings.announcementLink} className="inline-flex items-center gap-1.5 hover:underline">
              <span>{uiSettings.announcementText}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <span>{uiSettings.announcementText}</span>
          )}
        </div>
      )}

      <div className={`relative flex items-center justify-between px-4 sm:px-6 py-2 md:px-12 md:py-3 ${containerMaxWidthClass}`}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="relative z-30 p-2 -ml-2 rounded-xl text-foreground hover:bg-muted/80 md:hidden transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <nav className="hidden items-center gap-3.5 lg:gap-5 xl:gap-7 py-4 text-xs sm:text-sm xl:text-[15px] font-semibold md:flex max-w-[calc(50vw-85px)] shrink-0 overflow-hidden whitespace-nowrap">
          {visibleLinks.map((l) =>
            "hash" in l ? (
              <Link
                key={l.label}
                to={l.to}
                hash={l.hash}
                className="transition-all hover:text-accent hover:opacity-80 shrink-0"
              >
                {renderTabLabel(l.label)}
              </Link>
            ) : (
              <Link key={l.label} to={l.to} className="transition-all hover:text-accent hover:opacity-80 shrink-0">
                {renderTabLabel(l.label)}
              </Link>
            ),
          )}
        </nav>

        {/* Center-Aligned Brand Logo */}
        <Link
          to="/"
          className="notranslate py-3 sm:py-4 font-display text-3xl font-bold tracking-tight absolute left-1/2 -translate-x-1/2 text-center md:text-4xl z-20 shrink-0 select-none"
        >
          {(() => {
            const brand = uiSettings.headerBrandText || "bg.";
            if (brand.endsWith(".")) {
              return (
                <>
                  {brand.slice(0, -1)}
                  <span className="text-accent">.</span>
                </>
              );
            }
            return brand;
          })()}
        </Link>

        <div className="relative z-30 flex items-center gap-1.5 sm:gap-2.5 py-4">
          {uiSettings.showThemeToggle && (
            <div className="hidden md:flex">
              <ThemeToggle />
            </div>
          )}

          {/* User Logged In State vs Logged Out State */}
          {currentUser ? (
            /* Profile Dropdown */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card p-1 sm:pr-3 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background font-black text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
              </button>

              {profileOpen && (
                <div
                  role="dialog"
                  aria-label="User Account Menu"
                  className="absolute right-0 top-full mt-2 w-80 sm:w-[324px] rounded-3xl border border-border/80 bg-card/95 dark:bg-card/98 backdrop-blur-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out space-y-2.5"
                >
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 p-2 border-b border-border/60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background font-display text-lg font-bold shadow-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{currentUser.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block rounded-md bg-secondary/80 border border-border/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {currentUser.plan} plan
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 text-[9px] font-bold">
                          <TokenCoin type="bronze" size="xs" />
                          <span>10 Bronze / Day</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Token Details Card */}
                  <div className="rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/60 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Token Balance
                      </span>
                      <span className="font-mono font-black text-foreground">
                        {currentUser.credits} Total
                      </span>
                    </div>

                    {/* Bronze Free Tokens */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <TokenCoin type="bronze" size="xs" />
                        <span>Bronze Tokens (Daily)</span>
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        {currentUser.freeCredits ?? 10}
                      </span>
                    </div>

                    {/* Gold Paid Tokens */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <TokenCoin type="gold" size="xs" showGlow={(currentUser.paidCredits ?? 0) > 0} />
                        <span>Gold Tokens (Purchased)</span>
                      </span>
                      <span className="font-mono font-bold text-amber-500">
                        {currentUser.paidCredits ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Special Offer Animated Banner */}
                  <Link
                    to="/pricing"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-amber-500 fill-amber-500/20 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-bold">Special Offer</span>
                    </span>
                    {activeOffer?.badge ? (
                      <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                        {activeOffer.badge}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                        60% OFF SPECIAL
                      </span>
                    )}
                  </Link>

                  {/* Navigation Links (Studio & Tools removed as requested) */}
                  <div className="space-y-1 pt-0.5">
                    <Link
                      to="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <TokenCoin type="gold" size="xs" />
                        <span>Get Gold Tokens</span>
                      </span>
                      <span className="font-mono font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform">
                        Top up →
                      </span>
                    </Link>

                    <Link
                      to="/account"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span>Account & Settings</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>

                  {/* Divider and Logout */}
                  <div className="pt-1 border-t border-border/60">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer text-left group"
                    >
                      <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2.5 sm:gap-4">
              <Link to="/login" className="text-base font-medium transition-opacity hover:opacity-60 hidden sm:inline">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-foreground px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-background transition-all hover:scale-[1.03] hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bottom Sheet Drawer (Portaled to document.body to escape header backdrop-filter containing block) */}
      {mobileMenuOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="fixed inset-x-0 bottom-0 z-[100000] rounded-t-[32px] border-t border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 pb-9 text-foreground"
          >
            {/* Pull handle indicator */}
            <div className="mx-auto -mt-1.5 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            {/* Top Bar inside Drawer: Title & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-display text-lg font-black tracking-tight text-foreground">
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1">
              {visibleLinks.map((l) =>
                "hash" in l ? (
                  <Link
                    key={l.label}
                    to={l.to}
                    hash={l.hash}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <span>{renderTabLabel(l.label)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ) : (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <span>{renderTabLabel(l.label)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ),
              )}
            </nav>

            {/* Theme Toggle row inside drawer */}
            {uiSettings.showThemeToggle && (
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-3 py-2 rounded-2xl bg-muted/30">
                <span className="text-sm font-semibold text-foreground">Theme Mode</span>
                <ThemeToggle />
              </div>
            )}

            {/* Auth / Account State inside Drawer */}
            {currentUser ? (
              <div className="pt-3 border-t border-border/60 space-y-3">
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-bold text-sm text-foreground truncate">{currentUser.name}</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-2xl border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-border/60 flex flex-col gap-2.5">
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background shadow-md transition-all active:scale-[0.98]"
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-2xl border border-border bg-card hover:bg-muted/60 py-3 text-sm font-bold text-foreground transition-all"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
