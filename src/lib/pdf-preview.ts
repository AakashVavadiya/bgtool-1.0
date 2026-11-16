import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let pdfjsInstance: typeof import("pdfjs-dist") | null = null;

export async function getPdfJs() {
  if (!pdfjsInstance) {
    const pdfjs = await import("pdfjs-dist");
    try {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }
    } catch {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
      } catch (e) {
        console.warn("Could not set PDF worker URL:", e);
      }
    }
    pdfjsInstance = pdfjs;
  }
  return pdfjsInstance;
}

export interface RenderPdfResult {
  dataUrl: string;
  totalPages: number;
  pageNumber: number;
  width: number;
  height: number;
  isPasswordProtected?: boolean;
  error?: string;
}

const thumbnailCache = new Map<string, { thumbnailUrl: string; totalPages: number }>();

/**
 * Render a single page from a PDF ArrayBuffer to an image data URL
 */
export async function renderPdfPage(
  buffer: ArrayBuffer,
  pageNumber: number = 1,
  scale: number = 1.5,
  password?: string
): Promise<RenderPdfResult> {
  try {
    const pdfjs = await getPdfJs();
    const copy = buffer.slice(0);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(copy),
      password: password || undefined,
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/standard_fonts/`,
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("PDF render timeout")), 15000)
    );

    let pdfDoc;
    try {
      pdfDoc = await Promise.race([loadingTask.promise, timeout]);
    } catch (err: any) {
      if (
        err?.name === "PasswordException" ||
        err?.code === 1 ||
        err?.code === 2 ||
        err?.message?.toLowerCase().includes("password")
      ) {
        return {
          dataUrl: generateLockedFallbackCanvas(),
          totalPages: 1,
          pageNumber: 1,
          width: 600,
          height: 800,
          isPasswordProtected: true,
          error: "Password protected PDF",
        };
      }
      throw err;
    }

    const totalPages = Math.max(1, pdfDoc.numPages || 1);
    const safePageNum = Math.min(Math.max(1, pageNumber), totalPages);
    const page = await pdfDoc.getPage(safePageNum);

    const safeScale = Math.max(0.5, Math.min(3.0, scale));
    const viewport = page.getViewport({ scale: safeScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(10, Math.round(viewport.width));
    canvas.height = Math.max(10, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        intent: "display",
      } as any);
      await renderTask.promise;
    } catch (renderErr) {
      console.warn("Display intent render failed, attempting print fallback:", renderErr);
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        intent: "print",
      } as any);
      await renderTask.promise;
    }

    const dataUrl = canvas.toDataURL("image/webp", 0.92);
    return {
      dataUrl,
      totalPages,
      pageNumber: safePageNum,
      width: canvas.width,
      height: canvas.height,
      isPasswordProtected: false,
    };
  } catch (err: any) {
    console.error("renderPdfPage error:", err);
    return {
      dataUrl: generateGenericFallbackCanvas("PDF Preview Unavailable"),
      totalPages: 1,
      pageNumber: 1,
      width: 600,
      height: 800,
      error: err?.message || "Failed to render PDF page",
    };
  }
}

/**
 * Generate a quick thumbnail of page 1 for a PDF or Image file
 */
export async function generateFileThumbnail(
  file: File,
  buffer: ArrayBuffer,
  cacheKey?: string
): Promise<{ thumbnailUrl: string; totalPages: number }> {
  if (cacheKey && thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  // Handle images directly
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = { thumbnailUrl: reader.result as string, totalPages: 1 };
        if (cacheKey) thumbnailCache.set(cacheKey, res);
        resolve(res);
      };
      reader.onerror = () => {
        const fallback = { thumbnailUrl: generateGenericFallbackCanvas(file.name), totalPages: 1 };
        resolve(fallback);
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle PDF documents
  try {
    const rendered = await renderPdfPage(buffer, 1, 0.75);
    const result = {
      thumbnailUrl: rendered.dataUrl,
      totalPages: rendered.totalPages,
    };
    if (cacheKey) thumbnailCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("Could not generate PDF thumbnail:", err);
    const fallback = { thumbnailUrl: generateGenericFallbackCanvas(file.name), totalPages: 1 };
    return fallback;
  }
}

function generateLockedFallbackCanvas(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 400, 540);

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(160, 200, 80, 70, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(200, 230, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(198, 230, 4, 16);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Protected PDF", 200, 310);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Unlock to preview document", 200, 335);

  return canvas.toDataURL("image/png");
}

function generateGenericFallbackCanvas(label: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 400, 540);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 360, 500);

  // PDF icon header
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.roundRect(160, 180, 80, 90, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PDF", 200, 235);

  ctx.fillStyle = "#334155";
  ctx.font = "bold 13px sans-serif";
  const truncated = label.length > 25 ? label.slice(0, 22) + "..." : label;
  ctx.fillText(truncated, 200, 310);

  return canvas.toDataURL("image/png");
}

export type DetectedPdfFontName =
  | "Helvetica"
  | "Helvetica-Bold"
  | "Helvetica-Oblique"
  | "Helvetica-BoldOblique"
  | "Times-Roman"
  | "Times-Bold"
  | "Times-Italic"
  | "Times-BoldItalic"
  | "Courier"
  | "Courier-Bold"
  | "Courier-Oblique"
  | "Courier-BoldOblique";

export interface ExtractedPdfTextItem {
  id: string;
  pageNumber: number;
  text: string;
  xPercent: number;
  yPercent: number;
  baselineYPercent: number;
  widthPercent: number;
  heightPercent: number;
  fontSize: number; // Exact PDF points (can be fractional like 9.5)
  fontFamily: DetectedPdfFontName;
  color: string; // Sampled ink hex color
  bgColor: string; // Sampled background hex color
}

export interface ExtractedPdfImageItem {
  id: string;
  pageNumber: number;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  imageDataUrl: string;
  bgColor: string;
}

export interface ExtractedPdfPageResult {
  dataUrl: string;
  width: number;
  height: number;
  pageWidthPts: number;
  pageHeightPts: number;
  textItems: ExtractedPdfTextItem[];
  imageItems: ExtractedPdfImageItem[];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function detectStandardPdfFont(
  fontName: string,
  cssFamily: string,
  isCanvasBold: boolean = false
): DetectedPdfFontName {
  const rawName = fontName.toLowerCase();
  // Remove "sans-serif" before checking for serif so "sans-serif" never triggers serif!
  const cleanedCss = cssFamily.toLowerCase().replace(/sans-serif/g, "sans");
  const combined = `${rawName} ${cleanedCss}`;

  const isBold =
    isCanvasBold ||
    /bold|black|heavy|demi|semibold|extrabold|\bbd\b|[-_,]b\b/.test(combined);
  const isItalic = /italic|oblique|slant|\bit\b/.test(combined);
  const isMono = /courier|mono|consolas|menlo|fixed|code|typewriter/.test(combined);
  // Only use Times-Roman when an explicit serif font family is named in the PDF font
  const isSerif =
    !isMono &&
    /times|georgia|garamond|cambria|minion|palatino|baskerville|bookman|centur/.test(rawName);

  if (isMono) {
    if (isBold && isItalic) return "Courier-BoldOblique";
    if (isBold) return "Courier-Bold";
    if (isItalic) return "Courier-Oblique";
    return "Courier";
  }
  if (isSerif) {
    if (isBold && isItalic) return "Times-BoldItalic";
    if (isBold) return "Times-Bold";
    if (isItalic) return "Times-Italic";
    return "Times-Roman";
  }
  if (isBold && isItalic) return "Helvetica-BoldOblique";
  if (isBold) return "Helvetica-Bold";
  if (isItalic) return "Helvetica-Oblique";
  return "Helvetica";
}

function sampleBoxColors(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  pxX: number,
  pxY: number,
  pxW: number,
  pxH: number
): { textColor: string; bgColor: string; isBoldStroke: boolean } {
  try {
    const sx = Math.max(0, Math.min(canvasW - 2, Math.floor(pxX)));
    const sy = Math.max(0, Math.min(canvasH - 2, Math.floor(pxY)));
    const sw = Math.max(2, Math.min(canvasW - sx, Math.ceil(pxW)));
    const sh = Math.max(2, Math.min(canvasH - sy, Math.ceil(pxH)));
    const imgData = ctx.getImageData(sx, sy, sw, sh).data;

    // Find brightest paper pixel (avoiding dark ink pixels that would turn white paper into gray!)
    let bestBright = -1;
    let bgR = 255, bgG = 255, bgB = 255;
    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i] ?? 255;
      const g = imgData[i + 1] ?? 255;
      const b = imgData[i + 2] ?? 255;
      const lum = r + g + b;
      if (lum > bestBright) {
        bestBright = lum;
        bgR = r;
        bgG = g;
        bgB = b;
      }
    }

    // Snap near-white paper backgrounds to pure #ffffff so no gray box ever appears
    if (bgR >= 220 && bgG >= 220 && bgB >= 220) {
      bgR = 255;
      bgG = 255;
      bgB = 255;
    }

    // Find darkest/highest-contrast ink pixels and measure stroke density for bold detection
    let bestDist = 0;
    let inkR = 15, inkG = 23, inkB = 42;
    let inkPixels = 0;
    let totalSampled = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i] ?? 255;
      const g = imgData[i + 1] ?? 255;
      const b = imgData[i + 2] ?? 255;
      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      totalSampled++;
      if (dist > 140) {
        inkPixels++;
      }
      if (dist > bestDist && dist > 80) {
        bestDist = dist;
        inkR = r;
        inkG = g;
        inkB = b;
      }
    }

    // Snap near-black ink to crisp dark ink
    if (inkR <= 55 && inkG <= 55 && inkB <= 55) {
      inkR = 15;
      inkG = 23;
      inkB = 42;
    }

    const inkRatio = totalSampled > 0 ? inkPixels / totalSampled : 0;
    const isBoldStroke = inkRatio > 0.255;

    return {
      textColor: rgbToHex(inkR, inkG, inkB),
      bgColor: rgbToHex(bgR, bgG, bgB),
      isBoldStroke,
    };
  } catch {
    return { textColor: "#0f172a", bgColor: "#ffffff", isBoldStroke: false };
  }
}

function multiplyTransform(m1: number[], m2: number[]): number[] {
  const a1 = m1[0] ?? 1, b1 = m1[1] ?? 0, c1 = m1[2] ?? 0, d1 = m1[3] ?? 1, e1 = m1[4] ?? 0, f1 = m1[5] ?? 0;
  const a2 = m2[0] ?? 1, b2 = m2[1] ?? 0, c2 = m2[2] ?? 0, d2 = m2[3] ?? 1, e2 = m2[4] ?? 0, f2 = m2[5] ?? 0;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/**
 * Extract all interactive text blocks and embedded photos/graphics from a PDF page
 * so the user can edit existing text in-place (with matching font, size, and color)
 * and select, move, resize, or shape existing photos like an interactive form.
 */
export async function extractPdfPageElements(
  buffer: ArrayBuffer,
  pageNumber: number = 1,
  scale: number = 2.0
): Promise<ExtractedPdfPageResult> {
  const pdfjs = await getPdfJs();
  const copy = buffer.slice(0);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(copy),
    useSystemFonts: true,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/standard_fonts/`,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = Math.max(1, pdfDoc.numPages || 1);
  const safePageNum = Math.min(Math.max(1, pageNumber), totalPages);
  const page = await pdfDoc.getPage(safePageNum);

  const baseViewport = page.getViewport({ scale: 1.0 });
  const pageWidthPts = Math.max(1, baseViewport.width);
  const pageHeightPts = Math.max(1, baseViewport.height);

  const safeScale = Math.max(1.0, Math.min(3.0, scale));
  const viewport = page.getViewport({ scale: safeScale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(10, Math.round(viewport.width));
  canvas.height = Math.max(10, Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    intent: "display",
  } as any).promise;

  const dataUrl = canvas.toDataURL("image/webp", 0.94);

  // 1. EXTRACT & GROUP TEXT ELEMENTS
  const textItems: ExtractedPdfTextItem[] = [];
  try {
    const textContent = await page.getTextContent();
    const styles = (textContent.styles || {}) as Record<string, { fontFamily?: string }>;

    interface RawSpan {
      str: string;
      xPts: number;
      yBaselinePts: number;
      widthPts: number;
      fontSizePts: number;
      fontName: string;
      cssFamily: string;
    }

    const rawSpans: RawSpan[] = [];
    for (const rawItem of textContent.items as any[]) {
      if (!rawItem || typeof rawItem.str !== "string" || !rawItem.str.trim()) continue;
      const tr = rawItem.transform || [12, 0, 0, 12, 0, 0];
      const fontSizePts = Math.max(6, Math.min(72, Math.round((Math.hypot(tr[0], tr[1]) || rawItem.height || 12) * 10) / 10));
      const xPts = Number(tr[4]) || 0;
      const yBaselinePts = Number(tr[5]) || 0;
      const widthPts = Math.max(fontSizePts * 0.5, Number(rawItem.width) || rawItem.str.length * fontSizePts * 0.52);
      const fontName = String(rawItem.fontName || "");
      const cssFamily = String(styles[fontName]?.fontFamily || "");

      rawSpans.push({
        str: rawItem.str,
        xPts,
        yBaselinePts,
        widthPts,
        fontSizePts,
        fontName,
        cssFamily,
      });
    }

    // Sort top-to-bottom (higher yBaselinePts first), then left-to-right
    rawSpans.sort((a, b) => {
      if (Math.abs(b.yBaselinePts - a.yBaselinePts) > 3) {
        return b.yBaselinePts - a.yBaselinePts;
      }
      return a.xPts - b.xPts;
    });

    // Merge spans on the same baseline ONLY when they share the exact same font and have a kerning/word gap (never across columns!)
    const mergedSpans: RawSpan[] = [];
    for (const span of rawSpans) {
      const prev = mergedSpans[mergedSpans.length - 1];
      const startsWithColon = /^\s*:\s*/.test(span.str);
      if (
        prev &&
        !startsWithColon &&
        prev.fontName === span.fontName &&
        Math.abs(prev.yBaselinePts - span.yBaselinePts) <= 1.8 &&
        Math.abs(prev.fontSizePts - span.fontSizePts) <= 1.2 &&
        span.xPts >= prev.xPts - 1 &&
        span.xPts - (prev.xPts + prev.widthPts) <= prev.fontSizePts * 0.38
      ) {
        const gap = span.xPts - (prev.xPts + prev.widthPts);
        const needsSpace = gap > prev.fontSizePts * 0.14 && !prev.str.endsWith(" ") && !span.str.startsWith(" ");
        prev.str = prev.str + (needsSpace ? " " : "") + span.str;
        prev.widthPts = Math.max(prev.widthPts, span.xPts + span.widthPts - prev.xPts);
      } else {
        mergedSpans.push({ ...span });
      }
    }

    mergedSpans.forEach((span, idx) => {
      // Tight glyph box: ascenders (~0.77 * fontSize) to descenders (~0.13 * fontSize) so adjacent lines are never clipped
      const topYPts = Math.max(0, pageHeightPts - span.yBaselinePts - span.fontSizePts * 0.77);
      const heightPts = span.fontSizePts * 0.90;
      const baselineTopPts = Math.max(0, pageHeightPts - span.yBaselinePts);

      const xPercent = Math.max(0, Math.min(98, (span.xPts / pageWidthPts) * 100));
      const yPercent = Math.max(0, Math.min(98, (topYPts / pageHeightPts) * 100));
      const baselineYPercent = Math.max(0, Math.min(99, (baselineTopPts / pageHeightPts) * 100));
      const widthPercent = Math.max(1.2, Math.min(100 - xPercent, (span.widthPts / pageWidthPts) * 100));
      const heightPercent = Math.max(0.9, Math.min(100 - yPercent, (heightPts / pageHeightPts) * 100));

      const pxX = (xPercent / 100) * canvas.width;
      const pxY = (yPercent / 100) * canvas.height;
      const pxW = (widthPercent / 100) * canvas.width;
      const pxH = (heightPercent / 100) * canvas.height;

      const { textColor, bgColor, isBoldStroke } = sampleBoxColors(ctx, canvas.width, canvas.height, pxX, pxY, pxW, pxH);
      const detectedFont = detectStandardPdfFont(span.fontName, span.cssFamily, isBoldStroke);

      textItems.push({
        id: `pdf-txt-${safePageNum}-${idx}`,
        pageNumber: safePageNum,
        text: span.str,
        xPercent,
        yPercent,
        baselineYPercent,
        widthPercent,
        heightPercent,
        fontSize: Math.round(span.fontSizePts * 2) / 2,
        fontFamily: detectedFont,
        color: textColor,
        bgColor,
      });
    });
  } catch (txtErr) {
    console.warn("Could not extract PDF text layer:", txtErr);
  }

  // 2. EXTRACT EMBEDDED PHOTO / IMAGE REGIONS
  const imageItems: ExtractedPdfImageItem[] = [];
  try {
    const opList = await page.getOperatorList();
    const OPS = pdfjs.OPS;
    const ctmStack: number[][] = [];
    let currentCtm: number[] = [1, 0, 0, 1, 0, 0];
    const detectedBoxes: Array<{ xPercent: number; yPercent: number; widthPercent: number; heightPercent: number }> = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === OPS.save) {
        ctmStack.push([...currentCtm]);
      } else if (fn === OPS.restore) {
        if (ctmStack.length > 0) {
          currentCtm = ctmStack.pop()!;
        }
      } else if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
        currentCtm = multiplyTransform(currentCtm, args as number[]);
      } else if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        (OPS as any).paintJpegXObject === fn
      ) {
        const wPts = Math.hypot(currentCtm[0] ?? 0, currentCtm[1] ?? 0);
        const hPts = Math.hypot(currentCtm[2] ?? 0, currentCtm[3] ?? 0);
        const ePts = currentCtm[4] ?? 0;
        const fPts = currentCtm[5] ?? 0;

        const minXPts = Math.min(ePts, ePts + (currentCtm[0] ?? 0), ePts + (currentCtm[2] ?? 0));
        const maxYPts = Math.max(fPts, fPts + (currentCtm[3] ?? 0), fPts + (currentCtm[1] ?? 0));
        const topYPts = pageHeightPts - maxYPts;

        const xPercent = Math.max(0, Math.min(95, (minXPts / pageWidthPts) * 100));
        const yPercent = Math.max(0, Math.min(95, (topYPts / pageHeightPts) * 100));
        const widthPercent = Math.max(3, Math.min(100 - xPercent, (wPts / pageWidthPts) * 100));
        const heightPercent = Math.max(3, Math.min(100 - yPercent, (hPts / pageHeightPts) * 100));

        // Ignore tiny 1x1 spacer icons
        if (widthPercent >= 3 && heightPercent >= 3) {
          const isDuplicate = detectedBoxes.some(
            (b) =>
              Math.abs(b.xPercent - xPercent) < 2 &&
              Math.abs(b.yPercent - yPercent) < 2 &&
              Math.abs(b.widthPercent - widthPercent) < 2 &&
              Math.abs(b.heightPercent - heightPercent) < 2
          );
          if (!isDuplicate) {
            detectedBoxes.push({ xPercent, yPercent, widthPercent, heightPercent });
          }
        }
      }
    }

    // If the page is a single full-bleed image (e.g. a product photo on white background),
    // automatically tighten the bounding box around the non-white foreground object so the user can move/shape the photo!
    if (
      detectedBoxes.length === 1 &&
      detectedBoxes[0]!.widthPercent > 90 &&
      detectedBoxes[0]!.heightPercent > 90
    ) {
      const tightBox = findForegroundSubjectBox(ctx, canvas.width, canvas.height);
      if (tightBox) {
        detectedBoxes[0] = tightBox;
      }
    } else if (detectedBoxes.length === 0 && textItems.length === 0) {
      const tightBox = findForegroundSubjectBox(ctx, canvas.width, canvas.height);
      if (tightBox) {
        detectedBoxes.push(tightBox);
      }
    }

    detectedBoxes.slice(0, 15).forEach((box, idx) => {
      const cropUrl = cropCanvasRegion(canvas, box.xPercent, box.yPercent, box.widthPercent, box.heightPercent);
      if (cropUrl) {
        imageItems.push({
          id: `pdf-img-${safePageNum}-${idx}`,
          pageNumber: safePageNum,
          label: `Photo #${idx + 1}`,
          xPercent: box.xPercent,
          yPercent: box.yPercent,
          widthPercent: box.widthPercent,
          heightPercent: box.heightPercent,
          imageDataUrl: cropUrl,
          bgColor: "#ffffff",
        });
      }
    });
  } catch (imgErr) {
    console.warn("Could not extract PDF image objects:", imgErr);
  }

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    pageWidthPts,
    pageHeightPts,
    textItems,
    imageItems,
  };
}

function findForegroundSubjectBox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number } | null {
  try {
    const imgData = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let foundPixels = 0;
    const step = 4;

    for (let y = 4; y < h - 4; y += step) {
      for (let x = 4; x < w - 4; x += step) {
        const idx = (y * w + x) * 4;
        const r = imgData[idx] ?? 255;
        const g = imgData[idx + 1] ?? 255;
        const b = imgData[idx + 2] ?? 255;
        // Non-white foreground pixel check
        if (r < 244 || g < 244 || b < 244) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          foundPixels++;
        }
      }
    }

    if (foundPixels < 20 || maxX <= minX || maxY <= minY) return null;

    const padX = Math.round(w * 0.015);
    const padY = Math.round(h * 0.015);
    minX = Math.max(0, minX - padX);
    minY = Math.max(0, minY - padY);
    maxX = Math.min(w, maxX + padX);
    maxY = Math.min(h, maxY + padY);

    const xPercent = (minX / w) * 100;
    const yPercent = (minY / h) * 100;
    const widthPercent = ((maxX - minX) / w) * 100;
    const heightPercent = ((maxY - minY) / h) * 100;

    if (widthPercent > 96 && heightPercent > 96) return null;
    return { xPercent, yPercent, widthPercent, heightPercent };
  } catch {
    return null;
  }
}

function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number
): string {
  const sx = Math.max(0, Math.round((xPercent / 100) * sourceCanvas.width));
  const sy = Math.max(0, Math.round((yPercent / 100) * sourceCanvas.height));
  const sw = Math.max(4, Math.min(sourceCanvas.width - sx, Math.round((widthPercent / 100) * sourceCanvas.width)));
  const sh = Math.max(4, Math.min(sourceCanvas.height - sy, Math.round((heightPercent / 100) * sourceCanvas.height)));

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d");
  if (!outCtx) return "";
  outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL("image/png");
}

/**
 * Crop an arbitrary rectangular region from a rendered page dataUrl so the user can
 * drag-select any photo or diagram on the PDF page and turn it into a shapeable Photo Layer.
 */
export async function cropRegionFromPageDataUrl(
  pageDataUrl: string,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number
): Promise<{ imageDataUrl: string; bgColor: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ imageDataUrl: "", bgColor: "#ffffff" });
        return;
      }
      ctx.drawImage(img, 0, 0);
      const sampled = sampleBoxColors(
        ctx,
        canvas.width,
        canvas.height,
        xPercent,
        yPercent,
        widthPercent,
        heightPercent
      );
      resolve({
        imageDataUrl: cropCanvasRegion(canvas, xPercent, yPercent, widthPercent, heightPercent),
        bgColor: sampled.bgColor,
      });
    };
    img.onerror = () => resolve({ imageDataUrl: "", bgColor: "#ffffff" });
    img.src = pageDataUrl;
  });
}
