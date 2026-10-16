import { authenticateApiV1Request, createApiErrorResponse } from "./guard";
import { parseApiImageRequest } from "./request-parser";
import { getEndpointCreditCost } from "./pricing";
import { callEngine } from "./engine-client";
import { inferenceLimiter } from "./concurrency";
import { apiKeysRepo } from "../db/api-keys-repo";
import { creditLedgerRepo } from "../db/credit-ledger-repo";
import { getOpenApiSpec, getPostmanCollection } from "./openapi-spec";
import { getDb } from "../db/client";

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

export async function handleApiV1(request: Request, clientIp: string): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");
  const startTime = Date.now();

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

  // 2. Health Check Endpoint
  if (pathname === "/api/v1/health" && request.method === "GET") {
    let dbStatus = "ok";
    try {
      getDb().prepare("SELECT 1").get();
    } catch {
      dbStatus = "error";
    }

    let bgRemoverStatus = "offline";
    try {
      const ping1 = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(500) });
      if (ping1.ok) bgRemoverStatus = "online";
    } catch {}

    let watermarkStatus = "offline";
    try {
      const ping2 = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(500) });
      if (ping2.ok) watermarkStatus = "online";
    } catch {}

    const isHealthy = dbStatus === "ok";
    return new Response(
      JSON.stringify(
        {
          status: isHealthy ? "healthy" : "degraded",
          version: "v1",
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
          services: {
            database: dbStatus,
            bg_remover_engine: bgRemoverStatus,
            watermark_engine: watermarkStatus,
            active_inference_workers: inferenceLimiter.running,
            queued_requests: inferenceLimiter.queued,
          },
        },
        null,
        2
      ),
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3. Account Details Endpoint
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
            id: key.id,
            name: key.name,
            prefix: key.key_prefix,
            type: key.key_type,
            scopes: JSON.parse(key.scopes),
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
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          ...rateLimitHeaders,
        },
      }
    );
  }

  // 4. Usage History Endpoint
  if (pathname === "/api/v1/usage" && request.method === "GET") {
    const auth = await authenticateApiV1Request(request);
    if (!auth.authorized || !auth.context) {
      return auth.response!;
    }
    const { user, requestId, rateLimitHeaders } = auth.context;

    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
    const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
    const daysParam = parseInt(url.searchParams.get("days") || "30", 10);

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
          "Content-Type": "application/json",
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

  // 8. Atomically Reserve Credits in SQLite before downstream execution
  let remainingCredits = user.credits;
  if (!isSandbox && creditCost > 0) {
    const deductRes = creditLedgerRepo.deductUserCredits(user.id, creditCost, routeCfg.toolKey, clientIp);
    if (!deductRes.success) {
      return createApiErrorResponse(
        402,
        "insufficient_credits",
        deductRes.error || `Insufficient credits. Required: ${creditCost}, available: ${deductRes.balanceAfter}. Purchase credits at https://bg.tools/pricing.`,
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

  // 9. Parse and Validate Image Input
  const parseResult = await parseApiImageRequest(request, requestId);
  if (!parseResult.success || !parseResult.input) {
    // Auto-refund reserved credits on parsing failure
    if (!isSandbox && creditCost > 0) {
      creditLedgerRepo.refundUserCredits(user.id, creditCost, routeCfg.toolKey, "Input validation error");
    }
    return parseResult.response!;
  }

  const { buffer, mimeType, responseFormat, options } = parseResult.input;

  // 10. Concurrency Queue: Protect VPS RAM from overload
  let releasePermit: (() => void) | null = null;
  try {
    releasePermit = await inferenceLimiter.acquire(15000);
  } catch (err: any) {
    if (!isSandbox && creditCost > 0) {
      creditLedgerRepo.refundUserCredits(user.id, creditCost, routeCfg.toolKey, "Inference queue timeout");
    }
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

  // 11. Prepare Engine Payload & Dispatch to 127.0.0.1
  const rawBase64 = buffer.toString("base64");

  // Validate model parameter against whitelist
  const urlObj = new URL(request.url);
  const rawModel = String(options["model"] || urlObj.searchParams.get("model") || "").toLowerCase().trim();
  const ALLOWED_MODELS = ["karudi", "ganga", "brahmaputra", "narmada", "saraswati", "isnet", "u2net", "rmbg"];
  let selectedModel = "ganga";

  if (rawModel) {
    if (ALLOWED_MODELS.includes(rawModel)) {
      selectedModel = rawModel;
    } else if (rawModel.startsWith("karudi")) {
      selectedModel = "karudi";
    } else if (rawModel.startsWith("ganga")) {
      selectedModel = "ganga";
    } else if (rawModel.startsWith("brahma")) {
      selectedModel = "brahmaputra";
    } else {
      selectedModel = "ganga";
    }
  } else if (routeCfg.toolKey === "remove-watermark") {
    selectedModel = "narmada";
  } else if (routeCfg.toolKey === "blur-face" || routeCfg.toolKey === "detect-faces") {
    selectedModel = "saraswati";
  } else if (routeCfg.toolKey.startsWith("convert-") || routeCfg.toolKey.startsWith("resize-") || routeCfg.toolKey.startsWith("crop-") || routeCfg.toolKey.startsWith("compress-")) {
    selectedModel = "brahmaputra";
  }

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

  // 12. Handle Downstream Failure -> Immediate Credit Refund
  if (!engineResult.ok || !engineResult.data?.success) {
    if (!isSandbox && creditCost > 0) {
      creditLedgerRepo.refundUserCredits(
        user.id,
        creditCost,
        routeCfg.toolKey,
        engineResult.error || "Engine inference error"
      );
    }

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
      engineResult.error || "Image processing engine error. Your credits have been automatically refunded.",
      requestId,
      rateLimitHeaders
    );
  }

  // 13. Record Successful Execution & Usage
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

  // 14. Format Response (Binary or JSON)
  const baseHeaders: Record<string, string> = {
    "X-Request-Id": requestId,
    "X-Credits-Used": String(creditCost),
    "X-Credits-Remaining": String(remainingCredits),
    "X-Model-Used": selectedModel,
    "X-Processing-Time-Ms": String(latencyMs),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
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
        requestHash: requestId,
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
        requestHash: requestId,
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
      requestHash: requestId,
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
