import { rateLimitsRepo } from "../db";

export interface RateLimitOptions {
  windowMs: number; // e.g. 60_000 for 1 minute
  maxRequests: number; // e.g. 60
  name: string;
}

interface ClientRecord {
  timestamps: number[];
}

export class MemoryRateLimiter {
  private records = new Map<string, ClientRecord>();
  private options: RateLimitOptions;
  private lastCleanup = Date.now();

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  public check(ip: string): {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
    retryAfter: number;
    total: number;
  } {
    // Attempt SQLite cluster-wide rate limiting first so PM2 workers share limits
    try {
      const windowSeconds = Math.max(1, Math.ceil(this.options.windowMs / 1000));
      const key = `${this.options.name}:${ip}`;
      const res = rateLimitsRepo.increment(key, this.options.maxRequests, windowSeconds);
      const now = Math.floor(Date.now() / 1000);
      const retryAfter = Math.max(1, res.resetAt - now);

      return {
        allowed: res.allowed,
        remaining: res.remaining,
        resetSeconds: retryAfter,
        retryAfter: res.allowed ? 0 : retryAfter,
        total: this.options.maxRequests,
      };
    } catch {
      return this.checkMemoryFallback(ip);
    }
  }

  private checkMemoryFallback(ip: string): {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
    retryAfter: number;
    total: number;
  } {
    const now = Date.now();
    this.maybeCleanup(now);

    let client = this.records.get(ip);
    if (!client) {
      client = { timestamps: [] };
      this.records.set(ip, client);
    }

    const windowStart = now - this.options.windowMs;
    // Keep only timestamps within current window
    client.timestamps = client.timestamps.filter((ts) => ts > windowStart);

    if (client.timestamps.length >= this.options.maxRequests) {
      const oldest = client.timestamps[0] || now;
      const retryAfter = Math.max(1, Math.ceil((oldest + this.options.windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: retryAfter,
        retryAfter,
        total: this.options.maxRequests,
      };
    }

    client.timestamps.push(now);
    const remaining = this.options.maxRequests - client.timestamps.length;
    const resetSeconds = Math.ceil(this.options.windowMs / 1000);

    return {
      allowed: true,
      remaining,
      resetSeconds,
      retryAfter: 0,
      total: this.options.maxRequests,
    };
  }

  private maybeCleanup(now: number) {
    if (now - this.lastCleanup > 120_000) {
      // Clean stale IPs every 2 minutes
      this.lastCleanup = now;
      const windowStart = now - this.options.windowMs;
      for (const [ip, client] of this.records.entries()) {
        client.timestamps = client.timestamps.filter((ts) => ts > windowStart);
        if (client.timestamps.length === 0) {
          this.records.delete(ip);
        }
      }
    }
  }

  public reset(ip?: string) {
    try {
      if (ip) {
        rateLimitsRepo.reset(`${this.options.name}:${ip}`);
      } else {
        rateLimitsRepo.reset(this.options.name);
      }
    } catch {}

    if (ip) {
      this.records.delete(ip);
    } else {
      this.records.clear();
    }
  }
}

// Configurable limiters
export const generalLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: parseInt(process.env["RATE_LIMIT_GENERAL"] || "60", 10),
  name: "general",
});

export const uploadLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: parseInt(process.env["RATE_LIMIT_UPLOADS"] || "15", 10),
  name: "uploads",
});

export const expensiveInferenceLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: parseInt(process.env["RATE_LIMIT_EXPENSIVE"] || "6", 10),
  name: "inference",
});

export const contactLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: parseInt(process.env["RATE_LIMIT_CONTACT"] || "5", 10),
  name: "contact",
});

/**
 * Safely extracts client IP address from standard headers only when TRUST_PROXY is enabled.
 */
export function extractClientIp(request: Request): string {
  const trustProxy = process.env["TRUST_PROXY"] === "true" || process.env["TRUST_PROXY"] === "1";

  if (trustProxy) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      // Leftmost address is the client IP added by the outermost proxy
      const ips = forwardedFor.split(",").map((s) => s.trim());
      if (ips[0] && ips[0].length > 0) {
        return ips[0];
      }
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp && realIp.trim().length > 0) {
      return realIp.trim();
    }

    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
      return cfConnectingIp.trim();
    }
  }

  return "127.0.0.1";
}

/**
 * Builds standard 429 response with Retry-After and rate limit headers.
 */
export function createRateLimitResponse(retryAfter: number, customMessage?: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error:
        customMessage ||
        `Rate limit exceeded. Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} before trying again.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(retryAfter),
      },
    }
  );
}
