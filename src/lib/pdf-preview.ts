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
