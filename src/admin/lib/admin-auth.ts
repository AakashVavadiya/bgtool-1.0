export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "moderator";
  lastLogin: number;
  token?: string;
}

const ADMIN_SESSION_KEY = "bg.admin.session.v2";
const LEGACY_STORAGE_KEY = "bg.admin.session.v1";
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours validity

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null;

  // Clear any legacy persistent localStorage bypass
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminUser;

    // Check sliding session expiration
    if (Date.now() - session.lastLogin > SESSION_EXPIRY_MS) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const session = getAdminSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
    headers["x-admin-token"] = session.token;
  }
  return headers;
}

export async function loginAdmin(
  usernameInput: string,
  passwordInput: string,
  bgPinInput?: string
): Promise<{ success: boolean; message?: string }> {
  if (typeof window === "undefined") return { success: false };

  const username = (usernameInput || "").trim();
  const password = (passwordInput || "").trim();
  const bgPin = (bgPinInput || "").trim();

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, bgPin }),
      credentials: "same-origin",
    });

    if (res.ok) {
      const data = await res.json();
      const sessionUser: AdminUser = {
        id: data.user?.id || "adm_super_01",
        email: username.includes("@") ? username : "admin@bg.tools",
        name: data.user?.name || "Admin Control Center",
        role: "superadmin",
        lastLogin: Date.now(),
        token: data.token,
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionUser));
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.error || "Invalid admin credentials or BG PIN. Please try again.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Connection failed. Please ensure the server is running.",
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function isAuthenticatedAdmin(): boolean {
  return getAdminSession() !== null;
}
