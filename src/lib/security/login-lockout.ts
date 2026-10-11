/**
 * In-memory / persistent login lockout tracker
 * Enforces: 5 failed attempts per IP+username -> 15 minute block
 */
interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number;
  lastAttempt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 minute sliding window

class LoginLockoutTracker {
  private attempts = new Map<string, LockoutEntry>();

  private getKey(ip: string, username: string): string {
    const cleanIp = (ip || "unknown").trim();
    const cleanUser = (username || "unknown").trim().toLowerCase();
    return `${cleanIp}:${cleanUser}`;
  }

  public isLocked(ip: string, username: string): { locked: boolean; remainingSeconds: number } {
    const key = this.getKey(ip, username);
    const entry = this.attempts.get(key);
    if (!entry) return { locked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // Lockout expired: reset failed attempts if window elapsed
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      this.attempts.delete(key);
    } else if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS) {
      this.attempts.delete(key);
    }

    return { locked: false, remainingSeconds: 0 };
  }

  public recordFailedAttempt(
    ip: string,
    username: string
  ): { locked: boolean; remainingAttempts: number; lockoutSeconds: number } {
    const key = this.getKey(ip, username);
    const now = Date.now();
    const entry = this.attempts.get(key) || {
      failedAttempts: 0,
      lockedUntil: 0,
      lastAttempt: now,
    };

    entry.lastAttempt = now;
    entry.failedAttempts += 1;

    if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION_MS;
      this.attempts.set(key, entry);
      return {
        locked: true,
        remainingAttempts: 0,
        lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    this.attempts.set(key, entry);
    return {
      locked: false,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts),
      lockoutSeconds: 0,
    };
  }

  public resetAttempts(ip: string, username: string): void {
    const key = this.getKey(ip, username);
    this.attempts.delete(key);
  }

  public clearAll(): void {
    this.attempts.clear();
  }
}

export const adminLockout = new LoginLockoutTracker();
export const userLockout = new LoginLockoutTracker();
