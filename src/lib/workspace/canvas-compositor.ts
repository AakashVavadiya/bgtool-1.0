// Canvas compositing helpers for 1:1 square framing, watermark overlays, meme captions, and binary stream encoding.
import { toast } from "sonner";
import { encodeAscii85WithWrap } from "@/lib/workspace/pixel-and-barcode-engines";

export interface SquareFrameConfig {
  bgMode: "blur" | "color" | "gradient" | "transparent" | "fit";
  blurAmount: number;
  bgColor: string;
  gradient: string;
  scale: number;
  cornerRadius: number;
  shadow: "none" | "soft" | "float" | "card";
  exportFormat: "PNG" | "JPG" | "WEBP";
}

export function renderSquareFrameDataUrl(
  img: HTMLImageElement,
  cfg: SquareFrameConfig
): string {
  const { bgMode, blurAmount, bgColor, gradient, scale, cornerRadius, shadow, exportFormat } = cfg;

  const maxDim = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const canvas = document.createElement("canvas");
  canvas.width = maxDim;
  canvas.height = maxDim;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, maxDim, maxDim);

  // Render background layer
  if (bgMode === "blur") {
    ctx.save();
    const blurPx = Math.max(10, Math.round((blurAmount / 500) * maxDim));
    ctx.filter = `blur(${blurPx}px)`;
    const bgScale = Math.max(maxDim / img.width, maxDim / img.height) * 1.25;
    const bgW = img.width * bgScale;
    const bgH = img.height * bgScale;
    ctx.drawImage(img, (maxDim - bgW) / 2, (maxDim - bgH) / 2, bgW, bgH);
    ctx.restore();
  } else if (bgMode === "color") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, maxDim, maxDim);
  } else if (bgMode === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, maxDim, maxDim);
    const colorMatches = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)/g);
    if (colorMatches && colorMatches.length >= 2 && colorMatches[0] && colorMatches[colorMatches.length - 1]) {
      grad.addColorStop(0, colorMatches[0]);
      grad.addColorStop(1, colorMatches[colorMatches.length - 1] as string);
    } else {
      grad.addColorStop(0, "#667eea");
      grad.addColorStop(1, "#764ba2");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, maxDim, maxDim);
  } else if (bgMode === "transparent") {
    if (exportFormat === "JPG") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, maxDim, maxDim);
    } else {
      ctx.clearRect(0, 0, maxDim, maxDim);
    }
  }

  // Render foreground image layer
  if (bgMode === "fit") {
    const coverScale = Math.max(maxDim / img.width, maxDim / img.height) * (scale / 100);
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const dx = (maxDim - drawW) / 2;
    const dy = (maxDim - drawH) / 2;

    ctx.save();
    if (cornerRadius > 0) {
      const radPx = cornerRadius === 9999 ? maxDim / 2 : Math.round((cornerRadius / 500) * maxDim);
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(0, 0, maxDim, maxDim, radPx);
      } else {
        ctx.rect(0, 0, maxDim, maxDim);
      }
      ctx.clip();
    }
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
  } else {
    const scaleMultiplier = Math.max(0.2, Math.min(1.0, scale / 100));
    let fgW = img.width;
    let fgH = img.height;
    if (fgW >= fgH) {
      fgW = maxDim * scaleMultiplier;
      fgH = (img.height / img.width) * fgW;
    } else {
      fgH = maxDim * scaleMultiplier;
      fgW = (img.width / img.height) * fgH;
    }

    const dx = (maxDim - fgW) / 2;
    const dy = (maxDim - fgH) / 2;
    const radPx = cornerRadius === 9999 ? Math.min(fgW, fgH) / 2 : Math.round((cornerRadius / 500) * maxDim);

    if (shadow !== "none") {
      ctx.save();
      if (shadow === "soft") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
        ctx.shadowBlur = Math.round(maxDim * 0.035);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(maxDim * 0.015);
      } else if (shadow === "float") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = Math.round(maxDim * 0.06);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(maxDim * 0.03);
      } else if (shadow === "card") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = Math.round(maxDim * 0.02);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(maxDim * 0.01);
      }

      ctx.beginPath();
      if (radPx > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(dx, dy, fgW, fgH, radPx);
      } else {
        ctx.rect(dx, dy, fgW, fgH);
      }
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (radPx > 0) {
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(dx, dy, fgW, fgH, radPx);
      } else {
        ctx.rect(dx, dy, fgW, fgH);
      }
      ctx.clip();
    }
    ctx.drawImage(img, dx, dy, fgW, fgH);
    ctx.restore();
  }

  const mime = exportFormat === "JPG" ? "image/jpeg" : exportFormat === "WEBP" ? "image/webp" : "image/png";
  return canvas.toDataURL(mime, 0.98);
}

export interface WatermarkCompositeOptions {
  wmMargin: number;
  wmPosition: string;
  wmCustomCoord: { xPercent: number; yPercent: number };
  wmMode: "text" | "logo";
  wmLogoSrc: string | null;
  wmLogoScale: number;
  wmOpacity: number;
  wmRotation: number;
  wmText: string;
  wmFontSize: number;
  wmItalic: boolean;
  wmBold: boolean;
  wmFontFamily: string;
  wmStroke: "none" | "dark" | "light";
  wmColor: string;
  wmBgBadge: "none" | "dark_pill" | "light_pill";
}

export async function drawWatermarkOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  opts: WatermarkCompositeOptions
): Promise<void> {
  const {
    wmMargin,
    wmPosition,
    wmCustomCoord,
    wmMode,
    wmLogoSrc,
    wmLogoScale,
    wmOpacity,
    wmRotation,
    wmText,
    wmFontSize,
    wmItalic,
    wmBold,
    wmFontFamily,
    wmStroke,
    wmColor,
    wmBgBadge,
  } = opts;

  const marginPxX = Math.round((wmMargin / 100) * canvas.width);
  const marginPxY = Math.round((wmMargin / 100) * canvas.height);

  let targetX = canvas.width / 2;
  let targetY = canvas.height / 2;
  let align: CanvasTextAlign = "center";
  let baseline: CanvasTextBaseline = "middle";

  if (wmPosition === "top_left") {
    targetX = marginPxX; targetY = marginPxY; align = "left"; baseline = "top";
  } else if (wmPosition === "top_center") {
    targetX = canvas.width / 2; targetY = marginPxY; align = "center"; baseline = "top";
  } else if (wmPosition === "top_right") {
    targetX = canvas.width - marginPxX; targetY = marginPxY; align = "right"; baseline = "top";
  } else if (wmPosition === "middle_left") {
    targetX = marginPxX; targetY = canvas.height / 2; align = "left"; baseline = "middle";
  } else if (wmPosition === "center") {
    targetX = canvas.width / 2; targetY = canvas.height / 2; align = "center"; baseline = "middle";
  } else if (wmPosition === "middle_right") {
    targetX = canvas.width - marginPxX; targetY = canvas.height / 2; align = "right"; baseline = "middle";
  } else if (wmPosition === "bottom_left") {
    targetX = marginPxX; targetY = canvas.height - marginPxY; align = "left"; baseline = "bottom";
  } else if (wmPosition === "bottom_center") {
    targetX = canvas.width / 2; targetY = canvas.height - marginPxY; align = "center"; baseline = "bottom";
  } else if (wmPosition === "bottom_right") {
    targetX = canvas.width - marginPxX; targetY = canvas.height - marginPxY; align = "right"; baseline = "bottom";
  } else if (wmPosition === "custom") {
    targetX = Math.round((wmCustomCoord.xPercent / 100) * canvas.width);
    targetY = Math.round((wmCustomCoord.yPercent / 100) * canvas.height);
    align = "center"; baseline = "middle";
  }

  if (wmMode === "logo" && wmLogoSrc) {
    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        if (wmLogoSrc.startsWith("http://") || wmLogoSrc.startsWith("https://")) {
          i.crossOrigin = "anonymous";
        }
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Failed to load watermark logo"));
        i.src = wmLogoSrc;
      });
      const lw = Math.max(10, Math.round(canvas.width * (wmLogoScale / 100)));
      const lh = Math.max(10, Math.round((logoImg.height / (logoImg.width || 1)) * lw));

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1, wmOpacity));

      if (wmPosition === "tile") {
        const stepX = Math.max(lw * 2.2, Math.round(canvas.width * 0.25), 160);
        const stepY = Math.max(lh * 2.2, Math.round(canvas.height * 0.25), 120);
        const tileRad = (wmRotation || -30) * (Math.PI / 180);
        const startY = -Math.round(canvas.height * 0.2);
        const endY = Math.round(canvas.height * 1.2);
        const startX = -Math.round(canvas.width * 0.2);
        const endX = Math.round(canvas.width * 1.2);

        for (let gy = startY; gy < endY; gy += stepY) {
          for (let gx = startX; gx < endX; gx += stepX) {
            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(tileRad);
            ctx.drawImage(logoImg, -lw / 2, -lh / 2, lw, lh);
            ctx.restore();
          }
        }
      } else {
        ctx.translate(targetX, targetY);
        if (wmRotation !== 0) {
          ctx.rotate((wmRotation * Math.PI) / 180);
        }
        let drawDx = -lw / 2;
        let drawDy = -lh / 2;
        if (align === "left") drawDx = 0;
        else if (align === "right") drawDx = -lw;
        if (baseline === "top") drawDy = 0;
        else if (baseline === "bottom") drawDy = -lh;

        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = Math.max(4, Math.round(lw * 0.05));
        ctx.drawImage(logoImg, drawDx, drawDy, lw, lh);
      }
      ctx.restore();
    } catch (e) {
      console.error("Failed to render logo watermark:", e);
      toast.error("Could not render logo watermark. Please check logo format.");
    }
  } else if (wmText.trim()) {
    const canvasFontSize = Math.max(14, Math.round(wmFontSize * (canvas.width / 1000)));
    const fontStyle = `${wmItalic ? "italic " : ""}${wmBold ? "bold " : ""}${canvasFontSize}px ${wmFontFamily}`;

    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, wmOpacity));
    ctx.font = fontStyle;

    if (wmPosition === "tile") {
      const stepX = Math.max(canvasFontSize * 8, Math.round(canvas.width * 0.3), 200);
      const stepY = Math.max(canvasFontSize * 4, Math.round(canvas.height * 0.2), 120);
      const tileRad = (wmRotation || -30) * (Math.PI / 180);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const startY = -Math.round(canvas.height * 0.2);
      const endY = Math.round(canvas.height * 1.2);
      const startX = -Math.round(canvas.width * 0.2);
      const endX = Math.round(canvas.width * 1.2);

      for (let gy = startY; gy < endY; gy += stepY) {
        for (let gx = startX; gx < endX; gx += stepX) {
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(tileRad);

          if (wmStroke === "dark") {
            ctx.strokeStyle = "rgba(0,0,0,0.85)";
            ctx.lineWidth = Math.max(2, Math.round(canvasFontSize * 0.1));
            ctx.strokeText(wmText, 0, 0);
          } else if (wmStroke === "light") {
            ctx.strokeStyle = "rgba(255,255,255,0.85)";
            ctx.lineWidth = Math.max(2, Math.round(canvasFontSize * 0.1));
            ctx.strokeText(wmText, 0, 0);
          }
          ctx.fillStyle = wmColor;
          ctx.fillText(wmText, 0, 0);
          ctx.restore();
        }
      }
    } else {
      ctx.translate(targetX, targetY);
      if (wmRotation !== 0) {
        ctx.rotate((wmRotation * Math.PI) / 180);
      }
      ctx.textAlign = align;
      ctx.textBaseline = baseline;

      if (wmBgBadge !== "none") {
        const metrics = ctx.measureText(wmText);
        const tw = metrics.width;
        const th = canvasFontSize * 1.3;
        const px = canvasFontSize * 0.4;
        const py = canvasFontSize * 0.2;

        let bx = 0;
        if (align === "center") bx = -tw / 2 - px;
        else if (align === "right") bx = -tw - px;
        else bx = -px;

        let by = 0;
        if (baseline === "middle") by = -th / 2;
        else if (baseline === "bottom") by = -th;
        else by = -py;

        ctx.fillStyle = wmBgBadge === "dark_pill" ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.75)";
        const r = Math.max(0, th * 0.3);
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(bx, by, Math.max(1, tw + px * 2), Math.max(1, th + py * 2), r);
        } else {
          ctx.rect(bx, by, Math.max(1, tw + px * 2), Math.max(1, th + py * 2));
        }
        ctx.fill();
      }

      if (wmStroke === "dark") {
        ctx.strokeStyle = "rgba(0,0,0,0.9)";
        ctx.lineWidth = Math.max(2, Math.round(canvasFontSize * 0.08));
        ctx.strokeText(wmText, 0, 0);
      } else if (wmStroke === "light") {
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = Math.max(2, Math.round(canvasFontSize * 0.08));
        ctx.strokeText(wmText, 0, 0);
      }

      ctx.shadowColor = wmStroke === "light" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.65)";
      ctx.shadowBlur = Math.max(4, Math.round(canvasFontSize * 0.15));
      ctx.fillStyle = wmColor;
      ctx.fillText(wmText, 0, 0);
    }
    ctx.restore();
  }
}

export interface MemeCompositeOptions {
  memeFontSize: number;
  memeFontFamily: string;
  memeTextAlign: CanvasTextAlign;
  memeStrokeWidth: number;
  memeStrokeColor: string;
  memeTextColor: string;
  memeTextShadow: boolean;
  memeAllCaps: boolean;
  topText: string;
  bottomText: string;
  memeTopPosPercent: number;
  memeBottomPosPercent: number;
}

export function drawMemeCaptionsOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  opts: MemeCompositeOptions
): void {
  const {
    memeFontSize,
    memeFontFamily,
    memeTextAlign,
    memeStrokeWidth,
    memeStrokeColor,
    memeTextColor,
    memeTextShadow,
    memeAllCaps,
    topText,
    bottomText,
    memeTopPosPercent,
    memeBottomPosPercent,
  } = opts;

  ctx.save();
  const canvasScale = canvas.width / 800;
  const fontPx = Math.max(14, Math.round(memeFontSize * canvasScale));
  ctx.font = `900 ${fontPx}px ${memeFontFamily}`;
  ctx.textAlign = memeTextAlign;
  ctx.textBaseline = "middle";

  const strokePx = memeStrokeWidth > 0 ? Math.max(1, Math.round(memeStrokeWidth * canvasScale * 1.5)) : 0;
  if (strokePx > 0) {
    ctx.strokeStyle = memeStrokeColor;
    ctx.lineWidth = strokePx;
    ctx.lineJoin = "round";
  }
  ctx.fillStyle = memeTextColor;

  if (memeTextShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = Math.max(4, Math.round(fontPx * 0.15));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(2, Math.round(fontPx * 0.05));
  }

  const maxTextW = canvas.width * 0.92;
  const alignX =
    memeTextAlign === "left"
      ? canvas.width * 0.04
      : memeTextAlign === "right"
        ? canvas.width * 0.96
        : canvas.width / 2;

  const wrapLines = (txt: string) => {
    const finalTxt = memeAllCaps ? txt.toUpperCase() : txt;
    const words = finalTxt.split(" ");
    const lines: string[] = [];
    let cur = words[0] || "";
    for (let i = 1; i < words.length; i++) {
      const w = words[i];
      if (ctx.measureText(cur + " " + w).width < maxTextW) {
        cur += " " + w;
      } else {
        lines.push(cur);
        cur = w || "";
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const lineHeight = fontPx * 1.2;

  if (topText.trim()) {
    const topLines = wrapLines(topText);
    const topStartY = Math.round((memeTopPosPercent / 100) * canvas.height) + fontPx / 2;
    topLines.forEach((line, idx) => {
      const y = topStartY + idx * lineHeight;
      if (strokePx > 0) ctx.strokeText(line, alignX, y);
      ctx.fillText(line, alignX, y);
    });
  }

  if (bottomText.trim()) {
    const bottomLines = wrapLines(bottomText);
    const totalBottomH = bottomLines.length * lineHeight;
    const bottomStartY =
      canvas.height -
      Math.round((memeBottomPosPercent / 100) * canvas.height) -
      totalBottomH +
      fontPx / 2;

    bottomLines.forEach((line, idx) => {
      const y = bottomStartY + idx * lineHeight;
      if (strokePx > 0) ctx.strokeText(line, alignX, y);
      ctx.fillText(line, alignX, y);
    });
  }

  ctx.restore();
}

export interface BinaryStreamOptions {
  toolSlug: string;
  binaryOutputMode: string;
  binaryDelimiter: string;
  binaryBitDepth: string;
  customBitDepth: number;
  binaryWithPrefix: boolean;
  pixelThreshold: number;
  canvas: HTMLCanvasElement | null;
}

export function encodeBinaryStreamPayload(
  sourceB64: string,
  opts: BinaryStreamOptions
): {
  bytes: Uint8Array;
  fullText: string;
  previewText: string;
  isTruncated: boolean;
} {
  const {
    toolSlug,
    binaryOutputMode,
    binaryDelimiter,
    binaryBitDepth,
    customBitDepth,
    binaryWithPrefix,
    pixelThreshold,
    canvas,
  } = opts;

  const base64Data = sourceB64.includes(",") ? sourceB64.split(",")[1] : sourceB64;
  const binaryStr = atob(base64Data || "");
  const totalBytes = binaryStr.length;
  const bytes = new Uint8Array(totalBytes);
  for (let i = 0; i < totalBytes; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const delimChar =
    binaryDelimiter === "Space"
      ? " "
      : binaryDelimiter === "Comma"
        ? ", "
        : binaryDelimiter === "Newline"
          ? "\n"
          : "";

  const formatResult = (full: string, summarySuffix: string) => {
    if (full.length > 60000) {
      return {
        bytes,
        fullText: full,
        previewText: `${full.slice(0, 60000)}\n\n... [${summarySuffix}]`,
        isTruncated: true,
      };
    }
    return { bytes, fullText: full, previewText: full, isTruncated: false };
  };

  if (toolSlug === "image-to-base64" || binaryOutputMode === "Base64") {
    return formatResult(
      sourceB64,
      `Displaying first 60,000 characters of ${sourceB64.length.toLocaleString()} total chars. Click "Copy Output" or "Download" for 100% full dataset`
    );
  }

  if (binaryOutputMode === "Pixel-Matrix" && canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rows: string[] = [];
      const w = canvas.width;
      const h = canvas.height;
      for (let y = 0; y < h; y++) {
        let rowStr = "";
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3]! / 255;
          const r = data[idx]! * a + 255 * (1 - a);
          const g = data[idx + 1]! * a + 255 * (1 - a);
          const b = data[idx + 2]! * a + 255 * (1 - a);
          const lum = r * 0.299 + g * 0.587 + b * 0.114;
          rowStr += lum >= pixelThreshold ? "0" : "1";
        }
        rows.push(rowStr);
      }
      const fullMatrix = `// 1-Bit Pixel Monochrome Matrix (${w}x${h} px, Threshold: ${pixelThreshold})\n` + rows.join("\n");
      return formatResult(
        fullMatrix,
        `Displaying first 60,000 characters of ${rows.length} rows. Click "Copy Output" or "Download" for full matrix`
      );
    }
  }

  if (toolSlug === "image-to-hex" || binaryOutputMode === "Hexadecimal") {
    const prefix = binaryWithPrefix ? "0x" : "";
    const hexArr: string[] = [];
    for (let i = 0; i < totalBytes; i++) {
      hexArr.push(prefix + bytes[i]!.toString(16).padStart(2, "0").toUpperCase());
    }
    return formatResult(
      hexArr.join(delimChar),
      `Displaying first 60,000 characters of ${totalBytes.toLocaleString()} bytes. Click "Copy Output" or "Download" for 100% full Hex dataset`
    );
  }

  if (binaryOutputMode === "C-Array") {
    const lines: string[] = [];
    lines.push(`// Image Binary Data Array (${totalBytes.toLocaleString()} bytes)`);
    lines.push(`const unsigned int image_data_len = ${totalBytes};`);
    lines.push(`const unsigned char image_data[${totalBytes}] = {`);
    const hexVals: string[] = [];
    for (let i = 0; i < totalBytes; i++) {
      hexVals.push("0x" + bytes[i]!.toString(16).padStart(2, "0").toUpperCase());
    }
    for (let i = 0; i < hexVals.length; i += 16) {
      const chunk = hexVals.slice(i, i + 16).join(", ");
      lines.push("  " + chunk + (i + 16 < hexVals.length ? "," : ""));
    }
    lines.push("};");
    return formatResult(
      lines.join("\n"),
      `Displaying first 60,000 characters of ${totalBytes.toLocaleString()} bytes. Click "Copy Output" or "Download" for complete C Array`
    );
  }

  if (toolSlug === "image-to-octal" || binaryOutputMode === "Octal") {
    const prefix = binaryWithPrefix ? "0o" : "";
    const octArr: string[] = [];
    for (let i = 0; i < totalBytes; i++) {
      octArr.push(prefix + bytes[i]!.toString(8).padStart(3, "0"));
    }
    return formatResult(
      octArr.join(delimChar),
      `Displaying first 60,000 characters. Click "Copy Output" or "Download" for 100% full dataset`
    );
  }

  if (toolSlug === "image-to-decimal" || binaryOutputMode === "Decimal") {
    const decArr: string[] = [];
    for (let i = 0; i < totalBytes; i++) {
      decArr.push(bytes[i]!.toString(10));
    }
    return formatResult(
      decArr.join(delimChar),
      `Displaying first 60,000 characters. Click "Copy Output" or "Download" for 100% full dataset`
    );
  }

  if (toolSlug === "image-to-ascii") {
    return formatResult(
      encodeAscii85WithWrap(bytes, 80),
      `Displaying first 60,000 characters of ${totalBytes.toLocaleString()} bytes. Click "Copy Output" or "Download" for 100% full dataset`
    );
  }

  const prefix = binaryWithPrefix ? "0b" : "";
  let bitCount = 8;
  if (binaryBitDepth.includes("256")) bitCount = 256;
  else if (binaryBitDepth.includes("128")) bitCount = 128;
  else if (binaryBitDepth.includes("64")) bitCount = 64;
  else if (binaryBitDepth.includes("32")) bitCount = 32;
  else if (binaryBitDepth.includes("16")) bitCount = 16;
  else if (binaryBitDepth.includes("8")) bitCount = 8;
  else if (binaryBitDepth.includes("4")) bitCount = 4;
  else if (binaryBitDepth.includes("Custom")) bitCount = Math.max(1, Math.min(1024, customBitDepth || 8));

  const binArr: string[] = [];
  if (bitCount === 4) {
    for (let i = 0; i < totalBytes; i++) {
      const b = bytes[i] ?? 0;
      const hi = (b >> 4) & 0x0f;
      const lo = b & 0x0f;
      binArr.push(prefix + hi.toString(2).padStart(4, "0"));
      binArr.push(prefix + lo.toString(2).padStart(4, "0"));
    }
  } else if (bitCount === 8) {
    for (let i = 0; i < totalBytes; i++) {
      binArr.push(prefix + (bytes[i] ?? 0).toString(2).padStart(8, "0"));
    }
  } else if (bitCount === 16) {
    for (let i = 0; i < totalBytes; i += 2) {
      const b1 = bytes[i] ?? 0;
      const b2 = i + 1 < totalBytes ? (bytes[i + 1] ?? 0) : 0;
      const w16 = (b1 << 8) | b2;
      binArr.push(prefix + w16.toString(2).padStart(16, "0"));
    }
  } else if (bitCount === 32) {
    for (let i = 0; i < totalBytes; i += 4) {
      const b1 = bytes[i] ?? 0;
      const b2 = i + 1 < totalBytes ? (bytes[i + 1] ?? 0) : 0;
      const b3 = i + 2 < totalBytes ? (bytes[i + 2] ?? 0) : 0;
      const b4 = i + 3 < totalBytes ? (bytes[i + 3] ?? 0) : 0;
      const d32 = ((b1 << 24) >>> 0) | (b2 << 16) | (b3 << 8) | b4;
      binArr.push(prefix + (d32 >>> 0).toString(2).padStart(32, "0"));
    }
  } else {
    const bytesPerChunk = Math.ceil(bitCount / 8);
    for (let i = 0; i < totalBytes; i += bytesPerChunk) {
      let chunkBits = "";
      for (let j = 0; j < bytesPerChunk; j++) {
        if (i + j < totalBytes) {
          chunkBits += (bytes[i + j] ?? 0).toString(2).padStart(8, "0");
        }
      }
      if (chunkBits.length >= bitCount) {
        binArr.push(prefix + chunkBits.slice(0, bitCount));
      } else {
        binArr.push(prefix + chunkBits.padStart(bitCount, "0"));
      }
    }
  }

  const fullResult = binArr.join(delimChar);
  return formatResult(
    fullResult,
    `Displaying first 60,000 characters of ${totalBytes.toLocaleString()} bytes (${fullResult.length.toLocaleString()} total characters). Click "Copy Output" or "Download" for 100% full dataset`
  );
}

// Render a single batch item with the configured text or logo watermark overlay
export async function renderWatermarkedImageToBlob(
  item: { name: string; dataUrl: string; width: number; height: number },
  wmOpts: WatermarkCompositeOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; ext: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    if (item.dataUrl.startsWith("http://") || item.dataUrl.startsWith("https://")) {
      el.crossOrigin = "anonymous";
    }
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Failed to load ${item.name}`));
    el.src = item.dataUrl;
  });

  const w = img.naturalWidth || img.width || item.width || 800;
  const h = img.naturalHeight || img.height || item.height || 600;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  await drawWatermarkOverlayOnCanvas(ctx, canvas, wmOpts);

  const isJpg = /\.(jpe?g|jfif)$/i.test(item.name);
  const isWebp = /\.webp$/i.test(item.name);
  const mime = isJpg ? "image/jpeg" : isWebp ? "image/webp" : "image/png";
  const ext = isJpg ? "jpg" : isWebp ? "webp" : "png";
  const quality = isJpg || isWebp ? 0.94 : undefined;

  const dataUrl = canvas.toDataURL(mime, quality);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode watermarked image"))),
      mime,
      quality
    );
  });

  return { blob, dataUrl, width: w, height: h, ext };
}
