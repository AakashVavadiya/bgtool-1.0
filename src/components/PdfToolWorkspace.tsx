import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Upload, FileText, Download, Check, RefreshCw, Trash2, Maximize2, Loader2, Copy, ChevronLeft, ChevronRight, ShieldCheck, Type, Eraser, Move, Image as ImageIcon, Shapes } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { type Tool } from "@/lib/tools";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { mergePdfDocuments, splitPdfDocument, rotatePdfPages, addWatermarkToPdf, addPageNumbersToPdf, compressPdfDocument, protectPdfDocument, flattenPdfDocument, changePdfPageDimensions, generateInvoicePdf, extractInvoiceDataFromPdfBuffer, convertInvoiceDataToUblXml, generateZugferdHybridPdf, parseXmlEInvoiceToInvoiceData, convertImagesToPdf, applyEditsToPdf, type PdfTextEditItem, type PdfStandardFontName, type PdfEditElementKind, type PdfImageShape, type InvoiceData } from "@/lib/pdf-engine";
import { generateFileThumbnail, renderPdfPage, extractPdfPageElements, cropRegionFromPageDataUrl, type ExtractedPdfTextItem, type ExtractedPdfImageItem } from "@/lib/pdf-preview";
import { PdfPreviewViewer } from "@/components/PdfPreviewViewer";
import { Telemetry, REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { PdfStudioPortal } from "@/components/pdf-workspace/PdfStudioPortal";
import { PdfCompletedView } from "@/components/pdf-workspace/PdfCompletedView";
import { PdfActiveWorkspaceGrid } from "@/components/pdf-workspace/PdfActiveWorkspaceGrid";
import { RefrensInvoiceStudio } from "@/components/pdf-workspace/RefrensInvoiceStudio";
import { PdfToEInvoiceStudio } from "@/components/pdf-workspace/PdfToEInvoiceStudio";

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
    documentTitle: "Tax Invoice",
    documentSubtitle: "",
    themeColor: "#ff5500",
    invoiceTemplate: "executive-orange",
    invoiceFont: "sans",
    taxMode: "gst_intra",
    invoiceNumber: "A00001",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    currency: "₹",
    companyName: "Acme Creative Studio",
    companyCountry: "India",
    companyGstin: "",
    companyAddress: "100 Innovation Way, Suite 400",
    companyCityState: "Mumbai, Maharashtra - 400001",
    companyEmail: "billing@acmecreative.com",
    clientName: "Enterprise Client Corp",
    clientCountry: "India",
    clientGstin: "",
    clientAddress: "500 Market Boulevard",
    clientCityState: "Bengaluru, Karnataka - 560001",
    clientEmail: "accounts@clientcorp.com",
    items: [
      { id: "1", description: "UI/UX System Design & Prototyping", hsnSac: "998314", quantity: 1, rate: 12000, taxPercent: 18 },
      { id: "2", description: "Technical Documentation & Export Suite", hsnSac: "998313", quantity: 2, rate: 4500, taxPercent: 18 },
    ],
    showTotalInWords: true,
    signatureLabel: "Authorized Signatory",
    notes: "Thank you for your business. Wire transfer, UPI, or online card accepted.",
    terms: "1. Please pay within 15 days from the date of invoice, overdue interest @ 14% will be charged on delayed payments.\n2. Please quote invoice number when remitting funds.",
  });

  const isInvoiceTool = tool.slug === "create-invoice";
  const isPdfInvoiceToEInvoiceTool = tool.slug === "pdf-invoice-to-einvoice";
  const isXmlEInvoiceToPdfTool = tool.slug === "xml-einvoice-to-pdf";
  const [einvoiceStandard, setEinvoiceStandard] = useState<"ubl-2.1" | "factur-x" | "peppol-bis">("ubl-2.1");
  const [resultXmlText, setResultXmlText] = useState<string>("");

  // Calculate accepted MIME types dynamically based on tool
  const acceptedFileExtensions = useMemo(() => {
    if (isInvoiceTool) return ".pdf,.xml,.json";
    if (isPdfInvoiceToEInvoiceTool) return ".pdf,application/pdf";
    if (isXmlEInvoiceToPdfTool) return ".xml,.json,text/xml,application/xml,application/json";
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
      setResultXmlText("");
      toast.success(`Loaded ${newItems.length} file${newItems.length > 1 ? "s" : ""}!`);

      // Automatically parse uploaded PDF invoice or XML e-invoice into structured invoiceData
      const primaryItem = newItems[0];
      if (primaryItem && isPdfInvoiceToEInvoiceTool) {
        extractInvoiceDataFromPdfBuffer(primaryItem.buffer)
          .then((parsed) => {
            setInvoiceData((prev) => ({
              ...prev,
              ...parsed,
              invoiceTemplate: prev.invoiceTemplate || "executive-orange",
              themeColor: prev.themeColor || "#ff5500",
            }));
            toast.success(`Extracted invoice #${parsed.invoiceNumber} (${parsed.items.length} line item${parsed.items.length === 1 ? "" : "s"}) from PDF!`);
          })
          .catch((err) => {
            console.warn("Could not auto-extract PDF invoice fields:", err);
          });
      } else if (primaryItem && isXmlEInvoiceToPdfTool) {
        try {
          const parsed = parseXmlEInvoiceToInvoiceData(primaryItem.buffer);
          setInvoiceData((prev) => ({
            ...prev,
            ...parsed,
            invoiceTemplate: prev.invoiceTemplate || "executive-orange",
            themeColor: prev.themeColor || "#ff5500",
          }));
          toast.success(`Parsed XML E-Invoice #${parsed.invoiceNumber} (${parsed.items.length} line item${parsed.items.length === 1 ? "" : "s"})!`);
        } catch (err) {
          console.warn("Could not parse XML e-invoice:", err);
        }
      }

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
      // 12. PDF INVOICE TO E-INVOICE (ZUGFeRD Hybrid PDF/A-3 + XML or standalone UBL / XRechnung / Peppol XML)
      else if (isPdfInvoiceToEInvoiceTool) {
        const formatChoice = invoiceData.einvoiceOutputFormat || "zugferd-en16931";
        if (formatChoice === "zugferd-en16931") {
          const hybridRes = await generateZugferdHybridPdf(invoiceData, activeFile?.buffer);
          outputPdfBytes = hybridRes.pdfBytes;
          outName = `${baseName}_zugferd_en16931.pdf`;
          pageCount = hybridRes.pageCount;
          setResultXmlText(hybridRes.xmlString);
        } else {
          const { xmlString, xmlBytes } = convertInvoiceDataToUblXml(invoiceData, formatChoice);
          outputPdfBytes = xmlBytes;
          outName = `${baseName}_${formatChoice}_einvoice.xml`;
          pageCount = 1;
          setResultXmlText(xmlString);
        }
      }
      // 13. XML E-INVOICE TO PDF (Render parsed UBL/Factur-X/ZUGFeRD XML into formatted A4 PDF Invoice)
      else if (isXmlEInvoiceToPdfTool) {
        if (!activeFile) throw new Error("Please upload an XML or E-Invoice file first.");
        const invRes = await generateInvoicePdf(invoiceData);
        outputPdfBytes = invRes.pdfBytes;
        outName = `${baseName}_visual_invoice.pdf`;
        pageCount = invRes.pageCount;
        setResultXmlText("");
      }
      // 14. GENERAL FALLBACK (Compress/Re-pack)
      else {
        if (!activeFile) throw new Error("No file selected.");
        const compRes = await compressPdfDocument(activeFile.buffer, "recommended");
        outputPdfBytes = compRes.pdfBytes;
        outName = `${baseName}_ready.pdf`;
        pageCount = compRes.pageCount;
      }

      // Convert to blob and buffer for preview
      const isPureXmlOutput =
        isPdfInvoiceToEInvoiceTool && (invoiceData.einvoiceOutputFormat || "zugferd-en16931") !== "zugferd-en16931";
      const blob = new Blob([outputPdfBytes as unknown as BlobPart], {
        type: isPureXmlOutput ? "application/xml;charset=utf-8" : "application/pdf",
      });
      const origSize = activeFile ? activeFile.size : (files.reduce((acc, f) => acc + f.size, 0) || 50000);
      const outBuffer = isPureXmlOutput
        ? null
        : (outputPdfBytes.buffer.slice(
            outputPdfBytes.byteOffset,
            outputPdfBytes.byteOffset + outputPdfBytes.byteLength
          ) as ArrayBuffer);

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

  const pdfWorkspaceScope = {
    tool,
    files,
    setFiles,
    activeFileIndex,
    setActiveFileIndex,
    activeFile,
    processing,
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
    fileInputRef,
    sigCanvasRef,
    hasSignatureDrawn,
    isMultiFileTool,
    isSplitTool,
    splitMode,
    setSplitMode,
    splitRanges,
    splitSelectedPages,
    splitPageThumbs,
    isCompressTool,
    compressMode,
    setCompressMode,
    compressLevel,
    setCompressLevel,
    targetSizeInput,
    setTargetSizeInput,
    targetSizeUnit,
    setTargetSizeUnit,
    convertToGrayscale,
    setConvertToGrayscale,
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
    pdfPassword,
    setPdfPassword,
    showPassword,
    setShowPassword,
    allowPrinting,
    setAllowPrinting,
    allowCopying,
    setAllowCopying,
    sigMode,
    setSigMode,
    sigTypedName,
    setSigTypedName,
    sigColor,
    setSigColor,
    wmText,
    setWmText,
    wmAngle,
    setWmAngle,
    wmOpacity,
    setWmOpacity,
    wmColor,
    setWmColor,
    pageNumberPos,
    setPageNumberPos,
    pageNumberFormat,
    setPageNumberFormat,
    rotationAngle,
    setRotationAngle,
    targetPageSize,
    setTargetPageSize,
    invoiceData,
    setInvoiceData,
    isInvoiceTool,
    isPdfInvoiceToEInvoiceTool,
    isXmlEInvoiceToPdfTool,
    einvoiceStandard,
    setEinvoiceStandard,
    resultXmlText,
    currentTargetBytes,
    isTargetAlreadyUnder,
    smartTargetPresets,
    draggedFileIndex,
    setDraggedFileIndex,
    dragOverIndex,
    setDragOverIndex,
    handleReorderFiles,
    moveFile,
    removeFile,
    handleToggleSplitPage,
    handleSelectAllSplitPages,
    handleDeselectAllSplitPages,
    handleSelectOddSplitPages,
    handleSelectEvenSplitPages,
    handleSplitAllPages,
    handleSplitRangesInputChange,
    generateStrongPassword,
    startDrawSig,
    drawSig,
    stopDrawSig,
    clearSigCanvas,
    handleProcess,
    handleDownload,
    handleQuickDownloadEditedPdf,
    handlePrint,
    handleOpenInNewTab,
    copyShareLink
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-6 py-2">
      {/* TOP DYNAMIC ISLAND FLOATING BAR (Animated on Scroll, Header-Aware) */}
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

      {/* 1. UPLOAD VIEW (When no file uploaded or editing) */}
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

      {/* 2. ACTIVE SETTINGS & CONFIGURATION WORKSPACE */}
      {(!hasProcessed && (files.length > 0 || isInvoiceTool)) && (
        isEditTool ? (
          /* DEDICATED FULL-SCREEN PDF EDITOR STUDIO */
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

            {/* FULL-SCREEN DEDICATED PDF EDITOR STUDIO PORTAL (WHITE, ORANGE & BLACK THEME) */}
            <PdfStudioPortal {...pdfWorkspaceScope} />
          </>
        ) : isInvoiceTool ? (
          <RefrensInvoiceStudio
            tool={tool}
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            processing={processing}
            handleProcess={handleProcess}
          />
        ) : isPdfInvoiceToEInvoiceTool ? (
          <PdfToEInvoiceStudio
            tool={tool}
            files={files}
            setFiles={setFiles}
            activeFile={activeFile}
            fileInputRef={fileInputRef}
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            processing={processing}
            handleProcess={handleProcess}
            setPreviewModalItem={setPreviewModalItem}
          />
        ) : (
          <PdfActiveWorkspaceGrid {...pdfWorkspaceScope} />
        )
      )}

      {/* 3. PROCESSED COMPLETION VIEW (Full-Page Animated Studio Layout) */}
      <PdfCompletedView {...pdfWorkspaceScope} />

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
