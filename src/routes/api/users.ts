import { createFileRoute } from "@tanstack/react-router";
import fs from "fs";
import path from "path";
import {
  isAuthorizedAdmin,
  sanitizeUser,
  migrateUsersData,
  atomicWriteJson,
} from "@/lib/security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "@/lib/security/headers";

function getDataFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "users.json");
}

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view user records.")
          );
        }

        try {
          const filePath = getDataFilePath();
          if (!fs.existsSync(filePath)) {
            return applySecurityHeaders(
              new Response(JSON.stringify({ users: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }

          // Migrate any legacy plaintext passwords to scrypt hashes
          const rawUsers = migrateUsersData(filePath);
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          let modified = false;

          if (Array.isArray(rawUsers)) {
            for (const u of rawUsers) {
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
              atomicWriteJson(filePath, rawUsers);
            }
          }

          // NEVER return raw records: explicitly sanitize to strip all sensitive fields
          const safeUsers = Array.isArray(rawUsers) ? rawUsers.map(sanitizeUser) : [];

          return applySecurityHeaders(
            new Response(JSON.stringify({ users: safeUsers }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to retrieve user accounts.")
          );
        }
      },

      POST: async ({ request }) => {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to modify user records.")
          );
        }

        try {
          const filePath = getDataFilePath();
          const body = await request.json();
          const incomingUsers = Array.isArray(body) ? body : body?.users;

          if (!Array.isArray(incomingUsers)) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, "Invalid payload: users must be an array.")
            );
          }

          // Load current users to preserve password hashes and internal credentials
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
          return applySecurityHeaders(
            createSafeErrorResponse(400, "Failed to update user accounts.")
          );
        }
      },
    },
  },
});
