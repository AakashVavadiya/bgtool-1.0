import { createFileRoute } from "@tanstack/react-router";
import fs from "fs";
import path from "path";
import {
  isAuthorizedAdmin,
  validateContactSubmission,
  atomicWriteJson,
} from "@/lib/security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "@/lib/security/headers";
import { contactLimiter, extractClientIp, createRateLimitResponse } from "@/lib/security/rate-limiter";

const MAX_STORED_INQUIRIES = 500;

function getInquiriesFilePath() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, "contact-inquiries.json");
  if (!fs.existsSync(filePath)) {
    atomicWriteJson(filePath, []);
  }
  return filePath;
}

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Enforce Server-Side Administrator Authentication
        if (!isAuthorizedAdmin(request)) {
          return applySecurityHeaders(
            createSafeErrorResponse(401, "Unauthorized: Administrator access required to view support inquiries.")
          );
        }

        try {
          const filePath = getInquiriesFilePath();
          const content = fs.readFileSync(filePath, "utf-8");
          return applySecurityHeaders(
            new Response(content || "[]", {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch {
          return applySecurityHeaders(
            createSafeErrorResponse(500, "Failed to read inquiries.")
          );
        }
      },

      POST: async ({ request }) => {
        // 1. IP-based rate limiting for contact form
        const clientIp = extractClientIp(request);
        const rateCheck = contactLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            createRateLimitResponse(rateCheck.retryAfter, "Too many messages sent. Please wait before submitting again.")
          );
        }

        // 2. Content-type check
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return applySecurityHeaders(
            createSafeErrorResponse(415, "Unsupported media type. JSON body required.")
          );
        }

        // 3. Body size limit (max 64 KB for contact form)
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 64 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "Contact inquiry payload exceeds size limit (64 KB).")
          );
        }

        try {
          const body = await request.json();

          // 4. Strict server-side field validation & HTML sanitization
          const validation = validateContactSubmission(body);
          if (!validation.valid || !validation.ticket) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, validation.error || "Invalid contact form submission.")
            );
          }

          const filePath = getInquiriesFilePath();
          let current: any[] = [];
          try {
            current = JSON.parse(fs.readFileSync(filePath, "utf-8") || "[]");
            if (!Array.isArray(current)) current = [];
          } catch {
            current = [];
          }

          // 5. Bounded file growth: FIFO retention policy (max 500 tickets)
          current.unshift(validation.ticket);
          if (current.length > MAX_STORED_INQUIRIES) {
            current = current.slice(0, MAX_STORED_INQUIRIES);
          }

          // Safe atomic write
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
      },
    },
  },
});
