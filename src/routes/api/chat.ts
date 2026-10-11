import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { runAgentChat } from "@/lib/ai";
import {
  extractClientIp,
  expensiveInferenceLimiter,
  createRateLimitResponse,
  applySecurityHeaders,
  createSafeErrorResponse,
} from "@/lib/security";

type ChatRequestBody = {
  messages?: unknown;
  tier?: string;
  isThinking?: boolean;
  id?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp = extractClientIp(request);
        const rateCheck = expensiveInferenceLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            createRateLimitResponse(
              rateCheck.retryAfter,
              "AI Assistant is busy. Rate limit exceeded, please wait a moment."
            )
          );
        }

        try {
          const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
          const messages = body.messages;
          const tier = typeof body.tier === "string" ? body.tier.slice(0, 30) : undefined;
          const isThinking = Boolean(body.isThinking);
          const threadId = typeof body.id === "string" ? body.id.slice(0, 100) : undefined;

          if (!Array.isArray(messages)) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, "Messages array is required.")
            );
          }

          // Guard against unbounded prompt sizes and memory exhaustion
          if (messages.length > 50) {
            return applySecurityHeaders(
              createSafeErrorResponse(400, "Conversation history exceeds the maximum 50 message limit.")
            );
          }

          // Execute real LLM Tool-Calling Agent Loop
          const aiResponse = await runAgentChat({
            messages: messages as UIMessage[],
            tier,
            isThinking,
            threadId,
          });

          return applySecurityHeaders(aiResponse);
        } catch (err: any) {
          console.error("Error in /api/chat:", err?.message || err);
          return applySecurityHeaders(
            createSafeErrorResponse(
              500,
              "Karudi encountered an unexpected issue while processing your request. Please try again."
            )
          );
        }
      },
    },
  },
});
