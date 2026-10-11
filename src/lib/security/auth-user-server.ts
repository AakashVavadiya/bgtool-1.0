import crypto from "crypto";
import {
  usersRepo,
  sessionsRepo,
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

// 10 auth attempts per minute per IP
const authLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  name: "auth",
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
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Please provide a valid email address.")
      );
    }

    if (!password || password.length < 8) {
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Password must be at least 8 characters long.")
      );
    }

    const existing = usersRepo.findByEmail(email);
    if (existing) {
      // Generic error message to prevent account enumeration
      return applySecurityHeaders(
        createSafeErrorResponse(400, "Unable to create account with provided credentials.")
      );
    }

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
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const userAgent = request.headers.get("user-agent") || undefined;
    sessionsRepo.createSession(newUser.id, rawToken, clientIp, userAgent);

    const secureFlag = getSecureCookieFlag();
    const cookieHeader = `bg_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secureFlag}`;

    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          success: true,
          user: toSafeUser(newUser),
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
    return applySecurityHeaders(createSafeErrorResponse(400, "Malformed registration request."));
  }
}

export async function handleLogin(request: Request, clientIp: string): Promise<Response> {
  const rate = authLimiter.check(clientIp);
  if (!rate.allowed) {
    return applySecurityHeaders(
      createSafeErrorResponse(429, `Too many login attempts. Retry in ${rate.retryAfter}s.`)
    );
  }

  try {
    const body = (await request.json()) as any;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // Lockout check: 5 failed attempts per IP+username -> 15 min lockout
    const lockoutState = userLockout.isLocked(clientIp, email);
    if (lockoutState.locked) {
      return applySecurityHeaders(
        createSafeErrorResponse(
          429,
          `Account temporarily locked due to failed attempts. Try again in ${Math.ceil(lockoutState.remainingSeconds / 60)} minutes.`
        )
      );
    }

    if (!email || !password) {
      userLockout.recordFailedAttempt(clientIp, email);
      return applySecurityHeaders(createSafeErrorResponse(401, "Invalid email or password."));
    }

    const user = usersRepo.findByEmail(email);
    if (!user) {
      userLockout.recordFailedAttempt(clientIp, email);
      // Constant-time verify against dummy hash to prevent timing oracle
      verifyPassword(password, "scrypt$16384$8$1$0000000000000000$0000000000000000000000000000000000000000000000000000000000000000");
      return applySecurityHeaders(createSafeErrorResponse(401, "Invalid email or password."));
    }

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

export function handleLogout(request: Request): Response {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    sessionsRepo.deleteSession(token);
  }

  const cookieHeader = "bg_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  return applySecurityHeaders(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader,
      },
    })
  );
}

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

  if (auth.user.status === "banned" || auth.user.status === "restricted") {
    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
          status: auth.user.status,
          error: `Account is ${auth.user.status}.`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  }

  const refreshedUser = usersRepo.resetDailyCreditsIfNeeded(auth.user.id) || auth.user;
  usersRepo.updateLastActive(auth.user.id);

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
