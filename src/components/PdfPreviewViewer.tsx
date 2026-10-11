import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Loader2,
  FileText,
  Lock,
  Eye,
  Download,
  X,
} from "lucide-react";
import { renderPdfPage } from "@/lib/pdf-preview";

export interface WatermarkPreviewProps {
  text?: string;
  opacity?: number;
  angle?: number;
  color?: string;
  size?: number;
}

export interface PageNumberPreviewProps {
  position?: "bottom_center" | "bottom_right" | "bottom_left" | "top_center" | "top_right";
  format?: string;
  startNumber?: number;
}

export interface PdfPreviewViewerProps {
  buffer: ArrayBuffer | null;
  fileName: string;
  fileSize?: number;
  toolSlug?: string;
  watermarkProps?: WatermarkPreviewProps;
  rotationAngle?: number;
  pageNumberProps?: PageNumberPreviewProps;
  className?: string;
  compact?: boolean;
  initialFullscreen?: boolean;
  onClose?: () => void;
}

export function PdfPreviewViewer({
  buffer,
  fileName,
  fileSize,
  toolSlug,
  watermarkProps,
  rotationAngle = 0,
  pageNumberProps,
  className = "",
  compact = false,
  initialFullscreen = false,
  onClose,
}: PdfPreviewViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen);
  const [localRotation, setLocalRotation] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialFullscreen prop if changed
  useEffect(() => {
    if (initialFullscreen) {
      setIsFullscreen(true);
    }
  }, [initialFullscreen]);

  // Prevent background body scroll when viewing in large fullscreen modal
  useEffect(() => {
    if (!isFullscreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        if (onClose) onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
      } else if (e.key === "ArrowRight") {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, currentPage, totalPages, onClose]);

  // Render current page when buffer or page changes
  useEffect(() => {
    if (!buffer) {
      setPageDataUrl(null);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    let isMounted = true;
    setLoading(true);

    renderPdfPage(buffer, currentPage, 1.8)
      .then((res) => {
        if (!isMounted) return;
        setPageDataUrl(res.dataUrl);
        setTotalPages(res.totalPages || 1);
        setIsProtected(Boolean(res.isPasswordProtected));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Preview render failed:", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [buffer, currentPage]);

  // Reset to page 1 when buffer (new document) changes
  useEffect(() => {
    setCurrentPage(1);
  }, [buffer]);

  // Generate lightweight thumbnails for filmstrip if multi-page
  useEffect(() => {
    if (!buffer || totalPages <= 1 || totalPages > 20) {
      setPageThumbnails([]);
      return;
    }

    let isCancelled = false;
    const thumbs: string[] = [];

    // Pre-render small thumbs for up to 10 pages
    const pagesToRender = Math.min(totalPages, 10);
    const renderThumbs = async () => {
      for (let p = 1; p <= pagesToRender; p++) {
        if (isCancelled) break;
        try {
          const res = await renderPdfPage(buffer, p, 0.35);
          if (isCancelled) break;
          thumbs[p - 1] = res.dataUrl;
        } catch {
          // ignore individual thumb error
        }
      }
      if (!isCancelled) {
        setPageThumbnails([...thumbs]);
      }
    };

    renderThumbs();

    return () => {
      isCancelled = true;
    };
  }, [buffer, totalPages]);

  // Page switcher handlers
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(2.5, Math.round((z + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  const handleRotate = () => {
    setLocalRotation((r) => (r + 90) % 360);
  };

  const handleDownload = () => {
    if (!buffer) return;
    try {
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    if (onClose) onClose();
  };

  // Watermark text preview formatting
  const showWatermark =
    (toolSlug === "add-watermark-pdf" || toolSlug === "add-watermark") &&
    Boolean(watermarkProps?.text);

  // Page number preview formatting
  const showPageNumber =
    (toolSlug === "add-page-numbers-pdf" || toolSlug === "add-page-numbers") &&
    Boolean(pageNumberProps?.position);

  const formattedPageNumber = pageNumberProps?.format
    ? pageNumberProps.format
        .replace("{n}", String(currentPage + (pageNumberProps.startNumber || 1) - 1))
        .replace("{total}", String(totalPages))
    : `Page ${currentPage} of ${totalPages}`;

  const pageNumberPositionClasses = {
    bottom_center: "bottom-4 left-1/2 -translate-x-1/2",
    bottom_right: "bottom-4 right-6",
    bottom_left: "bottom-4 left-6",
    top_center: "top-4 left-1/2 -translate-x-1/2",
    top_right: "top-4 right-6",
  }[pageNumberProps?.position || "bottom_center"];

  const effectiveRotation = (rotationAngle + localRotation) % 360;

  if (!buffer) {
    return (
      <div className={`rounded-2xl border-2 border-dashed border-border bg-card/40 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-muted-foreground mb-2">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-foreground">No Document Selected</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Upload a PDF to view interactive preview</p>
      </div>
    );
  }

  // Common sheet canvas renderer
  const renderDocumentCanvas = (isLargeModal: boolean) => (
    <div
      className={`relative flex-1 w-full overflow-auto flex items-center justify-center ${
        isLargeModal
          ? "h-[calc(100vh-140px)] p-4 sm:p-8 bg-[#0b0d14]"
          : compact
          ? "min-h-[200px] max-h-[290px] sm:max-h-[320px] p-3 sm:p-4 bg-muted/40"
          : "min-h-[380px] max-h-[560px] p-4 sm:p-6 bg-muted/40"
      }`}
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs font-bold text-muted-foreground animate-pulse">Rendering Page {currentPage}...</p>
        </div>
      )}

      {isProtected && (
        <div className="absolute top-4 z-20 flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm backdrop-blur-md">
          <Lock className="h-3.5 w-3.5" />
          <span>Document is password protected</span>
        </div>
      )}

      {pageDataUrl ? (
        <div
          className="relative transition-transform duration-200 ease-out select-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Sheet Canvas Shadow Wrapper */}
          <div
            className={`relative bg-white rounded-md shadow-2xl overflow-hidden transition-transform duration-300 ring-1 ${
              isLargeModal ? "ring-white/20" : "ring-border/50"
            }`}
            style={{
              transform: effectiveRotation ? `rotate(${effectiveRotation}deg)` : undefined,
            }}
          >
            <img
              src={pageDataUrl}
              alt={`Page ${currentPage} of ${fileName}`}
              className={`object-contain block pointer-events-none select-none ${
                isLargeModal
                  ? "max-h-[calc(100vh-170px)] sm:max-h-[calc(100vh-190px)] max-w-[90vw] sm:max-w-[85vw] w-auto"
                  : compact
                  ? "max-h-[240px] sm:max-h-[280px] max-w-full"
                  : "max-h-[520px] max-w-full"
              }`}
              draggable={false}
            />

            {/* LIVE WATERMARK OVERLAY SIMULATION */}
            {showWatermark && (
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                style={{
                  opacity: (watermarkProps?.opacity || 35) / 100,
                }}
              >
                <p
                  className="font-black uppercase tracking-widest whitespace-nowrap select-none drop-shadow-sm"
                  style={{
                    transform: `rotate(${watermarkProps?.angle || 45}deg)`,
                    fontSize: `${Math.max(16, (watermarkProps?.size || 50) * (isLargeModal ? 1.0 : compact ? 0.5 : 0.8))}px`,
                    color: watermarkProps?.color || "#ef4444",
                  }}
                >
                  {watermarkProps?.text}
                </p>
              </div>
            )}

            {/* LIVE PAGE NUMBER OVERLAY SIMULATION */}
            {showPageNumber && (
              <div
                className={`absolute pointer-events-none bg-black/85 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-md ${pageNumberPositionClasses}`}
              >
                {formattedPageNumber}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <p className="text-xs font-bold">Generating page preview...</p>
        </div>
      )}
    </div>
  );

  // Common filmstrip carousel renderer
  const renderFilmstrip = (isLargeModal: boolean) => {
    if (totalPages <= 1) return null;
    return (
      <div
        className={`shrink-0 w-full overflow-x-auto flex items-center border-t ${
          isLargeModal
            ? "border-white/10 bg-[#12141e] px-4 py-2.5 gap-2.5 shadow-2xl z-20"
            : compact
            ? "border-border bg-card px-3 py-1.5 gap-2"
            : "border-border bg-card px-4 py-2.5 gap-2.5"
        }`}
      >
        <span
          className={`text-[10px] font-extrabold uppercase shrink-0 ${
            isLargeModal ? "text-slate-400" : "text-muted-foreground"
          }`}
        >
          Pages:
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = currentPage === p;
            const thumbUrl = pageThumbnails[p - 1];

            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`group relative flex flex-col items-center gap-0.5 p-0.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? isLargeModal
                      ? "border-accent bg-accent/20 ring-2 ring-accent shadow-md"
                      : "border-foreground bg-secondary/80 ring-2 ring-foreground/20 shadow-xs"
                    : isLargeModal
                    ? "border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10"
                    : "border-border/60 bg-secondary/30 hover:border-foreground/50 hover:bg-secondary/60"
                }`}
                title={`Jump to Page ${p}`}
              >
                <div
                  className={`${
                    isLargeModal ? "w-9 h-12" : compact ? "w-7 h-9" : "w-10 h-13"
                  } bg-white rounded border border-border/70 overflow-hidden flex items-center justify-center shadow-2xs`}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={`Thumb ${p}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-slate-500">{p}</span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold ${
                    isActive
                      ? isLargeModal
                        ? "text-accent font-black"
                        : "text-foreground font-black"
                      : isLargeModal
                      ? "text-slate-400"
                      : "text-muted-foreground"
                  }`}
                >
                  p.{p}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const inPageContainerClasses = compact
    ? `rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col ${className}`
    : `rounded-3xl border-2 border-border bg-card shadow-lg overflow-hidden flex flex-col ${className}`;

  return (
    <>
      {/* ─── 1. IN-PAGE EMBEDDED VIEWER (Never causes page overlap) ─── */}
      <div ref={containerRef} className={inPageContainerClasses}>
        {/* In-Page Toolbar */}
        <div
          className={`flex flex-wrap items-center justify-between border-b border-border bg-secondary/40 shrink-0 w-full ${
            compact ? "px-3 py-2 gap-2" : "px-4 py-3 gap-3"
          }`}
        >
          {/* Document Name & Badges */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20 ${
                compact ? "h-6 w-6" : "h-8 w-8 rounded-xl"
              }`}
            >
              <Eye className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </div>
            <div className="min-w-0">
              <p
                className={`truncate font-bold text-foreground ${
                  compact ? "text-[11px] max-w-[130px] sm:max-w-[200px]" : "text-xs font-black max-w-[180px] sm:max-w-xs"
                }`}
                title={fileName}
              >
                {fileName}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                {fileSize ? <span>{(fileSize / 1024).toFixed(1)} KB</span> : null}
                {totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-foreground">{totalPages} Pages</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Page Switcher */}
          {totalPages > 1 && (
            <div
              className={`flex items-center bg-card rounded-lg border border-border shadow-xs ${
                compact ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1 rounded-xl"
              }`}
            >
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={handlePrev}
                className="p-0.5 rounded hover:bg-secondary text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>

              <span className={`font-mono font-bold select-none ${compact ? "text-[10px] px-1" : "text-xs px-1.5 font-black"}`}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={handleNext}
                className="p-0.5 rounded hover:bg-secondary text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>
            </div>
          )}

          {/* Zoom & Fullscreen Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className={`border border-border bg-card hover:bg-secondary text-foreground disabled:opacity-40 transition-all cursor-pointer ${
                compact ? "p-1 rounded-lg" : "p-1.5 rounded-xl"
              }`}
              title="Zoom Out"
            >
              <ZoomOut className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className={`font-mono font-bold border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer ${
                compact ? "px-1.5 py-0.5 text-[10px] rounded-lg" : "px-2 py-1 text-[11px] rounded-xl"
              }`}
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className={`border border-border bg-card hover:bg-secondary text-foreground disabled:opacity-40 transition-all cursor-pointer ${
                compact ? "p-1 rounded-lg" : "p-1.5 rounded-xl"
              }`}
              title="Zoom In"
            >
              <ZoomIn className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className={`border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer ml-0.5 ${
                compact ? "p-1 rounded-lg" : "p-1.5 rounded-xl ml-1"
              }`}
              title="Fullscreen Large PDF View"
            >
              <Maximize2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>
          </div>
        </div>

        {/* Document Canvas Viewport */}
        {renderDocumentCanvas(false)}

        {/* Page Filmstrip Carousel */}
        {renderFilmstrip(false)}
      </div>

      {/* ─── 2. DEDICATED FULLSCREEN LARGE PDF MODAL (Rendered via Portal) ─── */}
      {typeof document !== "undefined" &&
        isFullscreen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`PDF Viewer - ${fileName}`}
            className="fixed inset-0 z-[999999] bg-[#0b0c10] flex flex-col text-slate-100 select-none overflow-hidden animate-in fade-in duration-200"
          >
            {/* Fullscreen Header Bar (Opaque & Solid) */}
            <div className="h-14 sm:h-16 border-b border-white/10 bg-[#12141e] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xl z-20">
              {/* Document Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent border border-accent/30 shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    className="truncate font-extrabold text-xs sm:text-sm md:text-base text-white max-w-[150px] sm:max-w-xs md:max-w-md"
                    title={fileName}
                  >
                    {fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-400">
                    {fileSize ? <span>{(fileSize / 1024).toFixed(1)} KB</span> : null}
                    {totalPages > 1 && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-accent">{totalPages} Pages</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Page Navigator */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/15 shadow-sm">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || loading}
                    onClick={handlePrev}
                    className="p-1 rounded-lg hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous Page (Left Arrow)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="font-mono text-xs sm:text-sm font-black px-1.5 select-none text-white whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages || loading}
                    onClick={handleNext}
                    className="p-1 rounded-lg hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next Page (Right Arrow)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Right Action Tools */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Rotate Page Button */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 sm:p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer"
                  title="Rotate View 90° Clockwise"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-xl border border-white/15 p-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="font-mono font-bold px-2 py-1 text-xs text-white hover:bg-white/15 rounded-lg transition-all cursor-pointer"
                    title="Reset Zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                  title="Download this PDF document"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>

                {/* Prominent Exit Fullscreen / Close Button */}
                <button
                  type="button"
                  onClick={handleCloseFullscreen}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-white font-extrabold text-xs transition-all border border-white/20 cursor-pointer shadow-sm ml-1"
                  title="Exit Large View (Escape key)"
                >
                  <Minimize2 className="h-3.5 w-3.5 sm:hidden" />
                  <X className="h-3.5 w-3.5 hidden sm:inline" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Document Canvas (Full Height, Sharp, Expanded) */}
            {renderDocumentCanvas(true)}

            {/* Bottom Filmstrip Carousel */}
            {renderFilmstrip(true)}
          </div>,
          document.body
        )}
    </>
  );
}
