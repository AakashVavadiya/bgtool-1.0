import { useState } from "react";
import girlBefore from "@/assets/girl-before.jpg";
import girlAfter from "@/assets/girl-after.png";
import type { Tool } from "@/lib/tools";
import { Zap, ShieldCheck, ArrowUpRight, CheckCircle2, FileText, Crop, Scaling, Minimize2, RotateCw, FlipHorizontal, FlipVertical, Lock, Unlock, Merge, FileSignature, QrCode, ScanText, Table2, Presentation, Code2, EyeOff } from "lucide-react";

const softCheckerStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(120,120,130,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,120,130,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,120,130,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,120,130,0.12) 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
};

type ToolVisualMode =
  | "crop-image"
  | "resize-image"
  | "compress-image"
  | "rotate-image"
  | "square-image"
  | "upscale-image"
  | "remove-background"
  | "blur-face"
  | "watermark-image"
  | "remove-watermark"
  | "photo-editor"
  | "color-picker"
  | "meme-generator"
  | "format-converter"
  | "code-encoding"
  | "ascii-art"
  | "ocr-text"
  | "doc-excel"
  | "doc-word"
  | "doc-ppt"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-compress"
  | "pdf-edit"
  | "pdf-sign"
  | "pdf-security"
  | "pdf-qr"
  | "pdf-invoice"
  | "pdf-general";

function detectToolVisualMode(tool: Tool): ToolVisualMode {
  const s = tool.slug;
  if (s === "crop-image" || s === "crop-pdf") return "crop-image";
  if (s === "resize-image" || s === "change-pdf-page-size") return "resize-image";
  if (s === "compress-image") return "compress-image";
  if (s === "rotate-image" || s === "rotate-pdf") return "rotate-image";
  if (s === "square-your-image") return "square-image";
  if (s === "upscale-image") return "upscale-image";
  if (s === "remove-background") return "remove-background";
  if (s === "blur-face") return "blur-face";
  if (s === "watermark-image" || s === "add-watermark-pdf") return "watermark-image";
  if (s === "remove-watermark") return "remove-watermark";
  if (s === "photo-editor") return "photo-editor";
  if (s === "color-picker-from-image") return "color-picker";
  if (s === "meme-generator") return "meme-generator";
  if (s.includes("ascii")) return "ascii-art";
  if (
    s.includes("base64") ||
    s.includes("binary") ||
    s.includes("hex") ||
    s.includes("octal") ||
    s.includes("decimal")
  ) {
    return "code-encoding";
  }
  if (s.includes("excel")) return "doc-excel";
  if (s.includes("word")) return "doc-word";
  if (s.includes("powerpoint")) return "doc-ppt";
  if (s.includes("ocr") || s.includes("text")) return "ocr-text";
  if (s === "merge-pdf" || s === "combine-pdf" || s.includes("merge")) return "pdf-merge";
  if (
    s === "split-pdf" ||
    s === "extract-pdf-pages" ||
    s === "remove-pdf-pages" ||
    s === "rearrange-pdf-pages" ||
    s === "halve-pdf-pages"
  ) {
    return "pdf-split";
  }
  if (s === "compress-pdf" || s === "web-optimize-pdf") return "pdf-compress";
  if (s === "edit-pdf" || s === "annotate-pdf" || s === "fill-pdf" || s === "create-fillable-pdf") {
    return "pdf-edit";
  }
  if (s === "sign-pdf" || s === "validate-signature-pdf") return "pdf-sign";
  if (
    s === "protect-pdf" ||
    s === "unlock-pdf" ||
    s === "sanitize-pdf" ||
    s === "remove-restrictions-pdf"
  ) {
    return "pdf-security";
  }
  if (s === "generate-qr-code") return "pdf-qr";
  if (s.includes("invoice") || s.includes("receipt")) return "pdf-invoice";
  if (tool.category === "PDF Tools" || s.includes("pdf")) return "pdf-general";
  return "format-converter";
}

export function ToolVisualShowcase({ tool }: { tool: Tool }) {
  const mode = detectToolVisualMode(tool);
  const Icon = tool.icon;

  // Interactive states for different tool showcases
  const [cropPreset, setCropPreset] = useState<"1:1" | "16:9" | "4:5" | "free">("1:1");
  const [resizePreset, setResizePreset] = useState<"4k" | "1080p" | "social" | "thumb">("1080p");
  const [compressQuality, setCompressQuality] = useState<number>(82);
  const [rotateDeg, setRotateDeg] = useState<number>(90);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [squareStyle, setSquareStyle] = useState<"blur" | "white" | "gradient" | "dark">("blur");
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(4);
  const [bgCompare, setBgCompare] = useState<number>(52);
  const [bgColorMode, setBgColorMode] = useState<"transparent" | "orange" | "dark" | "soft">("transparent");
  const [blurIntensity, setBlurIntensity] = useState<number>(14);
  const [editorFilter, setEditorFilter] = useState<"vibrant" | "warm" | "bw" | "cinema">("vibrant");
  const [pickedColorIdx, setPickedColorIdx] = useState<number>(0);
  const [signPosition, setSignPosition] = useState<"br" | "bc" | "bl" | "tr">("br");

  const scrollToWorkspace = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Crop box geometry by preset
  const cropBoxMap = {
    "1:1": { left: "24%", top: "10%", width: "52%", height: "80%", dim: "1080 × 1080 px (1:1 Square)" },
    "16:9": { left: "10%", top: "20%", width: "80%", height: "60%", dim: "1920 × 1080 px (16:9 Widescreen)" },
    "4:5": { left: "28%", top: "6%", width: "44%", height: "88%", dim: "1080 × 1350 px (4:5 Portrait)" },
    free: { left: "18%", top: "14%", width: "64%", height: "72%", dim: "1440 × 960 px (Custom Rule-of-Thirds)" },
  }[cropPreset];

  // Resize preset metadata
  const resizeMeta = {
    "4k": { w: 3840, h: 2160, label: "4K UHD Print & Display", dpi: "300 DPI", size: "2.4 MB", scale: "scale-100" },
    "1080p": { w: 1920, h: 1080, label: "Full HD Web & Video", dpi: "144 DPI", size: "620 KB", scale: "scale-95" },
    social: { w: 1080, h: 1080, label: "Social Media Post", dpi: "96 DPI", size: "310 KB", scale: "scale-90" },
    thumb: { w: 600, h: 400, label: "Fast Web Thumbnail", dpi: "72 DPI", size: "78 KB", scale: "scale-75" },
  }[resizePreset];

  // Compress calculation
  const origKb = 4280;
  const compressedKb = Math.max(140, Math.round(origKb * Math.pow(compressQuality / 100, 2.4) * 0.22));
  const savedPercent = Math.min(96, Math.max(45, Math.round(((origKb - compressedKb) / origKb) * 100)));

  // Extracted palette for Color Picker
  const paletteColors = [
    { hex: "#D97706", rgb: "rgb(217, 119, 6)", name: "Amber Ochre (Jacket)", x: "32%", y: "76%" },
    { hex: "#2A4736", rgb: "rgb(42, 71, 54)", name: "Tropical Foliage", x: "22%", y: "34%" },
    { hex: "#E5B89B", rgb: "rgb(229, 184, 155)", name: "Warm Portrait Skin", x: "55%", y: "44%" },
    { hex: "#1E1916", rgb: "rgb(30, 25, 22)", name: "Deep Espresso Hair", x: "66%", y: "28%" },
    { hex: "#991B1B", rgb: "rgb(153, 27, 27)", name: "Crimson Street Accent", x: "12%", y: "58%" },
  ];

  // Build 4 unique, tool-specific workflow cards (NO cartoon avatars!)
  const getToolSpecificUseCases = () => {
    switch (mode) {
      case "crop-image":
        return [
          {
            badge: "1:1 Square · 1080×1080",
            title: "Profile & Marketplace Crops",
            desc: "Frame headshots and product listings to exact 1:1 square ratios with centered rule-of-thirds composition.",
            metric: "Exact Aspect Lock",
            visualType: "crop-1-1",
          },
          {
            badge: "16:9 Cinema · 1920×1080",
            title: "YouTube & Blog Thumbnails",
            desc: "Trim vertical clutter into widescreen 16:9 banners that fit video players and hero headers without letterboxing.",
            metric: "Zero Distortion",
            visualType: "crop-16-9",
          },
          {
            badge: "4:5 Vertical · 1080×1350",
            title: "Instagram & Social Feeds",
            desc: "Maximize mobile screen real estate with 4:5 and 9:16 vertical crops tailored for social feeds and stories.",
            metric: "Social Presets",
            visualType: "crop-4-5",
          },
          {
            badge: "Custom Pixel Box",
            title: "Remove Distracting Edges",
            desc: "Drag any custom boundary box to slice out photobombers, timestamps, or unwanted borders at original resolution.",
            metric: "Pixel-Accurate",
            visualType: "crop-free",
          },
        ];
      case "resize-image":
        return [
          {
            badge: "1920 × 1080 px",
            title: "Web & Hero Banner Scaling",
            desc: "Downscale oversized 24MP camera photos to crisp Full-HD web dimensions for instant page loads.",
            metric: "Lanczos-3 Resampling",
            visualType: "resize-hd",
          },
          {
            badge: "Amazon / Shopify 2000×2000",
            title: "E-Commerce Storefront Specs",
            desc: "Standardize entire product catalogs to exact marketplace pixel dimensions with locked aspect ratios.",
            metric: "Aspect-Ratio Lock",
            visualType: "resize-ecom",
          },
          {
            badge: "300 DPI Print Ready",
            title: "Print & Publication Sizing",
            desc: "Calculate exact physical dimensions and pixel densities for flyers, passports, and high-DPI brochures.",
            metric: "300 DPI Precision",
            visualType: "resize-print",
          },
          {
            badge: "Percentage Scaling (25%–200%)",
            title: "Proportional Batch Resizing",
            desc: "Scale dimensions by percentage (50%, 75%, 150%) while preserving edge sharpness and EXIF orientation.",
            metric: "Zero Blur Scaling",
            visualType: "resize-pct",
          },
        ];
      case "compress-image":
        return [
          {
            badge: "4.2 MB → 380 KB (-91%)",
            title: "Core Web Vitals & SEO Speed",
            desc: "Cut image payload weight by up to 90% so landing pages and blogs pass Google PageSpeed Insights.",
            metric: "85%–92% Smaller",
            visualType: "compress-web",
          },
          {
            badge: "Under 50 KB / 100 KB Target",
            title: "Government & Exam Portals",
            desc: "Hit strict portal upload limits (20 KB, 50 KB, 100 KB) for signatures, ID cards, and application forms.",
            metric: "Exact KB Target",
            visualType: "compress-portal",
          },
          {
            badge: "25 MB Attachment Limit",
            title: "Instant Email & WhatsApp Sharing",
            desc: "Shrink high-resolution photography into lightweight files that send immediately over email and chat.",
            metric: "Perceptual Lossless",
            visualType: "compress-email",
          },
          {
            badge: "Chroma Subsampling + Quantization",
            title: "Cloud Storage Optimization",
            desc: "Archive thousands of client photos in a fraction of the disk space without visible compression artifacts.",
            metric: "4K Texture Kept",
            visualType: "compress-storage",
          },
        ];
      case "rotate-image":
        return [
          {
            badge: "90° CW / 90° CCW",
            title: "Fix Sideways Camera Photos",
            desc: "Correct portrait photos shot sideways on phones or DSLRs with lossless 90-degree quadrant rotation.",
            metric: "1-Click Quadrant",
            visualType: "rotate-90",
          },
          {
            badge: "Horizontal & Vertical Mirror",
            title: "Mirror Selfie & Layout Flip",
            desc: "Flip portraits and product angles horizontally or vertically so subjects face toward your page copy.",
            metric: "Instant Mirror",
            visualType: "rotate-flip",
          },
          {
            badge: "±0.1° Fine Horizon Straighten",
            title: "Level Tilted Horizons & Scans",
            desc: "Correct crooked architectural shots, skewed document scans, and tilted horizons with degree precision.",
            metric: "Fine Degree Slider",
            visualType: "rotate-horizon",
          },
          {
            badge: "Batch Multi-Image Rotate",
            title: "Rotate Entire Photo Shoots",
            desc: "Upload dozens of images at once, rotate each or all together, and export a single organized ZIP archive.",
            metric: "Batch ZIP Export",
            visualType: "rotate-batch",
          },
        ];
      default:
        return [
          {
            badge: `Input: ${tool.accepts}`,
            title: `High-Precision ${tool.name}`,
            desc: `Process ${tool.accepts} files with studio-calibrated accuracy and zero quality degradation across every pixel.`,
            metric: "Sub-Second Engine",
            visualType: "default-1",
          },
          {
            badge: `Output: ${tool.outputs}`,
            title: "Live Interactive Preview Stage",
            desc: `Inspect every detail of your ${tool.outputs} result in real time before downloading to your device.`,
            metric: "Real-Time Preview",
            visualType: "default-2",
          },
          {
            badge: "Cross-Platform Compatibility",
            title: "Ready for Web, Print & Mobile",
            desc: `Outputs from ${tool.name} follow strict industry specifications so your files open cleanly everywhere.`,
            metric: "100% Spec-Compliant",
            visualType: "default-3",
          },
          {
            badge: "Zero Data Retention",
            title: "Enterprise-Grade Security",
            desc: "Your files are handled with security-focused safeguards and protected throughout the entire workflow.",
            metric: "Private & Secure",
            visualType: "default-4",
          },
        ];
    }
  };

  const useCases = getToolSpecificUseCases();

  return (
    <div className="space-y-20 mb-20">
      {/* SECTION 1: 2-COLUMN SPLIT "ABOUT THIS TOOL" + UNIQUE TOOL-SPECIFIC INTERACTIVE VISUAL STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left 6 Columns: Tool-Specific Editorial & Technical Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-accent">
            <Icon className="h-3.5 w-3.5" />
            <span>{tool.category} · Live Technical Showcase</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            What is the {tool.name} Tool<span className="text-accent">?</span>
          </h2>

          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
            {tool.seo.article.intro}
          </p>

          {/* Tool-Specific Technical Specification Table */}
          <div className="rounded-2xl border border-border bg-card/80 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Supported Input
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-foreground">
                {tool.accepts}
              </span>
            </div>
            <div className="space-y-0.5 border-l border-border pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Export Output
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-accent">
                {tool.outputs}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-0.5 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Quality &amp; Reliability
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                100% Lossless Pipeline
              </span>
            </div>
          </div>

          {/* 3 Tool-Specific Reliability & Suitability Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">
                  {mode === "crop-image"
                    ? "Exact Aspect Ratios"
                    : mode === "resize-image"
                      ? "Pixel & DPI Control"
                      : mode === "compress-image"
                        ? "Up to 90% Smaller"
                        : "Sub-Second Speed"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {mode === "crop-image"
                    ? "1:1, 16:9, 4:5 & freeform grid"
                    : mode === "resize-image"
                      ? "Lanczos-3 anti-aliased scaling"
                      : mode === "compress-image"
                        ? "Smart perceptual quantization"
                        : "Real-time browser execution"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">Full Resolution</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Zero watermarks or forced downscaling
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-3.5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">Enterprise Privacy</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Protected throughout workflow
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToWorkspace}
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground text-background hover:bg-foreground/90 px-6 py-3.5 text-xs sm:text-sm font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Use {tool.name} Above</span>
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Free online studio · Works on Windows, Mac, iOS &amp; Android
            </span>
          </div>
        </div>

        {/* Right 6 Columns: BESPOKE INTERACTIVE VISUAL STAGE SPECIFIC TO THIS EXACT TOOL */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl border-2 border-border bg-card p-3 sm:p-6 shadow-2xl overflow-hidden">
            {/* Window Title Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 sm:mb-4 border-b border-border/70">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80 shrink-0" />
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80 shrink-0" />
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80 shrink-0" />
                <span className="ml-1.5 sm:ml-2 text-xs font-extrabold text-foreground truncate">
                  <span className="hidden sm:inline">{tool.name} — Interactive Studio Demo</span>
                  <span className="sm:hidden">{tool.name} Studio Demo</span>
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-accent">
                {tool.accepts} → {tool.outputs}
              </span>
            </div>

            {/* 1. CROP IMAGE INTERACTIVE VISUAL STAGE */}
            {mode === "crop-image" && (
              <div className="space-y-4">
                <div className="relative h-[320px] sm:h-[350px] w-full rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0a] border border-border select-none">
                  {/* Outer Uncropped Image */}
                  <img
                    src={girlBefore}
                    alt="Original uncropped frame"
                    className="h-full w-full object-cover object-top opacity-35 pointer-events-none"
                  />

                  {/* Active Bright Crop Box with Rule-of-Thirds Grid & Handles */}
                  <div
                    className="absolute border-2 border-[#ff5500] shadow-[0_0_0_9999px_rgba(255,255,255,0.65)] dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-300 overflow-hidden"
                    style={{
                      left: cropBoxMap.left,
                      top: cropBoxMap.top,
                      width: cropBoxMap.width,
                      height: cropBoxMap.height,
                    }}
                  >
                    <img
                      src={girlBefore}
                      alt="Active crop region"
                      className="w-full h-full object-cover object-top pointer-events-none"
                    />
                    {/* Rule of Thirds Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-white/55" />
                      <div className="border-r border-b border-white/55" />
                      <div className="border-b border-white/55" />
                      <div className="border-r border-b border-white/55" />
                      <div className="border-r border-b border-white/55" />
                      <div className="border-b border-white/55" />
                      <div className="border-r border-white/55" />
                      <div className="border-r border-white/55" />
                      <div />
                    </div>
                    {/* Corner L-Handles */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#ff5500]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#ff5500]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#ff5500]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#ff5500]" />

                    {/* Live Dimension Readout Pill Inside Crop Box */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/95 dark:bg-[#0a0a0a]/90 text-foreground dark:text-white border border-border dark:border-white/20 px-3 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap shadow-lg">
                      {cropBoxMap.dim}
                    </div>
                  </div>

                  <span className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-black/80 text-foreground dark:text-white px-3 py-1 text-[11px] font-bold border border-border dark:border-white/15 shadow-xs">
                    Rule-of-Thirds Composition Grid
                  </span>
                </div>

                {/* Aspect Ratio Preset Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Crop className="h-3.5 w-3.5 text-accent" />
                    <span>Click Aspect Ratio Preset:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: "1:1", label: "1:1 Square" },
                        { id: "16:9", label: "16:9 Wide" },
                        { id: "4:5", label: "4:5 Portrait" },
                        { id: "free", label: "Custom Grid" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCropPreset(p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          cropPreset === p.id
                            ? "bg-[#ff5500] text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. RESIZE IMAGE INTERACTIVE VISUAL STAGE */}
            {mode === "resize-image" && (
              <div className="space-y-4">
                <div className="relative h-[320px] sm:h-[350px] w-full rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0a] border border-border p-6 flex flex-col items-center justify-center shadow-inner">
                  {/* Top & Left Pixel Rulers */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-secondary/70 dark:bg-[#141414] border-b border-border dark:border-white/10 flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground">
                    <span>0 px</span>
                    <span className="text-[#ff5500] font-bold">↔ Width: {resizeMeta.w} px</span>
                    <span>{resizeMeta.w} px</span>
                  </div>

                  <div
                    className={`relative mt-4 rounded-xl overflow-hidden border-2 border-[#ff5500] shadow-xl transition-all duration-300 ${resizeMeta.scale}`}
                    style={{ maxWidth: "78%", maxHeight: "230px" }}
                  >
                    <img
                      src={girlBefore}
                      alt="Resized preview"
                      className="h-52 w-auto object-cover pointer-events-none"
                    />
                    <div className="absolute bottom-2 right-2 rounded-lg bg-white/95 dark:bg-black/85 text-foreground dark:text-white border border-border dark:border-white/20 px-2.5 py-1 text-[11px] font-mono font-bold shadow">
                      {resizeMeta.w} × {resizeMeta.h} px
                    </div>
                  </div>

                  {/* Output Specs Strip */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
                    <span className="rounded-full bg-secondary dark:bg-white/10 text-foreground dark:text-white border border-border dark:border-white/10 px-3 py-1 font-mono font-bold">
                      Resolution: {resizeMeta.w}×{resizeMeta.h}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 font-mono font-bold">
                      Density: {resizeMeta.dpi}
                    </span>
                    <span className="rounded-full bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/25 px-3 py-1 font-mono font-bold">
                      Est. Size: {resizeMeta.size}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Scaling className="h-3.5 w-3.5 text-accent" />
                    <span>Target Dimension Preset:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: "4k", label: "4K (3840px)" },
                        { id: "1080p", label: "Full HD (1920px)" },
                        { id: "social", label: "Social (1080px)" },
                        { id: "thumb", label: "Web (600px)" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setResizePreset(p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          resizePreset === p.id
                            ? "bg-[#ff5500] text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. COMPRESS IMAGE INTERACTIVE VISUAL STAGE */}
            {mode === "compress-image" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 h-[300px] sm:h-[320px]">
                  {/* Left: Uncompressed Original */}
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#0a0a0a]">
                    <img
                      src={girlBefore}
                      alt="Uncompressed original"
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 dark:bg-black/85 backdrop-blur-md p-2.5 text-foreground dark:text-white border border-border dark:border-white/15 shadow-md">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Original Uncompressed
                      </div>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="font-mono text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                          4.28 MB
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">100% Raw</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Compressed Output */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-white dark:bg-[#0a0a0a]">
                    <img
                      src={girlBefore}
                      alt="Compressed output"
                      className="h-full w-full object-cover object-top"
                    />
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[11px] font-black shadow-lg">
                      -{savedPercent}% Saved
                    </span>
                    <div className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 dark:bg-black/85 backdrop-blur-md p-2.5 text-foreground dark:text-white border border-emerald-500/40 shadow-md">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                        Smart Compressed Output
                      </div>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          {compressedKb} KB
                        </span>
                        <span className="text-[10px] font-mono text-foreground dark:text-white font-bold">
                          Quality: {compressQuality}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Compression Quality Slider */}
                <div className="rounded-2xl bg-secondary/60 border border-border p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Minimize2 className="h-4 w-4 text-accent" />
                    <span className="text-xs font-extrabold text-foreground">
                      Test Compression Level ({compressQuality}% Quality):
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                    <input
                      type="range"
                      min={40}
                      max={98}
                      value={compressQuality}
                      onChange={(e) => setCompressQuality(Number(e.target.value))}
                      aria-label="Compression quality preview"
                      className="w-full accent-[#ff5500] cursor-pointer h-1.5"
                    />
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {compressedKb} KB (-{savedPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ROTATE & FLIP IMAGE INTERACTIVE STAGE */}
            {mode === "rotate-image" && (
              <div className="space-y-4">
                <div className="relative h-[310px] sm:h-[340px] w-full rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0a] border border-border flex items-center justify-center p-6 shadow-inner">
                  <img
                    src={girlBefore}
                    alt="Rotated preview"
                    className="max-h-56 max-w-56 rounded-xl object-cover border-2 border-border dark:border-white/20 shadow-xl transition-transform duration-300"
                    style={{
                      transform: `rotate(${rotateDeg}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    }}
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-black/80 text-foreground dark:text-white border border-border dark:border-white/15 px-3 py-1 text-[11px] font-mono font-bold shadow-xs">
                    Angle: {rotateDeg}° {flipH ? "· Flip H" : ""} {flipV ? "· Flip V" : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Try Rotation &amp; Mirroring:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRotateDeg((d) => (d + 90) % 360)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#ff5500] text-white px-3 py-1 text-xs font-extrabold cursor-pointer"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Rotate +90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                        flipH ? "bg-foreground text-background" : "bg-secondary text-foreground"
                      }`}
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" />
                      <span>Flip H</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                        flipV ? "bg-foreground text-background" : "bg-secondary text-foreground"
                      }`}
                    >
                      <FlipVertical className="h-3.5 w-3.5" />
                      <span>Flip V</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SQUARE YOUR IMAGE (1:1 NO-CROP STUDIO) */}
            {mode === "square-image" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-border h-[320px] shadow-inner">
                  <div
                    className="relative h-64 w-64 rounded-2xl overflow-hidden border-2 border-border dark:border-white/20 shadow-xl flex items-center justify-center"
                    style={{
                      background:
                        squareStyle === "white"
                          ? "#ffffff"
                          : squareStyle === "dark"
                            ? "#0a0a0a"
                            : squareStyle === "gradient"
                              ? "linear-gradient(135deg, #ff5500 0%, #ec4899 50%, #6366f1 100%)"
                              : undefined,
                    }}
                  >
                    {squareStyle === "blur" && (
                      <img
                        src={girlBefore}
                        alt="Blurred square backdrop"
                        className="absolute inset-0 w-full h-full object-cover scale-125 filter blur-md brightness-75"
                      />
                    )}
                    <img
                      src={girlBefore}
                      alt="1:1 uncropped subject"
                      className="relative z-10 w-56 h-40 object-cover rounded-lg shadow-xl border border-white/30"
                    />
                    <span className="absolute bottom-2 right-2 z-20 rounded-full bg-white/95 dark:bg-black/80 text-foreground dark:text-white px-2.5 py-0.5 text-[10px] font-mono font-bold shadow">
                      1080 × 1080 (1:1 No-Crop)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">1:1 Square Fill Mode:</span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: "blur", label: "Blurred Backdrop" },
                        { id: "gradient", label: "Studio Gradient" },
                        { id: "white", label: "Pure White" },
                        { id: "dark", label: "Carbon Dark" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSquareStyle(m.id)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer ${
                          squareStyle === m.id
                            ? "bg-[#ff5500] text-white"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. AI UPSCALE IMAGE (SUPER-RESOLUTION) */}
            {mode === "upscale-image" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 h-[310px]">
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#0a0a0a]">
                    <img
                      src={girlBefore}
                      alt="Low-res input"
                      className="h-full w-full object-cover object-top filter blur-[2.5px] contrast-90 scale-105"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 dark:bg-black/80 text-foreground dark:text-white border border-border dark:border-white/15 px-2.5 py-0.5 text-[10px] font-mono font-bold shadow">
                      Low-Res Input (480 × 600 px)
                    </span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#ff5500] bg-white dark:bg-[#0a0a0a]">
                    <img
                      src={girlBefore}
                      alt="4K Upscaled output"
                      className="h-full w-full object-cover object-top filter contrast-105 saturate-105"
                    />
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-[#ff5500] text-white px-2.5 py-0.5 text-[10px] font-mono font-black shadow-md">
                      {upscaleFactor}x AI Upscaled ({480 * upscaleFactor} × {600 * upscaleFactor} px)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">AI Super-Resolution Scale:</span>
                  <div className="flex items-center gap-2">
                    {([2, 4] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setUpscaleFactor(f)}
                        className={`px-4 py-1 rounded-full text-xs font-extrabold cursor-pointer ${
                          upscaleFactor === f ? "bg-[#ff5500] text-white" : "bg-secondary text-foreground"
                        }`}
                      >
                        {f}x Ultra HD ({f === 4 ? "4K UHD" : "2K QHD"})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. REMOVE BACKGROUND (SUB-PIXEL ALPHA MATTING) */}
            {mode === "remove-background" && (
              <div className="space-y-4">
                <div
                  className="relative h-[320px] sm:h-[350px] w-full rounded-2xl overflow-hidden border border-border select-none bg-white dark:bg-[#0a0a0a]"
                  style={
                    bgColorMode === "transparent"
                      ? softCheckerStyle
                      : bgColorMode === "orange"
                        ? { background: "linear-gradient(135deg, #ff5500 0%, #ff8800 100%)" }
                        : bgColorMode === "dark"
                          ? { background: "#0a0a0a" }
                          : { background: "linear-gradient(135deg, #fce7f3 0%, #e0e7ff 100%)" }
                  }
                >
                  <img
                    src={girlAfter}
                    alt="Background removed cutout"
                    className="h-full w-full object-cover object-top pointer-events-none"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `polygon(0 0, ${bgCompare}% 0, ${bgCompare}% 100%, 0 100%)` }}
                  >
                    <img
                      src={girlBefore}
                      alt="Original before background removal"
                      className="h-full w-full object-cover object-top pointer-events-none"
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${bgCompare}%` }}
                  >
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#0a0a0a] text-white border-2 border-white flex items-center justify-center text-[10px] font-black">
                      ↔
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-black/75 text-foreground dark:text-white border border-border dark:border-white/15 px-3 py-1 text-[11px] font-bold shadow">
                    Original Photo
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-[#ff5500] text-white px-3 py-1 text-[11px] font-extrabold shadow">
                    Transparent PNG Cutout
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <span className="text-[11px] font-bold text-muted-foreground">Slide Cutout:</span>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={bgCompare}
                      onChange={(e) => setBgCompare(Number(e.target.value))}
                      aria-label="Slide background removal comparison"
                      className="w-full accent-[#ff5500] cursor-pointer h-1.5"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {(["transparent", "orange", "dark", "soft"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBgColorMode(m)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize cursor-pointer ${
                          bgColorMode === m ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. AI BLUR FACE (PRIVACY REDACTION) */}
            {mode === "blur-face" && (
              <div className="space-y-4">
                <div className="relative h-[320px] w-full rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#0a0a0a]">
                  <img
                    src={girlBefore}
                    alt="Face blur privacy demo"
                    className="h-full w-full object-cover object-top"
                  />
                  {/* Detected Face Blur Shield */}
                  <div
                    className="absolute rounded-2xl border-2 border-[#ff5500] shadow-xl overflow-hidden"
                    style={{
                      left: "43%",
                      top: "20%",
                      width: "28%",
                      height: "42%",
                      backdropFilter: `blur(${blurIntensity}px)`,
                      WebkitBackdropFilter: `blur(${blurIntensity}px)`,
                    }}
                  >
                    <span className="absolute top-1.5 left-1.5 rounded bg-[#ff5500] text-white px-1.5 py-0.5 text-[9px] font-black uppercase">
                      Face Shield Active
                    </span>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/95 dark:bg-black/80 text-foreground dark:text-white border border-border dark:border-white/15 px-3 py-1 text-[11px] font-bold shadow">
                    AI Face Detection · Privacy Anonymizer
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5 text-accent" />
                    <span>Blur Strength ({blurIntensity}px):</span>
                  </span>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    value={blurIntensity}
                    onChange={(e) => setBlurIntensity(Number(e.target.value))}
                    aria-label="Face blur intensity"
                    className="w-48 accent-[#ff5500] cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}

            {/* 9. WATERMARK / REMOVE WATERMARK / PHOTO EDITOR / COLOR PICKER / MEME */}
            {(mode === "watermark-image" ||
              mode === "remove-watermark" ||
              mode === "photo-editor" ||
              mode === "color-picker" ||
              mode === "meme-generator") && (
              <div className="space-y-4">
                <div className="relative h-[320px] w-full rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#0a0a0a]">
                  <img
                    src={girlBefore}
                    alt={tool.name}
                    className="h-full w-full object-cover object-top transition-all duration-300"
                    style={{
                      filter:
                        mode === "photo-editor"
                          ? editorFilter === "vibrant"
                            ? "contrast(1.12) saturate(1.3)"
                            : editorFilter === "warm"
                              ? "sepia(0.28) saturate(1.25) brightness(1.04)"
                              : editorFilter === "bw"
                                ? "grayscale(1) contrast(1.2)"
                                : "contrast(1.18) brightness(0.95) saturate(0.85)"
                          : undefined,
                    }}
                  />

                  {mode === "watermark-image" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="rotate-[-24deg] border-2 border-white/60 bg-black/35 backdrop-blur-xs px-6 py-2 rounded-xl text-white/85 font-display text-xl sm:text-2xl font-black tracking-widest uppercase shadow-lg">
                        © BG.TOOLS STUDIO
                      </div>
                    </div>
                  )}

                  {mode === "remove-watermark" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-emerald-500 bg-white/95 dark:bg-emerald-950/90 backdrop-blur-xs px-4 py-2 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-xl">
                      ✓ Watermark &amp; Stamp Inpainted Cleanly
                    </div>
                  )}

                  {mode === "meme-generator" && (
                    <div className="absolute inset-x-0 inset-y-3 flex flex-col justify-between items-center pointer-events-none px-4 text-center">
                      <span
                        className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-wide"
                        style={{ WebkitTextStroke: "1.5px #000", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
                      >
                        WHEN THE CLIENT SAYS &ldquo;QUICK EDIT&rdquo;
                      </span>
                      <span
                        className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-wide"
                        style={{ WebkitTextStroke: "1.5px #000", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
                      >
                        AND IT TAKES 1 SECOND ON BG.TOOLS
                      </span>
                    </div>
                  )}

                  {mode === "color-picker" && (
                    <>
                      {paletteColors.map((c, idx) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setPickedColorIdx(idx)}
                          style={{ left: c.x, top: c.y, backgroundColor: c.hex }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 border-white shadow-xl cursor-pointer transition-transform ${
                            pickedColorIdx === idx ? "scale-125 ring-4 ring-[#ff5500]" : "hover:scale-110"
                          }`}
                          title={`${c.name}: ${c.hex}`}
                        />
                      ))}
                      <div className="absolute bottom-3 inset-x-3 rounded-xl bg-white/95 dark:bg-black/85 backdrop-blur-md border border-border dark:border-white/15 p-3 text-foreground dark:text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-7 w-7 rounded-lg border border-border dark:border-white/30 shrink-0"
                            style={{ backgroundColor: paletteColors[pickedColorIdx]?.hex }}
                          />
                          <div>
                            <div className="text-xs font-extrabold">{paletteColors[pickedColorIdx]?.name}</div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {paletteColors[pickedColorIdx]?.hex} · {paletteColors[pickedColorIdx]?.rgb}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#ff5500]">Click Dots on Photo</span>
                      </div>
                    </>
                  )}
                </div>

                {mode === "photo-editor" && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Color Grading Preset:</span>
                    <div className="flex items-center gap-1.5">
                      {(["vibrant", "warm", "bw", "cinema"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setEditorFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase cursor-pointer ${
                            editorFilter === f ? "bg-[#ff5500] text-white" : "bg-secondary text-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10. FORMAT CONVERTERS / CODE ENCODING / ASCII ART */}
            {(mode === "format-converter" || mode === "code-encoding" || mode === "ascii-art") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch min-h-[300px]">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#0a0a0a]">
                  <img
                    src={girlBefore}
                    alt="Source input"
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute bottom-2.5 inset-x-2.5 rounded-xl bg-white/95 dark:bg-black/85 backdrop-blur-md p-2.5 text-foreground dark:text-white border border-border dark:border-white/15 shadow-md">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Source Input Format
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black text-foreground dark:text-white">
                      {tool.accepts} · Full Color Profile
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#ff5500]/50 bg-white dark:bg-[#0a0a0a] text-foreground dark:text-white p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-2.5">
                    <span className="text-xs font-extrabold text-[#ff5500]">
                      Converted {tool.outputs} Output
                    </span>
                    <Code2 className="h-4 w-4 text-emerald-500" />
                  </div>

                  {mode === "code-encoding" ? (
                    <pre className="my-auto font-mono text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-400 bg-secondary/70 dark:bg-black/60 p-3 rounded-xl border border-border dark:border-white/10 overflow-hidden select-all">
                      {tool.slug.includes("base64")
                        ? "data:image/png;base64,\niVBORw0KGgoAAAANSUhEUgAA\nBAAAAAQACAYAAAB/HSuDAAA..."
                        : tool.slug.includes("hex")
                          ? "89 50 4E 47 0D 0A 1A 0A\n00 00 00 0D 49 48 44 52\n00 00 07 80 00 00 04 38..."
                          : tool.slug.includes("octal")
                            ? "211 120 116 107 015 012\n032 012 000 000 000 015..."
                            : "10001001 01010000 01001110\n01000111 00001101 00001010..."}
                    </pre>
                  ) : mode === "ascii-art" ? (
                    <pre className="my-auto font-mono text-[8px] leading-[9px] text-amber-700 dark:text-amber-400 bg-secondary/70 dark:bg-black/70 p-3 rounded-xl border border-border dark:border-white/10 overflow-hidden text-center">
                      {[
                        "  ..::;;++**##@@##**++;;::..  ",
                        " .:;+*#@@%%%%%%%%%%@@#*+;:. ",
                        " :+*#@@%%##******##%%@@#*+: ",
                        " ;*#@%#*+;;::::::;;+*#%@#*;",
                        " *#@%*+:..  ....  ..:+*%@#* ",
                        " #@%+:   .;+*##*+;.   :+%@# ",
                        " @%*.   +*#@@@@@@#*+   .*%@ ",
                      ].join("\n")}
                    </pre>
                  ) : (
                    <div className="my-auto space-y-2.5">
                      <div className="rounded-xl bg-secondary/60 dark:bg-white/5 border border-border dark:border-white/10 p-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Target Container</span>
                        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{tool.outputs}</span>
                      </div>
                      <div className="rounded-xl bg-secondary/60 dark:bg-white/5 border border-border dark:border-white/10 p-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Color &amp; Metadata</span>
                        <span className="font-mono text-xs font-bold text-foreground dark:text-white">sRGB · Lossless</span>
                      </div>
                      <div className="rounded-xl bg-secondary/60 dark:bg-white/5 border border-border dark:border-white/10 p-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Browser Speed</span>
                        <span className="font-mono text-xs font-bold text-[#ff5500]">&lt; 0.4 Seconds</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between pt-2 border-t border-border dark:border-white/10">
                    <span>✓ Ready for Instant Download</span>
                    <span>100% Spec-Compliant</span>
                  </div>
                </div>
              </div>
            )}

            {/* 11. OCR & DOCUMENT CONVERTERS (WORD / EXCEL / PPT / OCR) */}
            {(mode === "ocr-text" || mode === "doc-excel" || mode === "doc-word" || mode === "doc-ppt") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch min-h-[290px]">
                <div className="rounded-2xl border border-border bg-white dark:bg-[#0a0a0a] p-4 flex flex-col justify-between text-foreground dark:text-white relative overflow-hidden shadow-inner">
                  <span className="self-start rounded-full bg-secondary dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold">
                    1. Source ({tool.accepts})
                  </span>
                  <div className="my-auto rounded-xl bg-secondary/60 dark:bg-white/5 border border-border dark:border-white/15 p-3.5 space-y-2 font-mono text-xs relative">
                    <div className="flex justify-between text-[#ff5500] font-bold">
                      <span>STATEMENT #2026</span>
                      <span>$4,850.00</span>
                    </div>
                    <div className="h-2 w-5/6 rounded bg-foreground/20 dark:bg-white/20" />
                    <div className="h-2 w-4/6 rounded bg-foreground/20 dark:bg-white/20" />
                    <div className="h-2 w-11/12 rounded bg-foreground/20 dark:bg-white/20" />
                    <div className="inset-x-0 top-1/2 h-0.5 bg-[#ff5500] shadow-[0_0_12px_#ff5500] absolute" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Optical Layout &amp; Table Structure Recognition
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                      2. Structured {tool.outputs}
                    </span>
                    {mode === "doc-excel" ? (
                      <Table2 className="h-4 w-4 text-emerald-500" />
                    ) : mode === "doc-ppt" ? (
                      <Presentation className="h-4 w-4 text-[#ff5500]" />
                    ) : (
                      <ScanText className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>

                  {mode === "doc-excel" ? (
                    <div className="my-auto rounded-xl overflow-hidden border border-border bg-card text-[11px] font-mono">
                      <div className="grid grid-cols-3 bg-emerald-600 text-white font-bold px-2.5 py-1.5">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Amount</span>
                      </div>
                      <div className="grid grid-cols-3 px-2.5 py-1.5 border-b border-border">
                        <span>Studio License</span>
                        <span>01</span>
                        <span className="font-bold text-emerald-600">$2,400</span>
                      </div>
                      <div className="grid grid-cols-3 px-2.5 py-1.5">
                        <span>Cloud API</span>
                        <span>01</span>
                        <span className="font-bold text-emerald-600">$2,450</span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto rounded-xl bg-card border border-border p-3 space-y-2 shadow-xs">
                      <div className="text-xs font-extrabold text-foreground border-b border-border pb-1">
                        Editable {tool.outputs} Document
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Headings, tables, fonts, and paragraphs are reconstructed into a clean, editable{" "}
                        <strong className="text-foreground">{tool.outputs}</strong> file.
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex justify-between">
                    <span>✓ Editable Columns &amp; Text</span>
                    <span>Instant Download</span>
                  </div>
                </div>
              </div>
            )}

            {/* 12. PDF TOOLS (MERGE / SPLIT / COMPRESS / EDIT / SIGN / SECURITY / QR / INVOICE) */}
            {mode === "pdf-sign" ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Single Sleek Authentic PDF Document Sheet - Zero Nested Box-in-a-Box Clutter */}
                <div className="relative rounded-xl sm:rounded-2xl bg-white dark:bg-[#111114] border border-border/80 p-3.5 sm:p-6 shadow-sm text-foreground select-none flex flex-col justify-between min-h-[250px] sm:min-h-[290px]">
                  {/* Document Meta Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff5500]/10 text-[#ff5500]">
                        <FileSignature className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">
                          Executive_Agreement.pdf
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate">
                          Page 1 of 1 · Execution Section
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span>Tamper-Proof</span>
                    </span>
                  </div>

                  {/* Top Signature slot if Top Right is selected */}
                  {signPosition === "tr" && (
                    <div className="flex justify-end pt-1 transition-all duration-300">
                      <div className="w-full max-w-[210px] sm:max-w-[240px] border-b-2 border-foreground/30 dark:border-white/30 pb-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif italic text-xl sm:text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                            Alex Morgan
                          </span>
                          <span className="shrink-0 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted-foreground font-medium pt-0.5 gap-0.5">
                          <span>Authorized Signatory</span>
                          <span className="font-mono text-[9px]">2026-11-20</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Content Lines (Simulating Contract Terms) */}
                  <div className="space-y-1.5 sm:space-y-2 py-1.5">
                    <div className="h-1.5 sm:h-2 w-full rounded bg-foreground/15 dark:bg-white/10" />
                    <div className="h-1.5 sm:h-2 w-11/12 rounded bg-foreground/15 dark:bg-white/10" />
                    <div className="h-1.5 sm:h-2 w-4/5 rounded bg-foreground/10 dark:bg-white/5" />
                    <div className="h-1.5 sm:h-2 w-5/6 rounded bg-foreground/10 dark:bg-white/5" />
                  </div>

                  {/* Bottom Signature slot if Bottom Left, Center, or Right is selected */}
                  {signPosition !== "tr" && (
                    <div
                      className={`transition-all duration-300 pt-1 flex ${
                        signPosition === "br"
                          ? "justify-end"
                          : signPosition === "bc"
                            ? "justify-center"
                            : "justify-start"
                      }`}
                    >
                      <div className="w-full max-w-[210px] sm:max-w-[240px] border-b-2 border-foreground/30 dark:border-white/30 pb-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif italic text-xl sm:text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                            Alex Morgan
                          </span>
                          <span className="shrink-0 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground font-medium pt-0.5 gap-0.5">
                          <span>Authorized Signatory</span>
                          <span className="font-mono text-[9px]">2026-11-20 · 14:30 UTC</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-border/40 text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                    <span className="truncate">Doc ID: #BG-SIGN-7842</span>
                    <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-bold">100% Client-Side Privacy</span>
                  </div>
                </div>

                {/* Preset Controls Bar (Matches the actual Sign PDF settings panel) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <FileSignature className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Signature Position:</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                    {(
                      [
                        { id: "br", label: "Bottom Right" },
                        { id: "bc", label: "Bottom Center" },
                        { id: "bl", label: "Bottom Left" },
                        { id: "tr", label: "Top Right" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSignPosition(p.id)}
                        className={`px-3 py-1.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer text-center ${
                          signPosition === p.id
                            ? "bg-[#ff5500] text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : mode.startsWith("pdf-") && (
              <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-border dark:border-white/10 p-4 sm:p-5 text-foreground dark:text-white space-y-4 shadow-inner">
                {mode === "pdf-merge" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {["Contract_P1.pdf", "Financials_P2.pdf", "Appendix_P3.pdf"].map((name, i) => (
                        <div key={name} className="rounded-xl bg-secondary/60 dark:bg-[#161616] border border-border dark:border-white/15 p-3 text-center space-y-1.5">
                          <div className="mx-auto h-10 w-8 rounded bg-white text-[#0a0a0a] border border-neutral-200 font-mono text-[10px] font-black flex items-center justify-center shadow">
                            PDF {i + 1}
                          </div>
                          <div className="text-[10px] font-bold truncate">{name}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-[#ff5500]">
                      <Merge className="h-4 w-4" />
                      <span>Combined in Custom Drag-and-Drop Order ↓</span>
                    </div>
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-foreground dark:text-white">Merged_Master_Document.pdf</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">All Pages Unified</span>
                    </div>
                  </div>
                ) : mode === "pdf-split" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((p) => {
                        const selected = p === 1 || p === 3;
                        return (
                          <div
                            key={p}
                            className={`rounded-xl p-2.5 text-center border transition-all ${
                              selected
                                ? "border-[#ff5500] bg-[#ff5500]/15 ring-2 ring-[#ff5500]/40"
                                : "border-border dark:border-white/10 bg-secondary/50 dark:bg-[#161616] opacity-60"
                            }`}
                          >
                            <div className="mx-auto h-12 w-9 rounded bg-white text-[#0a0a0a] border border-neutral-200 font-mono text-[10px] font-black flex items-center justify-center">
                              P.{p}
                            </div>
                            <span className="mt-1.5 block text-[10px] font-bold">
                              {selected ? "✓ Extracted" : "Skipped"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-xl bg-secondary/60 dark:bg-[#161616] border border-border dark:border-white/15 p-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground">Selected Range: Pages 1, 3</span>
                      <span className="font-mono font-extrabold text-[#ff5500]">Instant Split PDF</span>
                    </div>
                  </div>
                ) : mode === "pdf-compress" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-secondary/60 dark:bg-[#161616] border border-border dark:border-white/15 p-4 space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Original PDF Size</span>
                        <div className="font-mono text-xl font-black text-rose-600 dark:text-rose-400">18.4 MB</div>
                        <span className="text-[11px] text-muted-foreground">Heavy embedded bitmaps</span>
                      </div>
                      <div className="rounded-xl bg-emerald-500/10 border-2 border-emerald-500 p-4 space-y-1">
                        <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">Compressed PDF (-84%)</span>
                        <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">2.9 MB</div>
                        <span className="text-[11px] text-foreground dark:text-neutral-200">Crisp 300 DPI Vector Text Kept</span>
                      </div>
                    </div>
                  </div>
                ) : mode === "pdf-security" ? (
                  <div className="rounded-xl bg-secondary/60 dark:bg-[#161616] border border-border dark:border-white/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {tool.slug.includes("unlock") || tool.slug.includes("remove") ? (
                          <Unlock className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-[#ff5500]" />
                        )}
                        <span className="text-sm font-extrabold">{tool.name} Security Shield</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                        AES-256 Standard
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Control document access, printing permissions, copying restrictions, and password encryption directly in your browser.
                    </p>
                  </div>
                ) : (
                  /* Full-Screen PDF Editor / Invoice / QR / General PDF Scene */
                  <div className="bg-white dark:bg-[#141414] text-foreground dark:text-white rounded-xl border border-border dark:border-white/10 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 rounded bg-[#ff5500]/15 border border-[#ff5500] px-2 py-0.5 text-[11px] font-extrabold">
                          {tool.name} Studio Preview
                        </span>
                        <p className="text-xs font-bold text-foreground dark:text-white">
                          In-Place Font-Matched Text &amp; Vector Shape Editing
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Click any line of text or photo on the PDF to edit without shifting layout
                        </p>
                      </div>
                      <QrCode className="h-10 w-10 text-foreground dark:text-white shrink-0" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-lg bg-secondary/70 dark:bg-white/5 p-2 font-bold text-emerald-600 dark:text-emerald-400">✓ Same Font &amp; Size</div>
                      <div className="rounded-lg bg-secondary/70 dark:bg-white/5 p-2 font-bold text-foreground dark:text-white">✓ Vector Shapes</div>
                      <div className="rounded-lg bg-secondary/70 dark:bg-white/5 p-2 font-bold text-[#ff5500]">✓ Instant PDF Export</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: 4 TOOL-SPECIFIC VISUAL WORKFLOW CARDS (WHITE IN DAY MODE, BLACK IN NIGHT MODE) */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-2">
              Tailored for Your Workflow
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              How Individuals &amp; Teams Use {tool.name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            Built for accuracy, speed, and reliability across personal, creator, e-commerce, and enterprise tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {useCases.map((card, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Bespoke Visual Header Diagram Specific to the Tool & Card (White in Day Mode, Black in Night Mode) */}
                <div className="relative h-44 w-full overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-border flex items-center justify-center p-4">
                  {mode.startsWith("pdf-") ? (
                    <div className="w-40 rounded-xl bg-secondary/40 dark:bg-[#141418] text-foreground dark:text-white p-3 shadow-md border-2 border-[#ff5500]/60 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-border pb-1">
                        <span className="font-mono text-[9px] font-black text-[#ff5500] uppercase">
                          {tool.name}
                        </span>
                        <FileText className="h-3.5 w-3.5 text-foreground dark:text-white" />
                      </div>
                      <div className="h-2 w-4/5 rounded bg-foreground/70 dark:bg-white/70" />
                      <div className="h-1.5 w-3/5 rounded bg-foreground/25 dark:bg-white/25" />
                      <div className="h-1.5 w-11/12 rounded bg-foreground/25 dark:bg-white/25" />
                      <div className="pt-1 flex items-center justify-between text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <span>✓ 300 DPI Vector</span>
                        <span>PDF #{idx + 1}</span>
                      </div>
                    </div>
                  ) : mode === "ocr-text" || mode === "doc-excel" || mode === "doc-word" || mode === "doc-ppt" ? (
                    <div className="w-44 rounded-xl bg-secondary/50 dark:bg-[#141418] border border-emerald-500/40 p-3 text-foreground dark:text-white space-y-2 shadow-md">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>{tool.accepts}</span>
                        <span>→</span>
                        <span>{tool.outputs}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono bg-white dark:bg-black/50 p-1.5 rounded border border-border dark:border-white/10">
                        <span className="text-muted-foreground">Col A</span>
                        <span className="text-muted-foreground">Col B</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.4%</span>
                      </div>
                      <div className="h-1.5 w-4/5 rounded bg-foreground/20 dark:bg-white/25" />
                    </div>
                  ) : mode === "code-encoding" || mode === "ascii-art" ? (
                    <div className="w-44 rounded-xl bg-secondary/60 dark:bg-black border border-emerald-500/40 p-3 font-mono text-[9px] text-emerald-700 dark:text-emerald-400 leading-tight shadow-md">
                      <div className="text-[#ff5500] font-bold mb-1">// {tool.outputs} Stream</div>
                      <div>01001001 01001101</div>
                      <div>89 50 4E 47 0D 0A</div>
                      <div className="text-muted-foreground truncate">data:image/png;base64...</div>
                    </div>
                  ) : mode === "compress-image" ? (
                    <div className="relative flex items-center gap-2">
                      <img
                        src={girlBefore}
                        alt={card.title}
                        loading="lazy"
                        className="h-28 w-24 rounded-xl object-cover object-top border border-border shadow-sm"
                      />
                      <div className="rounded-xl bg-secondary/60 dark:bg-[#141418] border border-emerald-500/40 p-2.5 text-left font-mono shadow-xs">
                        <div className="text-[9px] text-muted-foreground line-through">4.28 MB</div>
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">380 KB</div>
                        <div className="mt-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                          -91% Size
                        </div>
                      </div>
                    </div>
                  ) : mode === "resize-image" ? (
                    <div className="relative flex items-end gap-2">
                      <img
                        src={girlBefore}
                        alt={card.title}
                        loading="lazy"
                        className="h-16 w-14 rounded-lg object-cover object-top border border-border opacity-70 shadow-xs"
                      />
                      <span className="text-xs font-black text-[#ff5500] mb-5">→</span>
                      <div className="relative">
                        <img
                          src={girlBefore}
                          alt={card.title}
                          loading="lazy"
                          className="h-28 w-24 rounded-xl object-cover object-top border-2 border-[#ff5500] shadow-md"
                        />
                        <span className="absolute -bottom-1.5 inset-x-1 rounded bg-white/95 dark:bg-black/90 text-foreground dark:text-white border border-border dark:border-white/15 text-[8px] font-mono font-bold text-center py-0.5 shadow-2xs">
                          {idx === 0 ? "1920×1080" : idx === 1 ? "2000×2000" : idx === 2 ? "300 DPI" : "Scale %"}
                        </span>
                      </div>
                    </div>
                  ) : mode === "rotate-image" ? (
                    <img
                      src={girlBefore}
                      alt={card.title}
                      loading="lazy"
                      className="h-24 w-24 rounded-xl object-cover object-top border-2 border-[#ff5500] shadow-md transition-transform duration-300"
                      style={{
                        transform:
                          idx === 0
                            ? "rotate(90deg)"
                            : idx === 1
                              ? "scaleX(-1)"
                              : idx === 2
                                ? "rotate(-6deg)"
                                : "rotate(180deg)",
                      }}
                    />
                  ) : (
                    <img
                      src={mode === "remove-background" ? girlAfter : girlBefore}
                      alt={card.title}
                      loading="lazy"
                      className={`object-cover object-top transition-transform duration-300 group-hover:scale-105 ${
                        card.visualType === "crop-1-1"
                          ? "h-28 w-28 rounded-xl border-2 border-[#ff5500] shadow-md"
                          : card.visualType === "crop-16-9"
                            ? "h-20 w-40 rounded-xl border-2 border-[#ff5500] shadow-md"
                            : card.visualType === "crop-4-5"
                              ? "h-32 w-24 rounded-xl border-2 border-[#ff5500] shadow-md"
                              : "h-28 w-36 rounded-xl border-2 border-[#ff5500]/70 shadow-md"
                      }`}
                    />
                  )}
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 dark:bg-black/85 backdrop-blur-md border border-border dark:border-white/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-foreground dark:text-white shadow-2xs">
                    {card.badge}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 rounded-full bg-[#ff5500] text-white px-2.5 py-0.5 text-[10px] font-extrabold shadow">
                    {card.metric}
                  </span>
                </div>

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
                <span>{tool.accepts} → {tool.outputs}</span>
                <button
                  type="button"
                  onClick={scrollToWorkspace}
                  className="text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Try Now</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
