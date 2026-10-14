import { createFileRoute } from "@tanstack/react-router";
import { applySecurityHeaders } from "@/lib/security/headers";
import { extractClientIp } from "@/lib/security/rate-limiter";
import { telemetryRepo } from "@/lib/db";

export const Route = createFileRoute("/api/telemetry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
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
        } catch (err) {
          console.error("[API Telemetry GET Error]", err);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false, error: "Failed to fetch analytics" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const clientIp = extractClientIp(request);
          const body = await request.json().catch(() => ({}));
          const action = body?.action || "hit";

          if (action === "heartbeat") {
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

          // Default: Hit
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
        } catch (err) {
          console.error("[API Telemetry POST Error]", err);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      },
    },
  },
});
