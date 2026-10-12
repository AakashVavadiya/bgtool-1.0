import { createFileRoute } from "@tanstack/react-router";
import { execSync, spawn } from "child_process";
import path from "path";
import {
  validateBase64Payload,
  TOOL_PROFILES,
  expensiveInferenceLimiter,
  extractClientIp,
  createRateLimitResponse,
  applySecurityHeaders,
  createSafeErrorResponse,
  enforceToolCreditsAndLimits,
} from "@/lib/security";

function getPythonCommand(): string {
  if (process.env["PYTHON_PATH"]) return process.env["PYTHON_PATH"];
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
  // 1. Fast single check (timeout 300ms)
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
    console.log(`[Auto-Spawn Dev] Launching Python background remover server: ${pyCmd} "${serverScript}" 5000`);
    const child = spawn(pyCmd, [serverScript, "5000"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    for (let i = 0; i < 35; i++) {
      await new Promise((r) => setTimeout(r, 120));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) {
          console.log("[Auto-Spawn Dev] Python background remover server online!");
          return true;
        }
      } catch {}
    }
    return false;
  } catch (err) {
    console.error("[Auto-Spawn Dev] Spawn failed:", err);
    return false;
  } finally {
    isSpawningPython = false;
  }
}

// Auto-warmup Python server in background
if (typeof process !== "undefined") {
  setTimeout(() => {
    ensurePythonServerRunning().catch(() => {});
  }, 100);
}

export const Route = createFileRoute("/api/remove-bg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp = extractClientIp(request);
        const rateCheck = expensiveInferenceLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            createRateLimitResponse(rateCheck.retryAfter, "AI Model is busy. Rate limit exceeded, please wait.")
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
              headers: { "Content-Type": "application/json" },
              body: bodyText,
              signal: AbortSignal.timeout(30000),
            });
          } catch {
            console.warn("[API Route] Python backend unreachable. Auto-spawning...");
            const running = await ensurePythonServerRunning();
            if (!running) {
              creditCheck.refund?.("Python backend offline");
              return applySecurityHeaders(
                createSafeErrorResponse(503, "AI Model Server is starting up. Please try again in a few moments.")
              );
            }
            pythonResponse = await fetch("http://127.0.0.1:5000/remove-base64", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: bodyText,
              signal: AbortSignal.timeout(60000),
            });
          }

          if (!pythonResponse.ok) {
            creditCheck.refund?.(`Python status ${pythonResponse.status}`);
          } else {
            creditCheck.recordSuccess?.();
          }

          const responseData = await pythonResponse.text();
          const finalRes = applySecurityHeaders(
            new Response(responseData, {
              status: pythonResponse.status,
              headers: { "Content-Type": "application/json" },
            })
          );
          if (creditCheck.guestCookieHeader) {
            finalRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
          }
          return finalRes;
        } catch (err: any) {
          creditCheck.refund?.(err?.message || "Internal failure");
          console.error("API /api/remove-bg error:", err?.message || err);
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to process image. Please try again.")
          );
        }
      },
    },
  },
});
