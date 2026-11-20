import { fetchImageWithSsrfProtection } from "./ssrf";
import { inspectImageSafety } from "./image-safety";
import { createApiErrorResponse } from "./guard";

export interface ParsedImageInput {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalName?: string;
  responseFormat: "binary" | "json" | "base64";
  options: Record<string, any>;
  rawBodyForHash: string;
}

export interface ParseResult {
  success: boolean;
  input?: ParsedImageInput;
  response?: Response;
}

const MAX_JSON_PAYLOAD_SIZE = 40 * 1024 * 1024; // 40 MB max for base64 / JSON
const MAX_BINARY_PAYLOAD_SIZE = 30 * 1024 * 1024; // 30 MB max for raw binary

/**
 * Parses image payload from multipart/form-data, application/json, or raw binary stream.
 * Validates magic bytes, enforces size limits (30 MB binary, 40 MB JSON), protects against
 * SSRF, and inspects image headers for decompression bombs (max 50 MP).
 */
export async function parseApiImageRequest(
  request: Request,
  requestId: string
): Promise<ParseResult> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const acceptHeader = (request.headers.get("accept") || "").toLowerCase();
  const wantsJson = acceptHeader.includes("application/json") && !acceptHeader.includes("image/*");

  // Pre-flight Content-Length check
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredLen = parseInt(contentLengthHeader, 10);
    const limit = contentType.includes("application/json") ? MAX_JSON_PAYLOAD_SIZE : MAX_BINARY_PAYLOAD_SIZE;
    if (declaredLen > limit) {
      const mbLimit = Math.round(limit / (1024 * 1024));
      return {
        success: false,
        response: createApiErrorResponse(
          413,
          "payload_too_large",
          `Request body exceeds the ${mbLimit} MB maximum limit. Please compress or resize the image before uploading.`,
          requestId
        ),
      };
    }
  }

  let buffer: Buffer | null = null;
  let responseFormat: "binary" | "json" | "base64" = wantsJson ? "json" : "binary";
  const options: Record<string, any> = {};
  let rawBodyForHash = "";

  // 1. JSON Payload: { "image": "base64...", "image_url": "https://...", "response_format": "binary|json" }
  if (contentType.includes("application/json")) {
    let bodyText = "";
    try {
      bodyText = await request.text();
    } catch {
      return {
        success: false,
        response: createApiErrorResponse(400, "invalid_body", "Failed to read request body.", requestId),
      };
    }

    if (bodyText.length > MAX_JSON_PAYLOAD_SIZE) {
      return {
        success: false,
        response: createApiErrorResponse(
          413,
          "payload_too_large",
          "JSON payload exceeds the 40 MB maximum limit.",
          requestId
        ),
      };
    }

    rawBodyForHash = bodyText;

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return {
        success: false,
        response: createApiErrorResponse(400, "invalid_json", "Malformed JSON request body.", requestId),
      };
    }

    if (body.response_format === "json" || body.response_format === "base64") {
      responseFormat = body.response_format;
    } else if (body.response_format === "binary") {
      responseFormat = "binary";
    }

    // Collect extra options
    for (const [k, v] of Object.entries(body)) {
      if (k !== "image" && k !== "image_url") {
        options[k] = v;
      }
    }

    if (body.image_url) {
      // Remote image download with strict SSRF protection
      const fetchResult = await fetchImageWithSsrfProtection(String(body.image_url));
      if (!fetchResult.success || !fetchResult.buffer) {
        return {
          success: false,
          response: createApiErrorResponse(
            400,
            "ssrf_or_download_failed",
            fetchResult.error || "Failed to retrieve remote image.",
            requestId
          ),
        };
      }
      buffer = fetchResult.buffer;
    } else if (body.image || body.base64Image) {
      let rawB64 = String(body.image || body.base64Image);
      if (rawB64.includes(",")) {
        rawB64 = rawB64.split(",")[1] || "";
      }

      // Memory protection: reject huge base64 before decoding
      if (rawB64.length > 42 * 1024 * 1024) {
        return {
          success: false,
          response: createApiErrorResponse(
            413,
            "payload_too_large",
            "Base64 image payload exceeds the 40 MB size limit.",
            requestId
          ),
        };
      }

      try {
        buffer = Buffer.from(rawB64, "base64");
      } catch {
        return {
          success: false,
          response: createApiErrorResponse(400, "invalid_base64", "Invalid Base64-encoded image data.", requestId),
        };
      }
    } else {
      return {
        success: false,
        response: createApiErrorResponse(
          400,
          "missing_image",
          "No image payload provided. Supply either an 'image' base64 string or an 'image_url'.",
          requestId
        ),
      };
    }
  }

  // 2. Multipart / Form-Data
  else if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const fileEntry = formData.get("image") || formData.get("file");

      const respFmt = formData.get("response_format") as string | null;
      if (respFmt === "json" || respFmt === "base64") {
        responseFormat = respFmt;
      }

      // Collect extra fields
      for (const [key, value] of formData.entries()) {
        if (key !== "image" && key !== "file") {
          options[key] = value;
        }
      }

      if (fileEntry && typeof fileEntry === "object" && "arrayBuffer" in fileEntry) {
        const file = fileEntry as File;
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        options["originalName"] = file.name;
        rawBodyForHash = `multipart:${file.name}:${buffer.length}:${JSON.stringify(options)}`;
      } else {
        const imageUrl = formData.get("image_url") as string | null;
        if (imageUrl) {
          const fetchResult = await fetchImageWithSsrfProtection(imageUrl);
          if (!fetchResult.success || !fetchResult.buffer) {
            return {
              success: false,
              response: createApiErrorResponse(
                400,
                "ssrf_or_download_failed",
                fetchResult.error || "Failed to retrieve remote image.",
                requestId
              ),
            };
          }
          buffer = fetchResult.buffer;
          rawBodyForHash = `multipart_url:${imageUrl}:${JSON.stringify(options)}`;
        } else {
          return {
            success: false,
            response: createApiErrorResponse(
              400,
              "missing_file",
              "Missing file upload. Please provide an image file under the 'image' or 'file' form field.",
              requestId
            ),
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        response: createApiErrorResponse(
          400,
          "multipart_parse_error",
          `Failed to parse multipart form data: ${err?.message || "Invalid payload"}`,
          requestId
        ),
      };
    }
  }

  // 3. Raw Binary Image Body
  else if (contentType.startsWith("image/")) {
    try {
      const arrayBuf = await request.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      rawBodyForHash = `binary:${buffer.length}`;
    } catch {
      return {
        success: false,
        response: createApiErrorResponse(400, "invalid_binary_body", "Failed to read binary request body.", requestId),
      };
    }
  }

  // Unsupported Media Type
  else {
    return {
      success: false,
      response: createApiErrorResponse(
        415,
        "unsupported_media_type",
        `Unsupported Content-Type header: '${contentType}'. Send 'multipart/form-data', 'application/json', or raw image binary.`,
        requestId
      ),
    };
  }

  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      response: createApiErrorResponse(400, "empty_file", "Uploaded image is empty (0 bytes).", requestId),
    };
  }

  // File size cap: 30 MB
  if (buffer.length > MAX_BINARY_PAYLOAD_SIZE) {
    return {
      success: false,
      response: createApiErrorResponse(
        413,
        "payload_too_large",
        "File size exceeds the 30 MB maximum limit. Please compress or resize the image before uploading.",
        requestId
      ),
    };
  }

  // Safety inspection: Magic bytes, executable check & Image Bomb / 50 MP protection
  const safety = inspectImageSafety(buffer);
  if (!safety.safe) {
    return {
      success: false,
      response: createApiErrorResponse(
        safety.statusCode || 400,
        safety.errorCode || "invalid_image",
        safety.error || "Image safety validation failed.",
        requestId
      ),
    };
  }

  return {
    success: true,
    input: {
      buffer,
      mimeType: safety.mime || "image/png",
      extension: safety.extension || "png",
      originalName: options["originalName"],
      responseFormat,
      options,
      rawBodyForHash,
    },
  };
}
