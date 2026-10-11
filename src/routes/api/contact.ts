import { createFileRoute } from "@tanstack/react-router";
import {
  isAuthorizedAdmin,
  validateContactSubmission,
} from "@/lib/security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "@/lib/security/headers";
import { contactLimiter, extractClientIp, createRateLimitResponse } from "@/lib/security/rate-limiter";
import { inquiriesRepo } from "@/lib/db";

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
          const inquiries = inquiriesRepo.getAll();
          return applySecurityHeaders(
            new Response(JSON.stringify(inquiries), {
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

        // 2. Strict Payload Size Limit check (max 64 KB for contact message)
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 64 * 1024) {
          return applySecurityHeaders(
            createSafeErrorResponse(413, "Contact payload exceeds size limit (64 KB).")
          );
        }

        try {
          const body = await request.json();

          // 3. Schema validation & anti-XSS HTML sanitization
          const validation = validateContactSubmission(body);
          if (!validation.valid || !validation.ticket) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, validation.error || "Invalid contact form submission.")
            );
          }

          // 4. Save to SQLite repository
          const saved = inquiriesRepo.create({
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
                  id: saved.id,
                  createdAt: saved.submitted_at,
                  status: saved.status,
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
