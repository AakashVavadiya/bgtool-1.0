import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  extractClientIp,
  generalLimiter,
  expensiveInferenceLimiter,
  contactLimiter,
  createRateLimitResponse,
  validateBase64Payload,
  SECURITY_CONFIG,
  TOOL_PROFILES,
  applySecurityHeaders,
  createSafeErrorResponse,
  isAuthorizedAdmin,
  verifyAdminLogin,
  createAdminSessionToken,
  validateToolsConfigPayload,
  validateContactSubmission,
  validateAdminEnvironment,
  sanitizeUser,
  migrateUsersData,
  atomicWriteJson,
  handleSignup,
  handleVerifyOtp,
  handleResendOtp,
  handleLogin,
  handleForgotPassword,
  handleResetPassword,
  handleUpdateProfile,
  handleChangePassword,
  handleLogout,
  handleMe,
  handleDeductCredit,
  getUserFromRequest,
  enforceToolCreditsAndLimits,
  handleCreatePaymentOrder,
  handleVerifyPayment,
  handleListPayments,
  handleDeletePaymentOrder,
} from "./lib/security";
import {
  usersRepo,
  inquiriesRepo,
  configRepo,
  creditLedgerRepo,
  toolUsageRepo,
  rateLimitsRepo,
  paymentsRepo,
  telemetryRepo,
  promoCodesRepo,
  notificationsRepo,
  toSafeUser,
} from "./lib/db";
import { handleApiV1 } from "./lib/api/handler";
import {
  handleUserApiKeys,
  handleUserApiKeyAction,
  handleAdminApiManagement,
} from "./lib/api/management-endpoints";

validateAdminEnvironment();

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";

function getPythonCommand(): string {
  const pythonPath = process.env["PYTHON_PATH"];
  if (pythonPath) {
    try {
      if (fs.existsSync(pythonPath)) {
        execSync(`"${pythonPath}" --version`, { stdio: "ignore" });
        return pythonPath;
      }
    } catch {}
  }
  const commands = ["python", "python3", "py"];
  for (const cmd of commands) {
    try {
      execSync(`"${cmd}" --version`, { stdio: "ignore" });
      return cmd;
    } catch {}
  }
  return "python";
}

let isSpawningPython = false;

async function ensurePythonServerRunning(): Promise<boolean> {
  // Fast single check (timeout 300ms)
  try {
    const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
    if (ping.ok) return true;
  } catch {}

  if (isSpawningPython) {
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 150));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  }

  isSpawningPython = true;
  try {
    const pyCmd = getPythonCommand();
    const serverScript = path.join(process.cwd(), "scripts", "bg_remover_server.py");
    console.log(`[Auto-Spawn] Launching Python background remover server: ${pyCmd} "${serverScript}" 5000`);
    const child = spawn(pyCmd, [serverScript, "5000"], {
      detached: true,
      stdio: "ignore",
    });
    child.on("error", (err) => {
      console.warn("[Auto-Spawn] Python background remover spawn error:", err.message);
    });
    child.unref();

    for (let i = 0; i < 35; i++) {
      await new Promise((r) => setTimeout(r, 120));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) {
          console.log("[Auto-Spawn] Python background remover server is online!");
          return true;
        }
      } catch {}
    }
    return false;
  } catch (err) {
    console.error("[Auto-Spawn] Failed to spawn Python server:", err);
    return false;
  } finally {
    isSpawningPython = false;
  }
}

// Auto-warmup Python server in background on launch
if (typeof process !== "undefined") {
  setTimeout(() => {
    ensurePythonServerRunning().catch(() => {});
  }, 100);
}

const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "clean-upscale": "upscale-image",
  "rotate-crop": "rotate-image",
  "convert-compress": "compress-image",
  "images-to-pdf": "image-to-pdf",
  "image-to-text": "image-to-text-ocr",
  "remove-bg": "remove-background",
  "face-blur": "blur-face",
  "convert-image": "convert-to-jpg",
  "batch-png": "convert-from-jpg",
};

function resolveCanonicalRedirectPath(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // keep raw pathname if malformed URI encoding
  }

  // 1. Handle literal TanStack Router template paths crawled by bots (e.g. /tools/$slug, /news/$slug)
  if (/^\/tools\/\$[^/]*\/?$/i.test(decoded)) {
    return "/tools";
  }
  if (/^\/news\/\$[^/]*\/?$/i.test(decoded)) {
    return "/news";
  }
  if (/^\/chat\/\$[^/]*\/?$/i.test(decoded)) {
    return "/chat";
  }

  // 2. Handle legacy tool & news slugs (e.g. /tools/clean-upscale -> /tools/upscale-image)
  const toolMatch = decoded.match(/^\/tools\/([^/]+)\/?$/);
  if (toolMatch?.[1]) {
    const slug = toolMatch[1];
    const mapped = LEGACY_SLUG_REDIRECTS[slug];
    if (mapped) return `/tools/${mapped}`;
  }

  const newsMatch = decoded.match(/^\/news\/([^/]+)\/?$/);
  if (newsMatch?.[1]) {
    const slug = newsMatch[1];
    const mapped = LEGACY_SLUG_REDIRECTS[slug];
    if (mapped) return `/news/${mapped}`;
  }

  return pathname;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = extractClientIp(request);

    // 0. Canonical Domain & Legacy/Template Route 301 Redirects (Fixes Google Search Console 404s)
    const canonicalPath = resolveCanonicalRedirectPath(url.pathname);
    const isWwwHost = url.hostname.toLowerCase() === "www.bg.tools";
    if (canonicalPath !== url.pathname || isWwwHost) {
      const targetOrigin = isWwwHost ? "https://bg.tools" : url.origin;
      const redirectUrl = `${targetOrigin}${canonicalPath}${url.search}`;
      return applySecurityHeaders(
        new Response(null, {
          status: 301,
          headers: {
            Location: redirectUrl,
            "Cache-Control": "public, max-age=86400",
          },
        })
      );
    }

    // 0. Static SEO Endpoints: /sitemap.xml & /robots.txt
    if (url.pathname === "/sitemap.xml") {
      const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
      if (fs.existsSync(sitemapPath)) {
        const xml = fs.readFileSync(sitemapPath, "utf-8");
        return applySecurityHeaders(
          new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=86400",
            },
          })
        );
      }
    }

    if (url.pathname === "/robots.txt") {
      const robotsPath = path.join(process.cwd(), "public", "robots.txt");
      if (fs.existsSync(robotsPath)) {
        const text = fs.readFileSync(robotsPath, "utf-8");
        return applySecurityHeaders(
          new Response(text, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=86400",
            },
          })
        );
      }
    }

    // Static Branded Security Error Pages: /429 & /403
    if (url.pathname === "/429" || url.pathname === "/429.html") {
      const filePath = path.join(process.cwd(), "public", "429.html");
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, "utf-8");
        return applySecurityHeaders(
          new Response(html, {
            status: 429,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Retry-After": "20",
            },
          })
        );
      }
    }

    if (url.pathname === "/403" || url.pathname === "/403.html") {
      const filePath = path.join(process.cwd(), "public", "403.html");
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, "utf-8");
        return applySecurityHeaders(
          new Response(html, {
            status: 403,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          })
        );
      }
    }

    // 0.5 Public REST API Gateway (/api/v1/*)
    if (url.pathname.startsWith("/api/v1/")) {
      const res = await handleApiV1(request, clientIp);
      return applySecurityHeaders(res);
    }

    // 1. General Rate Limiting for all /api endpoints
    if (url.pathname.startsWith("/api/")) {
      const generalCheck = generalLimiter.check(clientIp);
      if (!generalCheck.allowed) {
        return applySecurityHeaders(createRateLimitResponse(generalCheck.retryAfter));
      }
    }

    // 2. Strict Request-Body Size Check Pre-flight
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const declaredLen = parseInt(contentLengthHeader, 10);
      if (declaredLen > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
        return applySecurityHeaders(
          createSafeErrorResponse(413, "File size exceeds the 30 MB limit. Please upload a smaller file.")
        );
      }
    }

    // 3. Proxy API requests directly to the Python AI backend (/api/remove-bg)
    if (url.pathname === "/api/remove-bg") {
      const expensiveCheck = expensiveInferenceLimiter.check(clientIp);
      if (!expensiveCheck.allowed) {
        return applySecurityHeaders(
          createRateLimitResponse(
            expensiveCheck.retryAfter,
            "AI Model is busy. Rate limit exceeded, please wait a moment."
          )
        );
      }

      let creditCheck: any = null;
      try {
        const bodyText = await request.text();
        if (bodyText.length > 55 * 1024 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "File size exceeds the 30 MB limit. Please upload a smaller file.")
          );
        }

        let parsed: any;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Invalid JSON payload."));
        }

        const rawB64 = parsed.base64Image || parsed.image;
        if (!rawB64) {
          return applySecurityHeaders(createSafeErrorResponse(400, "No image payload provided."));
        }

        // Validate actual file magic bytes and enforce 10MB limit
        const validation = validateBase64Payload(rawB64, TOOL_PROFILES["remove-bg"]);
        if (!validation.valid) {
          return applySecurityHeaders(
            createSafeErrorResponse(validation.status || 400, validation.error || "Invalid file format.")
          );
        }

        creditCheck = await enforceToolCreditsAndLimits(request, "remove-bg", clientIp);
        if (!creditCheck.allowed) {
          const errRes = applySecurityHeaders(
            createSafeErrorResponse(creditCheck.status || 402, creditCheck.error || "Credit limit exceeded.")
          );
          if (creditCheck.guestCookieHeader) {
            errRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
          }
          return errRes;
        }

        let pythonResponse: Response;
        try {
          pythonResponse = await fetch("http://127.0.0.1:5000/remove-base64", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: bodyText,
          });
        } catch {
          console.warn("[Server] Python backend unreachable. Attempting auto-spawn...");
          const running = await ensurePythonServerRunning();
          if (!running) {
            creditCheck.refund?.("Python backend offline");
            throw new Error("Python background remover server is offline and auto-spawn failed.");
          }
          pythonResponse = await fetch("http://127.0.0.1:5000/remove-base64", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: bodyText,
          });
        }

        if (!pythonResponse.ok) {
          creditCheck.refund?.(`Python status ${pythonResponse.status}`);
        } else {
          creditCheck.recordSuccess?.();
        }

        const finalRes = applySecurityHeaders(pythonResponse);
        if (creditCheck.guestCookieHeader) {
          finalRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
        }
        return finalRes;
      } catch (err: any) {
        creditCheck.refund?.(err?.message || "Internal failure");
        console.error("Proxy error /api/remove-bg:", err?.message || err);
        return applySecurityHeaders(
          createSafeErrorResponse(502, "Server is busy. Please try again in a few moments.")
        );
      }
    }

    // 4. Proxy /api/remove-watermark
    if (url.pathname === "/api/remove-watermark") {
      const expensiveCheck = expensiveInferenceLimiter.check(clientIp);
      if (!expensiveCheck.allowed) {
        return applySecurityHeaders(
          createRateLimitResponse(
            expensiveCheck.retryAfter,
            "Watermark Remover is busy. Rate limit exceeded, please wait a moment."
          )
        );
      }

      const creditCheck = await enforceToolCreditsAndLimits(request, "remove-watermark", clientIp);
      if (!creditCheck.allowed) {
        const errRes = applySecurityHeaders(
          createSafeErrorResponse(creditCheck.status || 402, creditCheck.error || "Credit limit exceeded.")
        );
        if (creditCheck.guestCookieHeader) {
          errRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
        }
        return errRes;
      }

      try {
        const bodyText = await request.text();
        if (bodyText.length > 55 * 1024 * 1024) {
          creditCheck.refund?.("Oversized payload");
          return applySecurityHeaders(
            createSafeErrorResponse(413, "File size exceeds the 30 MB limit. Please upload a smaller file.")
          );
        }

        let parsed: any;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          creditCheck.refund?.("Invalid JSON");
          return applySecurityHeaders(createSafeErrorResponse(400, "Invalid JSON payload."));
        }

        const rawB64 = parsed.base64Image || parsed.image;
        if (!rawB64) {
          creditCheck.refund?.("No image payload");
          return applySecurityHeaders(createSafeErrorResponse(400, "No image payload provided."));
        }

        const validation = validateBase64Payload(rawB64, TOOL_PROFILES["remove-watermark"]);
        if (!validation.valid) {
          creditCheck.refund?.(validation.error || "Invalid file format");
          return applySecurityHeaders(
            createSafeErrorResponse(validation.status || 400, validation.error || "Invalid file format.")
          );
        }

        let pythonResponse: Response;
        try {
          pythonResponse = await fetch("http://127.0.0.1:5001/remove-watermark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyText,
          });
        } catch {
          console.warn("[Server] Python watermark backend unreachable. Auto-spawning port 5001...");
          const pyCmd = getPythonCommand();
          const serverScript = path.join(process.cwd(), "scripts", "watermark_server.py");
          const child = spawn(pyCmd, [serverScript, "5001"], { detached: true, stdio: "ignore" });
          child.on("error", (err) => {
            console.warn("[Server] Watermark backend spawn error:", err.message);
          });
          child.unref();
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 800));
            try {
              const ping = await fetch("http://127.0.0.1:5001/ping");
              if (ping.ok) break;
            } catch {}
          }
          pythonResponse = await fetch("http://127.0.0.1:5001/remove-watermark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyText,
          });
        }

        if (!pythonResponse.ok) {
          creditCheck.refund?.(`Python status ${pythonResponse.status}`);
        } else {
          creditCheck.recordSuccess?.();
        }

        const finalRes = applySecurityHeaders(pythonResponse);
        if (creditCheck.guestCookieHeader) {
          finalRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
        }
        return finalRes;
      } catch (err: any) {
        creditCheck.refund?.(err?.message || "Internal failure");
        console.error("Proxy error /api/remove-watermark:", err?.message || err);
        return applySecurityHeaders(
          createSafeErrorResponse(502, "Watermark Engine is busy. Please try again in a few moments.")
        );
      }
    }

    // 5. Proxy /api/blur-face & /api/detect-faces
    if (url.pathname === "/api/blur-face" || url.pathname === "/api/detect-faces") {
      const expensiveCheck = expensiveInferenceLimiter.check(clientIp);
      if (!expensiveCheck.allowed) {
        return applySecurityHeaders(
          createRateLimitResponse(
            expensiveCheck.retryAfter,
            "Face Blur Engine is busy. Rate limit exceeded, please wait a moment."
          )
        );
      }

      const creditCheck = await enforceToolCreditsAndLimits(request, "blur-face", clientIp);
      if (!creditCheck.allowed) {
        const errRes = applySecurityHeaders(
          createSafeErrorResponse(creditCheck.status || 402, creditCheck.error || "Credit limit exceeded.")
        );
        if (creditCheck.guestCookieHeader) {
          errRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
        }
        return errRes;
      }

      try {
        const bodyText = await request.text();
        if (bodyText.length > 55 * 1024 * 1024) {
          creditCheck.refund?.("Oversized payload");
          return applySecurityHeaders(
            createSafeErrorResponse(413, "File size exceeds the 30 MB limit. Please upload a smaller file.")
          );
        }

        let parsed: any;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          creditCheck.refund?.("Invalid JSON");
          return applySecurityHeaders(createSafeErrorResponse(400, "Invalid JSON payload."));
        }

        const rawB64 = parsed.base64Image || parsed.image;
        if (!rawB64) {
          creditCheck.refund?.("No image payload");
          return applySecurityHeaders(createSafeErrorResponse(400, "No image payload provided."));
        }

        const validation = validateBase64Payload(rawB64, TOOL_PROFILES["blur-face"]);
        if (!validation.valid) {
          creditCheck.refund?.(validation.error || "Invalid file format");
          return applySecurityHeaders(
            createSafeErrorResponse(validation.status || 400, validation.error || "Invalid file format.")
          );
        }

        const targetPath = url.pathname === "/api/detect-faces" ? "/detect-faces" : "/blur-face";
        let pythonResponse: Response;
        try {
          pythonResponse = await fetch(`http://127.0.0.1:5001${targetPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyText,
          });
        } catch {
          console.warn("[Server] Python face blur backend unreachable. Auto-spawning port 5001...");
          const pyCmd = getPythonCommand();
          const serverScript = path.join(process.cwd(), "scripts", "watermark_server.py");
          const child = spawn(pyCmd, [serverScript, "5001"], { detached: true, stdio: "ignore" });
          child.on("error", (err) => {
            console.warn("[Server] Face blur backend spawn error:", err.message);
          });
          child.unref();
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 800));
            try {
              const ping = await fetch("http://127.0.0.1:5001/ping");
              if (ping.ok) break;
            } catch {}
          }
          pythonResponse = await fetch(`http://127.0.0.1:5001${targetPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyText,
          });
        }

        if (!pythonResponse.ok) {
          creditCheck.refund?.(`Python status ${pythonResponse.status}`);
        } else {
          creditCheck.recordSuccess?.();
        }

        const finalRes = applySecurityHeaders(pythonResponse);
        if (creditCheck.guestCookieHeader) {
          finalRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
        }
        return finalRes;
      } catch (err: any) {
        creditCheck.refund?.(err?.message || "Internal failure");
        console.error(`Proxy error ${url.pathname}:`, err?.message || err);
        return applySecurityHeaders(
          createSafeErrorResponse(502, "Face Blur Engine is busy. Please try again in a few moments.")
        );
      }
    }

    // 6. Admin Authentication Endpoints
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      try {
        const clientIp = extractClientIp(request);
        const body = (await request.json()) as any;
        const username = String(body.username || "");
        const password = String(body.password || "");
        const bgPin = String(body.bgPin || body.pin || "");

        const authResult = verifyAdminLogin(username, password, clientIp, bgPin);
        if (!authResult.success) {
          const status = authResult.locked ? 429 : 401;
          return applySecurityHeaders(
            createSafeErrorResponse(
              status,
              authResult.message || "Invalid administrator credentials or BG PIN."
            )
          );
        }

        const adminUsername = process.env["ADMIN_USERNAME"] || "admin@bg.tools";
        const token = createAdminSessionToken({ username: adminUsername });
        const isProd = process.env["NODE_ENV"] === "production";
        const secureFlag = isProd ? "; Secure" : "";
        const cookieVal = `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200${secureFlag}`;

        return applySecurityHeaders(
          new Response(
            JSON.stringify({
              success: true,
              token,
              user: {
                id: "adm_super_01",
                username: adminUsername,
                name: "Admin Control Center",
                role: "superadmin",
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": cookieVal,
              },
            }
          )
        );
      } catch {
        return applySecurityHeaders(createSafeErrorResponse(400, "Malformed authentication request."));
      }
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      const clearCookie = "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": clearCookie,
          },
        })
      );
    }

    if (url.pathname === "/api/admin/session" && request.method === "GET") {
      const authorized = isAuthorizedAdmin(request);
      if (!authorized) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "No active administrator session.")
        );
      }
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              id: "adm_super_01",
              username: "admin",
              name: "Admin Control Center",
              role: "superadmin",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (url.pathname.startsWith("/api/admin/api-management")) {
      return handleAdminApiManagement(request);
    }

    // 6.5 User Authentication Endpoints
    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleSignup(request, clientIp);
    }

    if (url.pathname === "/api/auth/verify-otp" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleVerifyOtp(request, clientIp);
    }

    if (url.pathname === "/api/auth/resend-otp" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleResendOtp(request, clientIp);
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleLogin(request, clientIp);
    }

    if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleForgotPassword(request, clientIp);
    }

    if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleResetPassword(request, clientIp);
    }

    if (url.pathname === "/api/auth/profile" && (request.method === "PUT" || request.method === "POST")) {
      return handleUpdateProfile(request);
    }

    if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleChangePassword(request, clientIp);
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request);
    }

    if (url.pathname === "/api/auth/deduct-credit" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleDeductCredit(request, clientIp);
    }

    // 6.51 Customer Dashboard API Key Management
    if (url.pathname === "/api/user/api-keys") {
      return handleUserApiKeys(request);
    }

    if (url.pathname === "/api/user/api-keys/revoke") {
      return handleUserApiKeyAction(request, "revoke");
    }

    if (url.pathname === "/api/user/api-keys/rotate") {
      return handleUserApiKeyAction(request, "rotate");
    }

    // 6.52 User Notifications Endpoint
    if (url.pathname === "/api/user/notifications") {
      const auth = getUserFromRequest(request);
      const reqUserId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const effectiveUserId = auth?.user?.id || (reqUserId && usersRepo.findById(reqUserId) ? reqUserId : null);

      if (request.method === "GET") {
        if (!effectiveUserId) {
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, notifications: [], unreadCount: 0 }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        const notifs = notificationsRepo.getUserNotifications(effectiveUserId, 50);
        const unreadCount = notificationsRepo.getUnreadCount(effectiveUserId);
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, notifications: notifs, unreadCount }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          if (body.all && effectiveUserId) {
            notificationsRepo.markAllAsRead(effectiveUserId);
            return applySecurityHeaders(
              new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }
          if (body.id) {
            notificationsRepo.markAsRead(String(body.id));
            return applySecurityHeaders(
              new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }
          return applySecurityHeaders(createSafeErrorResponse(400, "Missing notification ID."));
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Invalid notification request."));
        }
      }

      if (request.method === "DELETE") {
        const notifId = url.searchParams.get("id");
        if (notifId) {
          notificationsRepo.delete(notifId);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        return applySecurityHeaders(createSafeErrorResponse(400, "Missing notification ID."));
      }
    }

    // 6.53 Admin Send User-Specific Notification
    if (url.pathname === "/api/admin/notifications/send" && request.method === "POST") {
      if (!isAuthorizedAdmin(request)) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "Unauthorized: Administrator access required.")
        );
      }
      try {
        const body = await request.json().catch(() => ({}));
        if (!body.title || !body.message) {
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Title and message are required.")
          );
        }
        const notif = notificationsRepo.create({
          userId: body.userId || null,
          title: String(body.title),
          message: String(body.message),
          type: body.type || "admin",
          badge: body.badge || "Admin Message",
          link: body.link || null,
          actionText: body.actionText || null,
        });
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, notification: notif }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } catch (err: any) {
        return applySecurityHeaders(
          createSafeErrorResponse(500, err?.message || "Failed to dispatch notification.")
        );
      }
    }

    // 6.54 User Payments & Slips Endpoint
    if (url.pathname === "/api/user/payments" && request.method === "GET") {
      const auth = getUserFromRequest(request);
      const reqUserId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const effectiveUserId = auth?.user?.id || (reqUserId && usersRepo.findById(reqUserId) ? reqUserId : null);

      if (!effectiveUserId) {
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, payments: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      const payments = paymentsRepo.getUserPayments(effectiveUserId, 100);
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true, payments }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // 6.55 User Credit Statement / Ledger Endpoint
    if (url.pathname === "/api/user/statement" && request.method === "GET") {
      const auth = getUserFromRequest(request);
      const reqUserId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const effectiveUserId = auth?.user?.id || (reqUserId && usersRepo.findById(reqUserId) ? reqUserId : null);

      if (!effectiveUserId) {
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, ledger: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      const ledger = creditLedgerRepo.getUserHistory(effectiveUserId, 200);
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true, ledger }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // 6.56 User Tool Activity Calendar Events Endpoint
    if (url.pathname === "/api/user/activity") {
      const clientIp = extractClientIp(request);
      const auth = getUserFromRequest(request);
      const reqUserId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const effectiveUserId = auth?.user?.id || (reqUserId && usersRepo.findById(reqUserId) ? reqUserId : null);

      if (request.method === "GET") {
        try {
          let toolRecords: any[] = [];
          if (effectiveUserId) {
            const ledgerEntries = creditLedgerRepo.getUserHistory(effectiveUserId, 200)
              .filter(e => e.type === "tool_usage" || e.tool_slug);
            toolRecords = ledgerEntries.map(e => ({
              id: e.id,
              toolSlug: e.tool_slug || "tool",
              toolName: e.description?.replace("Credit deduction for ", "") || e.tool_slug || "Image Tool",
              cost: Math.abs(e.amount),
              createdAt: e.created_at,
              status: "success",
            }));
          }
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, activities: toolRecords }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, activities: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const toolSlug = String(body.toolSlug || "tool");
          const toolName = String(body.toolName || toolSlug);
          const durationMs = Number(body.durationMs) || 0;

          toolUsageRepo.record({
            toolSlug,
            toolName,
            userId: effectiveUserId || undefined,
            ip: clientIp,
            durationMs,
            success: true,
          });

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Failed to record tool activity."));
        }
      }
    }

    // 6.55 Location and Country Geolocation Endpoint
    if (url.pathname === "/api/geo/detect") {
      const clientIp = extractClientIp(request);
      const cfCountry = (request.headers.get("cf-ipcountry") || request.headers.get("x-country-code") || "").toUpperCase();
      const isLocal = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.startsWith("192.168.") || clientIp.startsWith("10.");
      const countryCode = cfCountry || (isLocal ? "IN" : "IN");
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            ip: clientIp,
            countryCode,
            country: countryCode === "IN" ? "India" : countryCode,
            currency: countryCode === "IN" ? "INR" : "USD",
            dialCode: countryCode === "IN" ? "+91" : "+1",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // 6.6 Razorpay Payments Endpoints
    if (url.pathname === "/api/payments/create-order" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleCreatePaymentOrder(request, clientIp);
    }

    if (url.pathname === "/api/payments/verify" && request.method === "POST") {
      const clientIp = extractClientIp(request);
      return handleVerifyPayment(request, clientIp);
    }

    if (url.pathname === "/api/payments/orders") {
      if (request.method === "GET") {
        return handleListPayments(request);
      }
      if (request.method === "DELETE") {
        return handleDeletePaymentOrder(request);
      }
    }

    // 6.61 Admin Coffee Supporters & Gift Endpoints
    if (url.pathname === "/api/admin/coffee/supporters" && request.method === "GET") {
      if (!isAuthorizedAdmin(request)) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "Unauthorized: Administrator access required.")
        );
      }
      try {
        const supporters = paymentsRepo.getCoffeeSupporters(150);
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, supporters }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } catch (err: any) {
        return applySecurityHeaders(
          createSafeErrorResponse(500, err?.message || "Failed to load coffee supporters.")
        );
      }
    }

    if (url.pathname === "/api/admin/coffee/gift" && request.method === "POST") {
      if (!isAuthorizedAdmin(request)) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "Unauthorized: Administrator access required.")
        );
      }
      try {
        const body = await request.json().catch(() => ({}));
        const { userId, amount, note } = body;
        const numAmount = Number(amount);
        if (!userId || isNaN(numAmount) || numAmount <= 0) {
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Valid userId and positive gift amount are required.")
          );
        }

        const grantResult = creditLedgerRepo.adminGrantCredits(
          userId,
          numAmount,
          note || "Founder Coffee Gift (Gold Coins)"
        );

        if (!grantResult.success) {
          return applySecurityHeaders(
            createSafeErrorResponse(400, grantResult.error || "Failed to gift credits.")
          );
        }

        // Send instant notification to user
        try {
          notificationsRepo.create({
            userId,
            title: `🎁 Founder's Gift: +${numAmount} Gold Coins!`,
            message: note || `A special thank-you gift from Aakash & Piyush for your coffee support! We added ${numAmount} Gold Coins to your account balance.`,
            type: "token",
            badge: "Founder Gift",
            link: "/account",
            actionText: "View Balance",
          });
        } catch {}

        const user = usersRepo.findById(userId);

        return applySecurityHeaders(
          new Response(
            JSON.stringify({
              success: true,
              message: `Gifted ${numAmount} Gold Coins successfully.`,
              newBalance: grantResult.newBalance,
              user: user ? toSafeUser(user) : null,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      } catch (err: any) {
        return applySecurityHeaders(
          createSafeErrorResponse(500, err?.message || "Failed to award gift.")
        );
      }
    }

    // 6.7 Promo Code Endpoints
    if (url.pathname === "/api/promocodes/validate" && request.method === "POST") {
      try {
        const body = await request.json();
        const { code, amount } = body;
        const result = promoCodesRepo.validate(code, Number(amount) || 0);
        return applySecurityHeaders(
          new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } catch {
        return applySecurityHeaders(
          new Response(JSON.stringify({ valid: false, error: "Invalid request payload." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
    }

    if (url.pathname === "/api/admin/promocodes") {
      if (!isAuthorizedAdmin(request)) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "Unauthorized: Administrator access required.")
        );
      }
      if (request.method === "GET") {
        const promos = promoCodesRepo.getAll();
        return applySecurityHeaders(
          new Response(JSON.stringify(promos), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      if (request.method === "POST") {
        try {
          const body = await request.json();
          if (body.id) {
            const updated = promoCodesRepo.update(body.id, body);
            return applySecurityHeaders(
              new Response(JSON.stringify(updated), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          } else {
            const created = promoCodesRepo.create(body);
            return applySecurityHeaders(
              new Response(JSON.stringify(created), {
                status: 201,
                headers: { "Content-Type": "application/json" },
              })
            );
          }
        } catch (err: any) {
          return applySecurityHeaders(
            createSafeErrorResponse(400, err?.message || "Failed to save promo code.")
          );
        }
      }
    }

    if (url.pathname.startsWith("/api/admin/promocodes/") && request.method === "DELETE") {
      if (!isAuthorizedAdmin(request)) {
        return applySecurityHeaders(
          createSafeErrorResponse(401, "Unauthorized: Administrator access required.")
        );
      }
      const id = url.pathname.replace("/api/admin/promocodes/", "");
      const deleted = promoCodesRepo.delete(id);
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: deleted }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // 7. /api/contact
    if (url.pathname === "/api/contact") {
      if (request.method === "GET") {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view support inquiries.")
          );
        }

        try {
          const inquiries = inquiriesRepo.getAll();
          return applySecurityHeaders(
            new Response(JSON.stringify(inquiries), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to read support inquiries.")
          );
        }
      }

      if (request.method === "POST") {
        const contactCheck = contactLimiter.check(clientIp);
        if (!contactCheck.allowed) {
          return applySecurityHeaders(
            createRateLimitResponse(contactCheck.retryAfter, "Too many messages sent. Please wait before submitting again.")
          );
        }

        const contentLengthHeader = request.headers.get("content-length");
        if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 64 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "Contact payload exceeds size limit (64 KB).")
          );
        }

        try {
          const body = await request.json();
          const validation = validateContactSubmission(body);
          if (!validation.valid || !validation.ticket) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, validation.error || "Invalid contact form submission.")
            );
          }

          const savedInquiry = inquiriesRepo.create({
            id: validation.ticket.id,
            name: validation.ticket.name,
            email: validation.ticket.email,
            subject: validation.ticket.subject,
            message: validation.ticket.message,
            status: validation.ticket.status,
            ip: clientIp,
          });

          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: true,
                ticket: {
                  id: savedInquiry.id,
                  createdAt: savedInquiry.submitted_at,
                  status: savedInquiry.status,
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Malformed contact form submission.")
          );
        }
      }
    }

    // 8. /api/tools-config
    if (url.pathname === "/api/tools-config") {
      if (request.method === "GET") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view tools configuration.")
          );
        }

        try {
          const configs = configRepo.getToolsConfig();
          return applySecurityHeaders(
            new Response(JSON.stringify(configs), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to read tools configuration.")
          );
        }
      }

      if (request.method === "POST") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to update tools configuration.")
          );
        }

        const contentLengthHeader = request.headers.get("content-length");
        if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 1024 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "Configuration payload exceeds 1 MB limit.")
          );
        }

        try {
          const body = await request.json();
          const validation = validateToolsConfigPayload(body);
          if (!validation.valid || !validation.sanitized) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, validation.error || "Invalid tools configuration payload.")
            );
          }

          configRepo.setToolsConfig(validation.sanitized as any);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, count: validation.sanitized.length }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Malformed JSON request body."));
        }
      }
    }

    // 9. /api/plans-config
    if (url.pathname === "/api/plans-config") {
      if (request.method === "GET") {
        try {
          const plans = configRepo.getPlansConfig();
          return applySecurityHeaders(
            new Response(JSON.stringify(plans), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
          );
        }
      }

      if (request.method === "POST") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to update plans configuration.")
          );
        }

        try {
          const body = await request.json();
          if (!Array.isArray(body)) {
            return applySecurityHeaders(createSafeErrorResponse(400, "Plans configuration must be an array."));
          }
          configRepo.setPlansConfig(body);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Failed to update plans configuration."));
        }
      }
    }

    // 10. /api/users
    if (url.pathname === "/api/users") {
      if (request.method === "GET") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view user records.")
          );
        }

        try {
          const safeUsers = usersRepo.getAllSafe();
          return applySecurityHeaders(
            new Response(JSON.stringify(safeUsers), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to retrieve user accounts.")
          );
        }
      }

      if (request.method === "POST") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to update user records.")
          );
        }

        try {
          const body = await request.json();
          const incomingUsers = Array.isArray(body) ? body : body?.users;
          if (!Array.isArray(incomingUsers)) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, "Invalid payload: users must be an array.")
            );
          }

          usersRepo.batchSave(incomingUsers.map(sanitizeUser));

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, count: incomingUsers.length }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Failed to update users data."));
        }
      }
    }


    // 11. /api/telemetry (hit, heartbeat, analytics)
    if (url.pathname.startsWith("/api/telemetry")) {
      if (request.method === "GET") {
        try {
          const daysParam = parseInt(url.searchParams.get("days") || "7", 10);
          const days = isNaN(daysParam) || daysParam <= 0 ? 7 : Math.min(daysParam, 90);
          const analytics = telemetryRepo.getAnalytics(days);

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, data: analytics }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0",
              },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to retrieve telemetry analytics.")
          );
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const isHeartbeat = url.pathname.endsWith("/heartbeat") || body?.action === "heartbeat";

          if (isHeartbeat) {
            telemetryRepo.recordHeartbeat({
              sessionId: body?.sessionId || "sess_unknown",
              path: body?.path,
              device: body?.device,
              timezone: body?.timezone,
              language: body?.language,
              ip: clientIp,
              headers: request.headers,
            });
            return applySecurityHeaders(
              new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }

          // Hit
          const result = telemetryRepo.recordHit({
            sessionId: body?.sessionId,
            path: body?.path || "/",
            title: body?.title,
            device: body?.device,
            os: body?.os,
            browser: body?.browser,
            referrer: body?.referrer,
            timezone: body?.timezone,
            language: body?.language,
            ip: clientIp,
            headers: request.headers,
          });

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, geo: result.geo }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Failed to process telemetry event.")
          );
        }
      }
    }

    // 12. /api/tool-gear (Tool execution tracking & memory diagnostics)
    if (url.pathname === "/api/tool-gear") {
      if (request.method === "GET") {
        try {
          const rawTimeframe = (url.searchParams.get("timeframe") || "1d").toLowerCase();
          const validTimeframes = ["1d", "yesterday", "7d", "30d"] as const;
          const timeframe = validTimeframes.includes(rawTimeframe as any)
            ? (rawTimeframe as "1d" | "yesterday" | "7d" | "30d")
            : "1d";

          const { getDb } = await import("@/lib/db/client");
          const db = getDb();
          db.prepare("DELETE FROM tool_usage WHERE id LIKE 'use_seed_%'").run();
          db.prepare("DELETE FROM telemetry_hits WHERE id LIKE 'hit_ga_%'").run();
          db.prepare("DELETE FROM telemetry_sessions WHERE session_id LIKE 'ga_sess_%'").run();

          const report = toolUsageRepo.getDetailedReport(timeframe);

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, data: report }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0",
              },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to generate tool report.")
          );
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const toolSlug = body?.toolSlug;
          if (!toolSlug) {
            return applySecurityHeaders(createSafeErrorResponse(400, "Missing toolSlug"));
          }

          const record = toolUsageRepo.record({
            toolSlug,
            toolName: body?.toolName,
            userId: body?.userId,
            ip: clientIp,
            success: body?.success !== false,
            durationMs: body?.durationMs,
            fileSizeBytes: body?.fileSizeBytes,
            memoryBytes: body?.memoryBytes,
          });

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, recordId: record.id }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Failed to record tool execution."));
        }
      }
    }

    // 13. Fallthrough to TanStack Start SSR & App Routes
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      const errRes = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return applySecurityHeaders(errRes);
    }
  },
};
