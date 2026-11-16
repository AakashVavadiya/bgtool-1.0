// Settings panels for compression, resizing, cropping, format conversion, rotation, and watermarks.
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  Download,
  Check,
  Loader2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Crop as CropIcon,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  FileType,
  Layers,
  Eye,
  EyeOff,
  Pipette,
  Copy,
  Palette,
  CheckSquare,
  Square,
  Maximize2,
  X,
  Code2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FolderUp,
  Languages,
  Globe,
  Search,
  FileText,
  ScanText,
  FileDown,
  Table2,
  MonitorPlay,
  Presentation,
  Binary,
  Cpu,
  Terminal,
  Activity,
  WrapText,
  ZoomIn,
  ZoomOut,
  Hash,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Table as TableIcon,
  FileSpreadsheet,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sun,
  Moon,
  QrCode,
  Barcode as BarcodeIcon,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Grid3X3,
  Stamp,
  Move,
  Bold,
  Italic,
  Sparkle,
  Smile,
  Plus,
  Minus,
  Circle,
  Zap,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { Telemetry, REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { type Tool } from "@/lib/tools";
import { PdfToolWorkspace } from "@/components/PdfToolWorkspace";
import { removeGeminiWatermark, detectGeminiWatermark } from "@/lib/watermark/geminiWatermarkEngine";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  type FaceBox,
  detectFacesInImage,
  applyFaceAnonymization,
} from "@/lib/faceDetector";
import {
  OcrLanguageDialog,
  RICH_OCR_LANGUAGES,
  type OcrLanguageOption,
} from "@/components/OcrLanguageDialog";
import {
  renderPptSlideToImage,
  renderAllPptSlidesToZip,
  getPptxMetadata,
  type PptxMetadata,
} from "@/lib/pptxRenderer";
import { generateColorReportPdf } from "@/lib/color-report-pdf";


import {
  parseOcrTextToGrid,
  parseOcrTsvToGrid,
  buildEditableDocxFromOcr,
  buildDocxFromImage,
  buildEditableXlsxFromOcr,
  buildXlsxFromImage,
  buildPptxFromOcrAndImage,
  buildPptxFromImage,
  performAdvancedOcr,
  getExcelColumnLetter,
  type AdvancedOcrResult,
} from "@/lib/ocrEngine";
import {
  rgbToHsl,
  SAMPLE_VISUAL_TEST,
  SAMPLE_OG_CARD,
  SAMPLE_BADGE,
  SAMPLE_INVOICE,
  SAMPLE_CODE_BOX,
  SAMPLE_BINARY_INVADER,
  SAMPLE_BINARY_HEART,
  SAMPLE_BINARY_IMAGE,
  type BinaryThemeKey,
  BINARY_THEMES,
  SAMPLE_BASE64_STAR,
  SAMPLE_BASE64_GRADIENT_ICON,
  ROTATE_GRADIENT_PRESETS,
  ROTATE_COLOR_SWATCHES,
  type EditorThemeKey,
  EDITOR_THEMES,
  calculateEntropy,
  detectMagicSignature,
  MEME_FONTS,
  SQUARE_COLOR_PRESETS,
  SQUARE_GRADIENT_PRESETS,
  type CropBox,
} from "@/lib/workspace/workspace-presets";
import {
  sanitizeHtmlForImageExport,
  tryRawSvgFallback,
  type PdfOptions,
  buildPdfFromImageDataUrl,
  buildZip,
  extractTextFromZip,
  renderTextToCanvas,
  generateLockedPdfCanvas,
  renderPdfToImage,
  renderAllPdfPagesToZip,
  type WordDocumentModel,
  parseWordDocumentToPages,
  renderWordPageToImage,
  renderAllWordPagesToZip,
  renderWordDocumentToImage,
} from "@/lib/workspace/pdf-and-word-renderer";
import {
  getColIndexFromCellRef,
  type ExcelMergeRange,
  type ExcelSheetMetadata,
  getExcelSheetsMetadata,
  renderExcelSheetToImage,
  renderAllExcelSheetsToZip,
  type RotateBatchItem,
  renderRotatedImageToBlob,
} from "@/lib/workspace/excel-and-rotate-renderer";
import {
  type WatermarkRemovalOptions,
  removeWatermarkAdvanced,
  decodeBinaryStringToImageUrl,
  encodeAscii85WithWrap,
  decodeAscii85,
  detectImageMimeType,
  tryDecodeAsciiToOriginalImage,
  renderAsciiToImage,
  type DetectedCodeItem,
  formatBarcodeTypeName,
  detectBarcodesAndQRs,
  OCR_SUPPORTED_LANGUAGES,
  assembleOcrOutputText,
  renderHtmlToImage,
  applyHDResizingEnhancement,
  type SuperResolutionOptions,
  performSuperResolutionUpscale,
} from "@/lib/workspace/pixel-and-barcode-engines";

export function WorkspaceControlsCore(props: any) {
  const {
    tool,
    hasProcessed,
    origSize,
    newSize,
    dimensions,
    compressMode,
    setCompressMode,
    quality,
    setQuality,
    targetSizeInput,
    setTargetSizeInput,
    targetSizeUnit,
    setTargetSizeUnit,
    compressFormat,
    setCompressFormat,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    maintainAspect,
    setMaintainAspect,
    scalePercent,
    setScalePercent,
    resizeQualityMode,
    setResizeQualityMode,
    estimatedResizeBytes,
    cropAspect,
    targetFormat,
    setTargetFormat,
    rotation,
    setRotation,
    flipH,
    setFlipH,
    flipV,
    setFlipV,
    rotateBgMode,
    setRotateBgMode,
    rotateBgColor,
    setRotateBgColor,
    rotateBgGradient,
    setRotateBgGradient,
    rotateBatch,
    setRotateBatch,
    rotateBatchOutputFormat,
    setRotateBatchOutputFormat,
    wmMode,
    setWmMode,
    wmSubTab,
    setWmSubTab,
    wmText,
    setWmText,
    wmLogoSrc,
    setWmLogoSrc,
    wmLogoScale,
    setWmLogoScale,
    wmPosition,
    setWmPosition,
    wmCustomCoord,
    wmMargin,
    setWmMargin,
    wmOpacity,
    setWmOpacity,
    wmColor,
    setWmColor,
    wmFontSize,
    setWmFontSize,
    wmFontFamily,
    setWmFontFamily,
    wmBold,
    setWmBold,
    wmItalic,
    setWmItalic,
    wmRotation,
    setWmRotation,
    wmStroke,
    setWmStroke,
    wmBgBadge,
    setWmBgBadge,
    wmLogoInputRef,
    wmRemovalMode,
    setWmRemovalMode,
    wmRemovalSensitivity,
    setWmRemovalSensitivity,
    wmInpaintEngine,
    setWmInpaintEngine,
    wmPreserveDetails,
    setWmPreserveDetails,
    wmAlphaGain,
    setWmAlphaGain,
    setFocusedDim,
    applyCropAspectPreset,
    handleLogoUpload,
    formatBytes,
    cropPixelWidth,
    cropPixelHeight,
    currentTargetBytes,
    isTargetSizeExceeding,
    smartTargetPresets
  } = props;


  return (
    <>
              {/* 1. COMPRESS IMAGE */}
              {tool.slug === "compress-image" && (
                <div className="space-y-4">
                  {/* Mode Switch: Quality vs Size */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Compression Mode:
                    </label>
                    <div className="wobbly-switch grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary/80 p-1.5 border-2 border-border shadow-xs">
                      <button
                        type="button"
                        data-active={compressMode === "quality"}
                        onClick={() => setCompressMode("quality")}
                        className={`wobbly-btn flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs md:text-sm font-black cursor-pointer ${compressMode === "quality"
                            ? "wobbly-active bg-foreground text-background shadow-md scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                          }`}
                      >
                        <Sliders className="h-4 w-4" />
                        <span>Quality</span>
                      </button>
                      <button
                        type="button"
                        data-active={compressMode === "size"}
                        onClick={() => {
                          setCompressMode("size");
                          if (!targetSizeInput) setTargetSizeInput("200");
                        }}
                        className={`wobbly-btn flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs md:text-sm font-black cursor-pointer ${compressMode === "size"
                            ? "wobbly-active bg-foreground text-background shadow-md scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                          }`}
                      >
                        <Wand2 className="h-4 w-4" />
                        <span>Size</span>
                      </button>
                    </div>
                  </div>

                  {/* QUALITY MODE CONTROLS */}
                  {compressMode === "quality" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Unique Custom Seekbar Container */}
                      <div className="space-y-3 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">Quality Compression Seekbar:</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${quality >= 80
                                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                  : quality >= 50
                                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                    : "bg-orange-500/15 text-orange-500 border border-orange-500/30"
                                }`}
                            >
                              {quality >= 80 ? "High Fidelity" : quality >= 50 ? "Balanced Size" : "Max Savings"}
                            </span>
                          </div>
                          <span className="font-display text-lg font-black text-accent">
                            <AnimatedCounter value={quality} suffix="%" />
                          </span>
                        </div>

                        {/* Styled Seekbar Track */}
                        <div className="relative py-2">
                          <input
                            type="range"
                            min="5"
                            max="98"
                            value={quality}
                            onChange={(e: any) => setQuality(Number(e.target.value))}
                            className="unique-seekbar"
                            style={{
                              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((quality - 5) / (98 - 5)) * 100
                                }%, color-mix(in oklab, var(--color-foreground) 12%, transparent) ${((quality - 5) / (98 - 5)) * 100
                                }%, color-mix(in oklab, var(--color-foreground) 12%, transparent) 100%)`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => setQuality(5)}
                            className="hover:text-foreground transition-colors cursor-pointer"
                          >
                            5% (Smallest)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuality(50)}
                            className="hover:text-foreground transition-colors cursor-pointer"
                          >
                            50% (Balanced)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuality(98)}
                            className="hover:text-foreground transition-colors cursor-pointer"
                          >
                            98% (High Detail)
                          </button>
                        </div>
                      </div>

                      {/* Preset Quality Buttons with Wobbly Spring */}
                      <div className="flex gap-2">
                        {[
                          { label: "High (85%)", val: 85 },
                          { label: "Medium (60%)", val: 60 },
                          { label: "Small (35%)", val: 35 },
                        ].map((btn: any) => (
                          <button
                            key={btn.val}
                            type="button"
                            data-active={quality === btn.val}
                            onClick={() => setQuality(btn.val)}
                            className={`wobbly-pill flex-1 rounded-2xl border-2 py-2.5 text-xs font-bold cursor-pointer ${quality === btn.val
                                ? "wobbly-active border-foreground bg-foreground text-background shadow-md scale-[1.01]"
                                : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SIZE MODE CONTROLS */}
                  {compressMode === "size" && (
                    <div className="rounded-2xl border-2 border-border/80 bg-card p-5 space-y-3 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-foreground block">
                          Target File Size (Specify Exact Max Size Needed):
                        </label>
                        {targetSizeInput && (
                          <button
                            type="button"
                            onClick={() => setTargetSizeInput("")}
                            className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Unified Input & KB/MB Unit Segmented Box */}
                      <div
                        className={`flex items-center gap-2 rounded-2xl border-2 bg-background p-1.5 transition-all shadow-inner ${isTargetSizeExceeding
                            ? "border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
                            : "border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
                          }`}
                      >
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 200"
                          value={targetSizeInput}
                          onChange={(e: any) => setTargetSizeInput(e.target.value)}
                          className={`flex-1 bg-transparent px-3 py-2 text-base font-extrabold focus:outline-none ${isTargetSizeExceeding ? "text-destructive" : "text-foreground"
                            }`}
                        />

                        {/* Custom KB / MB Segmented Unit Box with Wobbly Switch */}
                        <div className="wobbly-switch flex items-center rounded-xl bg-secondary/80 p-1 border border-border/60">
                          {(["KB", "MB"] as const).map((unit: any) => (
                            <button
                              key={unit}
                              type="button"
                              data-active={targetSizeUnit === unit}
                              onClick={() => setTargetSizeUnit(unit)}
                              className={`wobbly-btn rounded-lg px-4 py-1.5 text-xs font-black cursor-pointer ${targetSizeUnit === unit
                                  ? "wobbly-active bg-foreground text-background shadow-md scale-[1.03]"
                                  : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Boundary Error Alert if Target >= Original */}
                      {isTargetSizeExceeding && (
                        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 px-3.5 py-2.5 text-xs font-bold text-destructive animate-in fade-in">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Target size ({formatBytes(currentTargetBytes)}) must be lower than original image size ({formatBytes(origSize)}).
                          </span>
                        </div>
                      )}

                      {/* Smart Preset Target Size Suggestions (strictly lower than uploaded image) */}
                      {smartTargetPresets.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-muted-foreground mr-1">Suggestions:</span>
                          {smartTargetPresets.map((preset: any) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setTargetSizeInput(preset.val);
                                setTargetSizeUnit(preset.unit);
                              }}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${targetSizeInput === preset.val && targetSizeUnit === preset.unit
                                  ? "border-accent bg-accent/20 text-accent font-extrabold shadow-xs"
                                  : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">
                        Enter the exact max file size you need (smaller than {formatBytes(origSize || 1024 * 1024)}) and Karudi will auto-calculate optimal compression parameters.
                      </p>
                    </div>
                  )}

                  {/* Output Format Selection */}
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                        Output Format:
                      </span>
                      <span className="text-[11px] font-bold text-accent">
                        {compressFormat === "auto"
                          ? "Auto (Best compression)"
                          : compressFormat === "image/webp"
                            ? "WebP (Ultra compact)"
                            : compressFormat === "image/jpeg"
                              ? "JPG (Standard)"
                              : "PNG (Lossless)"}
                      </span>
                    </div>

                    <div className="wobbly-switch grid grid-cols-4 gap-1.5 rounded-xl bg-secondary/80 p-1 border border-border/60">
                      {[
                        { label: "Auto", value: "auto" as const },
                        { label: "WebP", value: "image/webp" as const },
                        { label: "JPG", value: "image/jpeg" as const },
                        { label: "PNG", value: "image/png" as const },
                      ].map((fmt: any) => (
                        <button
                          key={fmt.value}
                          type="button"
                          data-active={compressFormat === fmt.value}
                          onClick={() => setCompressFormat(fmt.value)}
                          className={`wobbly-btn rounded-lg py-2 text-xs font-black cursor-pointer ${compressFormat === fmt.value
                              ? "wobbly-active bg-foreground text-background shadow-md scale-[1.02]"
                              : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold pt-3 border-t border-border">
                    <span>
                      Original Size: <strong>{formatBytes(origSize)}</strong>
                    </span>
                    {hasProcessed && (
                      <span className="text-emerald-500 font-extrabold text-sm flex items-center gap-1.5">
                        <span>New Size: {formatBytes(newSize)}</span>
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <AnimatedCounter
                            value={Math.max(0, Math.round(((origSize - newSize) / origSize) * 100))}
                            suffix="%"
                          />
                          <span>smaller</span>
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 2. RESIZE IMAGE */}
              {tool.slug === "resize-image" && (
                <div className="space-y-5">
                  {/* Quality Mode Switch: Same Quality vs Quality Improvement with Wobbly Spring */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Quality Mode:
                    </label>
                    <div className="wobbly-switch grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary/80 p-1.5 border-2 border-border shadow-xs">
                      <button
                        type="button"
                        data-active={resizeQualityMode === "same"}
                        onClick={() => setResizeQualityMode("same")}
                        className={`wobbly-btn flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs md:text-sm font-black cursor-pointer ${resizeQualityMode === "same"
                            ? "wobbly-active bg-foreground text-background shadow-md scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                          }`}
                      >
                        <Sliders className="h-4 w-4" />
                        <span>Same Quality</span>
                      </button>
                      <button
                        type="button"
                        data-active={resizeQualityMode === "improved"}
                        onClick={() => setResizeQualityMode("improved")}
                        className={`wobbly-btn flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs md:text-sm font-black cursor-pointer ${resizeQualityMode === "improved"
                            ? "wobbly-active bg-foreground text-background shadow-md scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                          }`}
                      >
                        <Wand2 className="h-4 w-4 text-accent" />
                        <span>Quality Improvement</span>
                      </button>
                    </div>
                    <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">
                      {resizeQualityMode === "same"
                        ? "Same Quality: Keeps file size compact and balanced without increasing image size."
                        : "✨ Quality Improvement: Applies multi-step HD sharpening & uncompressed bitrate (enhances edge clarity & increases image size)."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Percentage Scale Presets</label>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map((pct: any) => (
                        <button
                          key={pct}
                          type="button"
                          data-active={scalePercent === pct}
                          onClick={() => {
                            setScalePercent(pct);
                            if (dimensions.width && dimensions.height) {
                              setTargetWidth(Math.round((dimensions.width * pct) / 100));
                              setTargetHeight(Math.round((dimensions.height * pct) / 100));
                            }
                          }}
                          className={`wobbly-pill flex-1 rounded-xl border py-2 text-xs font-bold cursor-pointer ${scalePercent === pct
                              ? "wobbly-active bg-foreground text-background shadow-md scale-[1.02]"
                              : "border-border text-muted-foreground hover:border-foreground"
                            }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={targetWidth}
                        onFocus={() => setFocusedDim("width")}
                        onBlur={() => setFocusedDim(null)}
                        onChange={(e: any) => {
                          const val = Number(e.target.value);
                          setTargetWidth(val);
                          setScalePercent(100);
                          if (maintainAspect && dimensions.width > 0) {
                            setTargetHeight(Math.round((val * dimensions.height) / dimensions.width));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={targetHeight}
                        onFocus={() => setFocusedDim("height")}
                        onBlur={() => setFocusedDim(null)}
                        onChange={(e: any) => {
                          const val = Number(e.target.value);
                          setTargetHeight(val);
                          setScalePercent(100);
                          if (maintainAspect && dimensions.height > 0) {
                            setTargetWidth(Math.round((val * dimensions.width) / dimensions.height));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Maintain Image Ratio Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e: any) => setMaintainAspect(e.target.checked)}
                      className="h-4 w-4 rounded accent-accent cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-foreground block">Maintain Image Aspect Ratio</span>
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        Keep proportions locked when changing width or height
                      </span>
                    </div>
                  </label>

                  {/* Output Size Summary Card */}
                  <div className="rounded-2xl border-2 border-accent/25 bg-accent/5 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Output Size Summary
                      </span>
                      {hasProcessed && newSize > 0 && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          Resized
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      {/* Output Dimensions */}
                      <div className="bg-background/90 rounded-xl p-2.5 border border-border/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                          Output Dimensions
                        </span>
                        <div className="font-mono text-sm font-black text-foreground flex items-center gap-1">
                          <span>{targetWidth > 0 ? targetWidth : dimensions.width}</span>
                          <span className="text-muted-foreground font-normal">×</span>
                          <span>{targetHeight > 0 ? targetHeight : dimensions.height}</span>
                          <span className="text-xs font-bold text-muted-foreground">px</span>
                        </div>
                        {dimensions.width > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5 truncate">
                            Original: {dimensions.width}×{dimensions.height}
                          </span>
                        )}
                      </div>

                      {/* Output File Size */}
                      <div className="bg-background/90 rounded-xl p-2.5 border border-border/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                          {hasProcessed && newSize > 0 ? "Output File Size" : "Estimated File Size"}
                        </span>
                        <div className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span>{formatBytes(hasProcessed && newSize > 0 ? newSize : estimatedResizeBytes)}</span>
                        </div>
                        {origSize > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5 truncate">
                            Original: {formatBytes(origSize)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CROP IMAGE */}
              {tool.slug === "crop-image" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Aspect Ratio Preset</label>
                    <div className="flex flex-wrap gap-2">
                      {(["free", "1:1", "4:3", "16:9", "9:16"] as const).map((ratio: any) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => applyCropAspectPreset(ratio)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${cropAspect === ratio
                              ? "bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground"
                            }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                    <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <CropIcon className="h-4 w-4 text-accent" /> Drag Crop Box in Preview Window
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">
                      Click and drag the yellow corner/edge handles directly on your image preview to select the exact crop region.
                    </p>
                    <div className="flex justify-between text-xs font-mono font-bold text-accent pt-1">
                      <span>Crop Selection:</span>
                      <span>{cropPixelWidth} × {cropPixelHeight} px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CONVERT FORMAT */}
              {tool.slug === "convert-to-jpg" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground block">Target Export Format</label>
                  <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/30 text-accent font-extrabold text-xs font-mono">
                        JPG
                      </span>
                      <div>
                        <span className="text-xs font-extrabold text-foreground block">Full Quality JPEG (.jpg)</span>
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Universally compatible format preserving maximum resolution and visual quality
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                      Full Quality (JPG)
                    </span>
                  </div>
                </div>
              )}

              {tool.slug === "convert-from-jpg" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground block">
                    Target Export Format (Select Output Format)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                    {[
                      { label: "JPEG", sub: ".jpg", value: "image/jpeg" },
                      { label: "PNG", sub: ".png", value: "image/png" },
                      { label: "WebP", sub: ".webp", value: "image/webp" },
                      { label: "AVIF", sub: ".avif", value: "image/avif" },
                      { label: "GIF", sub: ".gif", value: "image/gif" },
                      { label: "BMP", sub: ".bmp", value: "image/bmp" },
                      { label: "TIFF", sub: ".tiff", value: "image/tiff" },
                    ].map((fmt: any) => (
                      <button
                        key={fmt.label}
                        type="button"
                        onClick={() => setTargetFormat(fmt.value as any)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-2 text-center transition-all ${targetFormat === fmt.value
                            ? "border-foreground bg-foreground text-background shadow-md scale-[1.02]"
                            : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                          }`}
                      >
                        <span className="text-xs font-extrabold">{fmt.label}</span>
                        <span className="text-[10px] font-mono opacity-80">{fmt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. ROTATE & FLIP (Compact, Properly Aligned & Perfectly Fitted) */}
              {tool.slug === "rotate-image" && (
                <div className="space-y-3">
                  {/* A. Batch Mode Info Strip (Compact & Clean) */}
                  {rotateBatch.length > 1 && (
                    <div className="rounded-xl border border-accent/30 bg-accent/5 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground truncate block">
                            Batch Mode ({rotateBatch.length} Images)
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            Rotates all images together
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground">Format:</span>
                        <div className="flex rounded-lg border border-border bg-background p-0.5 shadow-2xs">
                          {(["PNG", "JPG", "WEBP"] as const).map((fmt: any) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setRotateBatchOutputFormat(fmt)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${rotateBatchOutputFormat === fmt
                                  ? "bg-foreground text-background shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* B. Quick 90° Rotations & Mirror / Flip (Unified Sleek Toolbar) */}
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <RotateCw className="h-3 w-3 text-accent" />
                        <span>Quick Rotations &amp; Flips</span>
                      </span>

                      {/* Reset button if modified */}
                      {(rotation !== 0 || flipH || flipV) && (
                        <button
                          type="button"
                          onClick={() => {
                            setRotation(0);
                            setFlipH(false);
                            setFlipV(false);
                            if (rotateBatch.length > 1) {
                              setRotateBatch((prev: any) =>
                                prev.map((it: any) => ({ ...it, rotation: 0, flipH: false, flipV: false }))
                              );
                            }
                          }}
                          className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                        >
                          Reset (0°)
                        </button>
                      )}
                    </div>

                    {/* Row 1: 90° Rotations */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRotation((r: any) => r - 90);
                          if (rotateBatch.length > 1) {
                            setRotateBatch((prev: any) =>
                              prev.map((it: any) => ({ ...it, rotation: it.rotation - 90 }))
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-secondary hover:border-foreground/40 py-2 px-2 text-xs font-bold text-foreground active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Rotate 90° Left"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>-90° Left</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRotation((r: any) => r + 90);
                          if (rotateBatch.length > 1) {
                            setRotateBatch((prev: any) =>
                              prev.map((it: any) => ({ ...it, rotation: it.rotation + 90 }))
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-secondary hover:border-foreground/40 py-2 px-2 text-xs font-bold text-foreground active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Rotate 90° Right"
                      >
                        <RotateCw className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>+90° Right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRotation((r: any) => r + 180);
                          if (rotateBatch.length > 1) {
                            setRotateBatch((prev: any) =>
                              prev.map((it: any) => ({ ...it, rotation: it.rotation + 180 }))
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-secondary hover:border-foreground/40 py-2 px-2 text-xs font-bold text-foreground active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Rotate 180°"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>180°</span>
                      </button>
                    </div>

                    {/* Row 2: Flips */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !flipH;
                          setFlipH(next);
                          if (rotateBatch.length > 1) {
                            setRotateBatch((prev: any) =>
                              prev.map((it: any) => ({ ...it, flipH: next }))
                            );
                          }
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-3 text-xs font-bold transition-all cursor-pointer shadow-2xs ${flipH
                            ? "border-accent bg-accent/15 text-accent ring-1 ring-accent/30 font-black"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          }`}
                      >
                        <FlipHorizontal className="h-3.5 w-3.5" />
                        <span>Flip Horizontal</span>
                        {flipH && <Check className="h-3 w-3 ml-0.5 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !flipV;
                          setFlipV(next);
                          if (rotateBatch.length > 1) {
                            setRotateBatch((prev: any) =>
                              prev.map((it: any) => ({ ...it, flipV: next }))
                            );
                          }
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-3 text-xs font-bold transition-all cursor-pointer shadow-2xs ${flipV
                            ? "border-accent bg-accent/15 text-accent ring-1 ring-accent/30 font-black"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          }`}
                      >
                        <FlipVertical className="h-3.5 w-3.5" />
                        <span>Flip Vertical</span>
                        {flipV && <Check className="h-3 w-3 ml-0.5 stroke-[3]" />}
                      </button>
                    </div>
                  </div>

                  {/* C. Fine-Tune Angle Slider & Steppers */}
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3 w-3 text-accent" />
                        <span>Fine-Tune Angle</span>
                      </label>
                      <span className="rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-xs font-mono font-black text-accent shadow-2xs">
                        {((rotation % 360) + 360) % 360}°
                      </span>
                    </div>

                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e: any) => {
                        const newDeg = Number(e.target.value);
                        const diff = newDeg - rotation;
                        setRotation(newDeg);
                        if (rotateBatch.length > 1) {
                          setRotateBatch((prev: any) =>
                            prev.map((it: any) => ({ ...it, rotation: it.rotation + diff }))
                          );
                        }
                      }}
                      className="w-full accent-foreground cursor-pointer h-1.5"
                    />

                    {/* Compact Micro-adjust pills & snap chips */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRotation((r: any) => r - 1);
                            if (rotateBatch.length > 1) {
                              setRotateBatch((prev: any) =>
                                prev.map((it: any) => ({ ...it, rotation: it.rotation - 1 }))
                              );
                            }
                          }}
                          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-bold hover:border-foreground transition-all cursor-pointer shadow-2xs"
                          title="Rotate -1°"
                        >
                          -1°
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRotation((r: any) => r - 0.5);
                            if (rotateBatch.length > 1) {
                              setRotateBatch((prev: any) =>
                                prev.map((it: any) => ({ ...it, rotation: it.rotation - 0.5 }))
                              );
                            }
                          }}
                          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-bold hover:border-foreground transition-all cursor-pointer shadow-2xs"
                          title="Rotate -0.5°"
                        >
                          -0.5°
                        </button>
                      </div>

                      {/* Snap chips */}
                      <div className="flex items-center gap-1">
                        {[
                          { label: "0°", val: 0 },
                          { label: "90°", val: 90 },
                          { label: "180°", val: 180 },
                          { label: "270°", val: 270 },
                        ].map((chip: any) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setRotation(chip.val);
                              if (rotateBatch.length > 1) {
                                setRotateBatch((prev: any) =>
                                  prev.map((it: any) => ({ ...it, rotation: chip.val }))
                                );
                              }
                            }}
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-bold transition-all cursor-pointer ${((rotation % 360) + 360) % 360 === chip.val
                                ? "border-foreground bg-foreground text-background shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:border-foreground"
                              }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRotation((r: any) => r + 0.5);
                            if (rotateBatch.length > 1) {
                              setRotateBatch((prev: any) =>
                                prev.map((it: any) => ({ ...it, rotation: it.rotation + 0.5 }))
                              );
                            }
                          }}
                          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-bold hover:border-foreground transition-all cursor-pointer shadow-2xs"
                          title="Rotate +0.5°"
                        >
                          +0.5°
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRotation((r: any) => r + 1);
                            if (rotateBatch.length > 1) {
                              setRotateBatch((prev: any) =>
                                prev.map((it: any) => ({ ...it, rotation: it.rotation + 1 }))
                              );
                            }
                          }}
                          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-bold hover:border-foreground transition-all cursor-pointer shadow-2xs"
                          title="Rotate +1°"
                        >
                          +1°
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* D. Background Fill (Sleek Segmented Tabs) */}
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Palette className="h-3 w-3 text-accent" />
                        <span>Background Fill</span>
                      </label>
                      <span className="rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-mono font-bold text-accent capitalize">
                        {rotateBgMode === "color" ? rotateBgColor : rotateBgMode}
                      </span>
                    </div>

                    {/* Mode Selection Tabs (Compact Single-Row Segmented Control) */}
                    <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary/60 p-1 border border-border/60">
                      {[
                        { id: "transparent", label: "Transparent" },
                        { id: "color", label: "Color" },
                        { id: "blur", label: "Blur" },
                        { id: "gradient", label: "Gradient" },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRotateBgMode(item.id as any)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${rotateBgMode === item.id
                              ? "bg-foreground text-background shadow-xs font-black"
                              : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Mode A: Solid Color Controls */}
                    {rotateBgMode === "color" && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 shadow-2xs">
                            <input
                              type="color"
                              value={rotateBgColor}
                              onChange={(e: any) => setRotateBgColor(e.target.value)}
                              className="h-6 w-6 rounded border-0 cursor-pointer bg-transparent p-0"
                              title="Pick custom background color"
                            />
                            <span className="font-mono text-[11px] font-bold pr-1">{rotateBgColor.toUpperCase()}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">Pick any color</span>
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {ROTATE_COLOR_SWATCHES.map((sw: any) => (
                            <button
                              key={sw.hex}
                              type="button"
                              onClick={() => setRotateBgColor(sw.hex)}
                              className={`h-6 w-6 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer shadow-2xs ${rotateBgColor.toLowerCase() === sw.hex.toLowerCase()
                                  ? "scale-110 ring-2 ring-accent ring-offset-1 ring-offset-background"
                                  : sw.border
                                }`}
                              style={{ backgroundColor: sw.hex }}
                              title={sw.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mode B: Gradient Presets */}
                    {rotateBgMode === "gradient" && (
                      <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                        <div className="grid grid-cols-3 gap-1.5">
                          {ROTATE_GRADIENT_PRESETS.map((grad: any) => (
                            <button
                              key={grad.id}
                              type="button"
                              onClick={() => setRotateBgGradient(grad.css)}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer overflow-hidden ${rotateBgGradient === grad.css
                                  ? "border-accent ring-1 ring-accent/40 bg-accent/5 font-black"
                                  : "border-border hover:border-foreground"
                                }`}
                            >
                              <div
                                className="w-full h-5 rounded shadow-2xs border border-white/20 mb-1"
                                style={{ background: grad.css }}
                              />
                              <span className="text-[10px] font-bold text-foreground truncate w-full">{grad.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mode C & D descriptions */}
                    {rotateBgMode === "blur" && (
                      <p className="text-[10px] text-muted-foreground">
                        Artistic blurred expansion fills rotated corner gaps.
                      </p>
                    )}
                    {rotateBgMode === "transparent" && (
                      <p className="text-[10px] text-muted-foreground">
                        Corner gaps remain 100% transparent (ideal for PNG/WebP).
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 6. WATERMARK (Compact & Properly Arranged - No Scroll Needed) */}
              {tool.slug === "watermark-image" && (
                <div className="space-y-3">
                  {/* Top Bar: Mode Tabs + View Sub-Tabs in one clean header */}
                  <div className="flex flex-col gap-2">
                    {/* Watermark Type Selector: Text vs Logo */}
                    <div className="flex rounded-xl border border-border bg-secondary/40 p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setWmMode("text")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${wmMode === "text"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Type className="h-3.5 w-3.5" />
                        <span>Text Watermark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWmMode("logo")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${wmMode === "logo"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Logo / Image</span>
                      </button>
                    </div>

                    {/* Sub-Tab Navigation for Compact Non-Scroll Experience */}
                    <div className="flex items-center justify-between gap-1 rounded-xl border border-border/70 bg-card p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setWmSubTab("style")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition-all cursor-pointer ${wmSubTab === "style"
                            ? "bg-accent text-accent-foreground font-black shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Palette className="h-3 w-3" />
                        <span>{wmMode === "text" ? "Text & Style" : "Logo Image"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWmSubTab("position")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition-all cursor-pointer ${wmSubTab === "position"
                            ? "bg-accent text-accent-foreground font-black shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Move className="h-3 w-3" />
                        <span>
                          Position &amp; Angle
                          {wmPosition === "tile" ? " (Tile)" : ""}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWmSubTab("all")}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[10px] ${wmSubTab === "all"
                            ? "bg-foreground text-background font-black shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                        title="View all settings simultaneously"
                      >
                        All
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: TEXT & STYLE (when wmMode === "text" and subTab is "style" or "all") */}
                  {wmMode === "text" && (wmSubTab === "style" || wmSubTab === "all") && (
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs animate-in fade-in-50 duration-150">
                      {/* Row 1: Text Input with clear */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-extrabold text-foreground flex items-center gap-1.5">
                            <Type className="h-3.5 w-3.5 text-accent" />
                            <span>Watermark Text</span>
                          </label>
                          {wmText && (
                            <button
                              type="button"
                              onClick={() => setWmText("")}
                              className="text-[10px] font-bold text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={wmText}
                          placeholder="Type watermark text..."
                          onChange={(e: any) => setWmText(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs focus:border-accent focus:outline-none"
                        />
                        {/* Quick Symbols & Stamps compact inline pills */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {[
                            { label: "©", text: "© " },
                            { label: `© ${new Date().getFullYear()}`, text: `© ${new Date().getFullYear()} ` },
                            { label: "®", text: "® " },
                            { label: "™", text: "™ " },
                            { label: "CONFIDENTIAL", text: "CONFIDENTIAL" },
                            { label: "SAMPLE", text: "SAMPLE" },
                            { label: "DO NOT COPY", text: "DO NOT COPY" },
                          ].map((chip: any) => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => {
                                if (chip.text.startsWith("©") || chip.text.startsWith("®") || chip.text.startsWith("™")) {
                                  setWmText((prev: any) => (prev ? `${chip.text}${prev.replace(/^[©®™]\s*/, "")}` : chip.text));
                                } else {
                                  setWmText(chip.text);
                                }
                              }}
                              className="rounded-md border border-border/70 bg-secondary/50 px-1.5 py-0.5 text-[10px] font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Row 2: Typography + Bold + Italic + Size Slider in one tight block */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <select
                            value={wmFontFamily}
                            onChange={(e: any) => setWmFontFamily(e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                          >
                            <option value="sans-serif">Modern Sans</option>
                            <option value="serif">Classic Serif</option>
                            <option value="monospace">Monospace</option>
                            <option value="Impact, sans-serif">Bold Impact</option>
                            <option value="'Caveat', cursive, sans-serif">Handwriting</option>
                          </select>

                          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5">
                            <button
                              type="button"
                              onClick={() => setWmBold(!wmBold)}
                              className={`h-7 w-7 rounded-md text-xs font-black transition-all cursor-pointer flex items-center justify-center ${wmBold ? "bg-foreground text-background shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                              title="Toggle Bold"
                            >
                              <Bold className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setWmItalic(!wmItalic)}
                              className={`h-7 w-7 rounded-md text-xs font-black transition-all cursor-pointer flex items-center justify-center ${wmItalic ? "bg-foreground text-background shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                              title="Toggle Italic"
                            >
                              <Italic className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Font Scale compact slider + quick chips */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">Font Size:</span>
                            <div className="flex items-center gap-1.5">
                              {[24, 36, 48, 72].map((sz: any) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setWmFontSize(sz)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${Math.abs(wmFontSize - sz) <= 3
                                      ? "border-accent bg-accent/15 text-accent"
                                      : "border-border/60 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                  {sz}px
                                </button>
                              ))}
                              <span className="font-mono font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[11px]">
                                {wmFontSize}px
                              </span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="14"
                            max="120"
                            step="2"
                            value={wmFontSize}
                            onChange={(e: any) => setWmFontSize(Number(e.target.value))}
                            className="w-full accent-foreground cursor-pointer h-1.5"
                          />
                        </div>
                      </div>

                      {/* Row 3: Color + Outline + Background Pill */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 shadow-2xs">
                            <input
                              type="color"
                              value={wmColor}
                              onChange={(e: any) => setWmColor(e.target.value)}
                              className="h-6 w-6 rounded border-0 cursor-pointer bg-transparent p-0"
                              title="Pick custom color"
                            />
                            <span className="font-mono text-[11px] font-bold pr-1">{wmColor.toUpperCase()}</span>
                          </div>

                          {/* Quick Swatches */}
                          <div className="flex items-center gap-1">
                            {[
                              { hex: "#ffffff", name: "White" },
                              { hex: "#000000", name: "Black" },
                              { hex: "#ef4444", name: "Red" },
                              { hex: "#f59e0b", name: "Amber" },
                              { hex: "#06b6d4", name: "Cyan" },
                              { hex: "#10b981", name: "Green" },
                            ].map((sw: any) => (
                              <button
                                key={sw.hex}
                                type="button"
                                onClick={() => setWmColor(sw.hex)}
                                className={`h-6 w-6 rounded-lg border transition-transform hover:scale-110 cursor-pointer shadow-2xs ${wmColor.toLowerCase() === sw.hex
                                    ? "scale-110 ring-2 ring-accent ring-offset-1 ring-offset-background"
                                    : "border-border/60"
                                  }`}
                                style={{ backgroundColor: sw.hex }}
                                title={sw.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Outline & Pill Compact Controls */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-2 py-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Outline:</span>
                            <div className="flex items-center gap-0.5">
                              {[
                                { id: "none", label: "Off" },
                                { id: "dark", label: "Dark" },
                                { id: "light", label: "Light" },
                              ].map((st: any) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setWmStroke(st.id as any)}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold cursor-pointer transition-all ${wmStroke === st.id
                                      ? "bg-foreground text-background shadow-2xs font-black"
                                      : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-2 py-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Badge:</span>
                            <div className="flex items-center gap-0.5">
                              {[
                                { id: "none", label: "Off" },
                                { id: "dark_pill", label: "Dark" },
                                { id: "light_pill", label: "Light" },
                              ].map((bg: any) => (
                                <button
                                  key={bg.id}
                                  type="button"
                                  onClick={() => setWmBgBadge(bg.id as any)}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold cursor-pointer transition-all ${wmBgBadge === bg.id
                                      ? "bg-foreground text-background shadow-2xs font-black"
                                      : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                  {bg.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 1 (LOGO): Logo Controls (when wmMode === "logo" and subTab is "style" or "all") */}
                  {wmMode === "logo" && (wmSubTab === "style" || wmSubTab === "all") && (
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs animate-in fade-in-50 duration-150">
                      <input
                        ref={wmLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />

                      {wmLogoSrc ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-12 w-12 shrink-0 rounded-xl border border-border bg-secondary/60 p-1 flex items-center justify-center overflow-hidden">
                              <img src={wmLogoSrc} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-foreground truncate">Custom Logo Active</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => wmLogoInputRef.current?.click()}
                                  className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-extrabold hover:bg-secondary transition-all cursor-pointer"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWmLogoSrc(null);
                                    setWmMode("text");
                                  }}
                                  className="text-[10px] font-bold text-destructive hover:underline cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-muted-foreground">Logo Size Scale:</span>
                              <div className="flex items-center gap-1">
                                {[20, 35, 50, 70].map((sc: any) => (
                                  <button
                                    key={sc}
                                    type="button"
                                    onClick={() => setWmLogoScale(sc)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${Math.abs(wmLogoScale - sc) <= 4
                                        ? "border-accent bg-accent/15 text-accent"
                                        : "border-border/60 text-muted-foreground hover:text-foreground"
                                      }`}
                                  >
                                    {sc}%
                                  </button>
                                ))}
                                <span className="font-mono font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[11px]">
                                  {wmLogoScale}%
                                </span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="80"
                              value={wmLogoScale}
                              onChange={(e: any) => setWmLogoScale(Number(e.target.value))}
                              className="w-full accent-foreground cursor-pointer h-1.5"
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => wmLogoInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/60 p-5 hover:border-foreground hover:bg-secondary/40 transition-all cursor-pointer"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-2xs">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-foreground">Upload Logo or Signature Image</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">PNG with transparency or SVG recommended</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAB 2: POSITION & OPACITY (when subTab is "position" or "all") */}
                  {(wmSubTab === "position" || wmSubTab === "all") && (
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs animate-in fade-in-50 duration-150">
                      {/* Placement: 3x3 Grid & Tile Side-by-Side */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-extrabold text-foreground flex items-center gap-1.5">
                            <Move className="h-3.5 w-3.5 text-accent" />
                            <span>Placement &amp; Tile</span>
                          </label>
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold text-accent uppercase">
                            {wmPosition === "tile"
                              ? "Tiled Pattern"
                              : wmPosition === "custom"
                                ? `Custom (${wmCustomCoord.xPercent}%, ${wmCustomCoord.yPercent}%)`
                                : wmPosition.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                          {/* 3x3 Mini Pad */}
                          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary/50 border border-border/60 shrink-0">
                            {[
                              { id: "top_left", label: "↖", title: "Top Left" },
                              { id: "top_center", label: "↑", title: "Top Center" },
                              { id: "top_right", label: "↗", title: "Top Right" },
                              { id: "middle_left", label: "←", title: "Middle Left" },
                              { id: "center", label: "✛", title: "Center" },
                              { id: "middle_right", label: "→", title: "Middle Right" },
                              { id: "bottom_left", label: "↙", title: "Bottom Left" },
                              { id: "bottom_center", label: "↓", title: "Bottom Center" },
                              { id: "bottom_right", label: "↘", title: "Bottom Right" },
                            ].map((pos: any) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => setWmPosition(pos.id as any)}
                                title={pos.title}
                                className={`h-7 w-7 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${wmPosition === pos.id
                                    ? "border-accent bg-accent text-white shadow-2xs font-black scale-105"
                                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50"
                                  }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>

                          {/* Side Actions: Tile Button + Margin */}
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setWmPosition(wmPosition === "tile" ? "bottom_right" : "tile")}
                              className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${wmPosition === "tile"
                                  ? "border-accent bg-accent/15 text-accent shadow-2xs ring-1 ring-accent/30"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50"
                                }`}
                            >
                              <Grid3X3 className="h-3.5 w-3.5" />
                              <span>{wmPosition === "tile" ? "Tiled Active ✓" : "Tile Across Image"}</span>
                            </button>

                            {/* Margin Slider */}
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                <span>Edge Margin:</span>
                                <span className="font-mono text-foreground font-black">{wmMargin}%</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                disabled={wmPosition === "center" || wmPosition === "tile"}
                                value={wmMargin}
                                onChange={(e: any) => setWmMargin(Number(e.target.value))}
                                className="w-full accent-foreground cursor-pointer disabled:opacity-40 h-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rotation Angle Row */}
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-muted-foreground">Rotation Angle:</span>
                          <div className="flex items-center gap-1">
                            {[
                              { label: "0°", val: 0 },
                              { label: "45°", val: 45 },
                              { label: "-45°", val: -45 },
                              { label: "90°", val: 90 },
                            ].map((ang: any) => (
                              <button
                                key={ang.label}
                                type="button"
                                onClick={() => setWmRotation(ang.val)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${wmRotation === ang.val
                                    ? "border-accent bg-accent/15 text-accent"
                                    : "border-border/60 text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {ang.label}
                              </button>
                            ))}
                            <span className="font-mono font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[11px]">
                              {wmRotation}°
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={wmRotation}
                          onChange={(e: any) => setWmRotation(Number(e.target.value))}
                          className="w-full accent-foreground cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Opacity / Transparency Row */}
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-muted-foreground">Transparency / Opacity:</span>
                          <div className="flex items-center gap-1">
                            {[
                              { label: "20%", val: 0.2 },
                              { label: "50%", val: 0.5 },
                              { label: "70%", val: 0.7 },
                              { label: "100%", val: 1.0 },
                            ].map((pct: any) => (
                              <button
                                key={pct.label}
                                type="button"
                                onClick={() => setWmOpacity(pct.val)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${Math.abs(wmOpacity - pct.val) < 0.05
                                    ? "border-accent bg-accent/15 text-accent"
                                    : "border-border/60 text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {pct.label}
                              </button>
                            ))}
                            <span className="font-mono font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[11px]">
                              {Math.round(wmOpacity * 100)}%
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={Math.round(wmOpacity * 100)}
                          onChange={(e: any) => setWmOpacity(Number(e.target.value) / 100)}
                          className="w-full accent-foreground cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6.1 REMOVE WATERMARK - FULL AUTO AI DETECTION & INPAINTING */}
              {tool.slug === "remove-watermark" && (
                <div className="space-y-5">
                  {/* 1. AI Auto-Detection Target Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                      AI Auto-Detection Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "full_auto", name: "Full Auto AI Scan", desc: "Auto-detects all watermarks, logos & AI sparkles", badge: "Recommended" },
                        { id: "gemini_ai", name: "Gemini AI (Lossless)", desc: "Reverse Alpha Blending: zero blur, exact restoration", badge: "Lossless" },
                        { id: "corners", name: "Corner Logos & Stamps", desc: "Auto-cleans corner watermarks & timestamps", badge: "Corners" },
                        { id: "stock_grid", name: "Stock Photo Grid", desc: "Auto-cleans diagonal tiled crosshatches", badge: "Full Grid" },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setWmRemovalMode(item.id as any)}
                          className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${wmRemovalMode === item.id
                              ? "border-accent bg-accent/10 shadow-md ring-2 ring-accent/30"
                              : "border-border bg-card hover:border-foreground/40 hover:bg-secondary/50"
                            }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-extrabold text-foreground">{item.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent uppercase">
                              {item.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Specialized Gemini Reverse Alpha Settings vs Standard Inpainting Engine */}
                  {wmRemovalMode === "gemini_ai" ? (
                    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Reverse Alpha Blending Active</p>
                          <p className="text-[10px] text-muted-foreground">
                            Mathematically inverts Gemini opacity. Zero smearing, no generative hallucination.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-foreground">
                            Alpha Opacity Strength Gain
                          </label>
                          <span className="text-xs font-mono font-bold text-amber-500">
                            {wmAlphaGain}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="130"
                          value={wmAlphaGain}
                          onChange={(e: any) => setWmAlphaGain(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>Subtle (70%)</span>
                          <span>Standard (100%)</span>
                          <span>Strong (130%)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                        AI Inpainting Engine
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "smart_neural", name: "Smart Neural", sub: "Directional Gradient" },
                          { id: "patch_match", name: "PatchMatch", sub: "Texture Synthesis" },
                          { id: "smooth_diffusion", name: "Smooth Blend", sub: "Clean Diffusion" },
                        ].map((item: any) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setWmInpaintEngine(item.id as any)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${wmInpaintEngine === item.id
                                ? "bg-foreground text-background shadow-md font-black border-foreground scale-[1.02]"
                                : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            <span className="text-xs font-black">{item.name}</span>
                            <span className={`text-[10px] mt-0.5 ${wmInpaintEngine === item.id ? "text-background/80" : "text-muted-foreground"}`}>
                              {item.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Sensitivity / Detection Precision */}
                  <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        {wmRemovalMode === "gemini_ai" ? "Gemini Badge Search Sensitivity" : "Watermark Detection Sensitivity"}
                      </label>
                      <span className="text-xs font-mono font-bold text-accent">
                        <AnimatedCounter value={wmRemovalSensitivity} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="95"
                      value={wmRemovalSensitivity}
                      onChange={(e: any) => setWmRemovalSensitivity(Number(e.target.value))}
                      className="w-full accent-foreground cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Light Sparkle (15%)</span>
                      <span>Balanced (55%)</span>
                      <span>Aggressive (95%)</span>
                    </div>
                  </div>

                  {/* 4. Texture & Grain Preservation Switch */}
                  {wmRemovalMode !== "gemini_ai" && (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-xs">
                      <div>
                        <p className="text-xs font-extrabold text-foreground">Zero Quality Loss &amp; Grain Synthesis</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Synthesizes natural photo grain beneath removed watermark to avoid blurry smudges
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWmPreserveDetails(!wmPreserveDetails)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wmPreserveDetails ? "bg-accent" : "bg-muted"
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wmPreserveDetails ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Info Callout */}
                  <div className="rounded-2xl border border-border/80 bg-background/60 p-3 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Mathematical Reverse Alpha Blending:</strong> Automatically scans and isolates Gemini AI badges, logos, timestamps, and watermarks. 100% of nearby photo elements, clothes, feet, and textures are preserved intact.
                    </span>
                  </div>
                </div>
              )}
    </>
  );
}
