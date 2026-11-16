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
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
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
  const parts = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const tokens = part.split("-").map((s) => parseInt(s.trim(), 10));
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
  return Array.from(result).sort((a, b) => a - b);
}

// Helper: Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function PdfToolWorkspace({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedPdfItem[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  // Primary active file
  const activeFile = files[activeFileIndex] || files[0] || null;
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
  const [resultFileName, setResultFileName] = useState<string>("");
  const [resultSize, setResultSize] = useState<number>(0);
  const [originalTotalSize, setOriginalTotalSize] = useState<number>(0);
  const [resultPageCount, setResultPageCount] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewModalItem, setPreviewModalItem] = useState<{ buffer: ArrayBuffer; name: string; size?: number } | null>(null);
  const [creditBalance, setCreditBalance] = useState(() => AuthUser.getCredits());

  useEffect(() => {
    const handleCreditUpdate = () => {
      setCreditBalance(AuthUser.getCredits());
    };
    window.addEventListener("bg:credit_updated", handleCreditUpdate);
    window.addEventListener(REALTIME_EVENT_NAME, handleCreditUpdate);
    window.addEventListener("storage", handleCreditUpdate);
    return () => {
      window.removeEventListener("bg:credit_updated", handleCreditUpdate);
      window.removeEventListener(REALTIME_EVENT_NAME, handleCreditUpdate);
      window.removeEventListener("storage", handleCreditUpdate);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [hasSignatureDrawn, setHasSignatureDrawn] = useState(false);
  const [showDynamicIsland, setShowDynamicIsland] = useState<boolean>(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState<boolean>(false);
  const [islandTopPx, setIslandTopPx] = useState<number>(104);

  // Merge & Multi-file tool options
  const isMultiFileTool =
    tool.slug === "merge-pdf" ||
    tool.slug === "images-to-pdf" ||
    tool.slug === "image-to-pdf" ||
    tool.slug === "compare-pdfs";

  // Split tool state
  const isSplitTool = tool.slug === "split-pdf" || tool.slug === "halve-pdf-pages";
  const [splitMode, setSplitMode] = useState<"ranges" | "all" | "halve">("ranges");
  const [splitRanges, setSplitRanges] = useState<string>("1-2");
  const [splitSelectedPages, setSplitSelectedPages] = useState<number[]>([]);
  const [splitPageThumbs, setSplitPageThumbs] = useState<{ [pageNum: number]: string }>({});
  const [splitLoadingThumbs, setSplitLoadingThumbs] = useState<boolean>(false);

  // Compress tool state
  const isCompressTool = tool.slug === "compress-pdf" || tool.slug === "web-optimize-pdf";
  const [compressMode, setCompressMode] = useState<"target" | "preset">("target");
  const [compressLevel, setCompressLevel] = useState<"extreme" | "recommended" | "high">("recommended");
  const [targetSizeInput, setTargetSizeInput] = useState<string>("100");
  const [targetSizeUnit, setTargetSizeUnit] = useState<"KB" | "MB">("KB");
  const [convertToGrayscale, setConvertToGrayscale] = useState<boolean>(false);
  const lastInitCompressFileId = useRef<string | null>(null);

  // Edit PDF state
  const isEditTool = tool.slug === "edit-pdf";
  const [editEdits, setEditEdits] = useState<PdfTextEditItem[]>([]);
  const [editUndoStack, setEditUndoStack] = useState<PdfTextEditItem[][]>([]);
  const [editRedoStack, setEditRedoStack] = useState<PdfTextEditItem[][]>([]);
  const [editToolMode, setEditToolMode] = useState<"select" | "crop-photo" | PdfEditElementKind>("select");
  const [editSelectedId, setEditSelectedId] = useState<string | null>(null);
  const [editCurrentPage, setEditCurrentPage] = useState<number>(1);
  const [editActiveFont, setEditActiveFont] = useState<PdfStandardFontName>("Helvetica");
  const [editActiveFontSize, setEditActiveFontSize] = useState<number>(14);
  const [editActiveColor, setEditActiveColor] = useState<string>("#0f172a");
  const [editActiveWhiteout, setEditActiveWhiteout] = useState<boolean>(true);
  const [editPageImageUrl, setEditPageImageUrl] = useState<string | null>(null);
  const [editPageWidthPts, setEditPageWidthPts] = useState<number>(595.28);
  const [editExtractedTextItems, setEditExtractedTextItems] = useState<ExtractedPdfTextItem[]>([]);
  const [editExtractedImageItems, setEditExtractedImageItems] = useState<ExtractedPdfImageItem[]>([]);
  const [editShowDetectedOverlays, setEditShowDetectedOverlays] = useState<boolean>(true);
  const [editCropDragRect, setEditCropDragRect] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);
  const [editIsLoadingPage, setEditIsLoadingPage] = useState<boolean>(false);
  const [editZoom, setEditZoom] = useState<number>(100);
  const [draggingEditId, setDraggingEditId] = useState<string | null>(null);
  const dragStartPos = useRef<{ clientX: number; clientY: number; startXPercent: number; startYPercent: number } | null>(null);
  const [resizingEditId, setResizingEditId] = useState<string | null>(null);
  const resizeStartPos = useRef<{ clientX: number; clientY: number; startWPercent: number; startHPercent: number } | null>(null);
  const editCanvasContainerRef = useRef<HTMLDivElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editReplaceImageInputRef = useRef<HTMLInputElement>(null);
  const [editIsFullscreen, setEditIsFullscreen] = useState<boolean>(true);
  const [editShowThumbnails, setEditShowThumbnails] = useState<boolean>(true);
  const [editShowInspector, setEditShowInspector] = useState<boolean>(true);
  const [editThumbnails, setEditThumbnails] = useState<{ [pageNum: number]: string }>({});

  const pushEditState = (nextEdits: PdfTextEditItem[]) => {
    setEditUndoStack((prev) => [...prev.slice(-29), editEdits]);
    setEditRedoStack([]);
    setEditEdits(nextEdits);
  };

  const handleEditUndo = () => {
    if (editUndoStack.length === 0) return;
    const previous = editUndoStack[editUndoStack.length - 1]!;
    setEditUndoStack((prev) => prev.slice(0, -1));
    setEditRedoStack((prev) => [...prev, editEdits]);
    setEditEdits(previous);
    setEditSelectedId(null);
  };

  const handleEditRedo = () => {
    if (editRedoStack.length === 0) return;
    const next = editRedoStack[editRedoStack.length - 1]!;
    setEditRedoStack((prev) => prev.slice(0, -1));
    setEditUndoStack((prev) => [...prev, editEdits]);
    setEditEdits(next);
    setEditSelectedId(null);
  };

  // Standard fonts matching all 12 Adobe PDF PostScript fonts (with Bold & Italic/Oblique styles)
  const STANDARD_FONTS = useMemo<Array<{
    id: PdfStandardFontName;
    name: string;
    cssFamily: string;
    isBold?: boolean;
    isItalic?: boolean;
  }>>(() => [
    { id: "Helvetica", name: "Helvetica (Clean Sans)", cssFamily: "Helvetica, Arial, sans-serif" },
    { id: "Helvetica-Bold", name: "Helvetica Bold", cssFamily: "Helvetica, Arial, sans-serif", isBold: true },
    { id: "Helvetica-Oblique", name: "Helvetica Italic", cssFamily: "Helvetica, Arial, sans-serif", isItalic: true },
    { id: "Helvetica-BoldOblique", name: "Helvetica Bold Italic", cssFamily: "Helvetica, Arial, sans-serif", isBold: true, isItalic: true },
    { id: "Times-Roman", name: "Times Roman (Classic Serif)", cssFamily: "'Times New Roman', Times, serif" },
    { id: "Times-Bold", name: "Times Roman Bold", cssFamily: "'Times New Roman', Times, serif", isBold: true },
    { id: "Times-Italic", name: "Times Roman Italic", cssFamily: "'Times New Roman', Times, serif", isItalic: true },
    { id: "Times-BoldItalic", name: "Times Roman Bold Italic", cssFamily: "'Times New Roman', Times, serif", isBold: true, isItalic: true },
    { id: "Courier", name: "Courier (Typewriter / Mono)", cssFamily: "'Courier New', Courier, monospace" },
    { id: "Courier-Bold", name: "Courier Bold", cssFamily: "'Courier New', Courier, monospace", isBold: true },
    { id: "Courier-Oblique", name: "Courier Italic", cssFamily: "'Courier New', Courier, monospace", isItalic: true },
    { id: "Courier-BoldOblique", name: "Courier Bold Italic", cssFamily: "'Courier New', Courier, monospace", isBold: true, isItalic: true },
  ], []);

  const IMAGE_SHAPE_OPTIONS = useMemo<Array<{
    id: PdfImageShape;
    label: string;
    cssRadius?: string;
    cssClipPath?: string;
  }>>(() => [
    { id: "rect", label: "Rectangle", cssRadius: "0px" },
    { id: "rounded", label: "Rounded", cssRadius: "16px" },
    { id: "circle", label: "Circle / Oval", cssRadius: "9999px" },
    { id: "pill", label: "Capsule / Pill", cssRadius: "999px" },
    { id: "diamond", label: "Diamond", cssClipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
    { id: "hexagon", label: "Hexagon", cssClipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  ], []);

  // Reset edit state and auto-launch Full-Screen PDF Editor when changing files
  useEffect(() => {
    if (activeFile && isEditTool) {
      setEditEdits([]);
      setEditUndoStack([]);
      setEditRedoStack([]);
      setEditSelectedId(null);
      setEditCurrentPage(1);
      setEditIsFullscreen(true);
    }
  }, [activeFile?.id, isEditTool]);

  // Load high-resolution page rendering AND extract all existing PDF text & photo elements
  useEffect(() => {
    if (!isEditTool || !activeFile) return;
    let isMounted = true;
    setEditIsLoadingPage(true);
    extractPdfPageElements(activeFile.buffer, editCurrentPage, 2.0)
      .then((res) => {
        if (isMounted) {
          setEditPageImageUrl(res.dataUrl);
          setEditPageWidthPts(res.pageWidthPts || 595.28);
          setEditExtractedTextItems(res.textItems);
          setEditExtractedImageItems(res.imageItems);
          setEditIsLoadingPage(false);
        }
      })
      .catch((err) => {
        console.error("Failed to extract page elements for editing:", err);
        renderPdfPage(activeFile.buffer, editCurrentPage, 2.0)
          .then((fallback) => {
            if (isMounted) {
              setEditPageImageUrl(fallback.dataUrl);
              setEditExtractedTextItems([]);
              setEditExtractedImageItems([]);
              setEditIsLoadingPage(false);
            }
          })
          .catch(() => {
            if (isMounted) setEditIsLoadingPage(false);
          });
      });
    return () => {
      isMounted = false;
    };
  }, [isEditTool, activeFile?.id, editCurrentPage]);

  // Generate quick thumbnails for all pages for the left sidebar in editor
  useEffect(() => {
    if (!isEditTool || !activeFile) return;
    let isMounted = true;
    const count = activeFile.pageCount || 1;
    const generateThumbnails = async () => {
      for (let p = 1; p <= Math.min(count, 30); p++) {
        try {
          const res = await renderPdfPage(activeFile.buffer, p, 0.35);
          if (!isMounted) return;
          setEditThumbnails((prev) => ({ ...prev, [p]: res.dataUrl }));
        } catch {
          // continue
        }
      }
    };
    generateThumbnails();
    return () => {
      isMounted = false;
    };
  }, [isEditTool, activeFile?.id]);

  // Full-screen editor body lock and hotkey management
  useEffect(() => {
    if (!editIsFullscreen || !isEditTool || !activeFile) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "Escape") {
        if (editSelectedId) {
          setEditSelectedId(null);
        } else {
          setEditIsFullscreen(false);
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isTyping && editSelectedId) {
        e.preventDefault();
        deleteEditItem(editSelectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) handleEditRedo();
        else handleEditUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !isTyping) {
        e.preventDefault();
        handleEditRedo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setEditZoom((z) => Math.min(250, z + 25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setEditZoom((z) => Math.max(50, z - 25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setEditZoom(100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editIsFullscreen, isEditTool, activeFile?.id, editSelectedId, editUndoStack, editRedoStack, editEdits]);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  // Smooth dragging for elements
  const handleDragStart = (e: React.MouseEvent, id: string, xPercent: number, yPercent: number) => {
    e.stopPropagation();
    e.preventDefault();
    setEditUndoStack((prev) => [...prev.slice(-29), editEdits]);
    setEditRedoStack([]);
    setDraggingEditId(id);
    setEditSelectedId(id);
    dragStartPos.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startXPercent: xPercent,
      startYPercent: yPercent,
    };
  };

  // Smooth resizing for whiteout/highlight/rect/image elements
  const handleResizeStart = (e: React.MouseEvent, id: string, wPercent: number, hPercent: number) => {
    e.stopPropagation();
    e.preventDefault();
    setEditUndoStack((prev) => [...prev.slice(-29), editEdits]);
    setEditRedoStack([]);
    setResizingEditId(id);
    setEditSelectedId(id);
    resizeStartPos.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startWPercent: wPercent,
      startHPercent: hPercent,
    };
  };

  useEffect(() => {
    if (!draggingEditId && !resizingEditId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!editCanvasContainerRef.current) return;
      const rect = editCanvasContainerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (draggingEditId && dragStartPos.current) {
        const deltaXPercent = ((e.clientX - dragStartPos.current.clientX) / rect.width) * 100;
        const deltaYPercent = ((e.clientY - dragStartPos.current.clientY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(95, dragStartPos.current.startXPercent + deltaXPercent));
        const newY = Math.max(0, Math.min(95, dragStartPos.current.startYPercent + deltaYPercent));

        setEditEdits((prev) =>
          prev.map((item) => (item.id === draggingEditId ? { ...item, xPercent: newX, yPercent: newY } : item))
        );
      } else if (resizingEditId && resizeStartPos.current) {
        const deltaWPercent = ((e.clientX - resizeStartPos.current.clientX) / rect.width) * 100;
        const deltaHPercent = ((e.clientY - resizeStartPos.current.clientY) / rect.height) * 100;

        const newW = Math.max(2, Math.min(95, resizeStartPos.current.startWPercent + deltaWPercent));
        const newH = Math.max(1.5, Math.min(95, resizeStartPos.current.startHPercent + deltaHPercent));

        setEditEdits((prev) =>
          prev.map((item) =>
            item.id === resizingEditId ? { ...item, widthPercent: newW, heightPercent: newH } : item
          )
        );
      }
    };

    const handleMouseUp = () => {
      setDraggingEditId(null);
      dragStartPos.current = null;
      setResizingEditId(null);
      resizeStartPos.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingEditId, resizingEditId]);

  const addEditElement = (kind: PdfEditElementKind, xPercent = 28, yPercent = 28, overrides?: Partial<PdfTextEditItem>) => {
    const newId = `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let defaultColor = editActiveColor;
    let widthPercent: number | undefined = undefined;
    let heightPercent: number | undefined = undefined;
    let opacity: number | undefined = undefined;

    if (kind === "whiteout") {
      defaultColor = "#ffffff";
      widthPercent = 24;
      heightPercent = 5;
      opacity = 1;
    } else if (kind === "highlight") {
      defaultColor = "#facc15";
      widthPercent = 26;
      heightPercent = 3.5;
      opacity = 0.38;
    } else if (kind === "rect" || kind === "circle") {
      defaultColor = editActiveColor === "#ffffff" ? "#ef4444" : editActiveColor;
      widthPercent = kind === "circle" ? 16 : 25;
      heightPercent = kind === "circle" ? 12 : 10;
      opacity = 1;
    } else if (kind === "line") {
      defaultColor = editActiveColor === "#ffffff" ? "#0f172a" : editActiveColor;
      widthPercent = 28;
      heightPercent = 2;
      opacity = 1;
    } else if (kind === "image") {
      widthPercent = 22;
      heightPercent = 12;
      opacity = 1;
    }

    const newEdit: PdfTextEditItem = {
      id: newId,
      kind,
      pageNumber: editCurrentPage,
      xPercent,
      yPercent,
      widthPercent,
      heightPercent,
      text: kind === "text" ? "Type text here" : "",
      fontFamily: editActiveFont,
      fontSize: editActiveFontSize,
      color: defaultColor,
      hasWhiteout: kind === "text" ? editActiveWhiteout : false,
      opacity,
      borderWidth: 2,
      imageShape: kind === "image" ? "rect" : undefined,
      ...overrides,
    };

    pushEditState([...editEdits, newEdit]);
    setEditSelectedId(newId);
    return newId;
  };

  // Convert an extracted PDF text line into an active in-place editable text element with matching font & style
  const activateExtractedTextItem = (txtItem: ExtractedPdfTextItem, customText?: string) => {
    const existing = editEdits.find(
      (e) => e.pageNumber === editCurrentPage && e.sourceId === txtItem.id
    );
    if (existing) {
      if (existing.isDeleted) {
        updateEditItem(existing.id, {
          isDeleted: false,
          text: customText !== undefined ? customText : txtItem.text,
        });
      } else if (customText !== undefined) {
        updateEditItem(existing.id, { text: customText });
      }
      setEditSelectedId(existing.id);
      return existing.id;
    }

    const newId = `edit-txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEdit: PdfTextEditItem = {
      id: newId,
      sourceId: txtItem.id,
      kind: "text",
      pageNumber: editCurrentPage,
      xPercent: txtItem.xPercent,
      yPercent: txtItem.yPercent,
      baselineYPercent: txtItem.baselineYPercent,
      widthPercent: Math.max(4, txtItem.widthPercent + 1),
      heightPercent: txtItem.heightPercent,
      origXPercent: txtItem.xPercent,
      origYPercent: txtItem.yPercent,
      origWidthPercent: txtItem.widthPercent,
      origHeightPercent: txtItem.heightPercent,
      bgColor: "#ffffff",
      text: customText !== undefined ? customText : txtItem.text,
      fontFamily: txtItem.fontFamily,
      fontSize: txtItem.fontSize,
      color: txtItem.color || "#0f172a",
      hasWhiteout: false,
    };

    setEditActiveFont(txtItem.fontFamily);
    setEditActiveFontSize(txtItem.fontSize);
    setEditActiveColor(txtItem.color || "#0f172a");
    pushEditState([...editEdits, newEdit]);
    setEditSelectedId(newId);
    return newId;
  };

  // Convert an extracted PDF photo/image into an interactive, movable, shapeable Photo Layer
  const activateExtractedImageItem = (imgItem: ExtractedPdfImageItem, initialShape: PdfImageShape = "rect") => {
    const existing = editEdits.find(
      (e) => e.pageNumber === editCurrentPage && e.sourceId === imgItem.id
    );
    if (existing) {
      const nextBorder = initialShape !== "rect" ? Math.max(2, existing.borderWidth ?? 2) : (existing.borderWidth ?? 0);
      if (existing.isDeleted) {
        updateEditItem(existing.id, { isDeleted: false, imageShape: initialShape, borderWidth: nextBorder });
      } else {
        updateEditItem(existing.id, { imageShape: initialShape, borderWidth: nextBorder });
      }
      setEditSelectedId(existing.id);
      return existing.id;
    }

    const newId = `edit-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEdit: PdfTextEditItem = {
      id: newId,
      sourceId: imgItem.id,
      kind: "image",
      pageNumber: editCurrentPage,
      xPercent: imgItem.xPercent,
      yPercent: imgItem.yPercent,
      widthPercent: imgItem.widthPercent,
      heightPercent: imgItem.heightPercent,
      origXPercent: imgItem.xPercent,
      origYPercent: imgItem.yPercent,
      origWidthPercent: imgItem.widthPercent,
      origHeightPercent: imgItem.heightPercent,
      bgColor: imgItem.bgColor || "#ffffff",
      imageDataUrl: imgItem.imageDataUrl,
      imageShape: initialShape,
      text: "PDF Photo",
      fontFamily: "Helvetica",
      fontSize: 12,
      color: "#0a0a0a",
      hasWhiteout: false,
      borderWidth: initialShape !== "rect" ? 2 : 0,
      borderColor: "#0a0a0a",
      opacity: 1,
    };

    pushEditState([...editEdits, newEdit]);
    setEditSelectedId(newId);
    toast.success("Photo unlocked! Choose a shape (Circle, Rounded, Pill, Diamond, Hexagon), move, resize, or replace it.");
    return newId;
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        addEditElement("image", 30, 30, {
          imageDataUrl: dataUrl,
          imageShape: "rect",
          text: file.name,
          widthPercent: 24,
          heightPercent: 14,
          borderWidth: 0,
          borderColor: "#0a0a0a",
        });
        toast.success("Image placed on page! You can shape, move, or resize it.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReplaceSelectedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editSelectedId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        updateEditItem(editSelectedId, {
          imageDataUrl: dataUrl,
          text: file.name,
        });
        toast.success("Photo replaced while keeping its position and shape!");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddQuickStamp = (stampLabel: string, stampColor: string) => {
    addEditElement("text", 35, 25, {
      text: stampLabel,
      fontFamily: "Helvetica-Bold",
      fontSize: 20,
      color: stampColor,
      hasWhiteout: true,
    });
  };

  // Drag-to-crop any photo/region on the PDF page
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editToolMode !== "crop-photo") return;
    if ((e.target as HTMLElement).closest(".pdf-edit-box")) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setEditCropDragRect({ startX: xPercent, startY: yPercent, curX: xPercent, curY: yPercent });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editCropDragRect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setEditCropDragRect((prev) => (prev ? { ...prev, curX: xPercent, curY: yPercent } : null));
  };

  const handleCanvasMouseUp = async () => {
    if (!editCropDragRect || !editPageImageUrl) return;
    const xPercent = Math.min(editCropDragRect.startX, editCropDragRect.curX);
    const yPercent = Math.min(editCropDragRect.startY, editCropDragRect.curY);
    const widthPercent = Math.abs(editCropDragRect.curX - editCropDragRect.startX);
    const heightPercent = Math.abs(editCropDragRect.curY - editCropDragRect.startY);
    setEditCropDragRect(null);

    if (widthPercent < 2 || heightPercent < 2) return;

    try {
      const { imageDataUrl, bgColor } = await cropRegionFromPageDataUrl(
        editPageImageUrl,
        xPercent,
        yPercent,
        widthPercent,
        heightPercent
      );
      if (imageDataUrl) {
        addEditElement("image", xPercent, yPercent, {
          widthPercent,
          heightPercent,
          origXPercent: xPercent,
          origYPercent: yPercent,
          origWidthPercent: widthPercent,
          origHeightPercent: heightPercent,
          bgColor,
          imageDataUrl,
          imageShape: "rounded",
          borderWidth: 2,
          borderColor: "#0a0a0a",
          text: "Cropped PDF Photo",
        });
        setEditToolMode("select");
        toast.success("Region captured as an interactive Photo! Pick a shape, move, or resize it.");
      }
    } catch (err) {
      console.error("Failed to crop photo region:", err);
    }
  };

  const handlePageCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".pdf-edit-box") || (e.target as HTMLElement).closest(".pdf-detected-item")) {
      return;
    }

    if (editToolMode === "select" || editToolMode === "crop-photo") {
      setEditSelectedId(null);
      return;
    }

    if (editToolMode === "image") {
      editImageInputRef.current?.click();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    addEditElement(editToolMode, xPercent, yPercent);
  };

  const updateEditItem = (id: string, patch: Partial<PdfTextEditItem>) => {
    setEditEdits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const duplicateEditItem = (id: string) => {
    const target = editEdits.find((item) => item.id === id);
    if (!target) return;
    const newId = `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const copy: PdfTextEditItem = {
      ...target,
      id: newId,
      sourceId: undefined,
      origXPercent: undefined,
      origYPercent: undefined,
      origWidthPercent: undefined,
      origHeightPercent: undefined,
      xPercent: Math.min(90, target.xPercent + 3),
      yPercent: Math.min(90, target.yPercent + 3),
    };
    pushEditState([...editEdits, copy]);
    setEditSelectedId(newId);
  };

  const deleteEditItem = (id: string) => {
    const target = editEdits.find((item) => item.id === id);
    if (!target) return;
    // If this element was lifted from an original PDF text/photo, keep the background erase patch so it stays removed from the PDF
    if (
      typeof target.origXPercent === "number" &&
      typeof target.origYPercent === "number"
    ) {
      pushEditState(
        editEdits.map((item) => (item.id === id ? { ...item, isDeleted: true } : item))
      );
    } else {
      pushEditState(editEdits.filter((item) => item.id !== id));
    }
    if (editSelectedId === id) setEditSelectedId(null);
  };

  const currentPageEdits = useMemo(() => {
    return editEdits.filter((e) => e.pageNumber === editCurrentPage);
  }, [editEdits, editCurrentPage]);

  const visiblePageEdits = useMemo(() => {
    return currentPageEdits.filter((e) => !e.isDeleted);
  }, [currentPageEdits]);

  const selectedEditItem = useMemo(() => {
    return editEdits.find((e) => e.id === editSelectedId && !e.isDeleted) || null;
  }, [editEdits, editSelectedId]);

  // Reusable interactive PDF page canvas with in-place text & photo detection
  const renderEditorCanvas = (isFs: boolean) => (
    <div
      ref={editCanvasContainerRef}
      style={{ width: `${Math.round(860 * (editZoom / 100))}px` }}
      className={`relative bg-white shadow-2xl rounded-xs ring-1 ring-black/15 select-none transition-all duration-150 origin-top ${isFs ? "my-auto" : ""
        }`}
    >
      {/* Base High-Resolution Rendered PDF Page */}
      <img
        src={editPageImageUrl!}
        alt={`Page ${editCurrentPage}`}
        className="w-full h-auto block pointer-events-none"
        draggable={false}
      />

      {/* Interactive Overlay Layer */}
      <div
        onClick={handlePageCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className={`absolute inset-0 ${editToolMode === "select" ? "cursor-default" : "cursor-crosshair"
          }`}
        title={
          editToolMode === "select"
            ? "Click any text or photo on the PDF to edit in-place with matching font & style"
            : editToolMode === "crop-photo"
              ? "Drag a box over any photo or graphic on the PDF to unlock, move, and shape it"
              : editToolMode === "whiteout"
                ? "Click anywhere to place a resizable Whiteout / Redact block"
                : editToolMode === "highlight"
                  ? "Click anywhere to place a resizable Highlight bar"
                  : editToolMode === "rect"
                    ? "Click anywhere to place a resizable Rectangle box"
                    : editToolMode === "circle"
                      ? "Click anywhere to place a resizable Circle / Oval"
                      : editToolMode === "line"
                        ? "Click anywhere to place a Line / Divider"
                        : "Click any existing PDF text to edit in-place, or click empty space to add new text"
        }
      >
        {/* 1. Background Erase Patches covering original PDF text/photos that have been edited, moved, shaped, or deleted */}
        {currentPageEdits.map((item) => {
          if (
            typeof item.origXPercent !== "number" ||
            typeof item.origYPercent !== "number" ||
            typeof item.origWidthPercent !== "number" ||
            typeof item.origHeightPercent !== "number"
          ) {
            return null;
          }
          const padX = item.kind === "text" ? 0.08 : 0.2;
          const padY = item.kind === "text" ? 0 : 0.2;
          return (
            <div
              key={`bg-cover-${item.id}`}
              style={{
                left: `${Math.max(0, item.origXPercent - padX)}%`,
                top: `${Math.max(0, item.origYPercent - padY)}%`,
                width: `${Math.min(100, item.origWidthPercent + padX * 2)}%`,
                height: `${Math.min(100, item.origHeightPercent + padY * 2)}%`,
                backgroundColor: item.kind === "text" ? "#ffffff" : (item.bgColor || "#ffffff"),
              }}
              className="absolute pointer-events-none z-[5]"
            />
          );
        })}

        {/* 2. Detected PDF Photos / Images (Click to unlock, move, replace, or shape into Circle/Rounded/Pill/Diamond/Hexagon) */}
        {editShowDetectedOverlays &&
          (editToolMode === "select" || editToolMode === "crop-photo" || editToolMode === "image") &&
          editExtractedImageItems.map((imgItem) => {
            const alreadyEdited = currentPageEdits.some((e) => e.sourceId === imgItem.id);
            if (alreadyEdited) return null;
            return (
              <div
                key={imgItem.id}
                onClick={(e) => {
                  e.stopPropagation();
                  activateExtractedImageItem(imgItem, "rect");
                }}
                style={{
                  left: `${imgItem.xPercent}%`,
                  top: `${imgItem.yPercent}%`,
                  width: `${imgItem.widthPercent}%`,
                  height: `${imgItem.heightPercent}%`,
                }}
                className="pdf-detected-item absolute z-[12] group cursor-pointer rounded-xs border border-transparent hover:border-2 hover:border-[#ff5500] hover:bg-[#ff5500]/5 transition-all"
                title="Click to unlock this PDF photo: shape it (Circle, Rounded, Pill, Hexagon), resize, move, or replace"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1.5 right-1.5 bg-[#0a0a0a] text-white border border-[#ff5500] rounded-lg px-2 py-1 text-[10px] font-extrabold shadow-lg flex items-center gap-1 pointer-events-none">
                  <Shapes className="h-3 w-3 text-[#ff5500]" />
                  <span>Click to Shape / Edit Photo</span>
                </div>
              </div>
            );
          })}

        {/* 3. Detected PDF Text Lines (Click any text to edit in-place with the exact same font, size, style & color) */}
        {editShowDetectedOverlays &&
          (editToolMode === "select" || editToolMode === "text") &&
          editExtractedTextItems.map((txtItem) => {
            const alreadyEdited = currentPageEdits.some((e) => e.sourceId === txtItem.id);
            if (alreadyEdited) return null;
            return (
              <div
                key={txtItem.id}
                onClick={(e) => {
                  e.stopPropagation();
                  activateExtractedTextItem(txtItem);
                }}
                style={{
                  left: `${txtItem.xPercent}%`,
                  top: `${txtItem.yPercent}%`,
                  width: `${Math.max(2, txtItem.widthPercent)}%`,
                  height: `${Math.max(1.4, txtItem.heightPercent)}%`,
                }}
                className="pdf-detected-item absolute z-[15] group cursor-text rounded-2xs border border-dashed border-transparent hover:border-[#ff5500]/80 hover:bg-[#ff5500]/5 transition-all"
                title={`Click to edit "${txtItem.text}" (${txtItem.fontFamily}, ${txtItem.fontSize}pt)`}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-0 bg-[#0a0a0a] text-white border border-[#ff5500]/60 rounded px-1.5 py-0.5 text-[9px] font-mono whitespace-nowrap pointer-events-none shadow">
                  {txtItem.fontFamily} · {txtItem.fontSize}pt
                </span>
              </div>
            );
          })}

        {/* 4. Drag-to-Crop Selection Marquee for "crop-photo" mode */}
        {editCropDragRect && (
          <div
            style={{
              left: `${Math.min(editCropDragRect.startX, editCropDragRect.curX)}%`,
              top: `${Math.min(editCropDragRect.startY, editCropDragRect.curY)}%`,
              width: `${Math.abs(editCropDragRect.curX - editCropDragRect.startX)}%`,
              height: `${Math.abs(editCropDragRect.curY - editCropDragRect.startY)}%`,
            }}
            className="absolute z-40 border-2 border-dashed border-[#ff5500] bg-[#ff5500]/15 pointer-events-none"
          />
        )}

        {/* 5. Render all active edits for this page */}
        {visiblePageEdits.map((item) => {
          const isSelected = editSelectedId === item.id;
          const kind = item.kind || "text";
          const fontObj = STANDARD_FONTS.find((f) => f.id === item.fontFamily) || STANDARD_FONTS[0]!;
          const isBoxKind =
            kind === "whiteout" ||
            kind === "highlight" ||
            kind === "rect" ||
            kind === "circle" ||
            kind === "line" ||
            kind === "image";
          const activeShape: PdfImageShape =
            item.imageShape || (kind === "circle" ? "circle" : "rect");
          const pxPerPt = (860 * (editZoom / 100)) / (editPageWidthPts || 595.28);
          const exactFontSizePx = Math.max(8, item.fontSize * pxPerPt);

          const renderSvgGeometry = (props: React.SVGProps<SVGElement>) => {
            if (activeShape === "circle") {
              return <ellipse cx="50" cy="50" rx="48.5" ry="48.5" {...(props as any)} />;
            }
            if (activeShape === "pill") {
              return <rect x="1.5" y="1.5" width="97" height="97" rx="48.5" ry="48.5" {...(props as any)} />;
            }
            if (activeShape === "rounded") {
              return <rect x="1.5" y="1.5" width="97" height="97" rx="16" ry="16" {...(props as any)} />;
            }
            if (activeShape === "diamond") {
              return <polygon points="50,1.5 98.5,50 50,98.5 1.5,50" {...(props as any)} />;
            }
            if (activeShape === "hexagon") {
              return <polygon points="25,1.5 75,1.5 98.5,50 75,98.5 25,98.5 1.5,50" {...(props as any)} />;
            }
            return <rect x="1" y="1" width="98" height="98" {...(props as any)} />;
          };

          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setEditSelectedId(item.id);
              }}
              style={{
                left: `${item.xPercent}%`,
                top: `${item.yPercent}%`,
                width: isBoxKind ? `${item.widthPercent ?? 22}%` : undefined,
                height: isBoxKind ? `${item.heightPercent ?? 6}%` : undefined,
              }}
              className={`pdf-edit-box absolute group ${isBoxKind
                ? isSelected
                  ? activeShape !== "rect"
                    ? "z-30 outline-1 outline-dashed outline-[#ff5500]/75"
                    : "z-30 ring-2 ring-[#ff5500]"
                  : "z-20 hover:outline-1 hover:outline-dashed hover:outline-[#ff5500]/60"
                : isSelected
                  ? "z-30 border-b border-dashed border-[#ff5500]"
                  : "z-20"
                }`}
            >
              {/* Floating Action Bar above selected box (Carbon Black, White & Brand Orange) */}
              {isSelected && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute -top-11 left-0 flex items-center gap-1 bg-[#0a0a0a] text-white rounded-xl p-1 shadow-2xl border border-white/15 z-50 animate-in fade-in zoom-in-95 text-[11px] whitespace-nowrap"
                >
                  {/* Drag Handle */}
                  <button
                    type="button"
                    onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                    className="p-1 hover:bg-white/15 rounded cursor-grab active:cursor-grabbing text-neutral-300 hover:text-white"
                    title="Drag to move"
                  >
                    <Move className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-white/15" />

                  {kind === "text" && (
                    <>
                      {/* Font Switcher (All 12 Standard Fonts including Bold & Italic) */}
                      <select
                        value={item.fontFamily}
                        onChange={(e) => updateEditItem(item.id, { fontFamily: e.target.value as PdfStandardFontName })}
                        className="bg-[#171717] text-white text-[11px] rounded px-1.5 py-0.5 border border-white/20 focus:outline-none focus:border-[#ff5500] cursor-pointer"
                      >
                        {STANDARD_FONTS.map((f) => (
                          <option key={f.id} value={f.id} className="bg-[#0a0a0a] text-white">
                            {f.name}
                          </option>
                        ))}
                      </select>

                      {/* Font Size Stepper */}
                      <div className="flex items-center gap-0.5 bg-[#171717] rounded px-1 border border-white/10">
                        <button
                          type="button"
                          onClick={() => updateEditItem(item.id, { fontSize: Math.max(6, item.fontSize - 1) })}
                          className="px-1 hover:text-white text-neutral-300 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-[10px] text-white">{item.fontSize}pt</span>
                        <button
                          type="button"
                          onClick={() => updateEditItem(item.id, { fontSize: Math.min(96, item.fontSize + 1) })}
                          className="px-1 hover:text-white text-neutral-300 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Whiteout toggle */}
                      <button
                        type="button"
                        onClick={() => updateEditItem(item.id, { hasWhiteout: !item.hasWhiteout })}
                        className={`p-1 rounded cursor-pointer ${item.hasWhiteout ? "bg-[#ff5500] text-white" : "hover:bg-white/15 text-neutral-300"
                          }`}
                        title="Toggle background patch under text"
                      >
                        <Eraser className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {(kind === "image" || kind === "rect" || kind === "circle") && (
                    <>
                      {/* Shape Picker for Photos & Geometric Shapes */}
                      <select
                        value={activeShape}
                        onChange={(e) => {
                          const nextShape = e.target.value as PdfImageShape;
                          const nextBorder =
                            kind === "image" && nextShape !== "rect"
                              ? Math.max(2, item.borderWidth ?? 2)
                              : item.borderWidth ?? (kind === "image" ? 0 : 2);
                          updateEditItem(item.id, {
                            imageShape: nextShape,
                            borderWidth: nextBorder,
                          });
                        }}
                        className="bg-[#171717] text-white font-bold text-[11px] rounded px-2 py-0.5 border border-[#ff5500]/60 focus:outline-none cursor-pointer"
                        title="Select Shape"
                      >
                        {IMAGE_SHAPE_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-white">
                            Shape: {s.label}
                          </option>
                        ))}
                      </select>

                      {/* Border Width Stepper */}
                      <div className="flex items-center gap-0.5 bg-[#171717] rounded px-1 border border-white/10" title="Border Thickness">
                        <button
                          type="button"
                          onClick={() => updateEditItem(item.id, { borderWidth: Math.max(0, (item.borderWidth ?? 2) - 1) })}
                          className="px-1 hover:text-white text-neutral-300 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-[10px] text-white">{item.borderWidth ?? (kind === "image" ? 0 : 2)}px</span>
                        <button
                          type="button"
                          onClick={() => updateEditItem(item.id, { borderWidth: Math.min(20, (item.borderWidth ?? 2) + 1) })}
                          className="px-1 hover:text-white text-neutral-300 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Border Color */}
                      {kind === "image" && (
                        <input
                          type="color"
                          value={item.borderColor || "#0a0a0a"}
                          onChange={(e) => updateEditItem(item.id, { borderColor: e.target.value, borderWidth: Math.max(2, item.borderWidth ?? 2) })}
                          className="h-4 w-4 rounded-full border border-white/30 cursor-pointer bg-transparent p-0"
                          title="Shape Border Color"
                        />
                      )}

                      {/* Replace Photo Button */}
                      {kind === "image" && (
                        <button
                          type="button"
                          onClick={() => editReplaceImageInputRef.current?.click()}
                          className="px-2 py-0.5 bg-[#ff5500] hover:bg-[#e04800] text-white rounded text-[10px] font-bold cursor-pointer"
                          title="Replace with another uploaded photo"
                        >
                          Replace
                        </button>
                      )}
                    </>
                  )}

                  {kind !== "image" && (
                    <input
                      type="color"
                      value={item.color}
                      onChange={(e) => updateEditItem(item.id, { color: e.target.value })}
                      className="h-4 w-4 rounded-full border border-white/30 cursor-pointer bg-transparent p-0"
                      title="Color"
                    />
                  )}

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateEditItem(item.id)}
                    className="p-1 hover:bg-white/15 rounded text-neutral-300 hover:text-white cursor-pointer"
                    title="Duplicate element"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => deleteEditItem(item.id)}
                    className="p-1 hover:bg-red-600 rounded text-neutral-300 hover:text-white cursor-pointer"
                    title="Delete element (Del)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Render body by kind */}
              {kind === "whiteout" ? (
                <div
                  onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                  style={{ backgroundColor: item.color || "#ffffff" }}
                  className="w-full h-full cursor-move border border-dashed border-neutral-400/50 flex items-center justify-center"
                  title="Drag to move Whiteout block · Drag corner to resize"
                />
              ) : kind === "highlight" ? (
                <div
                  onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                  style={{
                    backgroundColor: item.color || "#facc15",
                    opacity: item.opacity ?? 0.38,
                  }}
                  className="w-full h-full cursor-move rounded-2xs"
                  title="Drag to move Highlight · Drag corner to resize"
                />
              ) : kind === "rect" || kind === "circle" ? (
                <div
                  onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                  className="w-full h-full cursor-move relative"
                  title="Drag to move Shape · Drag corner to resize"
                >
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full block overflow-visible pointer-events-none"
                  >
                    {renderSvgGeometry({
                      fill: item.fillColor && item.fillColor !== "transparent" ? item.fillColor : "none",
                      fillOpacity: item.opacity ?? 0.2,
                      stroke: item.color || "#0a0a0a",
                      strokeWidth: Math.max(1, item.borderWidth ?? 2),
                      vectorEffect: "non-scaling-stroke",
                      strokeLinejoin: "round",
                    })}
                  </svg>
                </div>
              ) : kind === "line" ? (
                <div
                  onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                  className="w-full h-full cursor-move flex items-center"
                  title="Drag to move Line · Drag corner to resize length"
                >
                  <div
                    style={{
                      backgroundColor: item.color || "#0a0a0a",
                      height: `${Math.max(2, item.borderWidth ?? 2)}px`,
                    }}
                    className="w-full"
                  />
                </div>
              ) : kind === "image" ? (
                <div
                  onMouseDown={(e) => handleDragStart(e, item.id, item.xPercent, item.yPercent)}
                  className="w-full h-full cursor-move relative"
                  title="Drag to move Photo · Drag corner to resize"
                >
                  {item.imageDataUrl && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="w-full h-full block overflow-visible pointer-events-none"
                    >
                      <defs>
                        <clipPath id={`pdf-img-clip-${item.id}`}>
                          {renderSvgGeometry({})}
                        </clipPath>
                      </defs>
                      <image
                        href={item.imageDataUrl}
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        preserveAspectRatio="none"
                        clipPath={`url(#pdf-img-clip-${item.id})`}
                      />
                      {((item.borderWidth ?? 0) > 0 || activeShape !== "rect") &&
                        renderSvgGeometry({
                          fill: "none",
                          stroke: item.borderColor || "#0a0a0a",
                          strokeWidth: Math.max(activeShape !== "rect" ? 2 : 0, item.borderWidth ?? 0),
                          vectorEffect: "non-scaling-stroke",
                          strokeLinejoin: "round",
                        })}
                    </svg>
                  )}
                </div>
              ) : item.text.includes("\n") ? (
                <textarea
                  value={item.text}
                  onChange={(e) => updateEditItem(item.id, { text: e.target.value })}
                  rows={Math.max(1, item.text.split("\n").length)}
                  style={{
                    fontFamily: fontObj.cssFamily,
                    fontWeight: fontObj.isBold ? "bold" : "normal",
                    fontStyle: fontObj.isItalic ? "italic" : "normal",
                    fontSize: `${exactFontSizePx.toFixed(2)}px`,
                    lineHeight: "1.12",
                    color: item.color,
                    backgroundColor: item.hasWhiteout && !item.sourceId ? "#ffffff" : "transparent",
                    padding: 0,
                    margin: 0,
                    minWidth: `${Math.max(40, Math.ceil((item.text.length + 1) * exactFontSizePx * 0.56))}px`,
                  }}
                  className="resize-none border-0 focus:outline-none p-0 m-0 block bg-transparent"
                  placeholder="Type text..."
                  autoFocus={isSelected}
                />
              ) : (
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateEditItem(item.id, { text: e.target.value })}
                  style={{
                    fontFamily: fontObj.cssFamily,
                    fontWeight: fontObj.isBold ? "bold" : "normal",
                    fontStyle: fontObj.isItalic ? "italic" : "normal",
                    fontSize: `${exactFontSizePx.toFixed(2)}px`,
                    height: `${Math.ceil(exactFontSizePx * 1.05)}px`,
                    lineHeight: "1",
                    color: item.color,
                    backgroundColor: item.hasWhiteout && !item.sourceId ? "#ffffff" : "transparent",
                    padding: 0,
                    margin: 0,
                    width: `${Math.max(
                      Math.round(((item.widthPercent ?? 6) / 100) * 860 * (editZoom / 100)),
                      Math.ceil(Math.max(1, item.text.length) * exactFontSizePx * (fontObj.isBold ? 0.62 : 0.56)) + 8
                    )}px`,
                  }}
                  className="border-0 focus:outline-none p-0 m-0 block bg-transparent"
                  placeholder="Type text..."
                  autoFocus={isSelected}
                />
              )}

              {/* Bottom-Right Resize Handle for area elements */}
              {isBoxKind && isSelected && (
                <div
                  onMouseDown={(e) =>
                    handleResizeStart(
                      e,
                      item.id,
                      item.widthPercent ?? 22,
                      item.heightPercent ?? 6
                    )
                  }
                  className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[#ff5500] border-2 border-white shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                  title="Drag to resize"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Protect / Unlock state
  const [pdfPassword, setPdfPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(true);

  // Sign tool state
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [sigTypedName, setSigTypedName] = useState<string>("");
  const [sigColor, setSigColor] = useState<string>("#0f172a");

  // Watermark tool state
  const [wmText, setWmText] = useState<string>("CONFIDENTIAL");
  const [wmAngle, setWmAngle] = useState<number>(45);
  const [wmOpacity, setWmOpacity] = useState<number>(35);
  const [wmSize, setWmSize] = useState<number>(50);
  const [wmColor, setWmColor] = useState<string>("#ef4444");

  // Page numbers tool state
  const [pageNumberPos, setPageNumberPos] = useState<"bottom_center" | "bottom_right" | "bottom_left" | "top_center" | "top_right">("bottom_center");
  const [pageNumberFormat, setPageNumberFormat] = useState<string>("Page {n} of {total}");
  const [pageNumberStart, setPageNumberStart] = useState<number>(1);

  // Rotate tool state
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [rotationScope, setRotationScope] = useState<"all" | "odd" | "even">("all");

  // Page size & N-up state
  const [targetPageSize, setTargetPageSize] = useState<"a4" | "letter" | "a3" | "legal">("a4");
  const [pagesPerSheetCount, setPagesPerSheetCount] = useState<number>(2);

  // Metadata state
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaAuthor, setMetaAuthor] = useState<string>("");
  const [metaSubject, setMetaSubject] = useState<string>("");

  // Invoice state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "INV-" + Math.floor(1000 + Math.random() * 9000),
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    currency: "$",
    companyName: "Acme Creative Studio",
    companyAddress: "100 Innovation Way, Suite 400",
    companyEmail: "billing@acmecreative.com",
    clientName: "Enterprise Client Corp",
    clientAddress: "500 Market Boulevard",
    clientEmail: "accounts@clientcorp.com",
    items: [
      { id: "1", description: "UI/UX System Design & Prototyping", quantity: 1, rate: 1200, taxPercent: 10 },
      { id: "2", description: "Technical Documentation & Export Suite", quantity: 2, rate: 450, taxPercent: 10 },
    ],
    notes: "Payment due within 14 days of issue date. Wire transfer or online card accepted.",
    terms: "Late payments are subject to a 1.5% fee per month.",
  });

  const isInvoiceTool =
    tool.slug === "create-invoice" ||
    tool.slug === "create-invoice-visually" ||
    tool.slug === "create-electronic-invoice" ||
    tool.slug === "pdf-invoice-to-einvoice" ||
    tool.slug === "xml-einvoice-to-pdf";

  // Calculate accepted MIME types dynamically based on tool
  const acceptedFileExtensions = useMemo(() => {
    if (isInvoiceTool) return ".pdf,.xml,.json";
    if (
      tool.slug === "image-to-pdf" ||
      tool.slug === "images-to-pdf" ||
      tool.slug === "jpg-to-pdf" ||
      tool.slug === "png-to-pdf" ||
      tool.slug === "webp-to-pdf" ||
      tool.slug === "heic-to-pdf"
    ) {
      return ".jpg,.jpeg,.png,.webp,.heic,.bmp,.tiff,image/*";
    }
    if (tool.slug === "word-to-pdf" || tool.slug === "docx-to-pdf" || tool.slug === "doc-to-pdf") {
      return ".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (tool.slug === "excel-to-pdf" || tool.slug === "xlsx-to-pdf" || tool.slug === "xls-to-pdf") {
      return ".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    if (tool.slug === "powerpoint-to-pdf" || tool.slug === "pptx-to-pdf" || tool.slug === "ppt-to-pdf") {
      return ".pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }
    if (tool.slug === "text-to-pdf") return ".txt,text/plain";
    if (tool.slug === "epub-to-pdf") return ".epub";
    if (tool.slug === "markdown-to-pdf") return ".md,.markdown,text/markdown";
    if (tool.slug === "publisher-to-pdf" || tool.slug === "pub-to-pdf") return ".pub";
    return ".pdf,application/pdf";
  }, [tool.slug, isInvoiceTool]);

  // Target file size calculation and boundary validation for Compress PDF
  const parsedTargetSize = parseFloat(targetSizeInput);
  const currentTargetBytes =
    !isNaN(parsedTargetSize) && parsedTargetSize > 0
      ? targetSizeUnit === "MB"
        ? parsedTargetSize * 1024 * 1024
        : parsedTargetSize * 1024
      : 0;

  const isTargetAlreadyUnder =
    Boolean(activeFile && activeFile.size > 0 && currentTargetBytes >= activeFile.size);

  // Auto-initialize default target size ONCE when a new file is loaded (do not overwrite user's custom setting)
  useEffect(() => {
    if (activeFile && isCompressTool && activeFile.size > 0) {
      if (lastInitCompressFileId.current !== activeFile.id) {
        lastInitCompressFileId.current = activeFile.id;
        // If current target size is empty or not set, provide a sensible default
        if (!targetSizeInput || parseFloat(targetSizeInput) <= 0) {
          const origKB = Math.round(activeFile.size / 1024);
          const defaultKB = origKB > 100 ? 100 : Math.max(5, Math.round(origKB * 0.5));
          if (defaultKB >= 1024) {
            setTargetSizeInput(String(Number((defaultKB / 1024).toFixed(1))));
            setTargetSizeUnit("MB");
          } else {
            setTargetSizeInput(String(defaultKB));
            setTargetSizeUnit("KB");
          }
        }
      }
    }
  }, [activeFile?.id, activeFile?.size, isCompressTool, targetSizeInput]);

  // Dynamic suggestions including percentage reductions and common upload ceilings
  const smartTargetPresets = useMemo(() => {
    const origBytes = activeFile?.size || 0;
    const origKB = Math.round(origBytes / 1024);
    const presets: Array<{ label: string; val: string; unit: "KB" | "MB" }> = [];

    if (origKB > 0) {
      const p75 = Math.round(origKB * 0.75);
      const p50 = Math.round(origKB * 0.5);
      const p25 = Math.round(origKB * 0.25);

      if (p75 >= 10 && p75 < origKB) {
        presets.push({
          label: `75% (${p75 >= 1024 ? (p75 / 1024).toFixed(1) + " MB" : p75 + " KB"})`,
          val: p75 >= 1024 ? String(Number((p75 / 1024).toFixed(1))) : String(p75),
          unit: p75 >= 1024 ? "MB" : "KB",
        });
      }
      if (p50 >= 5 && p50 < p75) {
        presets.push({
          label: `50% (${p50 >= 1024 ? (p50 / 1024).toFixed(1) + " MB" : p50 + " KB"})`,
          val: p50 >= 1024 ? String(Number((p50 / 1024).toFixed(1))) : String(p50),
          unit: p50 >= 1024 ? "MB" : "KB",
        });
      }
      if (p25 >= 3 && p25 < p50) {
        presets.push({
          label: `25% (${p25 >= 1024 ? (p25 / 1024).toFixed(1) + " MB" : p25 + " KB"})`,
          val: p25 >= 1024 ? String(Number((p25 / 1024).toFixed(1))) : String(p25),
          unit: p25 >= 1024 ? "MB" : "KB",
        });
      }
    }

    // Standard round numbers popular for document submissions
    const standards: Array<{ label: string; val: string; unit: "KB" | "MB" }> = [
      { label: "50 KB", val: "50", unit: "KB" },
      { label: "100 KB", val: "100", unit: "KB" },
      { label: "200 KB", val: "200", unit: "KB" },
      { label: "500 KB", val: "500", unit: "KB" },
      { label: "1 MB", val: "1", unit: "MB" },
    ];

    for (const std of standards) {
      if (!presets.some((p) => p.val === std.val && p.unit === std.unit)) {
        presets.push(std);
      }
      if (presets.length >= 5) break;
    }

    return presets.slice(0, 5);
  }, [activeFile?.size]);

  // Handle uploaded files
  const handleFilesChosen = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (fileList.length > 10) {
      toast.error("Maximum 10 files allowed per request. Please select up to 10 files.");
      return;
    }

    setProcessing(true);
    const newItems: UploadedPdfItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]!;

      if (file.size === 0) {
        toast.error(`"${file.name}" is empty (0 bytes).`);
        continue;
      }

      if (file.size > 30 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 30 MB limit. Please upload a smaller file.`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const header = new Uint8Array(buffer.slice(0, 5));
        // Check %PDF magic bytes (0x25, 0x50, 0x44, 0x46)
        if (
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
        ) {
          if (
            header.length >= 4 &&
            !(header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46)
          ) {
            toast.error(`"${file.name}" has invalid PDF file signature.`);
            continue;
          }
        }

        newItems.push({
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          name: file.name,
          size: file.size,
          buffer,
        });
      } catch (err) {
        console.error("Error reading file:", err);
        toast.error(`Could not read file: ${file.name}`);
      }
    }

    if (newItems.length > 0) {
      if (isMultiFileTool) {
        setFiles((prev) => [...prev, ...newItems]);
      } else {
        setFiles(newItems.slice(0, 1));
        setActiveFileIndex(0);
      }
      setHasProcessed(false);
      setResultBlob(null);
      setResultBuffer(null);
      toast.success(`Loaded ${newItems.length} file${newItems.length > 1 ? "s" : ""}!`);

      // Asynchronously generate high-fidelity thumbnails & page counts
      for (const item of newItems) {
        generateFileThumbnail(item.file, item.buffer, `${item.name}-${item.size}`)
          .then(({ thumbnailUrl, totalPages }) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { ...f, thumbnailUrl, pageCount: totalPages, isLoadingThumb: false }
                  : f
              )
            );
          })
          .catch((err) => {
            console.warn("Could not generate thumbnail:", err);
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, isLoadingThumb: false } : f))
            );
          });
      }
    }
    setProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  // Drag and drop page reordering state
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop reorder files
  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= files.length ||
      toIndex >= files.length
    ) {
      return;
    }
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      if (!moved) return prev;
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setActiveFileIndex(toIndex);
  };

  // Reorder files for Merge PDF
  const moveFile = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index]!;
    updated[index] = updated[targetIndex]!;
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= files.length - 1) {
      setActiveFileIndex(Math.max(0, files.length - 2));
    }
  };

  // Split tool: Asynchronously load all page thumbnails and sync page selection
  useEffect(() => {
    if (!isSplitTool || !activeFile) {
      setSplitPageThumbs({});
      setSplitSelectedPages([]);
      return;
    }

    let isCancelled = false;
    setSplitLoadingThumbs(true);

    const initSplitPreviews = async () => {
      let totalPages = activeFile.pageCount;
      if (!totalPages) {
        try {
          const doc = await PDFDocument.load(activeFile.buffer, { ignoreEncryption: true });
          totalPages = doc.getPageCount();
          const detectedCount: number = totalPages;
          setFiles((prev) =>
            prev.map((f) => (f.id === activeFile.id ? { ...f, pageCount: detectedCount } : f))
          );
        } catch {
          totalPages = 1;
        }
      }

      if (isCancelled) return;

      const safeTotal = Math.max(1, totalPages || 1);
      const parsed = rangeStringToPages(splitRanges, safeTotal);
      const initial = parsed.length > 0 ? parsed : (safeTotal > 1 ? [1, 2] : [1]);
      setSplitSelectedPages(initial);
      setSplitRanges(pagesToRangeString(initial));

      for (let p = 1; p <= safeTotal; p++) {
        if (isCancelled) break;
        try {
          const res = await renderPdfPage(activeFile.buffer, p, 0.4);
          if (isCancelled) break;
          setSplitPageThumbs((prev) => ({ ...prev, [p]: res.dataUrl }));
        } catch (err) {
          console.warn(`Could not render preview for page ${p}:`, err);
        }
      }

      if (!isCancelled) {
        setSplitLoadingThumbs(false);
      }
    };

    initSplitPreviews();

    return () => {
      isCancelled = true;
    };
  }, [isSplitTool, activeFile?.id]);

  const handleToggleSplitPage = (pageNum: number) => {
    setSplitSelectedPages((prev) => {
      const next = prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b);
      setSplitRanges(pagesToRangeString(next));
      return next;
    });
  };

  const handleSelectAllSplitPages = () => {
    const total = activeFile?.pageCount || 1;
    const all = Array.from({ length: total }, (_, i) => i + 1);
    setSplitSelectedPages(all);
    setSplitRanges(pagesToRangeString(all));
  };

  const handleDeselectAllSplitPages = () => {
    setSplitSelectedPages([]);
    setSplitRanges("");
  };

  const handleSelectOddSplitPages = () => {
    const total = activeFile?.pageCount || 1;
    const odds = Array.from({ length: total }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    setSplitSelectedPages(odds);
    setSplitRanges(pagesToRangeString(odds));
  };

  const handleSelectEvenSplitPages = () => {
    const total = activeFile?.pageCount || 1;
    const evens = Array.from({ length: total }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    setSplitSelectedPages(evens);
    setSplitRanges(pagesToRangeString(evens));
  };

  const handleSplitAllPages = () => {
    const total = activeFile?.pageCount || 1;
    const all = Array.from({ length: total }, (_, i) => i + 1);
    setSplitSelectedPages(all);
    setSplitRanges(pagesToRangeString(all));
    setSplitMode("all");
    toast.success(`Selected all ${total} pages for splitting`);
  };

  const handleSplitRangesInputChange = (newVal: string) => {
    setSplitRanges(newVal);
    const total = activeFile?.pageCount || 1;
    const parsed = rangeStringToPages(newVal, total);
    setSplitSelectedPages(parsed);
  };

  // Generate random secure password
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    const randVals = new Uint32Array(16);
    crypto.getRandomValues(randVals);
    for (let i = 0; i < 16; i++) {
      pwd += chars[randVals[i]! % chars.length];
    }
    setPdfPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
    navigator.clipboard.writeText(pwd);
    toast.success("Generated & copied strong 16-character password!");
  };

  // Canvas signature handling
  useEffect(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = sigColor;
  }, [sigColor, sigMode]);

  const startDrawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSig(true);
    setHasSignatureDrawn(true);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawSig = () => {
    setIsDrawingSig(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureDrawn(false);
  };

  // Execute processing according to current tool
  const handleProcess = async () => {
    // Invoice tools don't require an uploaded file
    if (!isInvoiceTool && files.length === 0) {
      toast.error("Please upload at least one file to process.");
      return;
    }

    const cost = AdminStore.getToolCreditCost(tool.slug);
    const isFree = cost === 0;

    if (!isFree) {
      if (!AuthUser.isLoggedIn()) {
        if (AuthUser.getGuestRemainingUses() <= 0) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("bg:show_guest_login_dialog", {
                detail: {
                  toolName: tool.name,
                  toolSlug: tool.slug,
                },
              })
            );
          }
          return;
        }
      } else if (!AuthUser.hasCredits(cost)) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("bg:show_add_credits_dialog", {
              detail: {
                toolName: tool.name,
                toolSlug: tool.slug,
                creditCost: cost,
                currentCredits: AuthUser.getCredits(),
              },
            })
          );
        }
        return;
      }
    }

    setProcessing(true);
    try {
      let outputPdfBytes: Uint8Array;
      let outName = "processed_document.pdf";
      let pageCount = 1;
      const baseName = activeFile ? activeFile.name.replace(/\.[^.]+$/, "") : "document";

      // 1. INVOICE TOOLS
      if (isInvoiceTool) {
        const invRes = await generateInvoicePdf(invoiceData);
        outputPdfBytes = invRes.pdfBytes;
        outName = `Invoice_${invoiceData.invoiceNumber || "INV-001"}.pdf`;
        pageCount = 1;
      }
      // EDIT PDF (In-place text additions, whiteouts, highlights, boxes, images, and font styling)
      else if (tool.slug === "edit-pdf") {
        if (!activeFile) throw new Error("No file selected.");
        const editRes = await applyEditsToPdf(activeFile.buffer, editEdits);
        outputPdfBytes = editRes.pdfBytes;
        outName = `${baseName}_edited.pdf`;
        pageCount = editRes.pageCount;
      }
      // 2. MERGE PDF
      else if (tool.slug === "merge-pdf") {
        if (files.length < 2) {
          toast.error("Please add at least 2 PDF files to merge.");
          setProcessing(false);
          return;
        }
        const mergeRes = await mergePdfDocuments(files.map((f) => ({ name: f.name, buffer: f.buffer })));
        outputPdfBytes = mergeRes.pdfBytes;
        outName = `${baseName}_merged.pdf`;
        pageCount = mergeRes.pageCount;
      }
      // 3. SPLIT PDF
      else if (tool.slug === "split-pdf" || tool.slug === "halve-pdf-pages") {
        if (!activeFile) throw new Error("No file selected.");
        if (!splitRanges.trim()) {
          toast.error("Please select at least one page to split.");
          setProcessing(false);
          return;
        }
        const splitRes = await splitPdfDocument(activeFile.buffer, splitRanges);
        outputPdfBytes = splitRes.pdfBytes;
        outName = `${baseName}_split.pdf`;
        pageCount = splitRes.pageCount;
      }
      // 4. COMPRESS PDF
      else if (tool.slug === "compress-pdf" || tool.slug === "web-optimize-pdf") {
        if (!activeFile) throw new Error("No file selected.");

        let targetSizeBytes: number | undefined = undefined;
        if (compressMode === "target") {
          const parsed = parseFloat(targetSizeInput);
          if (isNaN(parsed) || parsed <= 0) {
            toast.error("Please enter a valid target file size.");
            setProcessing(false);
            return;
          }
          targetSizeBytes = Math.round(parsed * (targetSizeUnit === "MB" ? 1024 * 1024 : 1024));
        }

        const compRes = await compressPdfDocument(activeFile.buffer, {
          qualityLevel: compressLevel,
          targetSizeBytes,
          convertToGrayscale,
        });
        outputPdfBytes = compRes.pdfBytes;
        outName = `${baseName}_compressed.pdf`;
        pageCount = compRes.pageCount;
      }
      // 5. PROTECT PDF
      else if (tool.slug === "protect-pdf" || tool.slug === "generate-password") {
        if (!activeFile) throw new Error("No file selected.");
        if (!pdfPassword) {
          toast.error("Please enter a password to protect the PDF.");
          setProcessing(false);
          return;
        }
        const protRes = await protectPdfDocument(activeFile.buffer, pdfPassword);
        outputPdfBytes = protRes.pdfBytes;
        outName = `${baseName}_protected.pdf`;
        pageCount = protRes.pageCount;
      }
      // 6. ROTATE PDF
      else if (tool.slug === "rotate-pdf-pages") {
        if (!activeFile) throw new Error("No file selected.");
        const rotRes = await rotatePdfPages(activeFile.buffer, rotationAngle, rotationScope);
        outputPdfBytes = rotRes.pdfBytes;
        outName = `${baseName}_rotated.pdf`;
        pageCount = rotRes.pageCount;
      }
      // 7. WATERMARK PDF
      else if (tool.slug === "add-watermark-pdf" || tool.slug === "add-watermark") {
        if (!activeFile) throw new Error("No file selected.");
        const wmRes = await addWatermarkToPdf(activeFile.buffer, wmText || "CONFIDENTIAL", {
          angle: wmAngle,
          opacity: wmOpacity / 100,
          size: wmSize,
          color: wmColor,
        });
        outputPdfBytes = wmRes.pdfBytes;
        outName = `${baseName}_watermarked.pdf`;
        pageCount = wmRes.pageCount;
      }
      // 8. ADD PAGE NUMBERS
      else if (tool.slug === "add-page-numbers-pdf" || tool.slug === "add-page-numbers") {
        if (!activeFile) throw new Error("No file selected.");
        const pnRes = await addPageNumbersToPdf(activeFile.buffer, {
          position: pageNumberPos,
          format: pageNumberFormat,
          startPage: pageNumberStart,
        });
        outputPdfBytes = pnRes.pdfBytes;
        outName = `${baseName}_numbered.pdf`;
        pageCount = pnRes.pageCount;
      }
      // 9. FLATTEN PDF
      else if (tool.slug === "flatten-pdf") {
        if (!activeFile) throw new Error("No file selected.");
        const flatRes = await flattenPdfDocument(activeFile.buffer);
        outputPdfBytes = flatRes.pdfBytes;
        outName = `${baseName}_flattened.pdf`;
        pageCount = flatRes.pageCount;
      }
      // 10. CHANGE PAGE SIZE / CROP
      else if (tool.slug === "change-pdf-page-size" || tool.slug === "crop-pdf" || tool.slug === "pages-per-sheet") {
        if (!activeFile) throw new Error("No file selected.");
        const sizeRes = await changePdfPageDimensions(activeFile.buffer, targetPageSize);
        outputPdfBytes = sizeRes.pdfBytes;
        outName = `${baseName}_${targetPageSize}.pdf`;
        pageCount = sizeRes.pageCount;
      }
      // 11. IMAGES TO PDF (or JPG/PNG/WEBP to PDF)
      else if (
        tool.slug === "image-to-pdf" ||
        tool.slug === "images-to-pdf" ||
        tool.slug === "jpg-to-pdf" ||
        tool.slug === "png-to-pdf" ||
        tool.slug === "webp-to-pdf"
      ) {
        const imgItems = files.map((f) => ({
          buffer: f.buffer,
          type: f.file.type,
          name: f.name,
        }));
        const imgPdfRes = await convertImagesToPdf(imgItems, targetPageSize === "letter" ? "letter" : "a4");
        outputPdfBytes = imgPdfRes.pdfBytes;
        outName = `${baseName}_compiled.pdf`;
        pageCount = imgPdfRes.pageCount;
      }
      // 12. GENERAL FALLBACK (Compress/Re-pack)
      else {
        if (!activeFile) throw new Error("No file selected.");
        const compRes = await compressPdfDocument(activeFile.buffer, "recommended");
        outputPdfBytes = compRes.pdfBytes;
        outName = `${baseName}_ready.pdf`;
        pageCount = compRes.pageCount;
      }

      // Convert to blob and buffer for preview
      const blob = new Blob([outputPdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const origSize = activeFile ? activeFile.size : (files.reduce((acc, f) => acc + f.size, 0) || 50000);
      const outBuffer = outputPdfBytes.buffer.slice(
        outputPdfBytes.byteOffset,
        outputPdfBytes.byteOffset + outputPdfBytes.byteLength
      ) as ArrayBuffer;

      setResultBlob(blob);
      setResultBuffer(outBuffer);
      setResultFileName(outName);
      setResultSize(blob.size);
      setOriginalTotalSize(origSize);
      setResultPageCount(pageCount);
      setHasProcessed(true);
      setEditIsFullscreen(false);
      setShowDynamicIsland(false);
      setHasScrolledOnce(false);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Trigger celebratory confetti burst once the completion screen settles
      setTimeout(() => {
        try {
          fireConfetti({ particleCount: 110 });
        } catch (confettiErr) {
          console.warn("Confetti error:", confettiErr);
        }
      }, 120);

      // Track usage and deduct credit
      try {
        Telemetry.trackToolUsage(tool.slug, tool.name);
        const cost = AdminStore.getToolCreditCost(tool.slug);
        if (cost > 0) {
          AuthUser.deductCredit(cost, tool.slug);
        }
        AdminStore.recordToolDailyUsage(tool.slug);
      } catch (trackErr) {
        console.warn("PDF tool tracking error:", trackErr);
      }

      toast.success(`${tool.name} completed successfully!`);
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error(err.message || "Failed to process PDF. Please check file format.");
    } finally {
      setProcessing(false);
    }
  };

  // Download resulting PDF
  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultFileName || "document.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success(`Downloaded ${resultFileName}!`);
  };

  // Direct instant download from inside the Full-Screen PDF Editor Studio
  const handleQuickDownloadEditedPdf = async () => {
    if (!activeFile) return;
    setProcessing(true);
    try {
      const baseName = activeFile.name.replace(/\.[^.]+$/, "") || "document";
      const outName = `${baseName}_edited.pdf`;
      const editRes = await applyEditsToPdf(activeFile.buffer, editEdits);
      const blob = new Blob([editRes.pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(`Downloaded ${outName}!`);
    } catch (err: any) {
      console.error("Quick download error:", err);
      toast.error(err.message || "Failed to export edited PDF.");
    } finally {
      setProcessing(false);
    }
  };

  // One-click print PDF
  const handlePrint = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
      setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(url);
      }, 60000);
    };
  };

  // Open PDF in new browser tab
  const handleOpenInNewTab = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    window.open(url, "_blank");
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Tool link copied to clipboard!");
  };

  // Dynamic Island scroll & header-offset listener when output is rendered
  useEffect(() => {
    if (!hasProcessed) {
      setShowDynamicIsland(false);
      setHasScrolledOnce(false);
      return;
    }

    const updatePositionAndVisibility = () => {
      const headerEl = document.querySelector("header");
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
      const nextTop = headerBottom > 0 ? Math.max(14, Math.round(headerBottom + 14)) : 16;
      setIslandTopPx(nextTop);

      let isPastWorkspace = false;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Show only after user scrolls past the main workspace / primary Download button
        isPastWorkspace = rect.bottom < 160 || window.scrollY > 560;
      } else {
        isPastWorkspace = window.scrollY > 560;
      }

      setShowDynamicIsland(isPastWorkspace);
      if (isPastWorkspace) {
        setHasScrolledOnce(true);
      }
    };

    window.addEventListener("scroll", updatePositionAndVisibility, { passive: true });
    window.addEventListener("resize", updatePositionAndVisibility, { passive: true });
    updatePositionAndVisibility();

    return () => {
      window.removeEventListener("scroll", updatePositionAndVisibility);
      window.removeEventListener("resize", updatePositionAndVisibility);
    };
  }, [hasProcessed]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-6 py-2">
      {/* ── TOP DYNAMIC ISLAND FLOATING BAR (Animated on Scroll, Header-Aware) ─────── */}
      {typeof document !== "undefined" && hasProcessed && createPortal(
        <div
          style={{ top: `${islandTopPx}px` }}
          className="dynamic-island-wrapper fixed inset-x-0 flex justify-center items-center z-[90] pointer-events-none px-3 sm:px-4"
        >
          <aside
            aria-label="Quick download dynamic island"
            className={`pointer-events-auto dynamic-island-box flex items-center gap-2 sm:gap-3.5 rounded-full border border-white/15 bg-black text-white p-1.5 sm:p-2 mx-auto ${showDynamicIsland
              ? "island-enter"
              : hasScrolledOnce
                ? "island-exit"
                : "opacity-0 -translate-y-12 scale-90 pointer-events-none"
              }`}
          >
            {/* 1. PDF Thumbnail & Details */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="relative h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border border-white/25 bg-neutral-900 shadow-inner flex items-center justify-center">
                {files[0]?.thumbnailUrl ? (
                  <img
                    src={files[0].thumbnailUrl}
                    alt="Processed PDF thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#ff5500]/20 text-[#ff5500]">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col justify-center text-left pr-1">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[140px] lg:max-w-[210px] leading-tight">
                  {resultFileName || files[0]?.name || `${tool.name} Result`}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 leading-tight flex items-center gap-1.5 flex-wrap mt-0.5">
                  {isCompressTool && originalTotalSize > 0 ? (
                    <>
                      <span className="text-neutral-400 line-through">
                        {formatBytes(originalTotalSize)}
                      </span>
                      <span className="text-white/40">→</span>
                      <span className="text-emerald-400 font-extrabold">{formatBytes(resultSize)}</span>
                      {originalTotalSize > resultSize && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[10px] font-black">
                          -{Math.max(0, Math.round(((originalTotalSize - resultSize) / originalTotalSize) * 100))}%
                        </span>
                      )}
                      <span className="text-white/40">•</span>
                      <span className="text-neutral-300">
                        {resultPageCount} {resultPageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{formatBytes(resultSize)}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-neutral-300">
                        {resultPageCount} {resultPageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 2. Primary Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="wobbly-btn h-9 sm:h-11 flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] hover:bg-neutral-100 px-4 sm:px-5 text-xs sm:text-sm font-black shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-[#ff5500] shrink-0" />
              <span>Download PDF</span>
            </button>

            {/* 3. Reset / Process Another (Concentric Circular Button) */}
            <button
              type="button"
              onClick={() => {
                setHasProcessed(false);
                setResultBlob(null);
                setResultBuffer(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="wobbly-btn flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white hover:text-[#0a0a0a] hover:scale-105 active:scale-90 transition-all shadow-sm cursor-pointer"
              title="Process another PDF"
              aria-label="Process another PDF"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </aside>
        </div>,
        document.body
      )}
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={isMultiFileTool}
        accept={acceptedFileExtensions}
        onChange={(e) => handleFilesChosen(e.target.files)}
        className="hidden"
      />

      {/* ─── 1. UPLOAD VIEW (When no file uploaded or editing) ─────────────────── */}
      {!hasProcessed && files.length === 0 && !isInvoiceTool && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group cursor-pointer flex flex-col items-center justify-center text-center rounded-3xl border-3 border-dashed px-8 py-24 sm:py-32 w-full transition-all duration-300 ${isDragging
            ? "border-accent bg-accent/10 scale-[1.01] shadow-2xl"
            : "border-border bg-card/60 hover:border-foreground hover:bg-card shadow-lg"
            }`}
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl transition-all group-hover:scale-110">
            <Upload className="h-10 w-10 text-background" />
            <span className="absolute -inset-1 rounded-3xl bg-foreground/20 blur-lg animate-pulse" />
          </div>

          <h2 className="mt-8 font-display text-3xl font-extrabold md:text-4xl text-foreground">
            {tool.slug === "image-to-pdf" ||
              tool.slug === "images-to-pdf" ||
              tool.slug === "jpg-to-pdf" ||
              tool.slug === "png-to-pdf" ||
              tool.slug === "webp-to-pdf" ||
              tool.slug === "heic-to-pdf"
              ? "Select Images or Drag & Drop Multiple Photos Here"
              : isMultiFileTool
                ? "Select PDF Files or Drag & Drop Multiple PDFs Here"
                : `Select PDF File or Drag & Drop Here`}
          </h2>

          <p className="mt-3 max-w-md text-sm font-semibold text-muted-foreground md:text-base">
            Accepts <span className="font-extrabold text-foreground">{tool.accepts}</span> · Returns{" "}
            <span className="font-extrabold text-foreground">{tool.outputs}</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 sm:px-10 py-4 sm:py-5 text-base font-extrabold text-background shadow-2xl transition-all hover:scale-105 cursor-pointer"
            >
              <span>
                {tool.slug === "image-to-pdf" ||
                  tool.slug === "images-to-pdf" ||
                  tool.slug === "jpg-to-pdf" ||
                  tool.slug === "png-to-pdf" ||
                  tool.slug === "webp-to-pdf" ||
                  tool.slug === "heic-to-pdf"
                  ? "Select Images"
                  : isMultiFileTool
                    ? "Select PDF Files"
                    : "Select PDF Document"}
              </span>
              <span aria-hidden>→</span>
            </button>
          </div>

          <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Enterprise-grade security &amp; privacy · Safe File Processing</span>
          </p>
        </div>
      )}

      {/* ─── 2. ACTIVE SETTINGS & CONFIGURATION WORKSPACE ───────────────────────── */}
      {(!hasProcessed && (files.length > 0 || isInvoiceTool)) && (
        isEditTool ? (
          /* ─── DEDICATED FULL-SCREEN PDF EDITOR STUDIO ─── */
          <>
            {/* Hidden Image Input for Inserting Images / Signatures onto PDF Page */}
            <input
              ref={editImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              onChange={handleEditImageUpload}
              className="hidden"
            />
            <input
              ref={editReplaceImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              onChange={handleReplaceSelectedImageUpload}
              className="hidden"
            />

            {/* Inline Fallback / Minimized Studio View (when user exits Full Screen) */}
            {!editIsFullscreen ? (
              <div className="w-full max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-200">
                <div className="sticky top-4 z-30 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>Change PDF</span>
                    </button>

                    <div className="flex items-center rounded-xl bg-secondary p-1 border border-border">
                      <button
                        type="button"
                        disabled={editCurrentPage <= 1}
                        onClick={() => setEditCurrentPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-foreground">
                        Page {editCurrentPage} of {activeFile?.pageCount || 1}
                      </span>
                      <button
                        type="button"
                        disabled={editCurrentPage >= (activeFile?.pageCount || 1)}
                        onClick={() => setEditCurrentPage((p) => Math.min(activeFile?.pageCount || 1, p + 1))}
                        className="rounded-lg p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditIsFullscreen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] hover:bg-[#1f1f1f] text-white px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>Launch Full Screen PDF Editor</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => addEditElement("text")}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer"
                    >
                      <Type className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>+ Add Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditToolMode("crop-photo")}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer"
                    >
                      <Shapes className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>Select / Shape Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addEditElement("whiteout")}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      <span>+ Whiteout Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-[#ff5500]" />
                      <span>+ Image</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleProcess}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#ff5500] hover:bg-[#e04b00] disabled:opacity-50 text-white px-5 py-2.5 text-xs sm:text-sm font-black shadow-lg shadow-[#ff5500]/25 cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Save &amp; Export PDF ({editEdits.length})</span>
                    </button>
                  </div>
                </div>

                <div className="w-full overflow-auto custom-scrollbar rounded-3xl border-2 border-border bg-[#0a0a0a]/5 dark:bg-[#0a0a0a]/40 p-4 sm:p-8 flex justify-center min-h-[700px] shadow-inner">
                  {editIsLoadingPage ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-3">
                      <Loader2 className="h-8 w-8 text-[#ff5500] animate-spin" />
                      <span className="text-sm font-bold text-muted-foreground">Rendering High-Resolution Page...</span>
                    </div>
                  ) : editPageImageUrl ? (
                    renderEditorCanvas(false)
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-3">
                <p className="text-sm font-bold text-muted-foreground">
                  Full-Screen PDF Editor Studio is active.
                </p>
                <button
                  type="button"
                  onClick={() => setEditIsFullscreen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Return to Full Screen Studio</span>
                </button>
              </div>
            )}

            {/* ── FULL-SCREEN DEDICATED PDF EDITOR STUDIO PORTAL (WHITE, ORANGE & BLACK THEME) ── */}
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
                      onClick={() => setEditShowThumbnails((prev) => !prev)}
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
                        onClick={() => setEditCurrentPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setEditCurrentPage((p) => Math.min(activeFile?.pageCount || 1, p + 1))}
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
                    ].map((tItem) => {
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
                        onChange={(e) => {
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
                        onClick={() => setEditZoom((z) => Math.max(50, z - 25))}
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
                        onClick={() => setEditZoom((z) => Math.min(250, z + 25))}
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
                      onChange={(e) => {
                        const val = e.target.value as PdfStandardFontName;
                        setEditActiveFont(val);
                        if (editSelectedId) updateEditItem(editSelectedId, { fontFamily: val });
                      }}
                      className="rounded-xl border border-white/15 bg-[#1f1f1f] px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-[#ff5500] cursor-pointer"
                    >
                      {STANDARD_FONTS.map((f) => (
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
                      ].map((c) => {
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
                        onChange={(e) => {
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
                        {IMAGE_SHAPE_OPTIONS.map((s) => {
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
                          {(["rounded", "circle", "pill", "diamond", "hexagon"] as PdfImageShape[]).map((sh) => (
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
                      onClick={() => setEditShowDetectedOverlays((prev) => !prev)}
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
                      onClick={() => setEditShowInspector((prev) => !prev)}
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
                        {Array.from({ length: activeFile?.pageCount || 1 }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = editCurrentPage === pageNum;
                          const pageEditsCount = editEdits.filter((e) => e.pageNumber === pageNum).length;

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
                              {editExtractedImageItems.map((imgItem, idx) => {
                                const activeEdit = currentPageEdits.find((e) => e.sourceId === imgItem.id && !e.isDeleted);
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
                                      {IMAGE_SHAPE_OPTIONS.map((s) => {
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
                              {editExtractedTextItems.map((txtItem, idx) => {
                                const linkedEdit = currentPageEdits.find((e) => e.sourceId === txtItem.id);
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
                                      onChange={(e) => activateExtractedTextItem(txtItem, e.target.value)}
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
                              {visiblePageEdits.map((item, i) => {
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
                                        onClick={(e) => {
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
                                        onClick={(e) => {
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left Column: Preview Panel (WORKSPACE / PREVIEWS) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {!isInvoiceTool && files.length > 0 && (
                <div className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
                  {isSplitTool ? (
                    /* ─── DEDICATED SPLIT PDF: ALL PAGES SELECTION PREVIEW GRID ─── */
                    <>
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            <h3 className="font-display font-extrabold uppercase text-xs sm:text-sm tracking-wider text-foreground">
                              SELECT PAGES TO SPLIT ({activeFile?.pageCount || 1} {activeFile?.pageCount === 1 ? "PAGE" : "PAGES"})
                            </h3>
                          </div>
                          <p className="text-[10px] text-muted-foreground pl-4.5">
                            Click cards to select/unselect pages for extraction
                          </p>
                        </div>

                        {/* Selection Toolbar & Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-xl text-xs font-mono font-bold border border-border">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {splitSelectedPages.length}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span>{activeFile?.pageCount || 1} selected</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#f95738] hover:bg-[#ff684a] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Change PDF</span>
                          </button>

                          {activeFile && (
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem(activeFile)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Preview PDF"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* All Pages Cards Grid */}
                      <div className="flex flex-wrap gap-3 max-h-[560px] overflow-y-auto pr-1 p-0.5">
                        {Array.from({ length: activeFile?.pageCount || 1 }, (_, i) => i + 1).map((pageNum) => {
                          const isSelected = splitSelectedPages.includes(pageNum);
                          const thumb = splitPageThumbs[pageNum];

                          return (
                            <div
                              key={`split-page-${pageNum}`}
                              onClick={() => handleToggleSplitPage(pageNum)}
                              className={`w-32 sm:w-36 rounded-2xl border-2 transition-all p-2 flex flex-col gap-1.5 group relative shrink-0 select-none cursor-pointer ${isSelected
                                ? "border-emerald-500 bg-emerald-500/5 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                                : "border-border/80 bg-card/60 opacity-60 hover:opacity-100 hover:border-foreground/30 shadow-2xs"
                                }`}
                            >
                              {/* Authentic Portrait Page Sheet (Compact A4 Proportion) */}
                              <div className="relative w-full aspect-[1/1.414] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 border border-border/70 shadow-xs ring-1 ring-black/5">
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={`Page ${pageNum}`}
                                    className="w-full h-full object-contain rounded select-none pointer-events-none"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5 p-1 text-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                    <span className="text-[9px] font-bold text-muted-foreground">Rendering...</span>
                                  </div>
                                )}

                                {/* Page Number Badge (Top Left) */}
                                <div className="absolute top-1 left-1 z-10">
                                  <span className="flex h-4.5 px-1.5 items-center justify-center rounded bg-foreground/80 text-background text-[9px] font-mono font-bold shadow-2xs">
                                    p. {pageNum}
                                  </span>
                                </div>

                                {/* Selection Checkbox Badge (Top Right) */}
                                <div className="absolute top-1 right-1 z-10">
                                  {isSelected ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs animate-in zoom-in-50 duration-150">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 border border-slate-300 text-transparent group-hover:border-foreground/60 transition-colors shadow-2xs" />
                                  )}
                                </div>

                                {/* Status Hover Pill */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs whitespace-nowrap ${isSelected ? "bg-emerald-500 text-white" : "bg-black/75 text-white"
                                    }`}>
                                    {isSelected ? "Selected" : "Click to select"}
                                  </span>
                                </div>
                              </div>

                              {/* Page Info Footer */}
                              <div className="text-center">
                                <span className={`text-[11px] font-bold transition-colors ${isSelected ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-muted-foreground"
                                  }`}>
                                  Page {pageNum}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* Standard Multi-File / Single-File Workspace */
                    <>
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" />
                            <h3 className="font-display font-extrabold uppercase text-xs sm:text-sm tracking-wider text-foreground">
                              WORKSPACE / PREVIEWS ({files.length} {files.length === 1 ? "FILE" : "FILES"})
                            </h3>
                          </div>
                          {isMultiFileTool && files.length > 1 && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 pl-4.5">
                              <GripVertical className="h-3 w-3 inline text-orange-500" />
                              <span>Drag & drop cards to switch page position</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          {files[activeFileIndex] && (
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem(files[activeFileIndex] || null)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Preview PDF"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview PDF</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#f95738] hover:bg-[#ff684a] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>{isMultiFileTool ? (tool.slug.includes("images") ? "Add Images" : "Add PDFs") : "Change PDF"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFiles([])}
                            className="text-xs font-extrabold text-red-500 hover:text-red-600 hover:underline transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Preview Cards Grid - Compact Portrait Page Sheets with Drag-and-Drop */}
                      <div className="flex flex-wrap gap-3 max-h-[560px] overflow-y-auto pr-1 p-0.5">
                        {files.map((item, idx) => {
                          const isSelected = activeFileIndex === idx;
                          const isDragged = draggedFileIndex === idx;
                          const isDragOver = dragOverIndex === idx;

                          return (
                            <div
                              key={item.id}
                              draggable={isMultiFileTool}
                              onDragStart={(e) => {
                                if (!isMultiFileTool) return;
                                e.dataTransfer.setData("text/plain", String(idx));
                                e.dataTransfer.effectAllowed = "move";
                                setDraggedFileIndex(idx);
                              }}
                              onDragOver={(e) => {
                                if (!isMultiFileTool) return;
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedFileIndex !== null && draggedFileIndex !== idx) {
                                  setDragOverIndex(idx);
                                }
                              }}
                              onDragLeave={(e) => {
                                e.stopPropagation();
                                if (dragOverIndex === idx) {
                                  setDragOverIndex(null);
                                }
                              }}
                              onDrop={(e) => {
                                if (!isMultiFileTool) return;
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedFileIndex !== null && draggedFileIndex !== idx) {
                                  handleReorderFiles(draggedFileIndex, idx);
                                }
                                setDraggedFileIndex(null);
                                setDragOverIndex(null);
                              }}
                              onDragEnd={() => {
                                setDraggedFileIndex(null);
                                setDragOverIndex(null);
                              }}
                              onClick={() => setActiveFileIndex(idx)}
                              className={`w-32 sm:w-36 rounded-2xl border-2 transition-all p-2 flex flex-col gap-1.5 group relative shrink-0 select-none ${isMultiFileTool ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                                } ${isDragged
                                  ? "opacity-30 scale-95 border-dashed border-orange-500 shadow-none"
                                  : isDragOver
                                    ? "border-orange-500 ring-4 ring-orange-500/40 scale-105 bg-orange-500/15 shadow-xl"
                                    : isSelected
                                      ? "border-orange-500 bg-orange-500/5 shadow-md ring-2 ring-orange-500/30"
                                      : "border-border/80 bg-card hover:border-foreground/30 hover:bg-secondary/40 shadow-2xs"
                                }`}
                            >
                              {/* Authentic Portrait Page Sheet (Compact A4 Proportion) */}
                              <div className="relative w-full aspect-[1/1.414] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 border border-border/70 shadow-xs ring-1 ring-black/5">
                                {item.thumbnailUrl ? (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.name}
                                    className="w-full h-full object-contain rounded select-none pointer-events-none"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5 p-1 text-center">
                                    {item.isLoadingThumb ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                    ) : (
                                      <FileText className="h-6 w-6 text-red-500" />
                                    )}
                                    <span className="text-[9px] font-bold text-muted-foreground">Rendering...</span>
                                  </div>
                                )}

                                {/* Index Badge & Drag Handle */}
                                <div className="absolute top-1 left-1 flex items-center gap-0.5 z-10">
                                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-foreground/80 text-background text-[9px] font-mono font-bold shadow-2xs">
                                    {idx + 1}
                                  </span>
                                  {isMultiFileTool && (
                                    <span
                                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded p-0.5"
                                      title="Drag to switch position"
                                    >
                                      <GripVertical className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </div>

                                {/* Circular Delete Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(idx);
                                  }}
                                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-600 hover:text-red-500 hover:bg-red-50 shadow-2xs border border-slate-200 transition-all cursor-pointer z-10"
                                  title="Remove file"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>

                                {/* Circular Quick Preview Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewModalItem(item);
                                  }}
                                  className="absolute bottom-1 right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black hover:scale-110 shadow-2xs border border-white/20 transition-all cursor-pointer z-10"
                                  title="Preview Large PDF"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>

                                {/* Reorder Buttons (Move Left / Right) on hover */}
                                {isMultiFileTool && (
                                  <div
                                    className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 bg-black/75 backdrop-blur-xs rounded p-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveFile(idx, "up");
                                        }}
                                        className="p-0.5 rounded text-white hover:text-orange-400 hover:bg-white/20 transition-all cursor-pointer"
                                        title="Move Left"
                                      >
                                        <ChevronLeft className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                    {idx < files.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveFile(idx, "down");
                                        }}
                                        className="p-0.5 rounded text-white hover:text-orange-400 hover:bg-white/20 transition-all cursor-pointer"
                                        title="Move Right"
                                      >
                                        <ChevronRight className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* File Details */}
                              <div className="space-y-0.5 text-center">
                                <p
                                  className="truncate text-[11px] font-bold text-foreground group-hover:text-accent transition-colors"
                                  title={item.name}
                                >
                                  {item.name}
                                </p>
                                <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-muted-foreground">
                                  <span>{(item.size / 1024).toFixed(1)} KB</span>
                                  {item.pageCount && item.pageCount > 1 && (
                                    <span className="bg-foreground/10 text-foreground px-1 py-0.2 rounded text-[8px] font-bold">
                                      {item.pageCount}p
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Interactive Settings Panel */}
            <div className="lg:col-span-6 rounded-3xl border-2 border-border bg-card p-5 sm:p-6 shadow-md flex flex-col space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div>
                  <h3 className="font-display text-xl font-bold">{tool.name} Settings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.blurb}</p>
                </div>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-accent-foreground uppercase">
                  {tool.tag || "PDF"}
                </span>
              </div>

              {/* 1. MERGE PDF CONTROLS */}
              {tool.slug === "merge-pdf" && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-secondary/50 p-4 border border-border/80 space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Merge Configuration</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      PDFs will be combined in the exact order listed on the left. Use the arrows to reorder or the button below to add more documents.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                  >
                    <FilePlus className="h-4 w-4 text-accent" />
                    <span>Add Another PDF</span>
                  </button>
                </div>
              )}

              {/* IMAGE TO PDF CONTROLS */}
              {(tool.slug === "image-to-pdf" ||
                tool.slug === "images-to-pdf" ||
                tool.slug === "jpg-to-pdf" ||
                tool.slug === "png-to-pdf" ||
                tool.slug === "webp-to-pdf") && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/80 space-y-2">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Multi-Image PDF Compilation</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {files.length > 1
                          ? `${files.length} images will be compiled into a single PDF document in the exact order shown on the left.`
                          : "Upload multiple images to combine them into a single multi-page PDF document. Drag to reorder pages anytime."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground block">Page Size:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "a4", label: "A4 (Standard)" },
                          { id: "letter", label: "US Letter" },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setTargetPageSize(fmt.id as "a4" | "letter")}
                            className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${targetPageSize === fmt.id
                              ? "bg-foreground text-background shadow-sm"
                              : "border-border text-muted-foreground hover:border-foreground"
                              }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                    >
                      <FilePlus className="h-4 w-4 text-accent" />
                      <span>Add More Images</span>
                    </button>
                  </div>
                )}

              {/* 2. SPLIT PDF CONTROLS */}
              {(tool.slug === "split-pdf" || tool.slug === "halve-pdf-pages") && (
                <div className="space-y-4">
                  <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block">
                    Split Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitMode("ranges")}
                      className={`rounded-2xl border-2 p-3 text-xs font-bold text-center cursor-pointer transition-all ${splitMode === "ranges"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Custom Page Ranges
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitMode("all");
                        handleSelectAllSplitPages();
                      }}
                      className={`rounded-2xl border-2 p-3 text-xs font-bold text-center cursor-pointer transition-all ${splitMode === "all"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Extract Selected Pages
                    </button>
                  </div>

                  {/* Quick Selection Buttons Row */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={handleSelectAllSplitPages}
                      className="rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={handleDeselectAllSplitPages}
                      className="rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectOddSplitPages}
                      className="rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                      title="Select Odd Pages (1, 3, 5...)"
                    >
                      Odd
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectEvenSplitPages}
                      className="rounded-full border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                      title="Select Even Pages (2, 4, 6...)"
                    >
                      Even
                    </button>

                    <button
                      type="button"
                      onClick={handleSplitAllPages}
                      className="rounded-full border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                      title="Select and split all pages of the document"
                    >
                      <Split className="h-3.5 w-3.5" />
                      <span>Split All Pages</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground block">
                        Page Ranges (e.g. 1-3, 5, 8-10):
                      </label>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {splitSelectedPages.length} of {activeFile?.pageCount || 1} selected
                      </span>
                    </div>
                    <input
                      type="text"
                      value={splitRanges}
                      onChange={(e) => handleSplitRangesInputChange(e.target.value)}
                      placeholder="e.g. 1-2, 4"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Click pages on the preview grid to select/unselect, or type ranges above.
                    </p>
                  </div>

                  {/* Selected pages badge pills */}
                  {splitSelectedPages.length > 0 ? (
                    <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Pages to extract ({splitSelectedPages.length}):
                        </span>
                        <button
                          type="button"
                          onClick={handleDeselectAllSplitPages}
                          className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {splitSelectedPages.map((p) => (
                          <span
                            key={p}
                            onClick={() => handleToggleSplitPage(p)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold hover:bg-red-500/15 hover:text-red-600 hover:border-red-500/30 transition-all cursor-pointer group"
                            title="Click to remove page from split"
                          >
                            <span>Page {p}</span>
                            <span className="text-[9px] text-muted-foreground group-hover:text-red-500">×</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-center">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        No pages selected. Click pages on the preview grid to select them.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. COMPRESS PDF CONTROLS */}
              {(tool.slug === "compress-pdf" || tool.slug === "web-optimize-pdf") && (
                <div className="space-y-4">
                  {/* Mode Selector: Target File Size vs Quality Presets */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                      Compression Mode:
                    </label>
                    <div className="flex items-center rounded-xl bg-secondary p-1 border border-border">
                      <button
                        type="button"
                        onClick={() => setCompressMode("target")}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${compressMode === "target"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Target File Size
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompressMode("preset")}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${compressMode === "preset"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Preset Level
                      </button>
                    </div>
                  </div>

                  {/* TARGET FILE SIZE INPUT (e.g. 100 KB) */}
                  {compressMode === "target" && (
                    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Desired Max File Size:</span>
                        {activeFile && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Current: <strong className="text-foreground">{formatBytes(activeFile.size)}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 transition-colors focus-within:border-accent">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={targetSizeInput}
                          onChange={(e) => setTargetSizeInput(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full bg-transparent text-sm sm:text-base font-mono font-bold focus:outline-none text-foreground"
                        />
                        <div className="flex items-center rounded-lg bg-secondary p-0.5 border border-border shrink-0">
                          {(["KB", "MB"] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => setTargetSizeUnit(unit)}
                              className={`rounded-md px-2.5 py-1 text-xs font-black cursor-pointer transition-all ${targetSizeUnit === unit
                                ? "bg-foreground text-background shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Informative notice if document is already within desired target ceiling */}
                      {isTargetAlreadyUnder && activeFile && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Document ({formatBytes(activeFile.size)}) is already within your target ceiling ({formatBytes(currentTargetBytes)}). Compression will optimize streams losslessly to preserve 100% vector sharpness.
                          </span>
                        </div>
                      )}

                      {/* Quick Smart Presets */}
                      {smartTargetPresets.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Suggestions:</span>
                          {smartTargetPresets.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setTargetSizeInput(preset.val);
                                setTargetSizeUnit(preset.unit);
                              }}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${targetSizeInput === preset.val && targetSizeUnit === preset.unit
                                ? "border-accent bg-accent/15 text-accent font-extrabold shadow-2xs"
                                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Automatically optimizes compression to reach under{" "}
                        <strong className="text-foreground">
                          {targetSizeInput || 100} {targetSizeUnit}
                        </strong>{" "}
                        while maximizing text and visual clarity.
                      </p>
                    </div>
                  )}

                  {/* PRESET QUALITY LEVEL */}
                  {compressMode === "preset" && (
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block">
                        Compression Level:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "extreme", label: "Extreme", desc: "Max size reduction (~75%)" },
                          { id: "recommended", label: "Recommended", desc: "Balanced quality (~50%)" },
                          { id: "high", label: "High Quality", desc: "Print crisp (~30%)" },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setCompressLevel(lvl.id as any)}
                            className={`rounded-2xl border-2 p-3 text-left cursor-pointer transition-all ${compressLevel === lvl.id
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <p className="text-xs font-black">{lvl.label}</p>
                            <p className="text-[10px] opacity-80 mt-0.5">{lvl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grayscale Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-3.5">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Convert to Grayscale (B&W)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Removes color channels for maximum size reduction
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={convertToGrayscale}
                      onChange={(e) => setConvertToGrayscale(e.target.checked)}
                      className="h-4 w-4 rounded accent-foreground cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 4. PROTECT PDF CONTROLS */}
              {(tool.slug === "protect-pdf" || tool.slug === "generate-password") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">Set Password:</label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="h-3 w-3" />
                        <span>Generate Strong Key</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={pdfPassword}
                        onChange={(e) => setPdfPassword(e.target.value)}
                        placeholder="Enter secret password..."
                        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-mono font-bold pr-10 focus:outline-none focus:border-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Permissions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowPrinting}
                          onChange={(e) => setAllowPrinting(e.target.checked)}
                          className="rounded accent-foreground"
                        />
                        <span>Allow Printing</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowCopying}
                          onChange={(e) => setAllowCopying(e.target.checked)}
                          className="rounded accent-foreground"
                        />
                        <span>Allow Copy Text</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. UNLOCK PDF CONTROLS */}
              {tool.slug === "unlock-pdf" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                    <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      <span>Password Decryption</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enter the known password if the file is encrypted, and we will permanently strip the lock.
                    </p>
                  </div>
                  <input
                    type="password"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="Document password (if known)..."
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-foreground"
                  />
                </div>
              )}

              {/* 6. SIGN PDF CONTROLS */}
              {tool.slug === "sign-pdf" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSigMode("draw")}
                      className={`rounded-2xl border-2 py-2.5 text-xs font-bold cursor-pointer transition-all ${sigMode === "draw" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
                        }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigMode("type")}
                      className={`rounded-2xl border-2 py-2.5 text-xs font-bold cursor-pointer transition-all ${sigMode === "type" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
                        }`}
                    >
                      Type Name
                    </button>
                  </div>

                  {sigMode === "draw" ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-border rounded-2xl bg-white overflow-hidden">
                        <canvas
                          ref={sigCanvasRef}
                          width={400}
                          height={140}
                          onMouseDown={startDrawSig}
                          onMouseMove={drawSig}
                          onMouseUp={stopDrawSig}
                          onMouseLeave={stopDrawSig}
                          className="w-full h-32 cursor-crosshair block"
                        />
                        {!hasSignatureDrawn && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-slate-400">
                            Sign here with mouse or stylus
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {["#0f172a", "#1e40af", "#047857"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSigColor(c)}
                              style={{ backgroundColor: c }}
                              className={`h-5 w-5 rounded-full border-2 cursor-pointer ${sigColor === c ? "border-foreground scale-110" : "border-transparent"
                                }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={clearSigCanvas}
                          className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={sigTypedName}
                        onChange={(e) => setSigTypedName(e.target.value)}
                        placeholder="Type your full name..."
                        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-foreground"
                      />
                      {sigTypedName && (
                        <div className="p-4 bg-white text-black font-serif italic text-2xl rounded-2xl border border-border text-center">
                          {sigTypedName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 7. WATERMARK CONTROLS */}
              {(tool.slug === "add-watermark-pdf" || tool.slug === "add-watermark") && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Watermark Text:</label>
                    <input
                      type="text"
                      value={wmText}
                      onChange={(e) => setWmText(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Opacity: {wmOpacity}%</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Angle: {wmAngle}°</label>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={wmAngle}
                        onChange={(e) => setWmAngle(Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Color:</span>
                    {["#ef4444", "#3b82f6", "#64748b", "#0f172a"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWmColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-6 w-6 rounded-full border-2 cursor-pointer ${wmColor === c ? "border-foreground scale-110" : "border-transparent"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 8. PAGE NUMBERS CONTROLS */}
              {(tool.slug === "add-page-numbers-pdf" || tool.slug === "add-page-numbers") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground block">Position:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "bottom_center", label: "Bottom Center" },
                        { id: "bottom_right", label: "Bottom Right" },
                        { id: "top_right", label: "Top Right" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPageNumberPos(p.id as any)}
                          className={`rounded-2xl border p-2.5 text-xs font-bold text-center cursor-pointer transition-all ${pageNumberPos === p.id
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Format:</label>
                    <select
                      value={pageNumberFormat}
                      onChange={(e) => setPageNumberFormat(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-bold focus:outline-none"
                    >
                      <option value="Page {n} of {total}">Page 1 of 10</option>
                      <option value="{n}">1, 2, 3...</option>
                      <option value="- {n} -">- 1 -</option>
                      <option value="Page {n}">Page 1</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 9. ROTATE CONTROLS */}
              {tool.slug === "rotate-pdf-pages" && (
                <div className="space-y-4">
                  <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block">
                    Rotation Angle:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { angle: 90, label: "90° Right" },
                      { angle: 180, label: "180° Flip" },
                      { angle: 270, label: "90° Left" },
                    ].map((r) => (
                      <button
                        key={r.angle}
                        type="button"
                        onClick={() => setRotationAngle(r.angle as any)}
                        className={`rounded-2xl border-2 py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${rotationAngle === r.angle
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. INVOICE VISUAL BUILDER */}
              {isInvoiceTool && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Invoice #:</label>
                      <input
                        type="text"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Currency:</label>
                      <select
                        value={invoiceData.currency}
                        onChange={(e) => setInvoiceData({ ...invoiceData, currency: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      >
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="₹">INR (₹)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Company Name:</label>
                      <input
                        type="text"
                        value={invoiceData.companyName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Client Name:</label>
                      <input
                        type="text"
                        value={invoiceData.clientName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase text-muted-foreground">Line Items:</label>
                      <button
                        type="button"
                        onClick={() =>
                          setInvoiceData({
                            ...invoiceData,
                            items: [
                              ...invoiceData.items,
                              { id: String(Date.now()), description: "New Service", quantity: 1, rate: 100, taxPercent: 0 },
                            ],
                          })
                        }
                        className="text-[11px] text-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {invoiceData.items.map((it, i) => (
                      <div key={it.id} className="grid grid-cols-12 gap-1.5 items-center bg-secondary/30 p-2 rounded-xl border border-border/60">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => {
                            const updated = [...invoiceData.items];
                            updated[i]!.description = e.target.value;
                            setInvoiceData({ ...invoiceData, items: updated });
                          }}
                          className="col-span-6 rounded border border-border bg-background px-2 py-1 text-xs"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => {
                            const updated = [...invoiceData.items];
                            updated[i]!.quantity = Number(e.target.value);
                            setInvoiceData({ ...invoiceData, items: updated });
                          }}
                          className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs text-center"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          value={it.rate}
                          onChange={(e) => {
                            const updated = [...invoiceData.items];
                            updated[i]!.rate = Number(e.target.value);
                            setInvoiceData({ ...invoiceData, items: updated });
                          }}
                          className="col-span-3 rounded border border-border bg-background px-2 py-1 text-xs text-right"
                          placeholder="Rate"
                        />
                        {invoiceData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceData({
                                ...invoiceData,
                                items: invoiceData.items.filter((_, idx) => idx !== i),
                              });
                            }}
                            className="col-span-1 text-red-500 hover:text-red-700 flex justify-center cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit Cost or Free Daily Quota Indicator */}
              {(() => {
                const cost = AdminStore.getToolCreditCost(tool.slug);
                const isFree = cost === 0;

                if (isFree) {
                  const usage = AdminStore.getToolDailyUsage(tool.slug);
                  return (
                    <div className="flex items-center justify-between text-xs px-1 text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Free Tool (20 files/day)</span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {usage} / 20 used today
                      </span>
                    </div>
                  );
                }

                const silver = AuthUser.getSilverTokens();
                const gold = AuthUser.getGoldTokens();

                if (!AuthUser.isLoggedIn()) {
                  return null;
                }

                return (
                  <div className="flex items-center justify-between text-xs px-1 text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-foreground font-bold">
                        Cost: {cost} Token{cost === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2 py-0.5 rounded-full border border-border/60">
                        <span className="flex items-center gap-1" title="Silver Tokens (Free)">
                          <TokenCoin type="silver" size="xs" />
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{silver}</span>
                        </span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1" title="Gold Tokens (Purchased)">
                          <TokenCoin type="gold" size="xs" />
                          <span className="font-mono text-amber-500 font-bold">{gold}</span>
                        </span>
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Balance: {AuthUser.getCredits()}
                    </span>
                  </div>
                );
              })()}

              {/* ACTION EXECUTE BUTTON */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={
                    processing ||
                    (isSplitTool && splitSelectedPages.length === 0) ||
                    (isCompressTool &&
                      compressMode === "target" &&
                      (!targetSizeInput || parseFloat(targetSizeInput) <= 0))
                  }
                  onClick={handleProcess}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-4 text-sm sm:text-base font-black text-background shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing Document...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 text-accent" />
                      <span>
                        {isInvoiceTool
                          ? "Generate PDF Invoice"
                          : tool.slug === "image-to-pdf" ||
                            tool.slug === "images-to-pdf" ||
                            tool.slug === "jpg-to-pdf" ||
                            tool.slug === "png-to-pdf" ||
                            tool.slug === "webp-to-pdf"
                            ? `Convert ${files.length > 1 ? `${files.length} Images` : "Image"} to PDF`
                            : `Process with ${tool.name}`}
                      </span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ─── 3. PROCESSED COMPLETION VIEW (Full-Page Animated Studio Layout) ──── */}
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

      {/* Standalone Fullscreen Large PDF Viewer Modal */}
      {previewModalItem && (
        <PdfPreviewViewer
          buffer={previewModalItem.buffer}
          fileName={previewModalItem.name}
          fileSize={previewModalItem.size}
          initialFullscreen={true}
          onClose={() => setPreviewModalItem(null)}
        />
      )}
    </div>
  );
}
