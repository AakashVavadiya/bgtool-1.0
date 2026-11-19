// Fullscreen preview, binary code lab, and live HTML/CSS editor modals for the tool workspace.
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Layers, Image as ImageIcon, Download, X, ChevronLeft, ChevronRight, Code2, Search, WrapText, Copy, EyeOff, ShieldCheck, Activity, Binary, Cpu, Eye, Terminal, Check, Wand2 } from "lucide-react";
import { EDITOR_THEMES, type EditorThemeKey, SAMPLE_VISUAL_TEST, SAMPLE_OG_CARD, SAMPLE_BADGE, SAMPLE_INVOICE, SAMPLE_CODE_BOX } from "@/lib/workspace/workspace-presets";
import { type RotateBatchItem } from "@/lib/workspace/excel-and-rotate-renderer";

export function WorkspaceFullscreenModals(props: any) {
  const {
    tool,
    file,
    imageSrc,
    processedSrc,
    hasProcessed,
    dimensions,
    outputDimensions,
    targetWidth,
    targetHeight,
    origSize,
    newSize,
    formatBytes,
    handleDownload,
    isFullscreenPreview,
    setIsFullscreenPreview,
    rotateBatch,
    fullscreenActiveIndex,
    setFullscreenActiveIndex,
    handleDownloadSingleRotatedItem,
    isCodeEditorOpen,
    setIsCodeEditorOpen,
    setEditorTheme,
    showEditorTopHeading,
    setShowEditorTopHeading,
    binaryOutputMode,
    setBinaryOutputMode,
    generateBinaryData,
    binaryStats,
    fullBinaryOutputText,
    binaryOutputText,
    isEditorSearching,
    setIsEditorSearching,
    editorSearchQuery,
    setEditorSearchQuery,
    editorLineWrap,
    setEditorLineWrap,
    editorFontSize,
    setEditorFontSize,
    copyToClipboard,
    binaryBitDepth,
    binaryDelimiter,
    isFullScreenHtmlEditorOpen,
    setIsFullScreenHtmlEditorOpen,
    tempHtmlCode,
    setTempHtmlCode,
    htmlEditorViewMode,
    setHtmlEditorViewMode,
    setHtmlCodeText,
    htmlRenderWidth,
    htmlRenderHeight,
  } = props;
  const editorTheme: EditorThemeKey = props.editorTheme;

  return (
    <>
      {/* Fullscreen Enlarge Image Preview Modal with Multi-Image Batch Switcher */}
      {typeof document !== "undefined" && isFullscreenPreview && (imageSrc || processedSrc || ((tool.slug === "rotate-image" || tool.slug === "watermark-image") && rotateBatch.length > 0)) && createPortal(
        (() => {
          const isRotateBatchActive = (tool.slug === "rotate-image" || tool.slug === "watermark-image") && rotateBatch.length > 1;
          const activeBatchItem = isRotateBatchActive
            ? rotateBatch[fullscreenActiveIndex] || rotateBatch[0]
            : null;

          const currentEnlargeSrc = isRotateBatchActive && activeBatchItem
            ? (activeBatchItem.processedDataUrl || activeBatchItem.dataUrl)
            : (processedSrc || imageSrc || "");

          const currentEnlargeTitle = isRotateBatchActive && activeBatchItem
            ? activeBatchItem.name
            : (file?.name || "Image Preview");

          const currentEnlargeWidth = isRotateBatchActive && activeBatchItem
            ? (activeBatchItem.processedWidth || activeBatchItem.width)
            : (hasProcessed && tool.slug === "resize-image" ? (outputDimensions.width || targetWidth) : dimensions.width);

          const currentEnlargeHeight = isRotateBatchActive && activeBatchItem
            ? (activeBatchItem.processedHeight || activeBatchItem.height)
            : (hasProcessed && tool.slug === "resize-image" ? (outputDimensions.height || targetHeight) : dimensions.height);

          const currentEnlargeSize = isRotateBatchActive && activeBatchItem
            ? (activeBatchItem.processedSize || activeBatchItem.size)
            : (hasProcessed && newSize ? newSize : origSize);

          const currentRotation = isRotateBatchActive && tool.slug === "rotate-image" && activeBatchItem
            ? ((activeBatchItem.rotation % 360) + 360) % 360
            : null;

          return (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setIsFullscreenPreview(false)}
              className="fixed inset-0 z-[9999999] flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200"
            >
              {/* Top Modal Header Bar */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between border-b border-white/15 bg-black/80 px-6 py-4 text-white shadow-2xl backdrop-blur-md shrink-0"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-accent shrink-0">
                    {isRotateBatchActive ? <Layers className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRotateBatchActive && (
                        <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent shrink-0">
                          Image {fullscreenActiveIndex + 1} of {rotateBatch.length}
                        </span>
                      )}
                      <h3 className="font-extrabold text-sm md:text-base text-white truncate max-w-[220px] sm:max-w-md">
                        {currentEnlargeTitle}
                      </h3>
                      {hasProcessed && !isRotateBatchActive && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
                          Processed Output
                        </span>
                      )}
                      {currentRotation !== null && (
                        <span className="rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white/90 shrink-0">
                          {currentRotation}°
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 font-semibold mt-0.5 truncate">
                      {currentEnlargeWidth} × {currentEnlargeHeight} px
                      {currentEnlargeSize > 0 && ` · ${formatBytes(currentEnlargeSize)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Quick Download Current Button inside Modal */}
                  {isRotateBatchActive && activeBatchItem ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleRotatedItem(activeBatchItem)}
                      className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-black text-accent-foreground shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Download this rotated image"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download Current</span>
                      <span className="sm:hidden">Download</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="hidden sm:flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-black text-accent-foreground shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  )}

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenPreview(false)}
                    className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-black text-white hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    title="Close preview (Esc)"
                  >
                    <X className="h-4 w-4" />
                    <span>Close</span>
                    <kbd className="hidden md:inline-block rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/70 font-mono border border-white/20">
                      ESC
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Centered Image Display Area with Left/Right Switcher Controls */}
              <div
                onClick={() => setIsFullscreenPreview(false)}
                className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden cursor-zoom-out"
              >
                {/* Floating Previous Image Button */}
                {isRotateBatchActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenActiveIndex((prev: number) => (prev > 0 ? prev - 1 : rotateBatch.length - 1));
                    }}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/65 hover:bg-white hover:text-black text-white border border-white/20 backdrop-blur-md shadow-2xl transition-all cursor-pointer group/nav"
                    title="Previous Image (← Left Arrow)"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 group-hover/nav:scale-110 transition-transform" />
                  </button>
                )}

                {/* Floating Next Image Button */}
                {isRotateBatchActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenActiveIndex((prev: number) => (prev < rotateBatch.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/65 hover:bg-white hover:text-black text-white border border-white/20 backdrop-blur-md shadow-2xl transition-all cursor-pointer group/nav"
                    title="Next Image (→ Right Arrow)"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 group-hover/nav:scale-110 transition-transform" />
                  </button>
                )}

                {/* Main Enlarged Image */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative max-h-[calc(100vh-220px)] max-w-[90vw] flex items-center justify-center cursor-default select-none"
                >
                  <img
                    key={isRotateBatchActive ? `${activeBatchItem?.id}_${fullscreenActiveIndex}` : "single"}
                    src={currentEnlargeSrc}
                    alt={currentEnlargeTitle}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-h-[calc(100vh-230px)] max-w-[88vw] object-contain rounded-2xl shadow-2xl border-2 border-white/15 animate-in zoom-in-95 duration-200 select-none workspace-protected-image"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    }}
                  />
                </div>
              </div>

              {/* Bottom Thumbnail Switcher Carousel for Multi-Image Batches */}
              {isRotateBatchActive && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="border-t border-white/15 bg-black/85 px-4 py-3 shadow-2xl backdrop-blur-md z-40 shrink-0"
                >
                  <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    <div className="text-xs font-mono text-white/70 font-bold shrink-0 hidden sm:flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-accent" />
                      <span>Switch:</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
                      {rotateBatch.map((item: RotateBatchItem, idx: number) => {
                        const isSelected = idx === fullscreenActiveIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFullscreenActiveIndex(idx)}
                            className={`group/thumb relative h-13 w-13 sm:h-15 sm:w-15 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center bg-zinc-900 ${isSelected
                              ? "border-accent ring-2 ring-accent/60 scale-105 shadow-lg shadow-accent/20"
                              : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/60"
                              }`}
                            title={`${idx + 1}. ${item.name}`}
                          >
                            <img
                              src={item.processedDataUrl || item.dataUrl}
                              alt={item.name}
                              className="h-full w-full object-contain p-1"
                            />
                            <span
                              className={`absolute top-1 left-1 rounded px-1 text-[9px] font-mono font-black ${isSelected ? "bg-accent text-accent-foreground" : "bg-black/80 text-white/90"
                                }`}
                            >
                              {idx + 1}
                            </span>
                            {tool.slug === "rotate-image" && (
                              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[8px] font-mono font-bold text-white/80">
                                {((item.rotation % 360) + 360) % 360}°
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs font-mono text-white/70 font-bold shrink-0 flex items-center gap-2">
                      <span className="hidden md:inline text-[11px] text-white/50">Use ← / → keys</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-accent font-bold">
                        {fullscreenActiveIndex + 1} / {rotateBatch.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}

      {/* FULLSCREEN BINARY & CODE RESEARCH EDITOR MODAL */}
      {typeof document !== "undefined" && isCodeEditorOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999999] flex flex-col font-mono text-xs select-text overflow-hidden animate-in fade-in duration-150"
          style={{
            backgroundColor: EDITOR_THEMES[editorTheme].bg,
            color: EDITOR_THEMES[editorTheme].text,
          }}
        >
          {/* 1. Header Toolbar (Can be toggled/hidden) */}
          {showEditorTopHeading ? (
            <>
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 shadow-md backdrop-blur-md shrink-0"
                style={{
                  borderColor: EDITOR_THEMES[editorTheme].border,
                  backgroundColor: EDITOR_THEMES[editorTheme].gutterBg,
                }}
              >
                {/* Left: Branding & File Info */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-inner"
                    style={{
                      backgroundColor: EDITOR_THEMES[editorTheme].bg,
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      color: EDITOR_THEMES[editorTheme].accent,
                    }}
                  >
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm tracking-wide" style={{ color: EDITOR_THEMES[editorTheme].text }}>
                        {file?.name ? `${file.name.replace(/\.[^.]+$/, "")}.${binaryOutputMode === "C-Array" ? "h" : binaryOutputMode === "Hexadecimal" ? "hex" : binaryOutputMode === "Base64" ? "base64" : "bin"}` : "image_stream.bin"}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                        style={{
                          borderColor: EDITOR_THEMES[editorTheme].accent,
                          color: EDITOR_THEMES[editorTheme].accent,
                          backgroundColor: `${EDITOR_THEMES[editorTheme].accent}15`,
                        }}
                      >
                        {binaryOutputMode} Mode
                      </span>
                    </div>
                    <p
                      className="text-[11px] font-semibold mt-0.5"
                      style={{ color: EDITOR_THEMES[editorTheme].gutterText }}
                    >
                      {binaryStats.totalBytes > 0
                        ? `${binaryStats.totalBytes.toLocaleString()} Bytes (${binaryStats.totalBits.toLocaleString()} Bits)`
                        : `${(fullBinaryOutputText || binaryOutputText).length.toLocaleString()} Characters`}
                      {" · "}
                      {binaryStats.magic.format}
                    </p>
                  </div>
                </div>

                {/* Middle: Live Format Switcher Tabs */}
                <div
                  className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto max-w-full"
                  style={{
                    backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    borderColor: EDITOR_THEMES[editorTheme].border,
                  }}
                >
                  {(
                    [
                      "Binary",
                      "Hexadecimal",
                      "Base64",
                      "C-Array",
                      "Pixel-Matrix",
                      "Decimal",
                      "Octal",
                    ] as const
                  ).map((mode) => {
                    const isActive = binaryOutputMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setBinaryOutputMode(mode);
                          if (imageSrc) generateBinaryData(imageSrc);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                        style={{
                          backgroundColor: isActive ? EDITOR_THEMES[editorTheme].accent : "transparent",
                          color: isActive ? "#ffffff" : EDITOR_THEMES[editorTheme].text,
                        }}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Actions, Themes, Search, Wrap, Hide Heading, Close */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Find / Search Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsEditorSearching(!isEditorSearching)}
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
                    style={{
                      borderColor: isEditorSearching ? EDITOR_THEMES[editorTheme].accent : EDITOR_THEMES[editorTheme].border,
                      backgroundColor: isEditorSearching ? `${EDITOR_THEMES[editorTheme].accent}25` : EDITOR_THEMES[editorTheme].bg,
                      color: isEditorSearching ? EDITOR_THEMES[editorTheme].accent : EDITOR_THEMES[editorTheme].text,
                    }}
                    title="Search bytes or text in stream (Ctrl+F)"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>

                  {/* Word Wrap Toggle */}
                  <button
                    type="button"
                    onClick={() => setEditorLineWrap(!editorLineWrap)}
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
                    style={{
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      backgroundColor: editorLineWrap ? `${EDITOR_THEMES[editorTheme].accent}20` : EDITOR_THEMES[editorTheme].bg,
                      color: editorLineWrap ? EDITOR_THEMES[editorTheme].accent : EDITOR_THEMES[editorTheme].text,
                    }}
                    title={`Word Wrap: ${editorLineWrap ? "ON" : "OFF"}`}
                  >
                    <WrapText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{editorLineWrap ? "Wrap" : "No Wrap"}</span>
                  </button>

                  {/* Font Size Adjusters */}
                  <div
                    className="flex items-center rounded-lg border overflow-hidden"
                    style={{
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setEditorFontSize((prev: number) => Math.max(10, prev - 1))}
                      className="px-2 py-1 hover:bg-white/10 transition-colors font-bold text-xs cursor-pointer"
                      style={{ color: EDITOR_THEMES[editorTheme].text }}
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <span
                      className="px-1.5 text-[11px] font-mono border-x font-bold"
                      style={{
                        borderColor: EDITOR_THEMES[editorTheme].border,
                        color: EDITOR_THEMES[editorTheme].text,
                      }}
                    >
                      {editorFontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditorFontSize((prev: number) => Math.min(22, prev + 1))}
                      className="px-2 py-1 hover:bg-white/10 transition-colors font-bold text-xs cursor-pointer"
                      style={{ color: EDITOR_THEMES[editorTheme].text }}
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>

                  {/* Theme Selector */}
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value as EditorThemeKey)}
                    className="rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: EDITOR_THEMES[editorTheme].bg,
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      color: EDITOR_THEMES[editorTheme].text,
                    }}
                  >
                    {(Object.keys(EDITOR_THEMES) as EditorThemeKey[]).map((tk) => (
                      <option key={tk} value={tk} style={{ backgroundColor: "#1e1e1e", color: "#ffffff" }}>
                        {EDITOR_THEMES[tk].name}
                      </option>
                    ))}
                  </select>

                  {/* Copy Full Dataset */}
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(
                        fullBinaryOutputText || binaryOutputText,
                        `${binaryOutputMode} Full Dataset`
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: EDITOR_THEMES[editorTheme].accent,
                      borderColor: EDITOR_THEMES[editorTheme].accent,
                      color: "#ffffff",
                    }}
                    title="Copy 100% complete dataset to clipboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy All</span>
                  </button>

                  {/* Download File */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: EDITOR_THEMES[editorTheme].bg,
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      color: EDITOR_THEMES[editorTheme].text,
                    }}
                    title="Download full file"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  {/* Hide Top Heading Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowEditorTopHeading(false)}
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: EDITOR_THEMES[editorTheme].bg,
                      borderColor: EDITOR_THEMES[editorTheme].border,
                      color: EDITOR_THEMES[editorTheme].text,
                    }}
                    title="Hide top heading & toolbar for full code view"
                  >
                    <EyeOff className="h-3.5 w-3.5 opacity-80" />
                    <span className="hidden lg:inline">Hide Heading</span>
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsCodeEditorOpen(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-extrabold text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xs cursor-pointer"
                    title="Close code editor (Esc)"
                  >
                    <X className="h-4 w-4" />
                    <span>Close</span>
                    <kbd className="hidden sm:inline-block rounded px-1 py-0.2 text-[9px] font-mono border border-current opacity-70">
                      ESC
                    </kbd>
                  </button>
                </div>
              </div>

              {/* 2. Binary Deep Research & Stream Analytics Panel */}
              <div
                className="flex items-center gap-3 px-4 py-2 border-b overflow-x-auto shrink-0 text-[11px]"
                style={{
                  borderColor: EDITOR_THEMES[editorTheme].border,
                  backgroundColor: `${EDITOR_THEMES[editorTheme].gutterBg}aa`,
                }}
              >
                {/* Header Signature */}
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shrink-0"
                  style={{
                    borderColor: EDITOR_THEMES[editorTheme].border,
                    backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    color: EDITOR_THEMES[editorTheme].text,
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: EDITOR_THEMES[editorTheme].accent }} />
                  <span className="font-bold opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Header:</span>
                  <span className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].accent }}>
                    {binaryStats.magic.format}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">[{binaryStats.magic.magicHex}]</span>
                </div>

                {/* Shannon Entropy */}
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shrink-0"
                  style={{
                    borderColor: EDITOR_THEMES[editorTheme].border,
                    backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    color: EDITOR_THEMES[editorTheme].text,
                  }}
                >
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-bold opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Shannon Entropy:</span>
                  <span className="font-extrabold text-amber-400">
                    {binaryStats.entropy} / 8.000
                  </span>
                  <span className="text-[10px] opacity-75">
                    {binaryStats.entropy > 7.5 ? "(High Randomness · Compressed)" : binaryStats.entropy > 4 ? "(Moderate Structure)" : "(Low Randomness · Sparse)"}
                  </span>
                </div>

                {/* Bit Balance / Density */}
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shrink-0"
                  style={{
                    borderColor: EDITOR_THEMES[editorTheme].border,
                    backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    color: EDITOR_THEMES[editorTheme].text,
                  }}
                >
                  <Binary className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-bold opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Bit Balance:</span>
                  <span className="font-extrabold text-emerald-400">
                    {binaryStats.bitDensity}% [1s] · {100 - binaryStats.bitDensity}% [0s]
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    (0s: {binaryStats.zeroCount.toLocaleString()} | 1s: {binaryStats.oneCount.toLocaleString()})
                  </span>
                </div>

                {/* Bit Depth / Grouping */}
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shrink-0"
                  style={{
                    borderColor: EDITOR_THEMES[editorTheme].border,
                    backgroundColor: EDITOR_THEMES[editorTheme].bg,
                    color: EDITOR_THEMES[editorTheme].text,
                  }}
                >
                  <Cpu className="h-3.5 w-3.5" style={{ color: EDITOR_THEMES[editorTheme].accent }} />
                  <span className="font-bold opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Grouping:</span>
                  <span className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].text }}>{binaryBitDepth}</span>
                </div>
              </div>
            </>
          ) : (
            /* Floating Controls when Top Heading is Hidden */
            <div
              className="absolute top-3 right-4 z-50 flex items-center gap-2 rounded-xl p-1.5 border shadow-2xl backdrop-blur-xl animate-in fade-in duration-150"
              style={{
                backgroundColor: `${EDITOR_THEMES[editorTheme].gutterBg}ee`,
                borderColor: EDITOR_THEMES[editorTheme].border,
              }}
            >
              <button
                type="button"
                onClick={() => setShowEditorTopHeading(true)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer hover:bg-white/10"
                style={{
                  borderColor: EDITOR_THEMES[editorTheme].border,
                  backgroundColor: EDITOR_THEMES[editorTheme].bg,
                  color: EDITOR_THEMES[editorTheme].text,
                }}
                title="Show top heading and toolbar"
              >
                <Eye className="h-3.5 w-3.5" style={{ color: EDITOR_THEMES[editorTheme].accent }} />
                <span>Show Heading</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCodeEditorOpen(false)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/15 px-3.5 py-1.5 text-xs font-extrabold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-xs"
                title="Close code editor (Esc)"
              >
                <X className="h-4 w-4" />
                <span>Close Editor</span>
                <kbd className="hidden sm:inline-block rounded px-1 py-0.2 text-[9px] font-mono border border-current opacity-70">
                  ESC
                </kbd>
              </button>
            </div>
          )}

          {/* 3. Search / Byte Hunter Bar (when toggled on) */}
          {isEditorSearching && (
            <div
              className="flex items-center justify-between gap-3 px-4 py-2 border-b shrink-0 animate-in slide-in-from-top-2 duration-150"
              style={{
                borderColor: EDITOR_THEMES[editorTheme].border,
                backgroundColor: EDITOR_THEMES[editorTheme].bg,
              }}
            >
              <div className="flex items-center gap-2 flex-1 max-w-2xl">
                <Search className="h-4 w-4 shrink-0" style={{ color: EDITOR_THEMES[editorTheme].accent }} />
                <input
                  type="text"
                  value={editorSearchQuery}
                  onChange={(e) => setEditorSearchQuery(e.target.value)}
                  placeholder="Search byte sequences (e.g. 1111, FF D8, 89 50, 00000000)..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono font-bold"
                  style={{ color: EDITOR_THEMES[editorTheme].text }}
                  autoFocus
                />
                {editorSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEditorSearchQuery("")}
                    className="p-1 hover:bg-white/10 rounded cursor-pointer opacity-70 hover:opacity-100"
                    style={{ color: EDITOR_THEMES[editorTheme].text }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Live Match Counter & Preset Search Chips */}
              <div className="flex items-center gap-2">
                {editorSearchQuery && (
                  <span
                    className="px-2.5 py-0.5 rounded-md border text-[11px] font-extrabold font-mono"
                    style={{
                      borderColor: EDITOR_THEMES[editorTheme].accent,
                      backgroundColor: `${EDITOR_THEMES[editorTheme].accent}20`,
                      color: EDITOR_THEMES[editorTheme].accent,
                    }}
                  >
                    {(() => {
                      const text = fullBinaryOutputText || binaryOutputText || "";
                      if (!editorSearchQuery.trim() || !text) return "0 matches";
                      let count = 0;
                      let pos = 0;
                      const q = editorSearchQuery.trim();
                      while ((pos = text.indexOf(q, pos)) !== -1) {
                        count++;
                        pos += q.length;
                        if (count > 9999) break;
                      }
                      return `${count.toLocaleString()}${count > 9999 ? "+" : ""} matches`;
                    })()}
                  </span>
                )}

                {/* Quick Presets */}
                <div className="hidden md:flex items-center gap-1 text-[10px]">
                  <span className="opacity-75 font-bold" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Presets:</span>
                  {["00000000", "11111111", "0100", "89 50", "FF D8"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditorSearchQuery(preset)}
                      className="px-1.5 py-0.5 rounded border hover:opacity-100 opacity-80 transition-all cursor-pointer font-mono font-semibold"
                      style={{
                        borderColor: EDITOR_THEMES[editorTheme].border,
                        backgroundColor: EDITOR_THEMES[editorTheme].gutterBg,
                        color: EDITOR_THEMES[editorTheme].text,
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Main Code Editor Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Gutter (Line Numbers / Offsets) */}
            <div
              className="w-14 sm:w-16 border-r shrink-0 select-none py-3 px-2 text-right overflow-hidden font-mono"
              style={{
                backgroundColor: EDITOR_THEMES[editorTheme].gutterBg,
                borderColor: EDITOR_THEMES[editorTheme].border,
                color: EDITOR_THEMES[editorTheme].gutterText,
                fontSize: `${editorFontSize}px`,
                lineHeight: "1.6",
              }}
            >
              {Array.from({
                length: Math.min(
                  500,
                  Math.max(
                    1,
                    (fullBinaryOutputText || binaryOutputText || "").split("\n").length
                  )
                ),
              }).map((_, i) => (
                <div key={i} className="opacity-70 font-semibold">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Main Code Textarea / Viewer */}
            <textarea
              readOnly
              value={fullBinaryOutputText || binaryOutputText || ""}
              style={{
                backgroundColor: EDITOR_THEMES[editorTheme].bg,
                color: EDITOR_THEMES[editorTheme].text,
                fontSize: `${editorFontSize}px`,
                lineHeight: "1.6",
                borderColor: "transparent",
              }}
              className={`flex-1 p-3 font-mono focus:outline-none resize-none overflow-auto select-text selection:bg-accent/30 ${editorLineWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                }`}
            />
          </div>

          {/* 5. Bottom Status Bar */}
          <div
            className="flex items-center justify-between gap-4 px-4 py-2 border-t text-[11px] font-mono shrink-0 select-none"
            style={{
              borderColor: EDITOR_THEMES[editorTheme].border,
              backgroundColor: EDITOR_THEMES[editorTheme].gutterBg,
              color: EDITOR_THEMES[editorTheme].text,
            }}
          >
            {/* Left Status Info */}
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: EDITOR_THEMES[editorTheme].text }}>
                <Terminal className="h-3.5 w-3.5" style={{ color: EDITOR_THEMES[editorTheme].accent }} />
                <span>Binary Code Lab</span>
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className="opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Mode:</span>
                <strong className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].accent }}>
                  {binaryOutputMode}
                </strong>
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className="opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Delimiter:</span>
                <strong className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].accent }}>
                  {binaryDelimiter}
                </strong>
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className="opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Depth:</span>
                <strong className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].accent }}>
                  {binaryBitDepth}
                </strong>
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className="opacity-80" style={{ color: EDITOR_THEMES[editorTheme].gutterText }}>Encoding:</span>
                <strong className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].accent }}>
                  UTF-8 / Raw Stream
                </strong>
              </span>
            </div>

            {/* Right Integrity Info & Status Bar Close */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Full Dataset Loaded</span>
              </span>
              <span className="opacity-40">·</span>
              <span className="font-extrabold" style={{ color: EDITOR_THEMES[editorTheme].text }}>
                {((fullBinaryOutputText || binaryOutputText || "").length).toLocaleString()} chars
              </span>
              <button
                type="button"
                onClick={() => setIsCodeEditorOpen(false)}
                className="ml-2 flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-extrabold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                title="Close Editor"
              >
                <X className="h-3 w-3" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 20. Full-Screen HTML & CSS Code Editor Modal */}
      {typeof document !== "undefined" && isFullScreenHtmlEditorOpen && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-md text-foreground animate-in fade-in duration-200">
          {/* Top Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card/70 shrink-0">
            {/* Left: Title & File Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-black shadow-xs">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-foreground">
                    Full-Screen HTML & CSS Editor
                  </h3>
                  <span className="rounded-full bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    {tempHtmlCode.split("\n").length} lines · {tempHtmlCode.length.toLocaleString()} chars
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                  {file ? file.name : "Custom HTML Template"} — Edit markup, styles & visual elements
                </p>
              </div>
            </div>

            {/* Middle: View Mode Tabs & Template Presets */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-muted p-1 border border-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHtmlEditorViewMode("code")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${htmlEditorViewMode === "code" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Code Only
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlEditorViewMode("split")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${htmlEditorViewMode === "split" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Split Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlEditorViewMode("preview")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${htmlEditorViewMode === "preview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Preview Only
                </button>
              </div>

              {/* Sample Templates Menu */}
              <div className="hidden lg:flex items-center gap-1 border-l border-border pl-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Templates:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTempHtmlCode(SAMPLE_VISUAL_TEST);
                    toast.success("Loaded Visual QA Test template");
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  QA Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempHtmlCode(SAMPLE_OG_CARD);
                    toast.success("Loaded OG Card template");
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  OG Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempHtmlCode(SAMPLE_BADGE);
                    toast.success("Loaded Product Badge template");
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  Badge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempHtmlCode(SAMPLE_INVOICE);
                    toast.success("Loaded Invoice template");
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempHtmlCode(SAMPLE_CODE_BOX);
                    toast.success("Loaded Code Card template");
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  Code Card
                </button>
              </div>
            </div>

            {/* Right: Actions (Copy, Beautify, Cancel, Save) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tempHtmlCode);
                  toast.success("Copied HTML code to clipboard!");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted transition-all cursor-pointer shadow-xs"
                title="Copy HTML to clipboard"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Copy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    let formatted = "";
                    let indentLevel = 0;
                    const tokens = tempHtmlCode.replace(/>\s*</g, "><").split(/(<[^>]+>)/g).filter(Boolean);
                    tokens.forEach((token: string) => {
                      if (token.startsWith("</")) {
                        indentLevel = Math.max(0, indentLevel - 1);
                        formatted += "  ".repeat(indentLevel) + token + "\n";
                      } else if (token.startsWith("<") && !token.endsWith("/>") && !/^(<(?:img|input|br|hr|meta|link)[^>]*>)/i.test(token)) {
                        formatted += "  ".repeat(indentLevel) + token + "\n";
                        indentLevel++;
                      } else {
                        const trimmed = token.trim();
                        if (trimmed) {
                          formatted += "  ".repeat(indentLevel) + trimmed + "\n";
                        }
                      }
                    });
                    setTempHtmlCode(formatted.trim());
                    toast.success("Beautified HTML markup!");
                  } catch {
                    toast.error("Could not auto-format HTML.");
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted transition-all cursor-pointer shadow-xs"
                title="Format & Beautify HTML tags"
              >
                <Wand2 className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Format</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenHtmlEditorOpen(false)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted transition-all cursor-pointer shadow-xs"
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHtmlCodeText(tempHtmlCode);
                  setIsFullScreenHtmlEditorOpen(false);
                  toast.success("Applied HTML changes! Canvas updated.");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-4 py-1.5 text-xs font-black shadow-md hover:opacity-90 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save & Apply</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenHtmlEditorOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Work Area */}
          <div className="flex-1 overflow-hidden grid" style={{
            gridTemplateColumns:
              htmlEditorViewMode === "code"
                ? "1fr"
                : htmlEditorViewMode === "preview"
                  ? "1fr"
                  : "1fr 1fr",
          }}>
            {/* Code Editor Pane */}
            {htmlEditorViewMode !== "preview" && (
              <div className="flex flex-col h-full border-r border-border bg-neutral-950 text-neutral-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-mono text-neutral-400 select-none">
                  <span className="flex items-center gap-1.5 font-bold text-neutral-200">
                    <Code2 className="h-3.5 w-3.5 text-accent" />
                    <span>HTML & CSS Code Source</span>
                  </span>
                  <span>Press Tab to indent · Ctrl+Enter to Save</span>
                </div>
                <div className="flex-1 relative flex overflow-hidden">
                  {/* Line Numbers Gutter */}
                  <div className="w-12 py-3 pr-2 text-right font-mono text-xs text-neutral-600 bg-neutral-900/40 select-none border-r border-neutral-800/60 overflow-hidden shrink-0">
                    {tempHtmlCode.split("\n").map((_: string, i: number) => (
                      <div key={i} className="leading-relaxed">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* Code Textarea */}
                  <textarea
                    value={tempHtmlCode}
                    onChange={(e) => setTempHtmlCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const val = e.currentTarget.value;
                        const next = val.substring(0, start) + "  " + val.substring(end);
                        setTempHtmlCode(next);
                        setTimeout(() => {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                        }, 0);
                      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        setHtmlCodeText(tempHtmlCode);
                        setIsFullScreenHtmlEditorOpen(false);
                        toast.success("Applied HTML changes! Canvas updated.");
                      }
                    }}
                    placeholder="Write or paste your HTML and CSS code here..."
                    spellCheck={false}
                    className="flex-1 p-3 bg-transparent text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-auto select-text selection:bg-accent/40 whitespace-pre"
                  />
                </div>
              </div>
            )}

            {/* Live Preview Pane */}
            {htmlEditorViewMode !== "code" && (
              <div className="flex flex-col h-full bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/60 text-[11px] font-semibold text-muted-foreground select-none">
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <Eye className="h-3.5 w-3.5 text-accent" />
                    <span>Real-Time Live Visual Render</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    Sandbox iframe · Isolated View
                  </span>
                </div>
                <div className="flex-1 p-4 sm:p-6 overflow-auto flex items-center justify-center bg-neutral-900/10 dark:bg-neutral-950/40">
                  <div
                    className="rounded-2xl border-2 border-border bg-white shadow-2xl overflow-hidden max-w-full max-h-full transition-all"
                    style={{
                      width: `${Math.min(htmlRenderWidth, 1200)}px`,
                      height: `${Math.min(htmlRenderHeight, 800)}px`,
                      aspectRatio: `${htmlRenderWidth} / ${htmlRenderHeight}`,
                    }}
                  >
                    <iframe
                      title="HTML Live Preview"
                      srcDoc={tempHtmlCode}
                      sandbox="allow-scripts"
                      className="w-full h-full border-0 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50 text-[11px] font-mono text-muted-foreground shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground">UTF-8 HTML5 Document</span>
              <span>·</span>
              <span>{tempHtmlCode.split("\n").length} lines</span>
              <span>·</span>
              <span>{tempHtmlCode.length.toLocaleString()} characters</span>
              <span>·</span>
              <span>Output: {htmlRenderWidth} × {htmlRenderHeight} px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-75">Click 'Save & Apply' or press Ctrl+Enter to update canvas</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
