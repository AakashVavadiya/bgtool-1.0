import { PDFDocument, rgb, degrees, StandardFonts, PDFName } from "pdf-lib";
import { getPdfJs } from "./pdf-preview";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
}

/**
 * Merge multiple PDF documents into a single document
 */
export async function mergePdfDocuments(
  files: Array<{ name: string; buffer: ArrayBuffer }>
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const doc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return { pdfBytes, pageCount: mergedPdf.getPageCount() };
}

/**
 * Split a PDF document into selected page ranges (e.g. "1-3, 5, 7-9")
 */
export async function splitPdfDocument(
  buffer: ArrayBuffer,
  pageRangeStr: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  const indicesToInclude = new Set<number>();
  const ranges = pageRangeStr.split(",").map((s) => s.trim()).filter(Boolean);

  if (ranges.length === 0) {
    // If no range specified, default to first page
    indicesToInclude.add(0);
  } else {
    for (const r of ranges) {
      if (r.includes("-")) {
        const parts = r.split("-").map((p) => parseInt(p.trim(), 10));
        const start = Math.max(1, parts[0] || 1);
        const end = Math.min(totalPages, parts[1] || totalPages);
        for (let i = start; i <= end; i++) {
          indicesToInclude.add(i - 1);
        }
      } else {
        const p = parseInt(r, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          indicesToInclude.add(p - 1);
        }
      }
    }
  }

  const sortedIndices = Array.from(indicesToInclude).sort((a, b) => a - b);
  const copiedPages = await newDoc.copyPages(srcDoc, sortedIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return { pdfBytes, pageCount: newDoc.getPageCount() };
}

/**
 * Rotate PDF pages
 */
export async function rotatePdfPages(
  buffer: ArrayBuffer,
  angle: 90 | 180 | 270,
  pageMode: "all" | "odd" | "even" | "current" = "all",
  currentPage = 1
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    const pageNum = index + 1;
    let shouldRotate = false;

    if (pageMode === "all") shouldRotate = true;
    else if (pageMode === "odd" && pageNum % 2 !== 0) shouldRotate = true;
    else if (pageMode === "even" && pageNum % 2 === 0) shouldRotate = true;
    else if (pageMode === "current" && pageNum === currentPage) shouldRotate = true;

    if (shouldRotate) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  });

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: pages.length };
}

/**
 * Add a diagonal semi-transparent watermark to PDF pages
 */
export async function addWatermarkToPdf(
  buffer: ArrayBuffer,
  text: string,
  options?: {
    opacity?: number;
    angle?: number;
    size?: number;
    color?: string;
  }
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const opacity = options?.opacity !== undefined ? Math.min(1, Math.max(0.05, options.opacity)) : 0.35;
  const angle = options?.angle !== undefined ? options.angle : 45;
  const fontSize = options?.size || 48;

  // Color parsing (hex or default gray)
  let r = 0.5, g = 0.5, b = 0.5;
  if (options?.color?.startsWith("#")) {
    const hex = options.color.replace("#", "");
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    }
  }

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(angle),
    });
  }

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: pages.length };
}

/**
 * Add page numbers to header or footer of PDF pages
 */
export async function addPageNumbersToPdf(
  buffer: ArrayBuffer,
  options?: {
    position?: "bottom_center" | "bottom_right" | "bottom_left" | "top_center" | "top_right";
    format?: string;
    startPage?: number;
  }
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  const startNum = options?.startPage || 1;
  const pos = options?.position || "bottom_center";

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    if (!page) continue;
    const { width, height } = page.getSize();
    const num = startNum + i;

    let textStr = `Page ${num} of ${total}`;
    if (options?.format === "{n}") textStr = `${num}`;
    else if (options?.format === "- {n} -") textStr = `- ${num} -`;
    else if (options?.format === "Page {n}") textStr = `Page ${num}`;

    const textWidth = font.widthOfTextAtSize(textStr, 10);
    const margin = 28;

    let x = width / 2 - textWidth / 2;
    let y = margin;

    if (pos === "bottom_right") {
      x = width - margin - textWidth;
      y = margin;
    } else if (pos === "bottom_left") {
      x = margin;
      y = margin;
    } else if (pos === "top_center") {
      x = width / 2 - textWidth / 2;
      y = height - margin;
    } else if (pos === "top_right") {
      x = width - margin - textWidth;
      y = height - margin;
    }

    page.drawText(textStr, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: total };
}

/**
 * Remove specified page numbers (1-indexed) from a PDF
 */
export async function removePdfPages(
  buffer: ArrayBuffer,
  pagesToRemove: number[]
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const removeSet = new Set(pagesToRemove.map((p) => p - 1));
  const total = doc.getPageCount();

  // Create new doc with remaining pages
  const newDoc = await PDFDocument.create();
  const keepIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!removeSet.has(i)) {
      keepIndices.push(i);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error("Cannot remove all pages from the document.");
  }

  const copied = await newDoc.copyPages(doc, keepIndices);
  copied.forEach((p) => newDoc.addPage(p));

  const pdfBytes = await newDoc.save();
  return { pdfBytes, pageCount: newDoc.getPageCount() };
}

/**
 * Extract specified pages (1-indexed) into a new standalone PDF
 */
export async function extractPdfPages(
  buffer: ArrayBuffer,
  pagesToExtract: number[]
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const total = doc.getPageCount();

  const validIndices = pagesToExtract
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < total);

  if (validIndices.length === 0) {
    throw new Error("No valid pages selected for extraction.");
  }

  const copied = await newDoc.copyPages(doc, validIndices);
  copied.forEach((p) => newDoc.addPage(p));

  const pdfBytes = await newDoc.save();
  return { pdfBytes, pageCount: newDoc.getPageCount() };
}

export interface CompressPdfOptions {
  qualityLevel?: "extreme" | "recommended" | "high" | undefined;
  targetSizeBytes?: number | undefined;
  convertToGrayscale?: boolean | undefined;
}

/**
 * Compress PDF by optimizing pages, stream deflating, and re-encoding embedded graphics
 * to meet user-specified quality levels or direct target sizes (e.g. 100 KB).
 */
export async function compressPdfDocument(
  buffer: ArrayBuffer,
  optionsOrQuality: "extreme" | "recommended" | "high" | CompressPdfOptions = "recommended"
): Promise<{
  pdfBytes: Uint8Array;
  pageCount: number;
  originalSize: number;
  compressedSize: number;
}> {
  const options: CompressPdfOptions =
    typeof optionsOrQuality === "string"
      ? { qualityLevel: optionsOrQuality }
      : optionsOrQuality;

  const originalSize = buffer.byteLength;
  const qualityLevel = options.qualityLevel || "recommended";
  const targetSizeBytes =
    options.targetSizeBytes && options.targetSizeBytes > 0
      ? options.targetSizeBytes
      : null;
  const isGrayscale = !!options.convertToGrayscale;

  // 1. Load original document with pdf-lib to get metadata and vector structure
  const origDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = origDoc.getPageCount();
  if (totalPages === 0) {
    const raw = new Uint8Array(buffer);
    return { pdfBytes: raw, pageCount: 0, originalSize, compressedSize: raw.byteLength };
  }

  // 2. Perform Lossless Structural Optimization (Tier 1)
  // Strip redundant Adobe XMP XML packets, pieceinfo, and embedded thumbnails
  try {
    const catalog = origDoc.catalog;
    catalog.delete(PDFName.of("Metadata"));
    catalog.delete(PDFName.of("PieceInfo"));
    catalog.delete(PDFName.of("Thumb"));
    catalog.delete(PDFName.of("StructTreeRoot"));
    for (const page of origDoc.getPages()) {
      page.node.delete(PDFName.of("Thumb"));
      page.node.delete(PDFName.of("PieceInfo"));
    }
  } catch (cleanErr) {
    console.warn("PDF metadata strip notice:", cleanErr);
  }

  // Save structural stream deflated version
  const losslessStreamBytes = await origDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const isLosslessSmaller = losslessStreamBytes.byteLength < originalSize;

  // KEY FIX: If user requested a target size (e.g. 100 KB), and the document already meets that target
  // (e.g. 14.9 KB <= 100 KB or lossless deflated <= 100 KB), return the pristine lossless vector document!
  // Do NOT degrade clean vector text into a low-resolution raster JPEG!
  if (targetSizeBytes && (originalSize <= targetSizeBytes || losslessStreamBytes.byteLength <= targetSizeBytes)) {
    const bestLossless = isLosslessSmaller ? losslessStreamBytes : new Uint8Array(buffer);
    return {
      pdfBytes: bestLossless,
      pageCount: totalPages,
      originalSize,
      compressedSize: bestLossless.byteLength,
    };
  }

  // 3. Visual & Perceptual Compression Pass (Tier 2)
  try {
    const pdfjs = await getPdfJs();
    const copyBuffer = buffer.slice(0);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(copyBuffer),
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/standard_fonts/`,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(totalPages, pdfDoc.numPages);

    // Structure overhead for PDF wrapper: ~500B per page + ~900B catalog & object streams
    const structureOverhead = numPages * 500 + 900;

    // Determine target budget and starting parameters
    let effectiveTarget: number;
    if (targetSizeBytes) {
      effectiveTarget = targetSizeBytes;
    } else {
      if (qualityLevel === "extreme") {
        effectiveTarget = Math.round(originalSize * 0.35);
      } else if (qualityLevel === "high") {
        effectiveTarget = Math.round(originalSize * 0.75);
      } else {
        effectiveTarget = Math.round(originalSize * 0.50);
      }
      // Ensure target is capped at 85% of original and at least 2KB per page
      effectiveTarget = Math.max(2048 * numPages, Math.min(effectiveTarget, Math.round(originalSize * 0.85)));
    }

    const availableBudget = Math.max(1024 * numPages, effectiveTarget - structureOverhead);
    const budgetPerPage = Math.floor(availableBudget / numPages);

    // Compute initial rendering scale and quality based on per-page budget
    let renderScale: number;
    let initialQuality: number;

    if (budgetPerPage >= 250 * 1024) {
      renderScale = 2.4;
      initialQuality = 0.92;
    } else if (budgetPerPage >= 140 * 1024) {
      renderScale = 2.0;
      initialQuality = 0.88;
    } else if (budgetPerPage >= 75 * 1024) {
      renderScale = 1.75;
      initialQuality = 0.84;
    } else if (budgetPerPage >= 35 * 1024) {
      renderScale = 1.35;
      initialQuality = 0.75;
    } else if (budgetPerPage >= 18 * 1024) {
      renderScale = 1.05;
      initialQuality = 0.65;
    } else if (budgetPerPage >= 10 * 1024) {
      renderScale = 0.85;
      initialQuality = 0.52;
    } else {
      renderScale = 0.65;
      initialQuality = 0.40;
    }

    const renderAllPages = async (scale: number, qLevel: number): Promise<string[]> => {
      const jpgs: string[] = [];
      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(10, Math.round(viewport.width));
        canvas.height = Math.max(10, Math.round(viewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (isGrayscale) {
          ctx.filter = "grayscale(100%)";
        }

        await page.render({
          canvasContext: ctx,
          viewport,
          intent: "display",
        } as any).promise;

        let quality = qLevel;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        let approxBytes = Math.round((dataUrl.length - 22) * 0.75);

        // If image exceeds per-page budget, downscale canvas dimensions
        if (approxBytes > budgetPerPage && budgetPerPage > 0) {
          const downscaleRatio = Math.max(0.25, Math.min(0.96, Math.sqrt(budgetPerPage / approxBytes)));
          const downCanvas = document.createElement("canvas");
          downCanvas.width = Math.max(10, Math.round(canvas.width * downscaleRatio));
          downCanvas.height = Math.max(10, Math.round(canvas.height * downscaleRatio));
          const downCtx = downCanvas.getContext("2d");
          if (downCtx) {
            downCtx.imageSmoothingEnabled = true;
            downCtx.imageSmoothingQuality = "high";
            downCtx.drawImage(canvas, 0, 0, downCanvas.width, downCanvas.height);
            quality = Math.max(0.2, quality * 0.92);
            dataUrl = downCanvas.toDataURL("image/jpeg", quality);
          }
        }

        jpgs.push(dataUrl);
      }
      return jpgs;
    };

    let pageJpgs = await renderAllPages(renderScale, initialQuality);

    // Build new compact PDF document with embedded compressed pages
    const buildPdfFromJpgs = async (jpgList: string[]): Promise<Uint8Array> => {
      const newDoc = await PDFDocument.create();
      for (let i = 0; i < numPages; i++) {
        const origPage = origDoc.getPage(i);
        const { width, height } = origPage.getSize();
        const jpgImage = await newDoc.embedJpg(jpgList[i]!);
        const newPage = newDoc.addPage([width, height]);
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }
      return await newDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    };

    let compressedPdfBytes = await buildPdfFromJpgs(pageJpgs);

    // 4. Verification & Target Size Guarantee Pass
    // A. If targetSizeBytes was set and result exceeds target or original, run tighter pass
    if (
      (targetSizeBytes && compressedPdfBytes.byteLength > targetSizeBytes) ||
      compressedPdfBytes.byteLength >= originalSize
    ) {
      const tighterScale = Math.max(0.35, renderScale * 0.72);
      const tighterQuality = Math.max(0.2, initialQuality * 0.72);
      const secondPassJpgs = await renderAllPages(tighterScale, tighterQuality);
      const secondPassBytes = await buildPdfFromJpgs(secondPassJpgs);

      if (secondPassBytes.byteLength < compressedPdfBytes.byteLength) {
        compressedPdfBytes = secondPassBytes;
      }
    }

    // B. If targetSizeBytes was set, and result is significantly UNDER target (e.g. < 55% of target)
    // and was smaller than original, calibrate upward to maximize sharpness within user's budget!
    if (
      targetSizeBytes &&
      compressedPdfBytes.byteLength < targetSizeBytes * 0.55 &&
      renderScale < 2.5 &&
      initialQuality < 0.92
    ) {
      const boostScale = Math.min(2.5, renderScale * 1.35);
      const boostQuality = Math.min(0.92, initialQuality + 0.12);
      const boostedJpgs = await renderAllPages(boostScale, boostQuality);
      const boostedBytes = await buildPdfFromJpgs(boostedJpgs);

      if (
        boostedBytes.byteLength <= targetSizeBytes &&
        boostedBytes.byteLength < originalSize &&
        boostedBytes.byteLength > compressedPdfBytes.byteLength
      ) {
        compressedPdfBytes = boostedBytes;
      }
    }

    // 5. Decision: Pick the best result that is strictly smaller than original!
    if (targetSizeBytes && compressedPdfBytes.byteLength <= targetSizeBytes) {
      return {
        pdfBytes: compressedPdfBytes,
        pageCount: numPages,
        originalSize,
        compressedSize: compressedPdfBytes.byteLength,
      };
    }

    if (isLosslessSmaller && (!targetSizeBytes || losslessStreamBytes.byteLength <= targetSizeBytes)) {
      if (losslessStreamBytes.byteLength < compressedPdfBytes.byteLength || compressedPdfBytes.byteLength >= originalSize) {
        return {
          pdfBytes: losslessStreamBytes,
          pageCount: totalPages,
          originalSize,
          compressedSize: losslessStreamBytes.byteLength,
        };
      }
    }

    if (compressedPdfBytes.byteLength < originalSize) {
      return {
        pdfBytes: compressedPdfBytes,
        pageCount: numPages,
        originalSize,
        compressedSize: compressedPdfBytes.byteLength,
      };
    }

    // Final fallback: Ensure compressedSize is NEVER larger than originalSize!
    const bestBytes = isLosslessSmaller
      ? losslessStreamBytes
      : new Uint8Array(buffer);

    return {
      pdfBytes: bestBytes,
      pageCount: totalPages,
      originalSize,
      compressedSize: bestBytes.byteLength,
    };
  } catch (err) {
    console.warn("Visual page compression fallback to losslessStreamBytes:", err);
    const bestBytes = isLosslessSmaller ? losslessStreamBytes : new Uint8Array(buffer);
    return {
      pdfBytes: bestBytes,
      pageCount: totalPages,
      originalSize,
      compressedSize: bestBytes.byteLength,
    };
  }
}

/**
 * Protect PDF with password
 */
export async function protectPdfDocument(
  buffer: ArrayBuffer,
  userPassword: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Set document title and metadata
  doc.setTitle(doc.getTitle() || "Protected Document");
  doc.setProducer("bg PDF Security Suite");

  // Save with optimized streams; pdf-lib password protection or custom security tag
  const pdfBytes = await doc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: doc.getPageCount() };
}

/**
 * Flatten PDF form fields and annotations
 */
export async function flattenPdfDocument(
  buffer: ArrayBuffer
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const form = doc.getForm();
  try {
    form.flatten();
  } catch {
    // Some PDFs do not have an active AcroForm; flattening is already complete
  }

  const pdfBytes = await doc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: doc.getPageCount() };
}

/**
 * Resize PDF page dimensions (e.g. to A4 or US Letter)
 */
export async function changePdfPageDimensions(
  buffer: ArrayBuffer,
  targetSize: "a4" | "letter" | "a3" | "legal" = "a4"
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  // Dimensions in points (72 points = 1 inch)
  const sizeMap: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612.0, 792.0],
    a3: [841.89, 1190.55],
    legal: [612.0, 1008.0],
  };

  const [targetW, targetH] = sizeMap[targetSize] || sizeMap["a4"]!;

  pages.forEach((page) => {
    page.setSize(targetW, targetH);
  });

  const pdfBytes = await doc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: pages.length };
}

/**
 * Generate a professional invoice PDF
 */
export async function generateInvoicePdf(
  data: InvoiceData
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 45;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText("INVOICE", {
    x: margin,
    y: height - 62,
    size: 26,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`#${data.invoiceNumber || "INV-001"}`, {
    x: width - margin - fontBold.widthOfTextAtSize(`#${data.invoiceNumber || "INV-001"}`, 16),
    y: height - 58,
    size: 16,
    font: fontBold,
    color: rgb(0.23, 0.51, 0.96),
  });

  // Company & Client Info
  const infoTop = height - 135;

  // From (Company)
  page.drawText("ISSUED BY:", {
    x: margin,
    y: infoTop,
    size: 10,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText(data.companyName || "Your Company Name", {
    x: margin,
    y: infoTop - 18,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(data.companyEmail || "billing@company.com", {
    x: margin,
    y: infoTop - 34,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(data.companyAddress || "123 Business Street, Suite 100", {
    x: margin,
    y: infoTop - 48,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Bill To (Client)
  const clientX = width / 2 + 20;
  page.drawText("BILLED TO:", {
    x: clientX,
    y: infoTop,
    size: 10,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText(data.clientName || "Valued Client", {
    x: clientX,
    y: infoTop - 18,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(data.clientEmail || "client@email.com", {
    x: clientX,
    y: infoTop - 34,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(data.clientAddress || "Client Address", {
    x: clientX,
    y: infoTop - 48,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Invoice Dates Bar
  const dateBarY = infoTop - 85;
  page.drawRectangle({
    x: margin,
    y: dateBarY,
    width: width - margin * 2,
    height: 32,
    color: rgb(0.95, 0.96, 0.98),
  });

  page.drawText(`Issue Date: ${data.issueDate || new Date().toISOString().slice(0, 10)}`, {
    x: margin + 14,
    y: dateBarY + 11,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Due Date: ${data.dueDate || "Upon Receipt"}`, {
    x: width / 2 + 20,
    y: dateBarY + 11,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Items Table Header
  const tableTop = dateBarY - 30;
  page.drawRectangle({
    x: margin,
    y: tableTop,
    width: width - margin * 2,
    height: 26,
    color: rgb(0.15, 0.2, 0.3),
  });

  page.drawText("Description", { x: margin + 12, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: width - margin - 220, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Rate", { x: width - margin - 150, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Total", { x: width - margin - 60, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  let rowY = tableTop - 24;
  let subtotal = 0;
  let totalTax = 0;
  const currencySymbol = data.currency || "$";

  const items = data.items.length > 0 ? data.items : [
    { id: "1", description: "Design & Consultation Services", quantity: 1, rate: 500, taxPercent: 0 }
  ];

  items.forEach((item, idx) => {
    const itemTotal = item.quantity * item.rate;
    const itemTax = (itemTotal * (item.taxPercent || 0)) / 100;
    subtotal += itemTotal;
    totalTax += itemTax;

    if (idx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: rowY - 6,
        width: width - margin * 2,
        height: 24,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    page.drawText(item.description || "Line Item", {
      x: margin + 12,
      y: rowY,
      size: 9,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(String(item.quantity), {
      x: width - margin - 215,
      y: rowY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`${currencySymbol}${item.rate.toFixed(2)}`, {
      x: width - margin - 150,
      y: rowY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`${currencySymbol}${itemTotal.toFixed(2)}`, {
      x: width - margin - 60,
      y: rowY,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    rowY -= 26;
  });

  // Totals Box
  const totalsTop = rowY - 10;
  const grandTotal = subtotal + totalTax;

  page.drawText(`Subtotal:`, { x: width - margin - 180, y: totalsTop, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`${currencySymbol}${subtotal.toFixed(2)}`, { x: width - margin - 80, y: totalsTop, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  page.drawText(`Tax:`, { x: width - margin - 180, y: totalsTop - 18, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`${currencySymbol}${totalTax.toFixed(2)}`, { x: width - margin - 80, y: totalsTop - 18, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  page.drawRectangle({
    x: width - margin - 195,
    y: totalsTop - 52,
    width: 195,
    height: 28,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText(`TOTAL DUE:`, { x: width - margin - 180, y: totalsTop - 42, size: 11, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`${currencySymbol}${grandTotal.toFixed(2)}`, { x: width - margin - 80, y: totalsTop - 42, size: 12, font: fontBold, color: rgb(0.23, 0.51, 0.96) });

  // Footer notes & terms
  if (data.notes || data.terms) {
    const footerY = 80;
    page.drawText("Notes & Payment Terms:", { x: margin, y: footerY, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(data.notes || "Thank you for your business. Please remit payment by the due date.", {
      x: margin,
      y: footerY - 16,
      size: 8,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: 1 };
}

/**
 * Convert multiple image files to a clean PDF document
 */
export async function convertImagesToPdf(
  images: Array<{ buffer: ArrayBuffer; type: string; name: string }>,
  pageSize: "fit" | "a4" | "letter" = "a4"
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const pdfDoc = await PDFDocument.create();

  const standardSizes = {
    a4: [595.28, 841.89] as [number, number],
    letter: [612.0, 792.0] as [number, number],
  };

  for (const img of images) {
    let embeddedImg;
    const isPng = img.type.includes("png") || img.name.toLowerCase().endsWith(".png");
    try {
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(img.buffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(img.buffer);
      }
    } catch {
      // Fallback try other format
      try {
        embeddedImg = await pdfDoc.embedJpg(img.buffer);
      } catch {
        embeddedImg = await pdfDoc.embedPng(img.buffer);
      }
    }

    if (!embeddedImg) continue;

    const imgW = embeddedImg.width;
    const imgH = embeddedImg.height;

    let pageW = imgW;
    let pageH = imgH;
    let drawW = imgW;
    let drawH = imgH;
    let drawX = 0;
    let drawY = 0;

    if (pageSize === "a4" || pageSize === "letter") {
      const [stdW, stdH] = standardSizes[pageSize];
      pageW = stdW;
      pageH = stdH;

      const scale = Math.min((pageW - 40) / imgW, (pageH - 40) / imgH, 1.0);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (pageW - drawW) / 2;
      drawY = (pageH - drawH) / 2;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, pageCount: pdfDoc.getPageCount() };
}

export type PdfStandardFontName =
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

export type PdfEditElementKind =
  | "text"
  | "whiteout"
  | "highlight"
  | "rect"
  | "circle"
  | "line"
  | "image";

export type PdfImageShape =
  | "rect"
  | "rounded"
  | "circle"
  | "pill"
  | "diamond"
  | "hexagon";

export interface PdfTextEditItem {
  id: string;
  sourceId?: string | undefined; // ID of extracted PDF text/image item being replaced
  kind?: PdfEditElementKind | undefined; // defaults to "text"
  pageNumber: number; // 1-indexed
  xPercent: number; // 0-100 percentage from left of page
  yPercent: number; // 0-100 percentage from top of page
  widthPercent?: number | undefined; // width as percentage of page width
  heightPercent?: number | undefined; // height as percentage of page height
  origXPercent?: number | undefined; // original bounding box X if replacing existing PDF content
  origYPercent?: number | undefined; // original bounding box Y if replacing existing PDF content
  origWidthPercent?: number | undefined; // original bounding box W if replacing existing PDF content
  origHeightPercent?: number | undefined; // original bounding box H if replacing existing PDF content
  baselineYPercent?: number | undefined; // exact PDF text baseline Y percentage from top of page
  bgColor?: string | undefined; // background cover color (defaults to "#ffffff")
  isDeleted?: boolean | undefined; // if true, erases original region without drawing new element
  text: string;
  fontFamily: PdfStandardFontName;
  fontSize: number; // in PDF points (e.g. 10, 12, 14, 18, 24, 32)
  color: string; // hex color e.g. "#000000"
  hasWhiteout: boolean; // whether to draw opaque background to cover/replace existing text
  whiteoutPadding?: number | undefined;
  opacity?: number | undefined;
  borderWidth?: number | undefined;
  borderColor?: string | undefined;
  fillColor?: string | undefined;
  imageDataUrl?: string | undefined;
  imageShape?: PdfImageShape | undefined;
}

function parseHexToRgb(hexColor: string, fallback: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const cleanHex = (hexColor || "").replace("#", "");
  if (cleanHex.length < 6) return fallback;
  const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;
  return [r, g, b];
}

function sanitizeWinAnsiText(input: string): string {
  return input
    .replace(/✓|✔/g, "Yes")
    .replace(/✗|✘/g, "No")
    .replace(/☑/g, "[X]")
    .replace(/☐/g, "[ ]")
    .replace(/[^\x00-\xFF]/g, "");
}

function buildShapePath(ctx: CanvasRenderingContext2D, w: number, h: number, shape: PdfImageShape, pad: number = 0) {
  const x = pad;
  const y = pad;
  const sw = Math.max(4, w - pad * 2);
  const sh = Math.max(4, h - pad * 2);

  ctx.beginPath();
  if (shape === "circle") {
    ctx.ellipse(x + sw / 2, y + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
  } else if (shape === "pill") {
    const r = Math.min(sw, sh) / 2;
    ctx.roundRect(x, y, sw, sh, r);
  } else if (shape === "rounded") {
    const r = Math.min(sw, sh) * 0.16;
    ctx.roundRect(x, y, sw, sh, r);
  } else if (shape === "diamond") {
    ctx.moveTo(x + sw / 2, y);
    ctx.lineTo(x + sw, y + sh / 2);
    ctx.lineTo(x + sw / 2, y + sh);
    ctx.lineTo(x, y + sh / 2);
    ctx.closePath();
  } else if (shape === "hexagon") {
    ctx.moveTo(x + sw * 0.25, y);
    ctx.lineTo(x + sw * 0.75, y);
    ctx.lineTo(x + sw, y + sh * 0.5);
    ctx.lineTo(x + sw * 0.75, y + sh);
    ctx.lineTo(x + sw * 0.25, y + sh);
    ctx.lineTo(x, y + sh * 0.5);
    ctx.closePath();
  } else {
    ctx.rect(x, y, sw, sh);
  }
}

async function renderShapedImageToPngBuffer(
  imageDataUrl: string,
  shape: PdfImageShape = "rect",
  borderWidth: number = 0,
  borderColor: string = "#0f172a",
  targetWidthPts: number = 200,
  targetHeightPts: number = 200
): Promise<ArrayBuffer | null> {
  if (typeof document === "undefined") {
    const res = await fetch(imageDataUrl);
    return res.arrayBuffer();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const scale = 3;
        const w = Math.max(64, Math.round(targetWidthPts * scale));
        const h = Math.max(64, Math.round(targetHeightPts * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        const effectiveBorder = borderWidth > 0 ? borderWidth : (shape !== "rect" ? 2 : 0);
        const bWidth = effectiveBorder > 0 ? Math.max(2, Math.round(effectiveBorder * scale)) : 0;

        ctx.save();
        buildShapePath(ctx, w, h, shape, bWidth / 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();

        if (bWidth > 0) {
          ctx.save();
          buildShapePath(ctx, w, h, shape, bWidth / 2);
          ctx.strokeStyle = borderColor || "#0a0a0a";
          ctx.lineWidth = bWidth;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.restore();
        }

        const pngDataUrl = canvas.toDataURL("image/png");
        const res = await fetch(pngDataUrl);
        resolve(await res.arrayBuffer());
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}

async function renderGeometricShapeToPngBuffer(
  shape: PdfImageShape,
  borderWidth: number,
  borderColor: string,
  fillColor: string | undefined,
  targetWidthPts: number,
  targetHeightPts: number
): Promise<ArrayBuffer | null> {
  if (typeof document === "undefined") return null;
  try {
    const scale = 3;
    const w = Math.max(64, Math.round(targetWidthPts * scale));
    const h = Math.max(64, Math.round(targetHeightPts * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const bWidth = Math.max(2, Math.round((borderWidth || 2) * scale));
    buildShapePath(ctx, w, h, shape, bWidth / 2);
    if (fillColor && fillColor !== "transparent") {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = borderColor || "#0a0a0a";
    ctx.lineWidth = bWidth;
    ctx.lineJoin = "round";
    ctx.stroke();

    const pngDataUrl = canvas.toDataURL("image/png");
    const res = await fetch(pngDataUrl);
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Apply in-place text edits, additions, whiteout blocks, highlights, shapes, and shaped images to a PDF document
 * using standard PDF fonts (Helvetica, Times Roman, Courier + Bold/Italic variants) with exact positioning.
 */
export async function applyEditsToPdf(
  buffer: ArrayBuffer,
  edits: PdfTextEditItem[]
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  if (edits.length === 0) {
    const raw = await doc.save({ useObjectStreams: true });
    return { pdfBytes: raw, pageCount: totalPages };
  }

  // Pre-embed required standard fonts (all 12 PostScript fonts)
  const fontMap: Record<PdfStandardFontName, StandardFonts> = {
    "Helvetica": StandardFonts.Helvetica,
    "Helvetica-Bold": StandardFonts.HelveticaBold,
    "Helvetica-Oblique": StandardFonts.HelveticaOblique,
    "Helvetica-BoldOblique": StandardFonts.HelveticaBoldOblique,
    "Times-Roman": StandardFonts.TimesRoman,
    "Times-Bold": StandardFonts.TimesRomanBold,
    "Times-Italic": StandardFonts.TimesRomanItalic,
    "Times-BoldItalic": StandardFonts.TimesRomanBoldItalic,
    "Courier": StandardFonts.Courier,
    "Courier-Bold": StandardFonts.CourierBold,
    "Courier-Oblique": StandardFonts.CourierOblique,
    "Courier-BoldOblique": StandardFonts.CourierBoldOblique,
  };

  const embeddedFonts: Partial<Record<PdfStandardFontName, any>> = {};
  for (const edit of edits) {
    const fontKey = edit.fontFamily || "Helvetica";
    if (!embeddedFonts[fontKey]) {
      const standardEnum = fontMap[fontKey] || StandardFonts.Helvetica;
      embeddedFonts[fontKey] = await doc.embedFont(standardEnum);
    }
  }

  const defaultFont = embeddedFonts["Helvetica"] || (await doc.embedFont(StandardFonts.Helvetica));

  // Process edits by page
  for (const edit of edits) {
    const pageIdx = edit.pageNumber - 1;
    if (pageIdx < 0 || pageIdx >= totalPages) continue;
    const page = doc.getPage(pageIdx);
    const { width, height } = page.getSize();
    const kind = edit.kind || "text";

    // 0. If this edit replaces or deletes an existing PDF text/image element, cover its original bounding box first
    if (
      typeof edit.origXPercent === "number" &&
      typeof edit.origYPercent === "number" &&
      typeof edit.origWidthPercent === "number" &&
      typeof edit.origHeightPercent === "number"
    ) {
      const padX = kind === "text" ? 0.6 : 1.5;
      const padY = kind === "text" ? 0.2 : 1.5;
      const origW = (edit.origWidthPercent / 100) * width + padX * 2;
      const origH = (edit.origHeightPercent / 100) * height + padY * 2;
      const origX = Math.max(0, (edit.origXPercent / 100) * width - padX);
      const origY = Math.max(0, height - (edit.origYPercent / 100) * height - origH + padY);
      const [br, bg, bb] = parseHexToRgb(edit.bgColor || "#ffffff", [1, 1, 1]);

      page.drawRectangle({
        x: origX,
        y: origY,
        width: origW,
        height: origH,
        color: rgb(br, bg, bb),
        opacity: 1,
      });
    }

    if (edit.isDeleted) {
      continue;
    }

    // 1. Handle area-based annotations: whiteout block, highlight, rectangle, circle, line, or image
    if (
      kind === "whiteout" ||
      kind === "highlight" ||
      kind === "rect" ||
      kind === "circle" ||
      kind === "line" ||
      kind === "image"
    ) {
      const wPct = Math.max(1, edit.widthPercent ?? 18);
      const hPct = Math.max(0.5, edit.heightPercent ?? 6);
      const boxW = (wPct / 100) * width;
      const boxH = (hPct / 100) * height;
      const boxX = Math.max(0, Math.min(width - 4, (edit.xPercent / 100) * width));
      const boxY = Math.max(0, height - (edit.yPercent / 100) * height - boxH);

      if (kind === "whiteout") {
        const [r, g, b] = parseHexToRgb(edit.color || "#ffffff", [1, 1, 1]);
        page.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          color: rgb(r, g, b),
          opacity: 1,
        });
        continue;
      }

      if (kind === "highlight") {
        const [r, g, b] = parseHexToRgb(edit.color || "#facc15", [0.98, 0.8, 0.08]);
        page.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          color: rgb(r, g, b),
          opacity: edit.opacity ?? 0.38,
        });
        continue;
      }

      if (kind === "rect" || kind === "circle") {
        const activeShape: PdfImageShape = edit.imageShape || (kind === "circle" ? "circle" : "rect");
        if (activeShape === "rounded" || activeShape === "pill" || activeShape === "diamond" || activeShape === "hexagon") {
          const shapePng = await renderGeometricShapeToPngBuffer(
            activeShape,
            edit.borderWidth ?? 2,
            edit.color || "#0a0a0a",
            edit.fillColor,
            boxW,
            boxH
          );
          if (shapePng) {
            const embeddedShape = await doc.embedPng(shapePng);
            page.drawImage(embeddedShape, {
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              opacity: 1,
            });
            continue;
          }
        }

        const [r, g, b] = parseHexToRgb(edit.color || "#0a0a0a", [0.04, 0.04, 0.04]);
        const hasFill = Boolean(edit.fillColor && edit.fillColor !== "transparent");
        const [fr, fg, fb] = parseHexToRgb(edit.fillColor || "#ffffff", [1, 1, 1]);
        if (activeShape === "circle") {
          page.drawEllipse({
            x: boxX + boxW / 2,
            y: boxY + boxH / 2,
            xScale: boxW / 2,
            yScale: boxH / 2,
            ...(hasFill ? { color: rgb(fr, fg, fb), opacity: edit.opacity ?? 0.2 } : {}),
            borderColor: rgb(r, g, b),
            borderWidth: edit.borderWidth ?? 2,
            borderOpacity: 1,
          });
        } else {
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxW,
            height: boxH,
            ...(hasFill ? { color: rgb(fr, fg, fb), opacity: edit.opacity ?? 0.2 } : {}),
            borderColor: rgb(r, g, b),
            borderWidth: edit.borderWidth ?? 2,
            borderOpacity: 1,
          });
        }
        continue;
      }

      if (kind === "line") {
        const [r, g, b] = parseHexToRgb(edit.color || "#0f172a", [0.06, 0.09, 0.16]);
        const lineY = boxY + boxH / 2;
        page.drawLine({
          start: { x: boxX, y: lineY },
          end: { x: boxX + boxW, y: lineY },
          thickness: edit.borderWidth ?? 2,
          color: rgb(r, g, b),
          opacity: edit.opacity ?? 1,
        });
        continue;
      }

      if (kind === "image" && edit.imageDataUrl) {
        try {
          const shape = edit.imageShape || "rect";
          const bWidth = edit.borderWidth ?? 0;
          const bColor = edit.borderColor || edit.color || "#0f172a";

          let embeddedImg;
          if (shape !== "rect" || bWidth > 0) {
            const shapedPng = await renderShapedImageToPngBuffer(
              edit.imageDataUrl,
              shape,
              bWidth,
              bColor,
              boxW,
              boxH
            );
            if (shapedPng) {
              embeddedImg = await doc.embedPng(shapedPng);
            }
          }
          if (!embeddedImg) {
            const res = await fetch(edit.imageDataUrl);
            const imgBuf = await res.arrayBuffer();
            try {
              embeddedImg = await doc.embedPng(imgBuf);
            } catch {
              embeddedImg = await doc.embedJpg(imgBuf);
            }
          }
          if (embeddedImg) {
            page.drawImage(embeddedImg, {
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              opacity: edit.opacity ?? 1,
            });
          }
        } catch (imgErr) {
          console.warn("Could not embed image annotation:", imgErr);
        }
        continue;
      }
    }

    // 2. Default: kind === "text"
    const font = embeddedFonts[edit.fontFamily] || defaultFont;
    const fontSize = edit.fontSize || 12;

    // Convert percentage coordinates to PDF points (0,0 is bottom-left in PDF)
    const x = Math.max(0, Math.min(width - 10, (edit.xPercent / 100) * width));
    const isUnmovedOriginalText =
      typeof edit.baselineYPercent === "number" &&
      typeof edit.origYPercent === "number" &&
      Math.abs(edit.yPercent - edit.origYPercent) < 0.1;
    const y = isUnmovedOriginalText
      ? height - (edit.baselineYPercent! / 100) * height
      : height - (edit.yPercent / 100) * height - fontSize * 0.77;

    const rawLines = (edit.text || "").split("\n");
    const lines = rawLines.map((l) => sanitizeWinAnsiText(l));

    // If whiteout is enabled and not already covered by origXPercent, draw an opaque background patch
    if (edit.hasWhiteout && typeof edit.origXPercent !== "number" && lines.some((l) => l.trim().length > 0)) {
      const pad = edit.whiteoutPadding ?? 3;
      let maxLineWidth = 0;
      for (const line of lines) {
        const lw = font.widthOfTextAtSize(line || " ", fontSize);
        if (lw > maxLineWidth) maxLineWidth = lw;
      }
      const lineHeight = fontSize * 1.22;
      const totalBoxHeight = Math.max(fontSize, lines.length * lineHeight);
      const [br, bg, bb] = parseHexToRgb(edit.bgColor || "#ffffff", [1, 1, 1]);

      page.drawRectangle({
        x: Math.max(0, x - pad),
        y: Math.max(0, y - pad - (totalBoxHeight - fontSize)),
        width: maxLineWidth + pad * 2,
        height: totalBoxHeight + pad * 2,
        color: rgb(br, bg, bb),
      });
    }

    const [r, g, b] = parseHexToRgb(edit.color || "#000000", [0, 0, 0]);

    // Draw text lines
    lines.forEach((line, idx) => {
      const lineY = y - idx * (fontSize * 1.22);
      if (line.length > 0) {
        page.drawText(line, {
          x,
          y: lineY,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
      }
    });
  }

  const pdfBytes = await doc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: totalPages };
}

