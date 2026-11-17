import { fetchImageWithSsrfProtection } from "./ssrf";
import { inspectFileSignature } from "../security/upload-policy";
import { createApiErrorResponse } from "./guard";

export interface ParsedImageInput {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalName?: string;
  responseFormat: "binary" | "json" | "base64";
  options: Record<string, any>;
}

export interface ParseResult {
  success: boolean;
  input?: ParsedImageInput;
  response?: Response;
}

/**
 * Parses image payload from multipart/form-data, application/json, or raw binary stream.
 * Validates magic bytes, enforces 30 MB size limit, and protects against SSRF.
 */
export async function parseApiImageRequest(
  request: Request,
  requestId: string
): Promise<ParseResult> {
  // Pre-flight Content-Length check (30 MB limit)
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredLen = parseInt(contentLengthHeader, 10);
    if (declaredLen > 30 * 1024 * 1024) {
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
  }

  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const acceptHeader = (request.headers.get("accept") || "").toLowerCase();
  const wantsJson = acceptHeader.includes("application/json") && !acceptHeader.includes("image/*");

  let buffer: Buffer | null = null;
  let responseFormat: "binary" | "json" | "base64" = wantsJson ? "json" : "binary";
  const options: Record<string, any> = {};

  // 1. JSON Payload: { "image": "base64...", "image_url": "https://...", "response_format": "binary|json" }
  if (contentType.includes("application/json")) {
    let body: any;
    try {
      body = await request.json();
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

    // Pass through extra options (e.g. format, quality, width, height, detectOnly)
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
    } catch {
      return {
        success: false,
        response: createApiErrorResponse(400, "invalid_binary_body", "Failed to read binary request body.", requestId),
      };
    }
  }

  // Unsupported Content-Type
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

  // 4. File Size Cap (30 MB)
  if (buffer.length > 30 * 1024 * 1024) {
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

  // 5. Magic Byte Inspection (Must be valid PNG, JPEG, WebP, GIF, or BMP)
  const sig = inspectFileSignature(buffer);

  // Reject executables and scripts immediately
  if (sig.category === "executable") {
    return {
      success: false,
      response: createApiErrorResponse(
        415,
        "executable_prohibited",
        "Executable binaries, shell scripts, and active payloads are strictly prohibited.",
        requestId
      ),
    };
  }

  const allowedMimes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
  if (!allowedMimes.includes(sig.mime)) {
    return {
      success: false,
      response: createApiErrorResponse(
        415,
        "unsupported_image_format",
        `Unsupported image format (${sig.mime}). Only PNG, JPEG, WebP, GIF, and BMP are accepted.`,
        requestId
      ),
    };
  }

  return {
    success: true,
    input: {
      buffer,
      mimeType: sig.mime,
      extension: sig.extension,
      originalName: options["originalName"],
      responseFormat,
      options,
    },
  };
}
