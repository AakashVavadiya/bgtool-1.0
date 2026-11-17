import { useState, useEffect, useRef } from "react";
import { SUPPORTED_CURRENCIES, getCurrentCurrency, setCurrency, CURRENCY_CHANGED_EVENT, type CurrencyCode } from "@/lib/currency";
import { ChevronDown, Coins, Check, Search, X } from "lucide-react";

interface CurrencySwitcherProps {
  variant?: "header" | "footer";
}

function CurrencyFlag({ flagCode, name }: { flagCode: string; name: string }) {
  const [hasError, setHasError] = useState(false);
  const code = (flagCode || "in").toLowerCase();

  if (hasError) {
    return <span className="text-xs">🪙</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={18}
      height={13}
      alt={name || code}
      onError={() => setHasError(true)}
      className="inline-block rounded-xs object-cover shadow-2xs shrink-0 select-none border border-black/10 dark:border-white/10"
      loading="lazy"
    />
  );
}

export function CurrencySwitcher({ variant = "header" }: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCurrency, setCurrentCurrencyState] = useState<CurrencyCode>("INR");
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentCurrencyState(getCurrentCurrency());

    const handleCurrencyChange = (e: any) => {
      if (e.detail?.currency) {
        setCurrentCurrencyState(e.detail.currency);
      }
    };

    window.addEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
    return () => window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Lock body scroll on mobile and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    if (window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency) || SUPPORTED_CURRENCIES[0]!;

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setCurrentCurrencyState(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  const filtered = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.countryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative inline-block notranslate ${isOpen ? "z-50" : ""}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Currency"
        className={`flex items-center gap-1.5 transition-all cursor-pointer select-none ${
          variant === "header"
            ? "rounded-full border border-border bg-card/85 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:border-amber-500/50 hover:bg-card hover:scale-105 backdrop-blur-md"
            : "rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground hover:border-amber-500/50 hover:bg-card shadow-xs"
        }`}
      >
        <CurrencyFlag flagCode={activeConfig.flagCode} name={activeConfig.name} />
        <span className="font-extrabold font-mono text-[11px] sm:text-xs">
          {activeConfig.symbol} {activeConfig.code}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-amber-500" : ""
          }`}
        />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Popover / Mobile Bottom Sheet */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-x-0 bottom-0 z-[99999] w-full rounded-t-[32px] border-t border-border bg-card/98 p-4 text-foreground shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[82vh] pb-8 sm:absolute sm:inset-auto sm:z-50 sm:w-80 sm:rounded-3xl sm:border sm:border-border/80 sm:p-3 sm:pb-3 sm:max-h-[460px] sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-150 ${
            variant === "footer"
              ? "sm:bottom-full sm:mb-3 sm:left-0 sm:right-auto"
              : "sm:top-full sm:mt-2 sm:right-0 sm:left-auto"
          }`}
        >
          {/* Mobile Pull Handle */}
          <div className="pt-0.5 pb-2.5 sm:hidden flex justify-center shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-2.5 px-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 font-bold shadow-xs">
                <Coins className="h-3.5 w-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Select Currency
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Auto-converts all plan prices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {activeConfig.code}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-2.5 mb-1.5 px-0.5 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency or country..."
              className="w-full rounded-xl border border-border/80 bg-muted/40 py-2 sm:py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Currency List */}
          <div className="mt-1 space-y-1 overflow-y-auto px-0.5 scrollbar-thin max-h-[55vh] sm:max-h-56 flex-1">
            {filtered.map((cur) => {
              const isSelected = cur.code === currentCurrency;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => handleSelect(cur.code)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2.5 sm:py-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/15 border border-amber-500/40 text-foreground font-bold"
                      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CurrencyFlag flagCode={cur.flagCode} name={cur.name} />
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-foreground">
                          {cur.code}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          ({cur.symbol.trim()})
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[150px]">
                        {cur.name} • {cur.countryName}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950 shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No matching currencies found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

