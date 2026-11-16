import { useState } from "react";
import girlBefore from "@/assets/girl-before.jpg";
import girlAfter from "@/assets/girl-after.png";
import type { Tool } from "@/lib/tools";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sliders,
  Download,
  Upload,
  Eye,
  Layers,
  Lock,
  ScanText,
  Minimize2,
  Maximize2,
  Check,
  Wand2,
} from "lucide-react";

const softCheckerStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(120,120,130,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,120,130,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,120,130,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,120,130,0.12) 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
};

export function ToolVisualShowcase({ tool }: { tool: Tool }) {
  const [activeBackdrop, setActiveBackdrop] = useState<"transparent" | "orange" | "studio" | "gradient">("transparent");
  const [compareSlider, setCompareSlider] = useState<number>(52);

  const Icon = tool.icon;
  const slug = tool.slug;
  const category = tool.category;

  const isPdf = category === "PDF Tools" || slug.includes("pdf");
  const isOcrOrDoc =
    category === "Document Converters" ||
    slug.includes("ocr") ||
    slug.includes("word") ||
    slug.includes("excel") ||
    slug.includes("powerpoint");
  const isCompress = slug.includes("compress");
  const isResizeOrCrop =
    slug.includes("resize") || slug.includes("crop") || slug.includes("square") || slug.includes("rotate");
  const isCodeEncoding =
    slug.includes("base64") ||
    slug.includes("binary") ||
    slug.includes("hex") ||
    slug.includes("octal") ||
    slug.includes("decimal") ||
    slug.includes("ascii");

  const scrollToWorkspace = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const backdropStyles: Record<typeof activeBackdrop, React.CSSProperties> = {
    transparent: { ...softCheckerStyle, backgroundColor: "#ffffff" },
    orange: { background: "linear-gradient(135deg, #ff5500 0%, #ff8800 100%)" },
    studio: { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" },
    gradient: { background: "linear-gradient(135deg, #fce7f3 0%, #e0e7ff 50%, #fae8ff 100%)" },
  };

  // Determine the 4 real-world use cases based on tool type (inspired by remove.bg/g/individuals)
  const useCaseCards = isPdf
    ? [
        {
          tag: "Contracts & Agreements",
          title: "Edit & Sign Business PDFs",
          desc: "Update clauses, dates, and company details with matching fonts or place legally binding signatures in seconds.",
          img: "/profile-avatars/Boy1.jpg",
          badge: "Font-Matched Text",
          accent: "from-[#ff5500]/20 to-amber-500/10",
        },
        {
          tag: "Invoices & Receipts",
          title: "Tax & Billing Workflows",
          desc: "Merge monthly statements, update billing addresses in-place, or compress multi-page PDFs for instant email delivery.",
          img: "/profile-avatars/Girl1.jpg",
          badge: "Zero Layout Shift",
          accent: "from-emerald-500/20 to-teal-500/10",
        },
        {
          tag: "Academic & Forms",
          title: "Interactive Form Filling",
          desc: "Fill out application forms, insert checkmarks, shape ID photos into circles or hexagons, and export print-ready sheets.",
          img: "/profile-avatars/Boy3.jpg",
          badge: "In-Place Form Editor",
          accent: "from-blue-500/20 to-indigo-500/10",
        },
        {
          tag: "Confidential Archives",
          title: "Secure & Protected Sharing",
          desc: "Redact sensitive lines with whiteout blocks, add custom watermarks, or encrypt files before sharing externally.",
          img: "/profile-avatars/Girl2.jpg",
          badge: "Enterprise Privacy",
          accent: "from-purple-500/20 to-pink-500/10",
        },
      ]
    : [
        {
          tag: "Personal & Social Media",
          title: "Standout Profile & Creator Shots",
          desc: "Create studio-grade portraits, clean cutouts, and perfectly sized visuals for LinkedIn, Instagram, YouTube, and X.",
          img: girlAfter,
          badge: "4K Studio Quality",
          accent: "from-[#ff5500]/20 to-amber-500/10",
        },
        {
          tag: "E-Commerce & Catalogs",
          title: "Marketplace-Ready Visuals",
          desc: "Prepare crisp, fast-loading product photos with pure white or custom backdrops for Amazon, Shopify, and Flipkart.",
          img: "/profile-avatars/Girl1.jpg",
          badge: "Pure White & Alpha",
          accent: "from-emerald-500/20 to-teal-500/10",
        },
        {
          tag: "Web & App Performance",
          title: "Ultra-Fast Page Load Speeds",
          desc: "Optimize dimensions, convert formats, and shrink byte size by up to 85% without losing perceptual sharpness.",
          img: "/profile-avatars/Boy1.jpg",
          badge: "Core Web Vitals Ready",
          accent: "from-blue-500/20 to-indigo-500/10",
        },
        {
          tag: "Documents & ID Photos",
          title: "Passports, Resumes & Applications",
          desc: "Format portraits, signatures, and scanned documents to exact pixel and KB requirements for official portals.",
          img: "/profile-avatars/Boy3.jpg",
          badge: "Exact Spec Control",
          accent: "from-purple-500/20 to-pink-500/10",
        },
      ];

  return (
    <div className="space-y-20 mb-20">
      {/* ─── SECTION 1: 2-COLUMN SPLIT "ABOUT THIS TOOL" HERO + INTERACTIVE VISUAL SHOWCASE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left 6 Columns: Rich Editorial Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>About This Tool · Visual Showcase</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            What is the {tool.name} Tool<span className="text-accent">?</span>
          </h2>

          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
            {tool.seo.article.intro}
          </p>

          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            Designed for individuals, creators, and teams who want studio-grade output without complex desktop software,{" "}
            <strong className="text-foreground font-semibold">{tool.name}</strong> accepts{" "}
            <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded border border-border text-foreground">
              {tool.accepts}
            </span>{" "}
            and delivers{" "}
            <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded border border-border text-foreground">
              {tool.outputs}
            </span>{" "}
            directly in your browser with real-time visual feedback.
          </p>

          {/* 3 Highlight Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">Instant Engine</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Real-time browser &amp; AI pipeline</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">Lossless Detail</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Preserves crisp edges &amp; DPI</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">100% Private</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Security-focused safeguards</div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToWorkspace}
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground text-background hover:bg-foreground/90 px-6 py-3.5 text-xs sm:text-sm font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Try {tool.name} Now</span>
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              No installation required · Works on Desktop, Tablet &amp; Mobile
            </span>
          </div>
        </div>

        {/* Right 6 Columns: Interactive / Tailored Visual Showcase Stage */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl border-2 border-border bg-card p-4 sm:p-6 shadow-2xl overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-border/70">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-extrabold text-foreground truncate">
                  {tool.name} — Live Result Showcase
                </span>
              </div>
              <span className="rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-accent">
                {tool.accepts} → {tool.outputs}
              </span>
            </div>

            {/* Tailored Visual Scene by Tool Category / Slug */}
            {isPdf ? (
              /* PDF STUDIO INTERACTIVE VISUAL SCENE */
              <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 p-4 sm:p-5 text-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-[#ff5500] text-white font-extrabold text-[11px]">
                      Edit / Select
                    </span>
                    <span className="text-neutral-300 font-mono text-[11px]">Helvetica-Bold · 12pt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-neutral-200 text-[10px] font-bold">
                      Shape: Hexagon
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#ff5500] text-white text-[10px] font-black">
                      Save &amp; Export PDF
                    </span>
                  </div>
                </div>

                {/* Simulated Document Sheet */}
                <div className="bg-white text-[#0a0a0a] rounded-xl p-4 sm:p-5 shadow-xl space-y-3 relative">
                  <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 rounded bg-[#ff5500]/10 border border-[#ff5500] px-2 py-0.5 text-[11px] font-extrabold text-[#0a0a0a]">
                        <span>TAX INVOICE #INV-2026</span>
                        <span className="text-[9px] bg-[#ff5500] text-white px-1.5 rounded font-bold">
                          In-Place Edited
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 font-medium">
                        Seller: <strong className="text-[#0a0a0a]">BG.TOOLS CREATIVE STUDIO</strong>
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Font, size &amp; alignment automatically matched to original PDF
                      </p>
                    </div>

                    {/* Shaped Photo Preview */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative h-14 w-14">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <defs>
                            <clipPath id="showcase-hex-clip">
                              <polygon points="25,4 75,4 98,50 75,96 25,96 2,50" />
                            </clipPath>
                          </defs>
                          <image
                            href="/profile-avatars/Boy1.jpg"
                            width="100"
                            height="100"
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#showcase-hex-clip)"
                          />
                          <polygon
                            points="25,4 75,4 98,50 75,96 25,96 2,50"
                            fill="none"
                            stroke="#ff5500"
                            strokeWidth="4"
                          />
                        </svg>
                      </div>
                      <span className="text-[9px] font-bold text-[#ff5500] uppercase">Hexagon Photo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <span className="text-neutral-500 block text-[10px]">Document Status</span>
                      <span className="font-bold text-emerald-600">✓ Verified &amp; Signed</span>
                    </div>
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <span className="text-neutral-500 block text-[10px]">Vector Resolution</span>
                      <span className="font-bold text-[#0a0a0a]">300 DPI Lossless</span>
                    </div>
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <span className="text-neutral-500 block text-[10px]">Output Size</span>
                      <span className="font-bold text-[#ff5500]">Optimized PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isOcrOrDoc ? (
              /* OCR & DOCUMENT EXTRACTION VISUAL SCENE */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                <div className="relative rounded-2xl border border-border overflow-hidden bg-neutral-950 p-3 flex flex-col justify-between min-h-[260px]">
                  <span className="self-start rounded-full bg-white/10 text-white px-2.5 py-0.5 text-[10px] font-bold">
                    1. Scanned Image Input
                  </span>
                  <div className="my-auto space-y-2 p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-white/80 relative overflow-hidden">
                    <div className="flex justify-between text-[11px] text-amber-400 font-bold">
                      <span>INVOICE #4092</span>
                      <span>$1,240.00</span>
                    </div>
                    <div className="h-2 w-4/5 rounded bg-white/20" />
                    <div className="h-2 w-3/5 rounded bg-white/20" />
                    <div className="h-2 w-11/12 rounded bg-white/20" />
                    <div className="inset-x-0 top-1/2 h-0.5 bg-[#ff5500] shadow-[0_0_12px_#ff5500] absolute animate-pulse" />
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    AI Optical Character &amp; Layout Detection
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between min-h-[260px]">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                      2. Editable {tool.outputs}
                    </span>
                    <ScanText className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="my-auto rounded-xl bg-card border border-border p-3 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-border pb-1.5">
                      <span>Extracted Line Item</span>
                      <span className="text-emerald-600 font-mono">$1,240.00</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                      100% selectable text, preserved columns, and structured paragraphs ready for {tool.outputs}.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>✓ 99.4% Character Accuracy</span>
                    <span>Instant Export</span>
                  </div>
                </div>
              </div>
            ) : (
              /* INTERACTIVE BEFORE / AFTER & STUDIO BACKDROP SHOWCASE (like remove.bg/g/individuals) */
              <div className="space-y-4">
                <div
                  className="relative h-[320px] sm:h-[360px] w-full rounded-2xl overflow-hidden border border-border select-none"
                  style={backdropStyles[activeBackdrop]}
                >
                  {/* Processed After Layer */}
                  <img
                    src={girlAfter}
                    alt={`${tool.name} processed result`}
                    className="h-full w-full object-cover object-top pointer-events-none"
                    loading="lazy"
                  />

                  {/* Original Before Layer (Clipped by Slider) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{
                      clipPath: `polygon(0 0, ${compareSlider}% 0, ${compareSlider}% 100%, 0 100%)`,
                    }}
                  >
                    <img
                      src={girlBefore}
                      alt={`Original before ${tool.name}`}
                      className="h-full w-full object-cover object-top pointer-events-none"
                      loading="lazy"
                    />
                  </div>

                  {/* Vertical Divider Line */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
                    style={{ left: `${compareSlider}%` }}
                  >
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#0a0a0a] text-white border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black">
                      ↔
                    </div>
                  </div>

                  {/* Labels */}
                  <span className="absolute top-3 left-3 rounded-full bg-black/75 text-white backdrop-blur-md px-3 py-1 text-[11px] font-bold">
                    {isCompress ? "Original (4.2 MB)" : isResizeOrCrop ? "Original Frame" : "Original Input"}
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-[#ff5500] text-white shadow-md px-3 py-1 text-[11px] font-extrabold">
                    {isCompress
                      ? "Compressed (490 KB · -88%)"
                      : isResizeOrCrop
                        ? "Precision Framed Output"
                        : isCodeEncoding
                          ? `Encoded ${tool.outputs}`
                          : `Processed (${tool.outputs})`}
                  </span>
                </div>

                {/* Interactive Controls Under Preview */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                      Compare Split:
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={compareSlider}
                      onChange={(e) => setCompareSlider(Number(e.target.value))}
                      aria-label="Compare before and after"
                      className="w-full accent-[#ff5500] cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground mr-1">Backdrop:</span>
                    {(
                      [
                        { id: "transparent", label: "Grid" },
                        { id: "orange", label: "Brand" },
                        { id: "studio", label: "Dark" },
                        { id: "gradient", label: "Soft" },
                      ] as const
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveBackdrop(b.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          activeBackdrop === b.id
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: REAL-WORLD USE CASES VISUAL GALLERY (Inspired by remove.bg/g/individuals) ─── */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-2">
              Made for Every Workflow
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              How Individuals &amp; Teams Use {tool.name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            From one-off personal projects to high-volume daily production, see what you can create in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {useCaseCards.map((card, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Image Header */}
                <div
                  className={`relative h-48 w-full overflow-hidden bg-gradient-to-br ${card.accent} flex items-center justify-center p-4`}
                  style={idx === 0 && !isPdf ? softCheckerStyle : undefined}
                >
                  <img
                    src={card.img}
                    alt={card.title}
                    loading="lazy"
                    className="h-36 w-36 rounded-2xl object-cover shadow-lg border-2 border-white/80 group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md border border-border px-2.5 py-0.5 text-[10px] font-extrabold text-foreground">
                    {card.tag}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-[#0a0a0a] text-white px-2.5 py-0.5 text-[10px] font-bold shadow">
                    {card.badge}
                  </span>
                </div>

                {/* Copy */}
                <div className="p-5 space-y-2">
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-4 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                <span>Supports {tool.accepts}</span>
                <button
                  type="button"
                  onClick={scrollToWorkspace}
                  className="text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Try with your file</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: DEEP-DIVE FEATURE HIGHLIGHT (ZIG-ZAG SHOWCASE) ─── */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-10 lg:p-12 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Visual Pipeline Diagram */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-background p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-foreground">{tool.name} Pipeline</div>
                    <div className="text-[10px] text-muted-foreground">Automated 3-Stage Studio Engine</div>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Upload className="h-4 w-4 text-accent" />
                    <span className="font-bold text-foreground">1. Input Parsing</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{tool.accepts}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="h-4 w-4 text-accent" />
                    <span className="font-bold text-foreground">2. Precision Processing</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Lossless Engine
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Download className="h-4 w-4 text-accent" />
                    <span className="font-bold text-foreground">3. Instant Export</span>
                  </div>
                  <span className="font-mono text-[11px] text-foreground font-bold">{tool.outputs}</span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  <strong className="text-foreground">Enterprise-Grade Security:</strong> Protected throughout the entire processing workflow.
                </span>
              </div>
            </div>
          </div>

          {/* Right Detailed Copy */}
          <div className="lg:col-span-7 space-y-5">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-accent font-semibold">
              Studio-Grade Architecture
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
              Why Creators &amp; Professionals Prefer {tool.name} on bg.tools
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Traditional desktop suites require gigabytes of installation, manual layer masking, and complex export dialogs. With{" "}
              <strong className="text-foreground">{tool.name}</strong>, every control is streamlined into an interactive workspace that previews your changes live before you download.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {tool.seo.article.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-foreground">{b.heading}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{b.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
