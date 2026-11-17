// Drag-and-drop file upload zone and plain-text / code input landing views.
import { Upload, Loader2, Copy, ArrowLeft, ArrowRight, FileText, Binary, ShieldCheck } from "lucide-react";
import { toast } from "sonner";


import { SAMPLE_VISUAL_TEST, SAMPLE_OG_CARD, SAMPLE_BADGE, SAMPLE_INVOICE, SAMPLE_CODE_BOX, SAMPLE_BINARY_INVADER, SAMPLE_BINARY_HEART, SAMPLE_BINARY_IMAGE, type BinaryThemeKey, BINARY_THEMES, SAMPLE_BASE64_STAR, SAMPLE_BASE64_GRADIENT_ICON } from "@/lib/workspace/workspace-presets";
import { decodeBinaryStringToImageUrl, tryDecodeAsciiToOriginalImage, renderAsciiToImage, renderHtmlToImage } from "@/lib/workspace/pixel-and-barcode-engines";

export function WorkspaceUploadStage(props: any) {
  const {
    tool,
    setFile,
    setImageSrc,
    setProcessedSrc,
    processing,
    setProcessing,
    setHasProcessed,
    setDimensions,
    setIsEditingSettings,
    setTargetWidth,
    setTargetHeight,
    inputConvertText,
    setInputConvertText,
    setBinaryLandingMode,
    setBinaryInputTab,
    binaryPixelBlockSize,
    setBase64LandingMode,
    base64InputText,
    setBase64InputText,
    setTextDecoderLandingMode,
    setHtmlLandingMode,
    setHtmlInputMode,
    htmlCodeText,
    setHtmlCodeText,
    htmlRenderWidth,
    setHtmlRenderWidth,
    htmlRenderHeight,
    setHtmlRenderHeight,
    htmlBgColor,
    setHtmlBgColor,
    htmlOutputFormat,
    isDraggingFile,
    fileInputRef,
    decodeAndApplyBase64,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = props;
  const binaryTheme: BinaryThemeKey = props.binaryTheme;

  return (
    <>
        tool.slug === "html-to-image" && htmlLandingMode === "plain_text" ? (
          /* Plain Text / HTML Code Direct Input Card with Next Button */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 sm:p-10 w-full max-w-4xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 self-start mb-6 w-full">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  Paste or Write HTML / Plain Text
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                  Type custom HTML, CSS styling, or plain text to render directly into a high-resolution PNG or JPG image
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  HTML Code / Text Input:
                </label>
                <span className="text-[11px] font-mono font-bold text-accent">
                  {htmlCodeText.length.toLocaleString()} characters · {htmlCodeText.split("\n").length} lines
                </span>
              </div>

              <textarea
                rows={10}
                value={htmlCodeText}
                onChange={(e: any) => setHtmlCodeText(e.target.value)}
                placeholder={`Paste or type HTML code or plain text here...\n\nExample:\n<div style="padding: 40px; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; border-radius: 24px; font-family: system-ui, sans-serif; text-align: center;">\n  <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px 0;">HTML to Image Studio</h1>\n  <p style="font-size: 16px; opacity: 0.9; margin: 0;">Instant client-side rendering</p>\n</div>`}
                className="w-full rounded-2xl border-2 border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed focus:border-accent focus:outline-none shadow-inner"
              />

              {/* Sample Templates Quick-Load */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Quick Sample Templates:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlCodeText(SAMPLE_VISUAL_TEST);
                      setHtmlRenderWidth(860);
                      setHtmlRenderHeight(740);
                      setHtmlBgColor("auto");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    ✨ Visual QA Test
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlCodeText(SAMPLE_OG_CARD);
                      setHtmlRenderWidth(1200);
                      setHtmlRenderHeight(630);
                      setHtmlBgColor("#0f172a");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    OG Card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlCodeText(SAMPLE_BADGE);
                      setHtmlRenderWidth(600);
                      setHtmlRenderHeight(300);
                      setHtmlBgColor("#0f172a");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Product Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlCodeText(SAMPLE_INVOICE);
                      setHtmlRenderWidth(800);
                      setHtmlRenderHeight(600);
                      setHtmlBgColor("#ffffff");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlCodeText(SAMPLE_CODE_BOX);
                      setHtmlRenderWidth(800);
                      setHtmlRenderHeight(450);
                      setHtmlBgColor("#090d16");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Code Box
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back & Next */}
            <div className="mt-8 flex flex-wrap items-center justify-between w-full gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setHtmlLandingMode("upload")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-background px-6 py-3.5 text-sm font-extrabold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Upload File</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  if (!htmlCodeText.trim()) {
                    toast.error("Please enter or paste HTML code or text before proceeding.");
                    return;
                  }
                  setFile(null);
                  setHtmlInputMode("paste");
                  setProcessing(true);
                  renderHtmlToImage(htmlCodeText, htmlRenderWidth, htmlRenderHeight, htmlBgColor, htmlOutputFormat)
                    .then((dataUrl: any) => {
                      setImageSrc(dataUrl);
                      setDimensions({ width: htmlRenderWidth, height: htmlRenderHeight });
                      setHasProcessed(false);
                      setIsEditingSettings(true);
                      setProcessing(false);
                      toast.success("HTML loaded! Review live preview and settings.");
                    })
                    .catch((err: any) => {
                      setProcessing(false);
                      toast.error("Failed to render HTML. Check your code syntax.");
                      console.error(err);
                    });
                }}
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-3.5 text-base font-black text-background shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : tool.slug === "binary-to-image" && binaryLandingMode === "plain_text" ? (
          /* Plain Text / Binary Code Direct Input Card with Paste & Next Button */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 sm:p-10 w-full max-w-4xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 self-start mb-6 w-full">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
                <Binary className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  Paste or Write Binary / Plain Text
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                  Type or paste raw binary bits (0s &amp; 1s), pixel matrix, or plain text to decode directly into a high-resolution image
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Binary Code / Plain Text Input:
                  </label>
                  {inputConvertText && (
                    <span className="rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-mono font-bold text-accent">
                      {inputConvertText.replace(/[^01]/g, "").length.toLocaleString()} bits
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setInputConvertText(clip);
                          toast.success("Pasted binary text from clipboard!");
                        }
                      } catch {
                        toast.error("Could not read clipboard. Please paste manually.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer shadow-xs"
                    title="Paste from clipboard"
                  >
                    <Copy className="h-3.5 w-3.5 text-accent" />
                    <span>Paste from Clipboard</span>
                  </button>
                  {inputConvertText && (
                    <button
                      type="button"
                      onClick={() => setInputConvertText("")}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={10}
                value={inputConvertText}
                onChange={(e: any) => setInputConvertText(e.target.value)}
                placeholder={`Paste binary bits (e.g. 01001000 01100101... or multiline 1-bit pixel matrix)...\n\nExample:\n00000100000\n00000010000\n00011111000\n00110110100\n11111111111\n10111111101\n10100000101\n00011011000`}
                className="w-full rounded-2xl border-2 border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed focus:border-accent focus:outline-none shadow-inner"
              />

              {/* Sample Templates Quick-Load */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Quick Sample Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputConvertText(SAMPLE_BINARY_INVADER);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    8-Bit Pixel Invader
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputConvertText(SAMPLE_BINARY_HEART);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Retro Heart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputConvertText(SAMPLE_BINARY_IMAGE);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Sample Binary Header
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back & Next */}
            <div className="mt-8 flex flex-wrap items-center justify-between w-full gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setBinaryLandingMode("upload")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-background px-6 py-3.5 text-sm font-extrabold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Upload File</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  if (!inputConvertText.trim()) {
                    toast.error("Please enter or paste binary code or text before proceeding.");
                    return;
                  }
                  setFile(null);
                  setBinaryInputTab("paste");
                  setProcessing(true);
                  const activeTheme = BINARY_THEMES[binaryTheme];
                  const url = decodeBinaryStringToImageUrl(inputConvertText, {
                    color0: activeTheme.bg,
                    color1: activeTheme.fg,
                    pixelScale: binaryPixelBlockSize,
                  });
                  if (url) {
                    setProcessedSrc(url);
                    setImageSrc(url);
                    const img = new Image();
                    img.onload = () => {
                      setDimensions({ width: img.width, height: img.height });
                      setTargetWidth(img.width);
                      setTargetHeight(img.height);
                    };
                    img.src = url;
                    setHasProcessed(false);
                    setIsEditingSettings(true);
                    setProcessing(false);
                    toast.success("Binary loaded! Review live preview and settings.");
                  } else {
                    setProcessing(false);
                    toast.error("Could not decode binary data. Please check format.");
                  }
                }}
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-3.5 text-base font-black text-background shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Decoding...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : [
          "octal-to-image", "hex-to-image", "decimal-to-image", "ascii-to-image",
        ].includes(tool.slug) && textDecoderLandingMode === "plain_text" ? (
          /* Plain Text / Paste Input Card for Text Decoder Tools */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 sm:p-10 w-full max-w-4xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 self-start mb-6 w-full">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  {tool.slug === "octal-to-image"
                    ? "Paste Octal Byte Data"
                    : tool.slug === "hex-to-image"
                      ? "Paste Hexadecimal Byte Data"
                      : tool.slug === "decimal-to-image"
                        ? "Paste Decimal Byte Data"
                        : "Paste ASCII Art / Text"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                  {tool.slug === "octal-to-image"
                    ? "Paste space-separated octal byte values to decode back to an image"
                    : tool.slug === "hex-to-image"
                      ? "Paste hexadecimal byte values (e.g. 89 50 4E 47…) to reconstruct the image"
                      : tool.slug === "decimal-to-image"
                        ? "Paste decimal byte values (e.g. 137 80 78 71…) to decode back to an image"
                        : "Paste ASCII art or plain text to render into a monospace image"}
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Encoded Data Input:
                  </label>
                  {inputConvertText && (
                    <span className="rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-accent">
                      {inputConvertText.trim().split(/\s+/).length.toLocaleString()} tokens · {inputConvertText.length.toLocaleString()} chars
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setInputConvertText(clip);
                          toast.success("Pasted text from clipboard!");
                        }
                      } catch {
                        toast.error("Could not read clipboard. Please paste manually.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer shadow-xs"
                    title="Paste from clipboard"
                  >
                    <Copy className="h-3.5 w-3.5 text-accent" />
                    <span>Paste from Clipboard</span>
                  </button>
                  {inputConvertText && (
                    <button
                      type="button"
                      onClick={() => setInputConvertText("")}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={10}
                value={inputConvertText}
                onChange={(e: any) => setInputConvertText(e.target.value)}
                placeholder={
                  tool.slug === "octal-to-image"
                    ? "Paste space-separated octal values (e.g. 137 120 116 107 15 12 32 12...)"
                    : tool.slug === "hex-to-image"
                      ? "Paste hexadecimal byte string (e.g. 89 50 4E 47 0D 0A 1A 0A...)"
                      : tool.slug === "decimal-to-image"
                        ? "Paste decimal byte numbers (e.g. 137 80 78 71 13 10 26 10...)"
                        : "Paste ASCII art or plain text here...\n\nExample:\n  _____\n |     |\n | o o |\n |  ^  |\n | \\_/ |\n |_____|\n"
                }
                className="w-full rounded-2xl border-2 border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed focus:border-accent focus:outline-none shadow-inner"
              />
            </div>

            {/* Action Buttons: Back & Next */}
            <div className="mt-8 flex flex-wrap items-center justify-between w-full gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setTextDecoderLandingMode("upload");
                  setInputConvertText("");
                  setFile(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-background px-6 py-3.5 text-sm font-extrabold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Upload File</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  if (!inputConvertText.trim()) {
                    toast.error("Please enter or paste data before proceeding.");
                    return;
                  }
                  setFile(null);
                  setProcessing(true);
                  try {
                    let url: string | null = null;
                    if (tool.slug === "octal-to-image") {
                      const octs = inputConvertText.trim().split(/\s+/);
                      const bytes = new Uint8Array(octs.map((o: any) => parseInt(o, 8)).filter((n: any) => !isNaN(n)));
                      const blob = new Blob([bytes], { type: "image/png" });
                      url = URL.createObjectURL(blob);
                    } else if (tool.slug === "hex-to-image") {
                      const clean = inputConvertText.replace(/[^0-9a-fA-F]/g, "");
                      const pairs = clean.match(/.{1,2}/g) || [];
                      const bytes = new Uint8Array(pairs.map((h: any) => parseInt(h, 16)));
                      const blob = new Blob([bytes], { type: "image/png" });
                      url = URL.createObjectURL(blob);
                    } else if (tool.slug === "decimal-to-image") {
                      const decs = inputConvertText.trim().split(/[\s,]+/);
                      const bytes = new Uint8Array(decs.map((d: any) => parseInt(d, 10)).filter((n: any) => !isNaN(n)));
                      const blob = new Blob([bytes], { type: "image/png" });
                      url = URL.createObjectURL(blob);
                    } else if (tool.slug === "ascii-to-image") {
                      const decodedUrl = tryDecodeAsciiToOriginalImage(inputConvertText);
                      url = decodedUrl || renderAsciiToImage(inputConvertText);
                    }
                    if (url) {
                      setImageSrc(url);
                      setProcessedSrc(url);
                      const img = new Image();
                      img.onload = () => {
                        setDimensions({ width: img.width, height: img.height });
                        setTargetWidth(img.width);
                        setTargetHeight(img.height);
                      };
                      img.src = url;
                      setHasProcessed(false);
                      setIsEditingSettings(true);
                      setProcessing(false);
                      toast.success("Decoded! Review the preview and settings below.");
                    } else {
                      setProcessing(false);
                      toast.error("Could not decode input data. Please check format.");
                    }
                  } catch (err) {
                    setProcessing(false);
                    toast.error("Failed to decode. Please check the input format.");
                  }
                }}
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-3.5 text-base font-black text-background shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Decoding...</span>
                  </>
                ) : (
                  <>
                    <span>Next → Preview</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : tool.slug === "base64-to-image" && base64LandingMode === "plain_text" ? (
          /* Plain Text / Base64 Direct Input Card with Next Button */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 sm:p-10 w-full max-w-4xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 self-start mb-6 w-full">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  Paste Base64 Code or Plain Text
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                  Paste Data URI (data:image/...) or raw Base64 string to decode instantly into a preview &amp; image file
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Base64 String / Plain Text Input:
                  </label>
                  {base64InputText && (
                    <span className="rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-accent">
                      {base64InputText.replace(/[\r\n\t\s]+/g, "").length.toLocaleString()} chars (~{Math.max(1, Math.round((base64InputText.replace(/[\r\n\t\s]+/g, "").length * 3) / 1024))} KB)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setBase64InputText(clip);
                          toast.success("Pasted Base64 text from clipboard!");
                        }
                      } catch {
                        toast.error("Could not read clipboard. Please paste manually.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all cursor-pointer shadow-xs"
                    title="Paste from clipboard"
                  >
                    <Copy className="h-3.5 w-3.5 text-accent" />
                    <span>Paste from Clipboard</span>
                  </button>
                  {base64InputText && (
                    <button
                      type="button"
                      onClick={() => setBase64InputText("")}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={10}
                value={base64InputText}
                onChange={(e: any) => setBase64InputText(e.target.value)}
                placeholder={`Paste Base64 string or Data URI here...\n\nExamples:\ndata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...\nor raw Base64 string:\niVBORw0KGgoAAAANSUhEUgAA...`}
                className="w-full rounded-2xl border-2 border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed focus:border-accent focus:outline-none shadow-inner"
              />

              {/* Sample Presets Quick-Load */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Quick Sample Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBase64InputText(SAMPLE_BASE64_STAR);
                      toast.info("Loaded Sample Star Icon Base64");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Sample Star Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBase64InputText(SAMPLE_BASE64_GRADIENT_ICON);
                      toast.info("Loaded Sample Badge Base64");
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:border-accent hover:text-accent transition-all cursor-pointer"
                  >
                    Sample Badge Icon
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back & Next */}
            <div className="mt-8 flex flex-wrap items-center justify-between w-full gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setBase64LandingMode("upload")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-background px-6 py-3.5 text-sm font-extrabold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Upload File</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  if (!base64InputText.trim()) {
                    toast.error("Please enter or paste Base64 text before proceeding.");
                    return;
                  }
                  setFile(null);
                  decodeAndApplyBase64(base64InputText);
                }}
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-3.5 text-base font-black text-background shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Decoding...</span>
                  </>
                ) : (
                  <>
                    <span>Next → Preview</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Standalone Centered Drag & Drop Upload Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group cursor-pointer flex flex-col items-center justify-center text-center rounded-3xl border-3 border-dashed px-8 py-24 sm:py-32 w-full transition-all duration-300 ${isDraggingFile
                ? "border-accent bg-accent/10 scale-[1.01] shadow-2xl"
                : "border-border bg-card/60 hover:border-foreground hover:bg-card shadow-lg"
              }`}
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl transition-all group-hover:scale-110">
              <Upload className="h-10 w-10" />
              <span className="absolute -inset-1 rounded-3xl bg-foreground/20 blur-lg animate-pulse" />
            </div>

            <h2 className="mt-8 font-display text-3xl font-extrabold md:text-4xl text-foreground">
              {tool.slug === "html-to-image"
                ? "Select HTML File or Drag & Drop HTML Here"
                : tool.slug === "binary-to-image"
                  ? "Select Binary (.bin) or Text (.txt) File or Drag & Drop Here"
                  : tool.slug === "base64-to-image"
                    ? "Select Base64 Text (.txt) File or Drag & Drop Here"
                    : tool.slug === "octal-to-image"
                      ? "Upload Octal Text File or Drag & Drop Here"
                      : tool.slug === "hex-to-image"
                        ? "Upload Hex Text File or Drag & Drop Here"
                        : tool.slug === "decimal-to-image"
                          ? "Upload Decimal Text File or Drag & Drop Here"
                          : tool.slug === "ascii-to-image"
                            ? "Upload ASCII Text File or Drag & Drop Here"
                            : tool.slug === "pdf-to-image"
                              ? "Select PDF File or Drag & Drop PDF Here"
                              : tool.slug === "word-to-image"
                                ? "Select Word Document (.docx) or Drag & Drop Here"
                                : tool.slug === "excel-to-image"
                                  ? "Select Excel Spreadsheet (.xlsx) or Drag & Drop Here"
                                  : tool.slug === "powerpoint-to-image"
                                    ? "Select PowerPoint (.pptx) or Drag & Drop Here"
                                    : tool.slug === "rotate-image"
                                      ? "Select Image(s) or Drag & Drop Multiple Images Here"
                                      : "Select File or Drag & Drop Image Here"}
            </h2>

            <p className="mt-3 max-w-md text-sm font-semibold text-muted-foreground md:text-base">
              Accepts <span className="font-extrabold text-foreground">{tool.accepts}</span> · Returns{" "}
              <span className="font-extrabold text-foreground">{tool.outputs}</span>
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={(e: any) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 sm:px-10 py-4 sm:py-5 text-base font-extrabold text-background shadow-2xl transition-all hover:scale-105 cursor-pointer"
              >
                {tool.slug === "html-to-image"
                  ? "Select HTML File"
                  : tool.slug === "binary-to-image"
                    ? "Select Binary / Text File"
                    : tool.slug === "base64-to-image"
                      ? "Select Base64 File (.txt)"
                      : ["octal-to-image", "hex-to-image", "decimal-to-image", "ascii-to-image"].includes(tool.slug)
                        ? "Upload Text File (.txt)"
                        : tool.slug === "pdf-to-image"
                          ? "Select PDF File"
                          : tool.slug === "word-to-image"
                            ? "Select Word Document"
                            : tool.slug === "excel-to-image"
                              ? "Select Excel Spreadsheet"
                              : tool.slug === "powerpoint-to-image"
                                ? "Select PowerPoint Presentation"
                                : tool.slug === "rotate-image"
                                  ? "Select Images (Batch Supported)"
                                  : "Select Image File"}{" "}
                <span aria-hidden>→</span>
              </button>

              {tool.slug === "html-to-image" && (
                <button
                  type="button"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setHtmlLandingMode("plain_text");
                    setHtmlCodeText("");
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-7 py-4 sm:py-5 text-sm sm:text-base font-extrabold text-foreground shadow-lg hover:border-foreground hover:bg-secondary transition-all hover:scale-105 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span>Plain Text Option</span>
                </button>
              )}

              {tool.slug === "binary-to-image" && (
                <button
                  type="button"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setBinaryLandingMode("plain_text");
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-7 py-4 sm:py-5 text-sm sm:text-base font-extrabold text-foreground shadow-lg hover:border-foreground hover:bg-secondary transition-all hover:scale-105 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span>Paste Plain Text / Binary</span>
                </button>
              )}

              {tool.slug === "base64-to-image" && (
                <button
                  type="button"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setBase64LandingMode("plain_text");
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-7 py-4 sm:py-5 text-sm sm:text-base font-extrabold text-foreground shadow-lg hover:border-foreground hover:bg-secondary transition-all hover:scale-105 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span>Paste Plain Text / Base64</span>
                </button>
              )}

              {["octal-to-image", "hex-to-image", "decimal-to-image", "ascii-to-image"].includes(tool.slug) && (
                <button
                  type="button"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setTextDecoderLandingMode("plain_text");
                    setInputConvertText("");
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-7 py-4 sm:py-5 text-sm sm:text-base font-extrabold text-foreground shadow-lg hover:border-foreground hover:bg-secondary transition-all hover:scale-105 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span>Paste Plain Text</span>
                </button>
              )}
            </div>

            <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Enterprise-grade security &amp; privacy · Safe File Processing</span>
            </p>
          </div>
        )
    </>
  );
}
