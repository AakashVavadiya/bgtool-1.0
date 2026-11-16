import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { tools, TOOL_CATEGORIES, type ToolCategory } from "@/lib/tools";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminStore } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import {
  Search,
  X,
  ArrowRight,
  Filter,
  CheckCircle2,
  Wrench,
  Layers,
  Cpu,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import { buildPageMeta, buildBreadcrumbsSchema, SITE_URL } from "@/lib/seo";

interface ToolsSearchParams {
  cat?: string | undefined;
  category?: string | undefined;
  q?: string | undefined;
}

export const Route = createFileRoute("/tools/")({
  validateSearch: (search: Record<string, unknown>): ToolsSearchParams => {
    return {
      cat: typeof search["cat"] === "string" ? (search["cat"] as string) : undefined,
      category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
      q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    };
  },
  head: () => {
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "All 130+ Free Online AI Tools & Utilities",
      url: `${SITE_URL}/tools`,
      description: "Complete directory of 130+ free online image, document, and PDF tools on bg.tools with zero tracking.",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.slice(0, 40).map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/tools/${t.slug}`,
          name: t.name,
          description: t.blurb,
        })),
      },
    };

    const breadcrumbsSchema = buildBreadcrumbsSchema([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
    ]);

    const seo = buildPageMeta({
      title: "All 130+ Free Online AI Tools & Image Utilities | bg.tools",
      description: "Explore 130+ free online AI image editing, document processing, and PDF tools on bg.tools. 100% privacy-first, zero tracking, and no watermark.",
      path: "/tools",
      keywords: [
        "all ai tools",
        "free online tools directory",
        "image tools",
        "pdf tools online",
        "convert tools",
        "photo editor online",
      ],
      jsonLd: [collectionSchema, breadcrumbsSchema],
    });

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: ToolsDirectoryPage,
});

const TOOL_SEARCH_SUGGESTIONS = [
  "Background Remover",
  "Compress Image (Lossless)",
  "Rotate & Batch Multi-Image",
  "Extract Text with OCR",
  "Convert PDF to Image",
  "Square Photo 1:1",
  "Face & Privacy Blur",
  "Meme Generator",
  "Watermark Image",
  "Image to Excel Table",
  "Crop & Resize Photos",
  "Color Picker from Image",
];

const POPULAR_SEARCH_TAGS = [
  { label: "Background Remover", query: "background" },
  { label: "Compress Image", query: "compress" },
  { label: "Rotate & Flip", query: "rotate" },
  { label: "PDF Tools", query: "pdf" },
  { label: "OCR Extractor", query: "ocr" },
  { label: "Face Blur", query: "blur" },
  { label: "Square Photo", query: "square" },
  { label: "Meme Generator", query: "meme" },
];

function SmoothSearchTicker({
  suggestions,
  isPaused,
}: {
  suggestions: string[];
  isPaused: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Append first item to create seamless infinite loop without jump
  const items = useMemo(() => [...suggestions, suggestions[0]!], [suggestions]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setIndex((prev) => prev + 1);
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused, suggestions.length]);

  useEffect(() => {
    if (index !== suggestions.length) {
      return;
    }
    // Reached duplicate: after the 650ms transition finishes, seamlessly snap to 0 without animation
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setIndex(0);
    }, 650);
    return () => clearTimeout(timer);
  }, [index, suggestions.length]);

  return (
    <div className="h-6 sm:h-7 overflow-hidden relative w-full pointer-events-none select-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]">
      <div
        className={`flex flex-col will-change-transform ${
          isTransitioning
            ? "transition-transform duration-650 ease-[cubic-bezier(0.16,1,0.3,1)]"
            : ""
        }`}
        style={{
          transform: `translateY(-${(index * 100) / items.length}%)`,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="h-6 sm:h-7 shrink-0 flex items-center gap-1.5 text-sm sm:text-base leading-none"
          >
            <span className="text-muted-foreground/70 font-normal shrink-0">Search</span>
            <span className="font-semibold text-foreground/85 truncate tracking-tight">
              &ldquo;{item}&rdquo;
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolsDirectoryPage() {
  const searchParams = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolCategory>("All");
  const [, setTick] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync category & query from URL search params (e.g. ?cat=image or ?cat=pdf)
  useEffect(() => {
    const raw = (searchParams.cat || searchParams.category || "").trim().toLowerCase();
    if (!raw || raw === "all" || raw === "all tools") {
      setSelectedCategory("All");
    } else if (raw.includes("pdf")) {
      setSelectedCategory("PDF Tools");
    } else if (raw.includes("image")) {
      setSelectedCategory("Image Editing & Optimization");
    } else {
      const match = TOOL_CATEGORIES.find((c) => c.toLowerCase() === raw);
      if (match) setSelectedCategory(match);
    }
  }, [searchParams.cat, searchParams.category]);

  useEffect(() => {
    if (searchParams.q !== undefined) {
      setSearchQuery(searchParams.q);
    }
  }, [searchParams.q]);

  const isMac = typeof window !== "undefined" && navigator.platform?.toUpperCase().includes("MAC");

  // Global hotkeys (Ctrl+K, Cmd+K, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (searchQuery) {
          setSearchQuery("");
        } else {
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  useEffect(() => {
    AdminStore.syncToolsConfigFromServer().then(() => setTick((t) => t + 1));
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filter tools based on category and live search (only enabled tools)
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tools.filter((tool) => {
      // Must be enabled in admin
      if (!AdminStore.isToolEnabled(tool.slug)) {
        return false;
      }
      // Category match
      if (selectedCategory !== "All" && tool.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (!q) return true;
      const matchName = tool.name.toLowerCase().includes(q);
      const matchBlurb = tool.blurb.toLowerCase().includes(q);
      const matchTag = tool.tag?.toLowerCase().includes(q);
      const matchCategory = tool.category.toLowerCase().includes(q);
      const matchAccepts = tool.accepts.toLowerCase().includes(q);
      const matchOutputs = tool.outputs.toLowerCase().includes(q);
      const matchKeywords = tool.seo?.keywords?.some((k) => k.toLowerCase().includes(q));

      return (
        matchName ||
        matchBlurb ||
        matchTag ||
        matchCategory ||
        matchAccepts ||
        matchOutputs ||
        matchKeywords
      );
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryCount = (cat: "All" | ToolCategory) => {
    const active = tools.filter((t) => AdminStore.isToolEnabled(t.slug));
    if (cat === "All") return active.length;
    return active.filter((t) => t.category === cat).length;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      <SiteHeader />

      <main className="flex-1 w-full">
        {/* Full-width Hero Header with aligned edge padding */}
        <section className="relative border-b border-border bg-gradient-to-b from-secondary/40 via-card/50 to-background px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-12 md:py-20 w-full">
          <div className="w-full">
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              130+ Tools<span className="text-accent">.</span> One Workspace.
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Explore our full ecosystem of specialized image processors, neural AI models, document utilities, and PDF converters. Search instantly or filter by category below.
            </p>

            {/* Animated Search Bar with 60fps Liquid Border Beam & Smooth Ticker */}
            <div className="mt-7 w-full max-w-3xl">
              <div
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* 1. Subtle, Clean Ambient Halo (Light & Refined, Zero Heavy Orange Smudge) */}
                <div className="pointer-events-none absolute -inset-0.5 rounded-full bg-accent/15 blur-md opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 transition-opacity duration-500" />

                {/* 2. Rotating Border Beam Container (Subtle, Light Sheen) */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className={`relative p-[1.5px] rounded-full overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-text ${
                    isFocused
                      ? "ring-2 ring-accent/25 scale-[1.004]"
                      : "hover:scale-[1.002]"
                  }`}
                >
                  {/* Subtle, soft light beam without heavy saturation */}
                  <div className="absolute inset-[-200%] animate-border-beam pointer-events-none bg-[conic-gradient(from_0deg,transparent_0_280deg,hsl(var(--accent)/0.12)_315deg,hsl(var(--accent)/0.35)_350deg,transparent_360deg)] opacity-35 group-hover:opacity-65 group-focus-within:opacity-80 transition-opacity duration-500" />

                  {/* Inner Search Pill Body */}
                  <div className="relative flex items-center rounded-full bg-card dark:bg-card/90 backdrop-blur-xl border border-border/80 dark:border-border/60 w-full transition-colors duration-300">
                    {/* Left Search Icon with Micro-Interactions */}
                    <div className="pl-4 sm:pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-accent transition-colors duration-300 shrink-0">
                      <div className="relative flex items-center justify-center">
                        <Search
                          className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-all duration-300 ${
                            isFocused ? "scale-110 rotate-6 text-accent" : "group-hover:scale-105"
                          }`}
                        />
                        {/* Active typing pulse pip */}
                        {searchQuery && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-ping" />
                        )}
                      </div>
                    </div>

                    {/* Input Element & Smooth Ticker Overlay */}
                    <div className="relative flex-1 flex items-center min-w-0">
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        aria-label="Search tools"
                        className="w-full bg-transparent py-3.5 sm:py-4.5 pl-3 sm:pl-4 pr-3 text-sm sm:text-base font-semibold text-foreground placeholder:text-transparent focus:outline-none"
                      />

                      {/* Smooth Vertical Sliding Ticker Placeholder */}
                      {!searchQuery && (
                        <div className="absolute left-3 sm:left-4 inset-y-0 flex items-center pointer-events-none select-none max-w-[calc(100%-80px)] sm:max-w-[calc(100%-120px)] w-full">
                          <SmoothSearchTicker
                            suggestions={TOOL_SEARCH_SUGGESTIONS}
                            isPaused={isFocused || isHovered}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side: Results Match Pill, Clear Button & Keyboard Shortcut Badge */}
                    <div className="pr-3.5 sm:pr-4.5 flex items-center gap-2 shrink-0">
                      {/* Live Match Counter Badge */}
                      {searchQuery && (
                        <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border/60 px-2.5 py-1 text-[11px] font-mono font-bold text-foreground animate-in zoom-in-75 fade-in duration-200 shadow-2xs">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              filteredTools.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            }`}
                          />
                          <span>
                            {filteredTools.length} {filteredTools.length === 1 ? "match" : "matches"}
                          </span>
                        </div>
                      )}

                      {/* Animated Clear X Button */}
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery("");
                            inputRef.current?.focus();
                          }}
                          aria-label="Clear search"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-all cursor-pointer group/clear animate-in zoom-in-75 duration-200"
                          title="Clear search (Esc)"
                        >
                          <X className="h-4 w-4 group-hover/clear:rotate-90 group-hover/clear:scale-110 transition-transform duration-200" />
                        </button>
                      ) : (
                        /* Keyboard Shortcut Badge */
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            inputRef.current?.focus();
                          }}
                          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-border/80 bg-secondary/50 text-[11px] font-mono font-bold text-muted-foreground shadow-2xs group-hover:border-foreground/30 transition-colors cursor-pointer select-none"
                          title="Press / or Ctrl+K to search"
                        >
                          <span className="text-[10px] opacity-70">{isMac ? "⌘" : "Ctrl"}</span>
                          <span>K</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Interactive Trending / Popular Quick-Filter Chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground shrink-0 pr-1 select-none">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/80" />
                  <span>Popular:</span>
                </span>
                {POPULAR_SEARCH_TAGS.map((tag) => {
                  const isActive = searchQuery.toLowerCase().trim() === tag.query.toLowerCase();
                  return (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setSearchQuery("");
                        } else {
                          setSearchQuery(tag.query);
                          inputRef.current?.focus();
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm scale-105 ring-2 ring-accent/30 font-bold"
                          : "border border-border/70 bg-card/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-secondary/60 hover:-translate-y-0.5"
                      }`}
                    >
                      <span>{tag.label}</span>
                      {isActive && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats Line */}
            <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground font-medium">
              <span>
                Total Tools: <strong className="text-foreground">{tools.length}</strong>
              </span>
              <span>•</span>
              <span>
                Categories: <strong className="text-foreground">{TOOL_CATEGORIES.length}</strong>
              </span>
              <span>•</span>
              <span>
                Browser Acceleration: <strong className="text-emerald-500 font-bold">Enabled</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Categories Bar & Results - Full width with aligned edge padding */}
        <section className="w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 md:py-10">
          {/* Category Filter Pills & Counter */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === "All"
                    ? "bg-foreground text-background shadow-md scale-105"
                    : "border border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                All Tools ({getCategoryCount("All")})
              </button>

              {TOOL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? "bg-foreground text-background shadow-md scale-105"
                      : "border border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {cat} ({getCategoryCount(cat)})
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-muted-foreground shrink-0">
              Showing <span className="font-bold text-foreground">{filteredTools.length}</span> of {tools.length} tools
            </div>
          </div>

          {/* Tools Grid or Empty State - Full screen multi-column grid */}
          {filteredTools.length === 0 ? (
            <div className="my-20 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center w-full">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">No matching tools found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                We couldn't find any tool matching "{searchQuery}". Try adjusting your keywords or clearing the category filter.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold text-background transition-all hover:bg-foreground/90"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <div
                    key={tool.slug}
                    className="tool-card group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/40 hover:shadow-lg"
                  >
                    <div>
                      {/* Top Bar inside card: Category & Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground/80">
                          {tool.category}
                        </span>

                        {tool.tag ? (
                          <span className="shrink-0 text-[0.68rem] font-medium text-muted-foreground">
                            {tool.tag}
                          </span>
                        ) : null}
                      </div>

                      {/* Main Tool Link covering the card body */}
                      <Link
                        to="/tools/$slug"
                        params={{ slug: tool.slug }}
                        className="block focus:outline-none after:absolute after:inset-0 after:z-0"
                      >
                        {/* Icon & Title */}
                        <div className="mt-5 flex items-center gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary transition-all duration-300 group-hover:scale-105 group-hover:bg-foreground group-hover:text-background shadow-inner">
                            <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate font-display text-base font-semibold leading-tight transition-colors group-hover:text-accent">
                              {tool.name}
                            </h2>
                            <span className="block truncate text-[0.68rem] text-muted-foreground">
                              {tool.accepts} → {tool.outputs}
                            </span>
                          </div>
                        </div>

                        {/* Blurb */}
                        <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {tool.blurb}
                        </p>
                      </Link>
                    </div>

                    {/* Bottom CTA with Read Article Icon & Open Link */}
                    <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between text-xs relative z-10">
                      {/* Read Article Link */}
                      <Link
                        to="/news/$slug"
                        params={{ slug: tool.slug }}
                        title={`Read full article & guide: ${tool.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 px-2.5 py-1 text-[0.72rem] font-semibold text-muted-foreground hover:text-accent transition-all cursor-pointer shadow-2xs group/art"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-accent shrink-0 transition-transform group-hover/art:scale-110" />
                        <span>Read Article</span>
                      </Link>

                      {/* Open Tool Link */}
                      <Link
                        to="/tools/$slug"
                        params={{ slug: tool.slug }}
                        className="inline-flex items-center gap-1 font-semibold text-foreground group-hover:text-accent text-[0.72rem] transition-all group-hover:gap-1.5"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Info Callout - Full width */}
          <div className="mt-14 w-full rounded-3xl border border-border bg-muted/30 p-6 sm:p-8 text-center md:text-left md:flex md:items-center md:justify-between shadow-xs">
            <div className="max-w-2xl">
              <h3 className="font-display text-lg font-bold">
                10 Free Credits Every Day For Everyone
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                All accounts automatically refresh up to 10 free credits daily at midnight. No credit card required. Upgrade anytime for unlimited 4K batch processing.
              </p>
            </div>
            <div className="mt-4 md:mt-0 shrink-0">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-foreground hover:text-background"
              >
                <span>View Plans & Packs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
