import crypto from "crypto";
import { getDb } from "./client";
import { DbUser } from "./users-repo";

export interface DbSession {
  id: string;
  token_hash: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  ip: string | null;
  user_agent: string | null;
}

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const sessionsRepo = {
  createSession(
    userId: string,
    token: string,
    ip?: string,
    userAgent?: string
  ): { session: DbSession; rawToken: string } {
    const db = getDb();
    const tokenHash = hashSessionToken(token);
    const id = `sess_${crypto.randomBytes(12).toString("hex")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

    const insert = db.prepare(`
      INSERT INTO sessions (id, token_hash, user_id, created_at, expires_at, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const session: DbSession = {
      id,
      token_hash: tokenHash,
      user_id: userId,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      ip: ip || null,
      user_agent: userAgent || null,
    };

    const runTx = db.transaction(() => {
      insert.run(
        session.id,
        session.token_hash,
        session.user_id,
        session.created_at,
        session.expires_at,
        session.ip,
        session.user_agent
      );
    });

    runTx();
    return { session, rawToken: token };
  },

  findSessionByToken(token: string): { session: DbSession; user: DbUser } | null {
    if (!token) return null;
    const db = getDb();
    const tokenHash = hashSessionToken(token);
    const now = new Date().toISOString();

    const row = db
      .prepare(`
        SELECT 
          s.id as s_id, s.token_hash, s.user_id, s.created_at as s_created_at,
          s.expires_at, s.ip as s_ip, s.user_agent,
          u.*
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token_hash = ? AND s.expires_at > ?
      `)
      .get(tokenHash, now) as any;

    if (!row) return null;

    const session: DbSession = {
      id: row.s_id,
      token_hash: row.token_hash,
      user_id: row.user_id,
      created_at: row.s_created_at,
      expires_at: row.expires_at,
      ip: row.s_ip,
      user_agent: row.user_agent,
    };

    const user: DbUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      plan: row.plan,
      credits: row.credits,
      free_credits: row.free_credits,
      paid_credits: row.paid_credits,
      total_processed: row.total_processed,
      status: row.status,
      registered_at: row.registered_at,
      last_active: row.last_active,
      last_credit_reset: row.last_credit_reset,
    };

    return { session, user };
  },

  deleteSession(token: string): void {
    if (!token) return;
    const db = getDb();
    const tokenHash = hashSessionToken(token);
    const runTx = db.transaction(() => {
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    });
    runTx();
  },

  deleteAllUserSessions(userId: string): void {
    const db = getDb();
    const runTx = db.transaction(() => {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    });
    runTx();
  },

  cleanupExpired(): number {
    const db = getDb();
    const now = new Date().toISOString();
    let changes = 0;
    const runTx = db.transaction(() => {
      const info = db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
      changes = info.changes;
    });
    runTx();
    return changes;
  },
};
