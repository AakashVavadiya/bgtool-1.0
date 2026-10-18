import { getDb } from "./client";
import crypto from "crypto";

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
  error?: string;
  description?: string;
}

interface PromoCodeRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: PromoCodeRow): PromoCode {
  return {
    id: r.id,
    code: r.code,
    discountType: r.discount_type === "fixed" ? "fixed" : "percentage",
    discountValue: r.discount_value,
    minPurchaseAmount: r.min_purchase_amount ?? 0,
    maxDiscountAmount: r.max_discount_amount ?? null,
    maxUses: r.max_uses ?? null,
    usedCount: r.used_count ?? 0,
    expiresAt: r.expires_at ?? null,
    active: Boolean(r.active),
    description: r.description || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const promoCodesRepo = {
  initTable(): void {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value REAL NOT NULL,
        min_purchase_amount REAL DEFAULT 0,
        max_discount_amount REAL,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TEXT,
        active INTEGER DEFAULT 1,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
    `);

    // Seed default starter coupons if table is empty
    const count = db.prepare("SELECT COUNT(*) as count FROM promo_codes").get() as { count: number };
    if (count.count === 0) {
      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO promo_codes (
          id, code, discount_type, discount_value, min_purchase_amount,
          max_discount_amount, max_uses, used_count, expires_at, active, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        `prm_${crypto.randomBytes(8).toString("hex")}`,
        "FESTIVE50",
        "percentage",
        50,
        199,
        1000,
        500,
        0,
        null,
        1,
        "Special 50% discount on all packs & subscriptions",
        now,
        now
      );

      insert.run(
        `prm_${crypto.randomBytes(8).toString("hex")}`,
        "WELCOME20",
        "percentage",
        20,
        99,
        500,
        1000,
        0,
        null,
        1,
        "Welcome coupon: 20% OFF your first purchase",
        now,
        now
      );

      insert.run(
        `prm_${crypto.randomBytes(8).toString("hex")}`,
        "SAVE100",
        "fixed",
        100,
        499,
        null,
        250,
        0,
        null,
        1,
        "Flat ₹100 instant discount on orders above ₹499",
        now,
        now
      );
    }
  },

  getAll(): PromoCode[] {
    this.initTable();
    const db = getDb();
    const rows = db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all() as PromoCodeRow[];
    return rows.map(mapRow);
  },

  getActive(): PromoCode[] {
    this.initTable();
    const db = getDb();
    const rows = db.prepare("SELECT * FROM promo_codes WHERE active = 1 ORDER BY created_at DESC").all() as PromoCodeRow[];
    return rows.map(mapRow);
  },

  getByCode(code: string): PromoCode | null {
    this.initTable();
    if (!code) return null;
    const db = getDb();
    const cleanCode = code.trim().toUpperCase();
    const row = db.prepare("SELECT * FROM promo_codes WHERE UPPER(code) = ?").get(cleanCode) as PromoCodeRow | undefined;
    return row ? mapRow(row) : null;
  },

  validate(code: string, amountINR: number): PromoValidationResult {
    this.initTable();
    if (!code || !code.trim()) {
      return { valid: false, error: "Please enter a promo code." };
    }

    const promo = this.getByCode(code);
    if (!promo) {
      return { valid: false, error: "Invalid promo code. Please check and try again." };
    }

    if (!promo.active) {
      return { valid: false, error: "This promo code is currently inactive or disabled." };
    }

    if (promo.expiresAt) {
      const expDate = new Date(promo.expiresAt).getTime();
      if (Date.now() > expDate) {
        return { valid: false, error: "This promo code has expired." };
      }
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return { valid: false, error: "This promo code has reached its maximum usage limit." };
    }

    if (promo.minPurchaseAmount > 0 && amountINR < promo.minPurchaseAmount) {
      return {
        valid: false,
        error: `This code requires a minimum purchase of ₹${promo.minPurchaseAmount.toLocaleString("en-IN")}.`,
      };
    }

    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = Math.round(((amountINR * promo.discountValue) / 100) * 100) / 100;
      if (promo.maxDiscountAmount !== null && promo.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(amountINR, promo.discountValue);
    }

    // Minimum charge is ₹1 for gateway processing
    const finalAmount = Math.max(1, Math.round((amountINR - discountAmount) * 100) / 100);

    return {
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      finalAmount,
      description: promo.description,
    };
  },

  create(data: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number | null;
    maxUses?: number | null;
    expiresAt?: string | null;
    active?: boolean;
    description?: string;
  }): PromoCode {
    this.initTable();
    const db = getDb();
    const cleanCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      throw new Error("Promo code must contain alphanumeric characters.");
    }

    const existing = this.getByCode(cleanCode);
    if (existing) {
      throw new Error(`Promo code "${cleanCode}" already exists.`);
    }

    const id = `prm_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO promo_codes (
        id, code, discount_type, discount_value, min_purchase_amount,
        max_discount_amount, max_uses, used_count, expires_at, active, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanCode,
      data.discountType,
      data.discountValue,
      data.minPurchaseAmount ?? 0,
      data.maxDiscountAmount ?? null,
      data.maxUses ?? null,
      data.expiresAt ?? null,
      data.active !== false ? 1 : 0,
      data.description?.trim() || "",
      now,
      now
    );

    return this.getByCode(cleanCode)!;
  },

  update(
    id: string,
    data: Partial<{
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      minPurchaseAmount: number;
      maxDiscountAmount: number | null;
      maxUses: number | null;
      expiresAt: string | null;
      active: boolean;
      description: string;
    }>
  ): PromoCode | null {
    this.initTable();
    const db = getDb();
    const existing = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(id) as PromoCodeRow | undefined;
    if (!existing) return null;

    const code = data.code ? data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") : existing.code;
    const discountType = data.discountType ?? existing.discount_type;
    const discountValue = data.discountValue !== undefined ? data.discountValue : existing.discount_value;
    const minPurchase = data.minPurchaseAmount !== undefined ? data.minPurchaseAmount : existing.min_purchase_amount;
    const maxDiscount = data.maxDiscountAmount !== undefined ? data.maxDiscountAmount : existing.max_discount_amount;
    const maxUses = data.maxUses !== undefined ? data.maxUses : existing.max_uses;
    const expiresAt = data.expiresAt !== undefined ? data.expiresAt : existing.expires_at;
    const active = data.active !== undefined ? (data.active ? 1 : 0) : existing.active;
    const description = data.description !== undefined ? data.description.trim() : existing.description;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE promo_codes SET
        code = ?,
        discount_type = ?,
        discount_value = ?,
        min_purchase_amount = ?,
        max_discount_amount = ?,
        max_uses = ?,
        expires_at = ?,
        active = ?,
        description = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      maxUses,
      expiresAt,
      active,
      description,
      now,
      id
    );

    const updated = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(id) as PromoCodeRow | undefined;
    return updated ? mapRow(updated) : null;
  },

  delete(id: string): boolean {
    this.initTable();
    const db = getDb();
    const result = db.prepare("DELETE FROM promo_codes WHERE id = ?").run(id);
    return result.changes > 0;
  },

  incrementUsage(code: string): void {
    this.initTable();
    if (!code) return;
    const db = getDb();
    const cleanCode = code.trim().toUpperCase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE promo_codes 
      SET used_count = used_count + 1, updated_at = ?
      WHERE UPPER(code) = ?
    `).run(now, cleanCode);
  },
};
