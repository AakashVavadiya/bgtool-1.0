import React, { useState, useRef, useEffect, useMemo } from "react";
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
} from "lucide-react";
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
  type InvoiceData,
} from "@/lib/pdf-engine";
import { generateFileThumbnail, renderPdfPage } from "@/lib/pdf-preview";
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
  const [previewModalItem, setPreviewModalItem] = useState<UploadedPdfItem | null>(null);
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

  // Merge tool options
  const isMultiFileTool = tool.slug === "merge-pdf" || tool.slug === "images-to-pdf" || tool.slug === "compare-pdfs";

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
    if (tool.slug === "images-to-pdf" || tool.slug === "jpg-to-pdf" || tool.slug === "png-to-pdf" || tool.slug === "webp-to-pdf" || tool.slug === "heic-to-pdf") {
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

  // Primary active file
  const activeFile = files[activeFileIndex] || files[0] || null;

  // Target file size calculation and boundary validation for Compress PDF
  const parsedTargetSize = parseFloat(targetSizeInput);
  const currentTargetBytes =
    !isNaN(parsedTargetSize) && parsedTargetSize > 0
      ? targetSizeUnit === "MB"
        ? parsedTargetSize * 1024 * 1024
        : parsedTargetSize * 1024
      : 0;

  const isTargetSizeExceeding =
    activeFile && activeFile.size > 0 && currentTargetBytes >= activeFile.size;

  // Auto-initialize default target size strictly lower than active PDF file size
  useEffect(() => {
    if (activeFile && isCompressTool && activeFile.size > 0) {
      const origKB = Math.round(activeFile.size / 1024);
      if (origKB > 0) {
        // If current target size is >= file size or not set, default to 50%
        if (currentTargetBytes >= activeFile.size || !targetSizeInput || parseFloat(targetSizeInput) <= 0) {
          const defaultKB = Math.max(5, Math.min(Math.round(origKB * 0.5), origKB - 1));
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
  }, [activeFile?.id, activeFile?.size, isCompressTool]);

  // Dynamic suggestions strictly lower than uploaded PDF file size
  const smartTargetPresets = useMemo(() => {
    if (!activeFile || activeFile.size <= 0) {
      return [
        { label: "50 KB", val: "50", unit: "KB" as const },
        { label: "100 KB", val: "100", unit: "KB" as const },
        { label: "200 KB", val: "200", unit: "KB" as const },
      ];
    }

    const origBytes = activeFile.size;
    const origKB = Math.round(origBytes / 1024);
    const presets: Array<{ label: string; val: string; unit: "KB" | "MB" }> = [];

    // Percentage presets (75%, 50%, 25%)
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

    // Standard round numbers strictly < origBytes * 0.90
    const standards: Array<{ label: string; val: string; unit: "KB" | "MB"; bytes: number }> = [
      { label: "20 KB", val: "20", unit: "KB", bytes: 20 * 1024 },
      { label: "50 KB", val: "50", unit: "KB", bytes: 50 * 1024 },
      { label: "100 KB", val: "100", unit: "KB", bytes: 100 * 1024 },
      { label: "150 KB", val: "150", unit: "KB", bytes: 150 * 1024 },
      { label: "200 KB", val: "200", unit: "KB", bytes: 200 * 1024 },
      { label: "300 KB", val: "300", unit: "KB", bytes: 300 * 1024 },
      { label: "500 KB", val: "500", unit: "KB", bytes: 500 * 1024 },
      { label: "1 MB", val: "1", unit: "MB", bytes: 1024 * 1024 },
      { label: "2 MB", val: "2", unit: "MB", bytes: 2 * 1024 * 1024 },
      { label: "5 MB", val: "5", unit: "MB", bytes: 5 * 1024 * 1024 },
    ];

    for (const std of standards) {
      if (std.bytes < origBytes * 0.9) {
        if (!presets.some((p) => p.val === std.val && p.unit === std.unit)) {
          presets.push({ label: std.label, val: std.val, unit: std.unit });
        }
      }
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

    if (!isFree && !AuthUser.hasCredits(cost)) {
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
          const targetBytes = Math.round(parsed * (targetSizeUnit === "MB" ? 1024 * 1024 : 1024));
          if (activeFile.size > 0 && targetBytes >= activeFile.size) {
            toast.error(
              `Target size must be lower than original PDF size (${formatBytes(activeFile.size)}).`
            );
            setProcessing(false);
            return;
          }
          targetSizeBytes = targetBytes;
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

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Tool link copied to clipboard!");
  };

  // Dynamic Island scroll listener when output is rendered
  useEffect(() => {
    if (!hasProcessed) {
      setShowDynamicIsland(false);
      setHasScrolledOnce(false);
      return;
    }

    const handleScroll = () => {
      setHasScrolledOnce(true);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Show when user scrolls down past the main workspace actions or past 280px
        const isPastWorkspace = rect.bottom < 180 || window.scrollY > 280;
        setShowDynamicIsland(isPastWorkspace);
      } else {
        setShowDynamicIsland(window.scrollY > 280);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (window.scrollY > 280) {
      handleScroll();
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasProcessed]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-6 py-2">
      {/* ── TOP DYNAMIC ISLAND FLOATING BAR (Animated on Scroll) ─────── */}
      {hasProcessed && (
        <div className="fixed top-3 sm:top-6 inset-x-0 flex justify-center items-center z-[100] pointer-events-none px-2 sm:px-4">
          <aside
            aria-label="Quick download dynamic island"
            className={`pointer-events-auto dynamic-island-box flex items-center gap-1.5 xs:gap-2 sm:gap-4 rounded-full border border-white/20 bg-black text-white p-1.5 sm:px-5 sm:py-3 shadow-2xl backdrop-blur-3xl ring-1 ring-white/15 max-w-[calc(100vw-16px)] sm:max-w-2xl mx-auto ${
              showDynamicIsland
                ? "island-enter"
                : hasScrolledOnce
                ? "island-exit"
                : "opacity-0 -translate-y-20 pointer-events-none"
            }`}
          >
            {/* 1. PDF Thumbnail & Details */}
            <div className="flex items-center gap-2 sm:gap-3 pl-0.5 sm:pl-1.5 shrink-0">
              <div className="relative h-9 w-9 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-neutral-900 shadow-md ring-2 ring-black flex items-center justify-center">
                {files[0]?.thumbnailUrl ? (
                  <img
                    src={files[0].thumbnailUrl}
                    alt="Processed PDF thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-rose-500/20 text-rose-400">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-[130px] lg:max-w-[200px] leading-tight">
                  {resultFileName || files[0]?.name || `${tool.name} Result`}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 leading-tight flex items-center gap-1.5 flex-wrap">
                  {isCompressTool && originalTotalSize > 0 ? (
                    <>
                      <span className="text-muted-foreground line-through opacity-70">
                        {formatBytes(originalTotalSize)}
                      </span>
                      <span className="text-white/40">→</span>
                      <span className="text-emerald-400 font-extrabold">{formatBytes(resultSize)}</span>
                      {originalTotalSize > resultSize && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[10px] font-black">
                          -{Math.max(0, Math.round(((originalTotalSize - resultSize) / originalTotalSize) * 100))}%
                        </span>
                      )}
                      <span className="text-white/40">•</span>
                      <span className="text-white/70">
                        {resultPageCount} {resultPageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{formatBytes(resultSize)}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/70">
                        {resultPageCount} {resultPageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 2. Primary Large Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="wobbly-btn flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-white text-black hover:bg-neutral-100 px-3 xs:px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-black shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 shrink-0" />
              <span>Download<span className="hidden xs:inline"> PDF</span></span>
            </button>

            {/* 3. Reset / Process Another (Icon Only Button) */}
            <button
              type="button"
              onClick={() => {
                setHasProcessed(false);
                setResultBlob(null);
                setResultBuffer(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="wobbly-btn flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black hover:scale-105 active:scale-90 transition-all shadow-md cursor-pointer"
              title="Process another PDF"
              aria-label="Process another PDF"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
          </aside>
        </div>
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
          className={`group cursor-pointer flex flex-col items-center justify-center text-center rounded-3xl border-3 border-dashed px-8 py-24 sm:py-32 w-full transition-all duration-300 ${
            isDragging
              ? "border-accent bg-accent/10 scale-[1.01] shadow-2xl"
              : "border-border bg-card/60 hover:border-foreground hover:bg-card shadow-lg"
          }`}
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl transition-all group-hover:scale-110">
            <Upload className="h-10 w-10 text-background" />
            <span className="absolute -inset-1 rounded-3xl bg-foreground/20 blur-lg animate-pulse" />
          </div>

          <h2 className="mt-8 font-display text-3xl font-extrabold md:text-4xl text-foreground">
            {isMultiFileTool
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
              <span>{isMultiFileTool ? "Select PDF Files" : "Select PDF Document"}</span>
              <span aria-hidden>→</span>
            </button>
          </div>

          <p className="mt-4 text-xs font-bold text-muted-foreground">
            🔒 100% Private Client-Side Processing · No file size limits
          </p>
        </div>
      )}

      {/* ─── 2. ACTIVE SETTINGS & CONFIGURATION WORKSPACE ───────────────────────── */}
      {(!hasProcessed && (files.length > 0 || isInvoiceTool)) && (
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
                            className={`w-32 sm:w-36 rounded-2xl border-2 transition-all p-2 flex flex-col gap-1.5 group relative shrink-0 select-none cursor-pointer ${
                              isSelected
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
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs whitespace-nowrap ${
                                  isSelected ? "bg-emerald-500 text-white" : "bg-black/75 text-white"
                                }`}>
                                  {isSelected ? "Selected" : "Click to select"}
                                </span>
                              </div>
                            </div>

                            {/* Page Info Footer */}
                            <div className="text-center">
                              <span className={`text-[11px] font-bold transition-colors ${
                                isSelected ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-muted-foreground"
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
                            className={`w-32 sm:w-36 rounded-2xl border-2 transition-all p-2 flex flex-col gap-1.5 group relative shrink-0 select-none ${
                              isMultiFileTool ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                            } ${
                              isDragged
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
                    className={`rounded-2xl border-2 p-3 text-xs font-bold text-center cursor-pointer transition-all ${
                      splitMode === "ranges"
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
                    className={`rounded-2xl border-2 p-3 text-xs font-bold text-center cursor-pointer transition-all ${
                      splitMode === "all"
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
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        compressMode === "target"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Target File Size
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompressMode("preset")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        compressMode === "preset"
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

                    <div
                      className={`flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5 transition-colors ${
                        isTargetSizeExceeding
                          ? "border-destructive bg-destructive/5 text-destructive"
                          : "border-border focus-within:border-accent"
                      }`}
                    >
                      <input
                        type="number"
                        min="5"
                        max={
                          activeFile && activeFile.size > 0
                            ? targetSizeUnit === "MB"
                              ? Math.max(0.01, activeFile.size / (1024 * 1024) - 0.01).toFixed(2)
                              : Math.max(1, Math.floor(activeFile.size / 1024) - 1)
                            : undefined
                        }
                        step="5"
                        value={targetSizeInput}
                        onChange={(e) => setTargetSizeInput(e.target.value)}
                        placeholder="e.g. 100"
                        className={`w-full bg-transparent text-sm sm:text-base font-mono font-bold focus:outline-none ${
                          isTargetSizeExceeding ? "text-destructive" : "text-foreground"
                        }`}
                      />
                      <div className="flex items-center rounded-lg bg-secondary p-0.5 border border-border shrink-0">
                        {(["KB", "MB"] as const).map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setTargetSizeUnit(unit)}
                            className={`rounded-md px-2.5 py-1 text-xs font-black cursor-pointer transition-all ${
                              targetSizeUnit === unit
                                ? "bg-foreground text-background shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exceeding Error Alert */}
                    {isTargetSizeExceeding && activeFile && (
                      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs font-bold text-destructive animate-in fade-in">
                        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        <span>
                          Target size ({formatBytes(currentTargetBytes)}) must be lower than original PDF size ({formatBytes(activeFile.size)}).
                        </span>
                      </div>
                    )}

                    {/* Quick Smart Presets strictly lower than file size */}
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
                            className={`rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                              targetSizeInput === preset.val && targetSizeUnit === preset.unit
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
                      {isTargetSizeExceeding ? (
                        <span className="text-destructive font-bold">
                          Maximum allowed target size is {formatBytes(Math.max(1024, activeFile ? activeFile.size - 1024 : 0))}.
                        </span>
                      ) : (
                        <>
                          Automatically optimizes compression to reach under{" "}
                          <strong className="text-foreground">
                            {targetSizeInput || 100} {targetSizeUnit}
                          </strong>.
                        </>
                      )}
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
                          className={`rounded-2xl border-2 p-3 text-left cursor-pointer transition-all ${
                            compressLevel === lvl.id
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
                    className={`rounded-2xl border-2 py-2.5 text-xs font-bold cursor-pointer transition-all ${
                      sigMode === "draw" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigMode("type")}
                    className={`rounded-2xl border-2 py-2.5 text-xs font-bold cursor-pointer transition-all ${
                      sigMode === "type" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
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
                            className={`h-5 w-5 rounded-full border-2 cursor-pointer ${
                              sigColor === c ? "border-foreground scale-110" : "border-transparent"
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
                      className={`h-6 w-6 rounded-full border-2 cursor-pointer ${
                        wmColor === c ? "border-foreground scale-110" : "border-transparent"
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
                        className={`rounded-2xl border p-2.5 text-xs font-bold text-center cursor-pointer transition-all ${
                          pageNumberPos === p.id
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
                      className={`rounded-2xl border-2 py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        rotationAngle === r.angle
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
                  Boolean(
                    isCompressTool &&
                      compressMode === "target" &&
                      (isTargetSizeExceeding || !targetSizeInput || parseFloat(targetSizeInput) <= 0)
                  )
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
                    <span>{isInvoiceTool ? "Generate PDF Invoice" : `Process with ${tool.name}`}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. PROCESSED COMPLETION VIEW ────────────────────────────────────── */}
      {hasProcessed && (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-border pb-6">
              <div className="flex items-center gap-4 text-left min-w-0 max-w-full">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
                  <Check className="h-7 w-7 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 inline-block">
                    Process Complete
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1 truncate" title={resultFileName}>
                    {resultFileName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ready for immediate high-resolution download
                  </p>
                </div>
              </div>

              {/* Size details */}
              {isCompressTool && originalTotalSize > 0 ? (
                <div className="shrink-0 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4 bg-secondary/50 px-4 sm:px-5 py-3 rounded-2xl border border-border/80 shadow-xs whitespace-nowrap">
                  {/* Pages */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider leading-none mb-1">
                      Pages
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-foreground leading-none">
                      {resultPageCount}
                    </span>
                  </div>

                  <div className="h-7 w-px bg-border shrink-0" />

                  {/* Original */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider leading-none mb-1">
                      Original
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground line-through decoration-muted-foreground/60 whitespace-nowrap leading-none">
                      {formatBytes(originalTotalSize)}
                    </span>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />

                  {/* Output */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider leading-none mb-1">
                      Output
                    </span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-foreground whitespace-nowrap leading-none">
                      {formatBytes(resultSize)}
                    </span>
                  </div>

                  {/* Savings Badge */}
                  {originalTotalSize > resultSize && (
                    <div className="pl-1 sm:pl-2 border-l border-border/70 flex items-center shrink-0">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-black shadow-xs whitespace-nowrap">
                        {Math.max(0, Math.round(((originalTotalSize - resultSize) / originalTotalSize) * 100))}% Smaller
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="shrink-0 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 bg-secondary/50 px-5 py-3 rounded-2xl border border-border/80 shadow-xs whitespace-nowrap">
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider leading-none mb-1">
                      Pages
                    </span>
                    <span className="font-mono text-sm font-extrabold text-foreground leading-none">
                      {resultPageCount}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-border shrink-0" />
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider leading-none mb-1">
                      File Size
                    </span>
                    <span className="font-mono text-base font-extrabold text-foreground whitespace-nowrap leading-none">
                      {formatBytes(resultSize)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Result PDF Preview */}
            {resultBuffer && (
              <div className="mx-auto w-full max-w-md sm:max-w-lg space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      Processed Document Live Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Ready to download
                  </span>
                </div>
                <PdfPreviewViewer
                  buffer={resultBuffer}
                  fileName={resultFileName}
                  fileSize={resultSize}
                  compact={true}
                  className="w-full shadow-xs"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasProcessed(false);
                  setResultBlob(null);
                  setResultBuffer(null);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Process Another File</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedLink ? "Link Copied!" : "Share Tool"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-foreground px-8 py-3.5 text-sm font-black text-background shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Document</span>
                </button>
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
