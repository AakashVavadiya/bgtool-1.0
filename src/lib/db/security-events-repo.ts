import crypto from "crypto";
import { getDb } from "./client";

export interface DbSecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  email: string | null;
  ip: string | null;
  metadata: string | null;
  created_at: string;
}

export const securityEventsRepo = {
  logEvent(params: {
    eventType: string;
    userId?: string | null;
    email?: string | null;
    ip?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    try {
      const db = getDb();
      const id = `sec_${crypto.randomBytes(10).toString("hex")}`;
      const now = new Date().toISOString();
      const metaJson = params.metadata ? JSON.stringify(params.metadata) : null;

      db.prepare(`
        INSERT INTO security_events (id, event_type, user_id, email, ip, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.eventType,
        params.userId || null,
        params.email ? params.email.trim().toLowerCase() : null,
        params.ip || null,
        metaJson,
        now
      );
    } catch (err) {
      console.error("[Security Event Log Error]", err);
    }
  },

  getRecentEvents(limit = 100): DbSecurityEvent[] {
    const db = getDb();
    return db
      .prepare("SELECT * FROM security_events ORDER BY created_at DESC LIMIT ?")
      .all(limit) as DbSecurityEvent[];
  },

  cleanupOlderThanDays(days = 90): number {
    const db = getDb();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const res = db.prepare("DELETE FROM security_events WHERE created_at < ?").run(cutoff);
    return res.changes;
  },
};
