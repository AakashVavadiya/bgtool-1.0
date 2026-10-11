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
} from "./lib/security";

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
      execSync(`"${pythonPath}" --version`, { stdio: "ignore" });
      return pythonPath;
    } catch {
      return pythonPath;
    }
  }
  const commands = ["python", "python3", "py"];
  for (const cmd of commands) {
    try {
      execSync(`"${cmd}" --version`, { stdio: "ignore" });
      return cmd;
    } catch {
      // try next
    }
  }
  return "python";
}

let isSpawningPython = false;

async function ensurePythonServerRunning(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(2000) });
      if (ping.ok) return true;
    } catch {}
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
  }

  if (isSpawningPython) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(2000) });
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
    child.unref();

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(2000) });
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = extractClientIp(request);

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
        return applySecurityHeaders(pythonResponse);
      } catch (err: any) {
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

        const validation = validateBase64Payload(rawB64, TOOL_PROFILES["remove-watermark"]);
        if (!validation.valid) {
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
        return applySecurityHeaders(pythonResponse);
      } catch (err: any) {
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

        const validation = validateBase64Payload(rawB64, TOOL_PROFILES["blur-face"]);
        if (!validation.valid) {
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
        return applySecurityHeaders(pythonResponse);
      } catch (err: any) {
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

        const authResult = verifyAdminLogin(username, password, clientIp);
        if (!authResult.success) {
          const status = authResult.locked ? 429 : 401;
          return applySecurityHeaders(
            createSafeErrorResponse(
              status,
              authResult.message || "Invalid administrator username or password."
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

    // 7. /api/contact
    if (url.pathname === "/api/contact") {
      const dataDir = path.join(process.cwd(), "data");
      const filePath = path.join(dataDir, "contact-inquiries.json");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(filePath)) {
        atomicWriteJson(filePath, []);
      }

      if (request.method === "GET") {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view support inquiries.")
          );
        }

        try {
          const content = fs.readFileSync(filePath, "utf-8");
          return applySecurityHeaders(
            new Response(content || "[]", {
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

          let current: any[] = [];
          try {
            if (fs.existsSync(filePath)) {
              current = JSON.parse(fs.readFileSync(filePath, "utf-8") || "[]");
              if (!Array.isArray(current)) current = [];
            }
          } catch {
            current = [];
          }

          // Bounded file retention: cap at 500 tickets
          current.unshift(validation.ticket);
          if (current.length > 500) {
            current = current.slice(0, 500);
          }

          atomicWriteJson(filePath, current);

          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: true,
                ticket: {
                  id: validation.ticket.id,
                  createdAt: validation.ticket.createdAt,
                  status: validation.ticket.status,
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
      const dataDir = path.join(process.cwd(), "data");
      const filePath = path.join(dataDir, "tools-config.json");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(filePath)) {
        atomicWriteJson(filePath, []);
      }

      if (request.method === "GET") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view tools configuration.")
          );
        }

        try {
          const content = fs.readFileSync(filePath, "utf-8");
          return applySecurityHeaders(
            new Response(content || "[]", {
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

          atomicWriteJson(filePath, validation.sanitized);
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
      const dataDir = path.join(process.cwd(), "data");
      const filePath = path.join(dataDir, "plans-config.json");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (request.method === "GET") {
        try {
          if (!fs.existsSync(filePath)) {
            return applySecurityHeaders(
              new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
            );
          }
          const content = fs.readFileSync(filePath, "utf-8");
          return applySecurityHeaders(
            new Response(content || "[]", {
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
          atomicWriteJson(filePath, body);
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
      const dataDir = path.join(process.cwd(), "data");
      const filePath = path.join(dataDir, "users.json");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (request.method === "GET") {
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view user records.")
          );
        }

        try {
          if (!fs.existsSync(filePath)) {
            return applySecurityHeaders(
              new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
            );
          }

          // Migrate any legacy plaintext passwords to scrypt hashes
          const users = migrateUsersData(filePath);
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          let modified = false;

          if (Array.isArray(users)) {
            for (const u of users) {
              if (u.lastCreditReset !== today) {
                u.freeCredits = 10;
                if (typeof u.paidCredits !== "number") {
                  u.paidCredits = Math.max(0, (u.credits || 0) > 10 ? Math.round(((u.credits || 0) - 10) * 100) / 100 : 0);
                }
                u.credits = Math.round((u.freeCredits + u.paidCredits) * 100) / 100;
                u.lastCreditReset = today;
                modified = true;
              }
            }
            if (modified) {
              atomicWriteJson(filePath, users);
            }
          }

          // Strip all sensitive fields (passwords, hashes, IPs, tokens)
          const safeUsers = Array.isArray(users) ? users.map(sanitizeUser) : [];

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

          // Preserve existing password hashes so credit adjustments don't wipe passwords
          let currentUsers: any[] = [];
          if (fs.existsSync(filePath)) {
            try {
              currentUsers = JSON.parse(fs.readFileSync(filePath, "utf-8") || "[]");
            } catch {}
          }

          const existingMap = new Map<string, any>();
          for (const u of currentUsers) {
            if (u.id) existingMap.set(u.id, u);
            if (u.email) existingMap.set(u.email.toLowerCase(), u);
          }

          const mergedUsers = incomingUsers.map((u: any) => {
            const existing = existingMap.get(u.id) || existingMap.get((u.email || "").toLowerCase());
            const passwordHash = existing?.passwordHash || (u.passwordHash ? u.passwordHash : undefined);
            const safe = sanitizeUser(u);
            return {
              ...safe,
              ...(passwordHash ? { passwordHash } : {}),
            };
          });

          atomicWriteJson(filePath, mergedUsers);

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(createSafeErrorResponse(400, "Failed to update users data."));
        }
      }
    }


    // 10. Fallthrough to TanStack Start SSR & App Routes
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
