import fs from "fs";
import path from "path";
import { getDb, closeDb } from "../src/lib/db/client";
import { hashPassword } from "../src/lib/security/auth-admin";

export function runMigration(): {
  usersMigrated: number;
  inquiriesMigrated: number;
  toolsConfigMigrated: boolean;
  plansConfigMigrated: boolean;
} {
  const db = getDb();
  const dataDir = path.join(process.cwd(), "data");

  let usersCount = 0;
  let inquiriesCount = 0;
  let toolsMigrated = false;
  let plansMigrated = false;

  // 1. Migrate Users
  const userFiles = [
    path.join(dataDir, "users.json"),
    path.join(dataDir, "users.example.json"),
  ];

  let rawUsers: any[] = [];
  for (const uFile of userFiles) {
    if (fs.existsSync(uFile)) {
      try {
        const content = fs.readFileSync(uFile, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawUsers = parsed;
          break;
        }
      } catch {}
    }
  }

  if (rawUsers.length > 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, plan, credits, free_credits, paid_credits,
        total_processed, status, registered_at, last_active, last_credit_reset
      ) VALUES (
        @id, @name, @email, @password_hash, @plan, @credits, @free_credits, @paid_credits,
        @total_processed, @status, @registered_at, @last_active, @last_credit_reset
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        plan = excluded.plan,
        credits = excluded.credits
    `);

    const userTx = db.transaction(() => {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      for (const u of rawUsers) {
        if (!u.id || !u.email) continue;

        let passwordHash = u.passwordHash || u.password_hash;
        if (!passwordHash && u.password) {
          passwordHash = hashPassword(u.password);
        } else if (!passwordHash) {
          passwordHash = hashPassword("UserDefaultSecurePassword2026!");
        }

        const freeCredits = typeof u.freeCredits === "number" ? u.freeCredits : (typeof u.free_credits === "number" ? u.free_credits : 10);
        const paidCredits = typeof u.paidCredits === "number" ? u.paidCredits : (typeof u.paid_credits === "number" ? u.paid_credits : 0);
        const credits = typeof u.credits === "number" ? u.credits : freeCredits + paidCredits;

        insertUser.run({
          id: String(u.id),
          name: String(u.name || "User"),
          email: String(u.email).trim().toLowerCase(),
          password_hash: passwordHash,
          plan: u.plan || "free",
          credits,
          free_credits: freeCredits,
          paid_credits: paidCredits,
          total_processed: u.totalProcessed || u.total_processed || 0,
          status: u.status || "active",
          registered_at: u.registeredAt || u.registered_at || now,
          last_active: u.lastActive || u.last_active || now,
          last_credit_reset: u.lastCreditReset || u.last_credit_reset || today,
        });
        usersCount++;
      }
    });

    userTx();
  }

  // 2. Migrate Contact Inquiries
  const inquiryFiles = [
    path.join(dataDir, "contact-inquiries.json"),
    path.join(dataDir, "contact-inquiries.example.json"),
  ];

  let rawInquiries: any[] = [];
  for (const iFile of inquiryFiles) {
    if (fs.existsSync(iFile)) {
      try {
        const content = fs.readFileSync(iFile, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawInquiries = parsed;
          break;
        }
      } catch {}
    }
  }

  if (rawInquiries.length > 0) {
    const insertInquiry = db.prepare(`
      INSERT INTO contact_inquiries (
        id, name, email, subject, message, status, submitted_at, ip
      ) VALUES (
        @id, @name, @email, @subject, @message, @status, @submitted_at, @ip
      )
      ON CONFLICT(id) DO NOTHING
    `);

    const inqTx = db.transaction(() => {
      const now = new Date().toISOString();
      for (const inq of rawInquiries) {
        if (!inq.id || !inq.email) continue;
        insertInquiry.run({
          id: String(inq.id),
          name: String(inq.name || "Anonymous"),
          email: String(inq.email).trim().toLowerCase(),
          subject: String(inq.subject || "Inquiry"),
          message: String(inq.message || ""),
          status: inq.status || "open",
          submitted_at: inq.submittedAt || inq.submitted_at || now,
          ip: inq.ip || null,
        });
        inquiriesCount++;
      }
    });

    inqTx();
  }

  // 3. Migrate Tools Config
  const toolsConfigFile = path.join(dataDir, "tools-config.json");
  if (fs.existsSync(toolsConfigFile)) {
    try {
      const content = fs.readFileSync(toolsConfigFile, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const configTx = db.transaction(() => {
          db.prepare(`
            INSERT INTO config (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `).run("tools_config", JSON.stringify(parsed), new Date().toISOString());
        });
        configTx();
        toolsMigrated = true;
      }
    } catch {}
  }

  // 4. Migrate Plans Config
  const plansConfigFile = path.join(dataDir, "plans-config.json");
  if (fs.existsSync(plansConfigFile)) {
    try {
      const content = fs.readFileSync(plansConfigFile, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const configTx = db.transaction(() => {
          db.prepare(`
            INSERT INTO config (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `).run("plans_config", JSON.stringify(parsed), new Date().toISOString());
        });
        configTx();
        plansMigrated = true;
      }
    } catch {}
  }

  return {
    usersMigrated: usersCount,
    inquiriesMigrated: inquiriesCount,
    toolsConfigMigrated: toolsMigrated,
    plansConfigMigrated: plansMigrated,
  };
}

console.log("Starting idempotent JSON -> SQLite database migration...");
const result = runMigration();
console.log("Migration complete:");
console.log(` - Users migrated: ${result.usersMigrated}`);
console.log(` - Contact inquiries migrated: ${result.inquiriesMigrated}`);
console.log(` - Tools config migrated: ${result.toolsConfigMigrated ? "Yes" : "No"}`);
console.log(` - Plans config migrated: ${result.plansConfigMigrated ? "Yes" : "No"}`);
closeDb();
