import fs from "fs";
import path from "path";
import crypto from "crypto";
import { SECURITY_CONFIG } from "./upload-policy";

const TEMP_BASE_DIR = path.join(process.cwd(), ".tmp", "secure-jobs");

// Ensure private temp base directory exists with restricted permissions
try {
  if (!fs.existsSync(TEMP_BASE_DIR)) {
    fs.mkdirSync(TEMP_BASE_DIR, { recursive: true, mode: 0o700 });
  }
} catch (e) {
  console.error("[TempFileManager] Failed to create temp directory:", e);
}

export interface TempFileJob {
  jobId: string;
  jobDir: string;
  createdAt: number;
}

/**
 * Validates that a file path resides safely within the job directory (No path traversal).
 */
export function assertPathSafe(baseDir: string, targetPath: string): void {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error("Security violation: Path traversal attempt detected.");
  }
}

/**
 * Creates an isolated, random job workspace in private temp directory.
 */
export function createJobWorkspace(): TempFileJob {
  checkTempStorageQuota();

  const jobId = `job_${crypto.randomBytes(16).toString("hex")}`;
  const jobDir = path.join(TEMP_BASE_DIR, jobId);

  fs.mkdirSync(jobDir, { recursive: true, mode: 0o700 });

  return {
    jobId,
    jobDir,
    createdAt: Date.now(),
  };
}

/**
 * Writes a buffer securely to a job workspace.
 */
export function writeJobFile(job: TempFileJob, filename: string, data: Buffer | string): string {
  // Sanitize filename to basename only
  const safeBase = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(job.jobDir, safeBase);
  assertPathSafe(job.jobDir, filePath);

  fs.writeFileSync(filePath, data, { mode: 0o600 });
  return filePath;
}

/**
 * Deletes an entire job workspace and all its files immediately.
 */
export function cleanupJobWorkspace(jobIdOrDir: string): void {
  try {
    const jobDir = jobIdOrDir.startsWith(TEMP_BASE_DIR)
      ? jobIdOrDir
      : path.join(TEMP_BASE_DIR, path.basename(jobIdOrDir));

    assertPathSafe(TEMP_BASE_DIR, jobDir);

    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[TempFileManager] Failed to clean up job directory ${jobIdOrDir}:`, err);
  }
}

/**
 * Executes an async task with guaranteed workspace cleanup on success or error.
 */
export async function withTempWorkspace<T>(
  action: (job: TempFileJob) => Promise<T>
): Promise<T> {
  const job = createJobWorkspace();
  try {
    return await action(job);
  } finally {
    cleanupJobWorkspace(job.jobDir);
  }
}

/**
 * Measures total bytes occupied by temp files.
 */
export function getTempStorageUsage(): number {
  if (!fs.existsSync(TEMP_BASE_DIR)) return 0;

  let totalBytes = 0;
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          totalBytes += stats.size;
        } catch {}
      }
    }
  }

  try {
    walk(TEMP_BASE_DIR);
  } catch {}
  return totalBytes;
}

/**
 * Checks that temp directory does not exceed aggregate storage quota.
 */
export function checkTempStorageQuota(): void {
  const currentUsage = getTempStorageUsage();
  if (currentUsage > SECURITY_CONFIG.TEMP_STORAGE_QUOTA_BYTES) {
    // Purge expired files proactively
    runHourlyCleanup(15 * 60 * 1000); // purge anything older than 15 mins
    const usageAfter = getTempStorageUsage();
    if (usageAfter > SECURITY_CONFIG.TEMP_STORAGE_QUOTA_BYTES) {
      throw new Error("Temporary storage quota exceeded. Please try again shortly.");
    }
  }
}

/**
 * Scheduled cleanup of abandoned temporary workspaces older than maxAge.
 */
export function runHourlyCleanup(maxAgeMs = SECURITY_CONFIG.TEMP_FILE_MAX_AGE_MS): number {
  if (!fs.existsSync(TEMP_BASE_DIR)) return 0;

  const now = Date.now();
  let cleanedCount = 0;

  try {
    const items = fs.readdirSync(TEMP_BASE_DIR);
    for (const item of items) {
      const itemPath = path.join(TEMP_BASE_DIR, item);
      try {
        const stats = fs.statSync(itemPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.rmSync(itemPath, { recursive: true, force: true });
          cleanedCount++;
        }
      } catch {}
    }
  } catch (err) {
    console.warn("[TempFileManager] Scheduled cleanup error:", err);
  }

  return cleanedCount;
}

// Start recurring background cleanup timer (every 30 minutes)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    runHourlyCleanup();
  }, 30 * 60 * 1000);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}
