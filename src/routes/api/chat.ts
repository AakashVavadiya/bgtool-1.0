import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { runAgentChat } from "@/lib/ai";
import {
  extractClientIp,
  expensiveInferenceLimiter,
  createRateLimitResponse,
  applySecurityHeaders,
  createSafeErrorResponse,
  enforceToolCreditsAndLimits,
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

        const creditCheck = await enforceToolCreditsAndLimits(request, "chat", clientIp);
        if (!creditCheck.allowed) {
          const errRes = applySecurityHeaders(
            createSafeErrorResponse(creditCheck.status || 402, creditCheck.error || "Credit limit exceeded.")
          );
          if (creditCheck.guestCookieHeader) {
            errRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
          }
          return errRes;
        }

        try {
          const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
          const messages = body.messages;
          const tier = typeof body.tier === "string" ? body.tier.slice(0, 30) : undefined;
          const isThinking = Boolean(body.isThinking);
          const threadId = typeof body.id === "string" ? body.id.slice(0, 100) : undefined;

          if (!Array.isArray(messages)) {
            creditCheck.refund?.("Invalid messages array");
            const res = applySecurityHeaders(
              createSafeErrorResponse(400, "Messages array is required.")
            );
            if (creditCheck.guestCookieHeader) {
              res.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
            }
            return res;
          }

          // Guard against unbounded prompt sizes and memory exhaustion
          if (messages.length > 50) {
            creditCheck.refund?.("Exceeded 50 messages limit");
            const res = applySecurityHeaders(
              createSafeErrorResponse(400, "Conversation history exceeds the maximum 50 message limit.")
            );
            if (creditCheck.guestCookieHeader) {
              res.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
            }
            return res;
          }

          // Execute real LLM Tool-Calling Agent Loop
          const aiResponse = await runAgentChat({
            messages: messages as UIMessage[],
            tier,
            isThinking,
            threadId,
          });

          if (!aiResponse.ok) {
            creditCheck.refund?.(`AI status ${aiResponse.status}`);
          } else {
            creditCheck.recordSuccess?.();
          }

          const finalRes = applySecurityHeaders(aiResponse);
          if (creditCheck.guestCookieHeader) {
            finalRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
          }
          return finalRes;
        } catch (err: any) {
          creditCheck.refund?.(err?.message || "Internal failure");
          console.error("Error in /api/chat:", err?.message || err);
          const errRes = applySecurityHeaders(
            createSafeErrorResponse(
              500,
              "Karudi encountered an unexpected issue while processing your request. Please try again."
            )
          );
          if (creditCheck.guestCookieHeader) {
            errRes.headers.set("Set-Cookie", creditCheck.guestCookieHeader);
          }
          return errRes;
        }
      },
    },
  },
});
