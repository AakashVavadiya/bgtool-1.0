import crypto from "crypto";
import { authenticateApiV1Request, createApiErrorResponse } from "./guard";
import { parseApiImageRequest } from "./request-parser";
import { getEndpointCreditCost } from "./pricing";
import { callEngine } from "./engine-client";
import { inferenceLimiter } from "./concurrency";
import { apiKeysRepo } from "../db/api-keys-repo";
import { creditLedgerRepo } from "../db/credit-ledger-repo";
import { getOpenApiSpec, getPostmanCollection } from "./openapi-spec";
import { getDb } from "../db/client";
import { PUBLIC_MODELS, DEFAULT_PUBLIC_MODEL, isValidPublicModel } from "./models";

interface EndpointRouteConfig {
  toolKey: string;
  scope: string;
  port: 5000 | 5001;
  backendPath: string;
}

const TOOL_ROUTES: Record<string, EndpointRouteConfig> = {
  "/api/v1/remove-background": {
    toolKey: "remove-background",
    scope: "remove-bg",
    port: 5000,
    backendPath: "/remove-base64",
  },
  "/api/v1/remove-bg": {
    toolKey: "remove-background",
    scope: "remove-bg",
    port: 5000,
    backendPath: "/remove-base64",
  },
  "/api/v1/remove-watermark": {
    toolKey: "remove-watermark",
    scope: "remove-watermark",
    port: 5001,
    backendPath: "/remove-watermark",
  },
  "/api/v1/blur-face": {
    toolKey: "blur-face",
    scope: "blur-face",
    port: 5001,
    backendPath: "/blur-face",
  },
  "/api/v1/detect-faces": {
    toolKey: "detect-faces",
    scope: "detect-faces",
    port: 5001,
    backendPath: "/detect-faces",
  },
  "/api/v1/compress-image": {
    toolKey: "compress-image",
    scope: "compress-image",
    port: 5001,
    backendPath: "/compress-image",
  },
  "/api/v1/convert-image": {
    toolKey: "convert-image",
    scope: "convert-image",
    port: 5001,
    backendPath: "/convert-image",
  },
  "/api/v1/resize-image": {
    toolKey: "resize-image",
    scope: "resize-image",
    port: 5001,
    backendPath: "/resize-image",
  },
  "/api/v1/crop-image": {
    toolKey: "crop-image",
    scope: "crop-image",
    port: 5001,
    backendPath: "/crop-image",
  },
};

/**
 * Handles CORS pre-flight OPTIONS request strictly.
 */
function handleCorsPreflight(request: Request): Response {
  const origin = request.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, X-API-Key, Idempotency-Key, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "public, max-age=86400",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return new Response(null, { status: 204, headers });
}

export async function handleApiV1(request: Request, clientIp: string): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");
  const startTime = Date.now();

  // 0. Handle CORS Pre-flight OPTIONS
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  // 1. Documentation & Specs (Publicly available)
  if (pathname === "/api/v1/openapi.json" && request.method === "GET") {
    return new Response(JSON.stringify(getOpenApiSpec(), null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/api/v1/postman.json" && request.method === "GET") {
    return new Response(JSON.stringify(getPostmanCollection(), null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 2. Public Health Check Endpoint: Returns ONLY {"status":"ok"|"degraded"}
  // Leaks NO DB details, versions, latency, uptime, or internal hostnames
  if (pathname === "/api/v1/health" && request.method === "GET") {
    let dbStatus = "ok";
    try {
      getDb().prepare("SELECT 1").get();
    } catch {
      dbStatus = "error";
    }

    const isHealthy = dbStatus === "ok";
    return new Response(
      JSON.stringify({ status: isHealthy ? "ok" : "degraded" }),
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3. Account Details Endpoint: Strictly scoped to authenticated key owner
  if (pathname === "/api/v1/account" && request.method === "GET") {
    const auth = await authenticateApiV1Request(request);
    if (!auth.authorized || !auth.context) {
      return auth.response!;
    }
    const { key, user, isSandbox, requestId, rateLimitHeaders } = auth.context;

    return new Response(
      JSON.stringify(
        {
          success: true,
          account: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            credits: user.credits,
            free_credits: user.free_credits,
            paid_credits: user.paid_credits,
            total_processed: user.total_processed,
          },
          key: {
            prefix: key.key_prefix,
            type: key.key_type,
            rateLimitPerMinute: key.rate_limit_per_minute,
            dailyQuota: key.daily_quota,
            monthlyQuota: key.monthly_quota,
            lastUsedAt: key.last_used_at,
          },
          isSandbox,
          request_id: requestId,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Request-Id": requestId,
          ...rateLimitHeaders,
        },
      }
    );
  }

  // 4. Usage History Endpoint: Strictly scoped to authenticated user, limit capped at 100
  if (pathname === "/api/v1/usage" && request.method === "GET") {
    const auth = await authenticateApiV1Request(request);
    if (!auth.authorized || !auth.context) {
      return auth.response!;
    }
    const { user, requestId, rateLimitHeaders } = auth.context;

    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
    const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
    const daysParam = parseInt(url.searchParams.get("days") || "30", 10);

    // Strict cap at 100 items per request
    const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 50 : limitParam));
    const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam);
    const days = Math.max(1, Math.min(90, isNaN(daysParam) ? 30 : daysParam));

    const history = apiKeysRepo.getUserUsage(user.id, limit, offset);
    const stats = apiKeysRepo.getUserUsageStats(user.id, days);

    return new Response(
      JSON.stringify(
        {
          success: true,
          pagination: {
            total: history.total,
            limit,
            offset,
          },
          summary: stats,
          items: history.items,
          request_id: requestId,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Request-Id": requestId,
          ...rateLimitHeaders,
        },
      }
    );
  }

  // 5. Tool Endpoints
  const routeCfg = TOOL_ROUTES[pathname];
  if (!routeCfg) {
    return createApiErrorResponse(
      404,
      "route_not_found",
      `The requested endpoint '${pathname}' was not found. Refer to the documentation at https://bg.tools/docs/api.`,
      `req_${Date.now()}`
    );
  }

  if (request.method !== "POST") {
    return createApiErrorResponse(
      405,
      "method_not_allowed",
      `HTTP ${request.method} is not allowed on this endpoint. Use HTTP POST.`,
      `req_${Date.now()}`,
      { Allow: "POST" }
    );
  }

  // 6. Authenticate & Authorize API Key with required scope
  const auth = await authenticateApiV1Request(request, routeCfg.scope);
  if (!auth.authorized || !auth.context) {
    return auth.response!;
  }
  const { key, user, isSandbox, requestId, idempotencyKey, rateLimitHeaders } = auth.context;

  // 7. Calculate Credit Cost (Sandbox keys cost 0 credits)
  const creditCost = isSandbox ? 0 : getEndpointCreditCost(routeCfg.toolKey);

  // Pre-check balance before any expensive operations
  if (!isSandbox && creditCost > 0 && user.credits < creditCost) {
    return createApiErrorResponse(
      402,
      "insufficient_credits",
      `Insufficient credits. Required: ${creditCost}, available: ${user.credits}. Purchase credits at https://bg.tools/pricing.`,
      requestId,
      {
        "X-Credits-Required": String(creditCost),
        "X-Credits-Available": String(user.credits),
        ...rateLimitHeaders,
      }
    );
  }

  // 8. Parse and Validate Image Input (enforces 30MB binary / 40MB JSON & 50MP pixel bomb limit)
  const parseResult = await parseApiImageRequest(request, requestId);
  if (!parseResult.success || !parseResult.input) {
    return parseResult.response!;
  }

  const { buffer, mimeType, responseFormat, options } = parseResult.input;

  // 9. Model validation (Single source of truth via PUBLIC_MODELS)
  const urlObj = new URL(request.url);
  const rawModel = String(options["model"] || urlObj.searchParams.get("model") || "").toLowerCase().trim();
  let selectedModel = DEFAULT_PUBLIC_MODEL;

  if (rawModel) {
    if (!isValidPublicModel(rawModel)) {
      return createApiErrorResponse(
        400,
        "invalid_model",
        `Invalid model '${rawModel}'. Supported models: ${PUBLIC_MODELS.join(", ")}.`,
        requestId,
        rateLimitHeaders
      );
    }
    selectedModel = rawModel;
  } else if (routeCfg.toolKey === "remove-watermark") {
    selectedModel = "narmada" as any;
  } else if (routeCfg.toolKey === "blur-face" || routeCfg.toolKey === "detect-faces") {
    selectedModel = "saraswati" as any;
  } else if (
    routeCfg.toolKey.startsWith("convert-") ||
    routeCfg.toolKey.startsWith("resize-") ||
    routeCfg.toolKey.startsWith("crop-") ||
    routeCfg.toolKey.startsWith("compress-")
  ) {
    selectedModel = "brahmaputra";
  }

  // 10. Idempotency Check with Request Hash Verification (RFC 9457 / Stripe specification)
  // Compute deterministic SHA-256 hash of: endpoint + model + options + image binary
  const requestHash = crypto
    .createHash("sha256")
    .update(`${pathname}:${selectedModel}:${JSON.stringify(options)}:${buffer.toString("base64")}`)
    .digest("hex");

  if (idempotencyKey) {
    const cached = apiKeysRepo.getIdempotentResponse(key.key_hash, idempotencyKey);
    if (cached) {
      // If same key is used with a different payload -> 422 Unprocessable Entity
      if (cached.requestHash && cached.requestHash !== requestHash) {
        return createApiErrorResponse(
          422,
          "idempotency_conflict",
          "Idempotency key has already been used with a different request payload.",
          requestId,
          rateLimitHeaders
        );
      }

      // Exact replay match: Return previous response without charging credits or running engine
      const respHeaders = new Headers(cached.headers);
      respHeaders.set("X-Idempotent-Replay", "true");
      respHeaders.set("X-Request-Id", requestId);
      for (const [k, v] of Object.entries(rateLimitHeaders)) {
        respHeaders.set(k, v);
      }

      const bodyBuffer = cached.isBase64 ? Buffer.from(cached.body, "base64") : cached.body;
      return new Response(bodyBuffer, {
        status: cached.statusCode,
        headers: respHeaders,
      });
    }
  }

  // 11. Concurrency Queue: Protect Host RAM from overload
  let releasePermit: (() => void) | null = null;
  try {
    releasePermit = await inferenceLimiter.acquire(15000);
  } catch {
    return createApiErrorResponse(
      503,
      "engine_busy",
      "The processing engine is currently at peak capacity. Please retry shortly.",
      requestId,
      {
        "Retry-After": "3",
        ...rateLimitHeaders,
      }
    );
  }

  // 12. Prepare Engine Payload & Dispatch to 127.0.0.1
  const rawBase64 = buffer.toString("base64");
  const enginePayload: Record<string, any> = {
    base64Image: `data:${mimeType};base64,${rawBase64}`,
    image: rawBase64,
    ...options,
    model: selectedModel,
  };

  if (routeCfg.toolKey === "detect-faces") {
    enginePayload["detectOnly"] = true;
  }

  const targetUrl = `http://127.0.0.1:${routeCfg.port}${routeCfg.backendPath}`;
  let engineResult: { ok: boolean; status: number; data?: any; error?: string };

  try {
    engineResult = await callEngine(targetUrl, enginePayload, routeCfg.port);
  } finally {
    if (releasePermit) {
      releasePermit();
    }
  }

  const latencyMs = Date.now() - startTime;

  // 13. Handle Downstream Failure -> Zero credits deducted
  if (!engineResult.ok || !engineResult.data?.success) {
    apiKeysRepo.recordUsage({
      requestId,
      keyId: key.id,
      userId: user.id,
      endpoint: pathname,
      status: engineResult.status || 500,
      creditsUsed: 0,
      latencyMs,
      ip: clientIp,
      idempotencyKey,
    });

    return createApiErrorResponse(
      engineResult.status || 500,
      "processing_error",
      engineResult.error || "Image processing engine error. No credits were deducted.",
      requestId,
      rateLimitHeaders
    );
  }

  // 14. Billing Safety: Deduct credits atomically in DB transaction ONLY after successful processing
  // Row lock and atomic check prevent concurrent double-spending
  let remainingCredits = user.credits;
  if (!isSandbox && creditCost > 0) {
    const deductRes = creditLedgerRepo.deductUserCredits(user.id, creditCost, routeCfg.toolKey, clientIp);
    if (!deductRes.success) {
      return createApiErrorResponse(
        402,
        "insufficient_credits",
        deductRes.error || `Insufficient credits. Required: ${creditCost}.`,
        requestId,
        {
          "X-Credits-Required": String(creditCost),
          "X-Credits-Available": String(deductRes.balanceAfter),
          ...rateLimitHeaders,
        }
      );
    }
    remainingCredits = deductRes.balanceAfter;
  }

  // 15. Record Successful Execution & Usage
  apiKeysRepo.recordUsage({
    requestId,
    keyId: key.id,
    userId: user.id,
    endpoint: pathname,
    status: 200,
    creditsUsed: creditCost,
    latencyMs,
    ip: clientIp,
    idempotencyKey,
  });

  const engineData = engineResult.data;

  // 16. Format Response (Binary or JSON)
  const baseHeaders: Record<string, string> = {
    "X-Request-Id": requestId,
    "X-Credits-Used": String(creditCost),
    "X-Credits-Remaining": String(remainingCredits),
    "X-Model-Used": selectedModel,
    "X-Processing-Time-Ms": String(latencyMs),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    ...rateLimitHeaders,
  };

  if (isSandbox) {
    baseHeaders["X-BGT-Sandbox"] = "true";
  }

  // Handle detect-faces JSON output
  if (routeCfg.toolKey === "detect-faces") {
    const jsonBody = JSON.stringify(
      {
        success: true,
        model: selectedModel,
        facesDetected: engineData.facesDetected || (engineData.faces ? engineData.faces.length : 0),
        faces: engineData.faces || [],
        duration: engineData.duration,
        credits_used: creditCost,
        credits_remaining: remainingCredits,
        request_id: requestId,
      },
      null,
      2
    );

    if (idempotencyKey) {
      apiKeysRepo.saveIdempotentResponse({
        keyHash: key.key_hash,
        idempotencyKey,
        requestHash,
        statusCode: 200,
        headers: baseHeaders,
        body: jsonBody,
        isBase64: false,
      });
    }

    return new Response(jsonBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...baseHeaders,
      },
    });
  }

  // Extract base64 image from result
  let outputB64 = engineData.base64Image || engineData.image || "";
  let outputMime = "image/png";

  if (outputB64.startsWith("data:")) {
    const commaIdx = outputB64.indexOf(",");
    if (commaIdx !== -1) {
      const headerPart = outputB64.slice(0, commaIdx);
      const mimeMatch = headerPart.match(/^data:([^;]+)/);
      if (mimeMatch) outputMime = mimeMatch[1];
      outputB64 = outputB64.slice(commaIdx + 1);
    }
  }

  const outputBuffer = Buffer.from(outputB64, "base64");

  // Output as JSON
  if (responseFormat === "json" || responseFormat === "base64") {
    const jsonPayload = JSON.stringify(
      {
        success: true,
        model: selectedModel,
        image: `data:${outputMime};base64,${outputB64}`,
        format: outputMime.replace("image/", ""),
        width: engineData.width || undefined,
        height: engineData.height || undefined,
        file_size_bytes: outputBuffer.length,
        credits_used: creditCost,
        credits_remaining: remainingCredits,
        request_id: requestId,
      },
      null,
      2
    );

    if (idempotencyKey) {
      apiKeysRepo.saveIdempotentResponse({
        keyHash: key.key_hash,
        idempotencyKey,
        requestHash,
        statusCode: 200,
        headers: baseHeaders,
        body: jsonPayload,
        isBase64: false,
      });
    }

    return new Response(jsonPayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...baseHeaders,
      },
    });
  }

  // Default: Output as binary image
  const binaryHeaders = {
    "Content-Type": outputMime,
    "Content-Length": String(outputBuffer.length),
    ...baseHeaders,
  };

  if (idempotencyKey) {
    apiKeysRepo.saveIdempotentResponse({
      keyHash: key.key_hash,
      idempotencyKey,
      requestHash,
      statusCode: 200,
      headers: binaryHeaders,
      body: outputB64,
      isBase64: true,
    });
  }

  return new Response(outputBuffer, {
    status: 200,
    headers: binaryHeaders,
  });
}
