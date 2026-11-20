import { inspectFileSignature } from "../security/upload-policy";

export interface ImageSafetyCheckResult {
  safe: boolean;
  mime?: string;
  extension?: string;
  width?: number;
  height?: number;
  pixelCount?: number;
  error?: string;
  statusCode?: number;
  errorCode?: string;
}

export const MAX_SAFE_PIXELS = 50_000_000; // 50 Megapixels
export const MAX_SAFE_DIMENSION = 10_000; // 10,000 px per side

/**
 * Parses image dimensions directly from the raw binary header without decoding
 * full uncompressed pixel arrays in memory (Decompression Bomb / Pixel Bomb protection).
 */
export function extractImageDimensionsFromHeader(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 16) return null;

  // 1. PNG Header (16 bytes minimum: 8 byte signature + 4 byte chunk len + 4 byte 'IHDR')
  // IHDR chunk: width at 16..19, height at 20..23 (big endian uint32)
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    try {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    } catch {}
  }

  // 2. JPEG Header (SOI 0xFF 0xD8)
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      while (buffer[offset] === 0xff && offset < buffer.length) {
        offset++;
      }
      if (offset >= buffer.length) break;

      const marker = buffer[offset];
      offset++;

      // SOF markers: SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2), SOF3 (0xC3), SOF5 (0xC5),
      // SOF6 (0xC6), SOF7 (0xC7), SOF9 (0xC9), SOF10 (0xCA), SOF11 (0xCB)
      const isSof =
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb;

      if (isSof && offset + 7 <= buffer.length) {
        try {
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          if (width > 0 && height > 0) return { width, height };
        } catch {}
        break;
      }

      // SOS (Start of Scan 0xDA) or EOI (End of Image 0xD9) -> stop scanning
      if (marker === 0xda || marker === 0xd9) break;

      // Variable-length marker: read length and skip
      if (offset + 2 <= buffer.length) {
        const markerLength = buffer.readUInt16BE(offset);
        if (markerLength < 2) break;
        offset += markerLength;
      } else {
        break;
      }
    }
  }

  // 3. WebP Header (RIFF....WEBP)
  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = buffer.toString("ascii", 12, 16);

    // VP8 (Lossy simple format)
    if (chunkType === "VP8 " && buffer.length >= 30) {
      try {
        // Frame tag at 20..22, key frame code at 23..25 (0x9D 0x01 0x2A)
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      } catch {}
    }

    // VP8L (Lossless format)
    if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      try {
        const b1 = buffer[21]!;
        const b2 = buffer[22]!;
        const b3 = buffer[23]!;
        const b4 = buffer[24]!;
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        if (width > 0 && height > 0) return { width, height };
      } catch {}
    }

    // VP8X (Extended format)
    if (chunkType === "VP8X" && buffer.length >= 30) {
      try {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        if (width > 0 && height > 0) return { width, height };
      } catch {}
    }
  }

  // 4. GIF Header (GIF87a / GIF89a)
  if (
    buffer.length >= 10 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    try {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      if (width > 0 && height > 0) return { width, height };
    } catch {}
  }

  // 5. BMP Header (BM)
  if (buffer.length >= 26 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
    try {
      const width = Math.abs(buffer.readInt32LE(18));
      const height = Math.abs(buffer.readInt32LE(22));
      if (width > 0 && height > 0) return { width, height };
    } catch {}
  }

  return null;
}

/**
 * Validates magic bytes, checks for decompression bombs, and verifies image dimensions.
 */
export function inspectImageSafety(buffer: Buffer): ImageSafetyCheckResult {
  if (!buffer || buffer.length === 0) {
    return {
      safe: false,
      error: "Uploaded image is empty (0 bytes).",
      statusCode: 400,
      errorCode: "empty_file",
    };
  }

  // 1. Inspect magic bytes signature
  const sig = inspectFileSignature(buffer);

  if (sig.category === "executable") {
    return {
      safe: false,
      error: "Executable binaries, shell scripts, and active payloads are strictly prohibited.",
      statusCode: 415,
      errorCode: "executable_prohibited",
    };
  }

  const allowedMimes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
  if (!allowedMimes.includes(sig.mime)) {
    return {
      safe: false,
      error: `Unsupported image format (${sig.mime}). Only PNG, JPEG, WebP, GIF, and BMP are accepted.`,
      statusCode: 415,
      errorCode: "unsupported_image_format",
    };
  }

  // 2. Inspect dimensions from header (Image Bomb / Pixel Bomb protection)
  const dims = extractImageDimensionsFromHeader(buffer);
  if (dims) {
    const { width, height } = dims;
    const pixelCount = width * height;

    if (pixelCount > MAX_SAFE_PIXELS) {
      const megapixels = (pixelCount / 1_000_000).toFixed(1);
      return {
        safe: false,
        width,
        height,
        pixelCount,
        mime: sig.mime,
        extension: sig.extension,
        error: `Image dimensions (${width}x${height} = ${megapixels} MP) exceed the maximum safety limit of 50 Megapixels.`,
        statusCode: 413,
        errorCode: "image_bomb_detected",
      };
    }

    if (width > MAX_SAFE_DIMENSION || height > MAX_SAFE_DIMENSION) {
      return {
        safe: false,
        width,
        height,
        pixelCount,
        mime: sig.mime,
        extension: sig.extension,
        error: `Image dimensions (${width}x${height}) exceed the maximum permitted single-axis limit of ${MAX_SAFE_DIMENSION}px.`,
        statusCode: 413,
        errorCode: "image_dimensions_too_large",
      };
    }

    return {
      safe: true,
      mime: sig.mime,
      extension: sig.extension,
      width,
      height,
      pixelCount,
    };
  }

  // If header dimensions couldn't be parsed, return safe with signature
  return {
    safe: true,
    mime: sig.mime,
    extension: sig.extension,
  };
}
