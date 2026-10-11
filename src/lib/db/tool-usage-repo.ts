import crypto from "crypto";
import { getDb } from "./client";

export interface ToolUsageRecord {
  id: string;
  tool_slug: string;
  user_id: string | null;
  ip: string;
  success: number;
  duration_ms: number;
  file_size_bytes: number;
  created_at: string;
}

export const toolUsageRepo = {
  record(entry: {
    toolSlug: string;
    userId?: string | null | undefined;
    ip: string;
    success?: boolean | undefined;
    durationMs?: number | undefined;
    fileSizeBytes?: number | undefined;
  }): ToolUsageRecord {
    const db = getDb();
    const id = `use_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const record: ToolUsageRecord = {
      id,
      tool_slug: entry.toolSlug,
      user_id: entry.userId || null,
      ip: entry.ip,
      success: entry.success !== false ? 1 : 0,
      duration_ms: entry.durationMs || 0,
      file_size_bytes: entry.fileSizeBytes || 0,
      created_at: now,
    };

    const runTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO tool_usage (id, tool_slug, user_id, ip, success, duration_ms, file_size_bytes, created_at)
        VALUES (@id, @tool_slug, @user_id, @ip, @success, @duration_ms, @file_size_bytes, @created_at)
      `).run(record);
    });

    runTx();
    return record;
  },

  getUsageCounts(): Record<string, number> {
    const db = getDb();
    const rows = db
      .prepare("SELECT tool_slug, COUNT(*) as count FROM tool_usage GROUP BY tool_slug")
      .all() as { tool_slug: string; count: number }[];

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.tool_slug] = row.count;
    }
    return result;
  },
};
