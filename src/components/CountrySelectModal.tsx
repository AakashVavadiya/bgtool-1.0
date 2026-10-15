import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Check, Globe } from "lucide-react";
import { COUNTRIES, POPULAR_COUNTRY_CODES, isCountryRestricted, type CountryInfo } from "@/lib/countries";
import { ServiceUnavailableDialog } from "@/components/ServiceUnavailableDialog";

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: CountryInfo;
  onSelectCountry: (country: CountryInfo) => void;
}

export function CountrySelectModal({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
}: CountrySelectModalProps) {
  const [search, setSearch] = useState("");
  const [blockedCountry, setBlockedCountry] = useState<CountryInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // Scroll active item into view
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({ block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Popular countries list
  const popularCountries = useMemo(() => {
    return POPULAR_COUNTRY_CODES.map(
      (code) => COUNTRIES.find((c) => c.code === code)
    ).filter((c): c is CountryInfo => Boolean(c));
  }, []);

  // Filter countries by search query (name, code, or dialCode)
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return COUNTRIES;

    return COUNTRIES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchDial = c.dialCode.replace(/^\+/, "").includes(q);
      return matchName || matchCode || matchDial;
    });
  }, [search]);

  const handleCountrySelect = (c: CountryInfo) => {
    if (isCountryRestricted(c.code)) {
      setBlockedCountry(c);
      return;
    }
    onSelectCountry(c);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Country Code"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      >
        <div
          className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl border-t sm:border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[640px] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 overflow-hidden"
        >
          {/* Mobile Pull Handle */}
          <div className="pt-2.5 pb-1 sm:hidden">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-border/60 flex items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                <span>Select Country</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Choose your country or dial code for verification
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close country selector"
              className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 sm:p-4 pb-2 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by country name, code, or dial code..."
                className="w-full h-11 rounded-xl border border-border bg-muted/40 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Popular Pills (Shown when no search term) */}
          {!search && (
            <div className="px-3 sm:px-4 py-2 border-b border-border/40 shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Popular Countries
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {popularCountries.map((c) => {
                  const isSelected = selectedCountry.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-muted/40 hover:bg-muted border-border/60 text-foreground"
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${c.flagCode}.png`}
                        alt={c.name}
                        className="w-4 h-3 object-cover rounded-xs border border-border/40"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <span>{c.code}</span>
                      <span className="text-muted-foreground font-mono text-[11px]">{c.dialCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Country List */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-2 sm:px-3 py-1 divide-y divide-border/20">
            {filteredCountries.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Globe className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <div className="text-sm font-semibold text-foreground">No countries found</div>
                <p className="text-xs text-muted-foreground">
                  No matching country for &quot;{search}&quot;. Try searching with another name or code.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-2 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry.code === c.code;
                const isRestricted = isCountryRestricted(c.code);

                return (
                  <button
                    key={c.code}
                    ref={isSelected ? selectedItemRef : undefined}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-accent/10 text-foreground font-semibold"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <img
                        src={`https://flagcdn.com/w40/${c.flagCode}.png`}
                        alt={c.name}
                        className="w-5 h-3.5 object-cover rounded-xs border border-border/60 shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="min-w-0 truncate">
                        <div className="text-sm font-medium truncate group-hover:text-foreground flex items-center gap-2">
                          <span className="truncate">{c.name}</span>
                          {isRestricted && (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Service Not Available
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.code} · ISO
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                        {c.dialCode}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground shrink-0 shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer info showing country count */}
          <div className="p-2.5 px-4 bg-muted/20 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
            <span>{filteredCountries.length} countries available</span>
            <span>Tap to select</span>
          </div>
        </div>
      </div>

      {/* Service Unavailable Dialog (e.g. for Pakistan) */}
      <ServiceUnavailableDialog
        isOpen={Boolean(blockedCountry)}
        onClose={() => setBlockedCountry(null)}
        onChangeCountry={() => setBlockedCountry(null)}
        countryName={blockedCountry?.name}
        flagCode={blockedCountry?.flagCode}
      />
    </>
  );
}
