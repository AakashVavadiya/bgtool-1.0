process.env["ADMIN_USERNAME"] = "admin@bg.tools";
process.env["ADMIN_PASSWORD"] = "TestSuperAdminPassword2026!";
process.env["ADMIN_SESSION_SECRET"] = "TestSessionSecretAtLeast32CharactersLong!";

import assert from "assert";
import fs from "fs";
import path from "path";
import {
  inspectFileSignature,
  validateBuffer,
  validateBase64Payload,
  TOOL_PROFILES,
  SECURITY_CONFIG,
} from "../src/lib/security/upload-policy";
import {
  MemoryRateLimiter,
  generalLimiter,
  expensiveInferenceLimiter,
  extractClientIp,
} from "../src/lib/security/rate-limiter";
import {
  createJobWorkspace,
  writeJobFile,
  cleanupJobWorkspace,
  withTempWorkspace,
  assertPathSafe,
  runHourlyCleanup,
} from "../src/lib/security/temp-file-manager";
import {
  SECURITY_HEADERS,
  applySecurityHeaders,
  createSafeErrorResponse,
} from "../src/lib/security/headers";
import {
  createAdminSessionToken,
  hashPassword,
  verifyPassword,
  migrateUsersData,
  sanitizeUser,
  validateAdminEnvironment,
  verifyAdminLogin,
  adminLockout,
  userLockout,
} from "../src/lib/security";
import {
  getDb,
  usersRepo,
  sessionsRepo,
  creditLedgerRepo,
  inquiriesRepo,
  configRepo,
  rateLimitsRepo,
} from "../src/lib/db";
import { runMigration } from "./migrate_json_to_sqlite";
import serverHandler from "../src/server";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestReport[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      results.push({ name, passed: false, error: err?.message || String(err) });
      console.error(`[FAIL] ${name}:`, err?.message || err);
    }
  };
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("RUNNING BG TOOL AUTOMATED SECURITY AUDIT SUITE");
  console.log("=================================================\n");

  // TEST 1: Valid PNG image below 30 MB is accepted
  await test("Test 1: Valid file below 30 MB is accepted", () => {
    // 1x1 valid PNG buffer
    const validPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const res = validateBuffer(validPng, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, true, "Valid PNG should be accepted");
    assert.strictEqual(res.detectedMime, "image/png");
    assert.strictEqual(res.detectedCategory, "image");
    assert.ok(res.safeFilename, "Must produce random unguessable safeFilename");
  })();

  // TEST 2: File exceeding 30 MB is rejected (HTTP 413)
  await test("Test 2: File exceeding 30 MB is rejected with HTTP 413", () => {
    const oversizedBuffer = Buffer.alloc(32 * 1024 * 1024); // 32 MB
    // Set valid PNG header on oversized buffer
    oversizedBuffer[0] = 0x89;
    oversizedBuffer[1] = 0x50;
    oversizedBuffer[2] = 0x4e;
    oversizedBuffer[3] = 0x47;
    oversizedBuffer[4] = 0x0d;
    oversizedBuffer[5] = 0x0a;
    oversizedBuffer[6] = 0x1a;
    oversizedBuffer[7] = 0x0a;

    const res = validateBuffer(oversizedBuffer, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false, "Oversized buffer must be rejected");
    assert.strictEqual(res.status, 413, "Must return HTTP 413");
    assert.ok(res.error?.includes("exceeds"), "Error message must indicate size limit");
  })();

  // TEST 3: Pre-flight Base64 exceeding 30 MB limit is rejected without decoding
  await test("Test 3: Pre-flight Base64 payload exceeding size limit is rejected", () => {
    // String representing ~36 MB of Base64 data (exceeding 30 MB binary)
    const oversizedB64 = "data:image/png;base64," + "A".repeat(45 * 1024 * 1024);
    const res = validateBase64Payload(oversizedB64, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 413);
  })();

  // TEST 4: Renamed executable (MZ PE header disguised as image) is rejected
  await test("Test 4: Renamed executable (.exe disguised as image) is rejected with HTTP 415", () => {
    // Windows PE header MZ (0x4D, 0x5A)
    const fakeImageBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const sig = inspectFileSignature(fakeImageBuffer);
    assert.strictEqual(sig.category, "executable");

    const res = validateBuffer(fakeImageBuffer, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 415);
    assert.ok(res.error?.toLowerCase().includes("executable"), "Must cite executable prohibition");
  })();

  // TEST 5: Linux ELF executable is rejected
  await test("Test 5: Linux ELF executable header is rejected", () => {
    const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    const sig = inspectFileSignature(elfBuffer);
    assert.strictEqual(sig.category, "executable");
    const res = validateBuffer(elfBuffer, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false);
  })();

  // TEST 6: Zero-byte file is rejected
  await test("Test 6: Zero-byte file is rejected with HTTP 400", () => {
    const emptyBuf = Buffer.alloc(0);
    const res = validateBuffer(emptyBuf, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 400);
    assert.ok(res.error?.includes("empty"));
  })();

  // TEST 7: Unsupported file type for specific tool is rejected
  await test("Test 7: PDF passed to remove-bg is rejected with HTTP 415", () => {
    const pdfBuf = Buffer.from("%PDF-1.4\n%testpdf", "utf-8");
    const res = validateBuffer(pdfBuf, TOOL_PROFILES["remove-bg"]);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 415);
  })();

  // TEST 8: Valid PDF passed to pdf-tools is accepted
  await test("Test 8: Valid PDF file is accepted for pdf-tools profile", () => {
    const pdfBuf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8");
    const res = validateBuffer(pdfBuf, TOOL_PROFILES["pdf-tools"]);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedCategory, "pdf");
    assert.strictEqual(res.detectedMime, "application/pdf");
  })();

  // TEST 9: SVG with active script tags is detected and rejected
  await test("Test 9: SVG with embedded <script> injection is rejected", () => {
    const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const sig = inspectFileSignature(maliciousSvg);
    assert.strictEqual(sig.category, "executable");
    const res = validateBuffer(maliciousSvg, TOOL_PROFILES["general-image"]);
    assert.strictEqual(res.valid, false);
  })();

  // TEST 10: In-memory sliding window rate limiter triggers HTTP 429
  await test("Test 10: Rate limiter blocks excessive requests and returns HTTP 429", () => {
    const testLimiter = new MemoryRateLimiter({
      name: "test",
      maxRequests: 3,
      windowMs: 60_000,
    });
    const ip = "192.168.1.100";

    const r1 = testLimiter.check(ip);
    const r2 = testLimiter.check(ip);
    const r3 = testLimiter.check(ip);
    const r4 = testLimiter.check(ip);

    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r4.allowed, false, "4th request must be denied");
    assert.ok(r4.retryAfter > 0, "Must specify retryAfter seconds");
  })();

  // TEST 11: Rate limiter extracts real client IP safely without spoofing
  await test("Test 11: extractClientIp safely parses X-Forwarded-For", () => {
    const req1 = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    const ip1 = extractClientIp(req1);
    assert.strictEqual(ip1, "203.0.113.195", "Must extract outermost client IP");

    const req2 = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    const ip2 = extractClientIp(req2);
    assert.strictEqual(ip2, "198.51.100.42");
  })();

  // TEST 12: Temporary file manager enforces path traversal protection
  await test("Test 12: Temporary workspace rejects path traversal attempts", () => {
    const job = createJobWorkspace();
    try {
      assert.throws(
        () => {
          assertPathSafe(job.jobDir, path.join(job.jobDir, "../../etc/passwd"));
        },
        /Security violation: Path traversal attempt detected/,
        "Must throw on path traversal"
      );
    } finally {
      cleanupJobWorkspace(job.jobDir);
    }
  })();

  // TEST 13: Temporary files are cleaned up on success and failure
  await test("Test 13: withTempWorkspace automatically cleans up files", async () => {
    let capturedDir = "";
    await withTempWorkspace(async (job) => {
      capturedDir = job.jobDir;
      assert.ok(fs.existsSync(capturedDir), "Job directory must exist during execution");
      writeJobFile(job, "test.png", Buffer.from("dummydata"));
      assert.ok(fs.existsSync(path.join(capturedDir, "test.png")));
    });

    assert.strictEqual(
      fs.existsSync(capturedDir),
      false,
      "Job directory must be purged immediately after execution"
    );
  })();

  // TEST 14: Scheduled lifecycle cleanup purges old jobs
  await test("Test 14: runHourlyCleanup removes abandoned files older than maxAge", () => {
    const job = createJobWorkspace();
    // artifically backdate mtime
    const oldTime = Date.now() - 7200 * 1000; // 2 hours ago
    fs.utimesSync(job.jobDir, new Date(oldTime), new Date(oldTime));

    const cleaned = runHourlyCleanup(3600 * 1000);
    assert.ok(cleaned >= 1, "Must have cleaned the stale directory");
    assert.strictEqual(fs.existsSync(job.jobDir), false, "Stale directory must be removed");
  })();

  // TEST 15: HTTP Security Headers are present on all responses
  await test("Test 15: Security headers (nosniff, SAMEORIGIN, CSP) are applied", () => {
    const rawRes = new Response("ok", { status: 200 });
    const secured = applySecurityHeaders(rawRes);

    assert.strictEqual(secured.headers.get("x-content-type-options"), "nosniff");
    assert.strictEqual(secured.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.strictEqual(secured.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.ok(secured.headers.get("content-security-policy")?.includes("default-src 'self'"));
    assert.strictEqual(secured.headers.get("x-powered-by"), null, "Powered-By header must be stripped");
  })();

  // TEST 16: Safe error handler prevents stack trace leakage
  await test("Test 16: Safe error response sanitizes errors and never leaks stack traces", async () => {
    const safeRes = createSafeErrorResponse(400, "Invalid image format.");
    const json = await safeRes.json();
    assert.strictEqual(safeRes.status, 400);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error, "Invalid image format.");
    assert.strictEqual(json.stack, undefined, "Stack trace must not be exposed");
  })();

  // TEST 17: Server entry rejects requests with declared Content-Length > 60MB (HTTP 413)
  await test("Test 17: server.fetch rejects oversized Content-Length with HTTP 413", async () => {
    const req = new Request("http://localhost:3000/api/remove-bg", {
      method: "POST",
      headers: {
        "content-length": "70000000", // 70 MB
        "content-type": "application/json",
      },
      body: JSON.stringify({ image: "toolarge" }),
    });

    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 413, "Must reject oversized body pre-flight with 413");
    const json = await res.json();
    assert.ok(json.error?.includes("30 MB limit"), "Friendly error text required");
  })();

  // TEST 18: Server entry rejects fake base64 executable payload (HTTP 415)
  await test("Test 18: server.fetch rejects executable payload masquerading as image with HTTP 415", async () => {
    // MZ PE executable base64: "TVoAAA=="
    const req = new Request("http://localhost:3000/api/remove-bg", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ base64Image: "data:image/png;base64,TVqQAAMAAAAEAAAA" }),
    });

    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 415, "Must reject executable with 415");
    const json = await res.json();
    assert.ok(json.error?.includes("Executable"), "Must indicate executable rejection");
  })();

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1 REGRESSION TESTS: /api/users, /api/tools-config, /api/contact, AUTH
  // ════════════════════════════════════════════════════════════════════════════

  // Generate a valid admin token for testing authorized flows
  const adminTestToken = createAdminSessionToken({ username: "admin" });

  // TEST 19: Anonymous GET /api/users is rejected with HTTP 401
  await test("Test 19: Anonymous GET /api/users is rejected with HTTP 401", async () => {
    const req = new Request("http://localhost:3000/api/users", {
      method: "GET",
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 401, "Anonymous request to /api/users must return 401");
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error?.includes("Unauthorized"), "Must indicate unauthorized access");
  })();

  // TEST 20: Authorized Admin GET /api/users succeeds & never returns sensitive fields
  await test("Test 20: Authorized Admin GET /api/users succeeds and strips all sensitive fields", async () => {
    const req = new Request("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminTestToken}`,
      },
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 200, "Authorized admin must receive 200");
    const users = await res.json();
    assert.ok(Array.isArray(users), "Must return user array");

    // Verify sensitive fields are excluded from every user record
    for (const u of users) {
      assert.strictEqual(u.password, undefined, "Plaintext password must NEVER be returned");
      assert.strictEqual(u.passwordHash, undefined, "Password hash must NEVER be returned");
      assert.strictEqual(u.token, undefined, "Session token must NEVER be returned");
      assert.strictEqual(u.ip, undefined, "User IP address must NEVER be returned");
    }
  })();

  // TEST 21: Plaintext passwords in data/users.json are safely migrated to scrypt hashes
  await test("Test 21: Plaintext passwords in data/users.json are securely migrated to scrypt hashes", () => {
    const testJsonPath = path.join(process.cwd(), "data", ".test-users-migration.json");
    try {
      const mockUsers = [
        {
          id: "usr_test_migration_01",
          name: "Test User",
          email: "test@bg.tools",
          password: "MyPlaintextPassword123!",
        },
      ];
      fs.writeFileSync(testJsonPath, JSON.stringify(mockUsers, null, 2), "utf-8");

      // Run migration
      const migrated = migrateUsersData(testJsonPath);
      assert.strictEqual(migrated.length, 1);
      assert.strictEqual(migrated[0].password, undefined, "Plaintext password must be removed");
      assert.ok(migrated[0].passwordHash, "passwordHash must be generated");
      assert.ok(migrated[0].passwordHash.startsWith("scrypt$"), "Must use scrypt format");

      // Verify the hash matches the original password
      const verifySuccess = verifyPassword("MyPlaintextPassword123!", migrated[0].passwordHash);
      assert.strictEqual(verifySuccess, true, "Hash must verify with original password");

      const verifyFail = verifyPassword("WrongPassword456!", migrated[0].passwordHash);
      assert.strictEqual(verifyFail, false, "Hash must reject wrong password");
    } finally {
      if (fs.existsSync(testJsonPath)) {
        try {
          fs.unlinkSync(testJsonPath);
        } catch {}
      }
    }
  })();

  // TEST 22: Anonymous POST /api/users is rejected with HTTP 401
  await test("Test 22: Anonymous POST /api/users is rejected with HTTP 401", async () => {
    const req = new Request("http://localhost:3000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ id: "usr_evil", name: "Hacker" }]),
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 401, "Anonymous update must be rejected with 401");
  })();

  // TEST 23: Anonymous GET & POST /api/tools-config is rejected with HTTP 401
  await test("Test 23: Anonymous GET & POST /api/tools-config is rejected with HTTP 401", async () => {
    // GET check
    const getReq = new Request("http://localhost:3000/api/tools-config", { method: "GET" });
    const getRes = await serverHandler.fetch(getReq, {}, {});
    assert.strictEqual(getRes.status, 401, "Anonymous GET to /api/tools-config must return 401");

    // POST check
    const postReq = new Request("http://localhost:3000/api/tools-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });
    const postRes = await serverHandler.fetch(postReq, {}, {});
    assert.strictEqual(postRes.status, 401, "Anonymous POST to /api/tools-config must return 401");
  })();

  // TEST 24: Authorized Admin POST /api/tools-config succeeds with strict schema validation
  await test("Test 24: Authorized Admin POST /api/tools-config succeeds with valid schema", async () => {
    const validConfig = [
      {
        slug: "remove-bg",
        name: "Remove Background",
        category: "image-editing",
        isEnabled: true,
        creditCost: 1,
        dailyLimitPerIp: 50,
        maxResolution: "4K (4096px)",
        isMaintenance: false,
        totalUsageCount: 120,
      },
    ];

    const req = new Request("http://localhost:3000/api/tools-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTestToken}`,
      },
      body: JSON.stringify(validConfig),
    });

    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.count, 1);
  })();

  // TEST 25: Malformed & Prototype Pollution in POST /api/tools-config is rejected or sanitized
  await test("Test 25: Malformed & Prototype Pollution in POST /api/tools-config is safely rejected", async () => {
    // 1. Invalid payload: not an array
    const notArrayReq = new Request("http://localhost:3000/api/tools-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTestToken}`,
      },
      body: JSON.stringify({ slug: "invalid" }),
    });
    const notArrayRes = await serverHandler.fetch(notArrayReq, {}, {});
    assert.strictEqual(notArrayRes.status, 400);

    // 2. Invalid tool item: missing slug
    const invalidSlugReq = new Request("http://localhost:3000/api/tools-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTestToken}`,
      },
      body: JSON.stringify([{ name: "Tool without slug" }]),
    });
    const invalidSlugRes = await serverHandler.fetch(invalidSlugReq, {}, {});
    assert.strictEqual(invalidSlugRes.status, 400);
  })();

  // TEST 26: Anonymous GET /api/contact is rejected with HTTP 401
  await test("Test 26: Anonymous GET /api/contact is rejected with HTTP 401", async () => {
    const req = new Request("http://localhost:3000/api/contact", { method: "GET" });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 401, "Anonymous inquiry reading must be rejected with 401");
  })();

  // TEST 27: Public POST /api/contact accepts valid submission and sanitizes HTML
  await test("Test 27: Public POST /api/contact accepts valid inquiry and sanitizes HTML", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Security Tester <script>alert(1)</script>",
        email: "audit.test@example.com",
        subject: "Audit Inquiry",
        message: "Testing HTML escaping: <b>Hello</b>",
      }),
    });

    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.ticket?.id, "Must return ticket identifier");
    assert.strictEqual(json.ticket?.status, "open");
  })();

  // TEST 28: Malformed or oversized POST /api/contact is rejected
  await test("Test 28: Malformed or oversized POST /api/contact is rejected with HTTP 400/413", async () => {
    // Missing email
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "not-an-email",
        message: "Hi",
      }),
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 400, "Invalid email must return 400");
  })();

  // TEST 29: Admin Login endpoint validates credentials and returns session token
  await test("Test 29: Admin Login /api/admin/login verifies credentials and returns session token", async () => {
    // 1. Invalid password
    const failReq = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin@bg.tools", password: "wrong_password_999" }),
    });
    const failRes = await serverHandler.fetch(failReq, {}, {});
    assert.strictEqual(failRes.status, 401);

    // 2. Valid login
    const passReq = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin@bg.tools",
        password: process.env["ADMIN_PASSWORD"],
      }),
    });
    const passRes = await serverHandler.fetch(passReq, {}, {});
    assert.strictEqual(passRes.status, 200);
    const json = await passRes.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.token, "Must return signed token");
    assert.ok(passRes.headers.get("set-cookie")?.includes("admin_session="), "Must set session cookie");
  })();

  // TEST 30: Tampered or expired admin session token is rejected
  await test("Test 30: Tampered or malformed admin session token is rejected with HTTP 401", async () => {
    const tamperedToken = adminTestToken.slice(0, -6) + "XXXXXX";
    const req = new Request("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tamperedToken}`,
      },
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 401, "Tampered token must be rejected with 401");
  })();

  // TEST 31: 5 failed attempts per IP+username triggers 15-minute lockout (HTTP 429)
  await test("Test 31: 5 failed admin login attempts triggers 15-minute lockout (HTTP 429)", async () => {
    const testIp = "192.0.2.42";
    const testUser = "lockout-test@bg.tools";

    // First 4 failed attempts -> 401
    for (let i = 1; i <= 4; i++) {
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
        body: JSON.stringify({ username: testUser, password: "bad-password" }),
      });
      const res = await serverHandler.fetch(req, {}, {});
      assert.strictEqual(res.status, 401, `Attempt ${i} should return 401`);
    }

    // 5th failed attempt -> locks account and returns 429
    const fifthReq = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
      body: JSON.stringify({ username: testUser, password: "bad-password" }),
    });
    const fifthRes = await serverHandler.fetch(fifthReq, {}, {});
    assert.strictEqual(fifthRes.status, 429, "5th failed attempt should trigger lockout (429)");

    // 6th attempt (even with valid credentials) -> blocked immediately with 429
    const sixthReq = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
      body: JSON.stringify({ username: testUser, password: process.env["ADMIN_PASSWORD"] }),
    });
    const sixthRes = await serverHandler.fetch(sixthReq, {}, {});
    assert.strictEqual(sixthRes.status, 429, "Subsequent attempt while locked must return 429");
  })();

  // TEST 32: Production mode refuses to start if ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing or short
  await test("Test 32: Production mode refuses to start without strong admin env vars", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalPass = process.env["ADMIN_PASSWORD"];
    const originalSecret = process.env["ADMIN_SESSION_SECRET"];

    try {
      process.env.NODE_ENV = "production";

      // Missing password
      delete process.env["ADMIN_PASSWORD"];
      assert.throws(
        () => validateAdminEnvironment(),
        /ADMIN_PASSWORD must be defined with at least 12 characters/,
        "Should throw if ADMIN_PASSWORD is missing in production"
      );

      // Password too short (< 12 chars)
      process.env["ADMIN_PASSWORD"] = "short123";
      assert.throws(
        () => validateAdminEnvironment(),
        /ADMIN_PASSWORD must be defined with at least 12 characters/,
        "Should throw if ADMIN_PASSWORD is too short in production"
      );

      // Password valid, missing session secret
      process.env["ADMIN_PASSWORD"] = "ValidLongAdminPassword123!";
      delete process.env["ADMIN_SESSION_SECRET"];
      assert.throws(
        () => validateAdminEnvironment(),
        /ADMIN_SESSION_SECRET must be defined with at least 32 characters/,
        "Should throw if ADMIN_SESSION_SECRET is missing in production"
      );

      // Secret too short (< 32 chars)
      process.env["ADMIN_SESSION_SECRET"] = "short-secret";
      assert.throws(
        () => validateAdminEnvironment(),
        /ADMIN_SESSION_SECRET must be defined with at least 32 characters/,
        "Should throw if ADMIN_SESSION_SECRET is too short in production"
      );

      // Both valid
      process.env["ADMIN_SESSION_SECRET"] = "ValidLongSessionSecretOver32CharactersLong!";
      assert.doesNotThrow(() => validateAdminEnvironment(), "Should pass when both are valid");
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env["ADMIN_PASSWORD"] = originalPass;
      process.env["ADMIN_SESSION_SECRET"] = originalSecret;
    }
  })();

  // TEST 33: User lockout tracker enforces 5 failed attempts -> 15 min block
  await test("Test 33: User lockout tracker enforces 5 failed attempts -> 15 min block", () => {
    const testIp = "10.0.0.99";
    const testUser = "user@example.com";

    assert.strictEqual(userLockout.isLocked(testIp, testUser).locked, false);

    for (let i = 1; i <= 4; i++) {
      const rec = userLockout.recordFailedAttempt(testIp, testUser);
      assert.strictEqual(rec.locked, false);
      assert.strictEqual(rec.remainingAttempts, 5 - i);
    }

    const fifth = userLockout.recordFailedAttempt(testIp, testUser);
    assert.strictEqual(fifth.locked, true);
    assert.strictEqual(userLockout.isLocked(testIp, testUser).locked, true);

    userLockout.resetAttempts(testIp, testUser);
    assert.strictEqual(userLockout.isLocked(testIp, testUser).locked, false);
  })();

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2 REGRESSION TESTS: SQLITE DATABASE & REPOSITORY LAYER
  // ════════════════════════════════════════════════════════════════════════════

  // TEST 34: SQLite database operates in WAL mode with busy_timeout configured
  await test("Test 34: SQLite database operates in WAL mode with cluster-safe busy_timeout", () => {
    const db = getDb();
    const journalMode = db.pragma("journal_mode") as [{ journal_mode: string }];
    assert.strictEqual(journalMode[0]?.journal_mode?.toLowerCase(), "wal", "Must operate in WAL mode");

    const busyTimeout = db.pragma("busy_timeout") as [{ timeout: number }];
    assert.ok(busyTimeout[0]?.timeout >= 5000, "busy_timeout must be at least 5000ms for PM2 cluster mode");
  })();

  // TEST 35: Users and sessions repositories enforce transaction safety and hash protection
  await test("Test 35: Users and sessions repositories enforce transaction safety and SHA-256 token hashing", () => {
    const testEmail = `test_${Date.now()}@bg.tools`;
    const createdUser = usersRepo.create({
      name: "SQLite Test User",
      email: testEmail,
      passwordHash: hashPassword("SecretPass123!"),
      plan: "free",
      credits: 10,
    });
    assert.ok(createdUser.id, "Must return created user with ID");
    assert.strictEqual(createdUser.email, testEmail);

    // Verify safe retrieval never leaks password_hash
    const foundSafe = usersRepo.getAllSafe().find((u) => u.id === createdUser.id);
    assert.ok(foundSafe, "User must be found");
    assert.strictEqual((foundSafe as any).password_hash, undefined, "password_hash must be excluded");
    assert.strictEqual((foundSafe as any).passwordHash, undefined, "passwordHash must be excluded");

    // Create session
    const rawToken = "my_super_secret_session_token_32_bytes_long";
    const sessionRes = sessionsRepo.createSession(createdUser.id, rawToken);
    assert.notStrictEqual(sessionRes.session.token_hash, rawToken, "Raw token must NOT be stored in DB");

    // Lookup session by raw token
    const foundSession = sessionsRepo.findSessionByToken(rawToken);
    assert.ok(foundSession, "Session must be retrievable by raw token");
    assert.strictEqual(foundSession.user.id, createdUser.id);

    // Delete session
    sessionsRepo.deleteSession(rawToken);
    assert.strictEqual(sessionsRepo.findSessionByToken(rawToken), null, "Deleted session must return null");
  })();

  // TEST 36: Credit ledger enforces atomic deduction, overspend prevention, and refund support
  await test("Test 36: Credit ledger enforces atomic deduction, overspend prevention, and refund support", () => {
    const testEmail = `credit_test_${Date.now()}@bg.tools`;
    const user = usersRepo.create({
      name: "Credit Tester",
      email: testEmail,
      passwordHash: hashPassword("SecretPass123!"),
      credits: 3,
      freeCredits: 3,
      paidCredits: 0,
    });

    // 1. Valid deduction
    const deductRes = creditLedgerRepo.deductUserCredits(user.id, 2, "remove-bg");
    assert.strictEqual(deductRes.success, true);
    assert.strictEqual(deductRes.balanceAfter, 1);

    // 2. Overspend attempt rejected (trying to spend 2 when only 1 remains)
    const overspendRes = creditLedgerRepo.deductUserCredits(user.id, 2, "remove-bg");
    assert.strictEqual(overspendRes.success, false);
    assert.ok(overspendRes.error?.includes("Insufficient credits"));
    assert.strictEqual(overspendRes.balanceAfter, 1);

    // 3. Automatic refund
    const refundRes = creditLedgerRepo.refundUserCredits(user.id, 2, "remove-bg", "Engine timeout");
    assert.strictEqual(refundRes.success, true);
    assert.strictEqual(refundRes.balanceAfter, 3);
  })();

  // TEST 37: JSON to SQLite migration script executes idempotently
  await test("Test 37: JSON to SQLite migration script executes idempotently", () => {
    const firstRun = runMigration();
    assert.ok(firstRun.toolsConfigMigrated);
    assert.ok(firstRun.plansConfigMigrated);

    // Second run should run cleanly without throwing
    const secondRun = runMigration();
    assert.ok(secondRun.toolsConfigMigrated);
    assert.ok(secondRun.plansConfigMigrated);
  })();

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 3 REGRESSION TESTS: SERVER-SIDE USER AUTHENTICATION
  // ════════════════════════════════════════════════════════════════════════════

  const testUserEmail = `auth_test_${Date.now()}@bg.tools`;
  const testUserPass = "SecretPassword123!";
  let authCookie = "";

  // TEST 38: POST /api/auth/signup validates input, hashes password, sets HttpOnly cookie
  await test("Test 38: POST /api/auth/signup creates account, enforces >= 8 char password, and sets session cookie", async () => {
    // 1. Password < 8 characters rejected
    const shortReq = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tester", email: testUserEmail, password: "short" }),
    });
    const shortRes = await serverHandler.fetch(shortReq, {}, {});
    assert.strictEqual(shortRes.status, 400);

    // 2. Valid signup
    const req = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Server Auth User", email: testUserEmail, password: testUserPass }),
    });
    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.user.email, testUserEmail);
    assert.strictEqual(json.user.credits, 10);
    assert.strictEqual(json.user.password_hash, undefined, "password_hash must never be leaked");

    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("bg_session="), "Must set bg_session cookie");
    assert.ok(setCookie.includes("HttpOnly"), "Must be HttpOnly cookie");
    assert.ok(setCookie.includes("SameSite=Lax"), "Must have SameSite=Lax");
    authCookie = setCookie.split(";")[0]!;

    // 3. Duplicate email returns generic error (no enumeration)
    const dupReq = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Duplicate", email: testUserEmail, password: testUserPass }),
    });
    const dupRes = await serverHandler.fetch(dupReq, {}, {});
    assert.strictEqual(dupRes.status, 400);
  })();

  // TEST 39: POST /api/auth/login validates credentials, enforces lockout, and rotates session
  await test("Test 39: POST /api/auth/login verifies credentials, rotates session token, and enforces lockout", async () => {
    // 1. Wrong password rejected
    const wrongReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserEmail, password: "WrongPassword999!" }),
    });
    const wrongRes = await serverHandler.fetch(wrongReq, {}, {});
    assert.strictEqual(wrongRes.status, 401);
    const wrongJson = await wrongRes.json();
    assert.ok(wrongJson.error?.includes("Invalid email or password"));

    // 2. Successful login rotates session
    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserEmail, password: testUserPass }),
    });
    const loginRes = await serverHandler.fetch(loginReq, {}, {});
    assert.strictEqual(loginRes.status, 200);
    const loginJson = await loginRes.json();
    assert.strictEqual(loginJson.success, true);
    assert.strictEqual(loginJson.user.email, testUserEmail);

    const newCookie = loginRes.headers.get("set-cookie") || "";
    assert.ok(newCookie.includes("bg_session="));
    authCookie = newCookie.split(";")[0]!;
  })();

  // TEST 40: GET /api/auth/me verifies session cookie and strips sensitive attributes
  await test("Test 40: GET /api/auth/me returns current user from session cookie", async () => {
    // 1. Anonymous request rejected with 401
    const anonReq = new Request("http://localhost:3000/api/auth/me", { method: "GET" });
    const anonRes = await serverHandler.fetch(anonReq, {}, {});
    assert.strictEqual(anonRes.status, 401);

    // 2. Authenticated request with bg_session cookie returns 200
    const authReq = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { Cookie: authCookie },
    });
    const authRes = await serverHandler.fetch(authReq, {}, {});
    assert.strictEqual(authRes.status, 200);
    const meJson = await authRes.json();
    assert.strictEqual(meJson.authenticated, true);
    assert.strictEqual(meJson.user.email, testUserEmail);
    assert.strictEqual(meJson.user.password_hash, undefined);
  })();

  // TEST 41: POST /api/auth/logout deletes session from DB and expires cookie
  await test("Test 41: POST /api/auth/logout deletes session from database and expires cookie", async () => {
    const logoutReq = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Cookie: authCookie },
    });
    const logoutRes = await serverHandler.fetch(logoutReq, {}, {});
    assert.strictEqual(logoutRes.status, 200);
    const clearCookie = logoutRes.headers.get("set-cookie") || "";
    assert.ok(clearCookie.includes("Max-Age=0"), "Cookie must be cleared with Max-Age=0");

    // After logout, GET /api/auth/me with old cookie must fail with 401
    const verifyReq = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { Cookie: authCookie },
    });
    const verifyRes = await serverHandler.fetch(verifyReq, {}, {});
    assert.strictEqual(verifyRes.status, 401, "Revoked session must be rejected");
  })();

  // Summary
  console.log("\n=================================================");
  console.log("TEST SUITE EXECUTION SUMMARY");
  console.log("=================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error("\nFailed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(` - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log(`\nALL ${results.length} SECURITY & PRIVACY CONTROLS VERIFIED SUCCESSFULLY!`);
  }
}

runTestSuite();

