import crypto from "crypto";
import { getDb } from "./client";

export interface DbPasswordReset {
  id: string;
  user_id: string;
  email: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
  ip: string | null;
}

export interface VerifyResetResult {
  success: boolean;
  error?: string;
  resetRecord?: DbPasswordReset;
}

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const passwordResetRepo = {
  /**
   * Generates a 32-byte crypto random token and stores its SHA-256 hash
   */
  createResetToken(params: {
    userId: string;
    email: string;
    ip?: string | null;
  }): { record: DbPasswordReset; rawToken: string } {
    const db = getDb();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);

    const id = `pwd_${crypto.randomBytes(12).toString("hex")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESET_TTL_MS).toISOString();
    const cleanEmail = params.email.trim().toLowerCase();

    const record: DbPasswordReset = {
      id,
      user_id: params.userId,
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
      consumed_at: null,
      created_at: now.toISOString(),
      ip: params.ip || null,
    };

    const runTx = db.transaction(() => {
      // Invalidate any older unconsumed reset tokens for this user
      db.prepare(`
        UPDATE password_resets
        SET consumed_at = ?
        WHERE user_id = ? AND consumed_at IS NULL
      `).run(now.toISOString(), params.userId);

      db.prepare(`
        INSERT INTO password_resets (
          id, user_id, email, token_hash, expires_at, consumed_at, created_at, ip
        ) VALUES (
          @id, @user_id, @email, @token_hash, @expires_at, @consumed_at, @created_at, @ip
        )
      `).run(record);
    });

    runTx();
    return { record, rawToken };
  },

  /**
   * Atomically verifies and consumes the reset token
   */
  verifyAndConsumeToken(rawToken: string): VerifyResetResult {
    const db = getDb();
    const tokenHash = hashResetToken(rawToken.trim());
    const now = new Date().toISOString();

    const verifyTx = db.transaction((): VerifyResetResult => {
      const record = db
        .prepare(`
          SELECT * FROM password_resets
          WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?
          LIMIT 1
        `)
        .get(tokenHash, now) as DbPasswordReset | undefined;

      if (!record) {
        return {
          success: false,
          error: "Password reset token is invalid or has expired. Please request a new link.",
        };
      }

      // Mark consumed atomically
      db.prepare("UPDATE password_resets SET consumed_at = ? WHERE id = ?").run(now, record.id);

      return {
        success: true,
        resetRecord: { ...record, consumed_at: now },
      };
    });

    return verifyTx();
  },

  /**
   * Cleanup expired reset records
   */
  cleanupExpired(): number {
    const db = getDb();
    const now = new Date().toISOString();
    let count = 0;
    const runTx = db.transaction(() => {
      const res = db.prepare("DELETE FROM password_resets WHERE expires_at < ?").run(now);
      count = res.changes;
    });
    runTx();
    return count;
  },
};
