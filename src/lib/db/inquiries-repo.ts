import crypto from "crypto";
import { getDb } from "./client";

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "spam";
  submitted_at: string;
  ip: string | null;
}

export const inquiriesRepo = {
  create(inquiry: {
    id?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status?: "open" | "in_progress" | "resolved" | "spam";
    ip?: string;
  }): ContactInquiry {
    const db = getDb();
    const id = inquiry.id || `inq_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const record: ContactInquiry = {
      id,
      name: inquiry.name.trim(),
      email: inquiry.email.trim().toLowerCase(),
      subject: inquiry.subject.trim(),
      message: inquiry.message.trim(),
      status: inquiry.status || "open",
      submitted_at: now,
      ip: inquiry.ip || null,
    };

    const runTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO contact_inquiries (id, name, email, subject, message, status, submitted_at, ip)
        VALUES (@id, @name, @email, @subject, @message, @status, @submitted_at, @ip)
      `).run(record);
    });

    runTx();
    return record;
  },

  getAll(): ContactInquiry[] {
    const db = getDb();
    return db
      .prepare("SELECT * FROM contact_inquiries ORDER BY submitted_at DESC")
      .all() as ContactInquiry[];
  },

  updateStatus(id: string, status: "open" | "in_progress" | "resolved" | "spam"): void {
    const db = getDb();
    const runTx = db.transaction(() => {
      db.prepare("UPDATE contact_inquiries SET status = ? WHERE id = ?").run(status, id);
    });
    runTx();
  },
};
