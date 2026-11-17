// Settings panels for binary-to-image decoding, hex/octal/ASCII decoders, OCR extraction, and barcode scanning.
import { Upload, Check, Loader2, Wand2, Copy, Code2, Languages, FileText, ChevronRight, SlidersHorizontal, FileSpreadsheet, AlignLeft, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { OcrLanguageDialog } from "@/components/OcrLanguageDialog";


import { SAMPLE_BINARY_INVADER, SAMPLE_BINARY_HEART, SAMPLE_BINARY_IMAGE, type BinaryThemeKey, BINARY_THEMES } from "@/lib/workspace/workspace-presets";
import { decodeBinaryStringToImageUrl, OCR_SUPPORTED_LANGUAGES } from "@/lib/workspace/pixel-and-barcode-engines";

export function WorkspaceControlsDecoders(props: any) {
  const {
    tool,
    file,
    setFile,
    setImageSrc,
    setProcessedSrc,
    processing,
    hasProcessed,
    setHasProcessed,
    origSize,
    dimensions,
    setDimensions,
    setIsEditingSettings,
    detectedBarcodes,
    skipBarcodeAndQr,
    setSkipBarcodeAndQr,
    ocrContrastMode,
    setOcrContrastMode,
    ocrOutputStructure,
    setOcrOutputStructure,
    ocrLanguage,
    setOcrLanguage,
    ocrCustomLanguage,
    setOcrCustomLanguage,
    isOcrLanguageDialogOpen,
    setIsOcrLanguageDialogOpen,
    ocrProgressStatus,
    ocrProgressPercent,
    recomputeOcrOutput,
    inputConvertText,
    setInputConvertText,
    binaryInputTab,
    setBinaryInputTab,
    setBinaryTheme,
    binaryPixelBlockSize,
    setBinaryPixelBlockSize,
    setBase64LandingMode,
    setBase64InputText,
    base64ExportFormat,
    setBase64ExportFormat,
    base64ExportQuality,
    setBase64ExportQuality,
    base64DecodedInfo,
    setBase64DecodedInfo,
    setTextDecoderLandingMode,
    binaryOutputText,
    copiedFormat,
    htmlCodeText,
    htmlRenderWidth,
    setHtmlRenderWidth,
    htmlRenderHeight,
    setHtmlRenderHeight,
    htmlBgColor,
    setHtmlBgColor,
    htmlOutputFormat,
    setHtmlOutputFormat,
    setIsFullScreenHtmlEditorOpen,
    setTempHtmlCode,
    fileInputRef,
    copyBase64DecodedImage,
    copyToClipboard,
    formatBytes
  } = props;
  const binaryTheme: BinaryThemeKey = props.binaryTheme;

  return (
    <>
              {/* 13.5 BINARY TO IMAGE ADVANCED DUAL-INPUT CONTROLS */}
              {tool.slug === "binary-to-image" && (
                <div className="space-y-5">
                  {/* Mode Tabs: Paste Binary Code vs Upload Binary File */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Input Method
                    </label>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-1.5 border border-border">
                      <button
                        type="button"
                        onClick={() => setBinaryInputTab("paste")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${binaryInputTab === "paste"
                            ? "bg-foreground text-background shadow-md font-black scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Paste Binary Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBinaryInputTab("upload")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${binaryInputTab === "upload"
                            ? "bg-foreground text-background shadow-md font-black scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload File (.bin / .txt)</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: PASTE BINARY CODE */}
                  {binaryInputTab === "paste" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-muted-foreground block">
                            Binary Code (0s and 1s or 1-Bit Matrix)
                          </label>
                          {inputConvertText && (
                            <span className="rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-mono font-bold text-accent">
                              {inputConvertText.replace(/[^01]/g, "").length} bits
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const clip = await navigator.clipboard.readText();
                                if (clip) {
                                  setInputConvertText(clip);
                                  toast.success("Pasted binary data from clipboard!");
                                }
                              } catch {
                                toast.error("Could not read clipboard. Please paste manually.");
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold text-foreground hover:border-foreground transition-all cursor-pointer"
                            title="Paste from clipboard"
                          >
                            <Copy className="h-3 w-3 text-accent" />
                            <span>Paste</span>
                          </button>
                          {inputConvertText && (
                            <button
                              type="button"
                              onClick={() => {
                                setInputConvertText("");
                                setFile(null);
                                setProcessedSrc(null);
                                setImageSrc(null);
                                setHasProcessed(false);
                              }}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition-all cursor-pointer"
                              title="Clear binary input"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={7}
                        value={inputConvertText}
                        onChange={(e: any) => setInputConvertText(e.target.value)}
                        placeholder="Paste binary bits (e.g. 01001000 01100101... or multiline 1-bit pixel matrix)..."
                        className="w-full rounded-2xl border-2 border-border bg-background p-3.5 text-xs font-mono leading-relaxed focus:border-accent focus:outline-none"
                      />

                      {/* Quick Sample Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground block">Quick Sample Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInputConvertText(SAMPLE_BINARY_INVADER);
                              const activeTheme = BINARY_THEMES[binaryTheme];
                              const url = decodeBinaryStringToImageUrl(SAMPLE_BINARY_INVADER, {
                                color0: activeTheme.bg,
                                color1: activeTheme.fg,
                                pixelScale: binaryPixelBlockSize,
                              });
                              if (url) {
                                setProcessedSrc(url);
                                setImageSrc(url);
                                setDimensions({ width: 11 * binaryPixelBlockSize, height: 8 * binaryPixelBlockSize });
                                setHasProcessed(true);
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                          >
                            8-Bit Pixel Invader
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInputConvertText(SAMPLE_BINARY_HEART);
                              const activeTheme = BINARY_THEMES[binaryTheme];
                              const url = decodeBinaryStringToImageUrl(SAMPLE_BINARY_HEART, {
                                color0: activeTheme.bg,
                                color1: activeTheme.fg,
                                pixelScale: binaryPixelBlockSize,
                              });
                              if (url) {
                                setProcessedSrc(url);
                                setImageSrc(url);
                                setDimensions({ width: 13 * binaryPixelBlockSize, height: 9 * binaryPixelBlockSize });
                                setHasProcessed(true);
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                          >
                            8-Bit Heart
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInputConvertText(SAMPLE_BINARY_IMAGE);
                              const url = decodeBinaryStringToImageUrl(SAMPLE_BINARY_IMAGE);
                              if (url) {
                                setProcessedSrc(url);
                                setImageSrc(url);
                                setHasProcessed(true);
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                          >
                            Sample Binary Header
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: UPLOAD BINARY FILE */}
                  {binaryInputTab === "upload" && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground block">
                        Upload Binary or Text Data File
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-border bg-background/60 p-6 hover:border-foreground hover:bg-card transition-all"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-md mb-2">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          {file ? file.name : "Click or Drag & Drop File Here"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Supports <strong className="text-foreground">.bin, .txt, .dat, .raw</strong> or binary image files
                        </p>
                        {file && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatBytes(file.size)}
                            </span>
                            <span className="text-[11px] font-bold text-accent">Loaded ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Palette & Theme Customization */}
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Pixel Matrix &amp; Bitstream Color Palette
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {(Object.keys(BINARY_THEMES) as BinaryThemeKey[]).map((key: BinaryThemeKey) => {
                        const t = BINARY_THEMES[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setBinaryTheme(key);
                              if (inputConvertText) {
                                const url = decodeBinaryStringToImageUrl(inputConvertText, {
                                  color0: t.bg,
                                  color1: t.fg,
                                  pixelScale: binaryPixelBlockSize,
                                });
                                if (url) {
                                  setProcessedSrc(url);
                                  setImageSrc(url);
                                }
                              }
                            }}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${binaryTheme === key
                                ? "border-foreground bg-foreground text-background shadow-xs font-bold"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            <div
                              className="h-4 w-4 rounded-full border border-white/20 shadow-xs"
                              style={{ backgroundColor: t.fg }}
                            />
                            <span className="text-[10px] font-extrabold leading-tight">{t.name.split(" ")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pixel Block Scale Slider */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground">Pixel Scale / Block Size:</span>
                      <span className="font-mono font-black text-accent">{binaryPixelBlockSize}px</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[8, 12, 16, 20, 24].map((size: any) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setBinaryPixelBlockSize(size);
                            if (inputConvertText) {
                              const activeTheme = BINARY_THEMES[binaryTheme];
                              const url = decodeBinaryStringToImageUrl(inputConvertText, {
                                color0: activeTheme.bg,
                                color1: activeTheme.fg,
                                pixelScale: size,
                              });
                              if (url) {
                                setProcessedSrc(url);
                                setImageSrc(url);
                              }
                            }
                          }}
                          className={`py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer ${binaryPixelBlockSize === size
                              ? "border-foreground bg-foreground text-background shadow-xs font-black"
                              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Settings Panel for Base64 to Image */}
              {tool.slug === "base64-to-image" && (
                <div className="space-y-4">
                  {/* 1. Decoded Image Overview Card */}
                  <div className="space-y-3.5 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs shadow-inner">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </span>
                        <div>
                          <label className="text-xs font-black text-foreground block">
                            Decoded Image Details
                          </label>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Live Decoded from Base64
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                        {base64DecodedInfo?.format || "PNG"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dimensions</span>
                        <span className="font-mono text-xs font-black text-foreground">
                          {dimensions.width} × {dimensions.height} px
                        </span>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-background/80 p-2.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payload Size</span>
                        <span className="font-mono text-xs font-black text-foreground">
                          {formatBytes(base64DecodedInfo?.approxBytes || origSize || 0)}
                        </span>
                      </div>
                    </div>

                    {base64DecodedInfo && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                        <span>Base64 String Length:</span>
                        <span className="font-mono font-bold text-foreground">
                          {base64DecodedInfo.charCount.toLocaleString()} chars
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. Export Format Settings */}
                  <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
                    <label className="text-xs font-black text-foreground block">
                      Export Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["PNG", "JPG", "WEBP"] as const).map((fmt: any) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setBase64ExportFormat(fmt)}
                          className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${base64ExportFormat === fmt
                              ? "border-accent bg-accent/15 text-accent shadow-xs scale-[1.02]"
                              : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            }`}
                        >
                          <span className="font-black text-sm">{fmt}</span>
                          <span className="text-[9px] opacity-75">
                            {fmt === "PNG" ? "Lossless" : fmt === "JPG" ? "Standard" : "Modern"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {(base64ExportFormat === "JPG" || base64ExportFormat === "WEBP") && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Quality:</span>
                          <span className="font-mono font-extrabold text-foreground">
                            {Math.round(base64ExportQuality * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={1}
                          step={0.01}
                          value={base64ExportQuality}
                          onChange={(e: any) => setBase64ExportQuality(parseFloat(e.target.value))}
                          className="w-full accent-accent cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Quick Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={copyBase64DecodedImage}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer shadow-xs"
                    >
                      <Copy className="h-3.5 w-3.5 text-accent" />
                      <span>Copy Decoded Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageSrc(null);
                        setProcessedSrc(null);
                        setFile(null);
                        setHasProcessed(false);
                        setIsEditingSettings(false);
                        setBase64LandingMode("upload");
                        setBase64InputText("");
                        setBase64DecodedInfo(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Another File or Paste Text</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 14. TEXT DECODER TOOLS (Octal/Hex/Decimal/ASCII To Image) — Input Summary Card */}
              {[
                "octal-to-image",
                "ascii-to-image",
                "hex-to-image",
                "decimal-to-image",
              ].includes(tool.slug) && (
                  <div className="space-y-2.5 rounded-2xl border border-border bg-card/60 p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground font-black text-xs shadow-inner">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <label className="text-xs font-black text-foreground block">
                          Encoded Input Data
                        </label>
                        <span className="text-[10px] text-muted-foreground block">
                          {inputConvertText
                            ? `${inputConvertText.trim().split(/\s+/).length.toLocaleString()} tokens · ${inputConvertText.length.toLocaleString()} chars`
                            : "No data loaded"}
                        </span>
                      </div>
                    </div>
                    {inputConvertText && (
                      <div className="rounded-xl bg-background border border-border p-2.5 max-h-20 overflow-y-auto">
                        <p className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
                          {inputConvertText.slice(0, 180)}{inputConvertText.length > 180 ? "…" : ""}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageSrc(null);
                        setProcessedSrc(null);
                        setFile(null);
                        setHasProcessed(false);
                        setIsEditingSettings(false);
                        setTextDecoderLandingMode("plain_text");
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Another File or Edit Input</span>
                    </button>
                  </div>
                )}



              {/* 14.9 ADVANCED OCR & BARCODE/QR CONTROLS */}
              {(tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text") && (
                <div className="space-y-4">
                  {/* 1. DOCUMENT & OCR LANGUAGE SELECTION */}
                  <div className="space-y-3.5 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground font-black text-xs shadow-inner">
                          <Languages className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <label className="text-xs font-black text-foreground block">
                            OCR Recognition Language
                          </label>
                          <span className="text-[10px] text-muted-foreground block">
                            Choose document script or dual-language OCR
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsOcrLanguageDialogOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-extrabold text-accent hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer shadow-2xs"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>Change Language</span>
                      </button>
                    </div>

                    {/* Active Language Highlight Card */}
                    {(() => {
                      const activeObj =
                        ocrLanguage === "custom"
                          ? {
                            code: ocrCustomLanguage || "custom",
                            name: ocrCustomLanguage ? `Custom Code (${ocrCustomLanguage})` : "Custom OCR Code",
                            nativeName: ocrCustomLanguage || "Custom Code",
                            flag: "⚙️",
                            region: "User Custom Tesseract String",
                            category: "Multi-Language" as const,
                          }
                          : OCR_SUPPORTED_LANGUAGES.find((l: any) => l.code === ocrLanguage) || {
                            code: ocrLanguage,
                            name: ocrLanguage,
                            nativeName: ocrLanguage,
                            flag: "🌐",
                            region: "Standard Script",
                            category: "Popular" as const,
                          };

                      return (
                        <div
                          onClick={() => setIsOcrLanguageDialogOpen(true)}
                          className="group flex items-center justify-between rounded-xl border-2 border-border bg-background p-3 transition-all hover:border-foreground hover:bg-muted/30 cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-3 truncate pr-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-2xl shadow-xs group-hover:scale-105 transition-transform">
                              {activeObj.flag || "🌐"}
                            </span>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-foreground truncate">
                                  {activeObj.nativeName || activeObj.name}
                                </span>
                                {activeObj.nativeName && activeObj.nativeName !== activeObj.name && (
                                  <span className="text-[11px] text-muted-foreground font-semibold truncate">
                                    ({activeObj.name})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="rounded-md bg-accent/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-accent">
                                  {activeObj.code}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium truncate">
                                  {activeObj.region || activeObj.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground hidden sm:inline">
                              Browse 60+ Languages
                            </span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground group-hover:border-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Select Presets Grid */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Popular Presets:</span>
                        <button
                          type="button"
                          onClick={() => setIsOcrLanguageDialogOpen(true)}
                          className="text-accent hover:underline cursor-pointer lowercase first-letter:uppercase text-[11px]"
                        >
                          view 60+ languages →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { code: "eng", name: "English", flag: "🇺🇸" },
                          { code: "guj", name: "ગુજરાતી", flag: "🇮🇳" },
                          { code: "hin", name: "हिन्दी", flag: "🇮🇳" },
                          { code: "spa", name: "Español", flag: "🇪🇸" },
                          { code: "fra", name: "Français", flag: "🇫🇷" },
                          { code: "deu", name: "Deutsch", flag: "🇩🇪" },
                          { code: "chi_sim", name: "中文", flag: "🇨🇳" },
                          { code: "ara", name: "العربية", flag: "🇸🇦" },
                        ].map((item: any) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              setOcrLanguage(item.code);
                              toast.success(`OCR language set to ${item.name} (${item.code})`);
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-all cursor-pointer truncate ${ocrLanguage === item.code
                                ? "bg-foreground text-background font-black shadow-xs ring-1 ring-foreground"
                                : "border border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-muted"
                              }`}
                          >
                            <span className="text-sm shrink-0">{item.flag}</span>
                            <span className="truncate">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dual-Language & Custom Code Launcher */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsOcrLanguageDialogOpen(true)}
                        className="w-full flex items-center justify-between rounded-xl border border-dashed border-border bg-background/50 p-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="truncate">Need Dual Language (e.g. English + Hindi) or Custom Code?</span>
                        </div>
                        <span className="text-accent font-extrabold text-[11px] shrink-0">Open Dialog →</span>
                      </button>
                    </div>

                    {/* Custom Language Selection Dialog Modal */}
                    <OcrLanguageDialog
                      isOpen={isOcrLanguageDialogOpen}
                      onClose={() => setIsOcrLanguageDialogOpen(false)}
                      selectedLanguage={ocrLanguage}
                      onSelectLanguage={(code: any) => setOcrLanguage(code)}
                      customLanguage={ocrCustomLanguage}
                      onUpdateCustomLanguage={(val: any) => setOcrCustomLanguage(val)}
                    />
                  </div>

                  {/* 2. LIVE OCR PROGRESS STATUS INDICATOR */}
                  {processing && (
                    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 space-y-3 animate-pulse">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          <span>{ocrProgressStatus || "Running Optical Character Recognition…"}</span>
                        </div>
                        <span className="font-mono font-black text-accent">{ocrProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, ocrProgressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. QR & BARCODE DETECTION CARD & CHECKBOX */}
                  {detectedBarcodes.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-white font-black text-xs">
                            ✓
                          </span>
                          <span className="text-xs font-black text-foreground">
                            {detectedBarcodes.length} {detectedBarcodes.some((b: any) => b.type === "QR Code") && detectedBarcodes.some((b: any) => b.type === "Barcode") ? "QR & Barcode" : detectedBarcodes[0]!.type} Detected
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                          Auto-Detected
                        </span>
                      </div>

                      {/* Setting Checkbox: Skip Barcode and QR Code Read */}
                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-background cursor-pointer hover:border-foreground transition-all">
                        <input
                          type="checkbox"
                          checked={skipBarcodeAndQr}
                          onChange={(e: any) => {
                            setSkipBarcodeAndQr(e.target.checked);
                            recomputeOcrOutput(e.target.checked, ocrContrastMode, ocrOutputStructure);
                          }}
                          className="mt-0.5 h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-extrabold text-foreground block">
                            Skip Barcode and QR Code Read
                          </span>
                          <span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">
                            {skipBarcodeAndQr
                              ? "Barcode and QR Code data is currently ignored/skipped from text output."
                              : "Barcode & QR Code data is read and added directly into your text file."}
                          </span>
                        </div>
                      </label>

                      {/* Summary of Detected Barcode/QR contents */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Detected Payload Data ({detectedBarcodes.length}):
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {detectedBarcodes.map((bc: any, idx: any) => (
                            <div key={idx} className="rounded-lg bg-background border border-border/80 p-2 text-xs flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground shrink-0 uppercase">
                                  {bc.format || bc.type}
                                </span>
                                <span className="truncate font-mono text-[11px] text-muted-foreground" title={bc.rawValue}>
                                  {bc.rawValue}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboard(bc.rawValue, `barcode-${idx}`);
                                }}
                                className="shrink-0 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground hover:bg-foreground hover:text-background transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {copiedFormat === `barcode-${idx}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipBarcodeAndQr}
                          onChange={(e: any) => {
                            setSkipBarcodeAndQr(e.target.checked);
                            recomputeOcrOutput(e.target.checked, ocrContrastMode, ocrOutputStructure);
                          }}
                          className="mt-0.5 h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-extrabold text-foreground block">
                            Skip Barcode and QR Code Read
                          </span>
                          <span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">
                            When checked, QR codes &amp; 1D barcodes in images will be ignored.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* 4. OCR OUTPUT LAYOUT MODE */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Text Formatting Structure:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "structured", label: "Structured", sub: "Document layout", icon: FileSpreadsheet },
                        { id: "plain", label: "Plain Text", sub: "Raw lines", icon: AlignLeft },
                        { id: "json", label: "Key-Value", sub: "Form fields", icon: Code2 },
                      ].map((mode: any) => {
                        const IconComp = mode.icon;
                        const isSelected = ocrOutputStructure === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setOcrOutputStructure(mode.id as any);
                              recomputeOcrOutput(skipBarcodeAndQr, ocrContrastMode, mode.id as any);
                            }}
                            className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1.5 text-center transition-all cursor-pointer gap-1 ${isSelected
                                ? "border-foreground bg-foreground text-background shadow-xs font-bold"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            <IconComp className={`h-4 w-4 ${isSelected ? "text-background" : "text-foreground"}`} />
                            <span className="text-xs font-extrabold leading-tight">{mode.label}</span>
                            <span className="text-[10px] opacity-75">{mode.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. OCR IMAGE ENHANCEMENT FILTER */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">
                      OCR Contrast &amp; Lighting Preprocessing:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "auto", label: "Adaptive", sub: "Auto lighting", icon: Wand2 },
                        { id: "high", label: "High Contrast", sub: "B&W threshold", icon: Sun },
                        { id: "inverted", label: "Invert Dark", sub: "Dark mode invert", icon: Moon },
                      ].map((f: any) => {
                        const IconComp = f.icon;
                        const isSelected = ocrContrastMode === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setOcrContrastMode(f.id as any);
                              recomputeOcrOutput(skipBarcodeAndQr, f.id as any, ocrOutputStructure);
                            }}
                            className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1.5 text-center transition-all cursor-pointer gap-1 ${isSelected
                                ? "border-foreground bg-foreground text-background shadow-xs font-bold"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                          >
                            <IconComp className={`h-4 w-4 ${isSelected ? "text-background" : "text-foreground"}`} />
                            <span className="text-xs font-extrabold leading-tight">{f.label}</span>
                            <span className="text-[10px] opacity-75">{f.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 15. TEXT ENCODER TOOLS OUTPUT DISPLAY */}
              {[
                "image-to-base64",
                "image-to-octal",
                "image-to-hex",
                "image-to-decimal",
                "image-to-ascii",
              ].includes(tool.slug) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground block">
                        Generated {tool.name} Output
                      </label>
                      {binaryOutputText && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(binaryOutputText, tool.name)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-foreground hover:text-background transition-all shadow-xs"
                        >
                          {copiedFormat === tool.name ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-accent" />
                          )}
                          <span>{copiedFormat === tool.name ? "Copied!" : "Copy Output"}</span>
                        </button>
                      )}
                    </div>
                    {hasProcessed && binaryOutputText ? (
                      <textarea
                        rows={8}
                        value={binaryOutputText}
                        readOnly
                        onClick={(e: any) => {
                          (e.target as HTMLTextAreaElement).select();
                          copyToClipboard(binaryOutputText, tool.name);
                        }}
                        title="Click anywhere to select all and copy"
                        className="w-full cursor-pointer rounded-2xl border-2 border-border bg-background p-3.5 text-xs font-mono leading-relaxed focus:border-accent focus:outline-none break-all"
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-center">
                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                          Upload an image and click <strong className="text-foreground">Convert / Process Image</strong> to generate {tool.name} output.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* 15.5 HTML TO IMAGE CONTROLS */}
              {tool.slug === "html-to-image" && (
                <div className="space-y-6">
                  {/* Top Bar: Input Mode / File Indicator & Upload Button */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-bold shadow-xs">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-foreground truncate">
                            {file ? file.name : "Plain Text / Raw HTML"}
                          </h4>
                          <span className="rounded-full bg-accent/15 text-accent border border-accent/30 px-2 py-0.2 text-[9px] font-bold font-mono">
                            {htmlCodeText.length.toLocaleString()} chars
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {file ? `${formatBytes(file.size)} · Uploaded HTML file` : "Editable Plain Text / HTML Code"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTempHtmlCode(htmlCodeText);
                          setIsFullScreenHtmlEditorOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 text-accent px-3 py-1.5 text-xs font-bold hover:bg-accent hover:text-accent-foreground transition-all shadow-xs cursor-pointer"
                        title="Open Full-Screen HTML & CSS Code Editor"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Edit HTML</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-foreground hover:text-background transition-all shadow-xs cursor-pointer"
                        title="Upload an HTML file from your computer"
                      >
                        <Upload className="h-3.5 w-3.5 text-accent" />
                        <span>{file ? "Change File" : "Upload HTML File"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas Dimensions */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground">Output Image Dimensions:</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setHtmlRenderWidth(860); setHtmlRenderHeight(740); }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border border-border hover:bg-muted"
                        >
                          860x740
                        </button>
                        <button
                          type="button"
                          onClick={() => { setHtmlRenderWidth(1200); setHtmlRenderHeight(630); }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border border-border hover:bg-muted"
                        >
                          1200x630
                        </button>
                        <button
                          type="button"
                          onClick={() => { setHtmlRenderWidth(1080); setHtmlRenderHeight(1080); }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border border-border hover:bg-muted"
                        >
                          1080x1080
                        </button>
                        <button
                          type="button"
                          onClick={() => { setHtmlRenderWidth(800); setHtmlRenderHeight(600); }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border border-border hover:bg-muted"
                        >
                          800x600
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground block mb-1">Width (px):</span>
                        <input
                          type="number"
                          min={100}
                          max={3840}
                          value={htmlRenderWidth}
                          onChange={(e: any) => setHtmlRenderWidth(Number(e.target.value) || 800)}
                          className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-xs font-mono font-bold focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground block mb-1">Height (px):</span>
                        <input
                          type="number"
                          min={100}
                          max={3840}
                          value={htmlRenderHeight}
                          onChange={(e: any) => setHtmlRenderHeight(Number(e.target.value) || 450)}
                          className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-xs font-mono font-bold focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background & Output Format */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Background:</span>
                      <select
                        value={htmlBgColor}
                        onChange={(e: any) => setHtmlBgColor(e.target.value)}
                        className="w-full rounded-xl border-2 border-border bg-background px-2.5 py-2 text-xs font-bold focus:border-accent focus:outline-none"
                      >
                        <option value="auto">Auto (From HTML Code)</option>
                        <option value="#ffffff">White (#FFFFFF)</option>
                        <option value="#0f172a">Dark Slate (#0F172A)</option>
                        <option value="#090d16">Dark Charcoal (#090D16)</option>
                        <option value="transparent">Transparent</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">Format:</span>
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 border border-border">
                        <button
                          type="button"
                          onClick={() => setHtmlOutputFormat("PNG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all ${htmlOutputFormat === "PNG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlOutputFormat("JPG")}
                          className={`rounded-lg py-1.5 text-xs font-extrabold transition-all ${htmlOutputFormat === "JPG" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                            }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
    </>
  );
}
