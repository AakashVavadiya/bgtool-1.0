import crypto from "crypto";
import fs from "fs";
import path from "path";

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "lite" | "pro" | "enterprise";
  credits: number;
  freeCredits?: number | undefined;
  paidCredits?: number | undefined;
  totalProcessed: number;
  status: "active" | "restricted" | "banned";
  registeredAt: string;
  lastActive: string;
  lastCreditReset?: string | undefined;
}

export interface AdminSessionPayload {
  id: string;
  username: string;
  role: "superadmin" | "moderator";
  iat: number;
  exp: number;
}

export interface ToolConfigItem {
  slug: string;
  name: string;
  category: string;
  isEnabled: boolean;
  creditCost: number;
  dailyLimitPerIp: number;
  maxResolution: string;
  isMaintenance: boolean;
  maintenanceMessage?: string | undefined;
  totalUsageCount: number;
}

// ─── ATOMIC FILE WRITES ─────────────────────────────────────────────────────
export function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  try {
    fs.renameSync(tempPath, filePath);
  } catch {
    // Windows fallback for file locking
    fs.copyFileSync(tempPath, filePath);
    try {
      fs.unlinkSync(tempPath);
    } catch {}
  }
}

// ─── PASSWORD HASHING (scrypt + random salt) ────────────────────────────────
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export function hashPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plainText, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!storedHash || !plainText) return false;
  try {
    const parts = storedHash.split("$");
    if (
      parts.length !== 6 ||
      parts[0] !== "scrypt" ||
      !parts[1] ||
      !parts[2] ||
      !parts[3] ||
      !parts[4] ||
      !parts[5]
    ) {
      return false;
    }
    const n = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt: string = parts[4];
    const expectedKeyHex: string = parts[5];

    const expectedBuffer = Buffer.from(expectedKeyHex, "hex");
    const actualBuffer = crypto.scryptSync(plainText, salt, expectedBuffer.length, {
      N: n,
      r,
      p,
    });

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

// ─── ADMIN CREDENTIALS STORE ───────────────────────────────────────────────
function getAdminCredentialsPath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "admin-auth.json");
}

export function getOrInitAdminCredentials(): { username: string; passwordHash: string } {
  const credPath = getAdminCredentialsPath();
  if (fs.existsSync(credPath)) {
    try {
      const raw = fs.readFileSync(credPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.username && parsed.passwordHash) {
        return parsed;
      }
    } catch {}
  }

  // Initial seed: default administrator account hashed securely with scrypt
  const initialPassword = process.env["ADMIN_PASSWORD"] || "admin@2026";
  const initialUser = {
    username: "admin",
    passwordHash: hashPassword(initialPassword),
    createdAt: new Date().toISOString(),
  };

  atomicWriteJson(credPath, initialUser);
  return initialUser;
}

export function verifyAdminLogin(usernameInput: string, passwordInput: string): boolean {
  const cleanUser = (usernameInput || "").trim().toLowerCase();
  const cleanPass = (passwordInput || "").trim();
  if (!cleanUser || !cleanPass) return false;

  const validUsernames = ["admin", "admin@bg.tools", "superadmin"];
  if (!validUsernames.includes(cleanUser)) {
    return false;
  }

  // 1. Check against server environment variable override if provided
  const envAdminPass = process.env["ADMIN_PASSWORD"];
  if (envAdminPass && cleanPass === envAdminPass) {
    return true;
  }

  // 2. Check against persistent server hashed credentials
  const creds = getOrInitAdminCredentials();
  return verifyPassword(cleanPass, creds.passwordHash);
}

// ─── ADMIN SESSION SIGNING & VERIFICATION ────────────────────────────────────
function getSessionSecret(): string {
  const envSecret = process.env["ADMIN_SESSION_SECRET"];
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  const secretPath = path.join(process.cwd(), "data", ".session-secret");
  if (fs.existsSync(secretPath)) {
    try {
      const saved = fs.readFileSync(secretPath, "utf-8").trim();
      if (saved.length >= 32) return saved;
    } catch {}
  }

  const generated = crypto.randomBytes(32).toString("hex");
  try {
    fs.writeFileSync(secretPath, generated, { encoding: "utf-8", mode: 0o600 });
  } catch {}
  return generated;
}

export function createAdminSessionToken(user: { id?: string | undefined; username: string }): string {
  const payload: AdminSessionPayload = {
    id: user.id || "adm_super_01",
    username: user.username,
    role: "superadmin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours validity
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): {
  valid: boolean;
  payload?: AdminSessionPayload | undefined;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return { valid: false };

    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadB64)
      .digest("base64url");

    if (signature.length !== expectedSig.length) return { valid: false };
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false };
    }

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false }; // Expired
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export function extractAdminTokenFromRequest(request: Request): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  // 2. x-admin-token: <token>
  const xToken = request.headers.get("x-admin-token");
  if (xToken) {
    return xToken.trim();
  }

  // 3. Cookie: admin_session=<token>
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("admin_session=")) {
        return c.slice("admin_session=".length).trim();
      }
    }
  }

  return null;
}

export function isAuthorizedAdmin(request: Request): boolean {
  const token = extractAdminTokenFromRequest(request);
  if (!token) return false;
  const verification = verifyAdminSessionToken(token);
  return verification.valid;
}

// ─── USER DATA SANITIZATION & MIGRATION ─────────────────────────────────────
export function sanitizeUser(user: any): SafeUser {
  return {
    id: String(user.id || ""),
    name: String(user.name || ""),
    email: String(user.email || ""),
    plan: user.plan === "enterprise" || user.plan === "pro" || user.plan === "lite" ? user.plan : "free",
    credits: typeof user.credits === "number" ? user.credits : 0,
    freeCredits: typeof user.freeCredits === "number" ? user.freeCredits : undefined,
    paidCredits: typeof user.paidCredits === "number" ? user.paidCredits : undefined,
    totalProcessed: typeof user.totalProcessed === "number" ? user.totalProcessed : 0,
    status: user.status === "restricted" || user.status === "banned" ? user.status : "active",
    registeredAt: String(user.registeredAt || ""),
    lastActive: String(user.lastActive || ""),
    lastCreditReset: user.lastCreditReset ? String(user.lastCreditReset) : undefined,
  };
}

export function migrateUsersData(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(raw || "[]");
    if (!Array.isArray(users)) return [];

    let migrated = false;
    for (const u of users) {
      // If user has a plaintext password and no passwordHash, migrate immediately
      if (u.password && typeof u.password === "string") {
        if (!u.password.startsWith("scrypt$")) {
          u.passwordHash = hashPassword(u.password);
        } else {
          u.passwordHash = u.password;
        }
        delete u.password; // Erase plaintext password permanently
        migrated = true;
      }
    }

    if (migrated) {
      atomicWriteJson(filePath, users);
    }
    return users;
  } catch {
    return [];
  }
}

// ─── TOOLS CONFIG STRICT SCHEMA VALIDATION ─────────────────────────────────
export function validateToolsConfigPayload(body: unknown): {
  valid: boolean;
  sanitized?: ToolConfigItem[] | undefined;
  error?: string | undefined;
} {
  if (!Array.isArray(body)) {
    return { valid: false, error: "Configuration must be an array of tool objects." };
  }

  if (body.length > 300) {
    return { valid: false, error: "Too many tools in configuration (maximum 300 allowed)." };
  }

  const sanitized: ToolConfigItem[] = [];

  for (let i = 0; i < body.length; i++) {
    const item: any = body[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { valid: false, error: `Tool at index ${i} is not a valid object.` };
    }

    const safeItem: any = Object.assign({}, item);
    delete safeItem["__proto__"];
    delete safeItem["constructor"];
    delete safeItem["prototype"];

    const slug = String(safeItem["slug"] || "").trim();
    if (!slug || slug.length > 80 || !/^[a-z0-9-_]+$/i.test(slug)) {
      return { valid: false, error: `Invalid or missing slug at tool index ${i}.` };
    }

    const name = String(safeItem["name"] || "").trim();
    if (!name || name.length > 120) {
      return { valid: false, error: `Invalid or missing name at tool index ${i}.` };
    }

    const category = String(safeItem["category"] || "image-editing").trim();
    const isEnabled = Boolean(safeItem["isEnabled"]);
    const creditCost = Math.max(0, Math.min(100, Number(safeItem["creditCost"]) || 0));
    const dailyLimitPerIp = Math.max(0, Math.min(100000, Number(safeItem["dailyLimitPerIp"]) || 0));
    const maxResolution = String(safeItem["maxResolution"] || "Original").slice(0, 50);
    const isMaintenance = Boolean(safeItem["isMaintenance"]);
    const maintenanceMessage = safeItem["maintenanceMessage"]
      ? String(safeItem["maintenanceMessage"]).slice(0, 250)
      : undefined;
    const totalUsageCount = Math.max(0, Number(safeItem["totalUsageCount"]) || 0);

    sanitized.push({
      slug,
      name,
      category,
      isEnabled,
      creditCost,
      dailyLimitPerIp,
      maxResolution,
      isMaintenance,
      ...(maintenanceMessage ? { maintenanceMessage } : {}),
      totalUsageCount,
    });
  }

  return { valid: true, sanitized };
}

// ─── CONTACT INQUIRY VALIDATION & HTML ESCAPING ────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateContactSubmission(body: unknown): {
  valid: boolean;
  ticket?: any;
  error?: string | undefined;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid contact inquiry payload." };
  }

  const raw: any = body;
  const name = String(raw["name"] || "").trim();
  const email = String(raw["email"] || "").trim().toLowerCase();
  const subject = String(raw["subject"] || "General Inquiry").trim();
  const message = String(raw["message"] || "").trim();
  const toolContext = String(raw["toolContext"] || "").trim();

  if (!name || name.length > 100) {
    return { valid: false, error: "Name is required and must not exceed 100 characters." };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || email.length > 120 || !emailRegex.test(email)) {
    return { valid: false, error: "A valid email address is required." };
  }

  if (!subject || subject.length > 150) {
    return { valid: false, error: "Subject is required and must not exceed 150 characters." };
  }

  if (!message || message.length < 5 || message.length > 5000) {
    return { valid: false, error: "Message must be between 5 and 5000 characters." };
  }

  const cleanTicket = {
    id: `TCK_${Math.floor(100 + Math.random() * 900)}_${Date.now().toString(36)}`,
    name: escapeHtml(name),
    email: email, // Validated email format
    subject: escapeHtml(subject),
    message: escapeHtml(message),
    toolContext: escapeHtml(toolContext.slice(0, 100)),
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    status: "open" as const,
    priority: "medium" as const,
    replies: [] as any[],
  };

  return { valid: true, ticket: cleanTicket };
}
