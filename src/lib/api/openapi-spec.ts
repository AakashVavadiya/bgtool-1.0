import { PUBLIC_MODELS } from "./models";

export function getOpenApiSpec(): Record<string, any> {
  const idempotencyHeaderParam = {
    name: "Idempotency-Key",
    in: "header",
    required: false,
    schema: { type: "string" },
    description: "Unique UUID or request identifier to safely retry requests without double billing (valid for 24h).",
  };

  const standardErrorResponses = {
    400: {
      description: "Bad Request - Invalid payload, parameters, or unsupported model",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
    401: {
      description: "Unauthorized - Missing, invalid, revoked, or expired API key",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
    402: {
      description: "Payment Required - Insufficient credits to perform operation",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
    413: {
      description: "Payload Too Large - File or request exceeds limit (30 MB binary, 40 MB JSON, or 50 MP image bomb)",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
    422: {
      description: "Unprocessable Entity - Idempotency key conflict with a differing request payload",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
    429: {
      description: "Too Many Requests - API key rate limit or daily quota exceeded",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
    },
  };

  const commonAuthResponses = {
    401: standardErrorResponses[401],
    429: standardErrorResponses[429],
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "bg.tools Public REST API",
      version: "1.0.0",
      description:
        "High-performance REST API for AI Background Removal, Watermark Erasing, Face Anonymization, and Ultra-Fast Image Conversion.",
      contact: {
        name: "bg.tools Developer Support",
        email: "support@bg.tools",
        url: "https://bg.tools/docs/api",
      },
      license: {
        name: "Commercial API Terms",
        url: "https://bg.tools/terms",
      },
    },
    servers: [
      {
        url: "https://bg.tools",
        description: "Production",
      },
    ],
    security: [
      { BearerAuth: [] },
      { ApiKeyAuth: [] },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "bgt_live_...",
          description: "Use your API key prefixed with Bearer in the Authorization header.",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Alternative header for passing your bg.tools API key directly.",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message", "request_id"],
              properties: {
                code: { type: "string", example: "invalid_api_key" },
                message: { type: "string", example: "The provided API key is invalid, revoked, or expired." },
                request_id: { type: "string", example: "req_9f3a18b2c45e" },
              },
            },
          },
        },
        FaceBoundingBox: {
          type: "object",
          properties: {
            x: { type: "integer", example: 120 },
            y: { type: "integer", example: 85 },
            width: { type: "integer", example: 200 },
            height: { type: "integer", example: 200 },
            confidence: { type: "number", example: 0.98 },
          },
        },
        DetectFacesResponse: {
          type: "object",
          required: ["success", "facesDetected", "faces", "credits_used", "credits_remaining", "request_id"],
          properties: {
            success: { type: "boolean", example: true },
            model: { type: "string", example: "saraswati" },
            facesDetected: { type: "integer", example: 2 },
            faces: {
              type: "array",
              items: { $ref: "#/components/schemas/FaceBoundingBox" },
            },
            duration: { type: "number", example: 0.42 },
            credits_used: { type: "number", example: 0.5 },
            credits_remaining: { type: "number", example: 49.5 },
            request_id: { type: "string", example: "req_9f3a18b2c45e" },
          },
        },
        JsonImageResponse: {
          type: "object",
          required: ["success", "image", "format", "credits_used", "credits_remaining", "request_id"],
          properties: {
            success: { type: "boolean", example: true },
            image: { type: "string", example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." },
            format: { type: "string", example: "png" },
            model: {
              type: "string",
              enum: [...PUBLIC_MODELS],
              example: "ganga",
              description: `Neural AI model utilized for inference (${PUBLIC_MODELS.join(", ")})`,
            },
            width: { type: "integer", example: 1200 },
            height: { type: "integer", example: 800 },
            credits_used: { type: "number", example: 1 },
            credits_remaining: { type: "number", example: 49 },
            request_id: { type: "string", example: "req_9f3a18b2c45e" },
          },
        },
        AccountDetails: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            account: {
              type: "object",
              properties: {
                id: { type: "string", example: "usr_abc123" },
                email: { type: "string", example: "developer@example.com" },
                name: { type: "string", example: "Alex Mercer" },
                plan: { type: "string", example: "pro" },
                credits: { type: "number", example: 1250 },
                free_credits: { type: "number", example: 10 },
                paid_credits: { type: "number", example: 1240 },
                total_processed: { type: "integer", example: 420 },
              },
            },
            key: {
              type: "object",
              properties: {
                prefix: { type: "string", example: "bgt_live_e3f9a1..." },
                type: { type: "string", example: "live" },
                rateLimitPerMinute: { type: "integer", example: 60 },
                dailyQuota: { type: "integer", example: 1000 },
                monthlyQuota: { type: "integer", example: 25000 },
                lastUsedAt: { type: "string", example: "2026-11-20T10:00:00.000Z" },
              },
            },
            isSandbox: { type: "boolean", example: false },
            request_id: { type: "string", example: "req_9f3a18b2c45e" },
          },
        },
      },
    },
    paths: {
      "/api/v1/remove-background": {
        post: {
          summary: "Remove Image Background",
          description: "Neural foreground segmentation that removes backgrounds cleanly with transparent PNG output. Select 'ganga' for ultra-fine hair & fur alpha matting, or 'karudi' for universal orchestrator processing.",
          operationId: "removeBackground",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary", description: "Image file (PNG, JPG, WebP up to 30 MB)" },
                    model: {
                      type: "string",
                      enum: [...PUBLIC_MODELS],
                      default: "ganga",
                      description: "AI Model preset: 'karudi' (universal orchestrator), 'ganga' (dedicated sub-pixel alpha matting, default), 'brahmaputra' (fast matting)",
                    },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", description: "Base64 encoded image string or data URI" },
                    image_url: { type: "string", format: "uri", description: "Remote HTTPS image URL" },
                    model: {
                      type: "string",
                      enum: [...PUBLIC_MODELS],
                      default: "ganga",
                      description: "AI Model preset: 'karudi' (universal orchestrator), 'ganga' (dedicated sub-pixel alpha matting, default), 'brahmaputra' (fast matting)",
                    },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Background removed successfully",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/remove-watermark": {
        post: {
          summary: "Remove Watermark & Inpaint",
          description: "Deep inpainting engine that detects and erases watermarks, logos, stamps, and overlays.",
          operationId: "removeWatermark",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", description: "Base64 encoded image string or data URI" },
                    image_url: { type: "string", format: "uri", description: "Remote HTTPS image URL" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Watermark removed successfully",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/blur-face": {
        post: {
          summary: "Anonymize & Blur Faces",
          description: "Detects human faces and applies smooth Gaussian, pixelate, or black box anonymization.",
          operationId: "blurFace",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    blurType: { type: "string", enum: ["gaussian", "pixelate", "solid_black"], default: "gaussian" },
                    strength: { type: "number", default: 25 },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string", format: "uri" },
                    blurType: { type: "string", enum: ["gaussian", "pixelate", "solid_black"], default: "gaussian" },
                    strength: { type: "number", default: 25 },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Faces blurred successfully",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/detect-faces": {
        post: {
          summary: "Detect Human Faces",
          description: "Fast face detection (bounding boxes only, no identification) returning coordinates (x, y, width, height) without altering image.",
          operationId: "detectFaces",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary", description: "Image file (PNG, JPG, WebP up to 30 MB)" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", description: "Base64 encoded image string or data URI" },
                    image_url: { type: "string", format: "uri", description: "Remote HTTPS image URL" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Detected face bounding boxes array",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/DetectFacesResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/compress-image": {
        post: {
          summary: "Compress Image File Size",
          description: "Loss-minimized image compression reducing up to 85% of file size while retaining visual fidelity.",
          operationId: "compressImage",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    quality: { type: "integer", minimum: 1, maximum: 100, default: 80, description: "Compression quality (1-100)" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string", format: "uri" },
                    quality: { type: "integer", minimum: 1, maximum: 100, default: 80, description: "Compression quality (1-100)" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Compressed image file",
              content: {
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/webp": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/convert-image": {
        post: {
          summary: "Convert Image Format",
          description: "Cross-format conversion between PNG, JPEG, and WebP with optional quality parameter.",
          operationId: "convertImage",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    format: { type: "string", enum: ["png", "jpeg", "webp"], default: "webp" },
                    quality: { type: "integer", minimum: 1, maximum: 100, default: 90 },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string", format: "uri" },
                    format: { type: "string", enum: ["png", "jpeg", "webp"], default: "webp" },
                    quality: { type: "integer", minimum: 1, maximum: 100, default: 90 },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Converted image file",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "image/webp": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/resize-image": {
        post: {
          summary: "Resize Image Dimensions",
          description: "High-quality Lanczos resampling to arbitrary dimensions (up to 6000x6000px).",
          operationId: "resizeImage",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    width: { type: "integer", minimum: 1, maximum: 6000, description: "Target width in pixels (max 6000)" },
                    height: { type: "integer", minimum: 1, maximum: 6000, description: "Target height in pixels (max 6000)" },
                    fit: { type: "string", enum: ["contain", "cover", "fill", "inside", "outside"], default: "contain" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string", format: "uri" },
                    width: { type: "integer", minimum: 1, maximum: 6000, description: "Target width in pixels (max 6000)" },
                    height: { type: "integer", minimum: 1, maximum: 6000, description: "Target height in pixels (max 6000)" },
                    fit: { type: "string", enum: ["contain", "cover", "fill", "inside", "outside"], default: "contain" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Resized image file",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "image/webp": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/crop-image": {
        post: {
          summary: "Crop Image Rectangle",
          description: "Pixel-accurate crop rectangle defined by x, y, width, and height.",
          operationId: "cropImage",
          parameters: [idempotencyHeaderParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    x: { type: "integer", minimum: 0, description: "Left coordinate" },
                    y: { type: "integer", minimum: 0, description: "Top coordinate" },
                    width: { type: "integer", minimum: 1, description: "Crop width" },
                    height: { type: "integer", minimum: 1, description: "Crop height" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string", format: "uri" },
                    x: { type: "integer", minimum: 0, description: "Left coordinate" },
                    y: { type: "integer", minimum: 0, description: "Top coordinate" },
                    width: { type: "integer", minimum: 1, description: "Crop width" },
                    height: { type: "integer", minimum: 1, description: "Crop height" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Cropped image file",
              content: {
                "image/png": { schema: { type: "string", format: "binary" } },
                "image/jpeg": { schema: { type: "string", format: "binary" } },
                "image/webp": { schema: { type: "string", format: "binary" } },
                "application/json": { schema: { $ref: "#/components/schemas/JsonImageResponse" } },
              },
            },
            ...standardErrorResponses,
          },
        },
      },
      "/api/v1/account": {
        get: {
          summary: "Get API Account & Credit Balance",
          description: "Returns currently authenticated user account information, remaining credits, and key rate limits.",
          operationId: "getAccount",
          responses: {
            200: {
              description: "Account details",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AccountDetails" } } },
            },
            ...commonAuthResponses,
          },
        },
      },
      "/api/v1/usage": {
        get: {
          summary: "Get API Usage History & Analytics",
          description: "Paginated log of recent API requests and 30-day aggregated call/credit statistics.",
          operationId: "getUsage",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 }, description: "Max 100 items" },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
            { name: "days", in: "query", schema: { type: "integer", default: 30 } },
          ],
          responses: {
            200: { description: "Usage history and analytics" },
            ...commonAuthResponses,
          },
        },
      },
      "/api/v1/health": {
        get: {
          summary: "Health Check",
          description: "Reports operational status of public API gateway.",
          operationId: "getHealth",
          security: [],
          responses: {
            200: {
              description: "Operational",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status"],
                    properties: {
                      status: { type: "string", enum: ["ok", "degraded"], example: "ok" },
                    },
                  },
                },
              },
            },
            503: {
              description: "Degraded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status"],
                    properties: {
                      status: { type: "string", enum: ["degraded"], example: "degraded" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function getPostmanCollection(): Record<string, any> {
  return {
    info: {
      name: "bg.tools Public API Collection",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      description: "Official Postman Collection for bg.tools Public REST API v1.",
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{BGT_API_KEY}}", type: "string" }],
    },
    variable: [
      { key: "baseUrl", value: "https://bg.tools", type: "string" },
      { key: "BGT_API_KEY", value: "bgt_live_YOUR_API_KEY_HERE", type: "string" },
    ],
    item: [
      {
        name: "Remove Background",
        request: {
          method: "POST",
          header: [{ key: "Accept", value: "image/png" }],
          body: {
            mode: "formdata",
            formdata: [
              { key: "image", type: "file", src: "" },
              { key: "response_format", value: "binary", type: "text" },
            ],
          },
          url: { raw: "{{baseUrl}}/api/v1/remove-background", host: ["{{baseUrl}}"], path: ["api", "v1", "remove-background"] },
        },
      },
      {
        name: "Remove Watermark",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/photo.jpg", response_format: "json" }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/remove-watermark", host: ["{{baseUrl}}"], path: ["api", "v1", "remove-watermark"] },
        },
      },
      {
        name: "Blur Face",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/crowd.jpg", blurType: "gaussian", strength: 25 }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/blur-face", host: ["{{baseUrl}}"], path: ["api", "v1", "blur-face"] },
        },
      },
      {
        name: "Detect Faces",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/people.jpg" }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/detect-faces", host: ["{{baseUrl}}"], path: ["api", "v1", "detect-faces"] },
        },
      },
      {
        name: "Compress Image",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/photo.png", quality: 80 }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/compress-image", host: ["{{baseUrl}}"], path: ["api", "v1", "compress-image"] },
        },
      },
      {
        name: "Convert Image",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/photo.png", format: "webp", quality: 90 }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/convert-image", host: ["{{baseUrl}}"], path: ["api", "v1", "convert-image"] },
        },
      },
      {
        name: "Resize Image",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/photo.jpg", width: 800, height: 600, fit: "contain" }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/resize-image", host: ["{{baseUrl}}"], path: ["api", "v1", "resize-image"] },
        },
      },
      {
        name: "Crop Image",
        request: {
          method: "POST",
          body: {
            mode: "raw",
            raw: JSON.stringify({ image_url: "https://example.com/photo.jpg", x: 50, y: 50, width: 400, height: 300 }, null, 2),
            options: { raw: { language: "json" } },
          },
          url: { raw: "{{baseUrl}}/api/v1/crop-image", host: ["{{baseUrl}}"], path: ["api", "v1", "crop-image"] },
        },
      },
      {
        name: "Get Account Details",
        request: {
          method: "GET",
          url: { raw: "{{baseUrl}}/api/v1/account", host: ["{{baseUrl}}"], path: ["api", "v1", "account"] },
        },
      },
      {
        name: "Get Usage Logs",
        request: {
          method: "GET",
          url: { raw: "{{baseUrl}}/api/v1/usage?limit=20&days=7", host: ["{{baseUrl}}"], path: ["api", "v1", "usage"], query: [{ key: "limit", value: "20" }, { key: "days", value: "7" }] },
        },
      },
      {
        name: "Health Check",
        request: {
          method: "GET",
          url: { raw: "{{baseUrl}}/api/v1/health", host: ["{{baseUrl}}"], path: ["api", "v1", "health"] },
        },
      },
    ],
  };
}
