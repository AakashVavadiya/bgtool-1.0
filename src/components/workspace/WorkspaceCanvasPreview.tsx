// Interactive canvas preview stage with crop handles, color loupe, and batch switcher.
import { Download, Check, Loader2, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Wand2, Image as ImageIcon, Eye, EyeOff, Maximize2, Move, Sparkle, Plus, Trash2, Layers, Upload, X } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";



export function WorkspaceCanvasPreview(props: any) {
  const {
    tool,
    file,
    setFile,
    imageSrc,
    setImageSrc,
    processedSrc,
    processing,
    hasProcessed,
    origSize,
    setOrigSize,
    newSize,
    dimensions,
    setDimensions,
    isEditingSettings,
    setIsEditingSettings,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    estimatedResizeBytes,
    cropBox,
    rotation,
    flipH,
    flipV,
    rotateBgMode,
    rotateBgColor,
    rotateBgGradient,
    rotateBatch,
    setRotateBatch,
    wmMode,
    wmText,
    wmLogoSrc,
    wmLogoScale,
    wmPosition,
    wmCustomCoord,
    wmMargin,
    wmOpacity,
    wmColor,
    wmFontSize,
    wmFontFamily,
    wmBold,
    wmItalic,
    wmRotation,
    wmStroke,
    wmBgBadge,
    isDraggingWm,
    faceRegions,
    faceBlurType,
    faceBlurStrength,
    faceShape,
    isDetectingFaces,
    activeFaceId,
    setActiveFaceId,
    showFaceOutlines,
    setShowFaceOutlines,
    hoveredFaceId,
    setHoveredFaceId,
    topText,
    bottomText,
    memeFontSize,
    memeFontFamily,
    memeTextColor,
    memeStrokeColor,
    memeStrokeWidth,
    memeAllCaps,
    memeTextShadow,
    memeTextAlign,
    memeTopPosPercent,
    memeBottomPosPercent,
    squareBgMode,
    squareBgColor,
    squareGradient,
    squareScale,
    squareBlurAmount,
    squareCornerRadius,
    squareShadow,
    pickedHex,
    loupeCanvasRef,
    loupeRef,
    loupeTickRef,
    loupeHexRef,
    loupeDotRef,
    hoverSwatchRef,
    hoverSwatchDotRef,
    hoverSwatchHexRef,
    focusedDim,
    setIsFullscreenPreview,
    imgRef,
    previewContainerRef,
    settingsHeight,
    renderedImgSize,
    setRenderedImgSize,
    fileInputRef,
    handleImageMouseMove,
    handleImageMouseEnter,
    handleImageMouseLeave,
    handleImageClick,
    extractMostCommonColors,
    handleWatermarkOverlayClick,
    handleWatermarkMouseDown,
    handleWatermarkOverlayMouseMove,
    handleWatermarkOverlayMouseUp,
    handleFaceMouseDown,
    handleFaceTouchStart,
    handleDeleteFace,
    handleMemeTextMouseDown,
    handleCropMouseDown,
    processImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDownloadSingleRotatedItem,
    formatBytes,
    cropPixelWidth,
    cropPixelHeight
  } = props;


  return (
          <div
            className={`min-w-0 relative flex flex-col w-full overflow-hidden rounded-3xl border-2 border-border bg-card/70 shadow-xl transition-[height] duration-200 ${tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image" ? "lg:sticky lg:top-20" : ""
              }`}
            style={{
              height:
                tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image"
                  ? "min(560px, calc(100vh - 150px))"
                  : settingsHeight
                    ? `${Math.max(620, settingsHeight)}px`
                    : "620px",
              minHeight: tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image" ? "420px" : "540px",
            }}
          >
            {/* Header info bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="h-4 w-4 text-foreground" />
                <span className="truncate max-w-[200px] text-foreground font-extrabold">
                  {file?.name || "Uploaded Image"}
                </span>
                <span>•</span>
                <span>{dimensions.width}×{dimensions.height}px</span>
                {(tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image") && (
                  <span className="rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                    Fit View
                  </span>
                )}
                {tool.slug === "square-your-image" && (
                  <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-[10px] font-extrabold text-violet-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                    1:1 Square ({Math.max(dimensions.width || 0, dimensions.height || 0)}×{Math.max(dimensions.width || 0, dimensions.height || 0)})
                  </span>
                )}
                {hasProcessed && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-500 uppercase">
                    Processed Output
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {tool.slug === "square-your-image" && imageSrc && (
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={processing}
                    className="rounded-full bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3.5 py-1 text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    title="Export 1:1 square output and go to download screen"
                  >
                    <Download className="h-3.5 w-3.5 text-accent" />
                    <span>Download 1:1 Square</span>
                  </button>
                )}
                {hasProcessed && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Return to processed result view"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>View Result</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(true)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="Enlarge preview"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-accent" />
                  <span>Enlarge</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-sm cursor-pointer"
                >
                  {tool.slug === "watermark-image" ? "+ Add Images" : "Change File"}
                </button>
              </div>
            </div>

            {/* Image Preview Container */}
            <div
              ref={previewContainerRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onContextMenu={(e: any) => e.preventDefault()}
              className={`relative flex-1 min-h-0 flex overflow-hidden select-none ${tool.slug === "rotate-image" && rotateBatch.length > 1 && (!hasProcessed || isEditingSettings)
                  ? "flex-col items-stretch justify-start p-2 sm:p-4 bg-background/20"
                  : tool.slug === "image-to-text-ocr" || tool.slug === "image-to-binary"
                    ? "items-center justify-center p-4 md:p-6 min-h-[560px] bg-background/20"
                    : tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image"
                      ? "items-center justify-center p-3 sm:p-5 bg-secondary/15"
                      : tool.slug === "resize-image"
                        ? "items-center justify-center pt-10 pb-8 pl-6 pr-14 bg-background/20"
                        : "items-center justify-center p-4 sm:p-6 md:p-8 bg-background/20"
                }`}
            >
              {tool.slug === "rotate-image" && rotateBatch.length > 1 && (!hasProcessed || isEditingSettings) ? (
                /* MULTI-IMAGE BATCH ROTATION PREVIEW WORKSPACE */
                <div className="flex flex-col h-full w-full overflow-hidden gap-3">
                  {/* Top Batch Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-border/80 bg-card/95 backdrop-blur-md p-3 px-4 shadow-sm shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent font-bold">
                        <RotateCw className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-foreground flex items-center gap-2">
                          <span>Batch Preview Grid</span>
                          <span className="rounded-md bg-accent/20 text-accent text-[10px] font-mono font-black px-2 py-0.5">
                            {rotateBatch.length} Images
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                          Rotate all images together or use individual card controls
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-3.5 py-1.5 text-xs font-black shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer ml-auto"
                      title="Add more images to this batch"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Add Images</span>
                    </button>
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                      {rotateBatch.map((item: any, idx: any) => (
                        <div
                          key={item.id}
                          className="group relative flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-3 shadow-md hover:border-foreground/40 hover:shadow-lg transition-all duration-200"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-border/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-mono font-black text-foreground">
                                {idx + 1}
                              </span>
                              <span className="truncate text-xs font-bold text-foreground" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {Math.abs(item.rotation % 180) === 90
                                  ? `${item.height}×${item.width}`
                                  : `${item.width}×${item.height}`}
                              </span>
                              {rotateBatch.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRotateBatch((prev: any) => {
                                      const updated = prev.filter((it: any) => it.id !== item.id);
                                      if (updated.length > 0 && updated[0]) {
                                        setFile(updated[0].file);
                                        setImageSrc(updated[0].dataUrl);
                                        setOrigSize(updated[0].size);
                                        setDimensions({ width: updated[0].width, height: updated[0].height });
                                        setTargetWidth(updated[0].width);
                                        setTargetHeight(updated[0].height);
                                      }
                                      return updated;
                                    });
                                  }}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Remove from batch"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Thumbnail / Live Rotated Preview */}
                          <div
                            className="relative h-44 w-full rounded-xl overflow-hidden flex items-center justify-center border border-border/50 select-none shadow-inner"
                            style={{
                              backgroundColor: rotateBgMode === "color" ? rotateBgColor : undefined,
                              background: rotateBgMode === "gradient" ? rotateBgGradient : undefined,
                            }}
                          >
                            {rotateBgMode === "transparent" && (
                              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(45deg,#888_25%,transparent_25%),linear-gradient(-45deg,#888_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#888_75%),linear-gradient(-45deg,transparent_75%,#888_75%)] [background-size:12px_12px] [background-position:0_0,0_6px,6px_-6px,-6px_0] pointer-events-none" />
                            )}
                            {rotateBgMode === "blur" && (
                              <img
                                src={item.dataUrl}
                                alt="Blurred backdrop"
                                className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-125 opacity-70 pointer-events-none"
                              />
                            )}

                            <img
                              src={item.dataUrl}
                              alt={item.name}
                              draggable={false}
                              onDragStart={(e: any) => e.preventDefault()}
                              className="max-h-full max-w-full object-contain drop-shadow-md select-none transition-transform duration-300"
                              style={{
                                transform: `rotate(${item.rotation}deg) scale(${item.flipH ? -1 : 1}, ${item.flipV ? -1 : 1})`,
                                transformOrigin: "center center",
                              }}
                            />

                            {/* Angle & Flip Badge */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-black text-white shadow-md border border-white/10 pointer-events-none">
                              <span>{((item.rotation % 360) + 360) % 360}°</span>
                              {(item.flipH || item.flipV) && (
                                <span className="text-emerald-400 font-bold">
                                  {item.flipH && item.flipV ? "H+V" : item.flipH ? "H" : "V"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Controls */}
                          <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRotateBatch((prev: any) =>
                                    prev.map((it: any) => (it.id === item.id ? { ...it, rotation: it.rotation - 90 } : it))
                                  );
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-secondary hover:border-foreground active:scale-90 transition-all cursor-pointer shadow-2xs"
                                title="Rotate -90° (Left)"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRotateBatch((prev: any) =>
                                    prev.map((it: any) => (it.id === item.id ? { ...it, rotation: it.rotation + 90 } : it))
                                  );
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-secondary hover:border-foreground active:scale-90 transition-all cursor-pointer shadow-2xs"
                                title="Rotate +90° (Right)"
                              >
                                <RotateCw className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRotateBatch((prev: any) =>
                                    prev.map((it: any) => (it.id === item.id ? { ...it, flipH: !it.flipH } : it))
                                  );
                                }}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-90 ${item.flipH
                                    ? "border-accent bg-accent/20 text-accent"
                                    : "border-border bg-background text-foreground hover:bg-secondary hover:border-foreground"
                                  }`}
                                title="Flip Horizontally"
                              >
                                <FlipHorizontal className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRotateBatch((prev: any) =>
                                    prev.map((it: any) => (it.id === item.id ? { ...it, flipV: !it.flipV } : it))
                                  );
                                }}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-90 ${item.flipV
                                    ? "border-accent bg-accent/20 text-accent"
                                    : "border-border bg-background text-foreground hover:bg-secondary hover:border-foreground"
                                  }`}
                                title="Flip Vertically"
                              >
                                <FlipVertical className="h-3 w-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingleRotatedItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background hover:bg-secondary hover:border-foreground px-2 py-1 text-[11px] font-bold text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Download this rotated image"
                            >
                              <Download className="h-3 w-3 text-accent" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Image Frame Wrapper */
                <div
                  onContextMenu={(e: any) => e.preventDefault()}
                  className={`relative max-w-full ${tool.slug === "resize-image"
                      ? "inline-block leading-none"
                      : "inline-flex items-center justify-center max-h-full"
                    }`}
                >
                  {/* TOP DIMENSION LINE: Width (Shown ONLY on Resize Tool) */}
                  {tool.slug === "resize-image" && (
                    <div
                      className={`absolute -top-7 left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-300 z-10 ${focusedDim === "width"
                          ? "text-accent scale-105 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                          : "text-accent"
                        }`}
                    >
                      {/* Left tick | */}
                      <div className="h-3.5 w-[2px] bg-accent rounded-full" />
                      {/* Left dashed line */}
                      <div className="flex-1 border-t-2 border-dashed border-accent/80 h-0" />
                      {/* Center Small Box */}
                      <div className="mx-2 flex items-center gap-1 rounded-md border-2 border-accent/60 bg-card px-2.5 py-0.5 text-xs font-black font-mono tracking-tight text-accent shadow-sm">
                        <span>Width :</span>
                        <AnimatedCounter
                          value={targetWidth > 0 ? targetWidth : dimensions.width}
                          suffix="px"
                        />
                      </div>
                      {/* Right dashed line */}
                      <div className="flex-1 border-t-2 border-dashed border-accent/80 h-0" />
                      {/* Right tick | */}
                      <div className="h-3.5 w-[2px] bg-accent rounded-full" />
                    </div>
                  )}

                  {/* RIGHT DIMENSION LINE: Height (Shown ONLY on Resize Tool) */}
                  {tool.slug === "resize-image" && (
                    <div
                      className={`absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 z-10 ${focusedDim === "height"
                          ? "text-accent scale-105 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                          : "text-accent"
                        }`}
                      style={{ left: "calc(100% + 8px)", top: 0, bottom: 0, height: "100%" }}
                    >
                      {/* Top tick ─ */}
                      <div className="w-3 h-[1.5px] bg-accent rounded-full" />
                      {/* Top dashed line */}
                      <div className="flex-1 border-r-2 border-dashed border-accent/80 w-0" />
                      {/* Center Small Box (Rotated cleanly, no digit overlap) */}
                      <div className="my-2.5 -rotate-90 whitespace-nowrap rounded-md border-2 border-accent/60 bg-card px-2 py-0.5 text-[11px] font-black font-mono tracking-tight text-accent shadow-sm flex items-center gap-1">
                        <span>Height :</span>
                        <AnimatedCounter
                          value={targetHeight > 0 ? targetHeight : dimensions.height}
                          suffix="px"
                        />
                      </div>
                      {/* Bottom dashed line */}
                      <div className="flex-1 border-r-2 border-dashed border-accent/80 w-0" />
                      {/* Bottom tick ─ */}
                      <div className="w-3 h-[1.5px] bg-accent rounded-full" />
                    </div>
                  )}

                  {/* BOTTOM-LEFT FLOATING OUTPUT SIZE BADGE (Shown on Resize Tool) */}
                  {tool.slug === "resize-image" && (
                    <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10 flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md">
                      <span className="text-[10px] uppercase font-extrabold text-white/70 tracking-wider">Output Size:</span>
                      <span className="font-mono font-black text-amber-400">
                        {(targetWidth > 0 ? targetWidth : dimensions.width)} × {(targetHeight > 0 ? targetHeight : dimensions.height)} px
                      </span>
                      {origSize > 0 && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="font-mono font-extrabold text-emerald-400">
                            {hasProcessed && newSize > 0 ? formatBytes(newSize) : `~${formatBytes(estimatedResizeBytes)}`}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Rotate Image Live Background Fill Backdrop */}
                  {tool.slug === "rotate-image" && imageSrc && (!hasProcessed || isEditingSettings) && (
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none -z-10 transition-all duration-300 shadow-xl"
                      style={{
                        backgroundColor: rotateBgMode === "color" ? rotateBgColor : undefined,
                        background: rotateBgMode === "gradient" ? rotateBgGradient : undefined,
                      }}
                    >
                      {rotateBgMode === "blur" && imageSrc && (
                        <img
                          src={imageSrc}
                          alt="Blurred rotation backdrop"
                          draggable={false}
                          onDragStart={(e: any) => e.preventDefault()}
                          onContextMenu={(e: any) => e.preventDefault()}
                          className="w-full h-full object-cover filter blur-2xl scale-125 opacity-80 select-none workspace-protected-image pointer-events-none"
                        />
                      )}
                      {rotateBgMode === "transparent" && (
                        <div className="w-full h-full opacity-35 [background-image:linear-gradient(45deg,#888_25%,transparent_25%),linear-gradient(-45deg,#888_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#888_75%),linear-gradient(-45deg,transparent_75%,#888_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0]" />
                      )}
                    </div>
                  )}

                  {/* 4a. Square Your Image Live 1:1 Interactive Preview Canvas */}
                  {tool.slug === "square-your-image" && imageSrc && (!hasProcessed || isEditingSettings) ? (
                    <div
                      onContextMenu={(e: any) => e.preventDefault()}
                      className="relative flex flex-col items-center justify-center w-full h-full p-2 sm:p-4"
                    >
                      {/* 1:1 Live Square Frame */}
                      <div
                        className="relative aspect-square w-full max-w-[min(500px,calc(100vh-290px),88vw)] flex items-center justify-center overflow-hidden rounded-2xl border-2 border-border/80 shadow-2xl transition-all duration-300 select-none group"
                        style={{
                          backgroundColor: squareBgMode === "color" ? squareBgColor : squareBgMode === "transparent" ? "transparent" : undefined,
                          background: squareBgMode === "gradient" ? squareGradient : undefined,
                        }}
                      >
                        {/* Transparent Checkerboard Grid */}
                        {squareBgMode === "transparent" && (
                          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(45deg,#888_25%,transparent_25%),linear-gradient(-45deg,#888_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#888_75%),linear-gradient(-45deg,transparent_75%,#888_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0] pointer-events-none" />
                        )}

                        {/* Blurred Edges Backdrop */}
                        {squareBgMode === "blur" && (
                          <img
                            src={imageSrc}
                            alt="Square blurred backdrop"
                            draggable={false}
                            onDragStart={(e: any) => e.preventDefault()}
                            onContextMenu={(e: any) => e.preventDefault()}
                            className="absolute inset-0 w-full h-full object-cover scale-125 pointer-events-none select-none transition-all duration-200 workspace-protected-image"
                            style={{
                              filter: `blur(${squareBlurAmount}px)`,
                            }}
                          />
                        )}

                        {/* Full Bleed Mode */}
                        {squareBgMode === "fit" ? (
                          <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Full bleed 1:1 crop"
                            draggable={false}
                            onDragStart={(e: any) => e.preventDefault()}
                            onContextMenu={(e: any) => e.preventDefault()}
                            onLoad={() => {
                              if (imgRef.current) {
                                const rect = imgRef.current.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                  setRenderedImgSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
                                }
                              }
                            }}
                            className="w-full h-full object-cover select-none transition-all duration-200 workspace-protected-image"
                            style={{
                              transform: `scale(${squareScale / 100})`,
                              borderRadius: squareCornerRadius === 9999 ? "9999px" : `${squareCornerRadius}px`,
                            }}
                          />
                        ) : (
                          /* Scaled Centered Foreground Photo */
                          <div
                            className="relative z-10 flex items-center justify-center transition-all duration-200"
                            style={{
                              width: `${squareScale}%`,
                              height: `${squareScale}%`,
                            }}
                          >
                            <img
                              ref={imgRef}
                              src={imageSrc}
                              alt="Square foreground"
                              draggable={false}
                              onDragStart={(e: any) => e.preventDefault()}
                              onContextMenu={(e: any) => e.preventDefault()}
                              onLoad={() => {
                                if (imgRef.current) {
                                  const rect = imgRef.current.getBoundingClientRect();
                                  if (rect.width > 0 && rect.height > 0) {
                                    setRenderedImgSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
                                  }
                                }
                              }}
                              className="max-w-full max-h-full object-contain transition-all duration-200 block select-none workspace-protected-image"
                              style={{
                                borderRadius: squareCornerRadius === 9999 ? "9999px" : `${squareCornerRadius}px`,
                                boxShadow:
                                  squareShadow === "soft"
                                    ? "0 14px 30px -4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)"
                                    : squareShadow === "float"
                                      ? "0 24px 50px -8px rgba(0, 0, 0, 0.65), 0 10px 20px rgba(0, 0, 0, 0.35)"
                                      : squareShadow === "card"
                                        ? "0 0 0 1px rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.3)"
                                        : "none",
                              }}
                            />
                          </div>
                        )}

                        {/* Live 1:1 Badge in top-right */}
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold tracking-tight shadow-md border border-white/10 pointer-events-none">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>1:1 Live Square</span>
                          <span className="opacity-70 text-[10px] font-mono">
                            ({Math.max(dimensions.width || 0, dimensions.height || 0)}×{Math.max(dimensions.width || 0, dimensions.height || 0)})
                          </span>
                        </div>

                        {/* Mode indicator pill in bottom-left */}
                        <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono tracking-tight border border-white/10 pointer-events-none flex items-center gap-1.5">
                          <span className="opacity-60">Mode:</span>
                          <span className="font-bold text-white capitalize">
                            {squareBgMode === "blur"
                              ? `Blur (${squareBlurAmount}px)`
                              : squareBgMode === "color"
                                ? squareBgColor
                                : squareBgMode === "gradient"
                                  ? "Gradient"
                                  : squareBgMode === "transparent"
                                    ? "Transparent"
                                    : "Full Bleed Fit"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      ref={imgRef}
                      src={(tool.slug === "watermark-image" && (!hasProcessed || isEditingSettings)) || (tool.slug === "rotate-image" && (!hasProcessed || isEditingSettings)) || (tool.slug === "blur-face" && (!hasProcessed || isEditingSettings)) || (tool.slug === "meme-generator" && (!hasProcessed || isEditingSettings)) ? (imageSrc || undefined) : (processedSrc || imageSrc || undefined)}
                      alt="Workspace preview"
                      draggable={false}
                      onDragStart={(e: any) => e.preventDefault()}
                      onContextMenu={(e: any) => e.preventDefault()}
                      onLoad={() => {
                        if (imgRef.current) {
                          const rect = imgRef.current.getBoundingClientRect();
                          if (rect.width > 0 && rect.height > 0) {
                            setRenderedImgSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
                          }
                        }
                        if (tool.slug === "color-picker-from-image" && imageSrc) {
                          extractMostCommonColors(imageSrc);
                        }
                      }}
                      onMouseMove={handleImageMouseMove}
                      onMouseEnter={handleImageMouseEnter}
                      onMouseLeave={handleImageMouseLeave}
                      onClick={handleImageClick}
                      className="max-h-full max-w-full w-auto h-auto object-contain pointer-events-auto shadow-md rounded-md border border-border/40 block select-none workspace-protected-image"
                      style={{
                        maxHeight: tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image"
                          ? "min(480px, calc(100vh - 240px))"
                          : tool.slug === "resize-image"
                            ? "min(500px, calc(100vh - 290px))"
                            : settingsHeight
                              ? `${Math.max(tool.slug === "image-to-text-ocr" || tool.slug === "image-to-binary" ? 600 : 540, settingsHeight - 90)}px`
                              : "580px",
                        maxWidth: "100%",
                        cursor: tool.slug === "color-picker-from-image" ? "crosshair" : "default",
                        transform: tool.slug === "rotate-image"
                          ? `scale(${(() => {
                            const rad = (rotation * Math.PI) / 180;
                            const s = Math.abs(Math.sin(rad));
                            const c = Math.abs(Math.cos(rad));
                            const curW = renderedImgSize?.width ?? dimensions.width ?? 600;
                            const curH = renderedImgSize?.height ?? dimensions.height ?? 400;
                            const bW = curW * c + curH * s;
                            const bH = curW * s + curH * c;
                            return bW > 0 && bH > 0 ? Math.min(1, curW / bW, curH / bH) : 1;
                          })()}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                          : undefined,
                        transformOrigin: "center center",
                        transition: tool.slug === "rotate-image"
                          ? "transform 0.45s cubic-bezier(0.34, 1.45, 0.64, 1)"
                          : undefined,
                      }}
                    />
                  )}

                  {/* 4b. Color Picker Live Magnifying Zoom Loupe (Follows Mouse Cursor via Direct RAF DOM - 120fps hardware smooth) */}
                  {tool.slug === "color-picker-from-image" && (
                    <div
                      ref={loupeRef}
                      className="pointer-events-none absolute z-50 flex flex-col items-center select-none"
                      style={{
                        display: "none",
                        willChange: "left, top, transform",
                      }}
                    >
                      {/* Circular Magnifier Glass */}
                      <div className="relative h-[134px] w-[134px] rounded-full p-[3px] bg-gradient-to-b from-white via-white/80 to-neutral-500 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_0_1px_rgba(0,0,0,0.4)]">
                        <div className="relative h-full w-full rounded-full overflow-hidden bg-neutral-950 ring-1 ring-black/80 flex items-center justify-center">
                          <canvas
                            ref={loupeCanvasRef}
                            width={126}
                            height={126}
                            className="h-[126px] w-[126px] block [image-rendering:pixelated]"
                          />
                          {/* Center Target Reticle Box */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="h-[16px] w-[16px] border-2 border-white shadow-[0_0_4px_black,inset_0_0_2px_black] rounded-[2px]" />
                          </div>
                        </div>
                        {/* Directional Tick pointing directly to cursor */}
                        <div
                          ref={loupeTickRef}
                          className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent -bottom-2 border-t-[9px] border-t-neutral-500"
                        />
                      </div>

                      {/* Floating Hover Color & Copy Badge */}
                      <div className="mt-2.5 flex items-center gap-2 rounded-full bg-neutral-950/95 px-3 py-1.5 text-xs font-mono font-black text-white shadow-2xl border border-white/20 backdrop-blur-md">
                        <span
                          ref={loupeDotRef}
                          className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-xs shrink-0"
                          style={{ backgroundColor: pickedHex }}
                        />
                        <span ref={loupeHexRef} className="tracking-wide text-xs">
                          {pickedHex}
                        </span>
                        <span className="text-[10px] font-sans font-bold text-neutral-400 border-l border-white/20 pl-1.5 uppercase">
                          Click to Copy
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 5. Live Rotate Real-time Animated Status Badge */}
                  {tool.slug === "rotate-image" && imageSrc && (
                    <div className="absolute top-2 left-2 z-30 pointer-events-none rounded-full bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent">
                        <RotateCw className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono font-black text-accent">
                        {((rotation % 360) + 360) % 360}°
                      </span>
                      {(flipH || flipV) && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-[11px] font-semibold text-emerald-400">
                            {flipH && flipV ? "Flipped H + V" : flipH ? "Flipped H" : "Flipped V"}
                          </span>
                        </>
                      )}
                      <span className="text-white/30">•</span>
                      <span className="text-[11px] font-mono text-white/70">
                        {Math.abs(rotation % 180) === 90 ? `${dimensions.height}×${dimensions.width}px` : `${dimensions.width}×${dimensions.height}px`}
                      </span>
                    </div>
                  )}

                  {/* 6. Live Watermark Interactive Real-time Preview Overlay */}
                  {tool.slug === "watermark-image" && imageSrc && (!hasProcessed || isEditingSettings) && (
                    <div
                      onClick={handleWatermarkOverlayClick}
                      onMouseMove={handleWatermarkOverlayMouseMove}
                      onMouseUp={handleWatermarkOverlayMouseUp}
                      onMouseLeave={handleWatermarkOverlayMouseUp}
                      className={`absolute inset-0 z-20 select-none overflow-hidden ${wmPosition === "tile" ? "cursor-default" : "cursor-crosshair"
                        }`}
                      title={wmPosition === "tile" ? "Tiled Watermark Pattern" : "Click or drag to position watermark"}
                    >
                      {/* Position hint pill */}
                      <div className="absolute top-2 left-2 z-30 pointer-events-none rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-md flex items-center gap-1.5 opacity-85 hover:opacity-100 transition-opacity">
                        <Move className="h-3 w-3 text-accent" />
                        <span>
                          {wmPosition === "tile"
                            ? "Tiled Pattern"
                            : wmPosition === "custom"
                              ? `Custom: ${wmCustomCoord.xPercent}%, ${wmCustomCoord.yPercent}%`
                              : `Position: ${wmPosition.replace("_", " ").toUpperCase()}`}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-accent font-extrabold">{Math.round(wmOpacity * 100)}% Opacity</span>
                      </div>

                      {/* Watermark Rendering */}
                      {wmPosition === "tile" ? (
                        <div
                          className="w-full h-full flex flex-wrap items-center justify-around content-around pointer-events-none"
                          style={{
                            opacity: Math.max(0.05, Math.min(1, wmOpacity)),
                            transform: `rotate(${wmRotation || -30}deg) scale(1.3)`,
                          }}
                        >
                          {Array.from({ length: 24 }).map((_: any, idx: any) => (
                            <div
                              key={idx}
                              className="p-4 whitespace-nowrap"
                              style={{
                                fontSize: `${Math.max(10, Math.round(wmFontSize * (((renderedImgSize?.width || dimensions.width || 600)) / 1000)))}px`,
                                fontFamily: wmFontFamily,
                                fontWeight: wmBold ? "bold" : "normal",
                                fontStyle: wmItalic ? "italic" : "normal",
                                color: wmColor,
                                textShadow:
                                  wmStroke === "dark"
                                    ? "0 0 2px #000, 0 0 4px #000, 0 2px 4px rgba(0,0,0,0.8)"
                                    : wmStroke === "light"
                                      ? "0 0 2px #fff, 0 0 4px #fff, 0 2px 4px rgba(255,255,255,0.8)"
                                      : "0 1px 3px rgba(0,0,0,0.6)",
                                WebkitTextStroke:
                                  wmStroke === "dark"
                                    ? "0.5px rgba(0,0,0,0.9)"
                                    : wmStroke === "light"
                                      ? "0.5px rgba(255,255,255,0.9)"
                                      : undefined,
                              }}
                            >
                              {wmMode === "logo" && wmLogoSrc ? (
                                <img
                                  src={wmLogoSrc}
                                  alt="Watermark logo"
                                  className="object-contain"
                                  style={{
                                    width: `${Math.max(20, Math.round(((renderedImgSize?.width || dimensions.width || 600)) * 0.12))}px`,
                                  }}
                                />
                              ) : (
                                wmText || "Watermark"
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        (() => {
                          const curW = renderedImgSize?.width || dimensions.width || 600;
                          const previewScale = curW / 1000;
                          const dispFontSize = Math.max(10, Math.round(wmFontSize * previewScale));
                          const logoDispW = Math.max(20, Math.round(curW * (wmLogoScale / 100)));

                          let posStyle: React.CSSProperties = {
                            position: "absolute",
                            opacity: Math.max(0.05, Math.min(1, wmOpacity)),
                            transition: isDraggingWm ? "none" : "all 0.15s ease-out",
                          };

                          if (wmPosition === "top_left") {
                            posStyle = { ...posStyle, left: `${wmMargin}%`, top: `${wmMargin}%`, transform: `rotate(${wmRotation}deg)`, transformOrigin: "top left" };
                          } else if (wmPosition === "top_center") {
                            posStyle = { ...posStyle, left: "50%", top: `${wmMargin}%`, transform: `translate(-50%, 0) rotate(${wmRotation}deg)` };
                          } else if (wmPosition === "top_right") {
                            posStyle = { ...posStyle, right: `${wmMargin}%`, top: `${wmMargin}%`, transform: `rotate(${wmRotation}deg)`, transformOrigin: "top right" };
                          } else if (wmPosition === "middle_left") {
                            posStyle = { ...posStyle, left: `${wmMargin}%`, top: "50%", transform: `translate(0, -50%) rotate(${wmRotation}deg)` };
                          } else if (wmPosition === "center") {
                            posStyle = { ...posStyle, left: "50%", top: "50%", transform: `translate(-50%, -50%) rotate(${wmRotation}deg)` };
                          } else if (wmPosition === "middle_right") {
                            posStyle = { ...posStyle, right: `${wmMargin}%`, top: "50%", transform: `translate(0, -50%) rotate(${wmRotation}deg)` };
                          } else if (wmPosition === "bottom_left") {
                            posStyle = { ...posStyle, left: `${wmMargin}%`, bottom: `${wmMargin}%`, transform: `rotate(${wmRotation}deg)`, transformOrigin: "bottom left" };
                          } else if (wmPosition === "bottom_center") {
                            posStyle = { ...posStyle, left: "50%", bottom: `${wmMargin}%`, transform: `translate(-50%, 0) rotate(${wmRotation}deg)` };
                          } else if (wmPosition === "bottom_right") {
                            posStyle = { ...posStyle, right: `${wmMargin}%`, bottom: `${wmMargin}%`, transform: `rotate(${wmRotation}deg)`, transformOrigin: "bottom right" };
                          } else if (wmPosition === "custom") {
                            posStyle = { ...posStyle, left: `${wmCustomCoord.xPercent}%`, top: `${wmCustomCoord.yPercent}%`, transform: `translate(-50%, -50%) rotate(${wmRotation}deg)` };
                          }

                          return (
                            <div
                              style={posStyle}
                              onMouseDown={handleWatermarkMouseDown}
                              className="group cursor-grab active:cursor-grabbing pointer-events-auto p-1 rounded-lg hover:ring-2 hover:ring-accent/70 transition-shadow"
                            >
                              {wmMode === "logo" && wmLogoSrc ? (
                                <div className="relative inline-block">
                                  <img
                                    src={wmLogoSrc}
                                    alt="Logo watermark"
                                    className="object-contain block drop-shadow-md pointer-events-none select-none"
                                    style={{ width: `${logoDispW}px` }}
                                  />
                                  <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-accent text-white p-1 rounded-full shadow transition-opacity">
                                    <Move className="h-3 w-3" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="relative inline-flex items-center gap-1 select-none whitespace-nowrap"
                                  style={{
                                    fontSize: `${dispFontSize}px`,
                                    fontFamily: wmFontFamily,
                                    fontWeight: wmBold ? "bold" : "normal",
                                    fontStyle: wmItalic ? "italic" : "normal",
                                    color: wmColor,
                                    backgroundColor:
                                      wmBgBadge === "dark_pill"
                                        ? "rgba(0,0,0,0.65)"
                                        : wmBgBadge === "light_pill"
                                          ? "rgba(255,255,255,0.75)"
                                          : "transparent",
                                    padding: wmBgBadge !== "none" ? "4px 14px" : "2px 4px",
                                    borderRadius: wmBgBadge !== "none" ? "9999px" : "4px",
                                    backdropFilter: wmBgBadge !== "none" ? "blur(4px)" : "none",
                                    textShadow:
                                      wmStroke === "dark"
                                        ? "0 0 3px #000, 0 0 6px #000, 0 2px 6px rgba(0,0,0,0.85)"
                                        : wmStroke === "light"
                                          ? "0 0 3px #fff, 0 0 6px #fff, 0 2px 6px rgba(255,255,255,0.85)"
                                          : "0 1px 4px rgba(0,0,0,0.6)",
                                    WebkitTextStroke:
                                      wmStroke === "dark"
                                        ? "0.75px rgba(0,0,0,0.9)"
                                        : wmStroke === "light"
                                          ? "0.75px rgba(255,255,255,0.9)"
                                          : undefined,
                                  }}
                                >
                                  <span>{wmText || "Watermark"}</span>
                                  <div className="opacity-0 group-hover:opacity-100 ml-1.5 p-0.5 rounded-full bg-accent text-white shadow inline-flex items-center justify-center transition-opacity">
                                    <Move className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {/* 7. Live Face Blur Interactive Overlay (Draggable, Resizable, Adjustable) */}
                  {tool.slug === "blur-face" && imageSrc && (!hasProcessed || isEditingSettings) && (
                    <div
                      className="absolute inset-0 z-20 pointer-events-none select-none overflow-visible"
                      onClick={(e: any) => {
                        if (e.target === e.currentTarget) {
                          setActiveFaceId(null);
                        }
                      }}
                    >
                      {/* Minimal Non-Intrusive Bottom-Left Badge (Leaves Face 100% Clear) */}
                      <div className="absolute bottom-2.5 left-2.5 z-30 pointer-events-auto rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-xl flex items-center gap-2 border border-white/10">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent">
                          {isDetectingFaces ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                        </div>
                        <span className="font-extrabold text-white/90 text-[11px]">
                          {isDetectingFaces
                            ? "Scanning faces…"
                            : faceRegions.length === 0
                              ? "No blur regions"
                              : `${faceRegions.length} ${faceRegions.length === 1 ? "Face Region" : "Face Regions"}`}
                        </span>
                        <span className="text-white/30">•</span>
                        <button
                          type="button"
                          onClick={() => setShowFaceOutlines((prev: any) => !prev)}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${showFaceOutlines
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "bg-white/10 text-white/60 hover:text-white"
                            }`}
                          title={showFaceOutlines ? "Hide outlines" : "Show adjustment handles"}
                        >
                          {showFaceOutlines ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                          <span>{showFaceOutlines ? "Handles On" : "Clean View"}</span>
                        </button>
                      </div>

                      {/* Render each face blur region with interactive move and resize handles */}
                      {faceRegions.map((face: any, idx: any) => {
                        const isEllipse = faceShape === "ellipse";
                        const isActive = activeFaceId === face.id;
                        const isHovered = hoveredFaceId === face.id;

                        return (
                          <div
                            key={face.id}
                            className="absolute pointer-events-auto"
                            style={{
                              left: `${face.x}%`,
                              top: `${face.y}%`,
                              width: `${face.w}%`,
                              height: `${face.h}%`,
                            }}
                            onMouseEnter={() => setHoveredFaceId(face.id)}
                            onMouseLeave={() => setHoveredFaceId(null)}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              setActiveFaceId(face.id);
                            }}
                          >
                            {/* 1. Face Blur Body Layer (Draggable) */}
                            <div
                              className={`w-full h-full transition-[box-shadow,border] duration-100 ${isEllipse ? "rounded-full" : "rounded-2xl"
                                } ${showFaceOutlines && (isActive || isHovered)
                                  ? isActive
                                    ? "ring-2 ring-accent ring-offset-2 ring-offset-black/50 shadow-2xl"
                                    : "ring-1 ring-accent/80 shadow-md"
                                  : showFaceOutlines
                                    ? "ring-1 ring-white/60 border border-black/30"
                                    : ""
                                }`}
                              style={{
                                backdropFilter:
                                  faceBlurType === "blackout"
                                    ? undefined
                                    : `blur(${Math.max(8, Math.round(faceBlurStrength * 0.85))}px)`,
                                backgroundColor:
                                  faceBlurType === "blackout"
                                    ? "rgba(0, 0, 0, 0.98)"
                                    : faceBlurType === "pixelate"
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : "rgba(255, 255, 255, 0.02)",
                                boxShadow:
                                  faceBlurType === "blackout"
                                    ? "0 4px 20px rgba(0, 0, 0, 0.5)"
                                    : "0 0 20px rgba(0, 0, 0, 0.1)",
                                cursor: "move",
                              }}
                              onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "move")}
                              onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "move")}
                              title="Drag to reposition blur area"
                            >
                              {/* Pixelate mosaic grid preview */}
                              {faceBlurType === "pixelate" && (
                                <div
                                  className={`w-full h-full pointer-events-none opacity-40 ${isEllipse ? "rounded-full" : "rounded-2xl"
                                    }`}
                                  style={{
                                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.7) 1.5px, transparent 1.5px)`,
                                    backgroundSize: "6px 6px",
                                  }}
                                />
                              )}
                            </div>

                            {/* 2. Floating Action Tag (smartly flips to bottom when near top border) */}
                            {showFaceOutlines && (isActive || isHovered) && (
                              <div
                                className={`absolute ${face.y < 8 ? "-bottom-7" : "-top-7"
                                  } left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg transition-all ${isActive
                                    ? "bg-accent text-accent-foreground scale-105"
                                    : "bg-black/85 text-white border border-white/20"
                                  }`}
                              >
                                <span>Face #{idx + 1}</span>
                                <span className="opacity-40">•</span>
                                <button
                                  type="button"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    handleDeleteFace(face.id);
                                  }}
                                  className="hover:text-red-300 p-0.5 rounded cursor-pointer transition-colors"
                                  title="Delete this blur area"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            )}

                            {/* 3. 8 Interactive Resize Handles (Clean uniform circular dots) */}
                            {showFaceOutlines && isActive && (
                              <>
                                {/* 4 Corners: NW, NE, SW, SE */}
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "nw")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "nw")}
                                  className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-nwse-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Top-Left"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "ne")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "ne")}
                                  className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-nesw-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Top-Right"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "sw")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "sw")}
                                  className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-nesw-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Bottom-Left"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "se")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "se")}
                                  className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-nwse-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Bottom-Right"
                                />

                                {/* 4 Midpoints: N, S, W, E (Uniform clean round dots) */}
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "n")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "n")}
                                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-ns-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Height (Top Edge)"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "s")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "s")}
                                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-ns-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Height (Bottom Edge)"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "w")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "w")}
                                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-ew-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Width (Left Edge)"
                                />
                                <div
                                  onMouseDown={(e: any) => handleFaceMouseDown(e, face.id, "e")}
                                  onTouchStart={(e: any) => handleFaceTouchStart(e, face.id, "e")}
                                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent shadow-md cursor-ew-resize z-30 hover:scale-125 active:scale-130 transition-transform"
                                  title="Resize Width (Right Edge)"
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 8. Live Meme Interactive Real-time Preview Overlay */}
                  {tool.slug === "meme-generator" && imageSrc && (!hasProcessed || isEditingSettings) && (
                    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-3 overflow-hidden">
                      {/* Floating live indicator badge */}
                      <div className="absolute top-2 left-2 z-30 pointer-events-none rounded-full bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-md flex items-center gap-1.5 border border-white/10 opacity-75 hover:opacity-100 transition-opacity">
                        <Sparkle className="h-3 w-3 text-accent" />
                        <span>Live Meme Preview</span>
                        <span className="text-white/40">•</span>
                        <span className="text-accent font-mono">{memeFontSize}px</span>
                      </div>

                      {/* Top Meme Text Block */}
                      <div
                        style={{
                          paddingTop: `${memeTopPosPercent}%`,
                          textAlign: memeTextAlign,
                        }}
                        className="w-full pointer-events-auto cursor-grab active:cursor-grabbing group relative"
                        onMouseDown={(e: any) => handleMemeTextMouseDown(e, "top")}
                        title="Drag up or down to adjust top text position"
                      >
                        {topText.trim() ? (
                          <div
                            style={{
                              fontFamily: memeFontFamily,
                              fontSize: `${Math.max(12, Math.round((renderedImgSize?.width || dimensions.width || 600) * (memeFontSize / 700)))}px`,
                              color: memeTextColor,
                              WebkitTextStroke:
                                memeStrokeWidth > 0
                                  ? `${Math.max(1, Math.round((renderedImgSize?.width || 600) * (memeStrokeWidth / 600)))}px ${memeStrokeColor}`
                                  : undefined,
                              textShadow: memeTextShadow ? "0 2px 10px rgba(0,0,0,0.85)" : undefined,
                              textTransform: memeAllCaps ? "uppercase" : "none",
                              lineHeight: 1.15,
                              wordBreak: "break-word",
                            }}
                            className="font-black tracking-wide drop-shadow-md select-none px-2 transition-[color,font-size] duration-75"
                          >
                            {topText}
                          </div>
                        ) : null}
                        {topText.trim() && (
                          <div className="absolute -top-1 right-2 opacity-0 group-hover:opacity-100 bg-accent text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow pointer-events-none transition-opacity">
                            ↕ Drag Position
                          </div>
                        )}
                      </div>

                      {/* Bottom Meme Text Block */}
                      <div
                        style={{
                          paddingBottom: `${memeBottomPosPercent}%`,
                          textAlign: memeTextAlign,
                        }}
                        className="w-full pointer-events-auto cursor-grab active:cursor-grabbing group relative"
                        onMouseDown={(e: any) => handleMemeTextMouseDown(e, "bottom")}
                        title="Drag up or down to adjust bottom text position"
                      >
                        {bottomText.trim() ? (
                          <div
                            style={{
                              fontFamily: memeFontFamily,
                              fontSize: `${Math.max(12, Math.round((renderedImgSize?.width || dimensions.width || 600) * (memeFontSize / 700)))}px`,
                              color: memeTextColor,
                              WebkitTextStroke:
                                memeStrokeWidth > 0
                                  ? `${Math.max(1, Math.round((renderedImgSize?.width || 600) * (memeStrokeWidth / 600)))}px ${memeStrokeColor}`
                                  : undefined,
                              textShadow: memeTextShadow ? "0 2px 10px rgba(0,0,0,0.85)" : undefined,
                              textTransform: memeAllCaps ? "uppercase" : "none",
                              lineHeight: 1.15,
                              wordBreak: "break-word",
                            }}
                            className="font-black tracking-wide drop-shadow-md select-none px-2 transition-[color,font-size] duration-75"
                          >
                            {bottomText}
                          </div>
                        ) : null}
                        {bottomText.trim() && (
                          <div className="absolute -bottom-1 right-2 opacity-0 group-hover:opacity-100 bg-accent text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow pointer-events-none transition-opacity">
                            ↕ Drag Position
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Smooth Loading Indicator Backdrop */}
                  {processing && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md rounded-2xl animate-in fade-in duration-200">
                      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border shadow-2xl">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <div className="text-center">
                          <p className="text-sm font-extrabold text-foreground">
                            {tool.slug === "html-to-image" ? "Rendering HTML to Image…" : "Processing Image…"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">High-definition 2x rendering</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Color Picker Hover Swatch (Updated via Direct RAF DOM) */}
              {tool.slug === "color-picker-from-image" && (
                <div
                  ref={hoverSwatchRef}
                  style={{ display: "none" }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-lg text-xs font-mono font-bold backdrop-blur-md z-30"
                >
                  <span
                    ref={hoverSwatchDotRef}
                    className="h-4 w-4 rounded-full border border-white/40 shadow-sm shrink-0"
                    style={{ backgroundColor: pickedHex }}
                  />
                  <span ref={hoverSwatchHexRef}>{pickedHex}</span>
                </div>
              )}

              {/* Interactive Crop Bounding Box Overlay */}
              {tool.slug === "crop-image" && imgRef.current && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    padding: "16px",
                  }}
                >
                  <div
                    className="relative max-h-full max-w-full"
                    style={{
                      width: imgRef.current.clientWidth,
                      height: imgRef.current.clientHeight,
                    }}
                  >
                    {/* Dark Mask Top */}
                    <div
                      className="absolute bg-black/60 backdrop-blur-[1px]"
                      style={{ top: 0, left: 0, right: 0, height: `${cropBox.y}%` }}
                    />
                    {/* Dark Mask Bottom */}
                    <div
                      className="absolute bg-black/60 backdrop-blur-[1px]"
                      style={{ bottom: 0, left: 0, right: 0, height: `${100 - cropBox.y - cropBox.h}%` }}
                    />
                    {/* Dark Mask Left */}
                    <div
                      className="absolute bg-black/60 backdrop-blur-[1px]"
                      style={{ top: `${cropBox.y}%`, left: 0, width: `${cropBox.x}%`, height: `${cropBox.h}%` }}
                    />
                    {/* Dark Mask Right */}
                    <div
                      className="absolute bg-black/60 backdrop-blur-[1px]"
                      style={{ top: `${cropBox.y}%`, right: 0, width: `${100 - cropBox.x - cropBox.w}%`, height: `${cropBox.h}%` }}
                    />

                    {/* Active Interactive Crop Box */}
                    <div
                      onMouseDown={(e: any) => handleCropMouseDown(e, "move")}
                      className="absolute border-2 border-amber-400 bg-amber-400/10 cursor-move pointer-events-auto shadow-2xl transition-shadow"
                      style={{
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.w}%`,
                        height: `${cropBox.h}%`,
                      }}
                    >
                      {/* Rule of Thirds Grid Lines */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                        <div className="border-r border-b border-white/70" />
                        <div className="border-r border-b border-white/70" />
                        <div className="border-b border-white/70" />
                        <div className="border-r border-b border-white/70" />
                        <div className="border-r border-b border-white/70" />
                        <div className="border-b border-white/70" />
                        <div className="border-r border-b border-white/70" />
                        <div className="border-r border-b border-white/70" />
                        <div />
                      </div>

                      {/* Dimension Badge */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-black/90 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300 shadow-md border border-amber-400/40 pointer-events-none">
                        {cropPixelWidth} × {cropPixelHeight} px
                      </div>

                      {/* 8 Drag Handles */}
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "nw")}
                        className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-black cursor-nwse-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "ne")}
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-black cursor-nesw-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "sw")}
                        className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-black cursor-nesw-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "se")}
                        className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-black cursor-nwse-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "n")}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-7 rounded-full bg-amber-400 border-2 border-black cursor-ns-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "s")}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-7 rounded-full bg-amber-400 border-2 border-black cursor-ns-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "w")}
                        className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-7 rounded-full bg-amber-400 border-2 border-black cursor-ew-resize shadow-md"
                      />
                      <div
                        onMouseDown={(e: any) => handleCropMouseDown(e, "e")}
                        className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-7 rounded-full bg-amber-400 border-2 border-black cursor-ew-resize shadow-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex items-center gap-3 rounded-full bg-card px-6 py-3 shadow-2xl border border-border font-bold">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    <span>{tool.slug === "watermark-image" && rotateBatch.length > 1 ? `Watermarking ${rotateBatch.length} Images…` : "Processing Image…"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Watermark Multi-Image Queue Strip */}
            {tool.slug === "watermark-image" && rotateBatch.length > 0 && (
              <div className="border-t border-border bg-muted/35 px-4 py-2.5 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[11px] font-extrabold text-accent">
                    <Layers className="h-3 w-3" />
                    <span>{rotateBatch.length} {rotateBatch.length === 1 ? "Image" : "Images"}</span>
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                  {rotateBatch.map((item: any, idx: number) => {
                    const isSelected = imageSrc === item.dataUrl || file?.name === item.name;
                    return (
                      <div
                        key={item.id}
                        className={`relative group/wmthumb shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                          isSelected
                            ? "border-accent ring-2 ring-accent/40 scale-[1.03] shadow-sm"
                            : "border-border/80 opacity-75 hover:opacity-100 hover:border-foreground/50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFile(item.file);
                            setImageSrc(item.dataUrl);
                            setOrigSize(item.size);
                            setDimensions({ width: item.width, height: item.height });
                          }}
                          className="block h-11 w-14 bg-background cursor-pointer"
                          title={`Preview watermark on ${item.name}`}
                        >
                          <img
                            src={item.dataUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </button>
                        <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/75 px-1 text-[9px] font-mono font-bold text-white">
                          {idx + 1}
                        </span>
                        {rotateBatch.length > 1 && (
                          <button
                            type="button"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              setRotateBatch((prev: any) => {
                                const next = prev.filter((x: any) => x.id !== item.id);
                                if (isSelected && next[0]) {
                                  setFile(next[0].file);
                                  setImageSrc(next[0].dataUrl);
                                  setOrigSize(next[0].size);
                                  setDimensions({ width: next[0].width, height: next[0].height });
                                }
                                return next;
                              });
                            }}
                            className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-white opacity-0 group-hover/wmthumb:opacity-100 hover:bg-rose-600 transition-all cursor-pointer"
                            title="Remove from batch"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 px-3 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-accent hover:text-accent text-[11px] font-bold text-muted-foreground flex items-center gap-1 transition-colors cursor-pointer bg-background/60"
                    title="Add more images to watermark in bulk"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>
  );
}
