import { createFileRoute } from "@tanstack/react-router";
import fs from "fs";
import path from "path";
import {
  isAuthorizedAdmin,
  validateToolsConfigPayload,
  atomicWriteJson,
} from "@/lib/security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "@/lib/security/headers";

function getToolsConfigFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, "tools-config.json");
  if (!fs.existsSync(filePath)) {
    atomicWriteJson(filePath, []);
  }
  return filePath;
}

export const Route = createFileRoute("/api/tools-config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view tools configuration.")
          );
        }

        try {
          const filePath = getToolsConfigFilePath();
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
      },

      POST: async ({ request }) => {
        // 1. Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to update tools configuration.")
          );
        }

        // 2. Request body size limit check (max 1 MB for tools config)
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "Request body exceeds maximum size limit (1 MB).")
          );
        }

        try {
          const body = await request.json();

          // 3. Strict schema validation & sanitization (anti-prototype pollution, strict field typing)
          const validation = validateToolsConfigPayload(body);
          if (!validation.valid || !validation.sanitized) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, validation.error || "Invalid tools configuration payload.")
            );
          }

          // 4. Safe atomic write to restricted target file only
          const filePath = getToolsConfigFilePath();
          atomicWriteJson(filePath, validation.sanitized);

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, count: validation.sanitized.length }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Malformed JSON request body.")
          );
        }
      },
    },
  },
});
