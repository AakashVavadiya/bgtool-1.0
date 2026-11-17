// Client-side PDF, ZIP, and Word (.docx) page rasterization utilities.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export function sanitizeHtmlForImageExport(html: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 1. Remove dangerous executable and framing elements
  const DANGEROUS_TAGS = [
    "script",
    "iframe",
    "object",
    "embed",
    "applet",
    "base",
    "meta",
    "form",
    "noscript",
    "portal",
  ];
  DANGEROUS_TAGS.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  // 2. Strip inline event handlers and dangerous protocol attributes
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    const attrsToRemove: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (!attr) continue;
      const attrName = attr.name.toLowerCase();
      if (attrName.startsWith("on")) {
        attrsToRemove.push(attr.name);
      } else if (
        attrName === "href" ||
        attrName === "src" ||
        attrName === "action" ||
        attrName === "formaction" ||
        attrName === "data"
      ) {
        const val = attr.value.trim().toLowerCase();
        if (
          val.startsWith("javascript:") ||
          val.startsWith("vbscript:") ||
          val.startsWith("data:text/html")
        ) {
          attrsToRemove.push(attr.name);
        }
      }
    }
    attrsToRemove.forEach((name) => el.removeAttribute(name));

    const inlineStyle = el.getAttribute("style");
    if (inlineStyle) {
      if (/expression\s*\(|javascript\s*:/i.test(inlineStyle)) {
        el.removeAttribute("style");
      }
    }
  });

  // 3. Sanitize style tags
  doc.querySelectorAll("style").forEach((styleEl) => {
    const css = styleEl.textContent || "";
    if (/expression\s*\(|javascript\s*:/i.test(css)) {
      styleEl.remove();
    }
  });

  // 4. Sanitize link tags
  doc.querySelectorAll("link").forEach((linkEl) => {
    const rel = (linkEl.getAttribute("rel") || "").toLowerCase();
    if (rel !== "stylesheet") {
      linkEl.remove();
      return;
    }
    const href = (linkEl.getAttribute("href") || "").trim().toLowerCase();
    if (
      !href.startsWith("http://") &&
      !href.startsWith("https://") &&
      !href.startsWith("/") &&
      !href.startsWith("./") &&
      !href.startsWith("data:text/css")
    ) {
      linkEl.remove();
    }
  });

  return doc;
}

export const tryRawSvgFallback = (
  rawHtml: string,
  width: number,
  height: number,
  bgColor: string,
  format: "PNG" | "JPG",
  resolve: (res: string) => void,
  reject: (err: any) => void
) => {
  try {
    const parsedDoc = sanitizeHtmlForImageExport(rawHtml);
    const serializer = new XMLSerializer();

    // Extract styles and link tags
    const styleTags = Array.from(parsedDoc.querySelectorAll("style, link[rel='stylesheet']"))
      .map((s) => serializer.serializeToString(s))
      .join("\n");

    let bodyInner = "";
    if (parsedDoc.body && parsedDoc.body.childNodes.length > 0) {
      bodyInner = Array.from(parsedDoc.body.childNodes)
        .map((n) => serializer.serializeToString(n))
        .join("");
    } else {
      bodyInner = "";
    }

    const bgStyle = bgColor === "transparent" ? "" : `background-color: ${bgColor};`;
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${width}px; height: ${height}px; box-sizing: border-box; margin: 0; padding: 0; overflow: hidden; ${bgStyle}">
          ${styleTags}
          ${bodyInner}
        </div>
      </foreignObject>
    </svg>`;

    const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context error");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.scale(scale, scale);

      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = format === "JPG" ? canvas.toDataURL("image/jpeg", 0.95) : canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    img.onerror = (err) => reject(err || new Error("SVG rendering failed"));
    img.src = encoded;
  } catch (err) {
    reject(err);
  }
};


// CUSTOM TOOL ENGINE FUNCTIONS (Zero external libraries)


// Image → PDF (Standard PDF 1.4 binary writer)
export interface PdfOptions {
  pageSize?: "auto" | "a4_portrait" | "a4_landscape" | "letter_portrait" | "letter_landscape";
  margin?: "none" | "small" | "normal" | "large";
  quality?: number;
}

export const buildPdfFromImageDataUrl = (
  dataUrl: string,
  imgW: number,
  imgH: number,
  options: PdfOptions = {}
): Blob => {
  let jpegDataUrl = dataUrl;
  if (!jpegDataUrl.startsWith("data:image/jpeg") && typeof document !== "undefined") {
    try {
      const c = document.createElement("canvas");
      c.width = imgW || 800;
      c.height = imgH || 600;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        const tempImg = new Image();
        tempImg.src = dataUrl;
        ctx.drawImage(tempImg, 0, 0, c.width, c.height);
        jpegDataUrl = c.toDataURL("image/jpeg", 0.95);
      }
    } catch {
      // fallback to original
    }
  }

  const base64 = jpegDataUrl.split(",")[1] ?? "";
  const raw = atob(base64);
  const imgBuf = new ArrayBuffer(raw.length);
  const imgBytes = new Uint8Array(imgBuf);
  for (let i = 0; i < raw.length; i++) imgBytes[i] = raw.charCodeAt(i) & 0xff;

  // 1. Calculate Page Dimensions in PDF points (72 points = 1 inch, 96px = 72pt)
  let pageW = Math.round((imgW * 72) / 96);
  let pageH = Math.round((imgH * 72) / 96);

  let marginPt = 0;
  if (options.margin === "small") marginPt = 14; // ~5mm
  else if (options.margin === "normal") marginPt = 34; // ~12mm
  else if (options.margin === "large") marginPt = 56; // ~20mm

  const pageSizeMode = options.pageSize || "auto";

  if (pageSizeMode === "a4_portrait") {
    pageW = 595;
    pageH = 842;
  } else if (pageSizeMode === "a4_landscape") {
    pageW = 842;
    pageH = 595;
  } else if (pageSizeMode === "letter_portrait") {
    pageW = 612;
    pageH = 792;
  } else if (pageSizeMode === "letter_landscape") {
    pageW = 792;
    pageH = 612;
  }

  // 2. Position and fit image inside page bounds respecting margin
  const availW = Math.max(10, pageW - marginPt * 2);
  const availH = Math.max(10, pageH - marginPt * 2);

  let drawW = availW;
  let drawH = (imgH / imgW) * drawW;

  if (drawH > availH) {
    drawH = availH;
    drawW = (imgW / imgH) * drawH;
  }

  const drawX = Math.round((pageW - drawW) / 2);
  const drawY = Math.round((pageH - drawH) / 2);

  // 3. Assemble standard PDF 1.4 objects
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushString = (str: string) => {
    const bytes = enc.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const recordObj = (str: string) => {
    offsets.push(currentOffset);
    pushString(str);
  };

  // PDF Header (PDF 1.4 + binary marker for reliable binary transmission)
  pushString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Obj 1: Catalog
  recordObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2: Pages Collection
  recordObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Obj 3: Page Definition
  recordObj(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /ProcSet [/PDF /ImageC /ImageI] /XObject << /Im1 5 0 R >> >> >>\nendobj\n`
  );

  // Obj 4: Content Stream (draw image positioned and scaled)
  const streamContent = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const streamBytes = enc.encode(streamContent);
  recordObj(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream\nendobj\n`
  );

  // Obj 5: Image XObject (Standard JPEG stream)
  const colorSpace = "/DeviceRGB";

  recordObj(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushString("\nendstream\nendobj\n");

  // Cross-Reference Table (XRef)
  const startXref = currentOffset;
  pushString("xref\n0 6\n");
  pushString("0000000000 65535 f \n");
  for (let i = 0; i < offsets.length; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    pushString(`${offStr} 00000 n \n`);
  }

  // Trailer & EOF
  pushString(
    `trailer\n<< /Size 6 /Root 1 0 R /Info << /Producer (BG Tool Image-to-PDF Engine) /CreationDate (D:${new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14)}Z) >> >>\nstartxref\n${startXref}\n%%EOF\n`
  );

  return new Blob(chunks as any[], { type: "application/pdf" });
};

// Custom ZIP builder (Store method — no compression, spec-valid)
export const buildZip = (files: { name: string; data: Uint8Array<ArrayBufferLike> }[]): Uint8Array => {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  const u16 = (n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
  const u32 = (n: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };

  const crc32 = (data: Uint8Array): number => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) crc = (table[(crc ^ (data[i] ?? 0)) & 0xFF] ?? 0) ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  const concat = (...arrs: Uint8Array[]) => {
    const total = arrs.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const a of arrs) { out.set(a, pos); pos += a.length; }
    return out;
  };

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);
    const localHeader = concat(
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // local file sig
      u16(20), u16(0), u16(0),                  // version, flags, method (store=0)
      u16(0), u16(0),                            // mod time, mod date
      u32(crc), u32(file.data.length), u32(file.data.length),
      u16(nameBytes.length), u16(0),
      nameBytes
    );
    parts.push(localHeader, file.data);

    const cdEntry = concat(
      new Uint8Array([0x50, 0x4B, 0x01, 0x02]), // central dir sig
      u16(20), u16(20), u16(0), u16(0),
      u16(0), u16(0),
      u32(crc), u32(file.data.length), u32(file.data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(offset),
      nameBytes
    );
    centralDir.push(cdEntry);
    offset += localHeader.length + file.data.length;
  }

  const cdStart = offset;
  const cdBytes = concat(...centralDir);
  const eocd = concat(
    new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
    u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(cdBytes.length), u32(cdStart),
    u16(0)
  );

  return concat(...parts, cdBytes, eocd);
};

// & OCR Builders (High-performance, spec-valid OpenXML)
export {
  parseOcrTextToGrid,
  parseOcrTsvToGrid,
  buildEditableDocxFromOcr,
  buildDocxFromImage,
  buildEditableXlsxFromOcr,
  buildXlsxFromImage,
  buildPptxFromOcrAndImage,
  buildPptxFromImage,
  performAdvancedOcr,
  getExcelColumnLetter,
  type AdvancedOcrResult,
} from "@/lib/ocrEngine";
import { parseOcrTextToGrid, parseOcrTsvToGrid, buildEditableDocxFromOcr, buildDocxFromImage, buildEditableXlsxFromOcr, buildXlsxFromImage, buildPptxFromOcrAndImage, buildPptxFromImage, performAdvancedOcr, getExcelColumnLetter, type AdvancedOcrResult } from "@/lib/ocrEngine";

// Custom ZIP reader (scan central directory with deflate decompression)
export const extractTextFromZip = async (buffer: ArrayBuffer, targetPath: string): Promise<string | null> => {
  try {
    const data = new Uint8Array(buffer);
    if (data.length < 22) return null;
    const view = new DataView(buffer);
    const dec = new TextDecoder();

    // 1. Search for End of Central Directory signature: 0x06054b50
    let eocdOffset = -1;
    const maxSearch = Math.min(data.length, 65535 + 22);
    for (let i = data.length - 22; i >= data.length - maxSearch; i--) {
      if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1 || eocdOffset + 22 > data.length) return null;

    const cdOffset = view.getUint32(eocdOffset + 16, true);
    const cdSize = view.getUint32(eocdOffset + 12, true);
    if (cdOffset >= data.length || cdOffset + cdSize > data.length) return null;

    let pos = cdOffset;
    while (pos + 46 <= cdOffset + cdSize && pos + 46 <= data.length) {
      if (view.getUint32(pos, true) !== 0x02014b50) break;
      const method = view.getUint16(pos + 10, true);
      const compSize = view.getUint32(pos + 20, true);
      const nameLen = view.getUint16(pos + 28, true);
      const extraLen = view.getUint16(pos + 30, true);
      const commentLen = view.getUint16(pos + 32, true);
      const localOffset = view.getUint32(pos + 42, true);

      if (pos + 46 + nameLen > data.length) break;
      const name = dec.decode(data.slice(pos + 46, pos + 46 + nameLen));

      if (
        name === targetPath ||
        name.endsWith("/" + targetPath) ||
        name.toLowerCase() === targetPath.toLowerCase()
      ) {
        if (localOffset + 30 > data.length) break;
        const localNameLen = view.getUint16(localOffset + 26, true);
        const localExtraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLen + localExtraLen;
        if (dataStart + compSize > data.length) break;
        const rawBytes = data.slice(dataStart, dataStart + compSize);

        if (method === 0) {
          return dec.decode(rawBytes);
        } else if (method === 8 && typeof DecompressionStream !== "undefined") {
          try {
            const ds = new DecompressionStream("deflate-raw");
            const stream = new Response(new Blob([rawBytes]).stream().pipeThrough(ds));
            return await stream.text();
          } catch {
            try {
              const ds2 = new DecompressionStream("deflate");
              const stream2 = new Response(new Blob([rawBytes]).stream().pipeThrough(ds2));
              return await stream2.text();
            } catch {
              return null;
            }
          }
        }
      }
      const entryLen = 46 + nameLen + extraLen + commentLen;
      if (entryLen <= 0) break;
      pos += entryLen;
    }
    return null;
  } catch {
    return null;
  }
};

// Document → Image canvas renderers
export const renderTextToCanvas = (
  lines: string[],
  w: number,
  h: number,
  opts: {
    bg: string;
    textColor: string;
    titleColor: string;
    font: string;
    fontSize: number;
    lineH: number;
    paddingX: number;
    paddingY: number;
  }
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, w, h);

  let y = opts.paddingY;
  ctx.font = `bold ${opts.fontSize + 4}px ${opts.font}`;
  ctx.fillStyle = opts.titleColor;
  ctx.fillText(lines[0] || "Document", opts.paddingX, y + opts.fontSize);
  y += opts.lineH * 1.5;

  ctx.font = `${opts.fontSize}px ${opts.font}`;
  ctx.fillStyle = opts.textColor;

  for (let i = 1; i < lines.length && y < h - opts.paddingY; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      y += opts.lineH * 0.5;
      continue;
    }
    const words = line.split(" ");
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(test).width > w - opts.paddingX * 2) {
        ctx.fillText(currentLine, opts.paddingX, y);
        y += opts.lineH;
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, opts.paddingX, y);
      y += opts.lineH;
    }
  }

  return canvas.toDataURL("image/png");
};

export const generateLockedPdfCanvas = (message: string = "This PDF document is password-protected."): string => {
  const canvasW = 800;
  const canvasH = 1050;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background sheet
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Subtle grid
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1;
  for (let x = 40; x < canvasW; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
  }
  for (let y = 40; y < canvasH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvasW - 40, canvasH - 40);

  // Top header banner
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(20, 20, canvasW - 40, 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.fillText("🔒 Protected PDF Document", 48, 62);

  // Center Shield Box
  const boxW = 560;
  const boxH = 340;
  const boxX = (canvasW - boxW) / 2;
  const boxY = (canvasH - boxH) / 2 - 20;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = message.includes("Incorrect") ? "#fca5a5" : "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Lock Icon Symbol (large)
  ctx.font = "64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(message.includes("Incorrect") ? "⚠️" : "🔐", canvasW / 2, boxY + 90);

  // Title
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(message.includes("Incorrect") ? "Incorrect Password" : "Password Required", canvasW / 2, boxY + 150);

  // Subtitle / message
  ctx.fillStyle = message.includes("Incorrect") ? "#ef4444" : "#64748b";
  ctx.font = message.includes("Incorrect") ? "bold 16px system-ui, sans-serif" : "15px system-ui, sans-serif";
  ctx.fillText(message, canvasW / 2, boxY + 190);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("Enter document password to unlock, preview and convert.", canvasW / 2, boxY + 230);

  // Security Pill
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(canvasW / 2 - 130, boxY + 270, 260, 36);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillText("SECURE ENCRYPTED PDF", canvasW / 2, boxY + 293);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
};

export const renderPdfToImage = async (
  buffer: ArrayBuffer,
  pageNumber: number = 1,
  scale: number = 2.0,
  outputFormat: "PNG" | "JPG" = "PNG",
  bgColor: string = "#ffffff",
  password?: string
): Promise<{
  dataUrl: string;
  totalPages: number;
  width: number;
  height: number;
  isPasswordProtected?: boolean;
  isUnlocked?: boolean;
  passwordError?: string | null;
}> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }
    } catch {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/build/pdf.worker.min.mjs`;
      } catch { }
    }

    const copy = buffer.slice(0);
    const dataUint8 = new Uint8Array(copy);

    const loadingTask = pdfjsLib.getDocument({
      data: dataUint8,
      password: password || undefined,
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/standard_fonts/`,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("PDF load timeout")), 12000)
    );

    let pdfDoc;
    try {
      pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise]);
    } catch (loadErr: any) {
      if (
        loadErr?.name === "PasswordException" ||
        loadErr?.code === 1 ||
        loadErr?.code === 2 ||
        loadErr?.message?.toLowerCase().includes("password")
      ) {
        const isWrong = loadErr?.code === 2 || (Boolean(password) && password!.length > 0);
        const errMsg = isWrong ? "Incorrect password. Please try again." : "This PDF document is password-protected.";
        return {
          dataUrl: generateLockedPdfCanvas(errMsg),
          totalPages: 1,
          width: 800,
          height: 1050,
          isPasswordProtected: true,
          isUnlocked: false,
          passwordError: isWrong ? "Incorrect password. Please try again." : null,
        };
      }
      throw loadErr;
    }

    const totalPages = Math.max(1, pdfDoc.numPages || 1);
    const pageNum = Math.min(Math.max(1, pageNumber), totalPages);
    const page = await pdfDoc.getPage(pageNum);

    const targetScale = Math.max(1.0, Math.min(4.0, scale || 2.0));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(10, Math.round(viewport.width));
    canvas.height = Math.max(10, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    // Try rendering with print intent or display intent
    try {
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport,
        intent: "print",
      } as any);
      await renderTask.promise;
    } catch (printErr) {
      console.warn("Print intent render fallback to display intent:", printErr);
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport,
        intent: "display",
      } as any);
      await renderTask.promise;
    }

    // If custom non-white background is requested, composite it
    if (bgColor && bgColor !== "#ffffff" && bgColor !== "transparent") {
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      const bgCtx = bgCanvas.getContext("2d");
      if (bgCtx) {
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(canvas, 0, 0);
        const mime = outputFormat === "JPG" ? "image/jpeg" : "image/png";
        return {
          dataUrl: bgCanvas.toDataURL(mime, 0.95),
          totalPages,
          width: canvas.width,
          height: canvas.height,
          isPasswordProtected: false,
          isUnlocked: true,
          passwordError: null,
        };
      }
    }

    const mime = outputFormat === "JPG" ? "image/jpeg" : "image/png";
    const dataUrl = canvas.toDataURL(mime, 0.95);
    return {
      dataUrl,
      totalPages,
      width: canvas.width,
      height: canvas.height,
      isPasswordProtected: false,
      isUnlocked: true,
      passwordError: null,
    };
  } catch (err) {
    console.warn("PDF render fallback:", err);
    const canvasW = Math.round(794 * (scale / 1.5));
    const canvasH = Math.round(1123 * (scale / 1.5));
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor === "transparent" ? "#ffffff" : bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Decorative PDF Header Banner
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 0, canvasW, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText("📄 PDF Document", 40, 44);

    // Content Card
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(40, 110, canvasW - 80, canvasH - 160);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 110, canvasW - 80, canvasH - 160);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillText("PDF Document Preview", 70, 160);

    ctx.font = "16px system-ui, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`Page ${pageNumber} of PDF Document · Ready for High-Resolution Image Export`, 70, 200);

    const mime = outputFormat === "JPG" ? "image/jpeg" : "image/png";
    return { dataUrl: canvas.toDataURL(mime, 0.95), totalPages: 1, width: canvasW, height: canvasH };
  }
};

export const renderAllPdfPagesToZip = async (
  buffer: ArrayBuffer,
  totalPages: number,
  scale: number = 2.0,
  outputFormat: "PNG" | "JPG" = "PNG",
  bgColor: string = "#ffffff",
  baseName: string = "document",
  password?: string,
  onProgress?: (curr: number, total: number) => void
): Promise<{ zipBlob: Blob; firstPageDataUrl: string; width: number; height: number }> => {
  const pdfjsLib = await import("pdfjs-dist");
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/build/pdf.worker.min.mjs`;
    } catch { }
  }

  const copy = buffer.slice(0);
  const dataUint8 = new Uint8Array(copy);
  const loadingTask = pdfjsLib.getDocument({
    data: dataUint8,
    password: password || undefined,
    useSystemFonts: true,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/standard_fonts/`,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = Math.max(1, pdfDoc.numPages || totalPages);
  const ext = outputFormat === "JPG" ? "jpg" : "png";
  const mime = outputFormat === "JPG" ? "image/jpeg" : "image/png";

  const zipEntries: { name: string; data: Uint8Array }[] = [];
  let firstPageDataUrl = "";
  let firstW = 0;
  let firstH = 0;

  for (let p = 1; p <= numPages; p++) {
    onProgress?.(p, numPages);
    const page = await pdfDoc.getPage(p);
    const targetScale = Math.max(1.0, Math.min(4.0, scale || 2.0));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(10, Math.round(viewport.width));
    canvas.height = Math.max(10, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");

    if (ctx) {
      try {
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          intent: "print",
        } as any);
        await renderTask.promise;
      } catch {
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          intent: "display",
        } as any);
        await renderTask.promise;
      }

      let finalCanvas = canvas;
      if (bgColor && bgColor !== "#ffffff" && bgColor !== "transparent") {
        const bgCanvas = document.createElement("canvas");
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        const bgCtx = bgCanvas.getContext("2d");
        if (bgCtx) {
          bgCtx.fillStyle = bgColor;
          bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
          bgCtx.drawImage(canvas, 0, 0);
          finalCanvas = bgCanvas;
        }
      }

      const dataUrl = finalCanvas.toDataURL(mime, 0.95);
      if (p === 1) {
        firstPageDataUrl = dataUrl;
        firstW = finalCanvas.width;
        firstH = finalCanvas.height;
      }

      const base64 = dataUrl.split(",")[1] || "";
      const binaryStr = atob(base64);
      const uint8 = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        uint8[i] = binaryStr.charCodeAt(i);
      }

      const pageIndexStr = String(p).padStart(numPages >= 10 ? 2 : 1, "0");
      zipEntries.push({
        name: `${baseName}_page_${pageIndexStr}.${ext}`,
        data: uint8,
      });
    }
  }

  const zipUint8 = buildZip(zipEntries);
  const zipBlob = new Blob([zipUint8 as BlobPart], { type: "application/zip" });
  return { zipBlob, firstPageDataUrl, width: firstW, height: firstH };
};

export interface WordDocumentModel {
  pages: {
    lines: {
      text: string;
      y: number;
      fontSize: number;
      isBold: boolean;
      align: "left" | "center" | "right";
    }[];
  }[];
  totalPages: number;
}

export const parseWordDocumentToPages = async (
  buffer: ArrayBuffer,
  fileName: string,
  fontFamily: string,
  fontSize: number,
  showHeader: boolean
): Promise<WordDocumentModel> => {
  const pages: {
    lines: {
      text: string;
      y: number;
      fontSize: number;
      isBold: boolean;
      align: "left" | "center" | "right";
    }[];
  }[] = [];

  let paragraphs: {
    text: string;
    isHeading: boolean;
    isBold: boolean;
    align: "left" | "center" | "right";
    hasPageBreakBefore: boolean;
  }[] = [];

  try {
    const xml = await extractTextFromZip(buffer, "word/document.xml");
    if (xml) {
      const dom = new DOMParser().parseFromString(xml, "text/xml");
      const pNodes = Array.from(dom.querySelectorAll("w\\:p, p"));
      pNodes.forEach((p) => {
        const hasBreak = !!p.querySelector("w\\:br[w\\:type='page'], lastRenderedPageBreak");
        const jcVal = p.querySelector("w\\:jc, jc")?.getAttribute("w:val") || "";
        const align: "left" | "center" | "right" = jcVal === "center" ? "center" : jcVal === "right" ? "right" : "left";

        const rNodes = Array.from(p.querySelectorAll("w\\:r, r"));
        let pText = "";
        let isBold = false;
        rNodes.forEach((r) => {
          if (r.querySelector("w\\:b, b")) isBold = true;
          const tText = Array.from(r.querySelectorAll("w\\:t, t")).map((t) => t.textContent || "").join("");
          pText += tText;
        });

        if (!pText) {
          pText = Array.from(p.querySelectorAll("w\\:t, t")).map((t) => t.textContent || "").join("");
        }

        const trimmed = pText.trim();
        const isHeading =
          /^(brand\s+authorisation\s+letter|to,|subject:|declaration|agreement|contract|invoice)/i.test(trimmed) ||
          (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && trimmed.length > 5);

        paragraphs.push({
          text: trimmed,
          isHeading,
          isBold,
          align,
          hasPageBreakBefore: hasBreak,
        });
      });
    }
  } catch (e) {
    console.warn("Word parse fallback:", e);
  }

  if (paragraphs.length === 0 || paragraphs.every((p) => !p.text)) {
    paragraphs = [
      { text: `Document: ${fileName}`, isHeading: true, isBold: true, align: "left", hasPageBreakBefore: false },
      { text: "Preview of Microsoft Word Document.", isHeading: false, isBold: false, align: "left", hasPageBreakBefore: false },
      { text: "Ready to convert into high-resolution images.", isHeading: false, isBold: false, align: "left", hasPageBreakBefore: false },
    ];
  }

  const pageW = 1200;
  const pageH = 1697; // Standard A4 ratio (1200 x 1697)
  const leftMargin = 90;
  const rightMargin = 90;
  const topMargin = showHeader ? 120 : 80;
  const bottomMargin = 100; // Generous bottom margin so signatures/text never clip
  const printableW = pageW - leftMargin - rightMargin;
  const maxContentY = pageH - bottomMargin;

  // Measurement canvas
  const measureCanvas = document.createElement("canvas");
  const mCtx = measureCanvas.getContext("2d")!;

  let currentLines: {
    text: string;
    y: number;
    fontSize: number;
    isBold: boolean;
    align: "left" | "center" | "right";
  }[] = [];

  let curY = topMargin;

  const flushPage = () => {
    pages.push({ lines: [...currentLines] });
    currentLines = [];
    curY = topMargin;
  };

  paragraphs.forEach((p) => {
    if (p.hasPageBreakBefore && currentLines.length > 0) {
      flushPage();
    }

    if (!p.text) {
      curY += Math.round(fontSize * 0.9);
      if (curY > maxContentY && currentLines.length > 0) {
        flushPage();
      }
      return;
    }

    const pFontSize = p.isHeading ? fontSize + 2 : fontSize;
    const lineH = Math.round(pFontSize * 1.55);
    mCtx.font = `${p.isBold ? "bold " : ""}${pFontSize}px ${fontFamily}`;

    const words = p.text.split(/\s+/);
    let line = "";
    const wrappedLines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line ? `${line} ${words[n]}` : words[n]!;
      const metrics = mCtx.measureText(testLine);
      if (metrics.width > printableW && line) {
        wrappedLines.push(line);
        line = words[n]!;
      } else {
        line = testLine;
      }
    }
    if (line) {
      wrappedLines.push(line);
    }

    wrappedLines.forEach((wLine) => {
      if (curY + lineH > maxContentY && currentLines.length > 0) {
        flushPage();
      }
      currentLines.push({
        text: wLine,
        y: curY,
        fontSize: pFontSize,
        isBold: p.isBold,
        align: p.align,
      });
      curY += lineH;
    });

    curY += 10;
  });

  if (currentLines.length > 0 || pages.length === 0) {
    flushPage();
  }

  return { pages, totalPages: pages.length };
};

export const renderWordPageToImage = async (
  buffer: ArrayBuffer,
  fileName: string,
  fontFamily: string = "Calibri, sans-serif",
  fontSize: number = 16,
  bgColor: string = "#ffffff",
  format: "PNG" | "JPG" = "PNG",
  showHeader: boolean = true,
  pageNumber: number = 1
): Promise<{ dataUrl: string; width: number; height: number; totalPages: number }> => {
  const model = await parseWordDocumentToPages(buffer, fileName, fontFamily, fontSize, showHeader);
  const targetPageIdx = Math.max(0, Math.min(model.totalPages - 1, pageNumber - 1));
  const page = model.pages[targetPageIdx] || { lines: [] };

  const pageW = 1200;
  const pageH = 1697;
  const scale = 2; // 2x Retina resolution

  const canvas = document.createElement("canvas");
  canvas.width = pageW * scale;
  canvas.height = pageH * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor === "transparent" ? "#ffffff" : bgColor;
  ctx.fillRect(0, 0, pageW, pageH);

  // Top header bar
  if (showHeader) {
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, pageW, 56);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`📄 ${fileName}`, 40, 28);

    if (model.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`Page ${targetPageIdx + 1} of ${model.totalPages}`, pageW - 40, 28);
    }
  }

  // Draw Page Content
  const leftMargin = 90;
  const rightMargin = 90;
  const printableW = pageW - leftMargin - rightMargin;

  page.lines.forEach((l) => {
    ctx.font = `${l.isBold ? "bold " : ""}${l.fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#0f172a";
    ctx.textBaseline = "top";

    if (l.align === "center") {
      ctx.textAlign = "center";
      ctx.fillText(l.text, leftMargin + printableW / 2, l.y);
    } else if (l.align === "right") {
      ctx.textAlign = "right";
      ctx.fillText(l.text, leftMargin + printableW, l.y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(l.text, leftMargin, l.y);
    }
  });

  // Footer page number if multiple pages
  if (model.totalPages > 1) {
    ctx.font = "12px 'Calibri', 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`Page ${targetPageIdx + 1} of ${model.totalPages}`, pageW / 2, pageH - 30);
  }

  const mime = format === "JPG" ? "image/jpeg" : "image/png";
  return {
    dataUrl: canvas.toDataURL(mime, 0.98),
    width: canvas.width,
    height: canvas.height,
    totalPages: model.totalPages,
  };
};

export const renderAllWordPagesToZip = async (
  buffer: ArrayBuffer,
  fileName: string,
  totalPages: number,
  fontFamily: string,
  fontSize: number,
  bgColor: string,
  format: "PNG" | "JPG",
  showHeader: boolean,
  onProgress?: (curr: number, total: number) => void
): Promise<{ zipBlob: Blob; firstPageDataUrl: string; width: number; height: number }> => {
  const ext = format === "JPG" ? "jpg" : "png";
  const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "document";
  const zipEntries: { name: string; data: Uint8Array }[] = [];
  let firstDataUrl = "";
  let firstW = 0;
  let firstH = 0;

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages);
    const res = await renderWordPageToImage(
      buffer,
      fileName,
      fontFamily,
      fontSize,
      bgColor,
      format,
      showHeader,
      p
    );
    if (p === 1) {
      firstDataUrl = res.dataUrl;
      firstW = res.width;
      firstH = res.height;
    }
    const base64 = res.dataUrl.split(",")[1] || "";
    const bin = atob(base64);
    const uint8 = new Uint8Array(bin.length);
    for (let b = 0; b < bin.length; b++) uint8[b] = bin.charCodeAt(b);
    const pageIndexStr = String(p).padStart(totalPages >= 10 ? 2 : 1, "0");
    zipEntries.push({
      name: `${baseName}_page_${pageIndexStr}.${ext}`,
      data: uint8,
    });
  }

  const zipUint8 = buildZip(zipEntries);
  const zipBlob = new Blob([zipUint8 as BlobPart], { type: "application/zip" });
  return { zipBlob, firstPageDataUrl: firstDataUrl, width: firstW, height: firstH };
};

export const renderWordDocumentToImage = async (
  buffer: ArrayBuffer,
  fileName: string,
  fontFamily: string = "Calibri, sans-serif",
  fontSize: number = 16,
  bgColor: string = "#ffffff",
  format: "PNG" | "JPG" = "PNG",
  showHeader: boolean = true,
  pageNumber: number = 1
): Promise<{ dataUrl: string; width: number; height: number; totalPages: number }> => {
  return renderWordPageToImage(buffer, fileName, fontFamily, fontSize, bgColor, format, showHeader, pageNumber);
};

