// Settings panels for document-to-image rendering (PDF, Word, Excel, PPT, HTML), color picking, and document exports.
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

export function WorkspaceControlsDocuments(props: any) {
  const {
    tool,
    file,
    imageSrc,
    processing,
    ocrLanguage,
    setOcrLanguage,
    ocrCustomLanguage,
    setIsOcrLanguageDialogOpen,
    ocrProgressStatus,
    ocrProgressPercent,
    pickedHex,
    setPickedHex,
    pickedRgb,
    setPickedRgb,
    pickedHsl,
    setPickedHsl,
    colorHistory,
    setColorHistory,
    copiedFormat,
    commonColors,
    isExtractingColors,
    pdfPageSize,
    setPdfPageSize,
    pdfMargin,
    setPdfMargin,
    pdfQuality,
    setPdfQuality,
    wordDocMode,
    setWordDocMode,
    wordFontFamily,
    setWordFontFamily,
    wordFontSize,
    setWordFontSize,
    excelParserMode,
    setExcelParserMode,
    excelHighlightHeader,
    setExcelHighlightHeader,
    excelSheetName,
    setExcelSheetName,
    pptxSlideMode,
    setPptxSlideMode,
    pptxSlideTitle,
    setPptxSlideTitle,
    pptxTheme,
    setPptxTheme,
    pdfDocPage,
    setPdfDocPage,
    pdfTotalPages,
    pdfPageMode,
    setPdfPageMode,
    pdfDpiScale,
    setPdfDpiScale,
    pdfDocOutputFormat,
    setPdfDocOutputFormat,
    pdfBgColor,
    setPdfBgColor,
    pdfIsPasswordProtected,
    pdfIsUnlocked,
    pdfPasswordInput,
    setPdfPasswordInput,
    pdfPasswordError,
    setPdfPasswordError,
    pdfShowPasswordText,
    setPdfShowPasswordText,
    wordDocFont,
    setWordDocFont,
    wordDocFontSize,
    setWordDocFontSize,
    wordDocOutputFormat,
    setWordDocOutputFormat,
    wordDocShowHeader,
    setWordDocShowHeader,
    wordDocPage,
    setWordDocPage,
    wordTotalPages,
    wordPageMode,
    setWordPageMode,
    excelTheme,
    setExcelTheme,
    excelGridLines,
    setExcelGridLines,
    excelDocOutputFormat,
    setExcelDocOutputFormat,
    excelShowHeader,
    setExcelShowHeader,
    excelDocSheet,
    setExcelDocSheet,
    excelTotalSheets,
    excelSheetNames,
    excelSheetMode,
    setExcelSheetMode,
    pptTheme,
    setPptTheme,
    pptDocOutputFormat,
    setPptDocOutputFormat,
    pptDocSlide,
    setPptDocSlide,
    pptTotalSlides,
    pptSlideMode,
    setPptSlideMode,
    pptAspectRatio,
    fileInputRef,
    handleUnlockPdf,
    extractMostCommonColors,
    copyToClipboard,
    openSystemEyeDropper,
    formatBytes
  } = props;


  return (
    <>
              {/* 15.6 PDF TO IMAGE CONTROLS */}
              {tool.slug === "pdf-to-image" && (
                <div className="space-y-6">
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${pdfIsPasswordProtected && !pdfIsUnlocked ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                        }`}>
                        {pdfIsPasswordProtected && !pdfIsUnlocked ? <Lock className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {file ? file.name : "Uploaded PDF Document"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {pdfIsPasswordProtected && !pdfIsUnlocked
                            ? "Password Protected"
                            : file
                              ? `${formatBytes(file.size)} · ${pdfTotalPages} ${pdfTotalPages === 1 ? "page" : "pages"}`
                              : "Ready to convert"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Change PDF</span>
                    </button>
                  </div>

                  {/* Password Protection Card (Shown when locked) */}
                  {pdfIsPasswordProtected && !pdfIsUnlocked ? (
                    <div className="rounded-3xl border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-xs">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-foreground">Document Password Required</h4>
                          <p className="text-[10px] text-muted-foreground">Unlock to view and configure conversion options</p>
                        </div>
                      </div>

                      {pdfPasswordError && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-bold text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          <span>{pdfPasswordError}</span>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="relative">
                          <input
                            type={pdfShowPasswordText ? "text" : "password"}
                            name="pdf-doc-unlock-password-field"
                            id="pdf-doc-unlock-password-field"
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-form-type="other"
                            value={pdfPasswordInput}
                            onChange={(e: any) => {
                              setPdfPasswordInput(e.target.value);
                              setPdfPasswordError(null);
                            }}
                            onKeyDown={(e: any) => {
                              if (e.key === "Enter") handleUnlockPdf();
                            }}
                            placeholder="Enter document password..."
                            className="w-full rounded-xl border-2 border-border bg-background py-2.5 pl-3 pr-9 text-xs font-mono font-bold focus:border-accent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setPdfShowPasswordText((v: any) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                          >
                            {pdfShowPasswordText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleUnlockPdf}
                          disabled={processing || !pdfPasswordInput.trim()}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 px-4 text-xs font-black text-background shadow-md hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5 text-accent" />}
                          <span>Unlock Document</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Password Unlocked Badge */}
                      {pdfIsPasswordProtected && pdfIsUnlocked && (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Unlock className="h-4 w-4 shrink-0" />
                            <span>Document Password Verified &amp; Decrypted</span>
                          </div>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase">
                            Unlocked
                          </span>
                        </div>
                      )}

                      {/* Multi-Page Mode Selector (Only shown when PDF has > 1 page) */}
                      {pdfTotalPages > 1 && (
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground block">
                            Page Conversion Mode:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPdfPageMode("all")}
                              className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all cursor-pointer ${pdfPageMode === "all"
                                  ? "border-accent bg-accent/10 shadow-sm"
                                  : "border-border bg-card/60 hover:border-foreground/50"
                                }`}
                            >
                              <span className={`text-xs font-extrabold inline-flex items-center gap-1.5 ${pdfPageMode === "all" ? "text-accent" : "text-foreground"}`}>
                                <Layers className="h-3.5 w-3.5" />
                                <span>All Pages (ZIP)</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                All {pdfTotalPages} pages in 1 ZIP
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPdfPageMode("single")}
                              className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all cursor-pointer ${pdfPageMode === "single"
                                  ? "border-accent bg-accent/10 shadow-sm"
                                  : "border-border bg-card/60 hover:border-foreground/50"
                                }`}
                            >
                              <span className={`text-xs font-extrabold inline-flex items-center gap-1.5 ${pdfPageMode === "single" ? "text-accent" : "text-foreground"}`}>
                                <FileText className="h-3.5 w-3.5" />
                                <span>Specific Page</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                Direct image file download
                              </span>
                            </button>
                          </div>

                          {/* Specific Single Page Picker */}
                          {pdfPageMode === "single" && (
                            <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-2 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground">Select Page to Convert:</label>
                                <span className="text-[10px] font-mono font-bold text-accent">
                                  Page {pdfDocPage} of {pdfTotalPages}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={pdfDocPage <= 1}
                                  onClick={() => setPdfDocPage((p: any) => Math.max(1, p - 1))}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card font-bold hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  ←
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={pdfTotalPages}
                                  value={pdfDocPage}
                                  onChange={(e: any) => setPdfDocPage(Math.min(pdfTotalPages, Math.max(1, Number(e.target.value) || 1)))}
                                  className="w-full text-center rounded-xl border-2 border-border bg-background py-2 text-xs font-mono font-bold focus:border-accent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={pdfDocPage >= pdfTotalPages}
                                  onClick={() => setPdfDocPage((p: any) => Math.min(pdfTotalPages, p + 1))}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card font-bold hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quality / Resolution DPI */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">
                          Render Quality & Resolution:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { scale: 1.5, label: "150 DPI", sub: "Standard" },
                            { scale: 2.0, label: "300 DPI", sub: "High Res" },
                            { scale: 3.0, label: "600 DPI", sub: "Ultra HD" },
                          ].map((item: any) => (
                            <button
                              key={item.scale}
                              type="button"
                              onClick={() => setPdfDpiScale(item.scale)}
                              className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all cursor-pointer ${pdfDpiScale === item.scale
                                  ? "border-foreground bg-foreground text-background shadow-xs font-bold"
                                  : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                              <span className="text-xs font-extrabold">{item.label}</span>
                              <span className="text-[10px] opacity-80">{item.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background & Output Format */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground block mb-1">Background:</span>
                          <select
                            value={pdfBgColor}
                            onChange={(e: any) => setPdfBgColor(e.target.value)}
                            className="w-full rounded-xl border-2 border-border bg-background px-2.5 py-2 text-xs font-bold focus:border-accent focus:outline-none"
                          >
                            <option value="#ffffff">White (#FFFFFF)</option>
                            <option value="#f8fafc">Light Gray (#F8FAFC)</option>
                            <option value="#0f172a">Dark Slate (#0F172A)</option>
                            <option value="transparent">Transparent (PNG)</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground block mb-1">Output Format:</span>
                          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 border border-border">
                            <button
                              type="button"
                              onClick={() => setPdfDocOutputFormat("PNG")}
                              className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${pdfDocOutputFormat === "PNG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                                }`}
                            >
                              PNG
                            </button>
                            <button
                              type="button"
                              onClick={() => setPdfDocOutputFormat("JPG")}
                              className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${pdfDocOutputFormat === "JPG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                                }`}
                            >
                              JPG
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 15.7 WORD TO IMAGE CONTROLS */}
              {tool.slug === "word-to-image" && (
                <div className="space-y-6">
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 font-bold shadow-xs">
                        <FileType className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {file ? file.name : "Word Document (.docx)"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {file
                            ? `${formatBytes(file.size)} · ${wordTotalPages} ${wordTotalPages === 1 ? "page" : "pages"}`
                            : "Ready to convert"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Change File</span>
                    </button>
                  </div>

                  {/* Multi-Page Conversion Mode (if multiple pages detected) */}
                  {wordTotalPages > 1 && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground">Page Conversion Scope:</label>
                        <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 rounded-md bg-blue-500/10">
                          {wordTotalPages} Pages Total
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWordPageMode("all")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${wordPageMode === "all"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">All {wordTotalPages} Pages</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Zip Bundle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWordPageMode("single")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${wordPageMode === "single"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">Single Page</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Page {wordDocPage}</span>
                        </button>
                      </div>

                      {/* Page Navigator */}
                      <div className="pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {wordPageMode === "single" ? "Selected Page to Convert:" : "Preview Page:"}
                          </span>
                          <span className="text-xs font-black text-foreground">
                            Page {wordDocPage} of {wordTotalPages}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={wordDocPage <= 1}
                            onClick={() => setWordDocPage((p: any) => Math.max(1, p - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-xs">
                            <span className="text-xs font-bold text-muted-foreground">Page</span>
                            <input
                              type="number"
                              min={1}
                              max={wordTotalPages}
                              value={wordDocPage}
                              onChange={(e: any) => setWordDocPage(Math.min(wordTotalPages, Math.max(1, Number(e.target.value) || 1)))}
                              className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
                            />
                            <span className="text-xs font-bold text-muted-foreground">of {wordTotalPages}</span>
                          </div>

                          <button
                            type="button"
                            disabled={wordDocPage >= wordTotalPages}
                            onClick={() => setWordDocPage((p: any) => Math.min(wordTotalPages, p + 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typography Font */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Typography Font Family:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { font: "Calibri, sans-serif", label: "Calibri (Modern)" },
                        { font: "Arial, sans-serif", label: "Arial (Clean)" },
                        { font: "'Times New Roman', serif", label: "Times (Classic)" },
                        { font: "Georgia, serif", label: "Georgia (Editorial)" },
                      ].map((item: any) => (
                        <button
                          key={item.font}
                          type="button"
                          onClick={() => setWordDocFont(item.font)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${wordDocFont === item.font
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size & Background */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Font Size:</span>
                      <select
                        value={wordDocFontSize}
                        onChange={(e: any) => setWordDocFontSize(Number(e.target.value))}
                        className="w-full rounded-xl border-2 border-border bg-background px-2.5 py-2 text-xs font-bold focus:border-accent focus:outline-none"
                      >
                        <option value={14}>14px (Compact)</option>
                        <option value={16}>16px (Standard)</option>
                        <option value={18}>18px (Large)</option>
                        <option value={20}>20px (Extra Large)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Output Format:</span>
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 border border-border">
                        <button
                          type="button"
                          onClick={() => setWordDocOutputFormat("PNG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${wordDocOutputFormat === "PNG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setWordDocOutputFormat("JPG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${wordDocOutputFormat === "JPG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Document Header Bar Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/30">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-bold text-foreground block">Document Header Bar</span>
                      <span className="text-[10px] text-muted-foreground block">
                        {wordDocShowHeader ? "Showing top blue header bar with document title" : "Clean document mode (no header bar)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWordDocShowHeader((v: any) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wordDocShowHeader ? "bg-accent" : "bg-muted"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out ${wordDocShowHeader ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 15.8 EXCEL TO IMAGE CONTROLS */}
              {tool.slug === "excel-to-image" && (
                <div className="space-y-6">
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold shadow-xs">
                        <Table2 className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {file ? file.name : "Excel Spreadsheet (.xlsx)"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {file
                            ? `${formatBytes(file.size)} · ${excelTotalSheets} ${excelTotalSheets === 1 ? "sheet" : "sheets"}`
                            : "Ready to convert"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Change File</span>
                    </button>
                  </div>

                  {/* Multi-Sheet Conversion Mode */}
                  {excelTotalSheets > 1 && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground">Worksheet Conversion Scope:</label>
                        <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                          {excelTotalSheets} Sheets Total
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExcelSheetMode("all")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${excelSheetMode === "all"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">All {excelTotalSheets} Sheets</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Zip Bundle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSheetMode("single")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${excelSheetMode === "single"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">Specific Sheet</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Sheet {excelDocSheet}</span>
                        </button>
                      </div>

                      {/* Sheet Selector & Stepper */}
                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {excelSheetMode === "single" ? "Selected Sheet to Convert:" : "Preview Sheet:"}
                          </span>
                          <span className="text-xs font-black text-foreground">
                            Sheet {excelDocSheet} of {excelTotalSheets}
                          </span>
                        </div>

                        {/* Sheet Dropdown */}
                        {excelSheetNames.length > 0 && (
                          <select
                            value={excelDocSheet}
                            onChange={(e: any) => setExcelDocSheet(Number(e.target.value))}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                          >
                            {excelSheetNames.map((name: any, idx: any) => (
                              <option key={idx} value={idx + 1}>
                                Sheet {idx + 1}: {name}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={excelDocSheet <= 1}
                            onClick={() => setExcelDocSheet((s: any) => Math.max(1, s - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <div className="flex-1 flex items-center justify-center bg-background border border-border rounded-xl px-3 py-1.5 shadow-xs text-xs font-bold text-foreground truncate">
                            {excelSheetNames[excelDocSheet - 1] || `Sheet ${excelDocSheet}`}
                          </div>

                          <button
                            type="button"
                            disabled={excelDocSheet >= excelTotalSheets}
                            onClick={() => setExcelDocSheet((s: any) => Math.min(excelTotalSheets, s + 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Table Styling Theme */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Table Theme & Palette:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "modern-slate", label: "Modern Slate", desc: "Dark header & clean zebra" },
                        { id: "emerald", label: "Emerald Green", desc: "Classic Excel style" },
                        { id: "clean-white", label: "Clean White", desc: "Minimalist light theme" },
                        { id: "dark", label: "Dark Mode", desc: "Deep charcoal canvas" },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setExcelTheme(item.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${excelTheme === item.id
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-bold block">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Banner Control (Hide/Show) */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/30">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-bold text-foreground block">Header Banner in Output:</span>
                      <span className="text-[10px] text-muted-foreground block">
                        {excelShowHeader ? "Spreadsheet title banner included at top" : "Hidden (Pure clean invoice & table export)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExcelShowHeader((v: any) => !v)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${excelShowHeader
                          ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                        }`}
                    >
                      {excelShowHeader ? "✓ Header Shown" : "✕ Hide Header"}
                    </button>
                  </div>

                  {/* Gridlines & Output Format */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Grid Lines:</span>
                      <button
                        type="button"
                        onClick={() => setExcelGridLines(!excelGridLines)}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${excelGridLines
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border bg-background text-muted-foreground"
                          }`}
                      >
                        {excelGridLines ? "✓ Grid Visible" : "✕ Grid Hidden"}
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Output Format:</span>
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 border border-border">
                        <button
                          type="button"
                          onClick={() => setExcelDocOutputFormat("PNG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${excelDocOutputFormat === "PNG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcelDocOutputFormat("JPG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${excelDocOutputFormat === "JPG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 15.9 POWERPOINT TO IMAGE CONTROLS */}
              {tool.slug === "powerpoint-to-image" && (
                <div className="space-y-6">
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 font-bold shadow-xs">
                        <MonitorPlay className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {file ? file.name : "PowerPoint (.pptx)"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {file
                            ? `${formatBytes(file.size)} · ${pptTotalSlides} ${pptTotalSlides === 1 ? "slide" : "slides"} · ${pptAspectRatio}`
                            : "Ready to convert"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Change File</span>
                    </button>
                  </div>

                  {/* Multi-Slide Conversion Mode (if multiple slides detected) */}
                  {pptTotalSlides > 1 && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground">Slide Conversion Scope:</label>
                        <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10">
                          {pptTotalSlides} Slides Total
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPptSlideMode("all")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${pptSlideMode === "all"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">All {pptTotalSlides} Slides</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Zip Bundle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPptSlideMode("single")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${pptSlideMode === "single"
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-black">Single Slide</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Slide {pptDocSlide}</span>
                        </button>
                      </div>

                      {/* Slide Navigator when Single Slide Mode or previewing */}
                      <div className="pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {pptSlideMode === "single" ? "Selected Slide to Convert:" : "Preview Slide:"}
                          </span>
                          <span className="text-xs font-black text-foreground">
                            Slide {pptDocSlide} of {pptTotalSlides}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={pptDocSlide <= 1}
                            onClick={() => setPptDocSlide((s: any) => Math.max(1, s - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-xs">
                            <span className="text-xs font-bold text-muted-foreground">Slide</span>
                            <input
                              type="number"
                              min={1}
                              max={pptTotalSlides}
                              value={pptDocSlide}
                              onChange={(e: any) => setPptDocSlide(Math.min(pptTotalSlides, Math.max(1, Number(e.target.value) || 1)))}
                              className="w-full text-center text-xs font-black text-foreground bg-transparent focus:outline-none"
                            />
                            <span className="text-xs font-bold text-muted-foreground">/ {pptTotalSlides}</span>
                          </div>

                          <button
                            type="button"
                            disabled={pptDocSlide >= pptTotalSlides}
                            onClick={() => setPptDocSlide((s: any) => Math.min(pptTotalSlides, s + 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quick slide chip list */}
                        {pptTotalSlides <= 12 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {Array.from({ length: pptTotalSlides }).map((_: any, idx: any) => {
                              const sNum = idx + 1;
                              return (
                                <button
                                  key={sNum}
                                  type="button"
                                  onClick={() => setPptDocSlide(sNum)}
                                  className={`h-7 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${pptDocSlide === sNum
                                      ? "border-foreground bg-foreground text-background shadow-xs font-black"
                                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                  {sNum}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Slide Theme */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Visual Slide Theme:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "original", label: "Original (As Designed)" },
                        { id: "clean", label: "Clean Minimal" },
                        { id: "indigo", label: "Indigo Modern" },
                        { id: "dark", label: "Dark Slate" },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPptTheme(item.id as any)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${pptTheme === item.id
                              ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format & Dimensions */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Aspect Ratio:</span>
                      <div className="rounded-xl border border-border bg-muted/40 p-2 text-center text-xs font-bold">
                        {pptAspectRatio} (1920×1080)
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Output Format:</span>
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 border border-border">
                        <button
                          type="button"
                          onClick={() => setPptDocOutputFormat("PNG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${pptDocOutputFormat === "PNG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setPptDocOutputFormat("JPG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all cursor-pointer ${pptDocOutputFormat === "JPG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 16. COLOR PICKER FROM IMAGE */}
              {tool.slug === "color-picker-from-image" && (
                <div className="space-y-3">
                  {/* Swatch Header Card */}
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 shadow-2xs">
                    <div className="relative group shrink-0">
                      <span
                        className="h-12 w-12 rounded-xl border-2 border-white/40 shadow-sm block transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: pickedHex }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Color</p>
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                          Auto-copied on Pick
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-display text-xl font-black text-foreground tracking-tight truncate">{pickedHex}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pickedHex, "HEX")}
                          className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-bold hover:bg-foreground hover:text-background transition-all shrink-0 cursor-pointer"
                          title="Copy HEX"
                        >
                          {copiedFormat === "HEX" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedFormat === "HEX" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">{pickedRgb} • {pickedHsl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={openSystemEyeDropper}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm transition-all hover:scale-105 shrink-0 cursor-pointer"
                      title="Launch EyeDropper tool"
                    >
                      <Pipette className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Auto-Extracted Most Common Colors Card */}
                  <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Wand2 className="h-3.5 w-3.5 text-accent" />
                            <span>Most Common Colors</span>
                          </label>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-500">
                            Auto
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Top dominant colors detected in image
                        </p>
                      </div>

                      {imageSrc && (
                        <button
                          type="button"
                          disabled={isExtractingColors}
                          onClick={() => extractMostCommonColors(imageSrc)}
                          className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:border-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                          title="Re-analyze image colors"
                        >
                          <RotateCw className={`h-3 w-3 ${isExtractingColors ? "animate-spin" : ""}`} />
                          <span>{isExtractingColors ? "Scanning..." : "Re-scan"}</span>
                        </button>
                      )}
                    </div>

                    {isExtractingColors ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                        <RotateCw className="h-4 w-4 animate-spin text-accent" />
                        <span>Analyzing dominant image colors...</span>
                      </div>
                    ) : commonColors.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {commonColors.map((item: any, idx: any) => {
                          const isSelected = pickedHex.toUpperCase() === item.hex.toUpperCase();
                          return (
                            <button
                              key={item.hex + idx}
                              type="button"
                              onClick={() => {
                                setPickedHex(item.hex);
                                setPickedRgb(item.rgb);
                                setPickedHsl(item.hsl);
                                copyToClipboard(item.hex, "HEX");
                              }}
                              className={`group relative flex items-center gap-2 p-1.5 rounded-xl border transition-all cursor-pointer text-left ${isSelected
                                  ? "border-accent bg-accent/10 shadow-2xs ring-1 ring-accent/40"
                                  : "border-border bg-background hover:border-foreground/50 hover:bg-muted/30"
                                }`}
                            >
                              {/* Swatch circle */}
                              <div className="relative shrink-0">
                                <span
                                  className="h-7 w-7 rounded-lg border border-black/20 shadow-2xs block"
                                  style={{ backgroundColor: item.hex }}
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Check className={`h-3.5 w-3.5 ${item.r + item.g + item.b > 380 ? "text-black" : "text-white"}`} />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-mono text-[11px] font-black text-foreground truncate leading-tight">
                                  {item.hex}
                                </p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    {item.percentage}%
                                  </span>
                                  {idx === 0 && (
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                                      • Dominant
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Upload or select an image to extract its most common colors.
                      </p>
                    )}
                  </div>

                  {/* Copy Formats 2x2 Grid (Compact Display-Fitting Layout) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Color Formats</p>
                      <button
                        type="button"
                        onClick={() => {
                          const allText = `HEX: ${pickedHex}\nRGB: ${pickedRgb}\nHSL: ${pickedHsl}\nCSS: --color-picked: ${pickedHex};`;
                          copyToClipboard(allText, "All Formats");
                        }}
                        className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        <span>Copy All</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {/* HEX */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(pickedHex, "HEX")}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-mono hover:border-accent/50 hover:bg-muted/40 transition-all cursor-pointer text-left group"
                        title="Click to copy HEX"
                      >
                        <span className="truncate">HEX: <strong className="text-foreground">{pickedHex}</strong></span>
                        {copiedFormat === "HEX" ? <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 ml-1" />}
                      </button>

                      {/* RGB */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(pickedRgb, "RGB")}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-mono hover:border-accent/50 hover:bg-muted/40 transition-all cursor-pointer text-left group"
                        title="Click to copy RGB"
                      >
                        <span className="truncate">RGB: <strong className="text-foreground text-[11px]">{pickedRgb.replace("rgb(", "").replace(")", "")}</strong></span>
                        {copiedFormat === "RGB" ? <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 ml-1" />}
                      </button>

                      {/* HSL */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(pickedHsl, "HSL")}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-mono hover:border-accent/50 hover:bg-muted/40 transition-all cursor-pointer text-left group"
                        title="Click to copy HSL"
                      >
                        <span className="truncate">HSL: <strong className="text-foreground text-[11px]">{pickedHsl.replace("hsl(", "").replace(")", "")}</strong></span>
                        {copiedFormat === "HSL" ? <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 ml-1" />}
                      </button>

                      {/* CSS Var */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`--color: ${pickedHex};`, "CSS Variable")}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-mono hover:border-accent/50 hover:bg-muted/40 transition-all cursor-pointer text-left group"
                        title="Click to copy CSS Var"
                      >
                        <span className="truncate text-[11px]">CSS: <strong className="text-foreground">{pickedHex}</strong></span>
                        {copiedFormat === "CSS Variable" ? <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 ml-1" />}
                      </button>
                    </div>
                  </div>

                  {/* Palette History */}
                  {colorHistory.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Palette className="h-3 w-3 text-accent" /> Sampled ({colorHistory.length})</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const list = colorHistory.join("\n");
                              copyToClipboard(list, "Palette HEX List");
                            }}
                            className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            <span>Copy List</span>
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            onClick={() => setColorHistory([])}
                            className="text-[10px] font-medium text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-background/50 border border-border/60">
                        {colorHistory.map((hex: any, i: any) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setPickedHex(hex);
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              const rgb = `rgb(${r}, ${g}, ${b})`;
                              const hsl = rgbToHsl(r, g, b);
                              setPickedRgb(rgb);
                              setPickedHsl(hsl);
                              copyToClipboard(hex, "HEX");
                            }}
                            className={`group relative h-7 w-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 shadow-2xs focus:outline-none cursor-pointer ${pickedHex === hex ? "border-accent ring-2 ring-accent/30 scale-105" : "border-white/50"
                              }`}
                            style={{ backgroundColor: hex }}
                            title={`Select & Copy ${hex}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 rounded bg-black/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow pointer-events-none whitespace-nowrap">
                              {hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage Guide Tip */}
                  <div className="rounded-xl border border-accent/20 bg-accent/5 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="leading-snug">Hover or click image to inspect &amp; pick colors via real-time 9×9 magnifying loupe.</span>
                  </div>
                </div>
              )}

              {/* 17. IMAGE TO PDF SETTINGS & CONTROLS */}
              {tool.slug === "image-to-pdf" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent shrink-0" />
                      <h4 className="text-sm font-extrabold text-foreground">PDF Document Generator</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Converts your image into a standard, high-resolution <strong className="text-foreground">PDF 1.4</strong> document with crystal-clear rendering across all PDF viewers.
                    </p>
                  </div>

                  {/* Page Size Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                      <span>Page Layout & Sizing:</span>
                      <span className="text-[10px] uppercase font-mono font-bold text-accent">
                        {pdfPageSize === "auto" ? "Fit to Image" : pdfPageSize.replace("_", " ").toUpperCase()}
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "auto", label: "Fit to Image", desc: "Native image aspect ratio" },
                        { id: "a4_portrait", label: "A4 Portrait", desc: "210 × 297 mm (Standard)" },
                        { id: "a4_landscape", label: "A4 Landscape", desc: "297 × 210 mm (Wide)" },
                        { id: "letter_portrait", label: "US Letter", desc: "8.5 × 11 in (Portrait)" },
                        { id: "letter_landscape", label: "US Letter", desc: "11 × 8.5 in (Landscape)" },
                      ].map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPdfPageSize(opt.id as any)}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${pdfPageSize === opt.id
                              ? "border-accent bg-accent/10 text-foreground font-bold shadow-xs ring-1 ring-accent"
                              : "border-border bg-background/80 text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-extrabold">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Margin Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Page Margins:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-muted/40 p-1.5 border border-border">
                      {[
                        { id: "none", label: "None (0)" },
                        { id: "small", label: "Small (5mm)" },
                        { id: "normal", label: "Normal (12mm)" },
                        { id: "large", label: "Large (20mm)" },
                      ].map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPdfMargin(m.id as any)}
                          className={`py-2 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${pdfMargin === m.id
                              ? "bg-foreground text-background shadow-xs font-black"
                              : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Quality / Compression Slider */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground">PDF Image Quality:</span>
                      <span className="font-mono font-black text-accent">{pdfQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={100}
                      step={5}
                      value={pdfQuality}
                      onChange={(e: any) => setPdfQuality(Number(e.target.value))}
                      className="w-full accent-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Smaller File (60%)</span>
                      <span>Balanced (80%)</span>
                      <span>Maximum (100%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 18. IMAGE TO WORD (MICROSOFT WORD OCR) */}
              {tool.slug === "image-to-word" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileType className="h-5 w-5 text-blue-500 shrink-0" />
                      <h4 className="text-sm font-extrabold text-foreground">
                        Microsoft Word (.docx) OCR Engine
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Extracts real editable text, headers, and bullet points from your image using neural OCR and compiles an authentic, standard OpenXML <strong className="text-foreground">.docx</strong> file.
                    </p>
                  </div>

                  {/* 1. OCR Recognition Language */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background/80 p-3.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-accent" />
                        <label className="text-xs font-black text-foreground">
                          OCR Language
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOcrLanguageDialogOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-xs font-extrabold text-accent hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>Change (60+)</span>
                      </button>
                    </div>

                    {/* Active Language Card */}
                    {(() => {
                      const activeObj =
                        ocrLanguage === "custom"
                          ? { code: ocrCustomLanguage || "custom", name: ocrCustomLanguage || "Custom Code", flag: "⚙️" }
                          : OCR_SUPPORTED_LANGUAGES.find((l: any) => l.code === ocrLanguage) || { code: ocrLanguage, name: ocrLanguage, flag: "🌐" };
                      return (
                        <div
                          onClick={() => setIsOcrLanguageDialogOpen(true)}
                          className="group flex items-center justify-between rounded-xl border border-border bg-card p-2.5 transition-all hover:border-foreground cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-xl shrink-0">{activeObj.flag}</span>
                            <span className="text-xs font-extrabold text-foreground truncate">{activeObj.name}</span>
                            <span className="rounded-md bg-accent/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-accent">
                              {activeObj.code}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      );
                    })()}

                    {/* Presets Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { code: "eng", name: "English", flag: "🇺🇸" },
                        { code: "guj", name: "ગુજરાતી", flag: "🇮🇳" },
                        { code: "hin", name: "हिन्दी", flag: "🇮🇳" },
                        { code: "spa", name: "Español", flag: "🇪🇸" },
                        { code: "fra", name: "Français", flag: "🇫🇷" },
                        { code: "deu", name: "Deutsch", flag: "🇩🇪" },
                        { code: "chi_sim", name: "中文", flag: "🇨🇳" },
                        { code: "ara", name: "العربية", flag: "🇸🇦" },
                      ].map((item: any) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setOcrLanguage(item.code);
                            toast.success(`OCR language set to ${item.name}`);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${ocrLanguage === item.code
                              ? "bg-foreground text-background font-black shadow-xs"
                              : "border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span>{item.flag}</span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Word Document Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Document Generation Mode:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "text_clean", label: "Clean Text", sub: "100% Editable" },
                        { id: "text_and_image", label: "Text + Image", sub: "Complete scan" },
                        { id: "image_only", label: "Image Only", sub: "Visual layout" },
                      ].map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setWordDocMode(m.id as any)}
                          className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all cursor-pointer ${wordDocMode === m.id
                              ? "border-foreground bg-foreground text-background shadow-xs font-bold"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-extrabold">{m.label}</span>
                          <span className="text-[10px] opacity-80">{m.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Font Family & Size */}
                  {wordDocMode !== "image_only" && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">
                          Document Font Family:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["Calibri", "Arial", "Times New Roman", "Georgia", "Aptos", "Segoe UI"].map((font: any) => (
                            <button
                              key={font}
                              type="button"
                              onClick={() => setWordFontFamily(font)}
                              className={`py-1.5 px-2 rounded-xl border text-xs font-bold truncate transition-all cursor-pointer ${wordFontFamily === font
                                  ? "border-foreground bg-foreground text-background shadow-xs font-black"
                                  : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                              style={{ fontFamily: font }}
                            >
                              {font}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground">Body Font Size:</span>
                          <span className="font-mono font-black text-accent">{wordFontSize} pt</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[10, 11, 12, 14].map((size: any) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setWordFontSize(size)}
                              className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${wordFontSize === size
                                  ? "bg-foreground text-background font-black shadow-xs"
                                  : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                              {size} pt {size === 11 ? "(Standard)" : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Progress */}
                  {processing && (
                    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 space-y-3 animate-pulse">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          <span>{ocrProgressStatus || "Running OCR for Word Document…"}</span>
                        </div>
                        <span className="font-mono font-black text-accent">{ocrProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, ocrProgressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 19. IMAGE TO EXCEL (MICROSOFT EXCEL OCR TABLE ENGINE) */}
              {tool.slug === "image-to-excel" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />
                      <h4 className="text-sm font-extrabold text-foreground">
                        Microsoft Excel (.xlsx) OCR Table Engine
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scans tables, matrices, and columns in your image and generates an authentic, multi-cell Microsoft Excel <strong className="text-foreground">.xlsx</strong> spreadsheet with custom styles and numeric detection.
                    </p>
                  </div>

                  {/* 1. OCR Recognition Language */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background/80 p-3.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-accent" />
                        <label className="text-xs font-black text-foreground">
                          OCR Language
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOcrLanguageDialogOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-xs font-extrabold text-accent hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>Change (60+)</span>
                      </button>
                    </div>

                    {/* Active Language Card */}
                    {(() => {
                      const activeObj =
                        ocrLanguage === "custom"
                          ? { code: ocrCustomLanguage || "custom", name: ocrCustomLanguage || "Custom Code", flag: "⚙️" }
                          : OCR_SUPPORTED_LANGUAGES.find((l: any) => l.code === ocrLanguage) || { code: ocrLanguage, name: ocrLanguage, flag: "🌐" };
                      return (
                        <div
                          onClick={() => setIsOcrLanguageDialogOpen(true)}
                          className="group flex items-center justify-between rounded-xl border border-border bg-card p-2.5 transition-all hover:border-foreground cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-xl shrink-0">{activeObj.flag}</span>
                            <span className="text-xs font-extrabold text-foreground truncate">{activeObj.name}</span>
                            <span className="rounded-md bg-accent/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-accent">
                              {activeObj.code}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      );
                    })()}

                    {/* Presets Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { code: "eng", name: "English", flag: "🇺🇸" },
                        { code: "guj", name: "ગુજરાતી", flag: "🇮🇳" },
                        { code: "hin", name: "हिन्दी", flag: "🇮🇳" },
                        { code: "spa", name: "Español", flag: "🇪🇸" },
                        { code: "fra", name: "Français", flag: "🇫🇷" },
                        { code: "deu", name: "Deutsch", flag: "🇩🇪" },
                        { code: "chi_sim", name: "中文", flag: "🇨🇳" },
                        { code: "ara", name: "العربية", flag: "🇸🇦" },
                      ].map((item: any) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setOcrLanguage(item.code);
                            toast.success(`OCR language set to ${item.name}`);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${ocrLanguage === item.code
                              ? "bg-foreground text-background font-black shadow-xs"
                              : "border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span>{item.flag}</span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Table Parser Matrix Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Table Matrix Parser Mode:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "grid", label: "Auto Grid Matrix", sub: "Tabs, pipes & multi-space" },
                        { id: "csv", label: "CSV Comma Mode", sub: "Comma separated values" },
                        { id: "whitespace", label: "Whitespace Gap", sub: "Spacing between columns" },
                        { id: "lines", label: "Line by Line", sub: "Each line in one row" },
                      ].map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setExcelParserMode(p.id as any)}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${excelParserMode === p.id
                              ? "border-emerald-500 bg-emerald-500/10 text-foreground font-bold shadow-xs ring-1 ring-emerald-500"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-extrabold">{p.label}</span>
                          <span className="text-[10px] text-muted-foreground">{p.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Sheet Name & Header Styling */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground block">
                        Worksheet Tab Name:
                      </label>
                      <input
                        type="text"
                        value={excelSheetName}
                        onChange={(e: any) => setExcelSheetName(e.target.value)}
                        placeholder="Sheet1"
                        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background/60 cursor-pointer hover:border-foreground transition-all">
                      <input
                        type="checkbox"
                        checked={excelHighlightHeader}
                        onChange={(e: any) => setExcelHighlightHeader(e.target.checked)}
                        className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-foreground block">
                          Format Top Row as Table Header
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Applies bold typography, light accent fill, and bottom border to row 1.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Live Progress */}
                  {processing && (
                    <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3 animate-pulse">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          <span>{ocrProgressStatus || "Extracting Table Matrix with OCR…"}</span>
                        </div>
                        <span className="font-mono font-black text-emerald-500">{ocrProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, ocrProgressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 20. IMAGE TO PPTX (POWERPOINT) */}
              {tool.slug === "image-to-powerpoint" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <MonitorPlay className="h-5 w-5 text-orange-500 shrink-0" />
                      <h4 className="text-sm font-extrabold text-foreground">
                        PowerPoint Presentation (.pptx) Generator
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scans text and graphics from your image using neural OCR and generates an authentic, editable 16:9 Microsoft PowerPoint (<strong className="text-foreground">.pptx</strong>) presentation slide with native formatting.
                    </p>
                  </div>

                  {/* 1. OCR Recognition Language */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background/80 p-3.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-accent" />
                        <label className="text-xs font-black text-foreground">
                          OCR Language
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOcrLanguageDialogOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-xs font-extrabold text-accent hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>Change (60+)</span>
                      </button>
                    </div>

                    {/* Active Language Card */}
                    {(() => {
                      const activeObj =
                        ocrLanguage === "custom"
                          ? { code: ocrCustomLanguage || "custom", name: ocrCustomLanguage || "Custom Code", flag: "⚙️" }
                          : OCR_SUPPORTED_LANGUAGES.find((l: any) => l.code === ocrLanguage) || { code: ocrLanguage, name: ocrLanguage, flag: "🌐" };
                      return (
                        <div
                          onClick={() => setIsOcrLanguageDialogOpen(true)}
                          className="group flex items-center justify-between rounded-xl border border-border bg-card p-2.5 transition-all hover:border-foreground cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-xl shrink-0">{activeObj.flag}</span>
                            <span className="text-xs font-extrabold text-foreground truncate">{activeObj.name}</span>
                            <span className="rounded-md bg-accent/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-accent">
                              {activeObj.code}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      );
                    })()}

                    {/* Presets Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { code: "eng", name: "English", flag: "🇺🇸" },
                        { code: "guj", name: "ગુજરાતી", flag: "🇮🇳" },
                        { code: "hin", name: "हिन्दी", flag: "🇮🇳" },
                        { code: "spa", name: "Español", flag: "🇪🇸" },
                        { code: "fra", name: "Français", flag: "🇫🇷" },
                        { code: "deu", name: "Deutsch", flag: "🇩🇪" },
                        { code: "chi_sim", name: "中文", flag: "🇨🇳" },
                        { code: "ara", name: "العربية", flag: "🇸🇦" },
                      ].map((item: any) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setOcrLanguage(item.code);
                            toast.success(`OCR language set to ${item.name}`);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${ocrLanguage === item.code
                              ? "bg-foreground text-background font-black shadow-xs"
                              : "border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span>{item.flag}</span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Slide Layout Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Slide Layout & Content Mode:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "split", label: "Split Slide", sub: "Image + Text" },
                        { id: "text_only", label: "Text Slide", sub: "Bullets Only" },
                        { id: "image_only", label: "Image Slide", sub: "Framed Visual" },
                      ].map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPptxSlideMode(m.id as any)}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${pptxSlideMode === m.id
                              ? "border-orange-500 bg-orange-500/10 text-foreground font-bold shadow-xs ring-1 ring-orange-500"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-extrabold">{m.label}</span>
                          <span className="text-[10px] text-muted-foreground">{m.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Slide Title (Optional Custom Title) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Custom Slide Title (Optional):
                    </label>
                    <input
                      type="text"
                      value={pptxSlideTitle}
                      onChange={(e: any) => setPptxSlideTitle(e.target.value)}
                      placeholder="Leave empty for auto-detected title from image"
                      className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* 4. Presentation Theme */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Presentation Theme:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "modern", name: "Modern Indigo", desc: "Slate & Indigo accents" },
                        { id: "dark", name: "Studio Dark", desc: "Dark mode presentation" },
                        { id: "minimal", name: "Minimalist White", desc: "Clean editorial layout" },
                        { id: "corporate", name: "Corporate Navy", desc: "Executive dark blue" },
                      ].map((t: any) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPptxTheme(t.id as any)}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${pptxTheme === t.id
                              ? "border-orange-500 bg-orange-500/10 text-foreground font-bold shadow-xs ring-1 ring-orange-500"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className="text-xs font-extrabold">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Progress */}
                  {processing && (
                    <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4 space-y-3 animate-pulse">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                          <span>{ocrProgressStatus || "Generating PowerPoint Slide…"}</span>
                        </div>
                        <span className="font-mono font-black text-orange-500">{ocrProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, ocrProgressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
    </>
  );
}
