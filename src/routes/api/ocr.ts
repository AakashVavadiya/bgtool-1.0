import { createFileRoute } from "@tanstack/react-router";
import { applySecurityHeaders } from "@/lib/security/headers";
import { uploadLimiter, extractClientIp, createRateLimitResponse } from "@/lib/security/rate-limiter";

export const Route = createFileRoute("/api/ocr")({
  server: {
    handlers: {
      GET: async () => {
        return applySecurityHeaders(
          new Response(
            JSON.stringify({ status: "ready", service: "ocr-engine" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      },

      POST: async ({ request }) => {
        try {
          const clientIp = extractClientIp(request);
          const rateCheck = uploadLimiter.check(clientIp);
          if (!rateCheck.allowed) {
            return applySecurityHeaders(
              createRateLimitResponse(
                rateCheck.retryAfter,
                "OCR Engine is busy. Rate limit exceeded, please wait."
              )
            );
          }

          let body: any;
          try {
            body = await request.json();
          } catch (jsonErr: any) {
            return new Response(
              JSON.stringify({ success: false, error: "JSON parse failed: " + (jsonErr?.message || jsonErr) }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const rawB64 = body?.base64Image || body?.image;
          if (!rawB64 || typeof rawB64 !== "string") {
            return new Response(
              JSON.stringify({ success: false, error: "No image payload provided." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const requestedLang = (body.language || "eng").trim().slice(0, 10);
          const base64Data = rawB64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");

          // Dynamically import tesseract.js
          const tesseractMod = await import("tesseract.js");
          const Tesseract = (tesseractMod as any).default || tesseractMod;

          const ocrResult = await Tesseract.recognize(imageBuffer, requestedLang);

          const recognizedText = ocrResult?.data?.text || "";
          const confidence =
            typeof ocrResult?.data?.confidence === "number"
              ? Math.round(ocrResult.data.confidence)
              : 0;
          const tsv = ocrResult?.data?.tsv || "";

          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: true,
                text: recognizedText,
                confidence,
                tsv,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        } catch (err: any) {
          console.error("[API /api/ocr] Execution failed:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err?.message || String(err),
              stack: err?.stack || "",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
