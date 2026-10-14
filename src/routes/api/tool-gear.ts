import { createFileRoute } from "@tanstack/react-router";
import { applySecurityHeaders } from "@/lib/security/headers";
import { extractClientIp } from "@/lib/security/rate-limiter";
import { toolUsageRepo } from "@/lib/db";

export const Route = createFileRoute("/api/tool-gear")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const rawTimeframe = (url.searchParams.get("timeframe") || "1d").toLowerCase();
          const validTimeframes = ["1d", "yesterday", "7d", "30d"] as const;
          const timeframe = validTimeframes.includes(rawTimeframe as any)
            ? (rawTimeframe as "1d" | "yesterday" | "7d" | "30d")
            : "1d";

          const report = toolUsageRepo.getDetailedReport(timeframe);

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, data: report }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0",
              },
            })
          );
        } catch (err) {
          console.error("[API Tool Gear GET Error]", err);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false, error: "Failed to generate tool report" }), {
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
          const toolSlug = body?.toolSlug;
          if (!toolSlug) {
            return applySecurityHeaders(
              new Response(JSON.stringify({ success: false, error: "Missing toolSlug" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              })
            );
          }

          const record = toolUsageRepo.record({
            toolSlug,
            toolName: body?.toolName,
            userId: body?.userId,
            ip: clientIp,
            success: body?.success !== false,
            durationMs: body?.durationMs,
            fileSizeBytes: body?.fileSizeBytes,
            memoryBytes: body?.memoryBytes,
          });

          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, recordId: record.id }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        } catch (err) {
          console.error("[API Tool Gear POST Error]", err);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false, error: "Failed to record tool execution" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      },
    },
  },
});
