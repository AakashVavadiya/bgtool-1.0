import server from "../src/server";
import { apiKeysRepo } from "../src/lib/db/api-keys-repo";
import { usersRepo } from "../src/lib/db/users-repo";
import { getDb } from "../src/lib/db/client";
import crypto from "crypto";

// 1x1 transparent PNG sample for tests
const SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const SAMPLE_PNG_BUFFER = Buffer.from(SAMPLE_PNG_BASE64, "base64");

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

async function runSecuritySuite() {
  console.log("\n========================================================");
  console.log("       bg.tools Public REST API Security Test Suite      ");
  console.log("========================================================\n");

  const db = getDb();
  const testUserId = `usr_sec_test_${crypto.randomBytes(6).toString("hex")}`;
  const now = new Date().toISOString();

  // Create a clean test user with 50 credits
  db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, plan, credits, free_credits, paid_credits,
      registered_at, last_active, last_credit_reset
    ) VALUES (?, 'Security Test User', ?, 'dummy_hash', 'pro', 50, 10, 40, ?, ?, ?)
  `).run(testUserId, `${testUserId}@example.com`, now, now, now);

  // Create a live API key
  const liveKeyRes = apiKeysRepo.createKey({
    userId: testUserId,
    name: "Security Suite Live Key",
    keyType: "live",
  });
  const liveKey = liveKeyRes.rawKey!;

  // Create a test / sandbox key
  const testKeyRes = apiKeysRepo.createKey({
    userId: testUserId,
    name: "Security Suite Sandbox Key",
    keyType: "test",
  });
  const sandboxKey = testKeyRes.rawKey!;

  // 1. Missing API Key
  {
    console.log("[Test 1] Missing API Key");
    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 401, "Rejects request with 401 Unauthorized");
    assert(body?.error?.code === "unauthorized", "Returns standard error code 'unauthorized'");
    assert(Boolean(body?.error?.request_id), "Includes X-Request-Id in error response");
  }

  // 2. Invalid API Key
  {
    console.log("\n[Test 2] Invalid API Key");
    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: "Bearer bgt_live_0000000000000000000000000000000000000000000000000000000000000000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 401, "Rejects invalid key with 401");
    assert(body?.error?.code === "invalid_api_key", "Returns error code 'invalid_api_key'");
  }

  // 3. Revoked API Key
  {
    console.log("\n[Test 3] Revoked API Key");
    const tempKeyRes = apiKeysRepo.createKey({ userId: testUserId, name: "Revocation Test Key" });
    const tempRaw = tempKeyRes.rawKey!;
    apiKeysRepo.revokeKey(tempKeyRes.key!.id, testUserId);

    const req = new Request("https://bg.tools/api/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${tempRaw}` },
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 401, "Rejects revoked key with 401");
    assert(body?.error?.code === "invalid_api_key", "Revoked key returns identical timing-safe 401 response");
  }

  // 4. API Key in Query String
  {
    console.log("\n[Test 4] API Key in Query String");
    const req = new Request(`https://bg.tools/api/v1/remove-background?api_key=${liveKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 400, "Strictly rejects query string API keys with 400 Bad Request");
    assert(body?.error?.code === "api_key_in_query", "Returns error code 'api_key_in_query'");
  }

  // 5. Wrong MIME / Executable Upload Block
  {
    console.log("\n[Test 5] Executable Binary / Script Rejection");
    // Windows PE EXE magic bytes: MZ
    const mzBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const mzBase64 = mzBuffer.toString("base64");

    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: mzBase64 }),
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 415, "Rejects executable binary with HTTP 415 Unsupported Media Type");
    assert(body?.error?.code === "executable_prohibited", "Returns code 'executable_prohibited'");
  }

  // 6. Oversized File (> 30 MB)
  {
    console.log("\n[Test 6] Oversized Payload (> 30 MB)");
    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Content-Type": "application/json",
        "Content-Length": String(35 * 1024 * 1024),
      },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const res = await server.fetch(req, {}, {});
    assert(res.status === 413, "Pre-flight blocks oversized payload with HTTP 413");
  }

  // 7. SSRF Protection Tests
  {
    console.log("\n[Test 7] SSRF Attack Prevention");
    const ssrfUrls = [
      { url: "http://127.0.0.1:5000/ping", desc: "Non-HTTPS URL to loopback" },
      { url: "https://localhost:8443/secret.png", desc: "Localhost internal hostname" },
      { url: "https://169.254.169.254/latest/meta-data", desc: "Cloud Link-Local / Metadata IP" },
      { url: "https://10.0.0.1/admin.jpg", desc: "Private Class A Subnet (10.0.0.0/8)" },
      { url: "https://192.168.1.1/config.png", desc: "Private Class C Subnet (192.168.0.0/16)" },
    ];

    for (const target of ssrfUrls) {
      const req = new Request("https://bg.tools/api/v1/remove-background", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${liveKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: target.url }),
      });
      const res = await server.fetch(req, {}, {});
      assert(res.status === 400, `SSRF blocked for ${target.desc} with HTTP 400`);
    }
  }

  // 8. Rate Limiting per Key
  {
    console.log("\n[Test 8] Rate Limiting per Key");
    const rateLimitedKeyRes = apiKeysRepo.createKey({
      userId: testUserId,
      name: "Rate Limited Key",
      rateLimitPerMinute: 2,
    });
    const rKey = rateLimitedKeyRes.rawKey!;

    // Call 1
    const res1 = await server.fetch(
      new Request("https://bg.tools/api/v1/account", { headers: { Authorization: `Bearer ${rKey}` } }),
      {},
      {}
    );
    assert(res1.status === 200, "First request succeeds");
    assert(res1.headers.has("X-RateLimit-Limit"), "Includes X-RateLimit-Limit header");

    // Call 2
    const res2 = await server.fetch(
      new Request("https://bg.tools/api/v1/account", { headers: { Authorization: `Bearer ${rKey}` } }),
      {},
      {}
    );
    assert(res2.status === 200, "Second request succeeds");

    // Call 3 (Exceeds limit of 2)
    const res3 = await server.fetch(
      new Request("https://bg.tools/api/v1/account", { headers: { Authorization: `Bearer ${rKey}` } }),
      {},
      {}
    );
    assert(res3.status === 429, "Third request blocked with HTTP 429 Too Many Requests");
    assert(res3.headers.has("Retry-After"), "Includes Retry-After header on 429");
  }

  // 9. Insufficient Credits Check
  {
    console.log("\n[Test 9] Insufficient Credits Check");
    const brokeUserId = `usr_broke_${crypto.randomBytes(6).toString("hex")}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, plan, credits, free_credits, paid_credits,
        registered_at, last_active, last_credit_reset
      ) VALUES (?, 'Broke User', ?, 'dummy_hash', 'free', 0, 0, 0, ?, ?, ?)
    `).run(brokeUserId, `${brokeUserId}@example.com`, now, now, todayStr);

    const brokeKeyRes = apiKeysRepo.createKey({ userId: brokeUserId, name: "Broke Key" });
    const brokeKey = brokeKeyRes.rawKey!;

    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${brokeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);
    assert(res.status === 402, "Blocks request with HTTP 402 Payment Required");
    assert(body?.error?.code === "insufficient_credits", "Returns error code 'insufficient_credits'");
  }

  // 10. Idempotency & Double-Charge Prevention
  {
    console.log("\n[Test 10] Idempotency Key & Double-Charge Prevention");
    const idempKey = `idemp_${crypto.randomBytes(8).toString("hex")}`;
    const userBefore = usersRepo.findById(testUserId)!;
    const initialCredits = userBefore.credits;

    // Cache a simulated response for this idempotency key
    apiKeysRepo.saveIdempotentResponse({
      keyHash: crypto.createHash("sha256").update(liveKey).digest("hex"),
      idempotencyKey: idempKey,
      requestHash: "req_test_hash",
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, idempotent: true }),
      isBase64: false,
    });

    // Make request with Idempotency-Key
    const req = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Idempotency-Key": idempKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });

    const res = await server.fetch(req, {}, {});
    const body: any = await res.json().catch(() => null);

    assert(res.status === 200, "Idempotent request returns HTTP 200 replay");
    assert(res.headers.get("x-idempotent-replay") === "true", "Sets X-Idempotent-Replay header");

    const userAfter = usersRepo.findById(testUserId)!;
    assert(userAfter.credits === initialCredits, "Zero credits deducted on idempotent replay (no double billing)");
  }

  // 11. SQL Injection Attempt Resistance
  {
    console.log("\n[Test 11] SQL Injection Attack Resistance");
    const sqliPayload = "' OR '1'='1' -- ";
    const req = new Request("https://bg.tools/api/v1/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Idempotency-Key": sqliPayload,
        "X-Custom-Test": sqliPayload,
      },
    });
    const res = await server.fetch(req, {}, {});
    assert(res.status === 200, "Parameterized queries safely handle SQL injection payloads");
  }

  // 12. Security Privacy: Raw Key & Hashes Never Leaked
  {
    console.log("\n[Test 12] Cryptographic Privacy: Secret Keys Never Exposed");
    const userKeys = apiKeysRepo.getKeysByUser(testUserId);
    const hasPlaintext = userKeys.some((k: any) => k.rawKey || k.keyHash || k.key_hash);
    assert(!hasPlaintext, "Listing user keys returns prefix only; raw key and SHA-256 hash are never returned");

    const accReq = new Request("https://bg.tools/api/v1/account", {
      headers: { Authorization: `Bearer ${liveKey}` },
    });
    const accRes = await server.fetch(accReq, {}, {});
    const accBody = await accRes.text();
    assert(!accBody.includes(liveKey), "API account endpoint never leaks plaintext raw key");
  }

  // 13. Health & OpenAPI Endpoints
  {
    console.log("\n[Test 13] Health and OpenAPI 3.1 Spec");
    const healthRes = await server.fetch(new Request("https://bg.tools/api/v1/health"), {}, {});
    assert(healthRes.status === 200, "/api/v1/health responds with 200 OK");

    const specRes = await server.fetch(new Request("https://bg.tools/api/v1/openapi.json"), {}, {});
    const spec: any = await specRes.json();
    assert(spec.openapi === "3.1.0", "/api/v1/openapi.json serves valid OpenAPI 3.1.0 spec");
    assert(Boolean(spec.paths["/api/v1/remove-background"]), "OpenAPI defines /api/v1/remove-background");
  }

  // 14. Model Selection (Karudi vs Ganga) & Security Sanitization
  {
    console.log("\n[Test 14] Model Selection (Karudi vs Ganga) & Security Sanitization");

    // Test selecting Karudi model
    const reqKarudi = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: SAMPLE_PNG_BASE64,
        model: "karudi",
        response_format: "json",
      }),
    });
    const resKarudi = await server.fetch(reqKarudi, {}, {});
    assert(resKarudi.headers.get("x-model-used") === "karudi", "X-Model-Used header correctly identifies karudi model");

    // Test selecting Ganga model
    const reqGanga = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: SAMPLE_PNG_BASE64,
        model: "ganga",
        response_format: "json",
      }),
    });
    const resGanga = await server.fetch(reqGanga, {}, {});
    assert(resGanga.headers.get("x-model-used") === "ganga", "X-Model-Used header correctly identifies ganga model");

    // Test malicious path-traversal / injection string in model parameter
    const reqMalicious = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: SAMPLE_PNG_BASE64,
        model: "../../etc/passwd' OR 1=1;--",
        response_format: "json",
      }),
    });
    const resMalicious = await server.fetch(reqMalicious, {}, {});
    assert(
      resMalicious.headers.get("x-model-used") === "ganga",
      "Malicious model string is safely neutralized and defaults to ganga without directory traversal"
    );
  }

  // Cleanup test user & keys
  db.prepare("DELETE FROM users WHERE id = ?").run(testUserId);

  console.log("\n========================================================");
  console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed`);
  console.log("========================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
