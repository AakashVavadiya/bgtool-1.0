import crypto from "crypto";
import { getDb } from "./client";

export interface ToolUsageRecord {
  id: string;
  tool_slug: string;
  tool_name?: string | null;
  user_id: string | null;
  ip: string;
  success: number;
  duration_ms: number;
  file_size_bytes: number;
  memory_bytes?: number;
  created_at: string;
}

export interface ToolExecutionStat {
  slug: string;
  name: string;
  category: string;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  successRate: number; // 0 - 100
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  totalFileBytes: number;
  avgMemoryMb: number;
  peakMemoryMb: number;
  lastExecutedAt: string;
}

export interface ToolTimeSeriesPoint {
  timeLabel: string;
  timestamp: number;
  runs: number;
  successes: number;
  failures: number;
  avgDurationMs: number;
  memoryMb: number;
}

export interface MemoryDiagnostics {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  heapUsagePercent: number;
  status: "Optimal" | "Moderate" | "High" | "Critical";
  processUptimeSec: number;
}

export interface ToolRecentLog {
  id: string;
  toolSlug: string;
  toolName: string;
  ip: string;
  success: boolean;
  durationMs: number;
  fileSizeBytes: number;
  memoryMb: number;
  createdAt: string;
}

export interface ToolGearReport {
  timeframe: "1d" | "yesterday" | "7d" | "30d";
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  overallSuccessRate: number;
  avgLatencyMs: number;
  totalBytesProcessed: number;
  activeToolsCount: number;
  toolStats: ToolExecutionStat[];
  timeSeries: ToolTimeSeriesPoint[];
  memory: MemoryDiagnostics;
  recentLogs: ToolRecentLog[];
}

const TOOL_META_MAP: Record<string, { name: string; category: string; typicalMemoryMb: number }> = {
  "remove-background": { name: "AI Background Remover", category: "AI Background", typicalMemoryMb: 320 },
  "pdf-to-jpg": { name: "PDF to JPG Converter", category: "PDF Suite", typicalMemoryMb: 145 },
  "jpg-to-pdf": { name: "JPG to PDF Converter", category: "PDF Suite", typicalMemoryMb: 110 },
  "blur-face": { name: "AI Face Blur", category: "AI Privacy", typicalMemoryMb: 280 },
  "remove-watermark": { name: "AI Watermark Remover", category: "AI Restoration", typicalMemoryMb: 310 },
  "compress-image": { name: "Compress Image", category: "Image Editing", typicalMemoryMb: 65 },
  "resize-image": { name: "Resize Image", category: "Image Editing", typicalMemoryMb: 55 },
  "chat": { name: "AI Creative Assistant & Editor", category: "AI Chat", typicalMemoryMb: 190 },
  "image-upscaler": { name: "AI Image Upscaler (4K)", category: "AI Enhancement", typicalMemoryMb: 390 },
  "merge-pdf": { name: "Merge PDF Documents", category: "PDF Suite", typicalMemoryMb: 95 },
  "crop-image": { name: "Crop Image", category: "Image Editing", typicalMemoryMb: 45 },
  "passport-photo": { name: "Passport Size Photo Maker", category: "Studio Tools", typicalMemoryMb: 130 },
  "watermark-pdf": { name: "Watermark PDF", category: "PDF Suite", typicalMemoryMb: 85 },
  "rotate-image": { name: "Rotate Image", category: "Image Editing", typicalMemoryMb: 40 },
  "convert-png-jpg": { name: "PNG to JPG Converter", category: "Format Converter", typicalMemoryMb: 50 },
  "pdf-protect": { name: "Protect PDF with Password", category: "PDF Suite", typicalMemoryMb: 75 },
};

export function getToolName(slug: string): string {
  if (TOOL_META_MAP[slug]) return TOOL_META_MAP[slug].name;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getToolCategory(slug: string): string {
  if (TOOL_META_MAP[slug]) return TOOL_META_MAP[slug].category;
  if (slug.includes("pdf")) return "PDF Suite";
  if (slug.includes("ai") || slug.includes("background") || slug.includes("blur")) return "AI Tools";
  return "Image Editing";
}

export function getToolTypicalMemory(slug: string): number {
  if (TOOL_META_MAP[slug]) return TOOL_META_MAP[slug].typicalMemoryMb;
  return 85;
}

export const toolUsageRepo = {
  record(entry: {
    toolSlug: string;
    toolName?: string | undefined;
    userId?: string | null | undefined;
    ip: string;
    success?: boolean | undefined;
    durationMs?: number | undefined;
    fileSizeBytes?: number | undefined;
    memoryBytes?: number | undefined;
  }): ToolUsageRecord {
    const db = getDb();
    const id = `use_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    const toolName = entry.toolName || getToolName(entry.toolSlug);
    const memoryBytes = entry.memoryBytes || getToolTypicalMemory(entry.toolSlug) * 1024 * 1024;

    const record: ToolUsageRecord = {
      id,
      tool_slug: entry.toolSlug,
      tool_name: toolName,
      user_id: entry.userId || null,
      ip: entry.ip,
      success: entry.success !== false ? 1 : 0,
      duration_ms: entry.durationMs || 0,
      file_size_bytes: entry.fileSizeBytes || 0,
      memory_bytes: memoryBytes,
      created_at: now,
    };

    try {
      db.prepare(`
        INSERT INTO tool_usage (
          id, tool_slug, tool_name, user_id, ip, success, duration_ms, file_size_bytes, memory_bytes, created_at
        ) VALUES (
          @id, @tool_slug, @tool_name, @user_id, @ip, @success, @duration_ms, @file_size_bytes, @memory_bytes, @created_at
        )
      `).run(record);
    } catch {
      // Fallback if schema doesn't have memory_bytes yet
      try {
        db.prepare(`
          INSERT INTO tool_usage (id, tool_slug, user_id, ip, success, duration_ms, file_size_bytes, created_at)
          VALUES (@id, @tool_slug, @user_id, @ip, @success, @duration_ms, @file_size_bytes, @created_at)
        `).run({
          id: record.id,
          tool_slug: record.tool_slug,
          user_id: record.user_id,
          ip: record.ip,
          success: record.success,
          duration_ms: record.duration_ms,
          file_size_bytes: record.file_size_bytes,
          created_at: record.created_at,
        });
      } catch (err) {
        console.error("[toolUsageRepo.record error]", err);
      }
    }

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

  getDetailedReport(timeframe: "1d" | "yesterday" | "7d" | "30d" = "1d"): ToolGearReport {
    const db = getDb();
    const now = new Date();

    // Define timeframe start and end ISO strings
    let startIso: string;
    let endIso: string = now.toISOString();

    if (timeframe === "yesterday") {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(now.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(now);
      yesterdayEnd.setDate(now.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);

      startIso = yesterdayStart.toISOString();
      endIso = yesterdayEnd.toISOString();
    } else if (timeframe === "7d") {
      const past7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      startIso = past7.toISOString();
    } else if (timeframe === "30d") {
      const past30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      startIso = past30.toISOString();
    } else {
      // "1d" / Today: Last 24 Hours
      const last24h = new Date(now.getTime() - 24 * 3600 * 1000);
      startIso = last24h.toISOString();
    }

    // 1. Query Overall Totals
    const totalsRow = db.prepare(`
      SELECT 
        COUNT(*) as total_executions,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions,
        AVG(duration_ms) as avg_latency,
        SUM(file_size_bytes) as total_bytes,
        COUNT(DISTINCT tool_slug) as active_tools
      FROM tool_usage
      WHERE created_at >= ? AND created_at <= ?
    `).get(startIso, endIso) as any;

    const totalExecutions = totalsRow?.total_executions || 0;
    const successfulExecutions = totalsRow?.successful_executions || 0;
    const failedExecutions = totalsRow?.failed_executions || 0;
    const overallSuccessRate = totalExecutions > 0
      ? Math.round((successfulExecutions / totalExecutions) * 1000) / 10
      : 100;
    const avgLatencyMs = totalExecutions > 0 ? Math.round(totalsRow?.avg_latency || 0) : 0;
    const totalBytesProcessed = totalsRow?.total_bytes || 0;
    const activeToolsCount = totalsRow?.active_tools || 0;

    // 2. Query Per-Tool Breakdown
    const toolRows = db.prepare(`
      SELECT 
        tool_slug,
        tool_name,
        COUNT(*) as total_runs,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_runs,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_runs,
        AVG(duration_ms) as avg_duration,
        MIN(duration_ms) as min_duration,
        MAX(duration_ms) as max_duration,
        SUM(file_size_bytes) as total_filesize,
        AVG(COALESCE(memory_bytes, 0)) as avg_memory,
        MAX(COALESCE(memory_bytes, 0)) as peak_memory,
        MAX(created_at) as last_executed_at
      FROM tool_usage
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY tool_slug
      ORDER BY total_runs DESC
    `).all(startIso, endIso) as any[];

    const toolStats: ToolExecutionStat[] = toolRows.map((r) => {
      const slug = r.tool_slug;
      const name = r.tool_name || getToolName(slug);
      const category = getToolCategory(slug);
      const totalRuns = r.total_runs || 0;
      const successRuns = r.success_runs || 0;
      const failedRuns = r.failed_runs || 0;
      const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 1000) / 10 : 100;

      const avgMemoryMb = r.avg_memory > 0
        ? Math.round((r.avg_memory / (1024 * 1024)) * 10) / 10
        : 0;

      const peakMemoryMb = r.peak_memory > 0
        ? Math.round((r.peak_memory / (1024 * 1024)) * 10) / 10
        : 0;

      return {
        slug,
        name,
        category,
        totalRuns,
        successRuns,
        failedRuns,
        successRate,
        avgDurationMs: Math.round(r.avg_duration || 0),
        minDurationMs: Math.round(r.min_duration || 0),
        maxDurationMs: Math.round(r.max_duration || 0),
        totalFileBytes: r.total_filesize || 0,
        avgMemoryMb,
        peakMemoryMb,
        lastExecutedAt: r.last_executed_at || new Date().toISOString(),
      };
    });

    // 3. Time-Series Graph Generation (Hourly for 1d / yesterday, Daily for 7d / 30d)
    const timeSeries: ToolTimeSeriesPoint[] = [];

    if (timeframe === "1d" || timeframe === "yesterday") {
      // 24 Hourly Slots
      const baseStart = new Date(startIso);
      for (let h = 0; h < 24; h += 2) {
        const slotStart = new Date(baseStart.getTime() + h * 3600 * 1000);
        const slotEnd = new Date(slotStart.getTime() + 2 * 3600 * 1000);
        const timeLabel = slotStart.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });

        const slotRow = db.prepare(`
          SELECT 
            COUNT(*) as runs,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
            AVG(duration_ms) as avg_duration,
            AVG(COALESCE(memory_bytes, 0)) as avg_mem
          FROM tool_usage
          WHERE created_at >= ? AND created_at < ?
        `).get(slotStart.toISOString(), slotEnd.toISOString()) as any;

        const runs = slotRow?.runs || 0;
        const avgMemBytes = slotRow?.avg_mem || 0;
        const memMb = runs > 0 && avgMemBytes > 0
          ? Math.round(avgMemBytes / (1024 * 1024))
          : 0;

        timeSeries.push({
          timeLabel,
          timestamp: slotStart.getTime(),
          runs,
          successes: slotRow?.successes || 0,
          failures: slotRow?.failures || 0,
          avgDurationMs: runs > 0 ? Math.round(slotRow?.avg_duration || 0) : 0,
          memoryMb: memMb,
        });
      }
    } else {
      // Daily Slots for 7d or 30d
      const numDays = timeframe === "7d" ? 7 : 30;
      for (let d = numDays - 1; d >= 0; d--) {
        const targetDate = new Date(now.getTime() - d * 24 * 3600 * 1000);
        const dateKey = targetDate.toISOString().slice(0, 10);
        const timeLabel = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const dayRow = db.prepare(`
          SELECT 
            COUNT(*) as runs,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
            AVG(duration_ms) as avg_duration,
            AVG(COALESCE(memory_bytes, 0)) as avg_mem
          FROM tool_usage
          WHERE substr(created_at, 1, 10) = ?
        `).get(dateKey) as any;

        const runs = dayRow?.runs || 0;
        const avgMemBytes = dayRow?.avg_mem || 0;
        const memMb = runs > 0 && avgMemBytes > 0
          ? Math.round(avgMemBytes / (1024 * 1024))
          : 0;

        timeSeries.push({
          timeLabel,
          timestamp: targetDate.getTime(),
          runs,
          successes: dayRow?.successes || 0,
          failures: dayRow?.failures || 0,
          avgDurationMs: runs > 0 ? Math.round(dayRow?.avg_duration || 0) : 0,
          memoryMb: memMb,
        });
      }
    }

    // 4. Memory Diagnostics Snapshot (Real Node.js Process Metrics)
    let heapUsedMb = 0;
    let heapTotalMb = 0;
    let rssMb = 0;
    let externalMb = 0;
    let uptimeSec = 0;
    let maxHeapLimitMb = 2048;

    if (typeof process !== "undefined" && typeof process.memoryUsage === "function") {
      const mem = process.memoryUsage();
      heapUsedMb = Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10;
      heapTotalMb = Math.round((mem.heapTotal / (1024 * 1024)) * 10) / 10;
      rssMb = Math.round((mem.rss / (1024 * 1024)) * 10) / 10;
      externalMb = Math.round((mem.external / (1024 * 1024)) * 10) / 10;
      uptimeSec = Math.floor(process.uptime());

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const v8 = require("v8");
        const stats = v8.getHeapStatistics?.();
        if (stats?.heap_size_limit) {
          maxHeapLimitMb = Math.round(stats.heap_size_limit / (1024 * 1024));
        }
      } catch {}
    }

    // Measure percentage against available limit (or heapTotal if limit unavailable)
    const heapUsagePercent = maxHeapLimitMb > 0
      ? Math.round((heapUsedMb / maxHeapLimitMb) * 100)
      : Math.round((heapUsedMb / Math.max(1, heapTotalMb)) * 100);

    // Realistic server memory health statuses
    let status: "Optimal" | "Moderate" | "High" | "Critical" = "Optimal";
    if (heapUsedMb > 1600 || rssMb > 2000) status = "Critical";
    else if (heapUsedMb > 1100 || rssMb > 1400) status = "High";
    else if (heapUsedMb > 600 || rssMb > 900) status = "Moderate";
    else status = "Optimal";

    const memory: MemoryDiagnostics = {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb,
      heapUsagePercent,
      status,
      processUptimeSec: uptimeSec,
    };

    // 5. Query Recent Execution Logs
    const recentRows = db.prepare(`
      SELECT 
        id,
        tool_slug,
        tool_name,
        ip,
        success,
        duration_ms,
        file_size_bytes,
        COALESCE(memory_bytes, 0) as memory_bytes,
        created_at
      FROM tool_usage
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(startIso, endIso) as any[];

    const recentLogs: ToolRecentLog[] = recentRows.map((r) => ({
      id: r.id,
      toolSlug: r.tool_slug,
      toolName: r.tool_name || getToolName(r.tool_slug),
      ip: r.ip || "127.0.0.1",
      success: r.success === 1,
      durationMs: r.duration_ms || 0,
      fileSizeBytes: r.file_size_bytes || 0,
      memoryMb: r.memory_bytes > 0
        ? Math.round(r.memory_bytes / (1024 * 1024))
        : getToolTypicalMemory(r.tool_slug),
      createdAt: r.created_at,
    }));

    return {
      timeframe,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      overallSuccessRate,
      avgLatencyMs,
      totalBytesProcessed,
      activeToolsCount,
      toolStats,
      timeSeries,
      memory,
      recentLogs,
    };
  },
};
