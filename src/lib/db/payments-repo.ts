import crypto from "crypto";
import { getDb } from "./client";
import { DbUser } from "./users-repo";

export interface DbPayment {
  id: string;
  order_id: string;
  payment_id: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  plan_name: string;
  plan_type: "pack" | "subscription" | "festival";
  credits: number;
  amount_inr: number;
  currency: string;
  status: "created" | "completed" | "failed" | "refunded";
  payment_method: string;
  signature: string | null;
  receipt: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderParams {
  orderId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  planName: string;
  planType?: "pack" | "subscription" | "festival";
  credits: number;
  amountINR: number;
  currency?: string;
  receipt?: string;
}

export interface CompletePaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
  paymentMethod?: string;
}

export interface CompletePaymentResult {
  success: boolean;
  payment?: DbPayment;
  user?: DbUser | null;
  error?: string;
  alreadyCompleted?: boolean;
}

export const paymentsRepo = {
  /**
   * Create an initial order record when Razorpay order is generated
   */
  createOrder(params: CreateOrderParams): DbPayment {
    const db = getDb();
    const id = `pay_${crypto.randomBytes(10).toString("hex")}`;
    const now = new Date().toISOString();

    const payment: DbPayment = {
      id,
      order_id: params.orderId,
      payment_id: null,
      user_id: params.userId || null,
      user_name: params.userName || null,
      user_email: params.userEmail || null,
      plan_name: params.planName,
      plan_type: params.planType || "pack",
      credits: params.credits,
      amount_inr: params.amountINR,
      currency: params.currency || "INR",
      status: "created",
      payment_method: "Razorpay",
      signature: null,
      receipt: params.receipt || null,
      created_at: now,
      updated_at: now,
    };

    db.prepare(`
      INSERT INTO payments (
        id, order_id, payment_id, user_id, user_name, user_email,
        plan_name, plan_type, credits, amount_inr, currency,
        status, payment_method, signature, receipt, created_at, updated_at
      ) VALUES (
        @id, @order_id, @payment_id, @user_id, @user_name, @user_email,
        @plan_name, @plan_type, @credits, @amount_inr, @currency,
        @status, @payment_method, @signature, @receipt, @created_at, @updated_at
      )
    `).run(payment);

    return payment;
  },

  /**
   * Retrieve order by Razorpay order_id
   */
  getByOrderId(orderId: string): DbPayment | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM payments WHERE order_id = ?").get(orderId);
    return (row as DbPayment) || null;
  },

  /**
   * Retrieve order by Razorpay payment_id
   */
  getByPaymentId(paymentId: string): DbPayment | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM payments WHERE payment_id = ?").get(paymentId);
    return (row as DbPayment) || null;
  },

  /**
   * Atomically verify & complete payment, credit user's account and log to ledger
   */
  completePayment(params: CompletePaymentParams): CompletePaymentResult {
    const db = getDb();
    const now = new Date().toISOString();

    const completeTx = db.transaction(() => {
      // 1. Check if payment_id was already processed (Replay protection)
      const existingPay = db
        .prepare("SELECT * FROM payments WHERE payment_id = ?")
        .get(params.paymentId) as DbPayment | undefined;

      if (existingPay && existingPay.status === "completed") {
        const user = existingPay.user_id
          ? (db.prepare("SELECT * FROM users WHERE id = ?").get(existingPay.user_id) as DbUser | undefined)
          : null;
        return { success: true, payment: existingPay, user: user || null, alreadyCompleted: true };
      }

      // 2. Fetch order by order_id
      const order = db
        .prepare("SELECT * FROM payments WHERE order_id = ?")
        .get(params.orderId) as DbPayment | undefined;

      if (!order) {
        return { success: false, error: "Payment order not found in records." };
      }

      if (order.status === "completed") {
        const user = order.user_id
          ? (db.prepare("SELECT * FROM users WHERE id = ?").get(order.user_id) as DbUser | undefined)
          : null;
        return { success: true, payment: order, user: user || null, alreadyCompleted: true };
      }

      // 3. Mark payment as completed
      db.prepare(`
        UPDATE payments
        SET payment_id = ?, signature = ?, status = 'completed',
            payment_method = ?, updated_at = ?
        WHERE order_id = ?
      `).run(
        params.paymentId,
        params.signature,
        params.paymentMethod || "Razorpay",
        now,
        params.orderId
      );

      const updatedPayment: DbPayment = {
        ...order,
        payment_id: params.paymentId,
        signature: params.signature,
        status: "completed",
        payment_method: params.paymentMethod || "Razorpay",
        updated_at: now,
      };

      let updatedUser: DbUser | null = null;

      // 4. Credit user if user_id is linked
      if (order.user_id) {
        const user = db
          .prepare("SELECT * FROM users WHERE id = ?")
          .get(order.user_id) as DbUser | undefined;

        if (user) {
          const newPaid = Math.round((user.paid_credits + order.credits) * 100) / 100;
          const newTotal = Math.round((user.free_credits + newPaid) * 100) / 100;

          // Determine plan upgrades
          let nextPlan = user.plan;
          const planLower = order.plan_name.toLowerCase();
          if (planLower.includes("pro")) nextPlan = "pro";
          else if (planLower.includes("lite")) nextPlan = "lite";
          else if (planLower.includes("enterprise")) nextPlan = "enterprise";

          db.prepare(`
            UPDATE users
            SET paid_credits = ?, credits = ?, plan = ?, last_active = ?
            WHERE id = ?
          `).run(newPaid, newTotal, nextPlan, now, user.id);

          updatedUser = {
            ...user,
            paid_credits: newPaid,
            credits: newTotal,
            plan: nextPlan,
            last_active: now,
          };

          // 5. Insert record into credit_ledger
          const ledgerId = `cld_buy_${crypto.randomBytes(10).toString("hex")}`;
          db.prepare(`
            INSERT INTO credit_ledger (
              id, user_id, ip, amount, balance_after, type, tool_slug, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            ledgerId,
            user.id,
            null,
            order.credits,
            newTotal,
            "plan_purchase",
            null,
            `Razorpay Purchase: ${order.plan_name} (${order.credits} Gold Tokens) - Ref: ${params.paymentId}`,
            now
          );
        }
      }

      return {
        success: true,
        payment: updatedPayment,
        user: updatedUser,
      };
    });

    return completeTx();
  },

  /**
   * Get all payments for admin panel
   */
  getAll(limit = 100): DbPayment[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT * FROM payments
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(limit) as DbPayment[];
  },

  /**
   * Get payments for a specific user
   */
  getUserPayments(userId: string, limit = 50): DbPayment[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT * FROM payments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(userId, limit) as DbPayment[];
  },

  /**
   * Delete payment order record (e.g. unpaid / cancelled order)
   */
  deleteOrder(orderIdOrPaymentId: string): boolean {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM payments WHERE order_id = ? OR payment_id = ? OR id = ?")
      .run(orderIdOrPaymentId, orderIdOrPaymentId, orderIdOrPaymentId);
    return result.changes > 0;
  },
};
