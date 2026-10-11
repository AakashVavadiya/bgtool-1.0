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

  // TEST 1: Valid PNG image below 10 MB is accepted
  await test("Test 1: Valid file below 10 MB is accepted", () => {
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

  // TEST 2: File exceeding 10 MB is rejected (HTTP 413)
  await test("Test 2: File exceeding 10 MB is rejected with HTTP 413", () => {
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
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

  // TEST 3: Pre-flight Base64 exceeding 10 MB limit is rejected without decoding
  await test("Test 3: Pre-flight Base64 payload exceeding size limit is rejected", () => {
    // String representing ~12 MB of Base64 data
    const oversizedB64 = "data:image/png;base64," + "A".repeat(16 * 1024 * 1024);
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

  // TEST 17: Server entry rejects requests with declared Content-Length > 25MB (HTTP 413)
  await test("Test 17: server.fetch rejects oversized Content-Length with HTTP 413", async () => {
    const req = new Request("http://localhost:3000/api/remove-bg", {
      method: "POST",
      headers: {
        "content-length": "30000000", // 30 MB
        "content-type": "application/json",
      },
      body: JSON.stringify({ image: "toolarge" }),
    });

    const res = await serverHandler.fetch(req, {}, {});
    assert.strictEqual(res.status, 413, "Must reject oversized body pre-flight with 413");
    const json = await res.json();
    assert.ok(json.error?.includes("10 MB limit"), "Friendly error text required");
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
    console.log("\nALL 18 SECURITY & PRIVACY CONTROLS VERIFIED SUCCESSFULLY!");
  }
}

runTestSuite();
