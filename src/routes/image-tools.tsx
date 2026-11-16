import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { tools, type Tool } from "@/lib/tools";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminStore } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import {
  Wand2,
  Sparkles,
  Search,
  X,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Crop,
  RotateCw,
  Stamp,
  ScanText,
  Pipette,
  SmilePlus,
  Eye,
  Sliders,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildPageMeta, buildBreadcrumbsSchema, buildFaqSchema, SITE_URL } from "@/lib/seo";
import { useTypewriterPlaceholder } from "@/hooks/use-typewriter";

const TYPEWRITER_IMAGE_SEARCH_PROMPTS = [
  'Search "Background Remover"...',
  'Search "Compress JPG & PNG"...',
  'Search "Photo Upscaler 4K"...',
  'Search "Face & Privacy Blur"...',
  'Search "Watermark Eraser"...',
  'Search "Crop & Resize Image"...',
  'Search "Convert WebP to PNG"...',
  'Search "AI Neural Matting"...',
  'Search "Passport Photo Studio"...',
  'Search "SVG Vector Converter"...',
  'Search 33+ image tools (background, compress, resize)...',
];

const IMAGE_SUBCATEGORIES = [
  "All Image Tools",
  "AI Neural & Matting",
  "Editing & Optimization",
  "Format Converters",
  "Creative & Utilities",
] as const;

type ImageSubcategory = (typeof IMAGE_SUBCATEGORIES)[number];

const imageFaqs = [
  {
    q: "How does the AI Background Remover work on images?",
    a: "Our background remover uses the proprietary Ganga AI Neural Segmentation Engine with sub-pixel alpha matting. It detects intricate subject boundaries, isolates hair strands and transparent fabrics, and outputs a transparent 4K PNG in about a second.",
  },
  {
    q: "Is there any quality loss when compressing images?",
    a: "No! Our compression tools utilize intelligent perceptual quantization that removes invisible redundant image data while keeping 100% of the visual sharpness and Display P3 / sRGB color profiles intact.",
  },
  {
    q: "Are my photos uploaded to any external servers?",
    a: "Privacy is our core architectural guarantee. Client-side tools process photos directly inside your browser using WebAssembly. For neural model tasks, images are processed in volatile memory and instantly erased without permanent logging or training retention.",
  },
  {
    q: "Can I convert images to WebP, AVIF, and JPG in batch?",
    a: "Yes! Our format converters allow you to convert single or multiple files instantly between PNG, JPG, WebP, AVIF, SVG, Base64, and binary formats with customizable quality levels.",
  },
  {
    q: "Is there a resolution or file size limit?",
    a: "We support high-resolution photos up to 36 megapixels (4K, 8K) and large RAW/PNG uploads with hardware-accelerated processing.",
  },
];

export const Route = createFileRoute("/image-tools")({
  head: () => {
    const breadcrumbsSchema = buildBreadcrumbsSchema([
      { name: "Home", path: "/" },
      { name: "Image Tools", path: "/image-tools" },
    ]);
    const faqSchema = buildFaqSchema(imageFaqs);

    const seo = buildPageMeta({
      title: "AI Image Tools & Creative Photo Studio (40+ Tools) | bg.tools",
      description:
        "Dedicated creative suite for AI background removal, precision cutout brush, lossless image compression, 4K upscaling, resizing, and format conversions.",
      path: "/image-tools",
      keywords: [
        "image tools",
        "ai photo editor",
        "background remover online",
        "compress image lossless",
        "resize photo 4k",
        "cutout brush editor",
        "photo watermark remover",
        "face blur privacy",
      ],
      jsonLd: [breadcrumbsSchema, ...(faqSchema ? [faqSchema] : [])],
    });

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: ImageToolsPage,
});

function ImageToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ImageSubcategory>("All Image Tools");
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const animatedPlaceholder = useTypewriterPlaceholder(
    TYPEWRITER_IMAGE_SEARCH_PROMPTS,
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

  // Filter tools specifically belonging to the Image domain
  const imageToolsList = useMemo(() => {
    return tools.filter((tool) => {
      if (!AdminStore.isToolEnabled(tool.slug)) return false;

      // Classify as Image Tool
      const isImageCat =
        tool.category === "AI Tools" ||
        tool.category === "Image Editing & Optimization" ||
        (tool.category === "Format Converters" && !tool.slug.includes("pdf")) ||
        (tool.category === "Creative & Utilities" && (tool.slug.includes("image") || tool.slug.includes("meme") || tool.slug.includes("color"))) ||
        (tool.category === "Document Converters" && tool.outputs.toLowerCase().includes("png"));

      // Exclude pure PDF documents
      const isPdfOnly =
        tool.category === "PDF Tools" ||
        (tool.slug.startsWith("pdf-") && !tool.slug.includes("image") && !tool.slug.includes("png"));

      return isImageCat && !isPdfOnly;
    });
  }, []);

  // Map subcategory filters
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return imageToolsList.filter((tool) => {
      // Subcategory check
      if (activeTab === "AI Neural & Matting") {
        const isAi =
          tool.category === "AI Tools" ||
          tool.slug.includes("background") ||
          tool.slug.includes("upscale") ||
          tool.slug.includes("blur") ||
          tool.slug.includes("watermark") ||
          tool.slug.includes("ocr");
        if (!isAi) return false;
      } else if (activeTab === "Editing & Optimization") {
        const isEditing =
          tool.category === "Image Editing & Optimization" ||
          tool.slug.includes("compress") ||
          tool.slug.includes("resize") ||
          tool.slug.includes("crop") ||
          tool.slug.includes("rotate") ||
          tool.slug.includes("editor") ||
          tool.slug.includes("square");
        if (!isEditing) return false;
      } else if (activeTab === "Format Converters") {
        const isConv =
          tool.category === "Format Converters" ||
          tool.slug.includes("convert") ||
          tool.slug.includes("base64") ||
          tool.slug.includes("binary") ||
          tool.slug.includes("hex") ||
          tool.slug.includes("ascii");
        if (!isConv) return false;
      } else if (activeTab === "Creative & Utilities") {
        const isCreative =
          tool.category === "Creative & Utilities" ||
          tool.slug.includes("meme") ||
          tool.slug.includes("color") ||
          tool.slug.includes("ocr");
        if (!isCreative) return false;
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
  }, [imageToolsList, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/20">
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
            <span className="text-foreground">Image Tools</span>
          </nav>
        </div>

        {/* Hero Section with Ambient Glow & Animated Gradients */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-background p-6 sm:p-10 md:p-14 shadow-xl mb-10">
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent shadow-xs">
              <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
              <span>Dedicated Image &amp; Photo Studio</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              AI Image Tools &amp; Photo Studio<span className="text-accent font-bold">.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              Precision background removal, sub-pixel cutout matting, lossless 4K compression, photo editing, and high-speed conversions — 100% private in your browser.
            </p>

            {/* Quick Highlights Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>4K Ultra-HD Output</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Zero Tracking &amp; Privacy First</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Sub-Second AI Inference</span>
              </span>
            </div>

            {/* Live Search Input with Interactive Glow & Typewriter Animation */}
            <div className="pt-4 max-w-xl mx-auto">
              <div className="relative flex items-center rounded-2xl border border-border/80 bg-card hover:border-accent/40 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-md transition-all">
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
                  aria-label="Search image tools"
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
            {IMAGE_SUBCATEGORIES.map((tab) => (
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
            Showing <strong className="text-foreground">{filteredTools.length}</strong> image tools
          </div>
        </div>

        {/* Featured Image Tools Spotlight Carousel Cards */}
        {activeTab === "All Image Tools" && !searchQuery && (
          <div className="mb-12 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <Flame className="h-4 w-4 text-accent fill-accent/20" />
              <span>Flagship Image Tools Spotlight</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: AI Background Remover */}
              <Link
                to="/tools/$slug"
                params={{ slug: "remove-background" }}
                className="group relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-card to-accent/5 p-6 shadow-md hover:shadow-xl hover:border-accent/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-md group-hover:scale-110 transition-transform">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                    Core AI
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  AI Background Remover
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Isolate portraits, products, and graphics with sub-pixel alpha matting and 4K transparent PNG export.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Card 2: Compress Image */}
              <Link
                to="/tools/$slug"
                params={{ slug: "compress-image" }}
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md hover:shadow-xl hover:border-accent/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:scale-110 transition-transform">
                    <Minimize2 className="h-5 w-5 text-accent" />
                  </div>
                  <span className="rounded-full bg-secondary border border-border/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                    Up to 90%
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  Lossless Image Compressor
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Shrink PNG, JPG, and WebP files drastically without losing sharp edges, contrast, or color fidelity.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Card 3: Blur Face */}
              <Link
                to="/tools/$slug"
                params={{ slug: "blur-face" }}
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md hover:shadow-xl hover:border-accent/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:scale-110 transition-transform">
                    <Eye className="h-5 w-5 text-accent" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                    Privacy AI
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  Face &amp; Privacy Blur
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Automatically detect faces and license plates with AI neural detection and blur or pixelate them instantly.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent">
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
            <h3 className="font-display text-lg font-bold">No matching image tools found</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Try adjusting your query or resetting the category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("All Image Tools");
              }}
              className="mt-4 rounded-full bg-foreground px-5 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon || Wand2;
              return (
                <Link
                  key={tool.slug}
                  to="/tools/$slug"
                  params={{ slug: tool.slug }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-xs hover:border-accent/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {tool.tag && (
                        <span className="rounded-full bg-secondary border border-border/60 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                          {tool.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tool.blurb || tool.seo?.description || "High-precision image processing tool."}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground/80">
                      {tool.outputs ? `→ ${tool.outputs}` : tool.category}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-foreground group-hover:text-accent transition-colors">
                      <span>Launch</span>
                      <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* FAQ Accordion Section */}
        <section className="mt-20 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              Frequently Asked Questions<span className="text-accent">.</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about processing images on bg.tools.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2.5">
            {imageFaqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="rounded-2xl border border-border bg-card px-4 py-1 shadow-2xs"
              >
                <AccordionTrigger className="text-sm font-bold text-foreground hover:text-accent text-left">
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
