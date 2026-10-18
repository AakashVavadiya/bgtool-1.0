import { REALTIME_EVENT_NAME } from "@/lib/telemetry";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "lite" | "pro" | "enterprise";
  credits: number;
  freeCredits?: number | undefined;
  paidCredits?: number | undefined;
  lastCreditReset?: string | undefined;
  totalProcessed: number;
  status?: "active" | "restricted" | "banned";
  registeredAt: string;
  phone?: string | null | undefined;
  countryCode?: string | null | undefined;
  country?: string | null | undefined;
}

export interface AuthResult {
  success: boolean;
  user?: CurrentUser | undefined;
  error?: string | undefined;
  requireVerification?: boolean | undefined;
  email?: string | undefined;
  message?: string | undefined;
}

let cachedUser: CurrentUser | null = null;
let isInitializing = false;
let hasInitialized = false;

import { DISABLE_IP_TOOL_LIMIT_FOR_TESTING } from "./security/testing-config";
const GUEST_CREDITS_KEY = "bg.guest.free_uses.v3";
export const GUEST_FREE_USES_LIMIT = DISABLE_IP_TOOL_LIMIT_FOR_TESTING ? 999999 : 5;
export const GUEST_DIFFERENT_TOOL_BONUS_LIMIT = DISABLE_IP_TOOL_LIMIT_FOR_TESTING ? 999999 : 2;

export interface GuestCreditState {
  date: string;
  credits: number; // base free uses (starts at 5)
  baseUsedTools?: string[]; // tools used during initial 5 uses
  bonusTools?: Record<string, number>; // toolSlug -> remaining bonus chances (starts at 2)
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getGuestState(): GuestCreditState {
  if (typeof window === "undefined") {
    return { date: getTodayString(), credits: GUEST_FREE_USES_LIMIT, baseUsedTools: [], bonusTools: {} };
  }
  try {
    const raw = localStorage.getItem(GUEST_CREDITS_KEY);
    if (!raw) {
      const initial: GuestCreditState = {
        date: getTodayString(),
        credits: GUEST_FREE_USES_LIMIT,
        baseUsedTools: [],
        bonusTools: {},
      };
      localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as GuestCreditState;
    if (parsed.date !== getTodayString()) {
      const resetState: GuestCreditState = {
        date: getTodayString(),
        credits: GUEST_FREE_USES_LIMIT,
        baseUsedTools: [],
        bonusTools: {},
      };
      localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(resetState));
      return resetState;
    }
    return {
      date: parsed.date,
      credits: typeof parsed.credits === "number" ? Math.max(0, parsed.credits) : GUEST_FREE_USES_LIMIT,
      baseUsedTools: Array.isArray(parsed.baseUsedTools) ? parsed.baseUsedTools : [],
      bonusTools: parsed.bonusTools && typeof parsed.bonusTools === "object" ? parsed.bonusTools : {},
    };
  } catch {
    return { date: getTodayString(), credits: GUEST_FREE_USES_LIMIT, baseUsedTools: [], bonusTools: {} };
  }
}

export function saveGuestState(state: GuestCreditState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(state));
  } catch {}
}

export function getGuestCreditsFromStorage(): number {
  return getGuestState().credits;
}

export const AuthUser = {
  getCurrentUser(): CurrentUser | null {
    if (typeof window === "undefined") return null;
    if (!hasInitialized && !isInitializing) {
      this.refreshSession().catch(() => {});
    }
    return cachedUser;
  },

  async refreshSession(): Promise<CurrentUser | null> {
    if (typeof window === "undefined") return null;
    isInitializing = true;
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          cachedUser = data.user;
          hasInitialized = true;
          isInitializing = false;
          window.dispatchEvent(
            new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_session_synced", user: cachedUser } })
          );
          return cachedUser;
        }
      } else if (res.status === 403) {
        // Restricted or banned
        cachedUser = null;
        window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
      }

      cachedUser = null;
      hasInitialized = true;
      isInitializing = false;
      return null;
    } catch {
      isInitializing = false;
      return cachedUser;
    }
  },

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(cachedUser || this.getCurrentUser());
  },

  getGuestRemainingUses(): number {
    if (DISABLE_IP_TOOL_LIMIT_FOR_TESTING) return 999999;
    return getGuestCreditsFromStorage();
  },

  getGuestMaxUses(): number {
    return GUEST_FREE_USES_LIMIT;
  },

  isUserRestricted(email?: string): boolean {
    if (typeof window === "undefined") return false;
    const user = cachedUser || this.getCurrentUser();
    if (!user) return false;
    return user.status === "restricted" || user.status === "banned";
  },

  async signUp(
    name: string,
    email: string,
    password?: string,
    phone?: string,
    countryCode?: string,
    country?: string
  ): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split("@")[0] || "Creative User";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          phone: phone?.trim() || undefined,
          countryCode: countryCode?.trim() || undefined,
          country: country?.trim() || undefined,
        }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Registration failed. Please check your credentials.",
        };
      }

      return {
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: data.message || "Account created! Verification code sent to your email.",
      };
    } catch {
      return { success: false, error: "Network error during signup. Please try again." };
    }
  },

  async verifyEmailOtp(email: string, otp: string): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Invalid email address." };
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: "Please enter a 6-digit verification code." };
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Invalid or expired verification code.",
        };
      }

      cachedUser = data.user;
      hasInitialized = true;
      window.dispatchEvent(
        new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_login", user: cachedUser } })
      );

      return { success: true, ...(cachedUser ? { user: cachedUser } : {}) };
    } catch {
      return { success: false, error: "Network error during verification. Please try again." };
    }
  },

  async resendOtp(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Invalid email address." };
    }

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to resend verification code. Please wait before retrying.",
        };
      }

      return { success: true, message: data.message || "A new 6-digit code has been sent." };
    } catch {
      return { success: false, error: "Network error while resending code." };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Unable to process password reset request." };
      }

      return {
        success: true,
        message: data.message || "If an account exists, password reset instructions have been sent.",
      };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!token.trim()) {
      return { success: false, error: "Invalid or missing password reset token." };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to reset password. Link may have expired." };
      }

      return { success: true, message: data.message || "Password reset successfully. You can now log in." };
    } catch {
      return { success: false, error: "Network error during password reset." };
    }
  },

  async updateProfile(name: string): Promise<{ success: boolean; user?: CurrentUser; error?: string }> {
    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, error: "Name cannot be empty." };
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to update profile." };
      }

      if (data.user) {
        cachedUser = data.user;
        window.dispatchEvent(
          new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_session_synced", user: cachedUser } })
        );
      }

      return { success: true, ...(data.user ? { user: data.user } : {}) };
    } catch {
      return { success: false, error: "Network error updating profile." };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!currentPassword || !newPassword) {
      return { success: false, error: "Please fill in all password fields." };
    }
    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to change password." };
      }

      return { success: true, message: data.message || "Password updated successfully." };
    } catch {
      return { success: false, error: "Network error changing password." };
    }
  },

  async login(identifier: string, password?: string): Promise<AuthResult> {
    const raw = identifier.trim();
    if (!raw) {
      return { success: false, error: "Please enter your email or mobile number." };
    }

    const isEmail = raw.includes("@");
    const cleanIdentifier = isEmail ? raw.toLowerCase() : raw.replace(/[\s-]/g, "");

    if (isEmail && (!cleanIdentifier.includes(".") || cleanIdentifier.length < 5)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!isEmail && cleanIdentifier.replace(/\D/g, "").length < 6) {
      return { success: false, error: "Please enter a valid mobile number (min 6 digits)." };
    }

    if (!password) {
      return { success: false, error: "Please enter your password." };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanIdentifier, password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data.unverified) {
        return {
          success: false,
          requireVerification: true,
          email: data.email || (isEmail ? cleanIdentifier : raw),
          error: data.error || "Your email is not verified. Please verify your email.",
        };
      }

      if (res.status === 403) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
        }
        return {
          success: false,
          error: data.error || "You cannot use bg. because you have violated our terms and conditions.",
        };
      }

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Invalid email or password.",
        };
      }

      cachedUser = data.user;
      hasInitialized = true;
      window.dispatchEvent(
        new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_login", user: cachedUser } })
      );

      return { success: true, ...(cachedUser ? { user: cachedUser } : {}) };
    } catch (err: any) {
      console.error("[Auth] Login exception:", err);
      return { success: false, error: "Network error during login. Please try again." };
    }
  },

  logout(): void {
    if (typeof window === "undefined") return;
    cachedUser = null;
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_logout" } }));
  },

  async logoutAsync(): Promise<void> {
    if (typeof window === "undefined") return;
    cachedUser = null;
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_logout" } }));
  },

  getCredits(): number {
    if (cachedUser) {
      return cachedUser.credits;
    }
    return getGuestCreditsFromStorage();
  },

  getFreeCredits(): number {
    if (cachedUser) {
      return cachedUser.freeCredits ?? 0;
    }
    return getGuestCreditsFromStorage();
  },

  getPaidCredits(): number {
    if (cachedUser) {
      return cachedUser.paidCredits ?? 0;
    }
    return 0;
  },

  getSilverTokens(): number {
    return this.getFreeCredits();
  },

  getGoldTokens(): number {
    return this.getPaidCredits();
  },

  getTotalTokens(): number {
    return this.getCredits();
  },

  hasCredits(amount = 1): boolean {
    if (this.isUserRestricted()) return false;
    if (amount <= 0) return true;
    return this.getCredits() >= amount;
  },

  hasTokens(amount = 1): boolean {
    return this.hasCredits(amount);
  },

  getGuestToolStatus(toolSlug = "tool"): { allowed: boolean; remaining: number; isBonus: boolean; reason?: string } {
    if (cachedUser) {
      return { allowed: true, remaining: cachedUser.credits, isBonus: false };
    }
    if (DISABLE_IP_TOOL_LIMIT_FOR_TESTING) {
      return { allowed: true, remaining: 999999, isBonus: false };
    }
    const state = getGuestState();
    if (state.credits >= 1) {
      return { allowed: true, remaining: state.credits, isBonus: false };
    }
    const baseUsed = state.baseUsedTools || [];
    if (baseUsed.includes(toolSlug)) {
      return { allowed: false, remaining: 0, isBonus: false, reason: "same_tool_exhausted" };
    }
    const bonusRemaining =
      state.bonusTools?.[toolSlug] !== undefined
        ? state.bonusTools[toolSlug]!
        : GUEST_DIFFERENT_TOOL_BONUS_LIMIT;

    if (bonusRemaining >= 1) {
      return { allowed: true, remaining: bonusRemaining, isBonus: true };
    }
    return { allowed: false, remaining: 0, isBonus: true, reason: "bonus_exhausted" };
  },

  deductToken(amount = 1, toolSlug = "tool", isServerDeducted = false): boolean {
    return this.deductCredit(amount, toolSlug, isServerDeducted);
  },

  deductCredit(amount = 1, toolSlug = "tool", isServerDeducted = false): boolean {
    if (this.isUserRestricted()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
      }
      return false;
    }
    if (amount <= 0) return true;

    if (cachedUser) {
      if (cachedUser.credits < amount) return false;
      let remaining = amount;
      let free = cachedUser.freeCredits ?? 0;
      let paid = cachedUser.paidCredits ?? 0;

      if (free >= remaining) {
        free = Math.round((free - remaining) * 100) / 100;
      } else {
        remaining -= free;
        free = 0;
        paid = Math.max(0, Math.round((paid - remaining) * 100) / 100);
      }

      cachedUser.freeCredits = free;
      cachedUser.paidCredits = paid;
      cachedUser.credits = Math.round((free + paid) * 100) / 100;
      cachedUser.totalProcessed += 1;

      // Persist to SQLite server if not already deducted by the server endpoint
      if (!isServerDeducted && typeof window !== "undefined") {
        fetch("/api/auth/deduct-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cost: amount, toolSlug }),
          credentials: "same-origin",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.user && cachedUser) {
              cachedUser.credits = data.user.credits;
              cachedUser.freeCredits = data.user.freeCredits;
              cachedUser.paidCredits = data.user.paidCredits;
              cachedUser.totalProcessed = data.user.totalProcessed;
              window.dispatchEvent(
                new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_session_synced", user: cachedUser } })
              );
            }
          })
          .catch((err) => {
            console.warn("Credit deduction sync error:", err);
          });
      }
    } else {
      // Guest visitor deduction
      if (DISABLE_IP_TOOL_LIMIT_FOR_TESTING) {
        return true;
      }
      const state = getGuestState();

      if (state.credits >= amount) {
        // 1. Deduct from base 5 free guest uses
        state.credits = Math.max(0, state.credits - amount);
        if (!state.baseUsedTools) state.baseUsedTools = [];
        if (!state.baseUsedTools.includes(toolSlug)) {
          state.baseUsedTools.push(toolSlug);
        }
        saveGuestState(state);
      } else {
        // 2. Base 5 uses exhausted!
        const baseUsed = state.baseUsedTools || [];

        // If the same tool that was used in the base uses is attempted again: BLOCK IT
        if (baseUsed.includes(toolSlug)) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("bg:show_guest_login_dialog", {
                detail: {
                  toolSlug,
                  remaining: 0,
                  reason: "same_tool_exhausted",
                  message: "5 Free Guest Uses for this tool completed. Try another tool for 2 bonus chances, or create a free account!",
                },
              })
            );
          }
          return false;
        }

        // 3. DIFFERENT tool: grant up to 2 bonus chances for this different tool
        if (!state.bonusTools) state.bonusTools = {};
        const bonusRemaining =
          state.bonusTools[toolSlug] !== undefined
            ? state.bonusTools[toolSlug]!
            : GUEST_DIFFERENT_TOOL_BONUS_LIMIT;

        if (bonusRemaining < amount) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("bg:show_guest_login_dialog", {
                detail: {
                  toolSlug,
                  remaining: 0,
                  reason: "bonus_exhausted",
                  message: "Bonus trial for this tool completed. Please log in or create a free account!",
                },
              })
            );
          }
          return false;
        }

        state.bonusTools[toolSlug] = Math.max(0, bonusRemaining - amount);
        saveGuestState(state);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(REALTIME_EVENT_NAME, {
          detail: { type: "credit_deducted", amount, toolSlug, credits: this.getCredits() },
        })
      );
      window.dispatchEvent(
        new CustomEvent("bg:credit_updated", {
          detail: { credits: this.getCredits(), silver: this.getSilverTokens(), gold: this.getGoldTokens() },
        })
      );
    }
    return true;
  },

  addPurchasedCredits(
    _creditsAmount: number,
    _planName: string,
    _amountINR: number,
    _paymentMethod = "UPI"
  ): string {
    console.warn(
      "[Security] Direct client-side token addition is disabled. Tokens are verified and credited strictly via Razorpay server verification."
    );
    return "";
  },

  addPurchasedTokens(
    tokensAmount: number,
    planName: string,
    amountINR: number,
    paymentMethod = "UPI"
  ): string {
    return this.addPurchasedCredits(tokensAmount, planName, amountINR, paymentMethod);
  },
};

// Initial session probe in browser
if (typeof window !== "undefined") {
  AuthUser.refreshSession().catch(() => {});
}
