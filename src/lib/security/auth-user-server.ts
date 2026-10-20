import crypto from "crypto";
import {
  usersRepo,
  sessionsRepo,
  otpRepo,
  passwordResetRepo,
  securityEventsRepo,
  creditLedgerRepo,
  toSafeUser,
  DbUser,
  DbSession,
} from "../db";
import {
  hashPassword,
  verifyPassword,
} from "./auth-admin";
import { userLockout } from "./login-lockout";
import {
  applySecurityHeaders,
  createSafeErrorResponse,
} from "./headers";
import { MemoryRateLimiter } from "./rate-limiter";
import { mailer } from "../email/mailer";

// 15 auth attempts per minute per IP
const authLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  name: "auth",
});

// Strict limiter for OTP verification attempts (10 per minute per IP)
const otpVerifyLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  name: "otp_verify",
});

// Limiter for OTP resend and password reset requests (5 per minute per IP)
const sensitiveRequestLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
  name: "sensitive_auth",
});

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/bg_session=([^;]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function getUserFromRequest(request: Request): { session: DbSession; user: DbUser } | null {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return sessionsRepo.findSessionByToken(token);
}

function getSecureCookieFlag(): string {
  const isProd =
    process.env["COOKIE_SECURE"] === "true" ||
    process.env["NODE_ENV"] === "production";
  return isProd ? "; Secure" : "";
}

/**
 * Normalizes email address consistently
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * POST /api/auth/signup
 * Creates an unverified user account and sends a 6-digit OTP via Hostinger SMTP
 */
export async function handleSignup(request: Request, clientIp: string): Promise<Response> {
  const rate = authLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many signup attempts. Retry in ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const name = String(body.name || "").trim();
    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Please provide a valid email address.")
      );
    }

    const cleanPhone = body.phone ? String(body.phone).replace(/[\s\-()]/g, "").trim() : null;
    const cleanCountryCode = body.countryCode ? String(body.countryCode).trim() : null;
    const cleanCountry = body.country ? String(body.country).trim() : null;

    if (!password || password.length < 8) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Password must be at least 8 characters long.")
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Passwords do not match. Please re-enter.")
      );
    }

    // Check existing accounts by email or phone
    const existing = usersRepo.findByEmail(email);
    let userId: string;

    if (existing) {
      if (existing.email_verified === 1) {
        // Prevent account enumeration while rejecting duplicates safely
        return applySecurityHeaders(
          createSafeErrorResponse(400, "An account with this email address already exists. Please log in.")
        );
      } else {
        // Unverified user registering again: update name & password, reuse ID
        userId = existing.id;
        const passwordHash = hashPassword(password);
        usersRepo.updatePassword(userId, passwordHash);
        if (name) {
          usersRepo.updateName(userId, name);
        }
      }
    } else {
      const cleanName = name.slice(0, 100) || email.split("@")[0] || "User";
      const passwordHash = hashPassword(password);

      const newUser = usersRepo.create({
        name: cleanName,
        email,
        passwordHash,
        plan: "free",
        credits: 10,
        freeCredits: 10,
        paidCredits: 0,
        status: "active",
        emailVerified: false,
        phone: cleanPhone,
        countryCode: cleanCountryCode,
        country: cleanCountry,
      });
      userId = newUser.id;
    }

    // Check resend cooldown
    const cooldown = otpRepo.checkResendCooldown(email, "signup_verification");
    if (cooldown.onCooldown) {
      return applySecurityHeaders(
        createSafeErrorResponse(
          429,
          `Please wait ${cooldown.remainingSeconds} seconds before requesting another verification code.`
        )
      );
    }

    // Generate uniformly distributed 6-digit OTP
    const { plainOtp } = otpRepo.createChallenge({
      userId,
      email,
      purpose: "signup_verification",
      ip: clientIp,
    });

    // Send email via Hostinger SMTP
    const mailResult = await mailer.sendVerificationOtp({
      to: email,
      otp: plainOtp,
      ...(name ? { name } : {}),
    });

    if (!mailResult.success) {
      securityEventsRepo.logEvent({
        eventType: "otp_send_failed",
        userId,
        email,
        ip: clientIp,
        metadata: { error: mailResult.error },
      });
      return applySecurityHeaders(
        createSafeErrorResponse(500, "Unable to deliver verification email. Please check your address and retry.")
      );
    }

    securityEventsRepo.logEvent({
      eventType: "signup_otp_issued",
      userId,
      email,
      ip: clientIp,
    });

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "Verification code sent to your email. Please check your inbox.",
          email,
          requireVerification: true,
          needsVerification: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed registration request."));
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifies six-digit OTP and activates the account with a persistent session
 */
export async function handleVerifyOtp(request: Request, clientIp: string): Promise<Response> {
  const rate = otpVerifyLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many verification attempts. Please wait ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const email = normalizeEmail(String(body.email || ""));
    const otp = String(body.otp || "").trim();
    const purpose = (body.purpose || "signup_verification") as any;

    if (!email || !otp) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Email address and 6-digit verification code are required.")
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Verification code must be exactly 6 numeric digits.")
      );
    }

    const verifyResult = otpRepo.verifyAndConsumeOtp({
      email,
      otp,
      purpose,
    });

    if (!verifyResult.success) {
      securityEventsRepo.logEvent({
        eventType: "otp_verification_failed",
        email,
        ip: clientIp,
        metadata: { remainingAttempts: verifyResult.remainingAttempts },
      });
      return applySecurityHeaders(
        createSafeErrorResponse(400, verifyResult.error || "Invalid verification code.")
      );
    }

    // Activate user
    const user = usersRepo.findByEmail(email);
    if (!user) {
      return applySecurityHeaders(createSafeErrorResponse(404, "User account not found."));
    }

    usersRepo.markEmailVerified(user.id);
    securityEventsRepo.logEvent({
      eventType: "account_activated",
      userId: user.id,
      email,
      ip: clientIp,
    });

    // Create persistent session
    const rawToken = crypto.randomBytes(32).toString("hex");
    const userAgent = request.headers.get("user-agent") || undefined;
    sessionsRepo.createSession(user.id, rawToken, clientIp, userAgent);

    const secureFlag = getSecureCookieFlag();
    const cookieHeader = `bg_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secureFlag}`;

    const refreshedUser = usersRepo.findById(user.id) || user;

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "Email verified successfully! Welcome to bg.tools.",
          user: toSafeUser(refreshedUser),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookieHeader,
          },
        }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed verification request."));
  }
}

/**
 * POST /api/auth/resend-otp
 * Re-issues a 6-digit verification OTP with 60-second cooldown enforcement
 */
export async function handleResendOtp(request: Request, clientIp: string): Promise<Response> {
  const rate = sensitiveRequestLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many resend requests. Please wait ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const email = normalizeEmail(String(body.email || ""));
    const purpose = (body.purpose || "signup_verification") as any;

    if (!email || !email.includes("@")) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Valid email address is required."));
    }

    // Enforce 60s cooldown
    const cooldown = otpRepo.checkResendCooldown(email, purpose);
    if (cooldown.onCooldown) {
      return applySecurityHeaders(
        createSafeErrorResponse(
          429,
          `Please wait ${cooldown.remainingSeconds} seconds before requesting a new code.`
        )
      );
    }

    const user = usersRepo.findByEmail(email);

    // If user exists and is already verified
    if (user && user.email_verified === 1) {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            message: "Your account is already verified. You can proceed to log in.",
            alreadyVerified: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Generate new OTP
    const { plainOtp } = otpRepo.createChallenge({
      userId: user?.id || null,
      email,
      purpose,
      ip: clientIp,
    });

    const mailResult = await mailer.sendVerificationOtp({
      to: email,
      otp: plainOtp,
      ...(user?.name ? { name: user.name } : {}),
    });

    if (!mailResult.success) {
      return applySecurityHeaders(
        createSafeErrorResponse(500, "Failed to deliver email. Please try again shortly.")
      );
    }

    securityEventsRepo.logEvent({
      eventType: "otp_resent",
      userId: user?.id ?? null,
      email,
      ip: clientIp,
    });

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "A new six-digit verification code has been sent to your email.",
          cooldownSeconds: 60,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed request."));
  }
}

/**
 * POST /api/auth/login
 * Verifies email & password, checks verification status, and rotates session
 */
export async function handleLogin(request: Request, clientIp: string): Promise<Response> {
  const rate = authLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many login attempts. Retry in ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const identifier = String(body.email || body.phone || body.identifier || "").trim();
    const password = String(body.password || "");

    // Find user by email or mobile phone
    const user = usersRepo.findByEmailOrPhone(identifier);
    const lockKey = user ? user.email : identifier.toLowerCase();

    // Lockout check: 5 failed attempts per IP+identifier -> 15 min lockout
    const lockoutState = userLockout.isLocked(clientIp, lockKey);
    if (lockoutState.locked) {
      return applySecurityHeaders(
        createSafeErrorResponse(
          429,
          `Account temporarily locked due to failed attempts. Try again in ${Math.ceil(lockoutState.remainingSeconds / 60)} minutes.`
        )
      );
    }

    if (!identifier || !password) {
      userLockout.recordFailedAttempt(clientIp, lockKey);
      return applySecurityHeaders(createSafeErrorResponse(401, "Please provide your email or mobile number and password."));
    }

    if (!user) {
      userLockout.recordFailedAttempt(clientIp, lockKey);
      // Constant-time dummy verify to prevent timing oracle
      verifyPassword(
        password,
        "scrypt$16384$8$1$0000000000000000$0000000000000000000000000000000000000000000000000000000000000000"
      );
      return applySecurityHeaders(createSafeErrorResponse(401, "Invalid credentials. Please verify your details or sign up."));
    }

    const email = user.email;
    const passwordMatches = verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      const failRec = userLockout.recordFailedAttempt(clientIp, email);
      if (failRec.locked) {
        return applySecurityHeaders(
          createSafeErrorResponse(429, "Too many failed attempts. Account locked for 15 minutes.")
        );
      }
      return applySecurityHeaders(createSafeErrorResponse(401, "Invalid email or password."));
    }

    // Check email verification status
    if (user.email_verified === 0) {
      // Re-issue OTP automatically if not on cooldown
      const cooldown = otpRepo.checkResendCooldown(email, "signup_verification");
      if (!cooldown.onCooldown) {
        const { plainOtp } = otpRepo.createChallenge({
          userId: user.id,
          email,
          purpose: "signup_verification",
          ip: clientIp,
        });
        await mailer.sendVerificationOtp({
          to: email,
          name: user.name,
          otp: plainOtp,
        });
      }

      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: "Please verify your email address to log in. A verification code has been sent.",
            unverified: true,
            needsVerification: true,
            requireVerification: true,
            email: user.email,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (user.status === "banned") {
      return applySecurityHeaders(
        createSafeErrorResponse(403, "This account is permanently suspended.")
      );
    }

    if (user.status === "restricted") {
      return applySecurityHeaders(
        createSafeErrorResponse(403, "This account is currently restricted.")
      );
    }

    // Login succeeded: reset failed attempts
    userLockout.resetAttempts(clientIp, email);

    // Rotate session token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const userAgent = request.headers.get("user-agent") || undefined;
    sessionsRepo.createSession(user.id, rawToken, clientIp, userAgent);

    // Update active timestamps and daily reset
    const refreshedUser = usersRepo.resetDailyCreditsIfNeeded(user.id) || user;
    usersRepo.updateLastActive(user.id);

    securityEventsRepo.logEvent({
      eventType: "login_success",
      userId: user.id,
      email,
      ip: clientIp,
    });

    const secureFlag = getSecureCookieFlag();
    const cookieHeader = `bg_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secureFlag}`;

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          user: toSafeUser(refreshedUser),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookieHeader,
          },
        }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed login request."));
  }
}

/**
 * POST /api/auth/forgot-password
 * Initiates single-use password reset link with generic response (anti-enumeration)
 */
export async function handleForgotPassword(request: Request, clientIp: string): Promise<Response> {
  const rate = sensitiveRequestLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many requests. Please retry in ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const email = normalizeEmail(String(body.email || ""));

    if (email && email.includes("@")) {
      const user = usersRepo.findByEmail(email);
      if (user && user.email_verified === 1) {
        const { rawToken } = passwordResetRepo.createResetToken({
          userId: user.id,
          email,
          ip: clientIp,
        });

        await mailer.sendPasswordResetEmail({
          to: email,
          name: user.name,
          rawToken,
        });

        securityEventsRepo.logEvent({
          eventType: "password_reset_requested",
          userId: user.id,
          email,
          ip: clientIp,
        });
      }
    }

    // Always return generic success response to prevent account enumeration
    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message:
            "If an account exists with that email address, a password reset link has been sent to your inbox.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed request."));
  }
}

/**
 * POST /api/auth/reset-password
 * Verifies single-use reset token, sets new password, and revokes all active sessions
 */
export async function handleResetPassword(request: Request, clientIp: string): Promise<Response> {
  const rate = authLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many requests. Please wait ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!token) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Missing password reset token."));
    }

    if (!password || password.length < 8) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "New password must be at least 8 characters long.")
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Passwords do not match. Please re-enter.")
      );
    }

    const resetResult = passwordResetRepo.verifyAndConsumeToken(token);
    if (!resetResult.success || !resetResult.resetRecord) {
      return applySecurityHeaders(
        createSafeErrorResponse(
          400,
          resetResult.error || "Password reset link is invalid or has expired. Please request a new one."
        )
      );
    }

    const record = resetResult.resetRecord;
    const newPasswordHash = hashPassword(password);

    // Update password in DB
    usersRepo.updatePassword(record.user_id, newPasswordHash);

    // Security best practice: Revoke all existing sessions across all devices
    sessionsRepo.deleteAllUserSessions(record.user_id);

    securityEventsRepo.logEvent({
      eventType: "password_reset_completed",
      userId: record.user_id,
      email: record.email,
      ip: clientIp,
    });

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "Your password has been reset successfully. Please log in with your new credentials.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed password reset request."));
  }
}

/**
 * POST /api/auth/logout
 * Deletes current session from database and expires cookie
 */
export function handleLogout(request: Request): Response {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    sessionsRepo.deleteSession(token);
  }

  const cookieHeader = "bg_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  return applySecurityHeaders(
    new Response(JSON.stringify({ success: true, message: "Logged out successfully." }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader,
      },
    })
  );
}

/**
 * GET /api/auth/me
 * Returns current authenticated user and token balance
 */
export function handleMe(request: Request): Response {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(
      new Response(JSON.stringify({ authenticated: false, user: null }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  // Auto-reset daily credits if a new day has arrived
  const refreshedUser = usersRepo.resetDailyCreditsIfNeeded(auth.user.id) || auth.user;

  return applySecurityHeaders(
    new Response(
      JSON.stringify({
        authenticated: true,
        user: toSafeUser(refreshedUser),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  );
}

/**
 * POST /api/auth/profile
 * Updates user name or profile info
 */
export async function handleUpdateProfile(request: Request): Promise<Response> {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(createSafeErrorResponse(401, "Authentication required."));
  }

  try {
    const body = (await request.json()) as any;
    const hasName = body.name !== undefined;
    const hasAvatar = body.avatar !== undefined;

    if (!hasName && !hasAvatar) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Please provide profile details to update."));
    }

    if (hasName) {
      const name = String(body.name || "").trim();
      if (!name || name.length < 2) {
        return applySecurityHeaders(createSafeErrorResponse(400, "Please provide a valid name (at least 2 characters)."));
      }
      usersRepo.updateName(auth.user.id, name);
    }

    if (hasAvatar) {
      const avatar = body.avatar ? String(body.avatar).trim() : null;
      usersRepo.updateAvatar(auth.user.id, avatar);
    }

    const updated = usersRepo.findById(auth.user.id);

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "Profile updated successfully.",
          user: updated ? toSafeUser(updated) : null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed profile request."));
  }
}

/**
 * POST /api/auth/change-password
 * Updates password verifying current password
 */
export async function handleChangePassword(request: Request, clientIp?: string): Promise<Response> {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(createSafeErrorResponse(401, "Authentication required."));
  }

  try {
    const body = (await request.json()) as any;
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Current and new password are required."));
    }

    if (!verifyPassword(currentPassword, auth.user.password_hash)) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Current password is incorrect."));
    }

    if (newPassword.length < 8) {
      return applySecurityHeaders(createSafeErrorResponse(400, "New password must be at least 8 characters long."));
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return applySecurityHeaders(createSafeErrorResponse(400, "New passwords do not match."));
    }

    const newHash = hashPassword(newPassword);
    usersRepo.updatePassword(auth.user.id, newHash);

    // Revoke other sessions
    sessionsRepo.deleteAllUserSessions(auth.user.id);

    // Re-create session for current device
    const rawToken = crypto.randomBytes(32).toString("hex");
    sessionsRepo.createSession(auth.user.id, rawToken);

    const secureFlag = getSecureCookieFlag();
    const cookieHeader = `bg_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secureFlag}`;

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: "Password changed successfully.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookieHeader,
          },
        }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed request."));
  }
}

export async function handleDeductCredit(
  request: Request,
  clientIp: string
): Promise<Response> {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(
      createSafeErrorResponse(401, "You must be logged in to consume user credits.")
    );
  }

  try {
    const body = (await request.json()) as any;
    const toolSlug = String(body.toolSlug || "unknown-tool");
    const amount = Number(body.amount) || 1;

    const res = creditLedgerRepo.deductUserCredits(
      auth.user.id,
      amount,
      toolSlug,
      clientIp
    );

    if (!res.success) {
      return applySecurityHeaders(
        createSafeErrorResponse(402, res.error || "Insufficient credits.")
      );
    }

    const updatedUser = usersRepo.findById(auth.user.id);

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          balanceAfter: res.balanceAfter,
          ledgerId: res.ledgerId,
          user: updatedUser ? toSafeUser(updatedUser) : null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed credit deduction request."));
  }
}
