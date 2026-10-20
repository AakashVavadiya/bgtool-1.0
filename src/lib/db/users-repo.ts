import { getDb } from "./client";
import { SafeUser } from "../security/auth-admin";
import crypto from "crypto";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  plan: "free" | "lite" | "pro" | "enterprise";
  credits: number;
  free_credits: number;
  paid_credits: number;
  total_processed: number;
  status: "active" | "restricted" | "banned";
  email_verified: number;
  verified_at: string | null;
  registered_at: string;
  last_active: string;
  last_credit_reset: string;
  phone?: string | null;
  country_code?: string | null;
  country?: string | null;
  avatar?: string | null;
}

export function toSafeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    credits: user.credits,
    freeCredits: user.free_credits,
    paidCredits: user.paid_credits,
    totalProcessed: user.total_processed,
    status: user.status,
    emailVerified: user.email_verified === 1,
    verifiedAt: user.verified_at,
    registeredAt: user.registered_at,
    lastActive: user.last_active,
    lastCreditReset: user.last_credit_reset,
    phone: user.phone || null,
    countryCode: user.country_code || null,
    country: user.country || null,
    location: user.country || undefined,
    avatar: user.avatar || null,
  };
}

export const usersRepo = {
  findById(id: string): DbUser | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined;
    return row ?? null;
  },

  findByEmail(email: string): DbUser | null {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const row = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as DbUser | undefined;
    return row ?? null;
  },

  findByPhone(phone: string): DbUser | null {
    const db = getDb();
    // Normalize phone (strip spaces, hyphens, parentheses)
    const clean = phone.replace(/[\s\-()]/g, "").trim();
    if (!clean) return null;
    const row = db.prepare("SELECT * FROM users WHERE phone = ? OR phone LIKE ?").get(clean, `%${clean}`) as DbUser | undefined;
    return row ?? null;
  },

  findByEmailOrPhone(identifier: string): DbUser | null {
    if (!identifier) return null;
    const clean = identifier.trim();
    if (clean.includes("@")) {
      return this.findByEmail(clean);
    }
    // Try phone lookup first, then fallback to email
    const byPhone = this.findByPhone(clean);
    if (byPhone) return byPhone;
    return this.findByEmail(clean);
  },

  getAllSafe(): SafeUser[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        u.*,
        s.ip as session_ip
      FROM users u
      LEFT JOIN (
        SELECT user_id, ip, MAX(created_at)
        FROM sessions
        GROUP BY user_id
      ) s ON u.id = s.user_id
      ORDER BY u.registered_at DESC
    `).all() as (DbUser & { session_ip?: string | null })[];

    return rows.map((row) => {
      const safe = toSafeUser(row);
      const ip = row.session_ip || "127.0.0.1";
      safe.ip = ip;
      if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        safe.location = "Localhost / India";
      } else {
        safe.location = "India";
      }
      return safe;
    });
  },

  create(user: {
    id?: string;
    name: string;
    email: string;
    passwordHash: string;
    plan?: "free" | "lite" | "pro" | "enterprise";
    credits?: number;
    freeCredits?: number;
    paidCredits?: number;
    status?: "active" | "restricted" | "banned";
    emailVerified?: boolean;
    phone?: string | null;
    countryCode?: string | null;
    country?: string | null;
  }): DbUser {
    const db = getDb();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const id = user.id || `usr_${crypto.randomBytes(8).toString("hex")}`;
    const cleanEmail = user.email.trim().toLowerCase();
    const emailVerified = user.emailVerified ? 1 : 0;
    const verifiedAt = user.emailVerified ? now : null;

    const insert = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, plan, credits, free_credits, paid_credits,
        total_processed, status, email_verified, verified_at, registered_at, last_active, last_credit_reset,
        phone, country_code, country
      ) VALUES (
        @id, @name, @email, @password_hash, @plan, @credits, @free_credits, @paid_credits,
        @total_processed, @status, @email_verified, @verified_at, @registered_at, @last_active, @last_credit_reset,
        @phone, @country_code, @country
      )
    `);

    const paidCredits = user.paidCredits ?? 0;
    const freeCredits = user.freeCredits ?? (user.credits !== undefined ? Math.max(0, user.credits - paidCredits) : 10);
    const totalCredits = user.credits ?? (freeCredits + paidCredits);

    const newRecord: DbUser = {
      id,
      name: user.name.trim(),
      email: cleanEmail,
      password_hash: user.passwordHash,
      plan: user.plan || "free",
      credits: totalCredits,
      free_credits: freeCredits,
      paid_credits: paidCredits,
      total_processed: 0,
      status: user.status || "active",
      email_verified: emailVerified,
      verified_at: verifiedAt,
      registered_at: now,
      last_active: now,
      last_credit_reset: today,
      phone: user.phone || null,
      country_code: user.countryCode || null,
      country: user.country || null,
    };

    const runTx = db.transaction(() => {
      insert.run(newRecord);
    });

    runTx();
    return newRecord;
  },

  updateLastActive(userId: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET last_active = ? WHERE id = ?").run(now, userId);
    });
    runTx();
  },

  resetDailyCreditsIfNeeded(userId: string): DbUser | null {
    const db = getDb();
    const user = this.findById(userId);
    if (!user) return null;

    const today = new Date().toISOString().slice(0, 10);
    if (user.last_credit_reset === today) {
      return user;
    }

    const newFreeCredits = 10;
    const paidCredits = user.paid_credits || 0;
    const totalCredits = Math.round((newFreeCredits + paidCredits) * 100) / 100;

    const runTx = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET free_credits = ?, credits = ?, last_credit_reset = ?
        WHERE id = ?
      `).run(newFreeCredits, totalCredits, today, userId);
    });

    runTx();
    return this.findById(userId);
  },

  updatePlan(userId: string, plan: "free" | "lite" | "pro" | "enterprise", extraCredits = 0): void {
    const db = getDb();
    const runTx = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET plan = ?, paid_credits = paid_credits + ?, credits = credits + ?
        WHERE id = ?
      `).run(plan, extraCredits, extraCredits, userId);
    });
    runTx();
  },

  updateStatus(userId: string, status: "active" | "restricted" | "banned"): void {
    const db = getDb();
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
    });
    runTx();
  },

  batchSave(users: SafeUser[]): void {
    const db = getDb();
    const updateStmt = db.prepare(`
      UPDATE users
      SET name = @name, plan = @plan, credits = @credits,
          status = @status, free_credits = @freeCredits, paid_credits = @paidCredits
      WHERE id = @id
    `);

    const runTx = db.transaction(() => {
      for (const u of users) {
        updateStmt.run({
          id: u.id,
          name: u.name,
          plan: u.plan,
          credits: u.credits,
          status: u.status,
          freeCredits: u.freeCredits ?? 10,
          paidCredits: u.paidCredits ?? 0,
        });
      }
    });
    runTx();
  },

  markEmailVerified(userId: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET email_verified = 1, verified_at = ? WHERE id = ?").run(now, userId);
    });
    runTx();
  },

  updatePassword(userId: string, newPasswordHash: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET password_hash = ?, last_active = ? WHERE id = ?").run(newPasswordHash, now, userId);
    });
    runTx();
  },

  updateName(userId: string, name: string): void {
    const db = getDb();
    const cleanName = name.trim().slice(0, 100);
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(cleanName, userId);
    });
    runTx();
  },

  updateAvatar(userId: string, avatar: string | null): void {
    const db = getDb();
    const cleanAvatar = avatar ? avatar.trim().slice(0, 500) : null;
    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(cleanAvatar, userId);
    });
    runTx();
  },

  deleteUser(userId: string): void {
    const db = getDb();
    const runTx = db.transaction(() => {
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });
    runTx();
  },
};
