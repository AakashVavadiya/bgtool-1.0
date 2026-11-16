// Completed PDF output studio preview, download/print actions, and follow-up workflow cards.
import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  FileText,
  FilePlus,
  ArrowRight,
  Download,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCw,
  Sliders,
  Scissors,
  Layers,
  Wand2,
  Shield,
  Trash2,
  Plus,
  KeyRound,
  FileCheck,
  Receipt,
  PenTool,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelLeftClose,
  LayoutGrid,
  Loader2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Split,
  AlertCircle,
  Sparkles,
  Printer,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileDown,
  Type,
  Eraser,
  Move,
  ZoomIn,
  ZoomOut,
  Palette,
  Minus,
  Undo2,
  Redo2,
  Square,
  Highlighter,
  Image as ImageIcon,
  MousePointer,
  Stamp,
  Circle,
  Crop,
  CheckSquare,
  Shapes,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fireConfetti } from "@/lib/confetti";
import { type Tool } from "@/lib/tools";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import {
  mergePdfDocuments,
  splitPdfDocument,
  rotatePdfPages,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  compressPdfDocument,
  protectPdfDocument,
  flattenPdfDocument,
  changePdfPageDimensions,
  generateInvoicePdf,
  convertImagesToPdf,
  applyEditsToPdf,
  type PdfTextEditItem,
  type PdfStandardFontName,
  type PdfEditElementKind,
  type PdfImageShape,
  type InvoiceData,
} from "@/lib/pdf-engine";
import {
  generateFileThumbnail,
  renderPdfPage,
  extractPdfPageElements,
  cropRegionFromPageDataUrl,
  type ExtractedPdfTextItem,
  type ExtractedPdfImageItem,
} from "@/lib/pdf-preview";
import { PdfPreviewViewer } from "@/components/PdfPreviewViewer";
import { Telemetry, REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { TokenCoin } from "@/components/TokenCoins";

interface UploadedPdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount?: number | undefined;
  thumbnailUrl?: string | undefined;
  isLoadingThumb?: boolean | undefined;
}

// Helper: Convert [1, 2, 4, 5, 6, 8] -> "1-2, 4-6, 8"
function pagesToRangeString(pages: number[]): string {
  if (!pages || pages.length === 0) return "";
  const sorted = Array.from(new Set(pages)).sort((a: any, b: any) => a - b);
  if (sorted.length === 0) return "";
  const ranges: string[] = [];
  let start: number = sorted[0]!;
  let prev: number = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i]!;
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(", ");
}

// Helper: Convert "1-2, 4-6, 8" -> [1, 2, 4, 5, 6, 8]
function rangeStringToPages(rangeStr: string, totalPages: number): number[] {
  const result = new Set<number>();
  if (!rangeStr || !rangeStr.trim()) return [];
  const parts = rangeStr.split(",").map((s: any) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const tokens = part.split("-").map((s: any) => parseInt(s.trim(), 10));
      const startVal = tokens[0];
      const endVal = tokens[1];
      const start = Math.max(1, typeof startVal === "number" && !isNaN(startVal) ? startVal : 1);
      const end = Math.min(totalPages, typeof endVal === "number" && !isNaN(endVal) ? endVal : totalPages);
      for (let p = start; p <= end; p++) {
        result.add(p);
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p);
      }
    }
  }
  return Array.from(result).sort((a: any, b: any) => a - b);
}

// Helper: Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


export function PdfCompletedView(props: any) {
  const {
    hasProcessed,
    setHasProcessed,
    setResultBlob,
    resultBuffer,
    setResultBuffer,
    resultFileName,
    resultSize,
    originalTotalSize,
    resultPageCount,
    copiedLink,
    setPreviewModalItem,
    isCompressTool,
    handleDownload,
    handlePrint,
    handleOpenInNewTab,
    copyShareLink
  } = props;

  return (
    <>
      {hasProcessed && (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in-50 slide-in-from-bottom-6 duration-300">
          {/* Main 2-Column Responsive Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Live Expansive Document Studio Previewer */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    High-Resolution Document Studio Preview
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span className="hidden sm:inline">Use zoom &amp; thumbnail strip below</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (resultBuffer) {
                        setPreviewModalItem({
                          buffer: resultBuffer,
                          name: resultFileName,
                          size: resultSize,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-accent font-bold hover:underline cursor-pointer"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Fullscreen</span>
                  </button>
                </div>
              </div>

              {resultBuffer && (
                <PdfPreviewViewer
                  buffer={resultBuffer}
                  fileName={resultFileName}
                  fileSize={resultSize}
                  compact={false}
                  className="w-full shadow-xl"
                />
              )}
            </div>

            {/* Right 4 Columns: Command Panel & Smart Next Actions */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-4">
              {/* Card 1: Action Center & Document Details */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-lg space-y-4">
                <div className="flex items-start gap-3.5 pb-4 border-b border-border/80">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/15">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Process Complete
                      </span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-extrabold text-foreground truncate" title={resultFileName}>
                      {resultFileName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <span>
                        {resultPageCount} {resultPageCount === 1 ? "Page" : "Pages"}
                      </span>
                      <span>•</span>
                      {isCompressTool && originalTotalSize > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatBytes(resultSize)}
                          {originalTotalSize > resultSize && (
                            <span className="ml-1 text-[10px] rounded bg-emerald-500/15 px-1 py-0.2">
                              -{Math.max(0, Math.round(((originalTotalSize - resultSize) / originalTotalSize) * 100))}%
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="font-bold text-foreground">{formatBytes(resultSize)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Primary Download */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 font-black text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </div>
                    <span className="font-mono text-xs opacity-90">{formatBytes(resultSize)}</span>
                  </button>

                  {/* Print Document */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span>Print Document</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {/* Open in New Tab */}
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>Open in Browser Tab</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {/* Share Link */}
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span>{copiedLink ? "Link Copied to Clipboard!" : "Share Tool Link"}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="pt-2 border-t border-border">
                  {/* Process Another File */}
                  <button
                    type="button"
                    onClick={() => {
                      setHasProcessed(false);
                      setResultBlob(null);
                      setResultBuffer(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card hover:bg-secondary/80 py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Process Another Document</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Next Workflow Steps */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold text-foreground">
                    Continue With This File
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Suggested
                  </span>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/tools/$slug"
                    params={{ slug: "compress-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Compress PDF
                        </div>
                        <div className="text-[10px] text-muted-foreground">Reduce size by up to 90%</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/tools/$slug"
                    params={{ slug: "protect-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Protect PDF
                        </div>
                        <div className="text-[10px] text-muted-foreground">Add password &amp; encryption</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/tools/$slug"
                    params={{ slug: "split-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Split className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Split &amp; Extract
                        </div>
                        <div className="text-[10px] text-muted-foreground">Extract specific pages</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Privacy Seal */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex items-start gap-3.5 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground">
                      Enterprise-Grade Security &amp; Privacy
                    </h4>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Professional &amp; Trust-Focused
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your files and data are handled with security-focused safeguards. We prioritize your privacy and take measures to protect your information throughout the processing workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
