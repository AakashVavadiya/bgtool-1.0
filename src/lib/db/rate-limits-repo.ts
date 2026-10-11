import { getDb } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalHits: number;
}

export const rateLimitsRepo = {
  /**
   * Atomic check and increment for a rate limit bucket in SQLite.
   * Shared safely across all PM2 cluster workers.
   */
  increment(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const newResetAt = now + windowSeconds;

    const rateTx = db.transaction(() => {
      const existing = db
        .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?")
        .get(key) as { count: number; reset_at: number } | undefined;

      if (!existing || existing.reset_at <= now) {
        // Expired or brand new window
        db.prepare(`
          INSERT INTO rate_limits (key, count, reset_at)
          VALUES (?, 1, ?)
          ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at
        `).run(key, newResetAt);

        return {
          allowed: true,
          remaining: limit - 1,
          resetAt: newResetAt,
          totalHits: 1,
        };
      }

      // Existing active window
      const newCount = existing.count + 1;
      db.prepare("UPDATE rate_limits SET count = ? WHERE key = ?").run(newCount, key);

      const allowed = newCount <= limit;
      const remaining = Math.max(0, limit - newCount);

      return {
        allowed,
        remaining,
        resetAt: existing.reset_at,
        totalHits: newCount,
      };
    });

    return rateTx();
  },

  cleanupExpired(): void {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const runTx = db.transaction(() => {
      db.prepare("DELETE FROM rate_limits WHERE reset_at <= ?").run(now);
    });
    runTx();
  },
};
