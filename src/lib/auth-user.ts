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
}

let cachedUser: CurrentUser | null = null;
let isInitializing = false;
let hasInitialized = false;

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

      cachedUser = data.user;
      hasInitialized = true;
      window.dispatchEvent(
        new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "user_registered", user: cachedUser } })
      );

      return { success: true, ...(cachedUser ? { user: cachedUser } : {}) };
    } catch {
      return { success: false, error: "Network error during signup. Please try again." };
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

      if (res.status === 403) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
        }
        return {
          success: false,
          error: "You cannot use bg. because you have violated our terms and conditions.",
        };
      }

      const data = await res.json().catch(() => ({}));
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
    return cachedUser?.credits ?? 10;
  },

  getFreeCredits(): number {
    return cachedUser?.freeCredits ?? 10;
  },

  getPaidCredits(): number {
    return cachedUser?.paidCredits ?? 0;
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

  deductToken(amount = 1): boolean {
    return this.deductCredit(amount);
  },

  deductCredit(amount = 1): boolean {
    if (this.isUserRestricted()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
      }
      return false;
    }
    if (amount <= 0) return true;

    // Optimistically update in-memory cache; server enforces actual deduction
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
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: { type: "credit_deducted" } }));
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
