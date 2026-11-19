// Two-column PDF workspace grid for page splitting, merging, compression, watermarks, security, and invoice generation.
import { Upload, FileText, FilePlus, ArrowRight, Check, Eye, EyeOff, RotateCw, Wand2, Shield, Trash2, Plus, KeyRound, Loader2, ChevronLeft, ChevronRight, GripVertical, Split } from "lucide-react";
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

// Helper: Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


export function PdfActiveWorkspaceGrid(props: any) {
  const {
    tool,
    files,
    setFiles,
    activeFileIndex,
    setActiveFileIndex,
    activeFile,
    processing,
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
    handleProcess
  } = props;

  return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left Column: Preview Panel (WORKSPACE / PREVIEWS) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {!isInvoiceTool && files.length > 0 && (
                <div className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
                  {isSplitTool ? (
                    /* DEDICATED SPLIT PDF: ALL PAGES SELECTION PREVIEW GRID */
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
                        {Array.from({ length: activeFile?.pageCount || 1 }, (_: any, i: any) => i + 1).map((pageNum: any) => {
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
                        {files.map((item: any, idx: any) => {
                          const isSelected = activeFileIndex === idx;
                          const isDragged = draggedFileIndex === idx;
                          const isDragOver = dragOverIndex === idx;

                          return (
                            <div
                              key={item.id}
                              draggable={isMultiFileTool}
                              onDragStart={(e: any) => {
                                if (!isMultiFileTool) return;
                                e.dataTransfer.setData("text/plain", String(idx));
                                e.dataTransfer.effectAllowed = "move";
                                setDraggedFileIndex(idx);
                              }}
                              onDragOver={(e: any) => {
                                if (!isMultiFileTool) return;
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedFileIndex !== null && draggedFileIndex !== idx) {
                                  setDragOverIndex(idx);
                                }
                              }}
                              onDragLeave={(e: any) => {
                                e.stopPropagation();
                                if (dragOverIndex === idx) {
                                  setDragOverIndex(null);
                                }
                              }}
                              onDrop={(e: any) => {
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
                                  onClick={(e: any) => {
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
                                  onClick={(e: any) => {
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
                                    onClick={(e: any) => e.stopPropagation()}
                                  >
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e: any) => {
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
                                        onClick={(e: any) => {
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
                        ].map((fmt: any) => (
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
                      onChange={(e: any) => handleSplitRangesInputChange(e.target.value)}
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
                        {splitSelectedPages.map((p: any) => (
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
                          onChange={(e: any) => setTargetSizeInput(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full bg-transparent text-sm sm:text-base font-mono font-bold focus:outline-none text-foreground"
                        />
                        <div className="flex items-center rounded-lg bg-secondary p-0.5 border border-border shrink-0">
                          {(["KB", "MB"] as const).map((unit: any) => (
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
                          {smartTargetPresets.map((preset: any) => (
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
                        ].map((lvl: any) => (
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
                      onChange={(e: any) => setConvertToGrayscale(e.target.checked)}
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
                        onChange={(e: any) => setPdfPassword(e.target.value)}
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
                          onChange={(e: any) => setAllowPrinting(e.target.checked)}
                          className="rounded accent-foreground"
                        />
                        <span>Allow Printing</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowCopying}
                          onChange={(e: any) => setAllowCopying(e.target.checked)}
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
                    onChange={(e: any) => setPdfPassword(e.target.value)}
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
                          {["#0f172a", "#1e40af", "#047857"].map((c: any) => (
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
                        onChange={(e: any) => setSigTypedName(e.target.value)}
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
                      onChange={(e: any) => setWmText(e.target.value)}
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
                        onChange={(e: any) => setWmOpacity(Number(e.target.value))}
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
                        onChange={(e: any) => setWmAngle(Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Color:</span>
                    {["#ef4444", "#3b82f6", "#64748b", "#0f172a"].map((c: any) => (
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
                      ].map((p: any) => (
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
                      onChange={(e: any) => setPageNumberFormat(e.target.value)}
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
                    ].map((r: any) => (
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

              {/* 10. E-INVOICE CONVERTER INSPECTOR (PDF Invoice -> E-Invoice XML & XML E-Invoice -> PDF) */}
              {(isInvoiceTool || isPdfInvoiceToEInvoiceTool || isXmlEInvoiceToPdfTool) && (
                <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                  {isPdfInvoiceToEInvoiceTool && (
                    <div className="rounded-2xl border border-[#ff5500]/30 bg-[#ff5500]/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#ff5500]">
                          Target E-Invoice Standard
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Auto-Extracted from PDF
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "ubl-2.1", label: "UBL 2.1 XML", sub: "OASIS Standard" },
                          { id: "factur-x", label: "Factur-X", sub: "EN 16931 / ZUGFeRD" },
                          { id: "peppol-bis", label: "Peppol BIS 3.0", sub: "Global B2B" },
                        ].map((std) => (
                          <button
                            key={std.id}
                            type="button"
                            onClick={() => setEinvoiceStandard?.(std.id as any)}
                            className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
                              einvoiceStandard === std.id
                                ? "border-[#ff5500] bg-[#ff5500] text-white shadow-xs"
                                : "border-border bg-background text-foreground hover:border-[#ff5500]/50"
                            }`}
                          >
                            <div className="text-[11px] font-black leading-tight">{std.label}</div>
                            <div className={`text-[9px] mt-0.5 ${einvoiceStandard === std.id ? "text-white/80" : "text-muted-foreground"}`}>
                              {std.sub}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isXmlEInvoiceToPdfTool && (
                    <div className="rounded-2xl border border-[#ff5500]/30 bg-[#ff5500]/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#ff5500]">
                          Parsed XML E-Invoice Data &amp; PDF Theme
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          UBL / ZUGFeRD Parsed
                        </span>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                          Visual PDF Design Template:
                        </label>
                        <select
                          value={invoiceData.invoiceTemplate || "executive-orange"}
                          onChange={(e: any) =>
                            setInvoiceData({ ...invoiceData, invoiceTemplate: e.target.value })
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                        >
                          <option value="executive-orange">1. Dual Wave Graphic Pro (Default Orange)</option>
                          <option value="modern-banner">2. Dynamic Diagonal Slash</option>
                          <option value="minimal-swiss">3. Minimal Bottom Wave</option>
                          <option value="corporate-split">4. Corporate Split Hero</option>
                          <option value="luxury-editorial">5. Luxury Gold Crest &amp; Arch</option>
                          <option value="tech-mono">6. SaaS Terminal Dark Grid</option>
                          <option value="bold-sidebar">7. Vertical Spine Studio</option>
                          <option value="gst-pro-ledger">8. Indian GST Ledger Grid</option>
                          <option value="agency-studio">9. Creative Circle &amp; Clouds</option>
                          <option value="compact-enterprise">10. Emerald V-Chevron Pro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Invoice #:</label>
                      <input
                        type="text"
                        value={invoiceData.invoiceNumber}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Currency:</label>
                      <select
                        value={invoiceData.currency}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, currency: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      >
                        <option value="₹">INR (₹)</option>
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Issue Date:</label>
                      <input
                        type="text"
                        value={invoiceData.issueDate}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                        placeholder="YYYY-MM-DD"
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Due Date:</label>
                      <input
                        type="text"
                        value={invoiceData.dueDate}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                        placeholder="YYYY-MM-DD"
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Seller / Supplier:</label>
                      <input
                        type="text"
                        value={invoiceData.companyName}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block">Buyer / Customer:</label>
                      <input
                        type="text"
                        value={invoiceData.clientName}
                        onChange={(e: any) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase text-muted-foreground">
                        Extracted Line Items ({invoiceData.items.length}):
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setInvoiceData({
                            ...invoiceData,
                            items: [
                              ...invoiceData.items,
                              { id: String(Date.now()), description: "New Line Item", quantity: 1, rate: 100, taxPercent: 18 },
                            ],
                          })
                        }
                        className="text-[11px] text-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {invoiceData.items.map((it: any, i: any) => (
                      <div key={it.id} className="grid grid-cols-12 gap-1.5 items-center bg-secondary/30 p-2 rounded-xl border border-border/60">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e: any) => {
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
                          onChange={(e: any) => {
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
                          onChange={(e: any) => {
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
                                items: invoiceData.items.filter((_: any, idx: any) => idx !== i),
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
                          : isPdfInvoiceToEInvoiceTool
                            ? "Convert PDF Invoice to E-Invoice (XML)"
                            : isXmlEInvoiceToPdfTool
                              ? "Convert XML E-Invoice to Visual PDF"
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
  );
}
