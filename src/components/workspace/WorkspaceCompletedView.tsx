// Post-processing summary card, before/after comparison stage, and export actions.
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

export function WorkspaceCompletedView(props: any) {
  const {
    tool,
    file,
    imageSrc,
    processedSrc,
    hasProcessed,
    origSize,
    newSize,
    setNewSize,
    dimensions,
    outputDimensions,
    setIsEditingSettings,
    showOriginalComparison,
    setShowOriginalComparison,
    previewBackdrop,
    setPreviewBackdrop,
    copiedText,
    handleCopyExtractedText,
    targetWidth,
    targetHeight,
    resizeQualityMode,
    rotation,
    rotateBatch,
    rotateBatchOutputFormat,
    ocrText,
    setOcrText,
    rawOcrDocumentLines,
    setRawOcrDocumentLines,
    detectedBarcodes,
    skipBarcodeAndQr,
    setSkipBarcodeAndQr,
    ocrContrastMode,
    setOcrContrastMode,
    ocrOutputStructure,
    ocrLanguage,
    setIsOcrLanguageDialogOpen,
    recomputeOcrOutput,
    squareExportFormat,
    binaryOutputText,
    setBinaryOutputText,
    setIsFullscreenPreview,
    setFullscreenActiveIndex,
    setIsCodeEditorOpen,
    documentBlob,
    setDocumentBlob,
    wordDocMode,
    wordFontFamily,
    wordFontSize,
    excelParserMode,
    excelHighlightHeader,
    excelSheetName,
    pptxSlideMode,
    pptxSlideTitle,
    setPptxSlideTitle,
    pptxTheme,
    ocrTableGrid,
    ocrIsEmpty,
    pdfDocPage,
    pdfTotalPages,
    pdfDocOutputFormat,
    wordDocOutputFormat,
    wordDocPage,
    wordTotalPages,
    excelDocOutputFormat,
    excelDocSheet,
    excelTotalSheets,
    pptDocOutputFormat,
    pptDocSlide,
    pptTotalSlides,
    fileInputRef,
    copyToClipboard,
    processImage,
    handleDownloadSingleRotatedItem,
    handleDownload,
    formatBytes,
    isOcrTool,
    isDocumentTool,
    isBinaryTool,
    isConversionTool,
    sourceFormatLabel,
    targetFormatLabel
  } = props;


  return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          {/* Top Result Banner with Statistics */}
          <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-5 md:p-6 shadow-xl transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              {/* Left Column: Icon & Headings */}
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isOcrTool
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : isDocumentTool
                        ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                        : isBinaryTool
                          ? "bg-purple-500/15 text-purple-500 border border-purple-500/30"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    } shadow-xs`}
                >
                  {isOcrTool ? (
                    <ScanText className="h-6 w-6 stroke-[2.2]" />
                  ) : isDocumentTool ? (
                    <FileText className="h-6 w-6 stroke-[2.2]" />
                  ) : isBinaryTool ? (
                    <Binary className="h-6 w-6 stroke-[2.2]" />
                  ) : (
                    <Check className="h-6 w-6 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {isOcrTool
                        ? "AI OCR Extraction Complete"
                        : tool.slug === "compress-image"
                          ? "Lossless Compression Complete"
                          : tool.slug === "resize-image"
                            ? "Smart Resize Complete"
                            : tool.slug === "crop-image"
                              ? "Precision Crop Complete"
                              : tool.slug === "square-your-image"
                                ? "1:1 Square Complete"
                                : isDocumentTool
                                  ? "Document Conversion Complete"
                                  : isBinaryTool
                                    ? "Binary Stream Complete"
                                    : isConversionTool
                                      ? "Format Conversion Complete"
                                      : `${tool.name} Complete`}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {isOcrTool
                        ? `${ocrText ? ocrText.split(/\s+/).filter(Boolean).length : 0} Words · ${ocrText ? ocrText.length : 0} Chars`
                        : tool.slug === "square-your-image"
                          ? `${Math.max(dimensions.width || 0, dimensions.height || 0)} × ${Math.max(dimensions.width || 0, dimensions.height || 0)} px`
                          : tool.slug === "resize-image"
                            ? `${outputDimensions.width || targetWidth || dimensions.width} × ${outputDimensions.height || targetHeight || dimensions.height} px`
                            : `${dimensions.width} × ${dimensions.height} px`}
                    </span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground mt-1">
                    {isOcrTool
                      ? "Text Successfully Extracted"
                      : tool.slug === "compress-image"
                        ? "Image Successfully Compressed"
                        : tool.slug === "resize-image"
                          ? "Image Successfully Resized"
                          : tool.slug === "crop-image"
                            ? "Image Successfully Cropped"
                            : tool.slug === "square-your-image"
                              ? "1:1 Square Image Ready to Download"
                              : tool.slug === "blur-image" || tool.slug === "anonymise-image"
                                ? "Image Successfully Blurred"
                                : tool.slug === "watermark-image"
                                  ? "Watermark Successfully Applied"
                                  : isDocumentTool
                                    ? `${tool.name} Ready`
                                    : isConversionTool
                                      ? `Converted to ${targetFormatLabel}`
                                      : `${tool.name} Completed Successfully`}
                  </h3>
                </div>
              </div>

              {/* Right Column: Comparative Stats Box OR Conversion Flow OR OCR Action */}
              {isOcrTool ? (
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 bg-secondary/60 px-4 py-2.5 rounded-2xl border border-border/80 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground">
                    <span className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
                      {ocrText ? ocrText.split(/\s+/).filter(Boolean).length : 0} words
                    </span>
                    <span className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
                      {ocrText ? ocrText.length : 0} chars
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyExtractedText}
                    className="flex items-center gap-1.5 rounded-xl bg-foreground text-background hover:opacity-90 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Copy extracted text to clipboard"
                  >
                    {copiedText ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-accent" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              ) : isConversionTool ? (
                <div className="w-full md:w-auto flex items-center gap-3 bg-secondary/50 px-4 py-2.5 rounded-2xl border border-border/80 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider block">Conversion:</span>
                    <span className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs font-mono font-black text-foreground shadow-2xs">
                      {sourceFormatLabel}
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-500 font-bold shrink-0 stroke-[2.5]" />
                    <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      {targetFormatLabel}
                    </span>
                  </div>
                </div>
              ) : tool.slug === "resize-image" || tool.slug === "crop-image" ? (
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5 sm:gap-5 bg-secondary/50 px-4 py-2.5 rounded-2xl border border-border/80 shadow-xs">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block leading-tight">Original</span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground">
                      {dimensions.width} × {dimensions.height} px
                    </span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />

                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block leading-tight">
                      {tool.slug === "crop-image" ? "Cropped Output" : "Resized Output"}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                      {outputDimensions.width || targetWidth || dimensions.width} × {outputDimensions.height || targetHeight || dimensions.height} px
                    </span>
                  </div>

                  {newSize > 0 && (
                    <div className="pl-2 border-l border-border/70 flex items-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold shadow-xs">
                        <span>{formatBytes(newSize || origSize)}</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5 sm:gap-5 bg-secondary/50 px-4 py-2.5 rounded-2xl border border-border/80 shadow-xs">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block leading-tight">Original</span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground">
                      {formatBytes(origSize)}
                    </span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />

                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block leading-tight">
                      {tool.slug === "compress-image" ? "Compressed" : "Processed"}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                      {formatBytes(newSize || origSize)}
                    </span>
                  </div>

                  {origSize > 0 && newSize > 0 && origSize > newSize && (
                    <div className="pl-2 border-l border-border/70 flex items-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-extrabold shadow-xs">
                        <AnimatedCounter
                          value={Math.max(0, Math.round(((origSize - newSize) / origSize) * 100))}
                          suffix="%"
                        />
                        <span>Smaller</span>
                      </span>
                    </div>
                  )}
                  {origSize > 0 && newSize > 0 && newSize >= origSize && tool.slug === "resize-image" && resizeQualityMode === "improved" && (
                    <div className="pl-2 border-l border-border/70 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-extrabold shadow-xs">
                        <Wand2 className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        <span>HD Enhanced (+{Math.round(((newSize - origSize) / origSize) * 100)}% Size)</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Processed Output Preview Stage */}
          <div className="relative rounded-3xl border-2 border-border/80 bg-card/85 backdrop-blur-sm overflow-hidden shadow-xl flex flex-col p-4 md:p-6 min-h-[480px]">
            {/* Top Preview Controls Bar (Dedicated Header Row - Never Overlaps Canvas Border) */}
            {!isOcrTool && !(tool.slug === "rotate-image" && rotateBatch.length > 1) && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3 border-b border-border/60 z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary/70 border border-border px-3.5 py-1 text-xs font-bold text-foreground truncate max-w-[220px] sm:max-w-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{file?.name || `${tool.slug}_output`}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Studio Backdrop Switcher (for non-document image tools) */}
                  {!isDocumentTool && !isBinaryTool && (
                    <div className="flex items-center gap-0.5 rounded-full border border-border bg-secondary/60 p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewBackdrop("white")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${previewBackdrop === "white"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                        title="Clean white studio backdrop"
                      >
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBackdrop("checker")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${previewBackdrop === "checker"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                        title="Subtle transparency grid backdrop"
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBackdrop("black")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${previewBackdrop === "black"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                        title="Dark studio backdrop"
                      >
                        Dark
                      </button>
                    </div>
                  )}

                  {imageSrc && processedSrc && imageSrc !== processedSrc && (
                    <button
                      type="button"
                      onMouseDown={() => setShowOriginalComparison(true)}
                      onMouseUp={() => setShowOriginalComparison(false)}
                      onTouchStart={() => setShowOriginalComparison(true)}
                      onTouchEnd={() => setShowOriginalComparison(false)}
                      className="rounded-full border border-border bg-background hover:bg-foreground hover:text-background px-3.5 py-1 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Press and hold to compare with original image"
                    >
                      <Eye className="h-3.5 w-3.5 text-accent" />
                      <span>{showOriginalComparison ? "Showing Original" : "Hold for Original"}</span>
                    </button>
                  )}
                  {["image-to-binary", "image-to-base64", "image-to-hex", "image-to-octal", "image-to-decimal", "image-to-ascii"].includes(tool.slug) ? (
                    <button
                      type="button"
                      onClick={() => setIsCodeEditorOpen(true)}
                      className="rounded-full border border-border bg-background hover:bg-foreground hover:text-background px-3.5 py-1 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Open in Code Editor"
                    >
                      <Code2 className="h-3.5 w-3.5 text-accent" />
                      <span>Open in Code Editor</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsFullscreenPreview(true)}
                      className="rounded-full border border-border bg-background hover:bg-foreground hover:text-background px-3 py-1 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Enlarge preview"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-accent" />
                      <span>Enlarge</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dedicated Previews for Document & OCR Tools */}
            {hasProcessed && tool.slug === "image-to-excel" ? (
              /* Excel 2D Spreadsheet Matrix Live Preview */
              <div className="w-full max-w-4xl flex flex-col gap-3 z-0 mt-8">
                {(() => {
                  const lines = rawOcrDocumentLines.length > 0 ? rawOcrDocumentLines : (ocrText ? ocrText.split("\n") : []);
                  const grid = ocrTableGrid.length > 0 ? ocrTableGrid : parseOcrTextToGrid(lines, excelParserMode);
                  const maxCols = Math.max(...grid.map((r: any) => r.length), 1);
                  const totalCells = grid.reduce((s: any, r: any) => s + r.length, 0);

                  const copyAsCsv = () => {
                    const csvContent = grid
                      .map((row: any) =>
                        row
                          .map((cell: any) => {
                            const escaped = cell.replace(/"/g, '""');
                            return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
                              ? `"${escaped}"`
                              : escaped;
                          })
                          .join(",")
                      )
                      .join("\n");
                    copyToClipboard(csvContent, "CSV Data");
                  };

                  return (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                            <FileSpreadsheet className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-black text-foreground">
                            Extracted Spreadsheet Table ({excelSheetName})
                          </span>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {grid.length} Rows × {maxCols} Cols · {totalCells} Cells
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyAsCsv}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xs cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy as CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ocrText, "Extracted Text")}
                            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Text</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Spreadsheet Grid View */}
                      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-inner max-h-[380px] overflow-x-auto overflow-y-auto">
                        <table className="w-full border-collapse text-left text-xs font-mono">
                          {/* Column Letters Row (A, B, C...) */}
                          <thead>
                            <tr className="bg-muted/70 border-b border-border sticky top-0 z-10">
                              <th className="w-12 px-3 py-2 text-center text-[10px] font-bold text-muted-foreground border-r border-border bg-muted/80">
                                #
                              </th>
                              {Array.from({ length: maxCols }).map((_: any, cIdx: any) => (
                                <th
                                  key={cIdx}
                                  className="px-4 py-2 font-bold text-[11px] text-muted-foreground border-r border-border min-w-[120px] bg-muted/80"
                                >
                                  {getExcelColumnLetter(cIdx + 1)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {grid.map((row: any, rIdx: any) => {
                              const isHeader = rIdx === 0 && excelHighlightHeader;
                              return (
                                <tr
                                  key={rIdx}
                                  className={`border-b border-border/70 transition-colors ${isHeader
                                      ? "bg-emerald-500/10 font-bold text-foreground hover:bg-emerald-500/15"
                                      : rIdx % 2 === 0
                                        ? "bg-background hover:bg-muted/40"
                                        : "bg-muted/20 hover:bg-muted/50"
                                    }`}
                                >
                                  {/* Row Number (1, 2, 3...) */}
                                  <td className="px-3 py-2 text-center text-[10px] font-bold text-muted-foreground border-r border-border select-none bg-muted/30">
                                    {rIdx + 1}
                                  </td>
                                  {Array.from({ length: maxCols }).map((_: any, cIdx: any) => {
                                    const cellVal = row[cIdx] ?? "";
                                    const isNumeric = /^-?\d+(\.\d+)?$/.test(cellVal.trim()) && cellVal.trim().length <= 15;
                                    return (
                                      <td
                                        key={cIdx}
                                        className={`px-3 py-2 border-r border-border/70 truncate max-w-[240px] ${isHeader
                                            ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                                            : isNumeric
                                              ? "text-right text-blue-600 dark:text-blue-400 font-semibold"
                                              : "text-foreground"
                                          }`}
                                        title={cellVal}
                                      >
                                        {cellVal || <span className="opacity-20 italic">—</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : hasProcessed && tool.slug === "image-to-word" ? (
              /* Word Document Editable Live Preview */
              <div className="w-full max-w-3xl flex flex-col gap-3 z-0 mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                      <FileType className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-foreground">
                      Microsoft Word (.docx) Document Content
                    </span>
                    <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      {wordFontFamily} · {wordFontSize}pt
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ocrText, "Document Text")}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-accent" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                </div>

                {/* Styled Document Paper Preview */}
                <div className="rounded-2xl border-2 border-border bg-background p-5 shadow-inner max-h-[380px] overflow-y-auto space-y-3">
                  <textarea
                    rows={12}
                    value={ocrText}
                    onChange={(e: any) => {
                      setOcrText(e.target.value);
                      const updatedLines = e.target.value.split("\n");
                      setRawOcrDocumentLines(updatedLines);
                      const fname = file?.name?.replace(/\.[^.]+$/, "") || "image";
                      const updatedBlob = buildEditableDocxFromOcr(updatedLines, {
                        fontFamily: wordFontFamily,
                        fontSize: wordFontSize,
                        mode: wordDocMode,
                        imageDataUrl: processedSrc || imageSrc || undefined,
                        imgW: dimensions.width,
                        imgH: dimensions.height,
                        filename: fname,
                      });
                      setDocumentBlob(updatedBlob);
                      setNewSize(updatedBlob.size);
                    }}
                    placeholder="Extracted text will appear here. You can edit this text directly before downloading your Word document!"
                    style={{ fontFamily: wordFontFamily, fontSize: `${wordFontSize + 2}px` }}
                    className="w-full rounded-xl border border-border/80 bg-card p-4 text-foreground focus:border-accent focus:outline-none resize-none leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>
                      ✏️ <strong>Live Editable</strong>: Any changes typed above will be immediately included in your downloaded <strong className="text-foreground">.docx</strong> file.
                    </span>
                    <span className="font-mono font-bold">
                      {ocrText ? `${ocrText.split(/\s+/).filter(Boolean).length} words · ${ocrText.length} chars` : "0 words"}
                    </span>
                  </div>
                </div>
              </div>
            ) : hasProcessed && isOcrTool ? (
              /* Two-Column Split Studio (Dual-Pane OCR Inspector) */
              <div className="w-full flex flex-col gap-4 z-0 mt-2">
                {/* OCR Studio Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/80 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0">
                      <ScanText className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        Document Inspection &amp; Text Studio
                      </span>
                      <span className="rounded-full bg-accent/15 border border-accent/30 text-accent px-2 py-0.5 text-[10px] font-mono font-bold">
                        Tesseract AI OCR
                      </span>
                      <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                        Side-by-side verification: original scan vs. extracted text
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsFullscreenPreview(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                      title="Enlarge source document preview"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-accent" />
                      <span>Enlarge Scanned Image</span>
                    </button>
                  </div>
                </div>

                {/* Two Column Grid: Left Image, Right Text */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
                  {/* Left Column: Scanned Document Image */}
                  <div className="flex flex-col rounded-2xl border-2 border-border/80 bg-background overflow-hidden shadow-md">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-xs font-bold text-foreground">
                      <span className="truncate max-w-[200px] sm:max-w-xs flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{file?.name || "Scanned Document"}</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md">
                        {dimensions.width} × {dimensions.height} px
                      </span>
                    </div>

                    <div
                      onClick={() => setIsFullscreenPreview(true)}
                      className="relative flex-1 min-h-[340px] max-h-[460px] p-4 flex items-center justify-center bg-muted/15 cursor-zoom-in group/scan overflow-hidden"
                      title="Click to enlarge source image"
                    >
                      <img
                        src={imageSrc || processedSrc || undefined}
                        alt="Scanned Source Document"
                        className="max-h-[420px] max-w-full object-contain rounded-lg shadow-sm border border-border/50 group-hover/scan:scale-[1.02] transition-transform duration-200 select-none"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/scan:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity backdrop-blur-[2px]">
                        <Maximize2 className="h-4 w-4 text-accent" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/70 text-[11px] text-muted-foreground">
                      <span>OCR Language: <strong className="text-foreground capitalize">{ocrLanguage === "eng" ? "English" : ocrLanguage}</strong></span>
                      <span>Contrast: <strong className="text-foreground capitalize">{ocrContrastMode}</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Extracted Document Content Studio */}
                  <div className="flex flex-col rounded-2xl border-2 border-border/80 bg-background overflow-hidden shadow-md">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
                      <div className="flex items-center gap-2">
                        <ScanText className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-foreground">Extracted Text Content</span>
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {ocrText ? ocrText.split(/\s+/).filter(Boolean).length : 0} words
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyExtractedText}
                          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                          title="Copy extracted text"
                        >
                          {copiedText ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-accent" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Barcode / QR Detected Sub-Bar if any */}
                    {detectedBarcodes.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-black">✓</span>
                          <span className="text-foreground">{detectedBarcodes.length} Barcode / QR Codes detected</span>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={skipBarcodeAndQr}
                            onChange={(e: any) => {
                              setSkipBarcodeAndQr(e.target.checked);
                              recomputeOcrOutput(e.target.checked, ocrContrastMode, ocrOutputStructure);
                            }}
                            className="h-3.5 w-3.5 rounded accent-foreground cursor-pointer"
                          />
                          <span>Skip Codes</span>
                        </label>
                      </div>
                    )}

                    {/* Editable Document Studio Textarea */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <textarea
                        rows={14}
                        value={ocrText}
                        onChange={(e: any) => {
                          setOcrText(e.target.value);
                          setBinaryOutputText(e.target.value);
                          setRawOcrDocumentLines(e.target.value.split("\n"));
                        }}
                        placeholder="Extracted document text will appear here. You can directly edit or polish this text before saving!"
                        className="w-full flex-1 min-h-[300px] max-h-[440px] rounded-xl border border-border/80 bg-card p-3.5 font-mono text-xs sm:text-sm text-foreground focus:border-accent focus:outline-none resize-none leading-relaxed shadow-inner"
                      />
                    </div>

                    {/* Footer note & live stats */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/70 text-[11px] text-muted-foreground">
                      <span>✏️ <strong>Live Editable</strong>: Edit text directly before downloading.</span>
                      <span className="font-mono font-bold">{ocrText ? `${ocrText.length} characters` : "0 chars"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : hasProcessed && (ocrText || binaryOutputText) && isBinaryTool ? (
              /* Binary / Hex / Base64 Code Editor Preview */
              <div className="w-full max-w-3xl flex flex-col gap-3 z-0 mt-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span>Encoded Stream Content</span>
                    <span className="rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-mono font-extrabold text-foreground">
                      {binaryOutputText.length} chars
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCodeEditorOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-all shadow-xs cursor-pointer"
                      title="Open output in Custom Code & Binary Editor"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Open in Code Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(binaryOutputText, "Binary Stream")}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Stream</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={binaryOutputText}
                  className="w-full h-80 rounded-2xl border-2 border-border bg-background p-4 font-mono text-xs text-foreground focus:outline-none resize-none shadow-inner leading-relaxed"
                />
              </div>
            ) : hasProcessed && tool.slug === "image-to-powerpoint" ? (
              /* PowerPoint Presentation Slide Live Preview */
              <div className="w-full max-w-3xl flex flex-col gap-3 z-0 mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-500">
                      <MonitorPlay className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-foreground">
                      Microsoft PowerPoint (.pptx) Presentation Slide
                    </span>
                    <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono font-extrabold text-orange-600 dark:text-orange-400">
                      {pptxSlideMode === "split" ? "Split Slide" : pptxSlideMode === "text_only" ? "Text Slide" : "Image Slide"} · {pptxTheme}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ocrText, "Presentation Text")}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-accent" />
                      <span>Copy Slide Text</span>
                    </button>
                  </div>
                </div>

                {/* Styled Presentation Slide Preview Box */}
                <div className="rounded-2xl border-2 border-border bg-background p-5 shadow-inner space-y-4">
                  {/* Slide Title Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                      Slide Title
                    </label>
                    <input
                      type="text"
                      value={pptxSlideTitle}
                      onChange={(e: any) => {
                        const newTitle = e.target.value;
                        setPptxSlideTitle(newTitle);
                        const fname = file?.name?.replace(/\.[^.]+$/, "") || "slide";
                        const updatedBlob = buildPptxFromOcrAndImage(rawOcrDocumentLines, {
                          mode: pptxSlideMode,
                          title: newTitle,
                          theme: pptxTheme,
                          imageDataUrl: processedSrc || imageSrc || undefined,
                          imgW: dimensions.width,
                          imgH: dimensions.height,
                          filename: fname,
                        });
                        setDocumentBlob(updatedBlob);
                        setNewSize(updatedBlob.size);
                      }}
                      placeholder="Auto-detected title from image or type custom slide heading..."
                      className="w-full rounded-xl border border-border/80 bg-card px-4 py-2 text-sm font-bold text-foreground focus:border-accent focus:outline-none shadow-inner"
                    />
                  </div>

                  {/* Slide Content Bullets */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                      Slide Bullet Points & Key Takeaways
                    </label>
                    <textarea
                      rows={8}
                      value={ocrText}
                      onChange={(e: any) => {
                        const newText = e.target.value;
                        setOcrText(newText);
                        const updatedLines = newText.split("\n");
                        setRawOcrDocumentLines(updatedLines);
                        const fname = file?.name?.replace(/\.[^.]+$/, "") || "slide";
                        const updatedBlob = buildPptxFromOcrAndImage(updatedLines, {
                          mode: pptxSlideMode,
                          title: pptxSlideTitle || undefined,
                          theme: pptxTheme,
                          imageDataUrl: processedSrc || imageSrc || undefined,
                          imgW: dimensions.width,
                          imgH: dimensions.height,
                          filename: fname,
                        });
                        setDocumentBlob(updatedBlob);
                        setNewSize(updatedBlob.size);
                      }}
                      placeholder="Extracted bullet points will appear here. Edit lines directly to update your PowerPoint presentation slide!"
                      className="w-full rounded-xl border border-border/80 bg-card p-4 font-sans text-xs text-foreground focus:border-accent focus:outline-none resize-none leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Presentation className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span>
                        <strong>Live PowerPoint Builder</strong>: Edits will be packaged directly into your downloaded <strong className="text-foreground">.pptx</strong> file.
                      </span>
                    </span>
                    <span className="font-mono font-bold">
                      {rawOcrDocumentLines.length} bullet points
                    </span>
                  </div>
                </div>
              </div>
            ) : hasProcessed && ocrIsEmpty ? (
              /* Anti-hallucination Clean Empty State Alert */
              <div className="w-full max-w-xl rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-6 flex flex-col items-center text-center gap-3 mt-8 shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">
                    No Readable Text Detected in Image
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                    The OCR scan completed cleanly and verified this image does not contain legible text characters. To extract text, please try an image with sharper text, higher contrast, or select a different OCR language in settings.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOcrContrastMode("inverted");
                      setTimeout(() => processImage(), 50);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-background hover:bg-muted px-3.5 py-1.5 text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all"
                  >
                    <span>Try Inverted Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOcrContrastMode("high");
                      setTimeout(() => processImage(), 50);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-background hover:bg-muted px-3.5 py-1.5 text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all"
                  >
                    <span>Try High Contrast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOcrLanguageDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <Languages className="h-3.5 w-3.5" />
                    <span>Change Language</span>
                  </button>
                </div>
              </div>
            ) : tool.slug === "rotate-image" && rotateBatch.length > 1 ? (
              /* Processed Batch Grid with Clean Unified Header */
              <div className="w-full flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0">
                      <Check className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          All {rotateBatch.length} Images Rotated
                        </span>
                        <span className="rounded-full bg-accent/15 border border-accent/30 text-accent px-2 py-0.5 text-[10px] font-mono font-bold">
                          {rotateBatchOutputFormat} format
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        ZIP bundle ready for download
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFullscreenActiveIndex(0);
                      setIsFullscreenPreview(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer ml-auto"
                    title="Enlarge preview and switch between all images"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-accent" />
                    <span>Enlarge &amp; Switch</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
                  {rotateBatch.map((item: any, idx: any) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-3 shadow-md hover:border-accent/40 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-xs font-bold truncate">
                        <span className="truncate">{idx + 1}. {item.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0 bg-muted/60 px-1.5 py-0.5 rounded-md">
                          {((item.rotation % 360) + 360) % 360}°
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setFullscreenActiveIndex(idx);
                          setIsFullscreenPreview(true);
                        }}
                        className="group/img relative aspect-4/3 flex items-center justify-center bg-muted/20 rounded-xl overflow-hidden p-2 cursor-zoom-in transition-all hover:bg-muted/40"
                        title="Click to enlarge and preview this image"
                      >
                        <img
                          src={item.processedDataUrl || item.dataUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain select-none group-hover/img:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity duration-200 backdrop-blur-[2px]">
                          <Maximize2 className="h-4 w-4 text-accent" />
                          <span>Enlarge</span>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {item.processedWidth || item.width} × {item.processedHeight || item.height} px
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setFullscreenActiveIndex(idx);
                              setIsFullscreenPreview(true);
                            }}
                            className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs"
                            title="Enlarge and switch through images"
                          >
                            <Maximize2 className="h-3 w-3 text-accent" />
                            <span>Enlarge</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleRotatedItem(item)}
                            className="flex items-center gap-1 rounded-xl bg-foreground text-background px-2.5 py-1 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs"
                            title="Download this single rotated image"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Image Preview Studio Canvas */
              <div
                className={`relative flex-1 w-full min-h-[420px] max-h-[560px] flex items-center justify-center p-6 sm:p-8 rounded-2xl border transition-all duration-300 overflow-hidden ${previewBackdrop === "checker"
                    ? "border-border/60 bg-[#f8f9fb] dark:bg-[#141418] [background-image:linear-gradient(45deg,rgba(120,120,130,0.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(120,120,130,0.08)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(120,120,130,0.08)_75%),linear-gradient(-45deg,transparent_75%,rgba(120,120,130,0.08)_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px]"
                    : previewBackdrop === "white"
                      ? "border-border/60 bg-white shadow-inner"
                      : "border-white/10 bg-[#0d0d10] shadow-inner"
                  }`}
              >
                <img
                  src={showOriginalComparison ? imageSrc || undefined : processedSrc || imageSrc || undefined}
                  alt="Processed Output Preview"
                  draggable={false}
                  onDragStart={(e: any) => e.preventDefault()}
                  onContextMenu={(e: any) => e.preventDefault()}
                  className="max-h-[460px] max-w-full object-contain rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-200 select-none workspace-protected-image"
                />
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 w-full items-stretch">
            {/* 1. Primary Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="sm:col-span-2 lg:col-span-6 w-full min-h-[58px] flex items-center justify-center gap-3 rounded-2xl bg-foreground px-6 py-4 text-base font-black text-background shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="h-5 w-5 text-accent shrink-0" />
              <span>
                {isOcrTool
                  ? "Download Extracted Text (.txt)"
                  : tool.slug === "compress-image"
                    ? "Download Compressed Image"
                    : tool.slug === "pdf-to-image"
                      ? documentBlob
                        ? `Download All ${pdfTotalPages} Pages (ZIP)`
                        : pdfTotalPages > 1
                          ? `Download Page ${pdfDocPage} (${pdfDocOutputFormat})`
                          : `Download Image (${pdfDocOutputFormat})`
                      : tool.slug === "powerpoint-to-image"
                        ? documentBlob
                          ? `Download All ${pptTotalSlides} Slides (ZIP)`
                          : pptTotalSlides > 1
                            ? `Download Slide ${pptDocSlide} (${pptDocOutputFormat})`
                            : `Download Slide (${pptDocOutputFormat})`
                        : tool.slug === "word-to-image"
                          ? documentBlob
                            ? `Download All ${wordTotalPages} Pages (ZIP)`
                            : wordTotalPages > 1
                              ? `Download Page ${wordDocPage} (${wordDocOutputFormat})`
                              : `Download Image (${wordDocOutputFormat})`
                          : tool.slug === "excel-to-image"
                            ? documentBlob
                              ? `Download All ${excelTotalSheets} Sheets (ZIP)`
                              : excelTotalSheets > 1
                                ? `Download Sheet ${excelDocSheet} (${excelDocOutputFormat})`
                                : `Download Image (${excelDocOutputFormat})`
                            : tool.slug === "rotate-image"
                              ? rotateBatch.length > 1
                                ? `Download All ${rotateBatch.length} Rotated Images (ZIP)`
                                : "Download Rotated Image"
                              : tool.slug === "convert-to-jpg"
                                ? "Download JPG File"
                                : tool.slug === "convert-from-jpg"
                                  ? `Download ${targetFormatLabel} File`
                                  : tool.slug === "convert-to-png"
                                    ? "Download PNG File"
                                    : tool.slug === "convert-to-webp"
                                      ? "Download WebP File"
                                      : tool.slug === "image-to-pdf"
                                        ? "Download PDF Document"
                                        : tool.slug === "image-to-word"
                                          ? "Download Word Document"
                                          : tool.slug === "image-to-excel"
                                            ? "Download Excel Sheet"
                                            : tool.slug === "image-to-powerpoint"
                                              ? "Download Presentation"
                                              : isConversionTool
                                                ? `Download ${targetFormatLabel} File`
                                                : tool.slug === "resize-image"
                                                  ? "Download Resized Image"
                                                  : tool.slug === "crop-image"
                                                    ? "Download Cropped Image"
                                                    : tool.slug === "square-your-image"
                                                      ? `Download 1:1 Square Image (${squareExportFormat})`
                                                      : `Download ${tool.outputs || "Processed"} File`}
              </span>
              {newSize > 0 && !isOcrTool && (
                <span className="shrink-0 rounded-full bg-background/20 px-2.5 py-0.5 text-xs font-bold font-mono">
                  {formatBytes(newSize || origSize)}
                </span>
              )}
            </button>

            {/* 2. Change Settings Button */}
            <button
              type="button"
              onClick={() => setIsEditingSettings(true)}
              className="sm:col-span-1 lg:col-span-3 w-full min-h-[58px] flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-4 text-xs sm:text-sm font-extrabold text-foreground shadow-md hover:border-foreground hover:bg-secondary active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sliders className="h-4 w-4 text-accent shrink-0" />
              <span>Adjust Settings</span>
            </button>

            {/* 3. Process another File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="sm:col-span-1 lg:col-span-3 w-full min-h-[58px] flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-4 text-xs sm:text-sm font-extrabold text-muted-foreground hover:text-foreground hover:border-foreground/40 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
              title="Upload and process another file"
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span>
                {isOcrTool
                  ? "Scan another Document"
                  : tool.slug === "compress-image"
                    ? "Compress another Image"
                    : isConversionTool
                      ? "Convert another Image"
                      : tool.slug === "resize-image"
                        ? "Resize another Image"
                        : tool.slug === "crop-image"
                          ? "Crop another Image"
                          : tool.slug === "square-your-image"
                            ? "Square another Image"
                            : "Process another File"}
              </span>
            </button>
          </div>

          {/* Studio Trust & Next Workflow Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-muted-foreground">
            <div className="flex items-start gap-3 text-left">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Enterprise-Grade Security &amp; Privacy
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    Professional &amp; Trust-Focused
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your files and data are handled with security-focused safeguards. We prioritize your privacy and take measures to protect your information throughout the processing workflow.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground hidden md:inline">Suggested:</span>
              {isOcrTool ? (
                <>
                  <a
                    href="/chat"
                    className="flex items-center gap-1 font-bold text-foreground hover:text-accent transition-colors"
                  >
                    <span>Summarize with AI Chat</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <span className="text-border">·</span>
                  <a
                    href="/tools/compress-image"
                    className="flex items-center gap-1 font-bold text-foreground hover:text-accent transition-colors"
                  >
                    <span>Compress Scanned Image</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/tools/compress-image"
                    className="flex items-center gap-1 font-bold text-foreground hover:text-accent transition-colors"
                  >
                    <span>Compress Image</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <span className="text-border">·</span>
                  <a
                    href="/tools/remove-background"
                    className="flex items-center gap-1 font-bold text-foreground hover:text-accent transition-colors"
                  >
                    <span>Remove Background</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
  );
}
