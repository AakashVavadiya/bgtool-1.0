import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface DominantColorItem {
  hex: string;
  rgb: string;
  hsl: string;
  percentage: number;
  r: number;
  g: number;
  b: number;
}

export interface ColorReportOptions {
  fileName?: string;
  dimensions?: { width: number; height: number };
  imageSrc?: string | null;
  activeHex: string;
  activeRgb: string;
  activeHsl: string;
  dominantColors: DominantColorItem[];
  sampledHistory: string[];
}

/**
 * Clean text for safe WinAnsi encoding in standard PDF fonts.
 */
function cleanText(text: string | null | undefined, fallback: string = ""): string {
  if (!text) return fallback;
  return (
    text
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || fallback
  );
}

/**
 * Parse hex string into normalized pdf-lib RGB values [0, 1].
 */
function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return {
    r: Math.max(0, Math.min(1, r / 255)),
    g: Math.max(0, Math.min(1, g / 255)),
    b: Math.max(0, Math.min(1, b / 255)),
  };
}

/**
 * Converts any image source into optimized JPEG bytes for embedding into PDF.
 */
async function getJpegBytesFromImageSrc(src: string): Promise<Uint8Array | null> {
  if (typeof document === "undefined" || !src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let w = img.naturalWidth || img.width || 300;
        let h = img.naturalHeight || img.height || 300;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        // White background for transparent PNGs
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return resolve(null);
            const arrayBuf = await blob.arrayBuffer();
            resolve(new Uint8Array(arrayBuf));
          },
          "image/jpeg",
          0.88
        );
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates an executive-grade, perfectly proportioned vector PDF color extraction report.
 */
export async function generateColorReportPdf(options: ColorReportOptions): Promise<{ blob: Blob; filename: string }> {
  const doc = await PDFDocument.create();

  const reportId = `CLR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  doc.setTitle(`Official Color Intelligence Report - ${reportId}`);
  doc.setAuthor("bg.tools Color Intelligence");
  doc.setSubject(`Color Palette & Dominant Extraction Report for ${options.fileName || "Image"}`);
  doc.setProducer("bg.tools Neural Palette Engine v2.0");
  doc.setCreationDate(new Date());

  // A4 Standard Dimensions: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  const { width, height } = page.getSize();
  const margin = 36;
  const contentWidth = width - margin * 2; // 523.28 pt

  // 1. Top Red Brand Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width,
    height: 5,
    color: rgb(0.88, 0.18, 0.18),
  });

  // 2. Header: Logo, Brand Typography & Report Details
  const headerY = height - 52;

  // Attempt to load official logo.png
  let logoDrawn = false;
  try {
    const logoRes = await fetch("/logo.png");
    if (logoRes.ok) {
      const logoBuffer = await logoRes.arrayBuffer();
      const embeddedLogo = await doc.embedPng(logoBuffer);
      const logoDims = embeddedLogo.scale(0.32);
      page.drawImage(embeddedLogo, {
        x: margin,
        y: headerY - 6,
        width: Math.min(36, logoDims.width),
        height: Math.min(36, logoDims.height),
      });
      logoDrawn = true;
    }
  } catch {
    logoDrawn = false;
  }

  if (!logoDrawn) {
    // Vector brand mark fallback
    page.drawRectangle({
      x: margin,
      y: headerY - 4,
      width: 34,
      height: 34,
      color: rgb(0.976, 0.451, 0.086),
    });
    page.drawText("bg", {
      x: margin + 7,
      y: headerY + 6,
      size: 17,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  // Brand Name & Subtitle
  const brandX = margin + 44;
  page.drawText("bg.tools", {
    x: brandX,
    y: headerY + 12,
    size: 19,
    font: fontBold,
    color: rgb(0.08, 0.11, 0.18),
  });

  page.drawText("Color Intelligence & Neural Spectrum Extraction Report", {
    x: brandX,
    y: headerY,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.52),
  });

  page.drawText("ISO/IEC 24-bit sRGB Spectrum Standard | Vector Verified Audit", {
    x: brandX,
    y: headerY - 11,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.55, 0.6, 0.66),
  });

  // Right Side Header Badge & Metadata
  const badgeWidth = 142;
  const badgeX = width - margin - badgeWidth;

  page.drawRectangle({
    x: badgeX,
    y: headerY + 8,
    width: badgeWidth,
    height: 20,
    color: rgb(0.98, 0.92, 0.92),
    borderColor: rgb(0.88, 0.22, 0.22),
    borderWidth: 1,
  });

  page.drawText("OFFICIAL COLOR AUDIT", {
    x: badgeX + 11,
    y: headerY + 14,
    size: 8,
    font: fontBold,
    color: rgb(0.85, 0.15, 0.15),
  });

  page.drawText(`Report ID: ${reportId}`, {
    x: badgeX,
    y: headerY - 3,
    size: 7.5,
    font: fontBold,
    color: rgb(0.2, 0.24, 0.3),
  });

  const nowFormatted = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  page.drawText(`Date: ${nowFormatted}`, {
    x: badgeX,
    y: headerY - 13,
    size: 7,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.56),
  });

  // Top Separator
  let curY = height - 76;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92),
  });

  curY -= 14;

  // 3. Hero Section: Analyzed Asset (with Real Embedded Image Thumbnail) + Active Color Card
  const heroCardHeight = 118;
  const colGap = 14;
  const colWidth = (contentWidth - colGap) / 2;

  // --- Left Card: Source Asset Preview ---
  page.drawRectangle({
    x: margin,
    y: curY - heroCardHeight,
    width: colWidth,
    height: heroCardHeight,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.86, 0.89, 0.93),
    borderWidth: 1,
  });

  page.drawText("SOURCE ASSET SPECIFICATION", {
    x: margin + 12,
    y: curY - 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.18, 0.22, 0.3),
  });

  // Try to embed thumbnail if imageSrc is available
  let thumbDrawn = false;
  if (options.imageSrc) {
    try {
      const jpegBytes = await getJpegBytesFromImageSrc(options.imageSrc);
      if (jpegBytes) {
        const embeddedImg = await doc.embedJpg(jpegBytes);
        const thumbBoxSize = 78;
        const thumbX = margin + 12;
        const thumbY = curY - heroCardHeight + 12;

        page.drawRectangle({
          x: thumbX,
          y: thumbY,
          width: thumbBoxSize,
          height: thumbBoxSize,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.8, 0.83, 0.87),
          borderWidth: 1,
        });

        // Compute aspect ratio fit
        const scale = Math.min(thumbBoxSize / embeddedImg.width, thumbBoxSize / embeddedImg.height);
        const drawW = embeddedImg.width * scale;
        const drawH = embeddedImg.height * scale;
        const offsetX = (thumbBoxSize - drawW) / 2;
        const offsetY = (thumbBoxSize - drawH) / 2;

        page.drawImage(embeddedImg, {
          x: thumbX + offsetX,
          y: thumbY + offsetY,
          width: drawW,
          height: drawH,
        });
        thumbDrawn = true;
      }
    } catch {
      thumbDrawn = false;
    }
  }

  // Metadata labels & values next to thumbnail
  const textLeftX = thumbDrawn ? margin + 98 : margin + 14;
  const maxTextW = thumbDrawn ? colWidth - 105 : colWidth - 28;

  const rawFileName = options.fileName || "Uploaded Image";
  const truncatedFileName =
    rawFileName.length > 20 ? `${rawFileName.slice(0, 18)}...` : rawFileName;

  const assetDetails = [
    { label: "File:", val: cleanText(truncatedFileName) },
    {
      label: "Dimensions:",
      val: options.dimensions
        ? `${options.dimensions.width} x ${options.dimensions.height} px`
        : "TrueColor Scan",
    },
    { label: "Color Model:", val: "24-bit sRGB TrueColor" },
    { label: "Engine:", val: "Karudi Neural Vision" },
  ];

  let metaY = curY - 36;
  assetDetails.forEach((row) => {
    page.drawText(row.label, {
      x: textLeftX,
      y: metaY,
      size: 7.5,
      font: fontBold,
      color: rgb(0.42, 0.46, 0.52),
    });
    page.drawText(row.val, {
      x: textLeftX + 54,
      y: metaY,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.08, 0.1, 0.14),
    });
    metaY -= 17;
  });

  // --- Right Card: Primary Active Color ---
  const rightCardX = margin + colWidth + colGap;
  page.drawRectangle({
    x: rightCardX,
    y: curY - heroCardHeight,
    width: colWidth,
    height: heroCardHeight,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.86, 0.89, 0.93),
    borderWidth: 1,
  });

  page.drawText("PRIMARY SELECTED COLOR", {
    x: rightCardX + 12,
    y: curY - 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.18, 0.22, 0.3),
  });

  // Active color swatch block
  const activeRgb01 = hexToRgb01(options.activeHex);
  const swatchBoxSize = 74;
  const swatchX = rightCardX + 12;
  const swatchY = curY - heroCardHeight + 14;

  page.drawRectangle({
    x: swatchX,
    y: swatchY,
    width: swatchBoxSize,
    height: swatchBoxSize,
    color: rgb(activeRgb01.r, activeRgb01.g, activeRgb01.b),
    borderColor: rgb(0.7, 0.73, 0.77),
    borderWidth: 1.5,
  });

  // Text details right of the swatch
  const colorDetailsX = swatchX + swatchBoxSize + 12;
  page.drawText(cleanText(options.activeHex, "#FFFFFF"), {
    x: colorDetailsX,
    y: curY - 38,
    size: 15,
    font: fontBold,
    color: rgb(0.08, 0.1, 0.14),
  });

  page.drawText(`RGB: ${cleanText(options.activeRgb, "rgb(255, 255, 255)")}`, {
    x: colorDetailsX,
    y: curY - 53,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.48),
  });

  page.drawText(`HSL: ${cleanText(options.activeHsl, "hsl(0, 0%, 100%)")}`, {
    x: colorDetailsX,
    y: curY - 67,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.48),
  });

  page.drawText(`CSS: --active: ${options.activeHex};`, {
    x: colorDetailsX,
    y: curY - 81,
    size: 7,
    font: fontMono,
    color: rgb(0.85, 0.18, 0.18),
  });

  curY -= heroCardHeight + 16;

  // 4. Dominant Palette Section Header
  page.drawText("EXTRACTED DOMINANT COLOR PALETTE", {
    x: margin,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  page.drawText("Pixel frequency breakdown across detected clusters", {
    x: margin + 215,
    y: curY,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.62),
  });

  curY -= 10;

  // Dominant Colors Table
  const tableTopY = curY;
  const headerHeight = 18;
  const rowHeight = 23;
  const colorsToRender = options.dominantColors.slice(0, 6); // Top 6 colors for comfortable fit

  // Table Header Background
  page.drawRectangle({
    x: margin,
    y: tableTopY - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: rgb(0.92, 0.94, 0.96),
    borderColor: rgb(0.84, 0.87, 0.91),
    borderWidth: 1,
  });

  // Table Columns Setup
  const colX = {
    swatch: margin + 10,
    hex: margin + 40,
    rgb: margin + 130,
    hsl: margin + 255,
    coverage: margin + 375,
    bar: margin + 438,
  };

  page.drawText("SWATCH", { x: colX.swatch, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });
  page.drawText("HEX CODE", { x: colX.hex, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });
  page.drawText("RGB VALUES", { x: colX.rgb, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });
  page.drawText("HSL VALUES", { x: colX.hsl, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });
  page.drawText("COVERAGE", { x: colX.coverage, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });
  page.drawText("SPECTRUM SHARE", { x: colX.bar, y: tableTopY - 13, size: 7, font: fontBold, color: rgb(0.3, 0.35, 0.42) });

  let tableRowY = tableTopY - headerHeight;

  colorsToRender.forEach((c, idx) => {
    tableRowY -= rowHeight;
    const isEven = idx % 2 === 0;

    // Row Background
    page.drawRectangle({
      x: margin,
      y: tableRowY,
      width: contentWidth,
      height: rowHeight,
      color: isEven ? rgb(1, 1, 1) : rgb(0.98, 0.985, 0.99),
      borderColor: rgb(0.88, 0.9, 0.93),
      borderWidth: 0.5,
    });

    // Swatch box
    const rgb01 = hexToRgb01(c.hex);
    page.drawRectangle({
      x: colX.swatch,
      y: tableRowY + 4,
      width: 15,
      height: 15,
      color: rgb(rgb01.r, rgb01.g, rgb01.b),
      borderColor: rgb(0.65, 0.68, 0.72),
      borderWidth: 0.8,
    });

    // HEX
    page.drawText(cleanText(c.hex, "#000000"), {
      x: colX.hex,
      y: tableRowY + 7.5,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.16),
    });

    // RGB
    page.drawText(cleanText(c.rgb, "rgb(0,0,0)"), {
      x: colX.rgb,
      y: tableRowY + 7.5,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.42),
    });

    // HSL
    page.drawText(cleanText(c.hsl, "hsl(0,0%,0%)"), {
      x: colX.hsl,
      y: tableRowY + 7.5,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.42),
    });

    // Coverage text
    const pctText = `${c.percentage}%`;
    page.drawText(pctText, {
      x: colX.coverage,
      y: tableRowY + 7.5,
      size: 7.5,
      font: fontBold,
      color: idx === 0 ? rgb(0.85, 0.2, 0.2) : rgb(0.2, 0.25, 0.3),
    });

    if (idx === 0) {
      page.drawText("• DOMINANT", {
        x: colX.coverage + 24,
        y: tableRowY + 8,
        size: 5.5,
        font: fontBold,
        color: rgb(0.85, 0.2, 0.2),
      });
    }

    // Distribution visual bar
    const maxBarWidth = 62;
    const barWidth = Math.max(3, Math.min(maxBarWidth, (c.percentage / 100) * maxBarWidth));

    page.drawRectangle({
      x: colX.bar,
      y: tableRowY + 7,
      width: maxBarWidth,
      height: 9,
      color: rgb(0.92, 0.93, 0.95),
    });

    page.drawRectangle({
      x: colX.bar,
      y: tableRowY + 7,
      width: barWidth,
      height: 9,
      color: idx === 0 ? rgb(0.88, 0.2, 0.2) : rgb(0.25, 0.55, 0.9),
    });
  });

  curY = tableRowY - 14;

  // 5. Visual Swatch Board / Palette Strip
  page.drawText("COLOR HARMONY & PALETTE SPECTRUM", {
    x: margin,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  curY -= 10;

  // Render horizontal swatch board
  const swatchCardHeight = 44;
  page.drawRectangle({
    x: margin,
    y: curY - swatchCardHeight,
    width: contentWidth,
    height: swatchCardHeight,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.86, 0.89, 0.93),
    borderWidth: 1,
  });

  const displayPalette =
    options.dominantColors.length > 0
      ? options.dominantColors.slice(0, 7)
      : [{ hex: options.activeHex, percentage: 100, rgb: options.activeRgb, hsl: options.activeHsl, r: 255, g: 255, b: 255 }];

  const swatchItemW = (contentWidth - 24) / displayPalette.length;

  displayPalette.forEach((item, i) => {
    const sRgb = hexToRgb01(item.hex);
    const itemX = margin + 12 + i * swatchItemW;
    const itemY = curY - swatchCardHeight + 8;

    // Color bar
    page.drawRectangle({
      x: itemX + 2,
      y: itemY + 12,
      width: swatchItemW - 6,
      height: 16,
      color: rgb(sRgb.r, sRgb.g, sRgb.b),
      borderColor: rgb(0.7, 0.73, 0.77),
      borderWidth: 1,
    });

    // Label
    page.drawText(cleanText(item.hex), {
      x: itemX + 3,
      y: itemY + 2,
      size: 6.5,
      font: fontMonoBold,
      color: rgb(0.2, 0.25, 0.32),
    });
  });

  curY -= swatchCardHeight + 14;

  // 6. Developer Integration & CSS Variables Code Block (Generous height - Zero Cutoff!)
  page.drawText("DEVELOPER CODE SPECIFICATION & CSS VARIABLES", {
    x: margin,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  curY -= 8;

  const codeBoxHeight = 98; // Generous height to fit all lines with ample margin!
  page.drawRectangle({
    x: margin,
    y: curY - codeBoxHeight,
    width: contentWidth,
    height: codeBoxHeight,
    color: rgb(0.07, 0.09, 0.13), // Premium dark theme
    borderColor: rgb(0.18, 0.22, 0.28),
    borderWidth: 1,
  });

  let codeY = curY - 16;
  const codeLines = [
    `/* bg.tools - Auto Generated Palette CSS Variables */`,
    `:root {`,
    `  --color-active: ${options.activeHex};`,
    ...colorsToRender.slice(0, 3).map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.percentage}% dominant */`),
    `}`,
  ];

  codeLines.forEach((line) => {
    page.drawText(line, {
      x: margin + 14,
      y: codeY,
      size: 7.5,
      font: fontMono,
      color: line.startsWith("/*")
        ? rgb(0.45, 0.52, 0.6)
        : line.includes("--color-active")
        ? rgb(0.95, 0.45, 0.25)
        : rgb(0.85, 0.9, 0.95),
    });
    codeY -= 13;
  });

  // 7. Footer & Authenticity Seal (Fixed at bottom safe margin)
  page.drawLine({
    start: { x: margin, y: 44 },
    end: { x: width - margin, y: 44 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92),
  });

  page.drawText("bg.tools Color Intelligence", {
    x: margin,
    y: 30,
    size: 8,
    font: fontBold,
    color: rgb(0.85, 0.15, 0.15),
  });

  page.drawText("| Official Media Extraction Engine • Verified Vector Document", {
    x: margin + 110,
    y: 30,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.58),
  });

  page.drawText("Page 1 of 1", {
    x: width - margin - 50,
    y: 30,
    size: 8,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.52),
  });

  // Save PDF as bytes and return Blob
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const filename = `color-report-${options.activeHex.replace("#", "").toLowerCase()}-${Date.now().toString(36)}.pdf`;

  return { blob, filename };
}
