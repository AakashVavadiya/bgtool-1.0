import crypto from "crypto";
import { getUserFromRequest } from "./auth-user-server";
import {
  creditLedgerRepo,
  configRepo,
  toolUsageRepo,
} from "../db";

export interface CreditGuardResult {
  allowed: boolean;
  status?: number | undefined;
  error?: string | undefined;
  userId?: string | null | undefined;
  cost?: number | undefined;
  isGuest?: boolean | undefined;
  guestCookieHeader?: string | undefined;
  refund?: ((reason?: string) => void) | undefined;
  recordSuccess?: ((durationMs?: number, fileSizeBytes?: number) => void) | undefined;
}

import { DISABLE_IP_TOOL_LIMIT_FOR_TESTING } from "./testing-config";

function getSigningSecret(): string {
  return process.env["ADMIN_SESSION_SECRET"] || "bg_default_guest_signing_secret_32_bytes_min";
}

function signGuestId(guestId: string): string {
  const secret = getSigningSecret();
  const sig = crypto.createHmac("sha256", secret).update(guestId).digest("hex");
  return `${guestId}.${sig}`;
}

function verifyGuestId(cookieValue: string): string | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const [guestId, sig] = cookieValue.split(".");
  if (!guestId || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", getSigningSecret()).update(guestId).digest("hex");
  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    return isMatch ? guestId : null;
  } catch {
    return null;
  }
}

export async function enforceToolCreditsAndLimits(
  request: Request,
  toolSlug: string,
  clientIp: string
): Promise<CreditGuardResult> {
  const startTime = Date.now();

  // 1. Inspect tool configuration from SQLite configRepo
  const tools = configRepo.getToolsConfig();
  const tool = tools.find(
    (t) =>
      t.slug === toolSlug ||
      (t.slug === "remove-bg" && toolSlug === "remove-background") ||
      (t.slug === "remove-background" && toolSlug === "remove-bg")
  );

  if (tool) {
    if (!tool.isEnabled) {
      return {
        allowed: false,
        status: 403,
        error: `${tool.name} is currently disabled by administrator.`,
      };
    }

    if (tool.isMaintenance) {
      return {
        allowed: false,
        status: 503,
        error: tool.maintenanceMessage || `${tool.name} is currently undergoing maintenance. Please try again later.`,
      };
    }
  }

  const cost = tool?.creditCost ?? 1;
  const dailyLimitPerIp = tool?.dailyLimitPerIp ?? 50;

  // 2. Identify caller: Authenticated User or Anonymous Guest
  const auth = getUserFromRequest(request);

  if (auth) {
    // Authenticated User Flow
    if (auth.user.status === "banned") {
      return {
        allowed: false,
        status: 403,
        error: "Your account is permanently suspended.",
      };
    }

    if (auth.user.status === "restricted") {
      return {
        allowed: false,
        status: 403,
        error: "Your account is temporarily restricted from using processing tools.",
      };
    }

    // Deduct credits atomically inside immediate DB transaction BEFORE processing
    const deduction = creditLedgerRepo.deductUserCredits(auth.user.id, cost, toolSlug, clientIp);
    if (!deduction.success) {
      return {
        allowed: false,
        status: 402, // HTTP 402 Payment Required
        error: deduction.error || `Insufficient credits. Required: ${cost}, available: ${deduction.balanceAfter}.`,
      };
    }

    return {
      allowed: true,
      userId: auth.user.id,
      cost,
      isGuest: false,
      refund: (reason: string = "Downstream processing failure") => {
        creditLedgerRepo.refundUserCredits(auth.user.id, cost, toolSlug, reason);
      },
      recordSuccess: (durationMs?: number, fileSizeBytes?: number) => {
        toolUsageRepo.record({
          toolSlug,
          userId: auth.user.id,
          ip: clientIp,
          success: true,
          durationMs: durationMs ?? (Date.now() - startTime),
          fileSizeBytes: fileSizeBytes ?? 0,
        });
      },
    };
  }

  // 3. Anonymous Guest Flow: Enforce signed cookie + IP daily limit
  const cookieHeader = request.headers.get("cookie") || "";
  let guestId: string | null = null;
  let newCookieHeader: string | undefined = undefined;

  const cookieMatch = cookieHeader.match(/bg_guest=([^;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    guestId = verifyGuestId(cookieMatch[1].trim());
  }

  if (!guestId) {
    guestId = crypto.randomBytes(16).toString("hex");
    const signedVal = signGuestId(guestId);
    const isProd = process.env["NODE_ENV"] === "production";
    const secureFlag = isProd ? "; Secure" : "";
    newCookieHeader = `bg_guest=${signedVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secureFlag}`;
  }

  // Daily guest allowance is min(5, dailyLimitPerIp)
  if (DISABLE_IP_TOOL_LIMIT_FOR_TESTING) {
    return {
      allowed: true,
      userId: null,
      cost: 0,
      isGuest: true,
      guestCookieHeader: newCookieHeader,
      refund: () => {},
      recordSuccess: () => {},
    };
  }

  const guestDailyAllowance = Math.min(5, dailyLimitPerIp);
  const differentToolBonus = 2;
  const guestCheck = creditLedgerRepo.checkAndDeductGuestLimit(clientIp, toolSlug, guestDailyAllowance, differentToolBonus);

  if (!guestCheck.allowed) {
    const errorMsg =
      guestCheck.reason === "same_tool_exhausted"
        ? `Daily free limit of ${guestDailyAllowance} uses reached for this tool. Try another tool for 2 bonus chances, or sign up for 10 free daily credits!`
        : `Daily free guest limit reached. Please sign up for 10 free daily credits to continue creating!`;

    return {
      allowed: false,
      status: 429,
      error: errorMsg,
      guestCookieHeader: newCookieHeader,
    };
  }

  return {
    allowed: true,
    userId: null,
    cost: 1,
    isGuest: true,
    guestCookieHeader: newCookieHeader,
    refund: () => {
      // For guest refunds we don't restore money, but usage count is bounded
    },
    recordSuccess: (durationMs?: number, fileSizeBytes?: number) => {
      toolUsageRepo.record({
        toolSlug,
        userId: undefined,
        ip: clientIp,
        success: true,
        durationMs: durationMs ?? (Date.now() - startTime),
        fileSizeBytes: fileSizeBytes ?? 0,
      });
    },
  };
}
