import { getDb } from "./client";
import { ToolConfigItem } from "../security/auth-admin";
import fs from "fs";
import path from "path";

export const configRepo = {
  get<T = unknown>(key: string): T | null {
    const db = getDb();
    const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key) as
      | { value: string }
      | undefined;

    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    const db = getDb();
    const jsonStr = JSON.stringify(value);
    const now = new Date().toISOString();

    const runTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO config (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(key, jsonStr, now);
    });

    runTx();
  },

  /**
   * Returns tools config from SQLite or falls back to seed data/tools-config.json
   */
  getToolsConfig(): ToolConfigItem[] {
    const cached = this.get<ToolConfigItem[]>("tools_config");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // Fallback seed from committed data/tools-config.json
    try {
      const seedPath = path.join(process.cwd(), "data", "tools-config.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.set("tools_config", parsed);
          return parsed;
        }
      }
    } catch {}

    return [];
  },

  setToolsConfig(configs: ToolConfigItem[]): void {
    this.set("tools_config", configs);
  },

  /**
   * Returns plans config from SQLite or falls back to seed data/plans-config.json
   */
  getPlansConfig<T = unknown>(): T[] {
    const cached = this.get<T[]>("plans_config");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      let needsSync = false;
      let cleaned = (cached as any[]).map((p) => {
        if (p && typeof p.name === "string" && /[\u{10000}-\u{10FFFF}]/u.test(p.name)) {
          needsSync = true;
          return {
            ...p,
            name: p.name.replace(/[\u{10000}-\u{10FFFF}]/gu, "").replace(/\s+/g, " ").trim(),
          };
        }
        return p;
      });

      // If Medium plan is missing from SQLite cache, merge from seed
      if (!cleaned.some((p) => p.id === "sub-medium")) {
        try {
          const seedPath = path.join(process.cwd(), "data", "plans-config.json");
          if (fs.existsSync(seedPath)) {
            const raw = fs.readFileSync(seedPath, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              cleaned = parsed;
              needsSync = true;
            }
          }
        } catch {}
      }

      if (needsSync) {
        this.set("plans_config", cleaned);
      }
      return cleaned as T[];
    }

    try {
      const seedPath = path.join(process.cwd(), "data", "plans-config.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.set("plans_config", parsed);
          return parsed;
        }
      }
    } catch {}

    return [];
  },

  setPlansConfig(plans: unknown[]): void {
    this.set("plans_config", plans);
  },
};
