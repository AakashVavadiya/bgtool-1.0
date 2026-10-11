import crypto from "crypto";
import { getDb } from "./client";
import { usersRepo, DbUser } from "./users-repo";

export interface CreditLedgerEntry {
  id: string;
  user_id: string | null;
  ip: string | null;
  amount: number;
  balance_after: number;
  type: "daily_reset" | "tool_usage" | "refund" | "plan_purchase" | "admin_grant" | "guest_usage";
  tool_slug: string | null;
  description: string | null;
  created_at: string;
}

export interface CreditDeductionResult {
  success: boolean;
  balanceAfter: number;
  ledgerId?: string;
  error?: string;
}

const GUEST_DAILY_LIMIT = 5; // Default free guest uses per IP per day

export const creditLedgerRepo = {
  /**
   * Deduct credits atomically inside an immediate SQLite transaction.
   * Prevents concurrent overspend race conditions.
   */
  deductUserCredits(
    userId: string,
    cost: number,
    toolSlug: string,
    ip?: string
  ): CreditDeductionResult {
    const db = getDb();
    const now = new Date().toISOString();
    const ledgerId = `cld_${crypto.randomBytes(10).toString("hex")}`;

    // Transaction executes immediately and locks write until complete
    const deductTx = db.transaction(() => {
      // 1. Reset daily credits first if new day
      usersRepo.resetDailyCreditsIfNeeded(userId);

      const user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(userId) as DbUser | undefined;

      if (!user) {
        return { success: false, balanceAfter: 0, error: "User not found." };
      }

      if (user.status === "banned") {
        return { success: false, balanceAfter: user.credits, error: "Account is banned." };
      }

      if (user.status === "restricted") {
        return { success: false, balanceAfter: user.credits, error: "Account is temporarily restricted." };
      }

      if (user.credits < cost) {
        return {
          success: false,
          balanceAfter: user.credits,
          error: `Insufficient credits. Required: ${cost}, available: ${user.credits}`,
        };
      }

      // Deduct from free_credits first, then paid_credits
      let newFree = user.free_credits;
      let newPaid = user.paid_credits;
      let remainingCost = cost;

      if (newFree >= remainingCost) {
        newFree -= remainingCost;
        remainingCost = 0;
      } else {
        remainingCost -= newFree;
        newFree = 0;
        newPaid = Math.max(0, newPaid - remainingCost);
      }

      const newTotal = Math.round((newFree + newPaid) * 100) / 100;

      // Update user credits and totalProcessed
      db.prepare(`
        UPDATE users
        SET credits = ?, free_credits = ?, paid_credits = ?, total_processed = total_processed + 1, last_active = ?
        WHERE id = ?
      `).run(newTotal, newFree, newPaid, now, userId);

      // Record in credit_ledger
      db.prepare(`
        INSERT INTO credit_ledger (
          id, user_id, ip, amount, balance_after, type, tool_slug, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        userId,
        ip || null,
        -cost,
        newTotal,
        "tool_usage",
        toolSlug,
        `Credit deduction for ${toolSlug}`,
        now
      );

      return { success: true, balanceAfter: newTotal, ledgerId };
    });

    return deductTx();
  },

  /**
   * Refund credits automatically if processing fails.
   */
  refundUserCredits(
    userId: string,
    cost: number,
    toolSlug: string,
    reason: string = "Processing failed"
  ): CreditDeductionResult {
    const db = getDb();
    const now = new Date().toISOString();
    const ledgerId = `cld_ref_${crypto.randomBytes(10).toString("hex")}`;

    const refundTx = db.transaction(() => {
      const user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(userId) as DbUser | undefined;

      if (!user) {
        return { success: false, balanceAfter: 0, error: "User not found." };
      }

      // Refund to paid_credits to ensure no artificial daily cap truncation
      const newPaid = Math.round((user.paid_credits + cost) * 100) / 100;
      const newTotal = Math.round((user.credits + cost) * 100) / 100;

      db.prepare(`
        UPDATE users
        SET credits = ?, paid_credits = ?
        WHERE id = ?
      `).run(newTotal, newPaid, userId);

      db.prepare(`
        INSERT INTO credit_ledger (
          id, user_id, ip, amount, balance_after, type, tool_slug, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        userId,
        null,
        cost,
        newTotal,
        "refund",
        toolSlug,
        `Refund for ${toolSlug}: ${reason}`,
        now
      );

      return { success: true, balanceAfter: newTotal, ledgerId };
    });

    return refundTx();
  },

  /**
   * Enforce and check daily guest IP usage
   */
  checkAndDeductGuestLimit(
    ip: string,
    toolSlug: string,
    dailyLimit: number = GUEST_DAILY_LIMIT
  ): { allowed: boolean; remaining: number; usedToday: number } {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const ledgerId = `cld_gst_${crypto.randomBytes(10).toString("hex")}`;
    const now = new Date().toISOString();

    const guestTx = db.transaction(() => {
      const countRow = db
        .prepare(`
          SELECT COUNT(*) as count 
          FROM credit_ledger 
          WHERE ip = ? AND type = 'guest_usage' AND created_at >= ?
        `)
        .get(ip, `${today}T00:00:00.000Z`) as { count: number };

      const usedToday = countRow ? countRow.count : 0;

      if (usedToday >= dailyLimit) {
        return { allowed: false, remaining: 0, usedToday };
      }

      db.prepare(`
        INSERT INTO credit_ledger (
          id, user_id, ip, amount, balance_after, type, tool_slug, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledgerId,
        null,
        ip,
        -1,
        dailyLimit - (usedToday + 1),
        "guest_usage",
        toolSlug,
        `Guest anonymous usage of ${toolSlug}`,
        now
      );

      return {
        allowed: true,
        remaining: dailyLimit - (usedToday + 1),
        usedToday: usedToday + 1,
      };
    });

    return guestTx();
  },

  getHistory(userId: string, limit = 50): CreditLedgerEntry[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT * FROM credit_ledger
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(userId, limit) as CreditLedgerEntry[];
  },

  getUserHistory(userId: string, limit = 50): CreditLedgerEntry[] {
    return this.getHistory(userId, limit);
  },
};
