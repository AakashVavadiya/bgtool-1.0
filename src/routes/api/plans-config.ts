import { createFileRoute } from "@tanstack/react-router";
import { configRepo } from "@/lib/db";

export const Route = createFileRoute("/api/plans-config")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const plans = configRepo.getPlansConfig();
          return new Response(JSON.stringify(plans), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response("[]", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
