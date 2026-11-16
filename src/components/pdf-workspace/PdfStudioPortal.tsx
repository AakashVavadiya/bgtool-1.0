// Full-screen interactive PDF studio portal with direct text/image editing, geometric masks, and signature stamping.
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


export function PdfStudioPortal(props: any) {
  const {
    activeFile,
    processing,
    fileInputRef,
    editEdits,
    editUndoStack,
    editRedoStack,
    editToolMode,
    setEditToolMode,
    editSelectedId,
    setEditSelectedId,
    editCurrentPage,
    setEditCurrentPage,
    editActiveFont,
    setEditActiveFont,
    editActiveFontSize,
    setEditActiveFontSize,
    editActiveColor,
    setEditActiveColor,
    editPageImageUrl,
    editExtractedTextItems,
    editExtractedImageItems,
    editShowDetectedOverlays,
    setEditShowDetectedOverlays,
    editIsLoadingPage,
    editZoom,
    setEditZoom,
    editImageInputRef,
    editReplaceImageInputRef,
    editIsFullscreen,
    setEditIsFullscreen,
    editShowThumbnails,
    setEditShowThumbnails,
    editShowInspector,
    setEditShowInspector,
    editThumbnails,
    pushEditState,
    handleEditUndo,
    handleEditRedo,
    STANDARD_FONTS,
    IMAGE_SHAPE_OPTIONS,
    toggleNativeFullscreen,
    addEditElement,
    activateExtractedTextItem,
    activateExtractedImageItem,
    handleAddQuickStamp,
    updateEditItem,
    duplicateEditItem,
    deleteEditItem,
    currentPageEdits,
    visiblePageEdits,
    selectedEditItem,
    renderEditorCanvas,
    handleProcess,
    handleQuickDownloadEditedPdf
  } = props;

  return (
    <>
      {typeof document !== "undefined" && editIsFullscreen && createPortal(
              <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white flex flex-col h-screen w-screen overflow-hidden selection:bg-[#ff5500]/30">
                {/* 1. PRIMARY TOP STUDIO BAR (Document, Tool Modes, Export Actions) */}
                <header className="px-3 sm:px-5 py-2.5 bg-[#0f0f0f]/95 border-b border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shrink-0 z-40 shadow-xl">
                  {/* Left: Brand + Document Switcher + Page Navigation + Undo/Redo */}
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditIsFullscreen(false)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#1a1a1a] hover:bg-white/15 text-neutral-200 hover:text-white px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
                      title="Minimize Full Screen Editor (Esc)"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Exit Full Screen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#1a1a1a] hover:bg-[#262626] text-white px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
                      title="Open / Change PDF Document"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span className="max-w-[120px] truncate">{activeFile?.name || "Change PDF"}</span>
                    </button>

                    {/* Toggle Page Sidebar */}
                    <button
                      type="button"
                      onClick={() => setEditShowThumbnails((prev: any) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${editShowThumbnails
                        ? "border-[#ff5500]/60 bg-[#ff5500]/15 text-[#ff5500]"
                        : "border-white/15 bg-[#1a1a1a] text-neutral-300 hover:text-white"
                        }`}
                      title="Toggle Page Thumbnails Sidebar"
                    >
                      <PanelLeft className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">Pages</span>
                    </button>

                    {/* Page Switcher */}
                    <div className="flex items-center rounded-xl bg-[#1a1a1a] p-0.5 border border-white/10">
                      <button
                        type="button"
                        disabled={editCurrentPage <= 1}
                        onClick={() => setEditCurrentPage((p: any) => Math.max(1, p - 1))}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-white whitespace-nowrap">
                        {editCurrentPage} / {activeFile?.pageCount || 1}
                      </span>
                      <button
                        type="button"
                        disabled={editCurrentPage >= (activeFile?.pageCount || 1)}
                        onClick={() => setEditCurrentPage((p: any) => Math.min(activeFile?.pageCount || 1, p + 1))}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Undo / Redo */}
                    <div className="flex items-center rounded-xl bg-[#1a1a1a] p-0.5 border border-white/10">
                      <button
                        type="button"
                        disabled={editUndoStack.length === 0}
                        onClick={handleEditUndo}
                        className="rounded-lg p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={editRedoStack.length === 0}
                        onClick={handleEditRedo}
                        className="rounded-lg p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Center: Interactive PDF Editing Toolbelt */}
                  <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-2xl border border-white/15 shadow-inner overflow-x-auto no-scrollbar">
                    {[
                      { id: "select" as const, label: "Edit / Select", icon: MousePointer, tip: "Click any PDF text or photo to edit in-place with matching font & style" },
                      { id: "text" as const, label: "Text", icon: Type, tip: "Click existing text to edit or click empty space to add text" },
                      { id: "crop-photo" as const, label: "Shape Photo", icon: Crop, tip: "Click a photo or drag a selection box over any image/graphic to shape, move, or resize it" },
                      { id: "whiteout" as const, label: "Whiteout", icon: Eraser, tip: "Click page to erase/cover area with whiteout block" },
                      { id: "highlight" as const, label: "Highlight", icon: Highlighter, tip: "Click page to highlight area" },
                      { id: "rect" as const, label: "Box", icon: Square, tip: "Click page to add rectangle box" },
                      { id: "circle" as const, label: "Circle", icon: Circle, tip: "Click page to add circle / oval shape" },
                      { id: "line" as const, label: "Line", icon: Minus, tip: "Click page to add horizontal line / divider" },
                    ].map((tItem: any) => {
                      const IconComp = tItem.icon;
                      const isActive = editToolMode === tItem.id;
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => setEditToolMode(tItem.id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${isActive
                            ? "bg-[#ff5500] text-white shadow-md"
                            : "text-neutral-300 hover:text-white hover:bg-white/10"
                            }`}
                          title={tItem.tip}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                          <span>{tItem.label}</span>
                        </button>
                      );
                    })}

                    <div className="h-4 w-px bg-white/15 mx-0.5" />

                    {/* Form Checkbox Quick Insert */}
                    <button
                      type="button"
                      onClick={() =>
                        addEditElement("text", 30, 30, {
                          text: "[X]",
                          fontFamily: "Courier-Bold",
                          fontSize: 14,
                          color: "#0a0a0a",
                          hasWhiteout: false,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
                      title="Insert Form Checkmark / Checkbox"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>Check</span>
                    </button>

                    {/* Insert Image / Signature */}
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
                      title="Upload & place image, logo, or signature on page"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>+ Photo</span>
                    </button>

                    {/* Quick Stamp Menu */}
                    <div className="relative flex items-center">
                      <Stamp className="h-3.5 w-3.5 text-[#ff5500] ml-2 pointer-events-none" />
                      <select
                        value=""
                        onChange={(e: any) => {
                          const val = e.target.value;
                          if (!val) return;
                          if (val === "APPROVED") handleAddQuickStamp("APPROVED", "#059669");
                          else if (val === "CONFIDENTIAL") handleAddQuickStamp("CONFIDENTIAL", "#dc2626");
                          else if (val === "PAID") handleAddQuickStamp("PAID", "#ff5500");
                          else if (val === "DRAFT") handleAddQuickStamp("DRAFT", "#d97706");
                          else if (val === "DATE") handleAddQuickStamp(new Date().toISOString().slice(0, 10), "#0a0a0a");
                        }}
                        className="bg-transparent text-neutral-300 hover:text-white text-xs font-extrabold pl-1.5 pr-2 py-1.5 rounded-xl focus:outline-none cursor-pointer"
                        title="Add a quick stamp or today's date"
                      >
                        <option value="" className="bg-[#141414] text-white">Stamp...</option>
                        <option value="APPROVED" className="bg-[#141414] text-white">APPROVED</option>
                        <option value="CONFIDENTIAL" className="bg-[#141414] text-[#ff5500]">CONFIDENTIAL</option>
                        <option value="PAID" className="bg-[#141414] text-[#ff5500]">PAID</option>
                        <option value="DRAFT" className="bg-[#141414] text-amber-400">DRAFT</option>
                        <option value="DATE" className="bg-[#141414] text-white">Today&apos;s Date</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Zoom + Fullscreen + Instant Download + Save & Export */}
                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center rounded-xl bg-[#1a1a1a] p-0.5 border border-white/15">
                      <button
                        type="button"
                        disabled={editZoom <= 50}
                        onClick={() => setEditZoom((z: any) => Math.max(50, z - 25))}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Zoom Out (Ctrl -)"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-11 text-center text-xs font-mono font-bold text-white">
                        {editZoom}%
                      </span>
                      <button
                        type="button"
                        disabled={editZoom >= 250}
                        onClick={() => setEditZoom((z: any) => Math.min(250, z + 25))}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Zoom In (Ctrl +)"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditZoom(100)}
                        className="text-[10px] px-1.5 py-0.5 text-neutral-400 hover:text-white border-l border-white/15 cursor-pointer"
                        title="Reset Zoom to 100%"
                      >
                        100%
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleNativeFullscreen}
                      className="p-2 rounded-xl border border-white/15 bg-[#1a1a1a] hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer transition-all"
                      title="Toggle Monitor Fullscreen (F11)"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Direct Download Button (stay in editor) */}
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleQuickDownloadEditedPdf}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white hover:bg-neutral-200 text-[#0a0a0a] px-3 py-2 text-xs font-extrabold transition-all cursor-pointer"
                      title="Download edited PDF directly while staying in the Full-Screen Editor"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    {/* Save & Finish Button */}
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleProcess}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] disabled:opacity-50 text-white px-4 py-2 text-xs sm:text-sm font-black shadow-lg shadow-[#ff5500]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Save &amp; Export ({editEdits.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </header>

                {/* 2. SECONDARY FORMATTING, FONT STYLE & PHOTO SHAPING RIBBON */}
                <div className="px-4 py-2 bg-[#141414] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Font Family & Style Dropdown (All 12 PostScript Fonts: Normal, Bold, Italic, Bold-Italic) */}
                    <select
                      value={selectedEditItem?.fontFamily || editActiveFont}
                      onChange={(e: any) => {
                        const val = e.target.value as PdfStandardFontName;
                        setEditActiveFont(val);
                        if (editSelectedId) updateEditItem(editSelectedId, { fontFamily: val });
                      }}
                      className="rounded-xl border border-white/15 bg-[#1f1f1f] px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-[#ff5500] cursor-pointer"
                    >
                      {STANDARD_FONTS.map((f: any) => (
                        <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }} className="bg-[#141414] text-white">
                          {f.name}
                        </option>
                      ))}
                    </select>

                    {/* Font Size Stepper */}
                    <div className="flex items-center rounded-xl bg-[#1f1f1f] p-0.5 border border-white/15">
                      <button
                        type="button"
                        onClick={() => {
                          const base = selectedEditItem?.fontSize || editActiveFontSize;
                          const next = Math.max(6, base - 1);
                          setEditActiveFontSize(next);
                          if (editSelectedId) updateEditItem(editSelectedId, { fontSize: next });
                        }}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white cursor-pointer"
                        title="Decrease font size"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center font-mono text-xs font-bold text-white">
                        {selectedEditItem?.fontSize || editActiveFontSize}pt
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const base = selectedEditItem?.fontSize || editActiveFontSize;
                          const next = Math.min(96, base + 1);
                          setEditActiveFontSize(next);
                          if (editSelectedId) updateEditItem(editSelectedId, { fontSize: next });
                        }}
                        className="rounded-lg p-1 text-neutral-300 hover:text-white cursor-pointer"
                        title="Increase font size"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center gap-1 bg-[#1f1f1f] p-1 rounded-xl border border-white/15">
                      {[
                        { color: "#0a0a0a", label: "Black" },
                        { color: "#ff5500", label: "Brand Orange" },
                        { color: "#dc2626", label: "Red" },
                        { color: "#16a34a", label: "Green" },
                        { color: "#facc15", label: "Yellow" },
                        { color: "#ffffff", label: "White" },
                      ].map((c: any) => {
                        const activeCol = selectedEditItem?.color || editActiveColor;
                        return (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => {
                              setEditActiveColor(c.color);
                              if (editSelectedId) updateEditItem(editSelectedId, { color: c.color });
                            }}
                            style={{ backgroundColor: c.color }}
                            className={`h-4 w-4 rounded-full border border-white/30 cursor-pointer transition-transform ${activeCol === c.color ? "scale-125 ring-2 ring-[#ff5500]" : "hover:scale-110"
                              }`}
                            title={c.label}
                          />
                        );
                      })}
                      <input
                        type="color"
                        value={selectedEditItem?.color || editActiveColor}
                        onChange={(e: any) => {
                          setEditActiveColor(e.target.value);
                          if (editSelectedId) updateEditItem(editSelectedId, { color: e.target.value });
                        }}
                        className="h-4 w-4 rounded-full border border-white/20 cursor-pointer bg-transparent p-0 overflow-hidden"
                        title="Custom Color"
                      />
                    </div>

                    {/* Shape Controls when a Photo or Box is selected (or quick-unlock first page photo) */}
                    {selectedEditItem && (selectedEditItem.kind === "image" || selectedEditItem.kind === "rect" || selectedEditItem.kind === "circle") ? (
                      <div className="flex items-center gap-1 bg-[#1f1f1f] border border-white/15 rounded-xl px-2 py-0.5">
                        <Shapes className="h-3.5 w-3.5 text-[#ff5500] mr-0.5" />
                        <span className="text-[11px] font-bold text-white mr-1">Shape:</span>
                        {IMAGE_SHAPE_OPTIONS.map((s: any) => {
                          const currentSh = selectedEditItem.imageShape || (selectedEditItem.kind === "circle" ? "circle" : "rect");
                          const isActiveShape = currentSh === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                updateEditItem(selectedEditItem.id, {
                                  imageShape: s.id,
                                  ...(selectedEditItem.kind === "image" &&
                                    s.id !== "rect" &&
                                    (selectedEditItem.borderWidth ?? 0) === 0
                                    ? { borderWidth: 2, borderColor: selectedEditItem.borderColor || "#0a0a0a" }
                                    : {}),
                                })
                              }
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${isActiveShape
                                ? "bg-[#ff5500] text-white shadow"
                                : "text-neutral-300 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                        {selectedEditItem.kind === "image" && (
                          <button
                            type="button"
                            onClick={() => editReplaceImageInputRef.current?.click()}
                            className="ml-1 px-2 py-0.5 rounded-lg bg-white text-[#0a0a0a] hover:bg-neutral-200 text-[11px] font-bold cursor-pointer"
                          >
                            Replace Photo
                          </button>
                        )}
                      </div>
                    ) : (
                      editExtractedImageItems.length > 0 && (
                        <div className="flex items-center gap-1 bg-[#1f1f1f] border border-white/15 rounded-xl px-2 py-0.5">
                          <Shapes className="h-3.5 w-3.5 text-[#ff5500]" />
                          <span className="text-[11px] font-bold text-neutral-200">Shape Page Photo:</span>
                          {(["rounded", "circle", "pill", "diamond", "hexagon"] as PdfImageShape[]).map((sh: any) => (
                            <button
                              key={sh}
                              type="button"
                              onClick={() => activateExtractedImageItem(editExtractedImageItems[0]!, sh)}
                              className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[#ff5500] hover:text-white text-neutral-200 text-[11px] font-extrabold capitalize transition-all cursor-pointer"
                            >
                              {sh}
                            </button>
                          ))}
                        </div>
                      )
                    )}

                    {/* Auto-Detect Text & Photos Toggle */}
                    <button
                      type="button"
                      onClick={() => setEditShowDetectedOverlays((prev: any) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${editShowDetectedOverlays
                        ? "border-[#ff5500]/60 bg-[#ff5500]/15 text-[#ff5500]"
                        : "border-white/15 bg-[#1f1f1f] text-neutral-300 hover:text-white"
                        }`}
                      title="Highlight all existing text & photos on the PDF so you can click any item to edit in-place"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        In-Place Detection ({editExtractedTextItems.length} Text · {editExtractedImageItems.length} Photos)
                      </span>
                    </button>
                  </div>

                  {/* Right side of Secondary Ribbon: Selected Element Actions & Form Inspector Toggle */}
                  <div className="flex items-center gap-2">
                    {selectedEditItem && (
                      <div className="flex items-center gap-1.5 bg-[#1f1f1f] border border-white/15 rounded-xl px-2.5 py-1">
                        <span className="text-[11px] font-bold text-[#ff5500] uppercase">
                          {selectedEditItem.kind || "text"} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => duplicateEditItem(selectedEditItem.id)}
                          className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white cursor-pointer"
                          title="Duplicate selected item"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEditItem(selectedEditItem.id)}
                          className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Delete selected item (Del)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {editEdits.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Reset all edits on this document?")) {
                            pushEditState([]);
                            setEditSelectedId(null);
                          }
                        }}
                        className="rounded-xl border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 text-rose-300 px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset All ({editEdits.length})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditShowInspector((prev: any) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${editShowInspector
                        ? "border-[#ff5500]/60 bg-[#ff5500]/15 text-[#ff5500]"
                        : "border-white/15 bg-[#1f1f1f] text-neutral-300 hover:text-white"
                        }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        Form &amp; Elements ({editExtractedTextItems.length + editExtractedImageItems.length + visiblePageEdits.length})
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. STUDIO WORKSPACE BODY */}
                <div className="flex-1 flex overflow-hidden relative">
                  {/* Left: Collapsible Page Thumbnails Sidebar */}
                  {editShowThumbnails && (
                    <aside className="w-48 bg-[#121212] border-r border-white/10 flex flex-col shrink-0 overflow-hidden z-20">
                      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Pages ({activeFile?.pageCount || 1})
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditShowThumbnails(false)}
                          className="text-neutral-400 hover:text-white p-1 rounded-md cursor-pointer"
                          title="Collapse Pages Sidebar"
                        >
                          <PanelLeftClose className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-3 studio-dark-scrollbar">
                        {Array.from({ length: activeFile?.pageCount || 1 }).map((_: any, idx: any) => {
                          const pageNum = idx + 1;
                          const isCurrent = editCurrentPage === pageNum;
                          const pageEditsCount = editEdits.filter((e: any) => e.pageNumber === pageNum).length;

                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setEditCurrentPage(pageNum)}
                              className={`w-full text-left rounded-xl border p-2 transition-all cursor-pointer group flex flex-col items-center gap-1.5 ${isCurrent
                                ? "border-[#ff5500] bg-[#ff5500]/10 ring-2 ring-[#ff5500]/50 shadow-lg"
                                : "border-white/10 bg-[#1a1a1a] hover:bg-[#242424] hover:border-white/20"
                                }`}
                            >
                              <div className="w-full aspect-[1/1.4] bg-white rounded-md overflow-hidden relative shadow-sm flex items-center justify-center">
                                {editThumbnails[pageNum] ? (
                                  <img
                                    src={editThumbnails[pageNum]}
                                    alt={`Page ${pageNum}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full w-full bg-neutral-100 text-neutral-400 text-xs font-bold">
                                    P.{pageNum}
                                  </div>
                                )}
                                {pageEditsCount > 0 && (
                                  <span className="absolute top-1 right-1 bg-[#ff5500] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md">
                                    {pageEditsCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between w-full px-1">
                                <span className={`text-[11px] font-bold ${isCurrent ? "text-[#ff5500]" : "text-neutral-400 group-hover:text-white"}`}>
                                  Page {pageNum}
                                </span>
                                {pageEditsCount > 0 && (
                                  <span className="text-[10px] text-[#ff5500] font-mono">
                                    {pageEditsCount} {pageEditsCount === 1 ? "edit" : "edits"}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </aside>
                  )}

                  {/* Center: Main Interactive PDF Page Viewport */}
                  <main className="flex-1 overflow-auto bg-[#0a0a0a] p-4 sm:p-10 flex flex-col items-center studio-dark-scrollbar relative">
                    {/* Subtle Workspace Background Grid */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />

                    {/* Active Tool Mode Status Pill */}
                    <div className="mb-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#141414]/95 px-4 py-1 text-xs text-neutral-200 shadow-md">
                      <span className="h-2 w-2 rounded-full bg-[#ff5500] animate-pulse" />
                      {editToolMode === "select" ? (
                        <span>
                          <strong>In-Place Form &amp; Element Editor:</strong> Click any text on the PDF to edit with the same font &amp; style, or click any photo to shape, move, or resize it
                        </span>
                      ) : editToolMode === "crop-photo" ? (
                        <span>
                          <strong>Select / Shape Photo Mode:</strong> Click any detected photo OR drag a box around any image on the page to unlock &amp; shape it (Circle, Rounded, Pill, Diamond, Hexagon)
                        </span>
                      ) : editToolMode === "whiteout" ? (
                        <span><strong>Whiteout / Erase Mode:</strong> Click anywhere on the page to place a resizable Whiteout block</span>
                      ) : editToolMode === "highlight" ? (
                        <span><strong>Highlight Mode:</strong> Click anywhere on the page to place a resizable Highlighter bar</span>
                      ) : editToolMode === "rect" ? (
                        <span><strong>Box Mode:</strong> Click anywhere on the page to place a resizable Shape (Rectangle, Rounded, Circle, Pill, Diamond, Hexagon)</span>
                      ) : editToolMode === "circle" ? (
                        <span><strong>Circle Mode:</strong> Click anywhere on the page to place a resizable Circle / Oval</span>
                      ) : editToolMode === "line" ? (
                        <span><strong>Line Mode:</strong> Click anywhere on the page to place a resizable Line / Divider</span>
                      ) : (
                        <span><strong>Text Mode:</strong> Click any existing PDF text to edit in-place with matching font, or click empty space to add new text</span>
                      )}
                    </div>

                    {/* High-Resolution Interactive PDF Page Canvas */}
                    <div className="relative z-10 flex justify-center pb-24">
                      {editIsLoadingPage ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-3">
                          <Loader2 className="h-8 w-8 text-[#ff5500] animate-spin" />
                          <span className="text-sm font-bold text-neutral-300">Extracting PDF Text, Fonts &amp; Photos...</span>
                        </div>
                      ) : editPageImageUrl ? (
                        renderEditorCanvas(true)
                      ) : null}
                    </div>
                  </main>

                  {/* Right: Live Form & Page Elements Inspector (Single Unified Custom Scrollbar) */}
                  {editShowInspector && (
                    <aside className="w-80 bg-[#121212] border-l border-white/10 hidden lg:flex flex-col shrink-0 overflow-hidden z-20">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-[#121212]">
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ff5500] block">
                            Form &amp; Page Editor
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            Edit page text &amp; photos directly like a form
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditShowInspector(false)}
                          className="text-neutral-400 hover:text-white text-xs cursor-pointer p-1"
                          title="Hide Inspector Panel"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 studio-dark-scrollbar">
                        {/* SECTION 1: DETECTED PHOTOS / IMAGES ON PAGE */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5 text-[#ff5500]" />
                              <span>Page Photos ({editExtractedImageItems.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditToolMode("crop-photo")}
                              className="text-[10px] font-bold text-[#ff5500] hover:text-white underline cursor-pointer"
                              title="Drag a box around any region on the PDF to turn it into a shapeable photo"
                            >
                              + Crop Area as Photo
                            </button>
                          </div>

                          {editExtractedImageItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/15 p-3 text-[11px] text-neutral-400 space-y-1.5">
                              <p>No separate embedded photos detected.</p>
                              <button
                                type="button"
                                onClick={() => setEditToolMode("crop-photo")}
                                className="w-full rounded-lg bg-[#ff5500]/15 hover:bg-[#ff5500] border border-[#ff5500]/40 text-[#ff5500] hover:text-white py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Drag-Select Photo on Page to Shape It
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {editExtractedImageItems.map((imgItem: any, idx: any) => {
                                const activeEdit = currentPageEdits.find((e: any) => e.sourceId === imgItem.id && !e.isDeleted);
                                const activeShape = activeEdit?.imageShape || "rect";
                                return (
                                  <div
                                    key={imgItem.id}
                                    className={`rounded-xl border p-2.5 space-y-2 transition-all ${activeEdit && editSelectedId === activeEdit.id
                                      ? "border-[#ff5500] bg-[#ff5500]/10"
                                      : "border-white/10 bg-[#1a1a1a]"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={activeEdit?.imageDataUrl || imgItem.imageDataUrl}
                                        alt={`Photo ${idx + 1}`}
                                        className="h-12 w-12 rounded-lg object-contain bg-white p-0.5 border border-white/20 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-white truncate">
                                          Photo #{idx + 1}
                                        </p>
                                        <p className="text-[10px] text-neutral-400">
                                          Click a shape below to mask, move, or resize
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const id = activateExtractedImageItem(imgItem, activeShape);
                                          setEditSelectedId(id);
                                          setTimeout(() => editReplaceImageInputRef.current?.click(), 60);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-white text-[#0a0a0a] hover:bg-neutral-200 text-[10px] font-bold cursor-pointer shrink-0"
                                        title="Replace this photo with a new uploaded image"
                                      >
                                        Replace
                                      </button>
                                    </div>

                                    {/* Shape buttons for this photo */}
                                    <div className="grid grid-cols-3 gap-1">
                                      {IMAGE_SHAPE_OPTIONS.map((s: any) => {
                                        const isSelectedShape = Boolean(activeEdit && activeShape === s.id);
                                        return (
                                          <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => activateExtractedImageItem(imgItem, s.id)}
                                            className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer truncate ${isSelectedShape
                                              ? "border-[#ff5500] bg-[#ff5500] text-white"
                                              : "border-white/10 bg-[#121212] text-neutral-300 hover:text-white hover:border-[#ff5500]/50"
                                              }`}
                                          >
                                            {s.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* SECTION 2: FORM FIELDS (ALL DETECTED PAGE TEXT EDITABLE WITH MATCHING FONT & STYLE) */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                              <Type className="h-3.5 w-3.5 text-[#ff5500]" />
                              <span>Page Text Fields ({editExtractedTextItems.length})</span>
                            </span>
                            <span className="text-[10px] text-neutral-400">Auto-matched font</span>
                          </div>

                          {editExtractedTextItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/15 p-3 text-[11px] text-neutral-400 text-center">
                              No selectable text layer detected on this page. Click <strong>+ Add Text Box</strong> to type anywhere.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {editExtractedTextItems.map((txtItem: any, idx: any) => {
                                const linkedEdit = currentPageEdits.find((e: any) => e.sourceId === txtItem.id);
                                const isDeleted = linkedEdit?.isDeleted;
                                const currentValue = linkedEdit ? linkedEdit.text : txtItem.text;
                                const currentFont = linkedEdit ? linkedEdit.fontFamily : txtItem.fontFamily;
                                const currentSize = linkedEdit ? linkedEdit.fontSize : txtItem.fontSize;

                                if (isDeleted) return null;

                                return (
                                  <div
                                    key={txtItem.id}
                                    className={`rounded-xl border p-2 transition-all space-y-1 ${linkedEdit && editSelectedId === linkedEdit.id
                                      ? "border-[#ff5500] bg-[#ff5500]/15"
                                      : linkedEdit
                                        ? "border-[#ff5500]/40 bg-[#1f1f1f]"
                                        : "border-white/10 bg-[#1a1a1a] hover:border-white/25"
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400">
                                      <span className="font-mono truncate">
                                        #{idx + 1} · {currentFont} · {currentSize}pt
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {linkedEdit && (
                                          <span className="text-[9px] font-bold text-[#ff5500] bg-[#ff5500]/15 px-1.5 py-0.2 rounded">
                                            Edited
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const id = activateExtractedTextItem(txtItem);
                                            deleteEditItem(id);
                                          }}
                                          className="text-neutral-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                          title="Erase this text from the PDF"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={currentValue}
                                      onFocus={() => activateExtractedTextItem(txtItem)}
                                      onChange={(e: any) => activateExtractedTextItem(txtItem, e.target.value)}
                                      className="w-full rounded-lg bg-[#0a0a0a] border border-white/15 focus:border-[#ff5500] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* SECTION 3: ALL ACTIVE LAYER EDITS */}
                        {visiblePageEdits.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1 block">
                              Active Edits on Page {editCurrentPage} ({visiblePageEdits.length})
                            </span>
                            <div className="space-y-1.5">
                              {visiblePageEdits.map((item: any, i: any) => {
                                const isSel = editSelectedId === item.id;
                                const kind = item.kind || "text";
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setEditSelectedId(item.id)}
                                    className={`rounded-xl border p-2 text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${isSel
                                      ? "border-[#ff5500] bg-[#ff5500]/15 text-white"
                                      : "border-white/10 bg-[#1a1a1a] hover:bg-[#242424] text-neutral-300"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        style={{ backgroundColor: item.color || "#ffffff" }}
                                        className="h-3 w-3 rounded-full border border-white/30 shrink-0"
                                      />
                                      <span className="truncate font-semibold">
                                        {kind === "text"
                                          ? item.text || `Text #${i + 1}`
                                          : kind === "image"
                                            ? `Photo (${item.imageShape || "rect"})`
                                            : `${kind.toUpperCase()} (${item.imageShape || (kind === "circle" ? "circle" : "rect")}) #${i + 1}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e: any) => {
                                          e.stopPropagation();
                                          duplicateEditItem(item.id);
                                        }}
                                        className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white cursor-pointer"
                                        title="Duplicate"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e: any) => {
                                          e.stopPropagation();
                                          deleteEditItem(item.id);
                                        }}
                                        className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </aside>
                  )}
                </div>
              </div>,
              document.body
            )}
    </>
  );
}
