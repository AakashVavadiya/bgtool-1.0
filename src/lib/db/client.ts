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
  `);
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
