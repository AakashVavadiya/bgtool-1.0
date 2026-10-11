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
  registered_at: string;
  last_active: string;
  last_credit_reset: string;
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
    registeredAt: user.registered_at,
    lastActive: user.last_active,
    lastCreditReset: user.last_credit_reset,
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

  getAllSafe(): SafeUser[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM users ORDER BY registered_at DESC").all() as DbUser[];
    return rows.map(toSafeUser);
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
  }): DbUser {
    const db = getDb();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const id = user.id || `usr_${crypto.randomBytes(8).toString("hex")}`;
    const cleanEmail = user.email.trim().toLowerCase();

    const insert = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, plan, credits, free_credits, paid_credits,
        total_processed, status, registered_at, last_active, last_credit_reset
      ) VALUES (
        @id, @name, @email, @password_hash, @plan, @credits, @free_credits, @paid_credits,
        @total_processed, @status, @registered_at, @last_active, @last_credit_reset
      )
    `);

    const newRecord: DbUser = {
      id,
      name: user.name.trim(),
      email: cleanEmail,
      password_hash: user.passwordHash,
      plan: user.plan || "free",
      credits: user.credits ?? 10,
      free_credits: user.freeCredits ?? 10,
      paid_credits: user.paidCredits ?? 0,
      total_processed: 0,
      status: user.status || "active",
      registered_at: now,
      last_active: now,
      last_credit_reset: today,
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
};
