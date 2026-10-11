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

let isSpawningWatermarkPython = false;

async function ensureWatermarkServerRunning(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(1500) });
      if (ping.ok) return true;
    } catch {}
    if (attempt < 2) await new Promise((r) => setTimeout(r, 400));
  }

  if (isSpawningWatermarkPython) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 800));
      try {
        const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(1500) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  }

  isSpawningWatermarkPython = true;
  try {
    const pyCmd = getPythonCommand();
    const serverScript = path.join(process.cwd(), "scripts", "watermark_server.py");
    console.log(`[Auto-Spawn] Launching Python Watermark Remover server: ${pyCmd} "${serverScript}" 5001`);
    const child = spawn(pyCmd, [serverScript, "5001"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(1500) });
        if (ping.ok) {
          console.log("[Auto-Spawn] Python Watermark Remover server online!");
          return true;
        }
      } catch {}
    }
    return false;
  } catch (err) {
    console.error("[Auto-Spawn] Spawn failed:", err);
    return false;
  } finally {
    isSpawningWatermarkPython = false;
  }
}

export const Route = createFileRoute("/api/remove-watermark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp = extractClientIp(request);
        const rateCheck = expensiveInferenceLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            createRateLimitResponse(
              rateCheck.retryAfter,
              "Watermark Remover is busy. Rate limit exceeded, please wait."
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
            console.warn("[API Route] Watermark backend unreachable. Auto-spawning port 5001...");
            const running = await ensureWatermarkServerRunning();
            if (!running) {
              return applySecurityHeaders(
                createSafeErrorResponse(
                  503,
                  "Watermark Remover service is starting up. Please try again in a few moments."
                )
              );
            }
            pythonResponse = await fetch("http://127.0.0.1:5001/remove-watermark", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: bodyText,
            });
          }

          const responseData = await pythonResponse.text();
          return applySecurityHeaders(
            new Response(responseData, {
              status: pythonResponse.status,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch (err: any) {
          console.error("API /api/remove-watermark error:", err?.message || err);
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to remove watermark. Please try again.")
          );
        }
      },
    },
  },
});
