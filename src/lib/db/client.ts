import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const customPath = process.env["DATABASE_PATH"];
  if (customPath) {
    const dir = path.dirname(customPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return customPath;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "app.db");
}

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const db = new Database(dbPath, {
    // PM2 Cluster Mode Safety: timeout in ms to wait for locked tables
    timeout: 5000,
  });

  // Enable WAL (Write-Ahead Logging) mode for high concurrency
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  initSchema(db);

  dbInstance = db;
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      credits REAL NOT NULL DEFAULT 10,
      free_credits REAL NOT NULL DEFAULT 10,
      paid_credits REAL NOT NULL DEFAULT 0,
      total_processed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      email_verified INTEGER NOT NULL DEFAULT 0,
      verified_at TEXT,
      registered_at TEXT NOT NULL,
      last_active TEXT NOT NULL,
      last_credit_reset TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS otp_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL,
      ip TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_otp_challenges_email_purpose ON otp_challenges(email, purpose);
    CREATE INDEX IF NOT EXISTS idx_otp_challenges_user ON otp_challenges(user_id);
    CREATE INDEX IF NOT EXISTS idx_otp_challenges_expires ON otp_challenges(expires_at);

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL,
      ip TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      user_id TEXT,
      email TEXT,
      ip TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_security_events_type_date ON security_events(event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_security_events_ip_date ON security_events(ip, created_at);

    CREATE TABLE IF NOT EXISTS credit_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      ip TEXT,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      type TEXT NOT NULL,
      tool_slug TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_credit_ledger_ip ON credit_ledger(ip);

    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      submitted_at TEXT NOT NULL,
      ip TEXT
    );

    CREATE TABLE IF NOT EXISTS tool_usage (
      id TEXT PRIMARY KEY,
      tool_slug TEXT NOT NULL,
      user_id TEXT,
      ip TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      duration_ms INTEGER DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tool_usage_slug ON tool_usage(tool_slug);
    CREATE INDEX IF NOT EXISTS idx_tool_usage_ip_date ON tool_usage(ip, created_at);

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      payment_id TEXT UNIQUE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      user_email TEXT,
      plan_name TEXT NOT NULL,
      plan_type TEXT NOT NULL DEFAULT 'pack',
      credits REAL NOT NULL,
      amount_inr REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'created',
      payment_method TEXT NOT NULL DEFAULT 'Razorpay',
      signature TEXT,
      receipt TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);

  // Migrate existing users table if columns are missing
  try {
    const columns = db.pragma("table_info(users)") as Array<{ name: string }>;
    const colNames = new Set(columns.map((c) => c.name));
    if (!colNames.has("email_verified")) {
      db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;");
    }
    if (!colNames.has("verified_at")) {
      db.exec("ALTER TABLE users ADD COLUMN verified_at TEXT;");
    }
  } catch (err) {
    console.error("[DB Schema Migration Warning]", err);
  }
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
