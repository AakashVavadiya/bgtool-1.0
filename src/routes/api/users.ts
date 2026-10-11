import { createFileRoute } from "@tanstack/react-router";
import {
  isAuthorizedAdmin,
  sanitizeUser,
} from "@/lib/security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "@/lib/security/headers";
import { usersRepo } from "@/lib/db";

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
      },

      POST: async ({ request }) => {
        // 1. Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to update user records.")
          );
        }

        // 2. Strict Request Body Validation
        try {
          const body = await request.json();
          const incomingUsers = Array.isArray(body) ? body : body?.users;

          if (!Array.isArray(incomingUsers)) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, "Invalid payload: users must be an array.")
            );
          }

          // 3. Batch save to SQLite repository
          usersRepo.batchSave(incomingUsers.map(sanitizeUser));

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, count: incomingUsers.length }), {
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
