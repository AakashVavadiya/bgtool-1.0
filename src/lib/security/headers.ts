export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  // Standard CSP supporting existing scripts, styles, fonts, images, and local web workers
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' https: http://127.0.0.1:* http://localhost:* blob: data:; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'self';",
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
