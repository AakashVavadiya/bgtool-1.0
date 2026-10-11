export const BASE_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://unpkg.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https://images.unsplash.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; " +
  "connect-src 'self' blob: data: http://127.0.0.1:* http://localhost:* https://unpkg.com https://cdn.jsdelivr.net; " +
  "worker-src 'self' blob:; " +
  "frame-ancestors 'self';";

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy": BASE_CSP,
};

/**
 * Applies security headers to an outgoing HTTP response while preserving original headers.
 */
export function applySecurityHeaders(response: Response): Response {
  // If response is immutable or already has headers, clone and augment
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }

  // Enforce HSTS in production
  if (process.env["NODE_ENV"] === "production") {
    newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Strip any server banners
  newHeaders.delete("X-Powered-By");
  newHeaders.delete("Server");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Creates a sanitized JSON error response preventing information disclosure.
 * Never outputs stack traces, internal paths, or environment variables.
 */
export function createSafeErrorResponse(
  status: number,
  clientMessage: string,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });

  return new Response(
    JSON.stringify({
      success: false,
      error: clientMessage,
    }),
    {
      status,
      headers,
    }
  );
}
