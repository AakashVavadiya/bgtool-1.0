export function getOpenApiSpec(): Record<string, any> {
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
        description: "Production API Server (Hostinger Cloud VPS)",
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
        JsonImageResponse: {
          type: "object",
          required: ["success", "image", "format", "credits_used", "credits_remaining", "request_id"],
          properties: {
            success: { type: "boolean", example: true },
            image: { type: "string", example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." },
            format: { type: "string", example: "png" },
            model: { type: "string", example: "ganga", description: "Neural AI model utilized for inference (e.g. karudi, ganga, brahmaputra, narmada, saraswati)" },
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
              },
            },
            key: {
              type: "object",
              properties: {
                prefix: { type: "string", example: "bgt_live_e3f9a1..." },
                type: { type: "string", example: "live" },
                rateLimitPerMinute: { type: "integer", example: 60 },
                dailyQuota: { type: "integer", example: 1000 },
              },
            },
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
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: false,
              schema: { type: "string" },
              description: "Unique UUID to safely retry requests without double billing.",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", format: "binary", description: "Image file (PNG, JPG, WebP up to 30 MB)" },
                    model: {
                      type: "string",
                      enum: ["karudi", "ganga", "brahmaputra", "isnet", "u2net"],
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
                      enum: ["karudi", "ganga", "brahmaputra", "isnet", "u2net"],
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
            400: { description: "Invalid image or payload", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
            401: { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
            402: { description: "Insufficient credits", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
            413: { description: "Payload exceeds 30 MB limit", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
            429: { description: "Rate limit or quota exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          },
        },
      },
      "/api/v1/remove-watermark": {
        post: {
          summary: "Remove Watermark & Inpaint",
          description: "Deep inpainting engine that detects and erases watermarks, logos, stamps, and overlays.",
          operationId: "removeWatermark",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
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
                    image: { type: "string" },
                    image_url: { type: "string" },
                    response_format: { type: "string", enum: ["binary", "json"], default: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Watermark removed successfully" },
            402: { description: "Insufficient credits" },
          },
        },
      },
      "/api/v1/blur-face": {
        post: {
          summary: "Anonymize & Blur Faces",
          description: "Detects human faces and applies smooth Gaussian, pixelate, or black box anonymization.",
          operationId: "blurFace",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", format: "binary" },
                    blurType: { type: "string", enum: ["gaussian", "pixelate", "solid_black"], default: "gaussian" },
                    strength: { type: "number", default: 25 },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string" },
                    image_url: { type: "string" },
                    blurType: { type: "string", enum: ["gaussian", "pixelate", "solid_black"], default: "gaussian" },
                    strength: { type: "number", default: 25 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Faces blurred successfully" },
          },
        },
      },
      "/api/v1/detect-faces": {
        post: {
          summary: "Detect Human Faces",
          description: "Fast facial recognition model returning bounding boxes (x, y, width, height) without altering image.",
          operationId: "detectFaces",
          responses: {
            200: { description: "Detected face bounding boxes array" },
          },
        },
      },
      "/api/v1/compress-image": {
        post: {
          summary: "Compress Image File Size",
          description: "Loss-minimized image compression reducing up to 85% of file size while retaining visual fidelity.",
          operationId: "compressImage",
          responses: {
            200: { description: "Compressed image file" },
          },
        },
      },
      "/api/v1/convert-image": {
        post: {
          summary: "Convert Image Format",
          description: "Cross-format conversion between PNG, JPEG, and WebP with optional quality parameter.",
          operationId: "convertImage",
          responses: {
            200: { description: "Converted image file" },
          },
        },
      },
      "/api/v1/resize-image": {
        post: {
          summary: "Resize Image Dimensions",
          description: "High-quality Lanczos resampling to arbitrary dimensions (up to 6000x6000px).",
          operationId: "resizeImage",
          responses: {
            200: { description: "Resized image file" },
          },
        },
      },
      "/api/v1/crop-image": {
        post: {
          summary: "Crop Image Rectangle",
          description: "Pixel-accurate crop rectangle defined by x, y, width, and height.",
          operationId: "cropImage",
          responses: {
            200: { description: "Cropped image file" },
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
          },
        },
      },
      "/api/v1/usage": {
        get: {
          summary: "Get API Usage History & Analytics",
          description: "Paginated log of recent API requests and 30-day aggregated call/credit statistics.",
          operationId: "getUsage",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
            { name: "days", in: "query", schema: { type: "integer", default: 30 } },
          ],
          responses: {
            200: { description: "Usage history and analytics" },
          },
        },
      },
      "/api/v1/health": {
        get: {
          summary: "Health Check & Status",
          description: "Reports operational health of API gateway, database, and background AI inference engines.",
          operationId: "getHealth",
          security: [],
          responses: {
            200: { description: "System operational" },
            503: { description: "Service degraded" },
          },
        },
      },
    },
  };
}

export function getPostmanCollection(): Record<string, any> {
  const spec = getOpenApiSpec();
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
