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

const GUEST_CREDITS_KEY = "bg.guest.free_uses.v3";
export const GUEST_FREE_USES_LIMIT = 5;

interface GuestCreditState {
  date: string;
  credits: number;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getGuestCreditsFromStorage(): number {
  if (typeof window === "undefined") return GUEST_FREE_USES_LIMIT;
  try {
    const raw = localStorage.getItem(GUEST_CREDITS_KEY);
    if (!raw) {
      const initial: GuestCreditState = { date: getTodayString(), credits: GUEST_FREE_USES_LIMIT };
      localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(initial));
      return GUEST_FREE_USES_LIMIT;
    }
    const parsed = JSON.parse(raw) as GuestCreditState;
    if (parsed.date !== getTodayString()) {
      const resetState: GuestCreditState = { date: getTodayString(), credits: GUEST_FREE_USES_LIMIT };
      localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(resetState));
      return GUEST_FREE_USES_LIMIT;
    }
    return typeof parsed.credits === "number"
      ? Math.min(GUEST_FREE_USES_LIMIT, Math.max(0, parsed.credits))
      : GUEST_FREE_USES_LIMIT;
  } catch {
    return GUEST_FREE_USES_LIMIT;
  }
}

function setGuestCreditsInStorage(credits: number): void {
  if (typeof window === "undefined") return;
  try {
    const state: GuestCreditState = {
      date: getTodayString(),
      credits: Math.min(GUEST_FREE_USES_LIMIT, Math.max(0, credits)),
    };
    localStorage.setItem(GUEST_CREDITS_KEY, JSON.stringify(state));
  } catch {}
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

  async signUp(name: string, email: string, password?: string): Promise<AuthResult> {
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
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
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

  async login(email: string, password?: string): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!password) {
      return { success: false, error: "Please enter your password." };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data.unverified) {
        return {
          success: false,
          requireVerification: true,
          email: cleanEmail,
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
    } catch {
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
      const current = getGuestCreditsFromStorage();
      if (current < amount) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("bg:show_guest_login_dialog", {
              detail: { toolSlug, remaining: 0 },
            })
          );
        }
        return false;
      }
      const next = Math.max(0, current - amount);
      setGuestCreditsInStorage(next);
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
    creditsAmount: number,
    planName: string,
    amountINR: number,
    paymentMethod = "UPI"
  ): string {
    if (cachedUser) {
      cachedUser.paidCredits = Math.round(((cachedUser.paidCredits || 0) + creditsAmount) * 100) / 100;
      cachedUser.credits = Math.round(((cachedUser.freeCredits || 0) + cachedUser.paidCredits) * 100) / 100;
      if (planName.toLowerCase().includes("pro")) cachedUser.plan = "pro";
      else if (planName.toLowerCase().includes("lite")) cachedUser.plan = "lite";
      else if (planName.toLowerCase().includes("enterprise")) cachedUser.plan = "enterprise";
    }

    const txnId = `TXN_${Date.now().toString(36).toUpperCase()}_${Math.floor(100 + Math.random() * 900)}`;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "purchase_completed", txnId } }));
    }
    return txnId;
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
