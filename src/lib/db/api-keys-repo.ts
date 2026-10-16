import crypto from "crypto";
import { getDb } from "./client";

export interface DbApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  key_type: "live" | "test";
  scopes: string; // JSON string e.g. '["*"]' or '["remove-bg"]'
  status: "active" | "revoked" | "suspended";
  ip_allowlist: string | null;
  rate_limit_per_minute: number;
  daily_quota: number;
  monthly_quota: number;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
}

export interface SafeApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyType: "live" | "test";
  scopes: string[];
  status: "active" | "revoked" | "suspended";
  ipAllowlist: string[] | null;
  rateLimitPerMinute: number;
  dailyQuota: number;
  monthlyQuota: number;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  totalCalls?: number;
  creditsUsed?: number;
}

export interface ApiUsageRecord {
  id: string;
  requestId: string;
  keyId: string | null;
  userId: string | null;
  endpoint: string;
  status: number;
  creditsUsed: number;
  latencyMs: number;
  ip: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}

export interface ApiKeyEvent {
  id: string;
  keyId: string | null;
  userId: string;
  action: string;
  ip: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface IdempotentResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string; // text, json, or base64
  isBase64: boolean;
}

export const MAX_ACTIVE_KEYS_PER_USER = 5;

/**
 * Hash a raw API key using SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}

/**
 * Generate a new cryptographically secure API key
 * Format: bgt_live_<32 chars> or bgt_test_<32 chars>
 */
export function generateApiKeyString(type: "live" | "test" = "live"): { rawKey: string; keyPrefix: string; keyHash: string } {
  const prefix = type === "test" ? "bgt_test_" : "bgt_live_";
  // 32 bytes of secure entropy in hex (64 chars)
  const entropy = crypto.randomBytes(32).toString("hex");
  const rawKey = `${prefix}${entropy}`;
  const keyPrefix = `${prefix}${entropy.slice(0, 8)}...`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

export const apiKeysRepo = {
  /**
   * Create a new API key for a user (Max 5 active keys enforced)
   */
  createKey(params: {
    userId: string;
    name: string;
    keyType?: "live" | "test";
    scopes?: string[];
    ipAllowlist?: string[] | null;
    rateLimitPerMinute?: number;
    dailyQuota?: number;
    monthlyQuota?: number;
    expiresAt?: string | null;
    ip?: string;
  }): { success: boolean; rawKey?: string; key?: SafeApiKey; error?: string } {
    const db = getDb();
    const type = params.keyType === "test" ? "test" : "live";
    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : ["*"];
    const ipAllowlistJson = params.ipAllowlist && params.ipAllowlist.length > 0 ? JSON.stringify(params.ipAllowlist) : null;
    const rateLimit = params.rateLimitPerMinute && params.rateLimitPerMinute > 0 ? params.rateLimitPerMinute : 60;
    const dailyQuota = params.dailyQuota && params.dailyQuota > 0 ? params.dailyQuota : 1000;
    const monthlyQuota = params.monthlyQuota && params.monthlyQuota > 0 ? params.monthlyQuota : 25000;

    const tx = db.transaction(() => {
      // Check active keys count for this user
      const countRow = db
        .prepare("SELECT COUNT(*) as active_count FROM api_keys WHERE user_id = ? AND status = 'active'")
        .get(params.userId) as { active_count: number } | undefined;

      const activeCount = countRow?.active_count || 0;
      if (activeCount >= MAX_ACTIVE_KEYS_PER_USER) {
        return {
          success: false,
          error: `Maximum active API keys limit reached (${MAX_ACTIVE_KEYS_PER_USER}). Please revoke an existing key before creating a new one.`,
        };
      }

      const { rawKey, keyPrefix, keyHash } = generateApiKeyString(type);
      const id = `apk_${crypto.randomBytes(12).toString("hex")}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO api_keys (
          id, user_id, name, key_hash, key_prefix, key_type, scopes, status,
          ip_allowlist, rate_limit_per_minute, daily_quota, monthly_quota,
          created_at, expires_at, last_used_at, last_used_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, NULL, NULL)
      `).run(
        id,
        params.userId,
        params.name.trim(),
        keyHash,
        keyPrefix,
        type,
        JSON.stringify(scopes),
        ipAllowlistJson,
        rateLimit,
        dailyQuota,
        monthlyQuota,
        now,
        params.expiresAt || null
      );

      // Audit event
      db.prepare(`
        INSERT INTO api_key_events (id, key_id, user_id, action, ip, metadata, created_at)
        VALUES (?, ?, ?, 'created', ?, ?, ?)
      `).run(
        `ake_${crypto.randomBytes(10).toString("hex")}`,
        id,
        params.userId,
        params.ip || null,
        JSON.stringify({ name: params.name, type, scopes, rateLimit }),
        now
      );

      const safeKey: SafeApiKey = {
        id,
        userId: params.userId,
        name: params.name.trim(),
        keyPrefix,
        keyType: type,
        scopes,
        status: "active",
        ipAllowlist: params.ipAllowlist || null,
        rateLimitPerMinute: rateLimit,
        dailyQuota,
        monthlyQuota,
        createdAt: now,
        expiresAt: params.expiresAt || null,
        lastUsedAt: null,
      };

      return { success: true, rawKey, key: safeKey };
    });

    return tx();
  },

  /**
   * Find an active API key by its raw string.
   * Performs timing-safe comparison.
   */
  findByRawKey(rawKey: string): DbApiKey | null {
    if (!rawKey || typeof rawKey !== "string") return null;
    const trimmed = rawKey.trim();
    if (!trimmed.startsWith("bgt_live_") && !trimmed.startsWith("bgt_test_")) {
      return null;
    }

    const targetHash = hashApiKey(trimmed);
    const db = getDb();
    const row = db.prepare("SELECT * FROM api_keys WHERE key_hash = ?").get(targetHash) as DbApiKey | undefined;

    if (!row) {
      // Execute dummy comparison to maintain constant time
      const dummy = crypto.createHash("sha256").update("dummy").digest("hex");
      try {
        crypto.timingSafeEqual(Buffer.from(targetHash, "hex"), Buffer.from(dummy, "hex"));
      } catch {}
      return null;
    }

    // Double check with timing-safe equal
    try {
      const match = crypto.timingSafeEqual(Buffer.from(targetHash, "hex"), Buffer.from(row.key_hash, "hex"));
      return match ? row : null;
    } catch {
      return null;
    }
  },

  /**
   * Update key usage metrics after request
   */
  touchKeyUsage(keyId: string, ip?: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE api_keys
      SET last_used_at = ?, last_used_ip = ?
      WHERE id = ?
    `).run(now, ip || null, keyId);
  },

  /**
   * Revoke an API key
   */
  revokeKey(keyId: string, userId: string, ip?: string): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE api_keys
      SET status = 'revoked'
      WHERE id = ? AND user_id = ?
    `).run(keyId, userId);

    if (res.changes > 0) {
      db.prepare(`
        INSERT INTO api_key_events (id, key_id, user_id, action, ip, metadata, created_at)
        VALUES (?, ?, ?, 'revoked', ?, NULL, ?)
      `).run(
        `ake_${crypto.randomBytes(10).toString("hex")}`,
        keyId,
        userId,
        ip || null,
        now
      );
      return true;
    }
    return false;
  },

  /**
   * Rotate an API key (atomically revokes existing key and generates a replacement)
   */
  rotateKey(keyId: string, userId: string, ip?: string): { success: boolean; rawKey?: string; key?: SafeApiKey; error?: string } {
    const db = getDb();
    const tx = db.transaction(() => {
      const existing = db.prepare("SELECT * FROM api_keys WHERE id = ? AND user_id = ?").get(keyId, userId) as DbApiKey | undefined;
      if (!existing) {
        return { success: false, error: "API key not found." };
      }

      const now = new Date().toISOString();
      // Revoke old key
      db.prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ?").run(keyId);

      // Audit old key rotation
      db.prepare(`
        INSERT INTO api_key_events (id, key_id, user_id, action, ip, metadata, created_at)
        VALUES (?, ?, ?, 'rotated', ?, ?, ?)
      `).run(
        `ake_${crypto.randomBytes(10).toString("hex")}`,
        keyId,
        userId,
        ip || null,
        JSON.stringify({ reason: "user_requested_rotation" }),
        now
      );

      // Create new replacement key with same properties
      const { rawKey, keyPrefix, keyHash } = generateApiKeyString(existing.key_type);
      const newId = `apk_${crypto.randomBytes(12).toString("hex")}`;

      db.prepare(`
        INSERT INTO api_keys (
          id, user_id, name, key_hash, key_prefix, key_type, scopes, status,
          ip_allowlist, rate_limit_per_minute, daily_quota, monthly_quota,
          created_at, expires_at, last_used_at, last_used_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, NULL, NULL)
      `).run(
        newId,
        userId,
        existing.name,
        keyHash,
        keyPrefix,
        existing.key_type,
        existing.scopes,
        existing.ip_allowlist,
        existing.rate_limit_per_minute,
        existing.daily_quota,
        existing.monthly_quota,
        now,
        existing.expires_at
      );

      let parsedScopes: string[] = ["*"];
      try { parsedScopes = JSON.parse(existing.scopes); } catch {}
      let parsedAllowlist: string[] | null = null;
      try { if (existing.ip_allowlist) parsedAllowlist = JSON.parse(existing.ip_allowlist); } catch {}

      const safeKey: SafeApiKey = {
        id: newId,
        userId,
        name: existing.name,
        keyPrefix,
        keyType: existing.key_type,
        scopes: parsedScopes,
        status: "active",
        ipAllowlist: parsedAllowlist,
        rateLimitPerMinute: existing.rate_limit_per_minute,
        dailyQuota: existing.daily_quota,
        monthlyQuota: existing.monthly_quota,
        createdAt: now,
        expiresAt: existing.expires_at,
        lastUsedAt: null,
      };

      return { success: true, rawKey, key: safeKey };
    });

    return tx();
  },

  /**
   * List all keys for a user with aggregated usage stats
   */
  getKeysByUser(userId: string): SafeApiKey[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT k.*,
             COUNT(u.id) as total_calls,
             COALESCE(SUM(u.credits_used), 0) as credits_used
      FROM api_keys k
      LEFT JOIN api_usage u ON u.key_id = k.id
      WHERE k.user_id = ?
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `).all(userId) as Array<DbApiKey & { total_calls: number; credits_used: number }>;

    return rows.map((r) => {
      let scopes: string[] = ["*"];
      try { scopes = JSON.parse(r.scopes); } catch {}
      let ipAllowlist: string[] | null = null;
      try { if (r.ip_allowlist) ipAllowlist = JSON.parse(r.ip_allowlist); } catch {}

      return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        keyPrefix: r.key_prefix,
        keyType: r.key_type,
        scopes,
        status: r.status,
        ipAllowlist,
        rateLimitPerMinute: r.rate_limit_per_minute,
        dailyQuota: r.daily_quota,
        monthlyQuota: r.monthly_quota,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        lastUsedAt: r.last_used_at,
        totalCalls: r.total_calls,
        creditsUsed: r.credits_used,
      };
    });
  },

  /**
   * Admin: List all keys across the platform
   */
  getAllKeys(limit = 100, offset = 0): Array<SafeApiKey & { userEmail: string; userName: string }> {
    const db = getDb();
    const rows = db.prepare(`
      SELECT k.*, u.email as user_email, u.name as user_name,
             COUNT(usg.id) as total_calls,
             COALESCE(SUM(usg.credits_used), 0) as credits_used
      FROM api_keys k
      JOIN users u ON u.id = k.user_id
      LEFT JOIN api_usage usg ON usg.key_id = k.id
      GROUP BY k.id
      ORDER BY k.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<DbApiKey & { user_email: string; user_name: string; total_calls: number; credits_used: number }>;

    return rows.map((r) => {
      let scopes: string[] = ["*"];
      try { scopes = JSON.parse(r.scopes); } catch {}
      let ipAllowlist: string[] | null = null;
      try { if (r.ip_allowlist) ipAllowlist = JSON.parse(r.ip_allowlist); } catch {}

      return {
        id: r.id,
        userId: r.user_id,
        userEmail: r.user_email,
        userName: r.user_name,
        name: r.name,
        keyPrefix: r.key_prefix,
        keyType: r.key_type,
        scopes,
        status: r.status,
        ipAllowlist,
        rateLimitPerMinute: r.rate_limit_per_minute,
        dailyQuota: r.daily_quota,
        monthlyQuota: r.monthly_quota,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        lastUsedAt: r.last_used_at,
        totalCalls: r.total_calls,
        creditsUsed: r.credits_used,
      };
    });
  },

  /**
   * Admin: Update key status (suspend, activate, revoke)
   */
  setKeyStatus(keyId: string, status: "active" | "suspended" | "revoked", adminUser = "admin"): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const key = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(keyId) as DbApiKey | undefined;
    if (!key) return false;

    db.prepare("UPDATE api_keys SET status = ? WHERE id = ?").run(status, keyId);
    db.prepare(`
      INSERT INTO api_key_events (id, key_id, user_id, action, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?)
    `).run(
      `ake_${crypto.randomBytes(10).toString("hex")}`,
      keyId,
      key.user_id,
      `admin_${status}`,
      JSON.stringify({ updatedBy: adminUser, previousStatus: key.status }),
      now
    );
    return true;
  },

  /**
   * Record API request usage
   */
  recordUsage(params: {
    requestId: string;
    keyId: string | null;
    userId: string | null;
    endpoint: string;
    status: number;
    creditsUsed: number;
    latencyMs: number;
    ip: string | null;
    idempotencyKey?: string | null | undefined;
  }): void {
    const db = getDb();
    const id = `usg_${crypto.randomBytes(12).toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO api_usage (
        id, request_id, key_id, user_id, endpoint, status, credits_used,
        latency_ms, ip, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.requestId,
      params.keyId,
      params.userId,
      params.endpoint,
      params.status,
      params.creditsUsed,
      params.latencyMs,
      params.ip || null,
      params.idempotencyKey || null,
      now
    );
  },

  /**
   * Get paginated usage for a user
   */
  getUserUsage(userId: string, limit = 50, offset = 0): { total: number; items: ApiUsageRecord[] } {
    const db = getDb();
    const countRow = db.prepare("SELECT COUNT(*) as cnt FROM api_usage WHERE user_id = ?").get(userId) as { cnt: number };
    const rows = db.prepare(`
      SELECT * FROM api_usage
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as Array<{
      id: string;
      request_id: string;
      key_id: string | null;
      user_id: string | null;
      endpoint: string;
      status: number;
      credits_used: number;
      latency_ms: number;
      ip: string | null;
      idempotency_key: string | null;
      created_at: string;
    }>;

    return {
      total: countRow?.cnt || 0,
      items: rows.map((r) => ({
        id: r.id,
        requestId: r.request_id,
        keyId: r.key_id,
        userId: r.user_id,
        endpoint: r.endpoint,
        status: r.status,
        creditsUsed: r.credits_used,
        latencyMs: r.latency_ms,
        ip: r.ip,
        idempotencyKey: r.idempotency_key,
        createdAt: r.created_at,
      })),
    };
  },

  /**
   * Get 7-day or 30-day usage analytics for a user
   */
  getUserUsageStats(userId: string, days = 30): {
    totalCalls: number;
    totalCredits: number;
    successRate: number;
    dailyBreakdown: Array<{ date: string; calls: number; credits: number; errors: number }>;
  } {
    const db = getDb();
    const sinceDate = new Date(Date.now() - days * 86400 * 1000).toISOString();

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(credits_used), 0) as total_credits,
        COALESCE(SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END), 0) as success_calls
      FROM api_usage
      WHERE user_id = ? AND created_at >= ?
    `).get(userId, sinceDate) as { total_calls: number; total_credits: number; success_calls: number };

    const dailyRows = db.prepare(`
      SELECT
        substr(created_at, 1, 10) as date,
        COUNT(*) as calls,
        COALESCE(SUM(credits_used), 0) as credits,
        COALESCE(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END), 0) as errors
      FROM api_usage
      WHERE user_id = ? AND created_at >= ?
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date ASC
    `).all(userId, sinceDate) as Array<{ date: string; calls: number; credits: number; errors: number }>;

    const totalCalls = summary?.total_calls || 0;
    const successCalls = summary?.success_calls || 0;
    const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100;

    return {
      totalCalls,
      totalCredits: summary?.total_credits || 0,
      successRate,
      dailyBreakdown: dailyRows,
    };
  },

  /**
   * Check daily and monthly quota for a specific key
   */
  checkQuotas(key: DbApiKey): { allowed: boolean; remainingDaily: number; remainingMonthly: number; error?: string } {
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = new Date().toISOString().slice(0, 7);

    const todayUsage = db.prepare(`
      SELECT COUNT(*) as count FROM api_usage
      WHERE key_id = ? AND created_at >= ? AND status < 400
    `).get(key.id, `${todayStr}T00:00:00.000Z`) as { count: number };

    const monthUsage = db.prepare(`
      SELECT COUNT(*) as count FROM api_usage
      WHERE key_id = ? AND created_at >= ? AND status < 400
    `).get(key.id, `${monthStr}-01T00:00:00.000Z`) as { count: number };

    const usedToday = todayUsage?.count || 0;
    const usedMonth = monthUsage?.count || 0;

    if (key.daily_quota > 0 && usedToday >= key.daily_quota) {
      return {
        allowed: false,
        remainingDaily: 0,
        remainingMonthly: Math.max(0, key.monthly_quota - usedMonth),
        error: `Daily API key quota of ${key.daily_quota} requests exceeded.`,
      };
    }

    if (key.monthly_quota > 0 && usedMonth >= key.monthly_quota) {
      return {
        allowed: false,
        remainingDaily: Math.max(0, key.daily_quota - usedToday),
        remainingMonthly: 0,
        error: `Monthly API key quota of ${key.monthly_quota} requests exceeded.`,
      };
    }

    return {
      allowed: true,
      remainingDaily: Math.max(0, key.daily_quota - usedToday),
      remainingMonthly: Math.max(0, key.monthly_quota - usedMonth),
    };
  },

  /**
   * Idempotency storage: retrieve cached response if valid
   */
  getIdempotentResponse(keyHash: string, idempotencyKey: string): IdempotentResponse | null {
    const db = getDb();
    const now = new Date().toISOString();
    const row = db.prepare(`
      SELECT * FROM api_idempotency
      WHERE key_hash = ? AND idempotency_key = ? AND expires_at > ?
    `).get(keyHash, idempotencyKey, now) as {
      response_status: number;
      response_headers: string;
      response_body: string;
      response_is_base64: number;
    } | undefined;

    if (!row) return null;

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(row.response_headers);
    } catch {}

    return {
      statusCode: row.response_status,
      headers,
      body: row.response_body,
      isBase64: row.response_is_base64 === 1,
    };
  },

  /**
   * Idempotency storage: save response for 24 hours
   */
  saveIdempotentResponse(params: {
    keyHash: string;
    idempotencyKey: string;
    requestHash: string;
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    isBase64?: boolean;
    ttlSeconds?: number;
  }): void {
    const db = getDb();
    const now = new Date();
    const ttl = params.ttlSeconds || 86400; // 24 hours default
    const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();
    const nowStr = now.toISOString();

    db.prepare(`
      INSERT INTO api_idempotency (
        idempotency_key, key_hash, request_hash, response_status, response_headers,
        response_body, response_is_base64, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key_hash, idempotency_key) DO UPDATE SET
        response_status = excluded.response_status,
        response_headers = excluded.response_headers,
        response_body = excluded.response_body,
        response_is_base64 = excluded.response_is_base64,
        expires_at = excluded.expires_at
    `).run(
      params.idempotencyKey,
      params.keyHash,
      params.requestHash,
      params.statusCode,
      JSON.stringify(params.headers),
      params.body,
      params.isBase64 ? 1 : 0,
      nowStr,
      expiresAt
    );
  },

  /**
   * Global Kill-Switch & Diagnostics
   */
  isGlobalApiEnabled(): boolean {
    const db = getDb();
    const row = db.prepare("SELECT value FROM config WHERE key = 'api_global_enabled'").get() as { value: string } | undefined;
    if (!row) return true; // Enabled by default
    try {
      return JSON.parse(row.value) !== false;
    } catch {
      return row.value !== "false";
    }
  },

  setGlobalApiEnabled(enabled: boolean): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO config (key, value, updated_at)
      VALUES ('api_global_enabled', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(JSON.stringify(enabled), now);
  },

  /**
   * Admin overview metrics
   */
  getAdminStats(): {
    totalKeys: number;
    activeKeys: number;
    totalCallsToday: number;
    totalCreditsToday: number;
    errorRateToday: number;
    globalEnabled: boolean;
  } {
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);

    const keysStats = db.prepare(`
      SELECT
        COUNT(*) as total_keys,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_keys
      FROM api_keys
    `).get() as { total_keys: number; active_keys: number };

    const todayUsage = db.prepare(`
      SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(credits_used), 0) as total_credits,
        COALESCE(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END), 0) as error_calls
      FROM api_usage
      WHERE created_at >= ?
    `).get(`${todayStr}T00:00:00.000Z`) as { total_calls: number; total_credits: number; error_calls: number };

    const totalCalls = todayUsage?.total_calls || 0;
    const errorCalls = todayUsage?.error_calls || 0;
    const errorRate = totalCalls > 0 ? Math.round((errorCalls / totalCalls) * 100) : 0;

    return {
      totalKeys: keysStats?.total_keys || 0,
      activeKeys: keysStats?.active_keys || 0,
      totalCallsToday: totalCalls,
      totalCreditsToday: todayUsage?.total_credits || 0,
      errorRateToday: errorRate,
      globalEnabled: this.isGlobalApiEnabled(),
    };
  },

  /**
   * Admin: get audit log
   */
  getAuditLog(limit = 100): ApiKeyEvent[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM api_key_events
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: string;
      key_id: string | null;
      user_id: string;
      action: string;
      ip: string | null;
      metadata: string | null;
      created_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      keyId: r.key_id,
      userId: r.user_id,
      action: r.action,
      ip: r.ip,
      metadata: r.metadata,
      createdAt: r.created_at,
    }));
  },
};
