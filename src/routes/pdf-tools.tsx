import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { tools, type Tool } from "@/lib/tools";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminStore } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import {
  FileText,
  Search,
  X,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Merge,
  SplitSquareVertical,
  RotateCw,
  FileDown,
  FileOutput,
  ScanText,
  Stamp,
  ArrowUpRight,
  Sparkles,
  Flame,
  FileCheck2,
  KeyRound,
  FilePlus2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildPageMeta, buildBreadcrumbsSchema, buildFaqSchema, SITE_URL } from "@/lib/seo";
import { useTypewriterPlaceholder } from "@/hooks/use-typewriter";

const TYPEWRITER_PDF_SEARCH_PROMPTS = [
  'Search "Merge PDF documents"...',
  'Search "Compress PDF without losing quality"...',
  'Search "Convert PDF to Word DOCX"...',
  'Search "Split & Extract Pages"...',
  'Search "Unlock & Remove Password"...',
  'Search "Protect PDF with Encryption"...',
  'Search "Sign & Watermark PDF"...',
  'Search "OCR Extract Text from PDF"...',
  'Search "Convert JPG to PDF"...',
  'Search "Organize & Rotate Pages"...',
  'Search 94+ PDF tools (merge, split, word, compress)...',
];

const PDF_SUBCATEGORIES = [
  "All PDF Tools",
  "Organize & Pages",
  "Convert From PDF",
  "Convert To PDF",
  "Security & Watermark",
  "Optimize & OCR",
] as const;

type PdfSubcategory = (typeof PDF_SUBCATEGORIES)[number];

const pdfFaqs = [
  {
    q: "Are my sensitive PDF documents uploaded to external servers?",
    a: "No! All PDF conversions, merges, compression, and OCR extraction are executed client-side directly within your browser sandbox using WebAssembly. Your confidential documents, contracts, and bank statements never leave your computer.",
  },
  {
    q: "How many pages can I merge or split at once?",
    a: "Our PDF engine handles documents with hundreds of pages and batch processing without artificial caps or watermarks.",
  },
  {
    q: "How does PDF OCR text extraction work?",
    a: "Our neural OCR engine recognizes text in scanned PDFs and document photos across 100+ languages, preserving paragraphs, formatting, and character accuracy.",
  },
  {
    q: "Can I protect or unlock password-encrypted PDFs?",
    a: "Yes! You can encrypt PDFs with 128-bit/256-bit AES encryption to prevent unauthorized printing or copying, as well as decrypt PDFs if you possess the authorization password.",
  },
  {
    q: "Does bg.tools add watermarks to output PDFs?",
    a: "Never. All exported PDFs are 100% clean, professional, and free of any watermarks or third-party branding.",
  },
];

export const Route = createFileRoute("/pdf-tools")({
  head: () => {
    const breadcrumbsSchema = buildBreadcrumbsSchema([
      { name: "Home", path: "/" },
      { name: "PDF Tools Space", path: "/pdf-tools" },
    ]);
    const faqSchema = buildFaqSchema(pdfFaqs);

    const seo = buildPageMeta({
      title: "PDF Tools Space (94+ Free Online PDF Utilities) | bg.tools",
      description:
        "Complete PDF Tools Space: merge, split, compress, convert, sign, protect, unlock, and OCR extract text from PDFs online with 100% client privacy.",
      path: "/pdf-tools",
      keywords: [
        "pdf tools",
        "pdf tools space",
        "merge pdf free",
        "compress pdf online",
        "split pdf pages",
        "pdf to word converter",
        "pdf to excel table",
        "pdf ocr text",
        "unlock pdf password",
        "protect pdf aes",
      ],
      jsonLd: [breadcrumbsSchema, ...(faqSchema ? [faqSchema] : [])],
    });

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: PdfToolsPage,
});

function PdfToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PdfSubcategory>("All PDF Tools");
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const animatedPlaceholder = useTypewriterPlaceholder(
    TYPEWRITER_PDF_SEARCH_PROMPTS,
    isFocused
  );

  // Keyboard shortcut: Escape clears query or blurs search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
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
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filter tools specifically belonging to the PDF domain
  const pdfToolsList = useMemo(() => {
    return tools.filter((tool) => {
      if (!AdminStore.isToolEnabled(tool.slug)) return false;

      return (
        tool.category === "PDF Tools" ||
        tool.slug.includes("pdf") ||
        tool.accepts.toLowerCase().includes("pdf") ||
        tool.outputs.toLowerCase().includes("pdf")
      );
    });
  }, []);

  // Map subcategory filters
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pdfToolsList.filter((tool) => {
      // Subcategory check
      if (activeTab === "Organize & Pages") {
        const isOrganize =
          tool.slug.includes("merge") ||
          tool.slug.includes("split") ||
          tool.slug.includes("rotate") ||
          tool.slug.includes("extract") ||
          tool.slug.includes("remove-pages") ||
          tool.slug.includes("reorder") ||
          tool.slug.includes("delete");
        if (!isOrganize) return false;
      } else if (activeTab === "Convert From PDF") {
        const isFrom =
          tool.slug.startsWith("pdf-to-") ||
          tool.slug.includes("extract-text") ||
          tool.name.toLowerCase().startsWith("pdf to");
        if (!isFrom) return false;
      } else if (activeTab === "Convert To PDF") {
        const isTo =
          tool.slug.includes("-to-pdf") ||
          tool.name.toLowerCase().includes("to pdf") ||
          tool.slug.includes("create-pdf");
        if (!isTo) return false;
      } else if (activeTab === "Security & Watermark") {
        const isSec =
          tool.slug.includes("protect") ||
          tool.slug.includes("unlock") ||
          tool.slug.includes("lock") ||
          tool.slug.includes("watermark") ||
          tool.slug.includes("sign") ||
          tool.slug.includes("redact");
        if (!isSec) return false;
      } else if (activeTab === "Optimize & OCR") {
        const isOpt =
          tool.slug.includes("compress") ||
          tool.slug.includes("ocr") ||
          tool.slug.includes("flatten") ||
          tool.slug.includes("repair");
        if (!isOpt) return false;
      }

      // Search query check
      if (!q) return true;
      const matchName = tool.name.toLowerCase().includes(q);
      const matchBlurb = tool.blurb.toLowerCase().includes(q);
      const matchTag = tool.tag?.toLowerCase().includes(q);
      const matchAccepts = tool.accepts.toLowerCase().includes(q);
      const matchOutputs = tool.outputs.toLowerCase().includes(q);

      return matchName || matchBlurb || matchTag || matchAccepts || matchOutputs;
    });
  }, [pdfToolsList, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20">
      <SiteHeader />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12">
        {/* Top Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <nav className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-2xs">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <Link to="/tools" className="hover:underline">
              Tools
            </Link>
            <span>/</span>
            <span className="text-foreground">PDF Tools Space</span>
          </nav>
        </div>

        {/* Hero Section with Ambient Glow & Animated Gradients */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-background p-6 sm:p-10 md:p-14 shadow-xl mb-10">
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-xs">
              <FileText className="h-3.5 w-3.5 animate-pulse" />
              <span>PDF Tools Space • Complete Document Processing Suite</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              PDF Tools Space<span className="text-emerald-500 font-bold">.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              Fast, private document workspace with 94+ tools to merge, split, compress, convert, protect, unlock, and extract text from PDFs directly in your browser.
            </p>

            {/* Quick Highlights Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>100% Client-Side Sandbox</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-500" />
                <span>No Watermarks &amp; No Page Limits</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Instant High-Speed Exports</span>
              </span>
            </div>

            {/* Live Search Input with Interactive Glow & Typewriter Animation */}
            <div className="pt-4 max-w-xl mx-auto">
              <div className="relative flex items-center rounded-2xl border border-border/80 bg-card hover:border-emerald-500/40 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-md transition-all">
                <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={searchQuery ? "" : animatedPlaceholder}
                  className="w-full bg-transparent px-3 py-3.5 text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  aria-label="Search PDF tools"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      inputRef.current?.focus();
                    }}
                    className="mr-3 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Clear search (Esc)"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subcategory Pills */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {PDF_SUBCATEGORIES.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-foreground text-background shadow-md scale-105"
                    : "border border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-muted-foreground shrink-0">
            Showing <strong className="text-foreground">{filteredTools.length}</strong> PDF tools
          </div>
        </div>

        {/* Featured PDF Tools Spotlight Cards */}
        {activeTab === "All PDF Tools" && !searchQuery && (
          <div className="mb-12 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Flame className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
              <span>Essential PDF Utilities Spotlight</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Merge PDF */}
              <Link
                to="/tools/$slug"
                params={{ slug: "merge-pdf" }}
                className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-card to-emerald-500/5 p-6 shadow-md hover:shadow-xl hover:border-emerald-500/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md group-hover:scale-110 transition-transform">
                    <Merge className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Most Popular
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                  Merge PDF Documents
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Combine multiple PDFs into a single organized document in any order with intuitive drag-and-drop.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Card 2: Split PDF */}
              <Link
                to="/tools/$slug"
                params={{ slug: "split-pdf" }}
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:scale-110 transition-transform">
                    <SplitSquareVertical className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="rounded-full bg-secondary border border-border/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                    Instant
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                  Split PDF Pages
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Extract specific page ranges, separate even and odd pages, or burst an entire PDF into single pages.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-emerald-500">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Card 3: Protect PDF */}
              <Link
                to="/tools/$slug"
                params={{ slug: "protect-pdf" }}
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:scale-110 transition-transform">
                    <Lock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                    AES-256
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                  Protect PDF Password
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Encrypt PDF files with strong passwords and configure permissions for printing, copying, and edits.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-emerald-500">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">No matching PDF tools found</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Try adjusting your query or resetting the category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("All PDF Tools");
              }}
              className="mt-4 rounded-full bg-foreground px-5 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon || FileText;
              return (
                <Link
                  key={tool.slug}
                  to="/tools/$slug"
                  params={{ slug: tool.slug }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {tool.tag && (
                        <span className="rounded-full bg-secondary border border-border/60 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                          {tool.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tool.blurb || tool.seo?.description || "High-performance PDF utility."}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground/80">
                      {tool.outputs ? `→ ${tool.outputs}` : tool.category}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                      <span>Launch</span>
                      <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Security & Client-Side Privacy Guarantee Banner */}
        <section className="mt-16 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Zero-Storage Client Privacy Guarantee</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Your confidential documents never touch our servers.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Every operation from merging contracts to converting financial spreadsheets is executed 100% locally in your device's browser memory using native WebAssembly and client PDF engines.
            </p>
          </div>
          <Link
            to="/privacy"
            className="shrink-0 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Read Privacy Architecture →
          </Link>
        </section>

        {/* FAQ Accordion Section */}
        <section className="mt-20 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              Frequently Asked Questions<span className="text-emerald-500">.</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about processing PDFs in PDF Tools Space.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2.5">
            {pdfFaqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="rounded-2xl border border-border bg-card px-4 py-1 shadow-2xs"
              >
                <AccordionTrigger className="text-sm font-bold text-foreground hover:text-emerald-500 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
