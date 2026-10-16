import path from "path";
import fs from "fs";
import { execSync, spawn } from "child_process";

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

let isSpawning5000 = false;
let isSpawning5001 = false;

export async function ensureBgEngineRunning(): Promise<boolean> {
  try {
    const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(400) });
    if (ping.ok) return true;
  } catch {}

  if (isSpawning5000) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 150));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  }

  isSpawning5000 = true;
  try {
    const pyCmd = getPythonCommand();
    const serverScript = path.join(process.cwd(), "scripts", "bg_remover_server.py");
    console.log(`[Engine Gateway] Spawning Python background remover: ${pyCmd} "${serverScript}" 5000`);
    const child = spawn(pyCmd, [serverScript, "5000"], { detached: true, stdio: "ignore" });
    child.on("error", (err) => console.warn("[Engine Gateway] Port 5000 spawn error:", err.message));
    child.unref();

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 150));
      try {
        const ping = await fetch("http://127.0.0.1:5000/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  } catch (err) {
    console.error("[Engine Gateway] Failed to spawn port 5000:", err);
    return false;
  } finally {
    isSpawning5000 = false;
  }
}

export async function ensureWatermarkEngineRunning(): Promise<boolean> {
  try {
    const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(400) });
    if (ping.ok) return true;
  } catch {}

  if (isSpawning5001) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 150));
      try {
        const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  }

  isSpawning5001 = true;
  try {
    const pyCmd = getPythonCommand();
    const serverScript = path.join(process.cwd(), "scripts", "watermark_server.py");
    console.log(`[Engine Gateway] Spawning Python watermark/tools server: ${pyCmd} "${serverScript}" 5001`);
    const child = spawn(pyCmd, [serverScript, "5001"], { detached: true, stdio: "ignore" });
    child.on("error", (err) => console.warn("[Engine Gateway] Port 5001 spawn error:", err.message));
    child.unref();

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 150));
      try {
        const ping = await fetch("http://127.0.0.1:5001/ping", { signal: AbortSignal.timeout(300) });
        if (ping.ok) return true;
      } catch {}
    }
    return false;
  } catch (err) {
    console.error("[Engine Gateway] Failed to spawn port 5001:", err);
    return false;
  } finally {
    isSpawning5001 = false;
  }
}

export async function callEngine(
  targetUrl: string,
  payload: Record<string, any>,
  port: 5000 | 5001,
  timeoutMs = 60000
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  const ensureRunning = port === 5000 ? ensureBgEngineRunning : ensureWatermarkEngineRunning;

  let attempt = 0;
  while (attempt < 2) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success) {
        return {
          ok: false,
          status: response.status || 500,
          error: json?.error || `Engine error (status ${response.status})`,
        };
      }

      return {
        ok: true,
        status: response.status,
        data: json,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === 1) {
        console.warn(`[Engine Gateway] Failed connecting to ${targetUrl}. Attempting auto-spawn...`);
        const online = await ensureRunning();
        if (!online) {
          return { ok: false, status: 503, error: `Engine on port ${port} is offline and failed to start.` };
        }
        // retry on second attempt
        continue;
      }
      return { ok: false, status: 503, error: err?.message || `Failed to communicate with engine on port ${port}` };
    }
  }

  return { ok: false, status: 503, error: "Engine connection retry exhausted." };
}
