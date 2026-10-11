import crypto from "crypto";

export interface ToolSecurityProfile {
  id: string;
  maxFileSize: number; // in bytes, default 10MB
  maxBatchFiles: number;
  allowedMimeTypes: string[];
  allowedCategories: Array<"image" | "pdf" | "document">;
  maxPixels?: number;
  maxDimension?: number;
}

// Configurable limits via Environment Variables or safe defaults
export const SECURITY_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env["MAX_FILE_SIZE_BYTES"] || "", 10) || 30 * 1024 * 1024, // 30 MB
  MAX_BATCH_FILES: parseInt(process.env["MAX_BATCH_FILES"] || "", 10) || 10,
  MAX_REQUEST_SIZE: parseInt(process.env["MAX_REQUEST_SIZE_BYTES"] || "", 10) || 60 * 1024 * 1024, // 60 MB
  MAX_IMAGE_WIDTH: parseInt(process.env["MAX_IMAGE_WIDTH"] || "", 10) || 6000,
  MAX_IMAGE_HEIGHT: parseInt(process.env["MAX_IMAGE_HEIGHT"] || "", 10) || 6000,
  MAX_IMAGE_PIXELS: parseInt(process.env["MAX_IMAGE_PIXELS"] || "", 10) || 36_000_000, // 36 Megapixels
  TEMP_FILE_MAX_AGE_MS: 60 * 60 * 1000, // 1 hour retention
  TEMP_STORAGE_QUOTA_BYTES: 500 * 1024 * 1024, // 500 MB quota
};

// Tool specific security profiles
export const TOOL_PROFILES: Record<string, ToolSecurityProfile> = {
  "remove-bg": {
    id: "remove-bg",
    maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    maxBatchFiles: 1,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    allowedCategories: ["image"],
    maxPixels: SECURITY_CONFIG.MAX_IMAGE_PIXELS,
    maxDimension: SECURITY_CONFIG.MAX_IMAGE_WIDTH,
  },
  "remove-watermark": {
    id: "remove-watermark",
    maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    maxBatchFiles: 1,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    allowedCategories: ["image"],
    maxPixels: SECURITY_CONFIG.MAX_IMAGE_PIXELS,
    maxDimension: SECURITY_CONFIG.MAX_IMAGE_WIDTH,
  },
  "blur-face": {
    id: "blur-face",
    maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    maxBatchFiles: 1,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    allowedCategories: ["image"],
    maxPixels: SECURITY_CONFIG.MAX_IMAGE_PIXELS,
    maxDimension: SECURITY_CONFIG.MAX_IMAGE_WIDTH,
  },
  "pdf-tools": {
    id: "pdf-tools",
    maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    maxBatchFiles: 10,
    allowedMimeTypes: ["application/pdf"],
    allowedCategories: ["pdf"],
  },
  "general-image": {
    id: "general-image",
    maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    maxBatchFiles: 10,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/bmp"],
    allowedCategories: ["image"],
    maxPixels: SECURITY_CONFIG.MAX_IMAGE_PIXELS,
    maxDimension: SECURITY_CONFIG.MAX_IMAGE_WIDTH,
  },
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
  status?: number;
  detectedMime?: string;
  detectedCategory?: "image" | "pdf" | "document" | "executable" | "unknown";
  byteLength?: number;
  safeFilename?: string;
}

/**
 * Checks magic byte signatures from a binary buffer.
 * Rejects executables, scripts, and unknown formats.
 */
export function inspectFileSignature(buffer: Buffer): {
  mime: string;
  category: "image" | "pdf" | "document" | "executable" | "unknown";
  extension: string;
} {
  if (!buffer || buffer.length < 4) {
    return { mime: "application/octet-stream", category: "unknown", extension: "bin" };
  }

  // 1. Detect Executables & Malicious Binaries (Immediate Rejection)
  // MZ header for Windows PE / EXE / DLL: 4D 5A
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { mime: "application/x-dosexec", category: "executable", extension: "exe" };
  }
  // ELF header for Linux executable: 7F 45 4C 46
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { mime: "application/x-executable", category: "executable", extension: "elf" };
  }
  // Mach-O for macOS: FE ED FA CE, CE FA ED FE, CF FA ED FE, etc.
  if (
    (buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa && (buffer[3] === 0xce || buffer[3] === 0xcf)) ||
    (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe) ||
    (buffer[0] === 0xce && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe)
  ) {
    return { mime: "application/x-mach-binary", category: "executable", extension: "macho" };
  }
  // Java class file: CA FE BA BE
  if (buffer[0] === 0xca && buffer[1] === 0xfe && buffer[2] === 0xba && buffer[3] === 0xbe) {
    return { mime: "application/java-vm", category: "executable", extension: "class" };
  }
  // Shell script: #!
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { mime: "text/x-shellscript", category: "executable", extension: "sh" };
  }

  // 2. Legitimate Image Formats
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", category: "image", extension: "png" };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", category: "image", extension: "jpg" };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", category: "image", extension: "webp" };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { mime: "image/gif", category: "image", extension: "gif" };
  }

  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { mime: "image/bmp", category: "image", extension: "bmp" };
  }

  // 3. Document / PDF Formats
  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: "application/pdf", category: "pdf", extension: "pdf" };
  }

  // SVG: Inspect text for valid xml/svg and sanitize against active script injection
  const headStr = buffer.slice(0, Math.min(buffer.length, 1024)).toString("utf-8").toLowerCase();
  if (headStr.includes("<svg") || headStr.includes("<?xml")) {
    // Check for malicious script injections or active content
    if (
      headStr.includes("<script") ||
      headStr.includes("javascript:") ||
      headStr.includes("onload=") ||
      headStr.includes("onerror=") ||
      headStr.includes("<iframe")
    ) {
      return { mime: "application/x-malicious-svg", category: "executable", extension: "svg" };
    }
    return { mime: "image/svg+xml", category: "image", extension: "svg" };
  }

  return { mime: "application/octet-stream", category: "unknown", extension: "bin" };
}

/**
 * Validates a binary buffer against security policy and tool profile.
 */
export function validateBuffer(
  buffer: Buffer,
  toolProfile: ToolSecurityProfile = TOOL_PROFILES["remove-bg"]!,
  clientReportedMime?: string
): ValidationResult {
  // 1. Zero-byte check
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      status: 400,
      error: "Uploaded file is empty (0 bytes). Please upload a valid file.",
    };
  }

  // 2. Maximum file size check (Default 30 MB)
  if (buffer.length > toolProfile.maxFileSize) {
    const maxMb = Math.round(toolProfile.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      status: 413,
      error: `File size exceeds the ${maxMb} MB limit. Please upload a smaller file.`,
      byteLength: buffer.length,
    };
  }

  // 3. Inspect actual binary signature (Magic Bytes)
  const signature = inspectFileSignature(buffer);

  // 4. Reject executables & active content immediately
  if (signature.category === "executable") {
    return {
      valid: false,
      status: 415,
      error: "Executable files and active scripts are strictly prohibited.",
      detectedMime: signature.mime,
      detectedCategory: "executable",
    };
  }

  // 5. Check allowed category
  if (!toolProfile.allowedCategories.includes(signature.category as any)) {
    return {
      valid: false,
      status: 415,
      error: `Unsupported file format. Expected ${toolProfile.allowedCategories.join(" or ")}.`,
      detectedMime: signature.mime,
      detectedCategory: signature.category,
    };
  }

  // 6. Check allowed mime types if specified
  if (toolProfile.allowedMimeTypes.length > 0 && !toolProfile.allowedMimeTypes.includes(signature.mime)) {
    return {
      valid: false,
      status: 415,
      error: `Unsupported file type (${signature.mime}). Please provide one of: ${toolProfile.allowedMimeTypes.join(", ")}.`,
      detectedMime: signature.mime,
      detectedCategory: signature.category,
    };
  }

  // 7. Generate random, unguessable safe server filename
  const randomToken = crypto.randomBytes(16).toString("hex");
  const safeFilename = `${randomToken}.${signature.extension}`;

  return {
    valid: true,
    status: 200,
    detectedMime: signature.mime,
    detectedCategory: signature.category,
    byteLength: buffer.length,
    safeFilename,
  };
}

/**
 * Validates a Base64 data URL payload before JSON parsing / backend dispatch.
 */
export function validateBase64Payload(
  payload: string,
  toolProfile: ToolSecurityProfile = TOOL_PROFILES["remove-bg"]!
): ValidationResult & { buffer?: Buffer; cleanBase64?: string } {
  if (!payload || typeof payload !== "string" || payload.trim().length === 0) {
    return {
      valid: false,
      status: 400,
      error: "No image payload provided.",
    };
  }

  let cleanBase64 = payload;
  let reportedMime: string | undefined;

  // Extract data:image/...;base64, prefix if present
  if (payload.startsWith("data:")) {
    const commaIndex = payload.indexOf(",");
    if (commaIndex === -1) {
      return {
        valid: false,
        status: 400,
        error: "Malformed data URI payload.",
      };
    }
    const header = payload.slice(0, commaIndex);
    cleanBase64 = payload.slice(commaIndex + 1);
    const mimeMatch = header.match(/^data:([^;]+)/);
    if (mimeMatch) {
      reportedMime = mimeMatch[1];
    }
  }

  // Quick pre-flight calculation: Base64 size ~= length * 0.75
  const estimatedBytes = Math.ceil((cleanBase64.length * 3) / 4);
  if (estimatedBytes > toolProfile.maxFileSize) {
    const maxMb = Math.round(toolProfile.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      status: 413,
      error: `File size exceeds the ${maxMb} MB limit. Please upload a smaller file.`,
      byteLength: estimatedBytes,
    };
  }

  // Decode to binary buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleanBase64, "base64");
  } catch {
    return {
      valid: false,
      status: 400,
      error: "Invalid Base64 encoding.",
    };
  }

  // Validate actual binary contents
  const validation = validateBuffer(buffer, toolProfile, reportedMime);
  if (!validation.valid) {
    return validation;
  }

  return {
    ...validation,
    buffer,
    cleanBase64,
  };
}
