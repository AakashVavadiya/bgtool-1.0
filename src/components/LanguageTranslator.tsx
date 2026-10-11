import { useState, useEffect, useRef } from "react";
import { Globe, Check, Search, RotateCcw, ChevronDown } from "lucide-react";
import {
  SUPPORTED_WEBSITE_LANGUAGES,
  getCurrentWebsiteLanguage,
  setWebsiteLanguage,
  detectUserRegionLanguage,
  type TranslationLanguage,
} from "@/lib/translator";
import { toast } from "sonner";

interface LanguageTranslatorProps {
  variant?: "header" | "footer" | "floating" | "compact";
}

/**
 * Universal Language Flag:
 * Renders crisp, high-resolution national flags on all OS platforms (including Windows, Mac, Android, iOS)
 * without relying on Windows emoji glyphs which render as plain letters (e.g. "US", "IN").
 */
export function LanguageFlag({
  countryCode,
  name,
  className = "w-5 h-3.5",
}: {
  countryCode?: string;
  name?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const code = (countryCode || "us").toLowerCase();

  if (hasError) {
    return (
      <span className="inline-flex items-center justify-center rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground border border-border">
        {code.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={20}
      height={14}
      alt={name || code}
      onError={() => setHasError(true)}
      className={`inline-block rounded-xs object-cover shadow-2xs shrink-0 select-none border border-black/10 dark:border-white/10 ${className}`}
      loading="lazy"
    />
  );
}

export function LanguageTranslator({ variant = "header" }: LanguageTranslatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "popular" | "indian" | "european" | "asian">("popular");
  const [autoDetectedInfo, setAutoDetectedInfo] = useState<{ code: string; isAutoDetected: boolean; source: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial sync
    const lang = getCurrentWebsiteLanguage();
    setCurrentLang(lang);
    const detected = detectUserRegionLanguage();
    setAutoDetectedInfo(detected);

    // Listen for custom language change events
    const handleLangChange = (e: any) => {
      if (e.detail?.language) {
        setCurrentLang(e.detail.language);
      }
    };

    window.addEventListener("bg_language_changed", handleLangChange);
    return () => window.removeEventListener("bg_language_changed", handleLangChange);
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

  const handleSelectLanguage = (code: string) => {
    setWebsiteLanguage(code, true);
    setCurrentLang(code);
    setIsOpen(false);
    setSearchQuery("");

    const langObj = SUPPORTED_WEBSITE_LANGUAGES.find((l) => l.code === code);
    const name = langObj ? `${langObj.nativeName} (${langObj.name})` : code;

    if (code === "en") {
      toast.success("Website switched back to English (Original).");
    } else {
      toast.success(`Website switched to ${name}!`);
    }
  };

  const activeLanguageObj =
    SUPPORTED_WEBSITE_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_WEBSITE_LANGUAGES[0]!;

  const filteredLanguages = SUPPORTED_WEBSITE_LANGUAGES.filter((l) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.region && l.region.toLowerCase().includes(q))
      );
    }
    if (activeCategory === "all") return true;
    return l.category === activeCategory;
  });

  return (
    <div className="relative inline-block notranslate" ref={popoverRef}>
      {/* ── Trigger Button ────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Website Language"
        className={`flex items-center gap-2 transition-all cursor-pointer select-none ${
          variant === "header"
            ? "rounded-full border border-border bg-card/85 px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:border-accent/50 hover:bg-card hover:scale-105 backdrop-blur-md"
            : variant === "footer"
            ? "rounded-full border border-border bg-card/90 px-3.5 py-1.5 text-xs font-bold text-foreground hover:border-accent/50 hover:bg-card shadow-xs"
            : "rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:border-foreground"
        }`}
      >
        <LanguageFlag countryCode={activeLanguageObj.countryCode} name={activeLanguageObj.name} />
        <span className="font-extrabold truncate max-w-[85px] sm:max-w-[120px]">
          {activeLanguageObj.nativeName}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      {/* ── Dropdown / Modal Popover ───────────────────────────────────── */}
      {isOpen && (
        <div
          className={`absolute z-50 w-[calc(100vw-2rem)] max-w-[380px] sm:w-[390px] rounded-3xl border border-border/80 bg-card/98 p-4 text-foreground shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[520px] ${
            variant === "footer"
              ? "bottom-full mb-3 right-0 sm:right-0"
              : "top-full mt-2.5 right-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 font-bold shadow-xs">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Language Switcher
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Select your preferred language
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {currentLang !== "en" && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-bold text-accent border border-accent/30">
                  {activeLanguageObj.code.toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Switch to English Button (When translated) */}
          {currentLang !== "en" && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => handleSelectLanguage("en")}
                className="w-full flex items-center justify-between rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer border border-border bg-muted/40 hover:border-accent hover:bg-accent/10 hover:text-accent shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <LanguageFlag countryCode="us" name="English" />
                  <div className="text-left">
                    <span className="block font-black text-foreground">Switch to English (Original)</span>
                    <span className="block text-[10px] text-muted-foreground">Restore original language</span>
                  </div>
                </div>
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Category Tabs (No scrollbar) */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 text-[11px] font-bold scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {(
              [
                { id: "popular", label: "Popular" },
                { id: "indian", label: "Indian" },
                { id: "european", label: "European" },
                { id: "asian", label: "Asian" },
                { id: "all", label: "All (40+)" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery("");
                }}
                className={`px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer text-xs ${
                  activeCategory === cat.id && !searchQuery
                    ? "bg-accent text-white font-extrabold shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Filter Input */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language, region, or code..."
              className="w-full rounded-xl border border-border/80 bg-background/80 py-2 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                {filteredLanguages.length}
              </span>
            )}
          </div>

          {/* Languages Grid / List */}
          <div className="mt-2.5 flex-1 overflow-y-auto space-y-1 pr-1 max-h-64 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {filteredLanguages.map((l) => {
              const isSelected = currentLang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-accent/15 text-accent border border-accent/40 font-bold shadow-xs"
                      : "hover:bg-muted/80 text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <LanguageFlag countryCode={l.countryCode} name={l.name} />
                    <div className="text-left truncate">
                      <span className={`block text-xs truncate ${isSelected ? "font-black text-accent" : "font-bold text-foreground"}`}>
                        {l.nativeName}
                      </span>
                      <span className="block text-[10px] text-muted-foreground truncate">
                        {l.name} {l.region ? `• ${l.region}` : ""}
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shrink-0 ml-2">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-60 ml-2">
                      {l.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
