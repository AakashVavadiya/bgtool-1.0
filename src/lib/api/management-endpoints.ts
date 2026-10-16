import { apiKeysRepo } from "../db/api-keys-repo";
import { getUserFromRequest } from "../security/auth-user-server";
import { isAuthorizedAdmin } from "../security/auth-admin";
import { createSafeErrorResponse, applySecurityHeaders } from "../security/headers";
import { extractClientIp } from "../security/rate-limiter";

/**
 * Handle user API key management requests from customer dashboard
 */
export async function handleUserApiKeys(request: Request): Promise<Response> {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(createSafeErrorResponse(401, "Authentication required. Please sign in."));
  }

  const clientIp = extractClientIp(request);
  const url = new URL(request.url);

  // GET /api/user/api-keys: List user's keys
  if (request.method === "GET") {
    try {
      const keys = apiKeysRepo.getKeysByUser(auth.user.id);
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true, keys }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (err: any) {
      return applySecurityHeaders(createSafeErrorResponse(500, "Failed to fetch API keys."));
    }
  }

  // POST /api/user/api-keys: Create a new API key
  if (request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || "Default Key").trim();
      const keyType = body.keyType === "test" ? "test" : "live";
      const scopes = Array.isArray(body.scopes) && body.scopes.length > 0 ? body.scopes : ["*"];
      const ipAllowlist = Array.isArray(body.ipAllowlist) ? body.ipAllowlist : null;
      const rateLimitPerMinute = typeof body.rateLimitPerMinute === "number" ? body.rateLimitPerMinute : 60;
      const expiresAt = body.expiresAt ? String(body.expiresAt) : null;

      const created = apiKeysRepo.createKey({
        userId: auth.user.id,
        name,
        keyType,
        scopes,
        ipAllowlist,
        rateLimitPerMinute,
        expiresAt,
        ip: clientIp,
      });

      if (!created.success) {
        return applySecurityHeaders(createSafeErrorResponse(400, created.error || "Failed to create API key."));
      }

      // rawKey is shown ONCE here
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            rawKey: created.rawKey,
            key: created.key,
            message: "API key generated successfully. Save this secret key now. It will never be displayed again.",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    } catch {
      return applySecurityHeaders(createSafeErrorResponse(400, "Invalid request payload."));
    }
  }

  return applySecurityHeaders(createSafeErrorResponse(405, "Method not allowed."));
}

/**
 * Handle revoke or rotate action on user API keys
 */
export async function handleUserApiKeyAction(request: Request, action: "revoke" | "rotate"): Promise<Response> {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return applySecurityHeaders(createSafeErrorResponse(401, "Authentication required."));
  }

  const clientIp = extractClientIp(request);
  try {
    const body = await request.json().catch(() => ({}));
    const keyId = String(body.keyId || "");
    if (!keyId) {
      return applySecurityHeaders(createSafeErrorResponse(400, "Missing required keyId."));
    }

    if (action === "revoke") {
      const revoked = apiKeysRepo.revokeKey(keyId, auth.user.id, clientIp);
      if (!revoked) {
        return applySecurityHeaders(createSafeErrorResponse(404, "API key not found or already revoked."));
      }
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true, message: "API key has been permanently revoked." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    if (action === "rotate") {
      const rotated = apiKeysRepo.rotateKey(keyId, auth.user.id, clientIp);
      if (!rotated.success) {
        return applySecurityHeaders(createSafeErrorResponse(400, rotated.error || "Failed to rotate API key."));
      }
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            rawKey: rotated.rawKey,
            key: rotated.key,
            message: "API key rotated successfully. Save the new secret key now.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    return applySecurityHeaders(createSafeErrorResponse(400, "Unknown action."));
  } catch {
    return applySecurityHeaders(createSafeErrorResponse(400, "Invalid request."));
  }
}

/**
 * Admin API management endpoints
 */
export async function handleAdminApiManagement(request: Request): Promise<Response> {
  if (!isAuthorizedAdmin(request)) {
    return applySecurityHeaders(createSafeErrorResponse(401, "Administrator access required."));
  }

  const url = new URL(request.url);

  // GET /api/admin/api-management: Returns admin stats, key list, and audit log
  if (request.method === "GET") {
    try {
      const stats = apiKeysRepo.getAdminStats();
      const keys = apiKeysRepo.getAllKeys(100, 0);
      const auditLog = apiKeysRepo.getAuditLog(50);

      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            stats,
            keys,
            auditLog,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    } catch {
      return applySecurityHeaders(createSafeErrorResponse(500, "Failed to retrieve API management data."));
    }
  }

  // POST /api/admin/api-management/status: Update key status (suspend, activate, revoke)
  if (request.method === "POST" && url.pathname.endsWith("/status")) {
    try {
      const body = await request.json();
      const keyId = String(body.keyId || "");
      const status = body.status as "active" | "suspended" | "revoked";

      if (!keyId || !["active", "suspended", "revoked"].includes(status)) {
        return applySecurityHeaders(createSafeErrorResponse(400, "Invalid keyId or status parameter."));
      }

      const ok = apiKeysRepo.setKeyStatus(keyId, status);
      return applySecurityHeaders(
        new Response(JSON.stringify({ success: ok }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch {
      return applySecurityHeaders(createSafeErrorResponse(400, "Invalid payload."));
    }
  }

  // POST /api/admin/api-management/kill-switch: Toggle global kill-switch
  if (request.method === "POST" && url.pathname.endsWith("/kill-switch")) {
    try {
      const body = await request.json();
      const enabled = Boolean(body.enabled);
      apiKeysRepo.setGlobalApiEnabled(enabled);

      return applySecurityHeaders(
        new Response(JSON.stringify({ success: true, enabled }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch {
      return applySecurityHeaders(createSafeErrorResponse(400, "Invalid payload."));
    }
  }

  return applySecurityHeaders(createSafeErrorResponse(405, "Method not allowed."));
}
