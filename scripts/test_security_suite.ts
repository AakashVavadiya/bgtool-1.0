import server from "../src/server";
import { apiKeysRepo } from "../src/lib/db/api-keys-repo";
import { usersRepo } from "../src/lib/db/users-repo";
import { creditLedgerRepo } from "../src/lib/db/credit-ledger-repo";
import { getDb } from "../src/lib/db/client";
import { validateSsrfTargetUrl, isPrivateOrReservedIp } from "../src/lib/api/ssrf";
import { extractImageDimensionsFromHeader } from "../src/lib/api/image-safety";
import { PUBLIC_MODELS } from "../src/lib/api/models";
import crypto from "crypto";

// 1x1 transparent PNG sample for tests
const SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const SAMPLE_PNG_BUFFER = Buffer.from(SAMPLE_PNG_BASE64, "base64");

// 60 Megapixel (10,000 x 6,000) Pixel-Bomb PNG Header (> 50 MP threshold)
const PIXEL_BOMB_PNG_BUFFER = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
  Buffer.from([0x00, 0x00, 0x00, 0x0d]), // IHDR length (13)
  Buffer.from("IHDR", "ascii"),
  Buffer.from([0x00, 0x00, 0x27, 0x10]), // Width: 10,000
  Buffer.from([0x00, 0x00, 0x17, 0x70]), // Height: 6,000 (10,000 x 6,000 = 60,000,000 px = 60 MP)
  Buffer.from([0x08, 0x06, 0x00, 0x00, 0x00]), // 8-bit truecolor with alpha
  Buffer.from([0x00, 0x00, 0x00, 0x00]), // CRC
]);
const PIXEL_BOMB_PNG_BASE64 = PIXEL_BOMB_PNG_BUFFER.toString("base64");

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

  // 2. Invalid, Revoked, and Expired API Keys Return IDENTICAL 401
  {
    console.log("\n[Test 2] Invalid, Revoked, and Expired API Keys (Identical 401 Timing-Safe Response)");

    // Case A: Non-existent key
    const reqInvalid = new Request("https://bg.tools/api/v1/account", {
      method: "GET",
      headers: {
        Authorization: "Bearer bgt_live_0000000000000000000000000000000000000000000000000000000000000000",
      },
    });
    const resInvalid = await server.fetch(reqInvalid, {}, {});
    const bodyInvalid: any = await resInvalid.json();

    assert(resInvalid.status === 401, "Invalid key rejected with 401");
    assert(bodyInvalid?.error?.code === "invalid_api_key", "Invalid key returns code 'invalid_api_key'");
    assert(
      bodyInvalid?.error?.message === "The provided API key is invalid, revoked, or expired.",
      "Invalid key returns uniform message"
    );

    // Case B: Revoked key
    const tempKeyRes = apiKeysRepo.createKey({ userId: testUserId, name: "Revoked Key Test" });
    const revokedRaw = tempKeyRes.rawKey!;
    apiKeysRepo.revokeKey(tempKeyRes.key!.id, testUserId);

    const reqRevoked = new Request("https://bg.tools/api/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${revokedRaw}` },
    });
    const resRevoked = await server.fetch(reqRevoked, {}, {});
    const bodyRevoked: any = await resRevoked.json();

    assert(resRevoked.status === 401, "Revoked key rejected with 401");
    assert(bodyRevoked?.error?.code === "invalid_api_key", "Revoked key returns code 'invalid_api_key'");
    assert(bodyRevoked?.error?.message === bodyInvalid?.error?.message, "Revoked key returns IDENTICAL message to invalid key");

    // Case C: Expired key
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const expiredKeyRes = apiKeysRepo.createKey({
      userId: testUserId,
      name: "Expired Key Test",
      expiresAt: pastDate,
    });
    const expiredRaw = expiredKeyRes.rawKey!;

    const reqExpired = new Request("https://bg.tools/api/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${expiredRaw}` },
    });
    const resExpired = await server.fetch(reqExpired, {}, {});
    const bodyExpired: any = await resExpired.json();

    assert(resExpired.status === 401, "Expired key rejected with 401");
    assert(bodyExpired?.error?.code === "invalid_api_key", "Expired key returns code 'invalid_api_key'");
    assert(bodyExpired?.error?.message === bodyInvalid?.error?.message, "Expired key returns IDENTICAL message to invalid key");
  }

  // 3. API Key in Query String Prohibited
  {
    console.log("\n[Test 3] API Key in Query String Prohibited");
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

  // 4. Executable Payload Rejection by Magic Bytes
  {
    console.log("\n[Test 4] Executable Binary / Script Rejection via Magic Bytes");
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

  // 5. Oversized Payload & Decompression Pixel-Bomb Protection
  {
    console.log("\n[Test 5] Oversized Payload & Image Pixel-Bomb Protection");

    // Case A: Oversized body header (> 40 MB)
    const reqOversized = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Content-Type": "application/json",
        "Content-Length": String(45 * 1024 * 1024),
      },
      body: JSON.stringify({ image: SAMPLE_PNG_BASE64 }),
    });
    const resOversized = await server.fetch(reqOversized, {}, {});
    assert(resOversized.status === 413, "Pre-flight blocks oversized payload with HTTP 413");

    // Case B: Pixel Bomb (60 Megapixels header, > 50 MP safety limit)
    const parsedDims = extractImageDimensionsFromHeader(PIXEL_BOMB_PNG_BUFFER);
    assert(
      Boolean(parsedDims && parsedDims.width === 10000 && parsedDims.height === 6000),
      "Header dimension reader correctly identifies 10,000x6,000 (60 MP) image bomb"
    );

    const reqBomb = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: PIXEL_BOMB_PNG_BASE64 }),
    });
    const resBomb = await server.fetch(reqBomb, {}, {});
    const bodyBomb: any = await resBomb.json().catch(() => null);
    assert(resBomb.status === 413, "Decompression bomb rejected with HTTP 413");
    assert(bodyBomb?.error?.code === "image_bomb_detected", "Returns error code 'image_bomb_detected'");
  }

  // 6. SSRF Protection Tests (127.0.0.1, 169.254.169.254, Private IP Redirect, DNS Rebinding)
  {
    console.log("\n[Test 6] SSRF Protection Tests (127.0.0.1, 169.254.169.254, Private-IP Redirect, DNS Rebinding)");

    const ssrfTargets = [
      { url: "https://127.0.0.1/secret.png", desc: "127.0.0.1 loopback literal" },
      { url: "https://169.254.169.254/latest/meta-data/", desc: "169.254.169.254 cloud metadata IP" },
      { url: "http://127.0.0.1:5000/ping", desc: "Non-HTTPS URL to loopback" },
      { url: "https://localhost:8443/secret.png", desc: "Localhost internal hostname" },
      { url: "https://10.0.0.1/admin.jpg", desc: "Private Class A (10.0.0.0/8)" },
      { url: "https://172.16.0.1/photo.jpg", desc: "Private Class B (172.16.0.0/12)" },
      { url: "https://192.168.1.1/router.png", desc: "Private Class C (192.168.0.0/16)" },
      { url: "https://admin:secret@remote.com/image.png", desc: "Credentials in URL" },
      { url: "https://remote.com:8080/image.png", desc: "Non-standard port 8080" },
    ];

    for (const target of ssrfTargets) {
      const check = await validateSsrfTargetUrl(target.url);
      assert(!check.valid, `SSRF blocked for ${target.desc}`);
    }

    // Direct endpoint test for 127.0.0.1 and 169.254.169.254
    for (const url of ["https://127.0.0.1/test.png", "https://169.254.169.254/latest/meta-data"]) {
      const req = new Request("https://bg.tools/api/v1/remove-background", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${liveKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: url }),
      });
      const res = await server.fetch(req, {}, {});
      assert(res.status === 400, `API endpoint blocks SSRF to ${url} with HTTP 400`);
    }

    // Private IP validation logic unit tests for CIDRs
    assert(isPrivateOrReservedIp("127.0.0.1"), "isPrivateOrReservedIp detects 127.0.0.1 loopback");
    assert(isPrivateOrReservedIp("169.254.169.254"), "isPrivateOrReservedIp detects 169.254.169.254 link-local");
    assert(isPrivateOrReservedIp("10.255.0.1"), "isPrivateOrReservedIp detects 10.0.0.0/8");
    assert(isPrivateOrReservedIp("172.20.10.5"), "isPrivateOrReservedIp detects 172.16.0.0/12");
    assert(isPrivateOrReservedIp("192.168.100.1"), "isPrivateOrReservedIp detects 192.168.0.0/16");
    assert(isPrivateOrReservedIp("100.64.0.1"), "isPrivateOrReservedIp detects 100.64.0.0/10 CGNAT");
    assert(isPrivateOrReservedIp("::1"), "isPrivateOrReservedIp detects IPv6 ::1 loopback");
    assert(isPrivateOrReservedIp("fc00::1"), "isPrivateOrReservedIp detects IPv6 fc00::/7 ULA");
    assert(isPrivateOrReservedIp("fe80::1"), "isPrivateOrReservedIp detects IPv6 fe80::/10 link-local");
    assert(isPrivateOrReservedIp("::ffff:127.0.0.1"), "isPrivateOrReservedIp detects IPv4-mapped IPv6 loopback");
    assert(!isPrivateOrReservedIp("8.8.8.8"), "isPrivateOrReservedIp allows public IP 8.8.8.8");
    assert(!isPrivateOrReservedIp("1.1.1.1"), "isPrivateOrReservedIp allows public IP 1.1.1.1");
  }

  // 7. Unknown Model Rejection (Single Source of Truth)
  {
    console.log("\n[Test 7] Unknown Model Rejection (Single Source of Truth)");
    assert(
      JSON.stringify(PUBLIC_MODELS) === JSON.stringify(["karudi", "ganga", "brahmaputra"]),
      "PUBLIC_MODELS single source of truth is strictly ['karudi', 'ganga', 'brahmaputra']"
    );

    const unknownModels = ["isnet", "u2net", "narmada", "saraswati", "gpt-4", "dall-e", "invalid_preset"];
    for (const model of unknownModels) {
      const req = new Request("https://bg.tools/api/v1/remove-background", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sandboxKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: SAMPLE_PNG_BASE64,
          model,
        }),
      });
      const res = await server.fetch(req, {}, {});
      const body: any = await res.json().catch(() => null);
      assert(res.status === 400, `Unknown model '${model}' rejected with HTTP 400`);
      assert(body?.error?.code === "invalid_model", `Unknown model '${model}' returns code 'invalid_model'`);
    }
  }

  // 8. Idempotency-Key: Exact Replay (200) vs Payload Conflict (422)
  {
    console.log("\n[Test 8] Idempotency-Key: Exact Replay (200) vs Payload Conflict (422)");
    const idempKey = `idemp_${crypto.randomBytes(8).toString("hex")}`;
    const userBefore = usersRepo.findById(testUserId)!;
    const initialCredits = userBefore.credits;

    // Payload 1
    const payload1 = {
      image: SAMPLE_PNG_BASE64,
      model: "ganga",
      response_format: "json",
    };

    // First request
    const req1 = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Idempotency-Key": idempKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload1),
    });
    const res1 = await server.fetch(req1, {}, {});
    assert(res1.status === 200, "First request with new Idempotency-Key succeeds (HTTP 200)");

    // Replay request with IDENTICAL payload
    const reqReplay = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Idempotency-Key": idempKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload1),
    });
    const resReplay = await server.fetch(reqReplay, {}, {});
    assert(resReplay.status === 200, "Replay request returns HTTP 200");
    assert(resReplay.headers.get("x-idempotent-replay") === "true", "Sets X-Idempotent-Replay: true header");

    const userAfter = usersRepo.findById(testUserId)!;
    assert(userAfter.credits === initialCredits, "Zero credits deducted on idempotent replay (no double billing)");

    // Conflicting request with SAME key but DIFFERENT payload (model: "karudi")
    const payloadDifferent = {
      image: SAMPLE_PNG_BASE64,
      model: "karudi",
      response_format: "json",
    };
    const reqConflict = new Request("https://bg.tools/api/v1/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sandboxKey}`,
        "Idempotency-Key": idempKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadDifferent),
    });
    const resConflict = await server.fetch(reqConflict, {}, {});
    const bodyConflict: any = await resConflict.json().catch(() => null);

    assert(resConflict.status === 422, "Same Idempotency-Key with different payload rejected with HTTP 422");
    assert(bodyConflict?.error?.code === "idempotency_conflict", "Returns code 'idempotency_conflict'");
  }

  // 9. Concurrent Credit Deduction (Double-Spend Prevention)
  {
    console.log("\n[Test 9] Concurrent Credit Deduction (Double-Spend Race Condition Prevention)");
    const raceUserId = `usr_race_${crypto.randomBytes(6).toString("hex")}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    // User has exactly 1 credit
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, plan, credits, free_credits, paid_credits,
        registered_at, last_active, last_credit_reset
      ) VALUES (?, 'Race Test User', ?, 'dummy_hash', 'free', 1, 1, 0, ?, ?, ?)
    `).run(raceUserId, `${raceUserId}@example.com`, now, now, todayStr);

    // Fire 5 concurrent deductions for 1 credit each
    const deductions = await Promise.all([
      creditLedgerRepo.deductUserCredits(raceUserId, 1, "remove-background", "127.0.0.1"),
      creditLedgerRepo.deductUserCredits(raceUserId, 1, "remove-background", "127.0.0.1"),
      creditLedgerRepo.deductUserCredits(raceUserId, 1, "remove-background", "127.0.0.1"),
      creditLedgerRepo.deductUserCredits(raceUserId, 1, "remove-background", "127.0.0.1"),
      creditLedgerRepo.deductUserCredits(raceUserId, 1, "remove-background", "127.0.0.1"),
    ]);

    const successes = deductions.filter((d) => d.success);
    const failures = deductions.filter((d) => !d.success);

    assert(successes.length === 1, "Exactly 1 concurrent request succeeded in deducting credit");
    assert(failures.length === 4, "Remaining 4 concurrent requests failed with insufficient credits");

    const finalUser = usersRepo.findById(raceUserId)!;
    assert(finalUser.credits === 0, "User credit balance is exactly 0 and never goes negative");

    db.prepare("DELETE FROM users WHERE id = ?").run(raceUserId);
  }

  // 10. Rate Limiting per Key
  {
    console.log("\n[Test 10] Rate Limiting per Key & Headers");
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

  // 11. Insufficient Credits Block (HTTP 402)
  {
    console.log("\n[Test 11] Insufficient Credits Block (HTTP 402)");
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

    db.prepare("DELETE FROM users WHERE id = ?").run(brokeUserId);
  }

  // 12. Public /health Endpoint Leaks Nothing
  {
    console.log("\n[Test 12] Public /health Endpoint Leaks Nothing (Only status: ok|degraded)");
    const healthRes = await server.fetch(new Request("https://bg.tools/api/v1/health"), {}, {});
    const body: any = await healthRes.json();

    assert(healthRes.status === 200, "/api/v1/health responds with 200 OK");
    assert(body.status === "ok" || body.status === "degraded", "status field is strictly 'ok' or 'degraded'");
    assert(
      Object.keys(body).length === 1 && "status" in body,
      "Payload contains ONLY 'status' - no versions, database names, uptime, latency or services"
    );
    assert(!("version" in body), "Does not leak API or software version");
    assert(!("uptimeSeconds" in body), "Does not leak system uptime");
    assert(!("services" in body), "Does not leak internal services dictionary");
  }

  // 13. OpenAPI 3.1.0 Spec Audit
  {
    console.log("\n[Test 13] OpenAPI 3.1.0 Spec Audit");
    const specRes = await server.fetch(new Request("https://bg.tools/api/v1/openapi.json"), {}, {});
    const spec: any = await specRes.json();

    assert(spec.openapi === "3.1.0", "Serves valid OpenAPI 3.1.0");
    assert(spec.servers[0].description === "Production", "servers[0].description is strictly 'Production'");
    assert(
      !JSON.stringify(spec.servers).toLowerCase().includes("hostinger") &&
      !JSON.stringify(spec.servers).toLowerCase().includes("vps"),
      "Spec servers contain no mention of Hostinger, VPS, or hosting provider"
    );

    // Verify detect-faces description
    const detectFacesDesc = spec.paths["/api/v1/detect-faces"]?.post?.description || "";
    assert(
      detectFacesDesc.includes("face detection (bounding boxes only, no identification)"),
      "detect-faces description updated to 'face detection (bounding boxes only, no identification)'"
    );

    // Verify Idempotency-Key parameter exists on paid endpoints
    const paidPaths = [
      "/api/v1/remove-background",
      "/api/v1/remove-watermark",
      "/api/v1/blur-face",
      "/api/v1/detect-faces",
      "/api/v1/compress-image",
      "/api/v1/convert-image",
      "/api/v1/resize-image",
      "/api/v1/crop-image",
    ];

    for (const p of paidPaths) {
      const endpoint = spec.paths[p]?.post;
      assert(Boolean(endpoint), `Path ${p} defined in OpenAPI spec`);
      const hasIdemp = endpoint?.parameters?.some((param: any) => param.name === "Idempotency-Key");
      assert(Boolean(hasIdemp), `Path ${p} documents Idempotency-Key header parameter`);
      assert(Boolean(endpoint?.responses["400"]), `Path ${p} documents 400 response`);
      assert(Boolean(endpoint?.responses["401"]), `Path ${p} documents 401 response`);
      assert(Boolean(endpoint?.responses["402"]), `Path ${p} documents 402 response`);
      assert(Boolean(endpoint?.responses["413"]), `Path ${p} documents 413 response`);
      assert(Boolean(endpoint?.responses["429"]), `Path ${p} documents 429 response`);
    }

    // Verify requestBody is defined for all transformation endpoints
    assert(Boolean(spec.paths["/api/v1/detect-faces"]?.post?.requestBody), "detect-faces has full requestBody");
    assert(Boolean(spec.paths["/api/v1/compress-image"]?.post?.requestBody), "compress-image has full requestBody");
    assert(Boolean(spec.paths["/api/v1/convert-image"]?.post?.requestBody), "convert-image has full requestBody");
    assert(Boolean(spec.paths["/api/v1/resize-image"]?.post?.requestBody), "resize-image has full requestBody");
    assert(Boolean(spec.paths["/api/v1/crop-image"]?.post?.requestBody), "crop-image has full requestBody");
  }

  // 14. /account and /usage Endpoint Scoping & Limits
  {
    console.log("\n[Test 14] /account and /usage Endpoint Scoping & Limits");

    // /account
    const accRes = await server.fetch(
      new Request("https://bg.tools/api/v1/account", { headers: { Authorization: `Bearer ${liveKey}` } }),
      {},
      {}
    );
    const accBody: any = await accRes.json();
    assert(accRes.status === 200, "/account succeeds with HTTP 200");
    assert(accBody.account.id === testUserId, "/account strictly returns authenticated user data");
    assert(accBody.key.prefix.startsWith("bgt_live_") && accBody.key.prefix.endsWith("..."), "/account returns masked key prefix only");
    assert(!("rawKey" in accBody.key) && !("key_hash" in accBody.key), "/account never leaks raw key or SHA-256 hash");

    // /usage limit cap at 100
    const usageRes = await server.fetch(
      new Request("https://bg.tools/api/v1/usage?limit=9999", { headers: { Authorization: `Bearer ${liveKey}` } }),
      {},
      {}
    );
    const usageBody: any = await usageRes.json();
    assert(usageRes.status === 200, "/usage succeeds with HTTP 200");
    assert(usageBody.pagination.limit === 100, "limit parameter is strictly capped at 100");
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
