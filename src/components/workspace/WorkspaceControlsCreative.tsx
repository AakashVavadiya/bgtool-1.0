// Settings panels for AI super-resolution, face blur, meme creation, photo filters, binary streams, and square framing.
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

export function WorkspaceControlsCreative(props: any) {
  const {
    tool,
    hasProcessed,
    origSize,
    dimensions,
    upscaleFactor,
    setUpscaleFactor,
    upscaleEngineMode,
    setUpscaleEngineMode,
    upscaleDetailEnhance,
    setUpscaleDetailEnhance,
    upscaleDenoise,
    setUpscaleDenoise,
    upscaleFaceRefinement,
    setUpscaleFaceRefinement,
    faceRegions,
    setFaceRegions,
    faceBlurType,
    setFaceBlurType,
    faceBlurStrength,
    setFaceBlurStrength,
    faceShape,
    setFaceShape,
    isDetectingFaces,
    activeFaceId,
    setActiveFaceId,
    showFaceOutlines,
    setShowFaceOutlines,
    topText,
    setTopText,
    bottomText,
    setBottomText,
    memeFontSize,
    setMemeFontSize,
    memeFontFamily,
    setMemeFontFamily,
    memeTextColor,
    setMemeTextColor,
    memeStrokeWidth,
    setMemeStrokeWidth,
    memeAllCaps,
    setMemeAllCaps,
    memeTextShadow,
    setMemeTextShadow,
    memeTextAlign,
    setMemeTextAlign,
    setMemeTopPosPercent,
    setMemeBottomPosPercent,
    isFontDropdownOpen,
    setIsFontDropdownOpen,
    fontDropdownRef,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    grayscale,
    setGrayscale,
    squareBgMode,
    setSquareBgMode,
    squareBgColor,
    setSquareBgColor,
    squareGradient,
    setSquareGradient,
    squareScale,
    setSquareScale,
    squareBlurAmount,
    setSquareBlurAmount,
    squareCornerRadius,
    setSquareCornerRadius,
    squareShadow,
    setSquareShadow,
    squareExportFormat,
    setSquareExportFormat,
    binaryOutputMode,
    setBinaryOutputMode,
    binaryDelimiter,
    setBinaryDelimiter,
    binaryBitDepth,
    setBinaryBitDepth,
    customBitDepth,
    setCustomBitDepth,
    binaryWithPrefix,
    setBinaryWithPrefix,
    pixelThreshold,
    setPixelThreshold,
    binaryOutputText,
    fullBinaryOutputText,
    isBinaryTruncatedPreview,
    copiedFormat,
    handleAddFaceBox,
    handleDeleteFace,
    updateActiveFace,
    handleAutoDetectFaces,
    copyToClipboard,
    handleDownload,
    formatBytes
  } = props;


  return (
    <>
              {/* 7. UPSCALE IMAGE - SUPER RESOLUTION SUITE */}
              {tool.slug === "upscale-image" && (
                <div className="space-y-5">
                  {/* 1. Multiplier Selector with Dimension Prediction */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        AI Upscale Multiplier
                      </label>
                      {dimensions.width > 0 && dimensions.height > 0 && (
                        <span className="text-[11px] font-mono font-bold text-accent">
                          {dimensions.width * upscaleFactor} × {dimensions.height * upscaleFactor} px
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { factor: 2, label: "2X HD", sub: "200% Scale" },
                        { factor: 4, label: "4X 4K", sub: "400% Ultra HD" },
                      ].map((item: any) => (
                        <button
                          key={item.factor}
                          type="button"
                          onClick={() => setUpscaleFactor(item.factor)}
                          className={`flex flex-col items-center justify-center rounded-2xl border py-3.5 px-3 text-center transition-all cursor-pointer ${upscaleFactor === item.factor
                              ? "bg-foreground text-background shadow-lg scale-[1.02] border-foreground font-black"
                              : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-sm font-black">{item.label}</span>
                          <span className={`text-[11px] font-semibold mt-0.5 ${upscaleFactor === item.factor ? "text-background/80" : "text-muted-foreground"}`}>
                            {item.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Super-Resolution Engine AI Model Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                      AI Super-Resolution Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { mode: "universal", name: "Balanced Super-HD", desc: "General photos & graphics" },
                        { mode: "photo", name: "Photo & Portrait", desc: "Natural skin, eyes & depth" },
                        { mode: "anime", name: "Anime & Digital Art", desc: "Razor-sharp line art & flats" },
                        { mode: "text", name: "Text & Documents", desc: "High contrast typography" },
                      ].map((item: any) => (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => setUpscaleEngineMode(item.mode as any)}
                          className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${upscaleEngineMode === item.mode
                              ? "border-accent bg-accent/10 shadow-md ring-2 ring-accent/30"
                              : "border-border bg-card hover:border-foreground/40 hover:bg-secondary/50"
                            }`}
                        >
                          <span className="text-xs font-extrabold text-foreground">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Detail & Texture Synthesis Strength */}
                  <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Detail & Texture Recovery
                      </label>
                      <span className="text-xs font-mono font-bold text-accent">
                        <AnimatedCounter value={upscaleDetailEnhance} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={upscaleDetailEnhance}
                      onChange={(e: any) => setUpscaleDetailEnhance(Number(e.target.value))}
                      className="w-full accent-foreground cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Subtle (20%)</span>
                      <span>Balanced (80%)</span>
                      <span>Extreme (100%)</span>
                    </div>
                  </div>

                  {/* 4. Denoise & JPEG Compression Artifact Reduction */}
                  <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Denoise & Artifact Cleanup
                      </label>
                      <span className="text-xs font-mono font-bold text-accent">
                        <AnimatedCounter value={upscaleDenoise} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={upscaleDenoise}
                      onChange={(e: any) => setUpscaleDenoise(Number(e.target.value))}
                      className="w-full accent-foreground cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Off (0%)</span>
                      <span>Clean (40%)</span>
                      <span>Heavy (100%)</span>
                    </div>
                  </div>

                  {/* 5. Smart Micro-Contrast & Edge Clarity Switch */}
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-xs">
                    <div>
                      <p className="text-xs font-extrabold text-foreground">Smart Micro-Contrast & Clarity</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Enhances fine facial features, eye reflections and micro-textures
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpscaleFaceRefinement(!upscaleFaceRefinement)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${upscaleFaceRefinement ? "bg-accent" : "bg-muted"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${upscaleFaceRefinement ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Info Callout */}
                  <div className="rounded-2xl border border-border/80 bg-background/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Super-Resolution AI Engine:</strong> Uses multi-pass directional Sobel gradient reconstruction and bilateral edge filtering to reconstruct genuine high-definition clarity up to 4K Ultra-HD.
                  </div>
                </div>
              )}

              {/* 8. BLUR FACE / LOCALIZED ANONYMIZATION CONTROLS (COMPACT & PROPERLY ALIGNED) */}
              {tool.slug === "blur-face" && (() => {
                const selectedFace = faceRegions.find((f: any) => f.id === activeFaceId) || faceRegions[0];

                return (
                  <div className="space-y-3">
                    {/* 1. Header Toolbar: Status, Detection & Controls */}
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent font-bold">
                          {isDetectingFaces ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-foreground truncate">
                              {faceRegions.length === 0 ? "No Faces" : `${faceRegions.length} ${faceRegions.length === 1 ? "Region" : "Regions"}`}
                            </span>
                            <span className="rounded-md bg-accent/20 text-accent text-[9px] font-mono font-black px-1.5 py-0.2">
                              {faceRegions.length > 0 ? "Active" : "Ready"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={handleAutoDetectFaces}
                          disabled={isDetectingFaces}
                          className="flex items-center gap-1 rounded-lg bg-foreground text-background px-2 py-1 text-[11px] font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          title="Auto-detect faces with AI"
                        >
                          <Wand2 className="h-3 w-3 text-accent" />
                          <span className="hidden sm:inline">Auto-Detect</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddFaceBox}
                          className="flex items-center gap-1 rounded-lg bg-accent text-accent-foreground px-2 py-1 text-[11px] font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                          title="Add a custom blur box"
                        >
                          <Plus className="h-3 w-3 stroke-[3]" />
                          <span>Add</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowFaceOutlines((prev: any) => !prev)}
                          className={`flex items-center justify-center h-6 w-6 rounded-lg border transition-colors cursor-pointer ${showFaceOutlines
                              ? "border-accent/40 bg-accent/15 text-accent"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          title={showFaceOutlines ? "Hide outlines" : "Show adjustment handles"}
                        >
                          {showFaceOutlines ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>

                        {faceRegions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFaceRegions([]);
                              setActiveFaceId(null);
                              toast.info("Cleared all blur regions.");
                            }}
                            className="text-[11px] font-bold text-red-500 hover:text-red-600 px-1.5 py-1 rounded transition-colors cursor-pointer"
                            title="Clear all"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Manual Region Adjustments (Compact 2x2 Grid + Quick Presets) */}
                    {faceRegions.length > 0 && selectedFace && (
                      <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2.5 shadow-xs">
                        {/* Selector tabs & quick presets in single row */}
                        <div className="flex items-center justify-between gap-1 border-b border-border/60 pb-2">
                          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                            {faceRegions.map((f: any, i: any) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setActiveFaceId(f.id);
                                  setShowFaceOutlines(true);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${(activeFaceId === f.id || (!activeFaceId && i === 0))
                                    ? "bg-accent text-accent-foreground shadow-xs"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                #{i + 1}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddFaceBox}
                              className="px-1.5 py-0.5 rounded-md border border-dashed border-border hover:border-foreground text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                              title="Add region"
                            >
                              <Plus className="h-2.5 w-2.5 inline" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-semibold hidden sm:inline">Size:</span>
                            {[
                              { label: "Tight", w: 18, h: 22 },
                              { label: "Med", w: 24, h: 28 },
                              { label: "Large", w: 32, h: 38 },
                            ].map((preset: any) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateActiveFace({ w: preset.w, h: preset.h })}
                                className="px-1.5 py-0.5 rounded border border-border bg-secondary/50 hover:bg-secondary text-[10px] font-bold text-foreground transition-colors cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleDeleteFace(selectedFace.id)}
                              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer ml-0.5"
                              title="Delete active region"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Compact 2-Column Controls: [Width & Height] and [Pos X & Pos Y] */}
                        <div className="grid grid-cols-2 gap-3 pt-0.5">
                          {/* Column 1: Size (Width & Height) */}
                          <div className="space-y-2">
                            {/* Width */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-foreground mb-0.5">
                                <span>Width</span>
                                <span className="font-mono text-accent text-[11px] font-black">{Math.round(selectedFace.w)}%</span>
                              </div>
                              <input
                                type="range"
                                min="4"
                                max="90"
                                value={Math.round(selectedFace.w)}
                                onChange={(e: any) => updateActiveFace({ w: Number(e.target.value) })}
                                className="w-full accent-accent cursor-pointer h-1"
                              />
                            </div>

                            {/* Height */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-foreground mb-0.5">
                                <span>Height</span>
                                <span className="font-mono text-accent text-[11px] font-black">{Math.round(selectedFace.h)}%</span>
                              </div>
                              <input
                                type="range"
                                min="4"
                                max="90"
                                value={Math.round(selectedFace.h)}
                                onChange={(e: any) => updateActiveFace({ h: Number(e.target.value) })}
                                className="w-full accent-accent cursor-pointer h-1"
                              />
                            </div>
                          </div>

                          {/* Column 2: Position (X & Y) */}
                          <div className="space-y-2">
                            {/* Pos X */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-foreground mb-0.5">
                                <span>Pos X</span>
                                <span className="font-mono text-accent text-[11px] font-black">{Math.round(selectedFace.x)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={Math.max(0, 100 - selectedFace.w)}
                                value={Math.round(selectedFace.x)}
                                onChange={(e: any) => updateActiveFace({ x: Number(e.target.value) })}
                                className="w-full accent-accent cursor-pointer h-1"
                              />
                            </div>

                            {/* Pos Y */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-foreground mb-0.5">
                                <span>Pos Y</span>
                                <span className="font-mono text-accent text-[11px] font-black">{Math.round(selectedFace.y)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={Math.max(0, 100 - selectedFace.h)}
                                value={Math.round(selectedFace.y)}
                                onChange={(e: any) => updateActiveFace({ y: Number(e.target.value) })}
                                className="w-full accent-accent cursor-pointer h-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Style & Shape in 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Anonymization Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Style
                        </label>
                        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-1 border border-border/60">
                          {[
                            { id: "gaussian", name: "Blur" },
                            { id: "pixelate", name: "Pixel" },
                            { id: "blackout", name: "Black" },
                          ].map((st: any) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setFaceBlurType(st.id as any)}
                              className={`py-1 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${faceBlurType === st.id
                                  ? "bg-foreground text-background shadow-xs font-black"
                                  : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {st.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mask Shape */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Shape
                        </label>
                        <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1 border border-border/60">
                          {[
                            { id: "ellipse", name: "Oval / Ellipse" },
                            { id: "rect", name: "Rectangle" },
                          ].map((sh: any) => (
                            <button
                              key={sh.id}
                              type="button"
                              onClick={() => setFaceShape(sh.id as any)}
                              className={`py-1 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${faceShape === sh.id
                                  ? "bg-foreground text-background shadow-xs font-black"
                                  : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {sh.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 4. Blur Intensity (Compact) */}
                    {faceBlurType !== "blackout" && (
                      <div className="space-y-1.5 rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-foreground">
                            {faceBlurType === "pixelate" ? "Mosaic Block Intensity" : "Blur Strength"}
                          </span>
                          <span className="font-mono font-black text-accent text-xs">
                            <AnimatedCounter value={faceBlurStrength} suffix="%" />
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="5"
                            max="50"
                            step="1"
                            value={faceBlurStrength}
                            onChange={(e: any) => setFaceBlurStrength(Number(e.target.value))}
                            className="w-full accent-accent cursor-pointer h-1.5"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            {[
                              { label: "15%", val: 15 },
                              { label: "25%", val: 25 },
                              { label: "40%", val: 40 },
                            ].map((preset: any) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setFaceBlurStrength(preset.val)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${faceBlurStrength === preset.val
                                    ? "bg-foreground text-background"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Minimal Help Tip */}
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                      <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span>Drag blur on photo to move, or drag handles to resize.</span>
                    </div>
                  </div>
                );
              })()}

              {/* 9. MEME GENERATOR SUITE (Compact & Space-Optimized) */}
              {tool.slug === "meme-generator" && (
                <div className="space-y-2.5">
                  {/* Top & Bottom Text Inputs Card */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-2.5 space-y-2 shadow-xs">
                    {/* Top Caption Row */}
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-black">
                        T
                      </span>
                      <input
                        type="text"
                        value={topText}
                        onChange={(e: any) => setTopText(e.target.value)}
                        placeholder="Top caption text..."
                        className="flex-1 min-w-0 rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:border-accent focus:outline-none transition-all placeholder:text-muted-foreground/50 placeholder:font-normal"
                      />
                      {topText && (
                        <button
                          type="button"
                          onClick={() => setTopText("")}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
                          title="Clear top caption"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Bottom Caption Row */}
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-black">
                        B
                      </span>
                      <input
                        type="text"
                        value={bottomText}
                        onChange={(e: any) => setBottomText(e.target.value)}
                        placeholder="Bottom caption text..."
                        className="flex-1 min-w-0 rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:border-accent focus:outline-none transition-all placeholder:text-muted-foreground/50 placeholder:font-normal"
                      />
                      {bottomText && (
                        <button
                          type="button"
                          onClick={() => setBottomText("")}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
                          title="Clear bottom caption"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Inspiration (Single Line Scrolling Chips) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
                      Templates:
                    </span>
                    {[
                      { label: "Bug Fix", top: "WHEN YOU FIX THE BUG", bottom: "WITHOUT BREAKING ANYTHING" },
                      { label: "One Does Not", top: "ONE DOES NOT SIMPLY", bottom: "WRITE CODE WITHOUT BUGS" },
                      { label: "Expectation", top: "EXPECTATION", bottom: "REALITY" },
                      { label: "Wait, Illegal", top: "WAIT,", bottom: "THAT'S ILLEGAL" },
                      { label: "3 AM", top: "NOBODY:", bottom: "ME AT 3 AM:" },
                      { label: "POV", top: "POV:", bottom: "IT FINALLY WORKS" },
                    ].map((item: any, idx: any) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopText(item.top);
                          setBottomText(item.bottom);
                          toast.success("Loaded meme template!");
                        }}
                        className="shrink-0 rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Font Style & Size (Compact Unified Card) */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-2.5 space-y-2 shadow-xs">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      {/* Custom Font Selector */}
                      <div ref={fontDropdownRef} className="relative">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                          Font Style
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsFontDropdownOpen((prev: any) => !prev)}
                          className={`w-full rounded-xl border bg-card px-2.5 py-1.5 text-xs font-black text-foreground hover:border-accent hover:bg-accent/5 focus:border-accent focus:outline-none transition-all flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs ${isFontDropdownOpen ? "border-accent ring-2 ring-accent/20" : "border-input"
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-xs truncate font-black"
                              style={{ fontFamily: memeFontFamily }}
                            >
                              {MEME_FONTS.find((f: any) => f.val === memeFontFamily)?.label || "Impact"}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground shrink-0">
                              {MEME_FONTS.find((f: any) => f.val === memeFontFamily)?.badge || "Meme"}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isFontDropdownOpen ? "rotate-180 text-accent" : ""
                              }`}
                          />
                        </button>

                        {/* Custom Floating Font Options Menu */}
                        {isFontDropdownOpen && (
                          <div className="absolute left-0 w-64 top-full mt-1.5 z-50 rounded-2xl border-2 border-border bg-card/98 backdrop-blur-xl shadow-2xl p-1.5 space-y-1 animate-scale-up max-h-64 overflow-y-auto">
                            {MEME_FONTS.map((f: any) => {
                              const isSelected = memeFontFamily === f.val;
                              return (
                                <button
                                  key={f.label}
                                  type="button"
                                  onClick={() => {
                                    setMemeFontFamily(f.val);
                                    setIsFontDropdownOpen(false);
                                  }}
                                  className={`w-full rounded-xl px-2.5 py-2 flex items-center justify-between text-left transition-all cursor-pointer ${isSelected
                                      ? "bg-accent/15 text-accent font-black border border-accent/30 shadow-xs"
                                      : "text-foreground hover:bg-secondary/80 hover:text-foreground"
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-black border border-border/40"
                                      style={{ fontFamily: f.val }}
                                    >
                                      Aa
                                    </span>
                                    <div className="min-w-0">
                                      <p
                                        className="text-xs font-black truncate leading-tight"
                                        style={{ fontFamily: f.val }}
                                      >
                                        {f.label}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                                        {f.desc}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-accent shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            Text Size
                          </label>
                          <span className="font-mono text-[11px] font-black text-accent">{memeFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="90"
                          step="2"
                          value={memeFontSize}
                          onChange={(e: any) => setMemeFontSize(Number(e.target.value))}
                          className="w-full accent-foreground cursor-pointer h-1.5"
                        />
                      </div>
                    </div>

                    {/* Quick Size Presets */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0 mr-1">Presets:</span>
                      {[
                        { label: "Small (28)", val: 28 },
                        { label: "Medium (44)", val: 44 },
                        { label: "Large (62)", val: 62 },
                        { label: "Huge (80)", val: 80 },
                      ].map((s: any) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setMemeFontSize(s.val)}
                          className={`flex-1 py-1 rounded-lg border text-center text-[10px] font-bold transition-all cursor-pointer ${memeFontSize === s.val
                              ? "border-foreground bg-foreground text-background shadow-xs font-black"
                              : "border-border bg-card text-muted-foreground hover:border-foreground"
                            }`}
                        >
                          {s.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors, Stroke & Formatting (Compact Unified Card) */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-2.5 space-y-2 shadow-xs">
                    {/* Row 1: Text Color Swatches & Stroke Width */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Color Swatches */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mr-0.5">
                          Color:
                        </span>
                        {[
                          { color: "#ffffff", label: "White" },
                          { color: "#fde047", label: "Yellow" },
                          { color: "#38bdf8", label: "Sky" },
                          { color: "#4ade80", label: "Lime" },
                          { color: "#f472b6", label: "Pink" },
                          { color: "#000000", label: "Black" },
                        ].map((c: any) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setMemeTextColor(c.color)}
                            className={`h-5 w-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${memeTextColor.toLowerCase() === c.color.toLowerCase()
                                ? "ring-2 ring-accent scale-110 shadow-xs"
                                : "border-black/20 hover:scale-105"
                              }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          >
                            {memeTextColor.toLowerCase() === c.color.toLowerCase() && (
                              <Check className={`h-2.5 w-2.5 ${c.color === "#ffffff" || c.color === "#fde047" ? "text-black" : "text-white"}`} />
                            )}
                          </button>
                        ))}
                        <input
                          type="color"
                          value={memeTextColor}
                          onChange={(e: any) => setMemeTextColor(e.target.value)}
                          className="h-5 w-5 rounded-full cursor-pointer border-0 bg-transparent p-0 ml-1"
                          title="Custom color"
                        />
                      </div>

                      {/* Stroke Width Selector */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mr-1">
                          Stroke:
                        </span>
                        {[
                          { label: "None", val: 0 },
                          { label: "Thin", val: 2 },
                          { label: "Classic", val: 4 },
                          { label: "Thick", val: 7 },
                        ].map((sw: any) => (
                          <button
                            key={sw.label}
                            type="button"
                            onClick={() => setMemeStrokeWidth(sw.val)}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${memeStrokeWidth === sw.val
                                ? "bg-foreground text-background shadow-xs font-black border-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-foreground"
                              }`}
                          >
                            {sw.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: Alignment, CAPS, Shadow & Reset */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                      {/* Alignment */}
                      <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                        <button
                          type="button"
                          onClick={() => setMemeTextAlign("left")}
                          className={`p-1 rounded text-xs transition-all cursor-pointer ${memeTextAlign === "left" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                          title="Align Left"
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemeTextAlign("center")}
                          className={`p-1 rounded text-xs transition-all cursor-pointer ${memeTextAlign === "center" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                          title="Align Center"
                        >
                          <AlignCenter className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemeTextAlign("right")}
                          className={`p-1 rounded text-xs transition-all cursor-pointer ${memeTextAlign === "right" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                          title="Align Right"
                        >
                          <AlignRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* CAPS Toggle */}
                      <button
                        type="button"
                        onClick={() => setMemeAllCaps(!memeAllCaps)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${memeAllCaps
                            ? "bg-foreground text-background shadow-xs border-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground"
                          }`}
                      >
                        CAPS: {memeAllCaps ? "ON" : "OFF"}
                      </button>

                      {/* Shadow Toggle */}
                      <button
                        type="button"
                        onClick={() => setMemeTextShadow(!memeTextShadow)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${memeTextShadow
                            ? "bg-foreground text-background shadow-xs border-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground"
                          }`}
                      >
                        Shadow: {memeTextShadow ? "ON" : "OFF"}
                      </button>

                      {/* Reset Positions */}
                      <button
                        type="button"
                        onClick={() => {
                          setMemeTopPosPercent(4);
                          setMemeBottomPosPercent(4);
                          toast.info("Reset text positions to default.");
                        }}
                        className="text-[10px] text-muted-foreground hover:text-accent font-bold cursor-pointer underline ml-auto"
                        title="Reset text positions to top and bottom edges"
                      >
                        Reset Pos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. PHOTO EDITOR */}
              {tool.slug === "photo-editor" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>Brightness</span>{" "}
                      <span>
                        <AnimatedCounter value={brightness} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e: any) => setBrightness(Number(e.target.value))}
                      className="w-full accent-foreground"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>Contrast</span>{" "}
                      <span>
                        <AnimatedCounter value={contrast} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e: any) => setContrast(Number(e.target.value))}
                      className="w-full accent-foreground"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>Grayscale</span>{" "}
                      <span>
                        <AnimatedCounter value={grayscale} suffix="%" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e: any) => setGrayscale(Number(e.target.value))}
                      className="w-full accent-foreground"
                    />
                  </div>
                </div>
              )}


              {/* 12. IMAGE TO BINARY / BASE64 */}
              {tool.slug === "image-to-binary" && (
                <div className="space-y-4">
                  {/* 1. Convert To Format Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground block">
                        Target Binary Format
                      </label>
                      {origSize > 0 && (
                        <span className="text-[10px] font-bold text-accent">
                          {formatBytes(origSize)} ({origSize.toLocaleString()} bytes)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "Binary", label: "Binary (0/1)" },
                        { id: "Hexadecimal", label: "Hex (HEX)" },
                        { id: "Base64", label: "Base64" },
                        { id: "C-Array", label: "C / C++ Array" },
                        { id: "Pixel-Matrix", label: "Pixel 1-Bit" },
                        { id: "Decimal", label: "Decimal" },
                        { id: "Octal", label: "Octal" },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBinaryOutputMode(item.id as any)}
                          className={`rounded-xl border py-2 px-1 text-center text-[11px] font-extrabold transition-all cursor-pointer ${binaryOutputMode === item.id
                              ? "bg-foreground text-background shadow-md scale-[1.02]"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Delimiter Selector (for applicable modes) */}
                  {!["Base64", "C-Array", "Pixel-Matrix"].includes(binaryOutputMode) && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground block">
                        Byte / Element Delimiter
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: "Space", label: "Space ( )" },
                          { id: "Comma", label: "Comma (,)" },
                          { id: "Newline", label: "New Line (\\n)" },
                          { id: "None", label: "None (Solid)" },
                        ].map((delim: any) => (
                          <button
                            key={delim.id}
                            type="button"
                            onClick={() => setBinaryDelimiter(delim.id as any)}
                            className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${binaryDelimiter === delim.id
                                ? "bg-foreground text-background shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            {delim.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Bit Depth / Prefix Options for Binary Mode */}
                  {binaryOutputMode === "Binary" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground block">
                          Bit Grouping / Word Depth
                        </label>
                        <span className="text-[10px] font-mono font-bold text-accent">
                          {binaryBitDepth === "Custom" ? `${customBitDepth}-Bit (Custom)` : binaryBitDepth}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: "4 Bit (Nibble)", label: "4-Bit (Nibble)" },
                          { id: "8 Bit (Byte)", label: "8-Bit (Byte)" },
                          { id: "16 Bit (Word)", label: "16-Bit (Word)" },
                          { id: "32 Bit (DWord)", label: "32-Bit" },
                          { id: "64 Bit (QWord)", label: "64-Bit" },
                          { id: "128 Bit (SIMD)", label: "128-Bit" },
                          { id: "256 Bit (Block)", label: "256-Bit" },
                          { id: "Custom", label: "⚙️ Custom" },
                        ].map((bit: any) => (
                          <button
                            key={bit.id}
                            type="button"
                            onClick={() => setBinaryBitDepth(bit.id)}
                            className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${binaryBitDepth === bit.id
                                ? "bg-foreground text-background shadow-xs font-black"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            {bit.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Bit Depth Input */}
                      {binaryBitDepth === "Custom" && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
                          <label className="text-xs font-bold text-foreground whitespace-nowrap">
                            Custom Bits per Chunk:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1024}
                            value={customBitDepth}
                            onChange={(e: any) =>
                              setCustomBitDepth(Math.max(1, Math.min(1024, Number(e.target.value) || 8)))
                            }
                            className="w-24 rounded-xl border-2 border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:border-accent focus:outline-none"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            1–1024 bits
                          </span>
                        </div>
                      )}

                      {/* 0b Prefix Toggle */}
                      <label className="flex items-center gap-2 p-2 rounded-xl border border-border bg-background/60 cursor-pointer hover:border-foreground transition-all">
                        <input
                          type="checkbox"
                          checked={binaryWithPrefix}
                          onChange={(e: any) => setBinaryWithPrefix(e.target.checked)}
                          className="h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                        <span className="text-xs font-bold text-foreground">
                          Include binary prefix (<code className="text-accent font-mono">0b</code> e.g. 0b01001001)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* 3b. Hexadecimal Prefix Option */}
                  {binaryOutputMode === "Hexadecimal" && (
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-border bg-background/60 cursor-pointer hover:border-foreground transition-all">
                      <input
                        type="checkbox"
                        checked={binaryWithPrefix}
                        onChange={(e: any) => setBinaryWithPrefix(e.target.checked)}
                        className="h-4 w-4 rounded accent-foreground cursor-pointer"
                      />
                      <span className="text-xs font-bold text-foreground">
                        Include hex prefix (<code className="text-accent font-mono">0x</code> e.g. 0x89, 0x50)
                      </span>
                    </label>
                  )}

                  {/* 3c. Pixel 1-Bit Matrix Threshold Slider */}
                  {binaryOutputMode === "Pixel-Matrix" && (
                    <div className="space-y-2 p-3 rounded-2xl border border-border bg-card">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Black &amp; White Pixel Threshold</span>
                        <span className="text-accent font-mono">
                          {pixelThreshold} ({Math.round((pixelThreshold / 255) * 100)}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="254"
                        value={pixelThreshold}
                        onChange={(e: any) => setPixelThreshold(Number(e.target.value))}
                        className="w-full accent-foreground cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Converts actual image canvas pixels into 0 (light) and 1 (dark) monochrome binary bitmap.
                      </p>
                    </div>
                  )}

                  {/* 4. Generated Output Code Box */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block">
                          Accurate Binary Output ({binaryOutputMode})
                        </label>
                        <span className="text-[10px] font-semibold text-accent block">
                          {isBinaryTruncatedPreview
                            ? "Displaying preview · Copy or Download exports 100% full dataset"
                            : "Complete 100% data ready to copy or download"}
                        </span>
                      </div>
                      {binaryOutputText && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(fullBinaryOutputText || binaryOutputText, binaryOutputMode)}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                          >
                            {copiedFormat === binaryOutputMode ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-accent" />
                            )}
                            <span>{copiedFormat === binaryOutputMode ? "Copied!" : "Copy Full Output"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {hasProcessed && binaryOutputText ? (
                      <div className="space-y-2">
                        <textarea
                          rows={7}
                          value={binaryOutputText}
                          readOnly
                          onClick={(e: any) => {
                            (e.target as HTMLTextAreaElement).select();
                            copyToClipboard(fullBinaryOutputText || binaryOutputText, binaryOutputMode);
                          }}
                          title="Click anywhere to select all and copy 100% complete data to clipboard"
                          className="w-full cursor-pointer rounded-2xl border-2 border-border bg-background p-3.5 text-xs font-mono leading-relaxed focus:border-accent focus:outline-none break-all"
                        />

                        {/* Quick Code Exporters */}
                        <div className="grid grid-cols-2 gap-2">
                          {binaryOutputMode === "Base64" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(`<img src="${fullBinaryOutputText || binaryOutputText}" alt="Embedded Image" />`, "HTML Tag")
                                }
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 px-2.5 text-[11px] font-bold hover:border-foreground transition-all cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-accent" /> Copy &lt;img&gt; Tag
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(`background-image: url("${fullBinaryOutputText || binaryOutputText}");`, "CSS Code")
                                }
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 px-2.5 text-[11px] font-bold hover:border-foreground transition-all cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-accent" /> Copy CSS Code
                              </button>
                            </>
                          )}

                          {binaryOutputMode !== "Base64" && (
                            <>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fullBinaryOutputText || binaryOutputText, "Raw Data")}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 px-2.5 text-[11px] font-bold hover:border-foreground transition-all cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-accent" /> Copy All ({binaryOutputMode})
                              </button>
                              <button
                                type="button"
                                onClick={handleDownload}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 px-2.5 text-[11px] font-bold hover:border-foreground transition-all cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5 text-accent" /> Download .{binaryOutputMode === "C-Array" ? "h" : "txt"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-center">
                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                          Select your target format &amp; options above, then click <strong className="text-foreground">Convert / Process Image</strong> below to generate binary output.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 13. SQUARE YOUR IMAGE CONTROLS */}
              {tool.slug === "square-your-image" && (
                <div className="space-y-2.5">
                  {/* Aspect Ratio & Dimensions Info Banner */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 px-3 py-1.5 text-xs shadow-2xs">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Original: <strong className="text-foreground font-mono">{dimensions.width}×{dimensions.height}px</strong>
                    </span>
                    <span className="rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-black text-accent">
                      1:1 Target ({Math.max(dimensions.width || 0, dimensions.height || 0)}×{Math.max(dimensions.width || 0, dimensions.height || 0)}px)
                    </span>
                  </div>

                  {/* 1. Background Fill Mode Segmented Selector */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Background Fill Mode
                      </label>
                      <span className="text-[10px] font-semibold text-accent capitalize">{squareBgMode}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-background border border-border shadow-2xs">
                      {[
                        { id: "blur", label: "Blur", icon: Wand2 },
                        { id: "color", label: "Color", icon: Palette },
                        { id: "gradient", label: "Gradient", icon: Layers },
                        { id: "transparent", label: "Clear", icon: Grid3X3 },
                        { id: "fit", label: "1:1 Fill", icon: Maximize2 },
                      ].map((item: any) => {
                        const Icon = item.icon;
                        const isSelected = squareBgMode === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSquareBgMode(item.id as any)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-0.5 text-center text-[10px] font-black transition-all cursor-pointer ${isSelected
                                ? "bg-foreground text-background shadow-xs scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                              }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate w-full text-center leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Mode-Specific Options (Compact Card) */}
                  {squareBgMode === "blur" && (
                    <div className="space-y-1.5 p-2 rounded-xl bg-muted/20 border border-border/80">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Blur Intensity</label>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[
                              { label: "Soft", val: 12 },
                              { label: "Medium", val: 25 },
                              { label: "Strong", val: 45 },
                            ].map((preset: any) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => setSquareBlurAmount(preset.val)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${squareBlurAmount === preset.val
                                    ? "bg-foreground text-background border-foreground shadow-2xs"
                                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <span className="font-mono text-[11px] font-black text-accent w-9 text-right">{squareBlurAmount}px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        step={1}
                        value={squareBlurAmount}
                        onChange={(e: any) => setSquareBlurAmount(Number(e.target.value))}
                        className="w-full accent-accent cursor-pointer h-1.5"
                      />
                    </div>
                  )}

                  {squareBgMode === "color" && (
                    <div className="space-y-1.5 p-2 rounded-xl bg-muted/20 border border-border/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">
                          Background Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={squareBgColor}
                            onChange={(e: any) => setSquareBgColor(e.target.value)}
                            className="h-5 w-6 cursor-pointer rounded border border-border bg-transparent p-0"
                            title="Choose custom color"
                          />
                          <input
                            type="text"
                            value={squareBgColor}
                            onChange={(e: any) => setSquareBgColor(e.target.value)}
                            placeholder="#ffffff"
                            className="w-20 rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-mono font-bold text-foreground uppercase"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {SQUARE_COLOR_PRESETS.map((color: any) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setSquareBgColor(color.value)}
                            title={color.name}
                            className={`h-5 w-full rounded-md border flex items-center justify-center transition-all cursor-pointer ${squareBgColor.toLowerCase() === color.value.toLowerCase()
                                ? "border-foreground ring-2 ring-foreground/20 scale-105 shadow-2xs"
                                : "border-border/80 hover:scale-105"
                              }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {squareBgColor.toLowerCase() === color.value.toLowerCase() && (
                              <Check
                                className={`h-2.5 w-2.5 ${color.value === "#ffffff" || color.value === "#f8fafc" || color.value === "#e2e8f0"
                                    ? "text-black"
                                    : "text-white"
                                  }`}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {squareBgMode === "gradient" && (
                    <div className="space-y-1.5 p-2 rounded-xl bg-muted/20 border border-border/80">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground block">
                        Gradient Presets
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[105px] overflow-y-auto pr-1">
                        {SQUARE_GRADIENT_PRESETS.map((grad: any) => (
                          <button
                            key={grad.name}
                            type="button"
                            onClick={() => setSquareGradient(grad.value)}
                            className={`flex items-center gap-2 p-1 rounded-lg border text-left transition-all cursor-pointer ${squareGradient === grad.value
                                ? "border-foreground bg-card ring-1 ring-foreground/30 shadow-2xs"
                                : "border-border/80 bg-card/60 hover:bg-card hover:border-foreground/40"
                              }`}
                          >
                            <div
                              className="h-4 w-4 rounded-md shrink-0 border border-black/10 shadow-2xs"
                              style={{ background: grad.value }}
                            />
                            <span className="text-[10px] font-bold text-foreground truncate">
                              {grad.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {squareBgMode === "transparent" && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Grid3X3 className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] font-medium leading-tight">
                        Keeps transparent background. Recommended export: <strong>PNG</strong> or <strong>WebP</strong>.
                      </span>
                    </div>
                  )}

                  {squareBgMode === "fit" && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] font-medium leading-tight">
                        Center crops photo to 1:1 full bleed without margins or borders.
                      </span>
                    </div>
                  )}

                  {/* 3. Photo Scale / Inset Padding (only if not fit mode) */}
                  {squareBgMode !== "fit" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Photo Scale / Inset</label>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[
                              { label: "100%", val: 100 },
                              { label: "90%", val: 90 },
                              { label: "80%", val: 80 },
                              { label: "70%", val: 70 },
                            ].map((preset: any) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => setSquareScale(preset.val)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${squareScale === preset.val
                                    ? "bg-foreground text-background border-foreground shadow-2xs"
                                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <span className="font-mono text-[11px] font-black text-accent w-9 text-right">{squareScale}%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        step={1}
                        value={squareScale}
                        onChange={(e: any) => setSquareScale(Number(e.target.value))}
                        className="w-full accent-accent cursor-pointer h-1.5"
                      />
                    </div>
                  )}

                  {/* 4. Combined 2-Column: Corner Radius & Shadow */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Corner Radius */}
                    <div className="space-y-1 p-2 rounded-xl bg-muted/15 border border-border/70">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Radius</label>
                        <span className="font-mono text-[10px] font-bold text-accent">
                          {squareCornerRadius === 9999 ? "Circle" : `${squareCornerRadius}px`}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: "0px", val: 0 },
                          { label: "12px", val: 12 },
                          { label: "24px", val: 24 },
                          { label: "●", val: 9999 },
                        ].map((preset: any) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setSquareCornerRadius(preset.val)}
                            title={preset.val === 9999 ? "Circular Crop" : `${preset.val}px corner radius`}
                            className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${squareCornerRadius === preset.val
                                ? "bg-foreground text-background border-foreground shadow-2xs"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shadow Elevation */}
                    <div className="space-y-1 p-2 rounded-xl bg-muted/15 border border-border/70">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Shadow</label>
                        <span className="font-mono text-[10px] font-bold text-accent capitalize">{squareShadow}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "none", label: "None" },
                          { id: "soft", label: "Soft" },
                          { id: "float", label: "Float" },
                          { id: "card", label: "Card" },
                        ].map((s: any) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSquareShadow(s.id as any)}
                            className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${squareShadow === s.id
                                ? "bg-foreground text-background border-foreground shadow-2xs"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. Target Export Format */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Target Export Format
                      </label>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {squareExportFormat === "PNG" ? "Lossless" : squareExportFormat === "JPG" ? "Smaller Size" : "Modern WebP"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["PNG", "JPG", "WEBP"] as const).map((fmt: any) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setSquareExportFormat(fmt)}
                          className={`rounded-xl border py-1.5 text-center text-xs font-black transition-all cursor-pointer ${squareExportFormat === fmt
                              ? "bg-foreground text-background border-foreground shadow-xs scale-[1.01]"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
    </>
  );
}
