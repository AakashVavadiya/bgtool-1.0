import crypto from "crypto";
import { getDb } from "./client";

export type OtpPurpose = "signup_verification" | "resend_verification" | "password_reset";

export interface DbOtpChallenge {
  id: string;
  user_id: string | null;
  email: string;
  purpose: OtpPurpose;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
  ip: string | null;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  remainingAttempts?: number;
  challenge?: DbOtpChallenge;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

function getOtpSecret(): string {
  return (
    process.env["OTP_SECRET"] ||
    process.env["SESSION_SECRET"] ||
    "bgtools_production_otp_hmac_secret_key_secure_2026"
  );
}

export function hashOtp(otp: string): string {
  const secret = getOtpSecret();
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

export function generateSixDigitOtp(): string {
  // Uniformly distributed 6-digit numeric OTP preserving leading zeroes
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(6, "0");
}

export const otpRepo = {
  /**
   * Check if an active OTP was issued within the last 60 seconds (Resend Cooldown)
   */
  checkResendCooldown(
    email: string,
    purpose: OtpPurpose
  ): { onCooldown: boolean; remainingSeconds: number } {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const row = db
      .prepare(`
        SELECT created_at FROM otp_challenges
        WHERE email = ? AND purpose = ? AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(cleanEmail, purpose) as { created_at: string } | undefined;

    if (!row) {
      return { onCooldown: false, remainingSeconds: 0 };
    }

    const createdTime = new Date(row.created_at).getTime();
    const elapsed = Date.now() - createdTime;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { onCooldown: true, remainingSeconds };
    }

    return { onCooldown: false, remainingSeconds: 0 };
  },

  /**
   * Issue a new OTP challenge, invalidating any previous unconsumed codes for this email and purpose
   */
  createChallenge(params: {
    userId?: string | null;
    email: string;
    purpose: OtpPurpose;
    ip?: string | null;
  }): { challenge: DbOtpChallenge; plainOtp: string } {
    const db = getDb();
    const cleanEmail = params.email.trim().toLowerCase();
    const plainOtp = generateSixDigitOtp();
    const otpHash = hashOtp(plainOtp);

    const id = `otp_${crypto.randomBytes(12).toString("hex")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString();

    const challenge: DbOtpChallenge = {
      id,
      user_id: params.userId || null,
      email: cleanEmail,
      purpose: params.purpose,
      otp_hash: otpHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt,
      consumed_at: null,
      created_at: now.toISOString(),
      ip: params.ip || null,
    };

    const runTx = db.transaction(() => {
      // Invalidate existing unconsumed challenges for this email and purpose
      db.prepare(`
        UPDATE otp_challenges
        SET consumed_at = ?
        WHERE email = ? AND purpose = ? AND consumed_at IS NULL
      `).run(now.toISOString(), cleanEmail, params.purpose);

      // Insert new challenge
      db.prepare(`
        INSERT INTO otp_challenges (
          id, user_id, email, purpose, otp_hash, attempts, max_attempts,
          expires_at, consumed_at, created_at, ip
        ) VALUES (
          @id, @user_id, @email, @purpose, @otp_hash, @attempts, @max_attempts,
          @expires_at, @consumed_at, @created_at, @ip
        )
      `).run(challenge);
    });

    runTx();
    return { challenge, plainOtp };
  },

  /**
   * Atomically verifies and consumes the OTP challenge
   */
  verifyAndConsumeOtp(params: {
    email: string;
    otp: string;
    purpose: OtpPurpose;
  }): VerifyOtpResult {
    const db = getDb();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanOtp = params.otp.trim();
    const now = new Date().toISOString();

    const verifyTx = db.transaction((): VerifyOtpResult => {
      // Find latest active, unexpired, unconsumed challenge
      const challenge = db
        .prepare(`
          SELECT * FROM otp_challenges
          WHERE email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?
          ORDER BY created_at DESC
          LIMIT 1
        `)
        .get(cleanEmail, params.purpose, now) as DbOtpChallenge | undefined;

      if (!challenge) {
        return {
          success: false,
          error: "Verification code has expired or is invalid. Please request a new code.",
        };
      }

      if (challenge.attempts >= challenge.max_attempts) {
        // Mark challenge consumed due to excessive failed attempts
        db.prepare("UPDATE otp_challenges SET consumed_at = ? WHERE id = ?").run(now, challenge.id);
        return {
          success: false,
          error: "Maximum verification attempts exceeded. Please request a new verification code.",
          remainingAttempts: 0,
        };
      }

      // Compute hash of provided OTP
      const candidateHash = hashOtp(cleanOtp);
      const expectedBuf = Buffer.from(challenge.otp_hash, "hex");
      const actualBuf = Buffer.from(candidateHash, "hex");

      const isMatch =
        expectedBuf.length === actualBuf.length &&
        crypto.timingSafeEqual(expectedBuf, actualBuf);

      if (!isMatch) {
        const newAttempts = challenge.attempts + 1;
        const remaining = Math.max(0, challenge.max_attempts - newAttempts);

        if (newAttempts >= challenge.max_attempts) {
          db.prepare("UPDATE otp_challenges SET attempts = ?, consumed_at = ? WHERE id = ?").run(
            newAttempts,
            now,
            challenge.id
          );
          return {
            success: false,
            error: "Incorrect code. Maximum attempts reached. Please request a new code.",
            remainingAttempts: 0,
          };
        } else {
          db.prepare("UPDATE otp_challenges SET attempts = ? WHERE id = ?").run(
            newAttempts,
            challenge.id
          );
          return {
            success: false,
            error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
            remainingAttempts: remaining,
          };
        }
      }

      // Success: Consume immediately
      db.prepare("UPDATE otp_challenges SET consumed_at = ? WHERE id = ?").run(now, challenge.id);

      return {
        success: true,
        message: "Verification code confirmed successfully.",
        challenge: { ...challenge, consumed_at: now },
      };
    });

    return verifyTx();
  },

  /**
   * Cleanup expired OTP records
   */
  cleanupExpired(): number {
    const db = getDb();
    const now = new Date().toISOString();
    let count = 0;
    const runTx = db.transaction(() => {
      const res = db.prepare("DELETE FROM otp_challenges WHERE expires_at < ?").run(now);
      count = res.changes;
    });
    runTx();
    return count;
  },
};
