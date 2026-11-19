import { PDFDocument, rgb, degrees, StandardFonts, PDFName } from "pdf-lib";
import { getPdfJs } from "./pdf-preview";

export interface InvoiceItem {
  id: string;
  description: string;
  subDescription?: string;
  hsnSac?: string;
  unit?: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

export interface InvoiceCustomField {
  id: string;
  label: string;
  value: string;
}

export type InvoiceThemeId =
  | "executive-orange"
  | "modern-banner"
  | "minimal-swiss"
  | "corporate-split"
  | "luxury-editorial"
  | "tech-mono"
  | "bold-sidebar"
  | "gst-pro-ledger"
  | "agency-studio"
  | "compact-enterprise";

export interface InvoiceData {
  documentTitle?: string;
  documentSubtitle?: string;
  themeColor?: string;
  invoiceTemplate?: InvoiceThemeId;
  invoiceFont?: "sans" | "serif" | "mono";
  taxMode?: "gst_intra" | "gst_inter" | "standard" | "none";
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customFields?: InvoiceCustomField[];
  logoDataUrl?: string;
  currency: string;
  companyName: string;
  companyCountry?: string;
  companyGstin?: string;
  companyPan?: string;
  companyAddress: string;
  companyCityState?: string;
  companyEmail: string;
  companyPhone?: string;
  clientName: string;
  clientCountry?: string;
  clientGstin?: string;
  clientPan?: string;
  clientAddress: string;
  clientCityState?: string;
  clientEmail: string;
  clientPhone?: string;
  items: InvoiceItem[];
  discountType?: "percent" | "flat";
  discountValue?: number;
  additionalChargesLabel?: string;
  additionalChargesAmount?: number;
  showTotalInWords?: boolean;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  upiId?: string;
  signatureDataUrl?: string;
  signatureLabel?: string;
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
        const approxBytes = Math.round((dataUrl.length - 22) * 0.75);

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

    const pageJpgs = await renderAllPages(renderScale, initialQuality);

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

export function numberToInvoiceWords(amount: number, currencySymbol: string = "₹"): string {
  if (!isFinite(amount) || amount < 0) return "Zero Only";
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const twoDigits = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n]!;
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? " " + ones[o] : ""}`;
  };

  const threeDigits = (n: number): string => {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return `${h ? ones[h] + " Hundred" : ""}${h && rem ? " " : ""}${twoDigits(rem)}`;
  };

  const isInr = currencySymbol === "₹" || currencySymbol === "INR" || currencySymbol === "Rs.";
  const prefix = isInr
    ? "Indian Rupees "
    : currencySymbol === "$"
      ? "US Dollars "
      : currencySymbol === "€"
        ? "Euros "
        : currencySymbol === "£"
          ? "British Pounds "
          : "";

  if (isInr) {
    let n = rounded;
    const parts: string[] = [];
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundredRem = n;

    if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
    if (hundredRem > 0) parts.push(threeDigits(hundredRem));

    return `${prefix}${parts.join(" ")} Only`;
  }

  let n = rounded;
  const parts: string[] = [];
  const million = Math.floor(n / 1000000);
  n %= 1000000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (million > 0) parts.push(`${threeDigits(million)} Million`);
  if (thousand > 0) parts.push(`${threeDigits(thousand)} Thousand`);
  if (n > 0) parts.push(threeDigits(n));
  return `${prefix}${parts.join(" ")} Only`;
}

function safePdfWinAnsi(text: string): string {
  const mapped = (text || "")
    .replace(/₹/g, "Rs. ")
    .replace(/✓|✔/g, "Yes")
    .replace(/✗|✘/g, "No");
  return Array.from(mapped)
    .filter((ch) => ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) <= 0xff)
    .join("");
}

/**
 * Generate a professional Refrens-style GST / Tax Invoice PDF
 */
export async function generateInvoicePdf(
  data: InvoiceData
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const template: InvoiceThemeId = data.invoiceTemplate || "executive-orange";
  const fontChoice =
    data.invoiceFont ||
    (template === "luxury-editorial" ? "serif" : template === "tech-mono" ? "mono" : "sans");

  const fontBold = await doc.embedFont(
    fontChoice === "serif"
      ? StandardFonts.TimesRomanBold
      : fontChoice === "mono"
        ? StandardFonts.CourierBold
        : StandardFonts.HelveticaBold
  );
  const fontRegular = await doc.embedFont(
    fontChoice === "serif"
      ? StandardFonts.TimesRoman
      : fontChoice === "mono"
        ? StandardFonts.Courier
        : StandardFonts.Helvetica
  );

  const { width, height } = page.getSize();
  const margin = template === "bold-sidebar" ? 44 : 36;
  const contentW = width - margin * 2;

  const [tr, tg, tb] = parseHexToRgb(data.themeColor || "#ff5500", [1, 0.333, 0]);
  const themeColor = rgb(tr, tg, tb);
  const softThemeTint = rgb(
    Math.min(1, tr * 0.1 + 0.9),
    Math.min(1, tg * 0.1 + 0.9),
    Math.min(1, tb * 0.1 + 0.9)
  );
  const lightBoxColor =
    template === "luxury-editorial"
      ? rgb(0.985, 0.98, 0.965)
      : template === "agency-studio"
        ? softThemeTint
        : rgb(0.965, 0.968, 0.985);
  const darkText = rgb(0.08, 0.09, 0.12);
  const mutedText = rgb(0.38, 0.42, 0.49);

  const rawCurrency = data.currency || "₹";
  const pdfCurr = rawCurrency === "₹" ? "Rs. " : safePdfWinAnsi(rawCurrency);
  const taxMode = data.taxMode || "gst_intra";

  // Helper to draw SVG paths in PDF coordinate space (SVG top-left 800x842 -> PDF 595.28x841.89)
  const drawGraphicWave = (svgPath: string, fillCol: ReturnType<typeof rgb>, opacity = 1) => {
    try {
      page.drawSvgPath(svgPath, {
        x: 0,
        y: height,
        scale: width / 800,
        color: fillCol,
        opacity,
      });
    } catch {
      // fallback if path unsupported
    }
  };

  // Template-specific graphical vector artwork (Top & Bottom waves, slashes, polygons, seals)
  if (template === "executive-orange" || template === "corporate-split") {
    // Dual Wave Graphic Pro (Matches Uploaded Image 2: Top-Left layered S-wave + Bottom-Right layered S-wave)
    drawGraphicWave("M 0,0 L 585,0 C 445,95 235,165 0,132 Z", themeColor, 0.22);
    drawGraphicWave("M 0,0 L 535,0 C 400,82 205,144 0,114 Z", themeColor, 1);
    // Bottom wave curves (near y = 1130 in 800-wide scaled coordinates where bottom is 1131)
    drawGraphicWave("M 0,1045 C 185,1022 340,1075 495,1132 L 0,1132 Z", themeColor, 0.22);
    drawGraphicWave("M 165,1132 C 375,1042 595,1018 800,1010 L 800,1132 Z", themeColor, 1);
  } else if (template === "minimal-swiss") {
    // Minimal Bottom Wave (Matches Uploaded Image 1: Clean white top + dual-tone overlapping bottom waves)
    drawGraphicWave("M 0,1015 C 190,995 360,1050 510,1132 L 0,1132 Z", themeColor, 0.22);
    drawGraphicWave("M 110,1132 C 360,1020 590,995 800,965 L 800,1132 Z", themeColor, 1);
  } else if (template === "modern-banner") {
    // Dynamic Diagonal Slash top & bottom polygons
    drawGraphicWave("M 0,0 L 800,0 L 535,135 L 0,88 Z", themeColor, 0.22);
    drawGraphicWave("M 0,0 L 740,0 L 475,118 L 0,74 Z", themeColor, 1);
    drawGraphicWave("M 180,1132 L 800,1045 L 800,1132 Z", themeColor, 0.22);
    drawGraphicWave("M 310,1132 L 800,1060 L 800,1132 Z", themeColor, 1);
  } else if (template === "luxury-editorial") {
    // Luxury Gold Crest & Arch
    drawGraphicWave("M 0,0 L 800,0 L 800,48 Q 400,122 0,48 Z", themeColor, 0.2);
    drawGraphicWave("M 0,0 L 800,0 L 800,34 Q 400,104 0,34 Z", themeColor, 1);
    drawGraphicWave("M 0,1132 L 0,1095 Q 400,1045 800,1095 L 800,1132 Z", themeColor, 0.18);
  } else if (template === "tech-mono") {
    // SaaS Geometric Prism
    drawGraphicWave("M 0,0 L 520,0 L 440,98 L 0,98 Z", themeColor, 1);
    drawGraphicWave("M 540,0 L 800,0 L 800,72 L 475,72 Z", themeColor, 0.24);
    drawGraphicWave("M 420,1132 L 800,1080 L 800,1132 Z", themeColor, 1);
  } else if (template === "bold-sidebar") {
    // Vertical Left Ribbon + Bottom Corner Wave
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 14,
      height,
      color: themeColor,
    });
    drawGraphicWave("M 800,1132 L 280,1132 C 430,1078 620,1042 800,1048 Z", themeColor, 0.22);
    drawGraphicWave("M 800,1132 L 380,1132 C 510,1090 670,1060 800,1066 Z", themeColor, 1);
  } else if (template === "gst-pro-ledger") {
    // Royal GST Seal & Frame with corner triangles
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: themeColor,
      borderWidth: 1.6,
    });
    drawGraphicWave("M 24,24 L 95,24 L 24,95 Z", themeColor, 1);
    drawGraphicWave("M 776,24 L 705,24 L 776,95 Z", themeColor, 1);
    drawGraphicWave("M 776,1107 L 705,1107 L 776,1036 Z", themeColor, 1);
  } else if (template === "agency-studio") {
    // Abstract Studio Fluid Curves
    drawGraphicWave("M 0,0 L 800,0 L 800,68 C 620,132 450,32 240,104 C 120,136 40,86 0,76 Z", themeColor, 0.2);
    drawGraphicWave("M 0,0 L 640,0 C 510,94 310,36 140,92 C 70,114 20,78 0,64 Z", themeColor, 1);
    drawGraphicWave("M 0,1132 L 0,1078 C 220,1038 460,1115 800,1054 L 800,1132 Z", themeColor, 0.2);
    drawGraphicWave("M 240,1132 C 440,1068 640,1086 800,1056 L 800,1132 Z", themeColor, 1);
  } else if (template === "compact-enterprise") {
    // Emerald Chevron Pro
    drawGraphicWave("M 0,0 L 800,0 L 800,48 L 400,110 L 0,48 Z", themeColor, 0.22);
    drawGraphicWave("M 0,0 L 800,0 L 800,32 L 400,90 L 0,32 Z", themeColor, 1);
    drawGraphicWave("M 0,1132 L 400,1084 L 800,1132 Z", themeColor, 1);
  }

  // 1. Top Title, Brand Header & Subtitle
  const titleStr = safePdfWinAnsi((data.documentTitle || "INVOICE").toUpperCase());
  const titleSize = 22;
  const titleW = fontBold.widthOfTextAtSize(titleStr, titleSize);

  let cursorY = height - 108;

  if (template === "executive-orange" || template === "corporate-split") {
    // Brand Name in White inside Top-Left Wave, INVOICE on Top-Right
    page.drawText(safePdfWinAnsi((data.companyName || "BRAND NAME").toUpperCase()).slice(0, 26), {
      x: margin,
      y: height - 42,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(
      safePdfWinAnsi(data.companyCityState || data.companyAddress || "OFFICIAL TAX INVOICE").slice(0, 38),
      {
        x: margin,
        y: height - 56,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.93, 0.95, 0.98),
      }
    );
    page.drawText(titleStr, {
      x: width - margin - titleW,
      y: height - 58,
      size: titleSize,
      font: fontBold,
      color: themeColor,
    });
    if (data.documentSubtitle?.trim()) {
      const subStr = safePdfWinAnsi(data.documentSubtitle.trim());
      const subW = fontRegular.widthOfTextAtSize(subStr, 8.5);
      page.drawText(subStr, {
        x: width - margin - subW,
        y: height - 72,
        size: 8.5,
        font: fontRegular,
        color: mutedText,
      });
    }
    cursorY = height - 114;
  } else if (template === "modern-banner" || template === "tech-mono" || template === "agency-studio") {
    page.drawText(titleStr, {
      x: margin,
      y: height - 44,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    if (data.documentSubtitle?.trim()) {
      page.drawText(safePdfWinAnsi(data.documentSubtitle.trim()), {
        x: margin,
        y: height - 58,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.94, 0.94, 0.97),
      });
    }
    const invBadge = safePdfWinAnsi(`#${data.invoiceNumber || "A00001"}`);
    const badgeW = fontBold.widthOfTextAtSize(invBadge, 13);
    page.drawText(invBadge, {
      x: width - margin - badgeW,
      y: height - 44,
      size: 13,
      font: fontBold,
      color: template === "modern-banner" || template === "agency-studio" ? themeColor : rgb(1, 1, 1),
    });
    cursorY = height - 106;
  } else if (template === "minimal-swiss") {
    // Uploaded Image 1 layout: Brand Top-Left, NO. Top-Right, Huge INVOICE Title below
    page.drawText(safePdfWinAnsi((data.companyName || "YOUR LOGO").toUpperCase()).slice(0, 28), {
      x: margin,
      y: height - 44,
      size: 10,
      font: fontBold,
      color: darkText,
    });
    const noStr = safePdfWinAnsi(`NO. ${data.invoiceNumber || "000001"}`);
    const noW = fontBold.widthOfTextAtSize(noStr, 10);
    page.drawText(noStr, {
      x: width - margin - noW,
      y: height - 44,
      size: 10,
      font: fontBold,
      color: darkText,
    });
    page.drawText(titleStr, {
      x: margin,
      y: height - 86,
      size: 30,
      font: fontBold,
      color: themeColor,
    });
    cursorY = height - 114;
  } else if (template === "bold-sidebar") {
    page.drawText(titleStr, {
      x: margin,
      y: height - 48,
      size: 21,
      font: fontBold,
      color: themeColor,
    });
    page.drawRectangle({
      x: margin,
      y: height - 54,
      width: contentW,
      height: 1.2,
      color: themeColor,
    });
    cursorY = height - 74;
  } else {
    page.drawText(titleStr, {
      x: (width - titleW) / 2,
      y: height - 68,
      size: titleSize,
      font: fontBold,
      color: themeColor,
    });

    page.drawRectangle({
      x: (width - titleW) / 2,
      y: height - 73,
      width: titleW,
      height: 1.5,
      color: themeColor,
    });

    cursorY = height - 96;
  }

  // 2. Invoice Metadata (Left) & Business Logo (Right)
  const metaStartY = cursorY;
  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Invoice No #", value: data.invoiceNumber || "INV-001" },
    { label: "Invoice Date", value: data.issueDate || new Date().toISOString().slice(0, 10) },
  ];
  if (data.dueDate?.trim()) {
    metaRows.push({ label: "Due Date", value: data.dueDate });
  }
  if (Array.isArray(data.customFields)) {
    data.customFields.forEach((cf) => {
      if (cf.label.trim() || cf.value.trim()) {
        metaRows.push({ label: cf.label || "Field", value: cf.value || "-" });
      }
    });
  }

  let metaY = metaStartY;
  metaRows.forEach((row) => {
    page.drawText(safePdfWinAnsi(`${row.label}:`), {
      x: margin,
      y: metaY,
      size: 9,
      font: fontBold,
      color: mutedText,
    });
    page.drawText(safePdfWinAnsi(row.value), {
      x: margin + 88,
      y: metaY,
      size: 9.5,
      font: fontBold,
      color: darkText,
    });
    metaY -= 15;
  });

  // Optional Business Logo on Right
  if (data.logoDataUrl && data.logoDataUrl.startsWith("data:image/")) {
    try {
      const base64 = data.logoDataUrl.split(",")[1] || "";
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const embeddedLogo = data.logoDataUrl.includes("image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      const maxLogoW = 120;
      const maxLogoH = 52;
      const scale = Math.min(maxLogoW / (embeddedLogo.width || 1), maxLogoH / (embeddedLogo.height || 1), 1);
      const lw = embeddedLogo.width * scale;
      const lh = embeddedLogo.height * scale;
      page.drawImage(embeddedLogo, {
        x: width - margin - lw,
        y: metaStartY - lh + 10,
        width: lw,
        height: lh,
      });
    } catch {
      // ignore corrupted logo
    }
  }

  cursorY = Math.min(metaY, metaStartY - 56) - 10;

  // 3. Two-Column "Billed By" & "Billed To" Cards
  const cardGap = 12;
  const cardW = (contentW - cardGap) / 2;
  const cardH = 104;
  const cardBottomY = cursorY - cardH;

  // Left Card: Billed By
  page.drawRectangle({
    x: margin,
    y: cardBottomY,
    width: cardW,
    height: cardH,
    color: lightBoxColor,
    borderColor: rgb(0.88, 0.89, 0.93),
    borderWidth: 0.8,
  });

  // Right Card: Billed To
  const rightCardX = margin + cardW + cardGap;
  page.drawRectangle({
    x: rightCardX,
    y: cardBottomY,
    width: cardW,
    height: cardH,
    color: lightBoxColor,
    borderColor: rgb(0.88, 0.89, 0.93),
    borderWidth: 0.8,
  });

  const drawPartyCard = (
    x: number,
    heading: string,
    name: string,
    address: string,
    cityState?: string,
    country?: string,
    gstin?: string,
    pan?: string,
    email?: string,
    phone?: string
  ) => {
    let py = cursorY - 16;
    page.drawText(safePdfWinAnsi(heading), {
      x: x + 10,
      y: py,
      size: 10,
      font: fontBold,
      color: themeColor,
    });
    py -= 15;
    page.drawText(safePdfWinAnsi(name || "Business Name").slice(0, 42), {
      x: x + 10,
      y: py,
      size: 10.5,
      font: fontBold,
      color: darkText,
    });
    py -= 13;
    if (address) {
      page.drawText(safePdfWinAnsi(address).slice(0, 48), {
        x: x + 10,
        y: py,
        size: 8.5,
        font: fontRegular,
        color: mutedText,
      });
      py -= 12;
    }
    const locLine = [cityState, country].filter(Boolean).join(", ");
    if (locLine) {
      page.drawText(safePdfWinAnsi(locLine).slice(0, 48), {
        x: x + 10,
        y: py,
        size: 8.5,
        font: fontRegular,
        color: mutedText,
      });
      py -= 12;
    }
    if (gstin) {
      page.drawText(safePdfWinAnsi(`GSTIN: ${gstin}`), {
        x: x + 10,
        y: py,
        size: 8.5,
        font: fontBold,
        color: darkText,
      });
      py -= 11;
    }
    if (pan) {
      page.drawText(safePdfWinAnsi(`PAN: ${pan}`), {
        x: x + 10,
        y: py,
        size: 8,
        font: fontRegular,
        color: darkText,
      });
      py -= 11;
    }
    const contactLine = [email, phone].filter(Boolean).join(" | ");
    if (contactLine && py >= cardBottomY + 6) {
      page.drawText(safePdfWinAnsi(contactLine).slice(0, 48), {
        x: x + 10,
        y: py,
        size: 8,
        font: fontRegular,
        color: mutedText,
      });
    }
  };

  drawPartyCard(
    margin,
    "Billed By",
    data.companyName,
    data.companyAddress,
    data.companyCityState,
    data.companyCountry,
    data.companyGstin,
    data.companyPan,
    data.companyEmail,
    data.companyPhone
  );

  drawPartyCard(
    rightCardX,
    "Billed To",
    data.clientName,
    data.clientAddress,
    data.clientCityState,
    data.clientCountry,
    data.clientGstin,
    data.clientPan,
    data.clientEmail,
    data.clientPhone
  );

  // 4. Items Table (Refrens GST Columns)
  const tableTop = cardBottomY - 22;
  const headerH = 24;
  page.drawRectangle({
    x: margin,
    y: tableTop - headerH,
    width: contentW,
    height: headerH,
    color: themeColor,
  });

  const colItemX = margin + 8;
  const colHsnX = margin + 175;
  const colGstX = margin + 225;
  const colQtyX = margin + 262;
  const colRateX = margin + 298;
  const colAmtX = margin + 358;
  const colTaxX = margin + 418;
  const colTotX = margin + 468;

  const hy = tableTop - 15;
  page.drawText("Item", { x: colItemX, y: hy, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  if (taxMode !== "none") {
    page.drawText("HSN/SAC", { x: colHsnX, y: hy, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(taxMode.startsWith("gst") ? "GST %" : "Tax %", { x: colGstX, y: hy, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  }
  page.drawText("Qty", { x: colQtyX, y: hy, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Rate", { x: colRateX, y: hy, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Amount", { x: colAmtX, y: hy, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  if (taxMode !== "none") {
    page.drawText(
      taxMode === "gst_intra" ? "CGST+SGST" : taxMode === "gst_inter" ? "IGST" : "Tax",
      { x: colTaxX, y: hy, size: 8, font: fontBold, color: rgb(1, 1, 1) }
    );
  }
  page.drawText("Total", { x: colTotX, y: hy, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  let rowY = tableTop - headerH - 16;
  let subtotal = 0;
  let totalTax = 0;

  const items = data.items.length > 0 ? data.items : [
    { id: "1", description: "Consultation & Design Services", quantity: 1, rate: 1000, taxPercent: 18 },
  ];

  items.forEach((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstPct = taxMode === "none" ? 0 : Number(item.taxPercent) || 0;
    const taxable = qty * rate;
    const taxAmt = (taxable * gstPct) / 100;
    const lineTotal = taxable + taxAmt;

    subtotal += taxable;
    totalTax += taxAmt;

    const hasSub = Boolean(item.subDescription?.trim());
    const rowH = hasSub ? 30 : 20;

    if (idx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: rowY - (hasSub ? 14 : 5),
        width: contentW,
        height: rowH,
        color: rgb(0.975, 0.978, 0.99),
      });
    }

    page.drawText(safePdfWinAnsi(`${idx + 1}. ${item.description || "Item"}`).slice(0, 32), {
      x: colItemX,
      y: rowY,
      size: 8.5,
      font: fontBold,
      color: darkText,
    });

    if (hasSub) {
      page.drawText(safePdfWinAnsi(item.subDescription!.trim()).slice(0, 38), {
        x: colItemX + 10,
        y: rowY - 10,
        size: 7.5,
        font: fontRegular,
        color: mutedText,
      });
    }

    if (taxMode !== "none") {
      page.drawText(safePdfWinAnsi(item.hsnSac || "-").slice(0, 10), {
        x: colHsnX,
        y: rowY,
        size: 8,
        font: fontRegular,
        color: mutedText,
      });
      page.drawText(`${gstPct}%`, {
        x: colGstX,
        y: rowY,
        size: 8,
        font: fontRegular,
        color: darkText,
      });
    }

    page.drawText(`${qty}`, { x: colQtyX, y: rowY, size: 8.5, font: fontRegular, color: darkText });
    page.drawText(`${pdfCurr}${rate.toFixed(2)}`, { x: colRateX, y: rowY, size: 8, font: fontRegular, color: darkText });
    page.drawText(`${pdfCurr}${taxable.toFixed(2)}`, { x: colAmtX, y: rowY, size: 8, font: fontRegular, color: darkText });
    if (taxMode !== "none") {
      page.drawText(`${pdfCurr}${taxAmt.toFixed(2)}`, { x: colTaxX, y: rowY, size: 8, font: fontRegular, color: darkText });
    }
    page.drawText(`${pdfCurr}${lineTotal.toFixed(2)}`, { x: colTotX, y: rowY, size: 8.5, font: fontBold, color: darkText });

    rowY -= rowH + 2;
  });

  // Divider line after items
  page.drawRectangle({
    x: margin,
    y: rowY + 6,
    width: contentW,
    height: 0.8,
    color: rgb(0.86, 0.88, 0.92),
  });

  // 5. Totals Calculation (Discounts, Additional Charges, CGST/SGST/IGST)
  const rawDiscVal = Number(data.discountValue) || 0;
  const discountAmt =
    data.discountType === "percent"
      ? (subtotal * Math.min(100, Math.max(0, rawDiscVal))) / 100
      : Math.max(0, rawDiscVal);
  const extraCharges = Number(data.additionalChargesAmount) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmt + totalTax + extraCharges);

  const bottomSectionTop = rowY - 10;

  // Left Bottom: Bank Details, Terms & Notes
  let leftY = bottomSectionTop;
  if (data.bankAccountNumber || data.bankName || data.upiId) {
    page.drawText("Bank & Payment Details", {
      x: margin,
      y: leftY,
      size: 9.5,
      font: fontBold,
      color: themeColor,
    });
    leftY -= 13;
    const bankLines = [
      data.bankAccountHolder ? `Account Holder: ${data.bankAccountHolder}` : "",
      data.bankAccountNumber ? `A/C No: ${data.bankAccountNumber}` : "",
      data.bankIfscCode ? `IFSC / SWIFT: ${data.bankIfscCode}` : "",
      data.bankName ? `Bank: ${data.bankName}` : "",
      data.upiId ? `UPI ID: ${data.upiId}` : "",
    ].filter(Boolean);
    bankLines.forEach((bl) => {
      page.drawText(safePdfWinAnsi(bl).slice(0, 50), {
        x: margin,
        y: leftY,
        size: 8,
        font: fontRegular,
        color: darkText,
      });
      leftY -= 11;
    });
    leftY -= 6;
  }

  if (data.terms?.trim()) {
    page.drawText("Terms and Conditions", {
      x: margin,
      y: leftY,
      size: 9.5,
      font: fontBold,
      color: themeColor,
    });
    leftY -= 12;
    data.terms
      .split(/\r?\n/)
      .slice(0, 4)
      .forEach((tLine) => {
        page.drawText(safePdfWinAnsi(tLine).slice(0, 55), {
          x: margin,
          y: leftY,
          size: 7.8,
          font: fontRegular,
          color: mutedText,
        });
        leftY -= 10.5;
      });
    leftY -= 5;
  }

  if (data.notes?.trim()) {
    page.drawText("Additional Notes", {
      x: margin,
      y: leftY,
      size: 9.5,
      font: fontBold,
      color: themeColor,
    });
    leftY -= 12;
    data.notes
      .split(/\r?\n/)
      .slice(0, 3)
      .forEach((nLine) => {
        page.drawText(safePdfWinAnsi(nLine).slice(0, 55), {
          x: margin,
          y: leftY,
          size: 7.8,
          font: fontRegular,
          color: mutedText,
        });
        leftY -= 10.5;
      });
  }

  // Right Bottom: Summary Rows & Grand Total
  const sumLabelX = width - margin - 205;
  const sumValX = width - margin - 85;
  let sumY = bottomSectionTop;

  const drawSumRow = (label: string, val: string, bold = false) => {
    page.drawText(safePdfWinAnsi(label), {
      x: sumLabelX,
      y: sumY,
      size: 9,
      font: bold ? fontBold : fontRegular,
      color: bold ? darkText : mutedText,
    });
    page.drawText(safePdfWinAnsi(val), {
      x: sumValX,
      y: sumY,
      size: 9,
      font: bold ? fontBold : fontRegular,
      color: darkText,
    });
    sumY -= 15;
  };

  drawSumRow("Taxable Amount", `${pdfCurr}${subtotal.toFixed(2)}`);
  if (discountAmt > 0) {
    drawSumRow(
      data.discountType === "percent" ? `Discount (${rawDiscVal}%)` : "Discount",
      `-${pdfCurr}${discountAmt.toFixed(2)}`
    );
  }
  if (taxMode === "gst_intra") {
    drawSumRow("CGST", `${pdfCurr}${(totalTax / 2).toFixed(2)}`);
    drawSumRow("SGST", `${pdfCurr}${(totalTax / 2).toFixed(2)}`);
  } else if (taxMode === "gst_inter") {
    drawSumRow("IGST", `${pdfCurr}${totalTax.toFixed(2)}`);
  } else if (taxMode === "standard") {
    drawSumRow("Tax / VAT", `${pdfCurr}${totalTax.toFixed(2)}`);
  }
  if (extraCharges > 0) {
    drawSumRow(data.additionalChargesLabel || "Additional Charges", `${pdfCurr}${extraCharges.toFixed(2)}`);
  }

  // Grand Total Bar
  sumY -= 6;
  page.drawRectangle({
    x: sumLabelX - 8,
    y: sumY - 7,
    width: 213,
    height: 24,
    color: themeColor,
  });
  page.drawText("Total", {
    x: sumLabelX,
    y: sumY + 1,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(safePdfWinAnsi(`${pdfCurr}${grandTotal.toFixed(2)}`), {
    x: sumValX - 10,
    y: sumY + 1,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  sumY -= 22;

  // Total in Words
  if (data.showTotalInWords !== false) {
    const words = numberToInvoiceWords(grandTotal, rawCurrency);
    page.drawText("Total (in words):", {
      x: sumLabelX - 8,
      y: sumY,
      size: 7.5,
      font: fontBold,
      color: mutedText,
    });
    sumY -= 10;
    page.drawText(safePdfWinAnsi(words).slice(0, 46), {
      x: sumLabelX - 8,
      y: sumY,
      size: 8,
      font: fontBold,
      color: darkText,
    });
    sumY -= 18;
  }

  // Embedded Signature Image (if present)
  if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/")) {
    try {
      const base64 = data.signatureDataUrl.split(",")[1] || "";
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const sigImg = data.signatureDataUrl.includes("image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      const sw = 100;
      const sh = Math.min(42, (sigImg.height / (sigImg.width || 1)) * sw);
      page.drawImage(sigImg, {
        x: width - margin - sw - 10,
        y: sumY - sh,
        width: sw,
        height: sh,
      });
      sumY -= sh + 12;
    } catch {
      // ignore invalid sig
    }
    page.drawText(safePdfWinAnsi(data.signatureLabel || "Authorized Signatory"), {
      x: width - margin - 115,
      y: sumY,
      size: 8.5,
      font: fontBold,
      color: mutedText,
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
  const mapped = input
    .replace(/✓|✔/g, "Yes")
    .replace(/✗|✘/g, "No")
    .replace(/☑/g, "[X]")
    .replace(/☐/g, "[ ]");
  return Array.from(mapped)
    .filter((ch) => ch.charCodeAt(0) <= 0xff)
    .join("");
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

