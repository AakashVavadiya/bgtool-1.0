import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { tools, type Tool } from "@/lib/tools";
import { bgModels, type BgModel } from "@/lib/bg-models";
import { getNewsArticles, type NewsArticle } from "@/lib/news";
import { Search, X, Sparkles, ArrowRight, Wand2, Cpu, BookOpen, Compass, Zap, Flame, Layers, CheckCircle2 } from "lucide-react";

interface SearchParams {
  q?: string | undefined;
  cat?: string | undefined;
}

import { buildPageMeta, buildBreadcrumbsSchema } from "@/lib/seo";

// Page definition & SEO
export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
      cat: typeof search["cat"] === "string" ? (search["cat"] as string) : undefined,
    };
  },
  head: () =>
    buildPageMeta({
      title: "Search 130+ AI Tools, Neural Models & Guides | bg.tools",
      description:
        "Instant global search across all 130+ AI image processing tools, neural cutout models, developer REST API documentation, and step-by-step guides.",
      path: "/search",
      keywords: [
        "search ai tools",
        "find image converter",
        "background remover search",
        "bg.tools directory search",
      ],
      jsonLd: buildBreadcrumbsSchema([
        { name: "Home", path: "/" },
        { name: "Search", path: "/search" },
      ]),
    }),
  component: DedicatedSearchPage,
});

// Dedicated Site Pages for search
interface SitePageItem {
  id: string;
  title: string;
  description: string;
  to: string;
  category: "Pages & Features";
  badge?: string;
  keywords: string[];
}

const STATIC_PAGES: SitePageItem[] = [
  {
    id: "page-home",
    title: "AI Background Remover (Core Studio)",
    description: "Our flagship sub-pixel alpha background removal studio with automatic subject isolation.",
    to: "/",
    category: "Pages & Features",
    badge: "Core AI",
    keywords: ["home", "remove bg", "background removal", "alpha", "transparent", "matting", "studio"],
  },
  {
    id: "page-tools",
    title: "All 130+ Creative AI Tools Directory",
    description: "Browse the complete directory of image editing, format converters, document processing, and PDF tools.",
    to: "/tools",
    category: "Pages & Features",
    badge: "Directory",
    keywords: ["tools", "directory", "all tools", "catalog", "utilities", "creative"],
  },
  {
    id: "page-models",
    title: "AI Neural Models & Engine Specs",
    description: "Technical specifications and live showcase for Karudi Prime, Ganga, Brahmaputra, Narmada, and Saraswati.",
    to: "/models",
    category: "Pages & Features",
    badge: "AI Engines",
    keywords: ["models", "ai models", "karudi", "ganga", "brahmaputra", "narmada", "saraswati", "specs"],
  },
  {
    id: "page-pricing",
    title: "Pricing Plans & Gold Token Packs",
    description: "Free Bronze tokens daily (10/day), pay-as-you-go Gold token packs, and flexible plans for creators.",
    to: "/pricing",
    category: "Pages & Features",
    badge: "Pricing",
    keywords: ["pricing", "tokens", "bronze", "gold", "cost", "plans", "buy", "discount", "free"],
  },
  {
    id: "page-api",
    title: "Developer REST API & Documentation",
    description: "High-throughput API endpoints for automated background removal, watermarks, face blur, and conversions.",
    to: "/api",
    category: "Pages & Features",
    badge: "Developer",
    keywords: ["api", "developer", "rest api", "docs", "endpoints", "curl", "python", "javascript", "integration"],
  },
  {
    id: "page-download",
    title: "Desktop Apps & Extensions (Windows / Mac)",
    description: "Download offline desktop applications for batch processing with zero cloud data transfer.",
    to: "/download",
    category: "Pages & Features",
    badge: "Apps",
    keywords: ["download", "desktop", "offline", "windows", "mac", "app", "extension"],
  },
  {
    id: "page-contact",
    title: "Contact Us & Dedicated Support Desk",
    description: "Reach our technical team for custom enterprise API pricing, credit inquiries, feature suggestions, or help.",
    to: "/contact",
    category: "Pages & Features",
    badge: "Support",
    keywords: ["contact", "support", "help", "email", "bug", "inquiry", "enterprise"],
  },
  {
    id: "page-news",
    title: "News, Tutorials & Practical Guides",
    description: "In-depth tutorials and masterclasses for every image manipulation, conversion, and optimization tool.",
    to: "/news",
    category: "Pages & Features",
    badge: "Guides",
    keywords: ["news", "guides", "tutorials", "articles", "how to", "tips", "blog"],
  },
  {
    id: "page-developer",
    title: "Meet the Developers (Upanishad Team)",
    description: "Introduction to Upanishad, Developer Aakash Vavadiya, and Co-Owner Piyush Chodvadiya.",
    to: "/developer",
    category: "Pages & Features",
    badge: "Upanishad",
    keywords: ["developer", "upanishad", "aakash vavadiya", "piyush chodvadiya", "creators", "team", "coffee"],
  },
  {
    id: "page-faq",
    title: "Frequently Asked Questions (General FAQs)",
    description: "Answers about privacy guarantees, token expiration, refund policies, and batch processing limits.",
    to: "/pricing#faq",
    category: "Pages & Features",
    badge: "FAQ",
    keywords: ["faq", "questions", "privacy guarantee", "zero storage", "refund", "tokens"],
  },
];

// Popular search prompts
const POPULAR_SEARCHES = [
  "Background Remover",
  "Face Blur",
  "Watermark Eraser",
  "Photo Upscaler",
  "Compress Image",
  "SVG Converter",
  "PDF Tools",
  "Passport Photo",
  "Ganga Model",
  "Developer API",
];

// Highlight helper component
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;

  const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${cleanQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-500/25 text-amber-900 dark:text-amber-200 font-extrabold rounded-xs px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Synonyms map for smarter match
const SYNONYMS: Record<string, string[]> = {
  bg: ["background", "cutout", "transparent"],
  cutout: ["background", "remove", "matting", "transparent"],
  erase: ["remove", "watermark", "cleaner"],
  clean: ["remove", "erase", "blur"],
  upscale: ["super resolution", "enlarge", "enhance", "hd", "4k"],
  compress: ["shrink", "reduce", "optimize", "size"],
  convert: ["format", "transcode", "transform", "converter"],
  pdf: ["document", "merge", "split", "compress pdf"],
  face: ["portrait", "blur", "censor", "privacy"],
  api: ["developer", "rest", "endpoints", "curl", "keys"],
  pricing: ["tokens", "cost", "plans", "bronze", "gold"],
};

const TYPEWRITER_SEARCH_PROMPTS = [
  'Search "Background Remover"...',
  'Search "Face & Privacy Blur"...',
  'Search "Watermark Eraser"...',
  'Search "Photo Upscaler 4K"...',
  'Search "Compress Image PNG/JPG"...',
  'Search "PDF Tools (Split, Merge)"...',
  'Search "Developer REST API"...',
  'Search "Ganga AI Cutout"...',
  'Search "Passport Photo Studio"...',
  'Search "SVG Vector Converter"...',
];

function useTypewriter(
  words: string[],
  typingSpeed = 65,
  deletingSpeed = 30,
  holdDuration = 1900,
  pauseBeforeRetype = 400
) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;
    const currentWord = words[wordIndex % words.length]!;
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Writing phase
      if (text.length < currentWord.length) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        // Finished writing full phrase -> pause before erasing
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, holdDuration);
      }
    } else {
      // Erasing / backspacing phase
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length - 1));
        }, deletingSpeed);
      } else {
        // Finished erasing -> brief natural breathing pause before typing next word
        timer = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }, pauseBeforeRetype);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, holdDuration, pauseBeforeRetype]);

  return text;
}

type SearchResultItem =
  | { item: Tool; type: "tool"; score: number }
  | { item: BgModel; type: "model"; score: number }
  | { item: NewsArticle; type: "guide"; score: number }
  | { item: SitePageItem; type: "page"; score: number };

function DedicatedSearchPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.q || "");
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.cat || "all");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const animatedText = useTypewriter(TYPEWRITER_SEARCH_PROMPTS);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Blinking cursor ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const animatedPlaceholder = isFocused
    ? animatedText
    : `${animatedText}${cursorVisible ? "|" : " "}`;

  // Sync state if URL search params change
  useEffect(() => {
    if (searchParams.q !== undefined && searchParams.q !== query) {
      setQuery(searchParams.q);
    }
    if (searchParams.cat !== undefined && searchParams.cat !== activeCategory) {
      setActiveCategory(searchParams.cat);
    }
  }, [searchParams.q, searchParams.cat]);

  // Only auto-focus on desktop viewports to avoid opening virtual keyboard & red focus rings on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  // Update URL search params as query changes (debounced smooth replace, only if changed)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.q || "";
      const currentCat = searchParams.cat || "all";
      const targetQ = query.trim();
      const targetCat = activeCategory;

      if (currentQ !== targetQ || currentCat !== targetCat) {
        const nextSearch: SearchParams = {};
        if (targetQ) nextSearch.q = targetQ;
        if (targetCat !== "all") nextSearch.cat = targetCat;

        navigate({
          to: "/search",
          search: nextSearch as any,
          replace: true,
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query, activeCategory, navigate, searchParams.q, searchParams.cat]);

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: "/" });
      }
    }, 240);
  };

  // Listen to close-search-page custom event dispatched by header close button
  useEffect(() => {
    const onTriggerClose = () => handleClose();
    window.addEventListener("close-search-page", onTriggerClose);
    return () => window.removeEventListener("close-search-page", onTriggerClose);
  }, [isClosing]);

  // Handle keyboard shortcut ESC to clear or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (query) {
          setQuery("");
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, isClosing]);

  // All guides
  const articles: NewsArticle[] = useMemo(() => getNewsArticles(), []);

  // Filtered & Ranked Results Engine
  const { results, counts } = useMemo(() => {
    const rawQ = query.trim().toLowerCase();
    const tokens = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];

    // Return empty results if user has not entered a search term yet
    if (!tokens.length) {
      return {
        results: [],
        counts: { all: 0, tools: 0, models: 0, guides: 0, pages: 0 },
      };
    }

    // Expand search query with synonyms
    const expandedTokens = [...tokens];
    tokens.forEach((t) => {
      if (SYNONYMS[t]) {
        expandedTokens.push(...SYNONYMS[t]);
      }
    });

    // 1. Filter Tools
    const scoredTools: SearchResultItem[] = tools
      .map((tool) => {
        let score = 0;
        const nameLower = tool.name.toLowerCase();
        const blurbLower = tool.blurb.toLowerCase();
        const catLower = tool.category.toLowerCase();
        const tagLower = (tool.tag || "").toLowerCase();
        const keywordsLower = (tool.seo?.keywords || []).map((k) => k.toLowerCase());
        const acceptsLower = (tool.accepts || "").toLowerCase();
        const outputsLower = (tool.outputs || "").toLowerCase();

        // Exact name match
        if (nameLower === rawQ) score += 150;
        else if (nameLower.includes(rawQ)) score += 90;

        tokens.forEach((tok) => {
          if (nameLower.includes(tok)) score += 40;
          if (tagLower.includes(tok)) score += 30;
          if (catLower.includes(tok)) score += 20;
          if (keywordsLower.some((k) => k.includes(tok))) score += 25;
          if (blurbLower.includes(tok)) score += 15;
          if (acceptsLower.includes(tok) || outputsLower.includes(tok)) score += 15;
        });

        expandedTokens.forEach((tok) => {
          if (nameLower.includes(tok)) score += 15;
          if (keywordsLower.some((k) => k.includes(tok))) score += 10;
        });

        return { item: tool, type: "tool" as const, score };
      })
      .filter((entry) => entry.score > 0);

    // 2. Filter Models
    const scoredModels: SearchResultItem[] = bgModels
      .map((model) => {
        if (!tokens.length) return { item: model, type: "model" as const, score: 2 };

        let score = 0;
        const nameLower = model.name.toLowerCase();
        const specialtyLower = model.specialty.toLowerCase();
        const blurbLower = model.blurb.toLowerCase();
        const traitsLower = model.traits.map((t) => t.toLowerCase()).join(" ");

        if (nameLower === rawQ) score += 160;
        else if (nameLower.includes(rawQ)) score += 95;

        tokens.forEach((tok) => {
          if (nameLower.includes(tok)) score += 45;
          if (specialtyLower.includes(tok)) score += 35;
          if (traitsLower.includes(tok)) score += 25;
          if (blurbLower.includes(tok)) score += 15;
        });

        expandedTokens.forEach((tok) => {
          if (specialtyLower.includes(tok) || blurbLower.includes(tok)) score += 15;
        });

        return { item: model, type: "model" as const, score };
      })
      .filter((entry) => entry.score > 0);

    // 3. Filter News & Guides
    const scoredGuides: SearchResultItem[] = articles
      .map((article) => {
        if (!tokens.length) return { item: article, type: "guide" as const, score: 1 };

        let score = 0;
        const titleLower = article.title.toLowerCase();
        const descLower = article.description.toLowerCase();
        const toolNameLower = article.toolName.toLowerCase();
        const categoryLower = article.category.toLowerCase();

        if (titleLower.includes(rawQ)) score += 80;
        if (toolNameLower.includes(rawQ)) score += 70;

        tokens.forEach((tok) => {
          if (titleLower.includes(tok)) score += 30;
          if (toolNameLower.includes(tok)) score += 25;
          if (categoryLower.includes(tok)) score += 15;
          if (descLower.includes(tok)) score += 10;
        });

        return { item: article, type: "guide" as const, score };
      })
      .filter((entry) => entry.score > 0);

    // 4. Filter Pages
    const scoredPages: SearchResultItem[] = STATIC_PAGES.map((page) => {
      if (!tokens.length) return { item: page, type: "page" as const, score: 2 };

      let score = 0;
      const titleLower = page.title.toLowerCase();
      const descLower = page.description.toLowerCase();
      const keywordsLower = page.keywords.join(" ").toLowerCase();

      if (titleLower.includes(rawQ)) score += 85;

      tokens.forEach((tok) => {
        if (titleLower.includes(tok)) score += 35;
        if (keywordsLower.includes(tok)) score += 30;
        if (descLower.includes(tok)) score += 15;
      });

      return { item: page, type: "page" as const, score };
    }).filter((entry) => entry.score > 0);

    // Counts by category
    const counts = {
      all: scoredTools.length + scoredModels.length + scoredGuides.length + scoredPages.length,
      tools: scoredTools.length,
      models: scoredModels.length,
      guides: scoredGuides.length,
      pages: scoredPages.length,
    };

    // Filter by selected tab
    let combined: SearchResultItem[] = [];
    if (activeCategory === "all") {
      combined = [...scoredTools, ...scoredModels, ...scoredGuides, ...scoredPages];
    } else if (activeCategory === "tools") {
      combined = scoredTools;
    } else if (activeCategory === "models") {
      combined = scoredModels;
    } else if (activeCategory === "guides") {
      combined = scoredGuides;
    } else if (activeCategory === "pages") {
      combined = scoredPages;
    }

    // Sort descending by score
    combined.sort((a, b) => b.score - a.score);

    return { results: combined, counts };
  }, [query, activeCategory, articles]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent/20">
      <div>
        <SiteHeader />

        <main
          className={`w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12 transition-all duration-300 ${
            isClosing ? "animate-search-lazy-collapse" : "animate-search-lazy-expand"
          }`}
        >
          {/* Top Breadcrumb & Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <nav className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-2xs">
              <Link to="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="text-foreground">Global Search</span>
            </nav>

            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>130+ Tools &amp; Models Indexed</span>
            </div>
          </div>

          {/* Hero Banner with Clean Neutral Mobile & Subtle Ambient Glow on Desktop */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-background p-5 sm:p-10 md:p-14 shadow-lg sm:shadow-xl">
            {/* Ambient Background Glows - Hidden on mobile to prevent red wash */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl hidden sm:block" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl hidden sm:block" />

            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3 sm:space-y-4">
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
                Search Anything on bg.tools<span className="text-accent">.</span>
              </h1>

              <p className="text-xs sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                Real-time search across all 130+ creative AI tools, specialized neural models, developer API endpoints, and step-by-step guides.
              </p>

              {/* Large Interactive Animated Search Input */}
              <div className="mt-6 sm:mt-8 relative group max-w-2xl mx-auto">
                <div className="relative flex items-center rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:border-border focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/5 dark:focus-within:border-accent/40 dark:focus-within:ring-accent/10 shadow-md sm:shadow-lg transition-all duration-200">
                  <div className="pl-3.5 sm:pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors shrink-0">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <div className="relative flex-1 flex items-center min-w-0">
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={query ? "" : animatedPlaceholder}
                      className="w-full bg-transparent px-3 sm:px-4 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg font-bold text-foreground placeholder:text-muted-foreground/75 placeholder:font-semibold focus:outline-none"
                      aria-label="Search tools, models, guides"
                    />
                  </div>

                  {/* Clear Button & Shortcuts */}
                  <div className="pr-3.5 sm:pr-4 flex items-center gap-2 shrink-0 relative z-20">
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Clear search query"
                        aria-label="Clear query"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2 py-1 text-[11px] font-mono font-semibold text-muted-foreground shadow-2xs">
                      ESC
                    </kbd>
                  </div>
                </div>

                {/* Popular Search Suggestions Chips */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
                  <span className="font-bold text-muted-foreground mr-1 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Popular:</span>
                  </span>
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className={`rounded-full px-3 py-1 font-semibold transition-all cursor-pointer border ${
                        query.toLowerCase() === item.toLowerCase()
                          ? "bg-accent text-white border-accent shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80 shadow-2xs"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {query.trim().length > 0 ? (
            <>
              {/* Category Filter Tabs with Dynamic Counts */}
              <div className="mt-8 sm:mt-12 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/70 animate-in fade-in duration-200">
                {[
                  { id: "all", label: "All Results", count: counts.all, icon: Layers },
                  { id: "tools", label: "Creative AI Tools", count: counts.tools, icon: Wand2 },
                  { id: "models", label: "Neural Models", count: counts.models, icon: Cpu },
                  { id: "guides", label: "Guides & Tutorials", count: counts.guides, icon: BookOpen },
                  { id: "pages", label: "Pages & Features", count: counts.pages, icon: Compass },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                        isActive
                          ? "bg-foreground text-background border-foreground shadow-md scale-[1.02]"
                          : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border/70 shadow-2xs"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-black ${
                          isActive ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Results Header Status */}
              <div className="mt-6 sm:mt-8 flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground">
                <p>
                  Found <span className="font-bold text-foreground">{results.length}</span> results for{" "}
                  <span className="font-bold text-accent">"{query}"</span>
                </p>

                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-accent hover:underline font-bold cursor-pointer"
                >
                  Reset Search
                </button>
              </div>

              {/* Empty State when no results found */}
              {results.length === 0 && (
                <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center max-w-lg mx-auto space-y-4 animate-in fade-in duration-300">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto text-muted-foreground">
                    <Search className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">No matches found for "{query}"</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    Try searching for broader keywords like <strong>"background"</strong>, <strong>"blur"</strong>, <strong>"pdf"</strong>, <strong>"pricing"</strong>, or browse all tools directly.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background shadow-xs hover:scale-105 transition-all cursor-pointer"
                    >
                      Clear Search
                    </button>
                    <Link
                      to="/tools"
                      className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
                    >
                      Browse Tools Directory →
                    </Link>
                  </div>
                </div>
              )}

              {/* Results Grid with Smooth Card Entrance */}
              {results.length > 0 && (
                <div className="mt-6 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {results.map((res) => {
                    // 1. Tool Result Card
                    if (res.type === "tool") {
                      const tool = res.item as Tool;
                      const Icon = tool.icon || Wand2;
                      const targetHref = tool.slug === "background-remover" ? "/" : `/tools/${tool.slug}`;

                      return (
                        <div
                          key={`tool-${tool.slug}`}
                          className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div>
                            {/* Top Meta Header */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                                <Wand2 className="h-3 w-3" />
                                {tool.category}
                              </span>
                              {tool.tag && (
                                <span className="rounded-md bg-secondary border border-border/80 px-2 py-0.5 text-[9px] font-mono font-bold text-muted-foreground uppercase">
                                  {tool.tag}
                                </span>
                              )}
                            </div>

                            {/* Title & Icon */}
                            <div className="mt-4 flex items-start gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted border border-border/80 text-foreground group-hover:bg-accent group-hover:text-white transition-colors duration-300 shadow-2xs">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                                  <HighlightText text={tool.name} query={query} />
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                  <HighlightText text={tool.blurb} query={query} />
                                </p>
                              </div>
                            </div>

                            {/* Formats or Accepted Inputs */}
                            {(tool.accepts || tool.outputs) && (
                              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-semibold text-muted-foreground">
                                {tool.accepts && (
                                  <span className="rounded bg-muted/70 px-1.5 py-0.5">
                                    In: {tool.accepts.split(",").slice(0, 3).join(", ")}
                                  </span>
                                )}
                                {tool.outputs && (
                                  <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5">
                                    Out: {tool.outputs.split(",").slice(0, 2).join(", ")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-2">
                            <Link
                              to={targetHref as any}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-bold text-background shadow-xs hover:bg-accent hover:text-white transition-all cursor-pointer"
                            >
                              <span>Launch Tool</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              to={`/news/${tool.slug}` as any}
                              title="Read detailed tutorial & guide"
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors shrink-0"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    // 2. Model Result Card
                    if (res.type === "model") {
                      const model = res.item as BgModel;
                      const Icon = model.icon || Cpu;

                      return (
                        <div
                          key={`model-${model.id}`}
                          className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-red-500/40 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div>
                            {/* Top Meta Header */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                <Cpu className="h-3 w-3" />
                                Neural Model
                              </span>
                              <span className="rounded-md bg-secondary border border-border/80 px-2 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                                {model.quality}
                              </span>
                            </div>

                            {/* Title & Icon */}
                            <div className="mt-4 flex items-start gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-red-500 transition-colors">
                                  <HighlightText text={model.name} query={query} />
                                </h3>
                                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                                  {model.specialty}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                  <HighlightText text={model.blurb} query={query} />
                                </p>
                              </div>
                            </div>

                            {/* Model Traits */}
                            <div className="mt-4 space-y-1 text-[11px] text-muted-foreground">
                              {model.traits.slice(0, 2).map((tr, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 truncate">
                                  <CheckCircle2 className="h-3 w-3 text-red-500 shrink-0" />
                                  <span className="truncate">{tr}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3.5 border-t border-border/60">
                            <Link
                              to="/models"
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-600 hover:text-white px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 transition-all cursor-pointer"
                            >
                              <span>Explore Model Specs</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    // 3. Guide Result Card
                    if (res.type === "guide") {
                      const article = res.item as NewsArticle;

                      return (
                        <div
                          key={`guide-${article.slug}`}
                          className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div>
                            {/* Top Meta Header */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                <BookOpen className="h-3 w-3" />
                                Guide &amp; Tutorial
                              </span>
                              <span className="rounded-md bg-secondary border border-border/80 px-2 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                                {article.readingMinutes} min read
                              </span>
                            </div>

                            {/* Title & Icon */}
                            <div className="mt-4 flex items-start gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                                  <HighlightText text={article.title} query={query} />
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                  <HighlightText text={article.description} query={query} />
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Tool: {article.toolName}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3.5 border-t border-border/60">
                            <Link
                              to={`/news/${article.slug}` as any}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                            >
                              <span>Read Full Guide</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    // 4. Site Page Result Card
                    if (res.type === "page") {
                      const page = res.item as SitePageItem;

                      return (
                        <div
                          key={`page-${page.id}`}
                          className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div>
                            {/* Top Meta Header */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                <Compass className="h-3 w-3" />
                                {page.category}
                              </span>
                              {page.badge && (
                                <span className="rounded-md bg-secondary border border-border/80 px-2 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                                  {page.badge}
                                </span>
                              )}
                            </div>

                            {/* Title & Icon */}
                            <div className="mt-4 flex items-start gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                                <Compass className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  <HighlightText text={page.title} query={query} />
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                  <HighlightText text={page.description} query={query} />
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3.5 border-t border-border/60">
                            <Link
                              to={page.to as any}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-600 hover:text-white px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 transition-all cursor-pointer"
                            >
                              <span>Visit Page</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </>
          ) : (
            /* Clean Initial State (Without search - full width proper aligned) */
            <div className="mt-10 sm:mt-14 space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-4">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                    Explore by Category &amp; Quick Actions
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                    Click any curated category below or type in the search bar above to start searching
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  130+ Tools &amp; 5 Neural Models
                </span>
              </div>

              {/* 6 Curated Category Tiles spanning full container width */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {[
                  { label: "Background Removal", tag: "AI Matting", q: "background remover", icon: Wand2, count: "Core AI" },
                  { label: "Face & Privacy Blur", tag: "Security", q: "face blur", icon: Zap, count: "Privacy" },
                  { label: "Watermark Eraser", tag: "Cleaner", q: "watermark remover", icon: Sparkles, count: "Eraser" },
                  { label: "Image Compressor", tag: "Optimization", q: "compress image", icon: Layers, count: "Lossless" },
                  { label: "PDF & Documents", tag: "Converters", q: "pdf", icon: BookOpen, count: "Tools" },
                  { label: "Developer REST API", tag: "Integration", q: "developer api", icon: Cpu, count: "REST API" },
                ].map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={tile.label}
                      type="button"
                      onClick={() => {
                        setQuery(tile.q);
                        inputRef.current?.focus();
                      }}
                      className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:bg-muted/70 hover:border-accent/40 transition-all cursor-pointer shadow-xs hover:-translate-y-1 hover:shadow-md text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors shadow-2xs">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{tile.count}</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug">
                          {tile.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                          <span>Search "{tile.q}"</span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Neural Models Row */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-red-500" />
                    <span>Proprietary Neural Model Engines</span>
                  </h3>
                  <Link to="/models" className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1">
                    <span>View Specifications</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {bgModels.map((model) => {
                    const Icon = model.icon || Cpu;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setQuery(model.name);
                          inputRef.current?.focus();
                        }}
                        className="group flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/70 hover:border-red-500/40 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 text-left"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{model.quality.split(" ")[0]}</span>
                          </div>
                          <h4 className="font-display text-sm font-bold text-foreground group-hover:text-red-500 transition-colors mt-3">
                            {model.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-2">
                            {model.specialty}
                          </p>
                        </div>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 mt-3">
                          <span>Search model</span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
