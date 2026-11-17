import crypto from "crypto";
import { apiKeysRepo, DbApiKey } from "../db/api-keys-repo";
import { usersRepo, DbUser } from "../db/users-repo";
import { extractClientIp } from "../security/rate-limiter";
import { rateLimitsRepo } from "../db/rate-limits-repo";

export interface ApiAuthContext {
  key: DbApiKey;
  user: DbUser;
  isSandbox: boolean;
  requestId: string;
  clientIp: string;
  idempotencyKey?: string | null;
  rateLimitHeaders: Record<string, string>;
}

export interface ApiGuardCheckResult {
  authorized: boolean;
  response?: Response;
  context?: ApiAuthContext;
}

// In-memory lockout tracker for repeated invalid API key attempts per IP
class ApiKeyLockoutTracker {
  private failedAttempts = new Map<string, { count: number; lockedUntil: number; lastAttempt: number }>();

  public isLocked(ip: string): { locked: boolean; remainingSeconds: number } {
    const entry = this.failedAttempts.get(ip);
    if (!entry) return { locked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (entry.lockedUntil > now) {
      return { locked: true, remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      this.failedAttempts.delete(ip);
    }
    return { locked: false, remainingSeconds: 0 };
  }

  public recordFailure(ip: string): { locked: boolean; retryAfter: number } {
    const now = Date.now();
    const entry = this.failedAttempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: now };
    entry.lastAttempt = now;
    entry.count += 1;

    // 10 failed invalid key attempts from an IP -> 10-minute block
    if (entry.count >= 10) {
      entry.lockedUntil = now + 10 * 60 * 1000;
      this.failedAttempts.set(ip, entry);
      return { locked: true, retryAfter: 600 };
    }

    this.failedAttempts.set(ip, entry);
    return { locked: false, retryAfter: 0 };
  }

  public reset(ip: string): void {
    this.failedAttempts.delete(ip);
  }
}

export const apiKeyLockout = new ApiKeyLockoutTracker();

/**
 * Creates a standardized public API error response.
 * Never leaks stack traces, paths, or internals.
 */
export function createApiErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": requestId,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });

  const payload = {
    error: {
      code,
      message,
      request_id: requestId,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers,
  });
}

/**
 * Validates whether an incoming IP matches an allowlist of IPs or CIDRs.
 */
function isIpAllowed(clientIp: string, allowlist: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  const ip = clientIp.trim();

  for (const item of allowlist) {
    const cleanItem = item.trim();
    if (cleanItem === ip) return true;
    // Subnet CIDR match (e.g. 192.168.1.0/24)
    if (cleanItem.includes("/")) {
      const [subnet, prefixLenStr] = cleanItem.split("/");
      const prefixLen = parseInt(prefixLenStr || "32", 10);
      if (subnet && !isNaN(prefixLen)) {
        // Quick IPv4 bitwise check
        const ipParts = ip.split(".").map(Number);
        const subParts = subnet.split(".").map(Number);
        if (ipParts.length === 4 && subParts.length === 4) {
          const ipNum = ((ipParts[0]! << 24) | (ipParts[1]! << 16) | (ipParts[2]! << 8) | ipParts[3]!) >>> 0;
          const subNum = ((subParts[0]! << 24) | (subParts[1]! << 16) | (subParts[2]! << 8) | subParts[3]!) >>> 0;
          const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
          if ((ipNum & mask) === (subNum & mask)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Enforces authentication, quotas, rate limiting, and permissions for /api/v1/* requests.
 */
export async function authenticateApiV1Request(
  request: Request,
  requiredScope?: string
): Promise<ApiGuardCheckResult> {
  const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
  const clientIp = extractClientIp(request);
  const url = new URL(request.url);

  // 1. Strict Query Parameter Check: NEVER permit API keys in query strings
  const queryKey = url.searchParams.get("api_key") || url.searchParams.get("key") || url.searchParams.get("token");
  if (queryKey) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        400,
        "api_key_in_query",
        "API keys must never be transmitted in query parameters. Pass your API key via the 'Authorization: Bearer <key>' or 'X-API-Key' header.",
        requestId
      ),
    };
  }

  // 2. Global API Gateway Kill-Switch
  if (!apiKeysRepo.isGlobalApiEnabled()) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        503,
        "api_temporarily_disabled",
        "The public API gateway is temporarily undergoing scheduled maintenance. Please check https://bg.tools for updates.",
        requestId,
        { "Retry-After": "60" }
      ),
    };
  }

  // 3. IP Lockout Check (prevents brute-forcing or probing invalid keys)
  const lockoutStatus = apiKeyLockout.isLocked(clientIp);
  if (lockoutStatus.locked) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        429,
        "ip_rate_limited",
        "Too many invalid API key attempts from this IP address. Account security lockout active.",
        requestId,
        { "Retry-After": String(lockoutStatus.remainingSeconds) }
      ),
    };
  }

  // 4. Extract API Key Header
  const authHeader = request.headers.get("authorization") || "";
  let rawKey = "";

  if (authHeader.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7).trim();
  } else {
    rawKey = (request.headers.get("x-api-key") || "").trim();
  }

  if (!rawKey) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        401,
        "unauthorized",
        "Missing API key. Provide your API key in the 'Authorization: Bearer <key>' or 'X-API-Key' request header.",
        requestId,
        { "WWW-Authenticate": "Bearer realm=\"bg.tools public API\"" }
      ),
    };
  }

  // 5. Constant-time Key Lookup
  const keyRecord = apiKeysRepo.findByRawKey(rawKey);

  // Timing-safe failure handling: invalid or revoked keys return identical response
  if (!keyRecord || keyRecord.status === "revoked") {
    const lockCheck = apiKeyLockout.recordFailure(clientIp);
    const extraHeaders: Record<string, string> = { "WWW-Authenticate": "Bearer error=\"invalid_token\"" };
    if (lockCheck.locked) {
      extraHeaders["Retry-After"] = String(lockCheck.retryAfter);
    }

    return {
      authorized: false,
      response: createApiErrorResponse(
        401,
        "invalid_api_key",
        "The provided API key is invalid, revoked, or does not exist.",
        requestId,
        extraHeaders
      ),
    };
  }

  // Successful key match: reset IP failure count
  apiKeyLockout.reset(clientIp);

  // 6. Check Expiration
  if (keyRecord.expires_at) {
    const expiresDate = new Date(keyRecord.expires_at);
    if (!isNaN(expiresDate.getTime()) && expiresDate.getTime() < Date.now()) {
      return {
        authorized: false,
        response: createApiErrorResponse(
          401,
          "api_key_expired",
          "This API key has expired. Please generate a new key from your dashboard at https://bg.tools/account.",
          requestId
        ),
      };
    }
  }

  // 7. Check Suspension
  if (keyRecord.status === "suspended") {
    return {
      authorized: false,
      response: createApiErrorResponse(
        403,
        "api_key_suspended",
        "This API key has been suspended by administration. Contact support@bg.tools for assistance.",
        requestId
      ),
    };
  }

  // 8. Verify Associated User Account
  const user = usersRepo.findById(keyRecord.user_id);
  if (!user) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        401,
        "invalid_account",
        "The user account associated with this API key no longer exists.",
        requestId
      ),
    };
  }

  if (user.status === "banned") {
    return {
      authorized: false,
      response: createApiErrorResponse(
        403,
        "account_suspended",
        "The user account associated with this API key has been permanently suspended.",
        requestId
      ),
    };
  }

  if (user.status === "restricted") {
    return {
      authorized: false,
      response: createApiErrorResponse(
        403,
        "account_restricted",
        "The user account associated with this API key is temporarily restricted.",
        requestId
      ),
    };
  }

  // 9. IP Allowlist Check
  if (keyRecord.ip_allowlist) {
    let allowedIps: string[] = [];
    try {
      allowedIps = JSON.parse(keyRecord.ip_allowlist);
    } catch {}

    if (allowedIps.length > 0 && !isIpAllowed(clientIp, allowedIps)) {
      return {
        authorized: false,
        response: createApiErrorResponse(
          403,
          "ip_not_allowed",
          `Client IP address (${clientIp}) is not permitted by this API key's IP allowlist.`,
          requestId
        ),
      };
    }
  }

  // 10. Scope Permission Check
  if (requiredScope) {
    let scopes: string[] = ["*"];
    try {
      scopes = JSON.parse(keyRecord.scopes);
    } catch {}

    const hasPermission =
      scopes.includes("*") ||
      scopes.includes(requiredScope) ||
      (requiredScope === "remove-background" && scopes.includes("remove-bg")) ||
      (requiredScope === "remove-bg" && scopes.includes("remove-background"));

    if (!hasPermission) {
      return {
        authorized: false,
        response: createApiErrorResponse(
          403,
          "insufficient_scope",
          `This API key does not have the required permission scope ('${requiredScope}') for this endpoint.`,
          requestId
        ),
      };
    }
  }

  // 11. Rate Limiting (Per-Key & Per-IP via SQLite / Cluster)
  const keyLimit = keyRecord.rate_limit_per_minute || 60;
  const rateLimitKey = `api_key:${keyRecord.id}`;
  const rateCheck = rateLimitsRepo.increment(rateLimitKey, keyLimit, 60);

  const nowSec = Math.floor(Date.now() / 1000);
  const resetAfter = Math.max(1, rateCheck.resetAt - nowSec);

  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(keyLimit),
    "X-RateLimit-Remaining": String(rateCheck.remaining),
    "X-RateLimit-Reset": String(rateCheck.resetAt),
  };

  if (!rateCheck.allowed) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        429,
        "rate_limit_exceeded",
        `API key rate limit of ${keyLimit} requests per minute exceeded. Please throttle your client requests.`,
        requestId,
        {
          ...rateLimitHeaders,
          "Retry-After": String(resetAfter),
        }
      ),
    };
  }

  // 12. Daily & Monthly Quota Check
  const quotaCheck = apiKeysRepo.checkQuotas(keyRecord);
  if (!quotaCheck.allowed) {
    return {
      authorized: false,
      response: createApiErrorResponse(
        429,
        "quota_exceeded",
        quotaCheck.error || "API key usage quota exceeded.",
        requestId,
        {
          ...rateLimitHeaders,
          "Retry-After": "3600",
        }
      ),
    };
  }

  // 13. Check Idempotency-Key if provided
  const idempotencyHeader = request.headers.get("idempotency-key");
  let idempotencyKey: string | null = null;
  if (idempotencyHeader) {
    idempotencyKey = idempotencyHeader.trim().slice(0, 128);

    // Look for previous cached response
    const cached = apiKeysRepo.getIdempotentResponse(keyRecord.key_hash, idempotencyKey);
    if (cached) {
      const respHeaders = new Headers(cached.headers);
      respHeaders.set("X-Idempotent-Replay", "true");
      respHeaders.set("X-Request-Id", requestId);

      const bodyBuffer = cached.isBase64 ? Buffer.from(cached.body, "base64") : cached.body;
      return {
        authorized: false, // short-circuit directly with the cached replay!
        response: new Response(bodyBuffer, {
          status: cached.statusCode,
          headers: respHeaders,
        }),
      };
    }
  }

  // Success: Update last used metadata asynchronously
  apiKeysRepo.touchKeyUsage(keyRecord.id, clientIp);

  return {
    authorized: true,
    context: {
      key: keyRecord,
      user,
      isSandbox: keyRecord.key_type === "test",
      requestId,
      clientIp,
      idempotencyKey,
      rateLimitHeaders,
    },
  };
}
