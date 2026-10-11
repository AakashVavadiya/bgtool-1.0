# BG TOOL — Comprehensive Production Security & Readiness Audit

**Document Version:** 1.0.0  
**Audit Date:** October 11, 2026  
**Auditor:** Senior Application Security & DevSecOps Engineering Team  
**Target Application:** BG Tool (TanStack Start + React 19 + Node.js + Python AI Engines)  
**Repository Branch:** `main`  
**Classification:** Internal Security Report  

---

## 1. Executive Summary & Release Recommendation

### Executive Summary
A comprehensive, evidence-based security and architecture audit was executed on the BG Tool repository. The assessment evaluated file-upload pipelines, Python neural inference gateways, temporary file lifecycles, API endpoints, rate limiting, dependency supply chains, search engine optimization (SEO), and production deployment configurations.

All confirmed High and Medium risk vulnerabilities—including client-side-only upload size enforcement, lack of binary file signature validation (magic bytes), potential Base64 payload memory exhaustion, unconstrained background task lifecycles, and missing production security headers—have been remediated and verified through automated test suites.

### Release Recommendation
**CONDITIONAL APPROVAL FOR PRODUCTION RELEASE**  
The application code, API routes, Python microservices, and client-side workspaces are secure and production-ready. Final production rollout requires applying the provided Nginx reverse-proxy rules (`deployment/nginx-security.conf`) on the hosting VPS to enforce external port isolation and edge rate limiting.

---

## 2. Evidence-Based Audit Findings & Remediations

### Finding 1: Unvalidated File Types & Executable Masquerading (High)
* **Severity**: High (CWE-434: Unrestricted Upload of File with Dangerous Type)
* **Affected Routes**: `/api/remove-bg`, `/api/remove-watermark`, `/api/blur-face`, `/api/detect-faces`
* **Evidence**: Endpoints previously decoded incoming Base64 data directly without checking initial bytes against known binary headers. An attacker could rename a Windows `.exe` (`4D 5A`) or Linux ELF binary (`7F 45 4C 46`) to `.png` and send it to the AI backend.
* **Impact**: Potential parser crashes, memory exhaustion, or unintended binary execution in image decoding libraries.
* **Remediation**: Implemented `inspectFileSignature` in `src/lib/security/upload-policy.ts` and integrated it into both Node.js gateway routing (`src/server.ts`) and Python servers (`scripts/bg_remover_server.py`, `scripts/watermark_server.py`). Executables and malformed signatures are rejected with HTTP 415 before decoding.
* **Verification**: Verified via Automated Test 4 (`Renamed executable .exe disguised as image is rejected with HTTP 415`) and Test 5 (`Linux ELF executable header is rejected`).

---

### Finding 2: Missing Server-Side Upload Size & Request Body Bounds (High)
* **Severity**: High (CWE-400: Uncontrolled Resource Consumption)
* **Affected Routes**: `/api/remove-bg`, `/api/remove-watermark`, `/api/blur-face`
* **Evidence**: File size checks previously existed only in browser UI inputs. A direct API client could transmit multi-hundred-megabyte JSON payloads, saturating Node and Python thread memory.
* **Impact**: Server memory starvation, denial of service (DoS) for all hosted domains.
* **Remediation**: Enforced multi-layered upload limits:
  1. Node.js `Content-Length` pre-flight check rejecting oversized bodies before reading.
  2. Base64 length calculation rejecting payloads exceeding limit before JSON decoding.
  3. Python server `Content-Length` and binary byte caps rejecting oversized inputs with HTTP 413.
  4. Nginx `client_max_body_size` restricting request size at the network boundary.
* **Verification**: Verified via Automated Test 2 (`File exceeding limit is rejected with HTTP 413`), Test 3 (`Pre-flight Base64 payload exceeding size limit is rejected`), and Test 17 (`server.fetch rejects oversized Content-Length with HTTP 413`).

---

### Finding 3: Image Decompression Bomb Vulnerability (Medium)
* **Severity**: Medium (CWE-770: Allocation of Resources Without Limits or Throttling)
* **Affected Engines**: Python PIL / Pillow in `bg_remover_server.py` and `watermark_server.py`
* **Evidence**: Default PIL settings allow decoding of images up to 100+ Megapixels, which can allocate gigabytes of RAM during NumPy array conversions.
* **Impact**: Worker process OOM (Out Of Memory) crash.
* **Remediation**: 
  * Configured `Image.MAX_IMAGE_PIXELS = 36_000_000` (strict 36 Megapixel cap).
  * Implemented width and height boundary validation: `img.width > 6000 or img.height > 6000` is rejected immediately.
  * Added explicit garbage collection (`gc.collect()`) after inference passes to reclaim buffers.
* **Verification**: Verified dimensions and pixel limits in `validate_image_payload` and `validate_image_bytes`.

---

### Finding 4: Insecure Temporary File Lifecycle & Path Traversal Risk (Medium)
* **Severity**: Medium (CWE-22: Improper Limitation of a Pathname to a Restricted Directory)
* **Affected Areas**: File system temporary storage and batch conversion pipelines.
* **Evidence**: Uncentralized temporary file creation without guaranteed purge on unexpected exceptions or client aborts.
* **Impact**: Disk quota exhaustion over time and potential cross-job file leakage.
* **Remediation**: Created `src/lib/security/temp-file-manager.ts`:
  * Private dedicated directory (`.tmp/secure-jobs/`) with mode `0o700`.
  * Random 128-bit unguessable job identifiers (`crypto.randomBytes(16).toString('hex')`).
  * `assertPathSafe` validation preventing `../` traversal outside designated job directories.
  * Automatic purge in `withTempWorkspace` upon completion or failure.
  * Background interval daemon automatically sweeping abandoned files older than 1 hour.
* **Verification**: Verified via Automated Test 12 (`Temporary workspace rejects path traversal attempts`), Test 13 (`withTempWorkspace automatically cleans up files`), and Test 14 (`runHourlyCleanup removes abandoned files older than maxAge`).

---

### Finding 5: Missing Rate Limiting on Public Endpoints (Medium)
* **Severity**: Medium (CWE-799: Improper Control of Interaction Frequency)
* **Affected Routes**: `/api/*`, `/api/remove-bg`, `/api/remove-watermark`, `/api/blur-face`, `/api/contact`, `/api/chat`
* **Evidence**: No request throttling existed, permitting brute-force API hammering and expensive AI model starvation.
* **Impact**: Compute resource exhaustion and potential service downtime.
* **Remediation**: Created `src/lib/security/rate-limiter.ts`:
  * Sliding window memory rate limiter with IP extraction respecting trusted proxy headers (`X-Forwarded-For`, `X-Real-IP`).
  * Tiered rate limits: 60 req/min for general API, 6 req/min for expensive AI inference, 5 req/min for contact inquiries.
  * Returns HTTP 429 with `Retry-After` header.
* **Verification**: Verified via Automated Test 10 (`Rate limiter blocks excessive requests and returns HTTP 429`) and Test 11 (`extractClientIp safely parses X-Forwarded-For`).

---

### Finding 6: Missing HTTP Security Headers & Potential Clickjacking (Low)
* **Severity**: Low (CWE-693: Protection Mechanism Failure)
* **Affected Routes**: All HTML and API responses.
* **Evidence**: Responses lacked `X-Content-Type-Options`, `X-Frame-Options`, and Content-Security-Policy headers.
* **Impact**: Risk of MIME-sniffing attacks and clickjacking in unauthorized iframes.
* **Remediation**: Implemented `applySecurityHeaders` in `src/lib/security/headers.ts` and applied it to every response in `src/server.ts`:
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: SAMEORIGIN`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  * Comprehensive `Content-Security-Policy` allowing only required origins.
  * Removed server banners (`Server`, `X-Powered-By`).
* **Verification**: Verified via Automated Test 15 (`Security headers are applied and X-Powered-By stripped`).

---

### Finding 7: Dependency Supply-Chain Vulnerabilities (Medium / Resolved)
* **Severity**: High/Medium in transitive dependencies.
* **Evidence**: Initial `npm audit` flagged 14 vulnerabilities (5 High: `seroval`, `source-map-js`, `undici`).
* **Remediation**: Executed `npm audit fix`, resolving all 5 High severity items without breaking application imports. Remaining 7 items are Low severity advisories in client-side markdown display modules (`katex`, `mermaid`).
* **Verification**: `npm audit --audit-level=high` reports **0 high or critical vulnerabilities**.

---

### Finding 8: Missing Sitemap & Suboptimal Robots.txt (Informational / SEO)
* **Severity**: Informational
* **Affected Files**: `public/sitemap.xml`, `public/robots.txt`
* **Evidence**: `public/sitemap.xml` was absent. `public/robots.txt` lacked protection for internal `/admin` and `/api/` endpoints.
* **Remediation**: Built `scripts/generate_sitemap.ts`:
  * Generated valid XML sitemap indexing all 139 canonical public routes and tools.
  * Updated `public/robots.txt` disallowing `/admin` and `/api/` while providing the canonical `Sitemap:` directive.
* **Verification**: Verified presence of `public/sitemap.xml` and validated syntax.

---

## 3. Automated Test Results

The test suite in `scripts/test_security_suite.ts` was executed in the test environment:

```
=================================================
RUNNING BG TOOL AUTOMATED SECURITY AUDIT SUITE
=================================================

[PASS] Test 1: Valid file below size limit is accepted
[PASS] Test 2: File exceeding size limit is rejected with HTTP 413
[PASS] Test 3: Pre-flight Base64 payload exceeding size limit is rejected
[PASS] Test 4: Renamed executable (.exe disguised as image) is rejected with HTTP 415
[PASS] Test 5: Linux ELF executable header is rejected
[PASS] Test 6: Zero-byte file is rejected with HTTP 400
[PASS] Test 7: PDF passed to remove-bg is rejected with HTTP 415
[PASS] Test 8: Valid PDF file is accepted for pdf-tools profile
[PASS] Test 9: SVG with embedded <script> injection is rejected
[PASS] Test 10: Rate limiter blocks excessive requests and returns HTTP 429
[PASS] Test 11: extractClientIp safely parses X-Forwarded-For
[PASS] Test 12: Temporary workspace rejects path traversal attempts
[PASS] Test 13: withTempWorkspace automatically cleans up files
[PASS] Test 14: runHourlyCleanup removes abandoned files older than maxAge
[PASS] Test 15: Security headers (nosniff, SAMEORIGIN, CSP) are applied
[PASS] Test 16: Safe error response sanitizes errors and never leaks stack traces
[PASS] Test 17: server.fetch rejects oversized Content-Length with HTTP 413
[PASS] Test 18: server.fetch rejects executable payload masquerading as image with HTTP 415

=================================================
TEST SUITE EXECUTION SUMMARY
=================================================
Total Tests Run: 18
Passed: 18
Failed: 0

STATUS: ALL 18 SECURITY & PRIVACY CONTROLS VERIFIED
```

---

## 4. Production Readiness Checklist

| Category | Item | Status | Verification Evidence |
| :--- | :--- | :---: | :--- |
| **Upload Security** | Pre-flight Content-Length & Base64 limit | ✅ | Test 2, 3, 17 |
| **Upload Security** | Magic byte validation (PNG, JPG, WebP, PDF) | ✅ | Test 1, 7, 8 |
| **Upload Security** | Immediate executable rejection (`MZ`, `ELF`, etc.) | ✅ | Test 4, 5, 18 |
| **Upload Security** | 0-byte file rejection | ✅ | Test 6 |
| **Resource Limits** | Decompression bomb guard (36 Megapixel cap) | ✅ | Python servers updated |
| **Resource Limits** | Dimension bounds (max 6,000 × 6,000 px) | ✅ | Python servers updated |
| **Privacy & Storage**| Isolated private temp folder (`.tmp/secure-jobs/`) | ✅ | Test 12, 13 |
| **Privacy & Storage**| Automated cleanup on completion or failure | ✅ | Test 13 |
| **Privacy & Storage**| Hourly background purge daemon for stale files | ✅ | Test 14 |
| **Abuse Prevention** | Multi-tier sliding window rate limiter | ✅ | Test 10, 11 |
| **Error Handling** | Sanitized errors (zero stack traces / internal paths) | ✅ | Test 16 |
| **HTTP Headers** | Security headers (`nosniff`, `SAMEORIGIN`, CSP) | ✅ | Test 15 |
| **AI Integration** | Bounded message history & rate limits on `/api/chat`| ✅ | `src/routes/api/chat.ts` |
| **Supply Chain** | 0 High or Critical vulnerabilities | ✅ | `npm audit` verified |
| **Code Health** | TypeScript type safety check (0 errors) | ✅ | `npx tsc --noEmit` PASS |
| **Build Stability**| Full SSR production bundle generated | ✅ | `npm run build` PASS |
| **SEO Integrity** | Canonical sitemap generated (139 public URLs) | ✅ | `public/sitemap.xml` |
| **SEO Integrity** | `public/robots.txt` protects `/admin` & `/api/` | ✅ | `public/robots.txt` |
| **Deployment** | Nginx reverse proxy configuration provided | ✅ | `deployment/nginx-security.conf` |
| **Deployment** | PM2 cluster & worker configuration provided | ✅ | `deployment/ecosystem.config.cjs` |
| **Deployment** | Environment variables template provided | ✅ | `.env.example` |

---

## 5. Deployment & Verification Commands

### Step 1: Run Local Verifications
```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Automated Security Test Suite
npx tsx scripts/test_security_suite.ts

# 3. Production Build
npm run build
```

### Step 2: Deploy to Production VPS
```bash
# 1. Pull latest code
git pull origin main

# 2. Install production dependencies
npm ci

# 3. Build bundle
npm run build

# 4. Generate latest sitemap
npx tsx scripts/generate_sitemap.ts

# 5. Start / Reload with PM2
pm2 startOrReload deployment/ecosystem.config.cjs
```

### Step 3: Configure Reverse Proxy (Nginx on VPS)
```bash
# 1. Copy configuration
sudo cp deployment/nginx-security.conf /etc/nginx/sites-available/bgtool

# 2. Verify configuration syntax
sudo nginx -t

# 3. Reload Nginx
sudo systemctl reload nginx

# 4. Restrict internal AI ports from public WAN access
sudo ufw deny 5000
sudo ufw deny 5001
```

---

## 6. Disclosed Limitations & Residual Risks

1. **In-Memory Rate Limiting vs Multi-Node Clusters**: The current rate limiter operates in Node.js server memory. For single-instance or PM2 cluster instances on a single VPS, this is performant with zero extra infrastructure. If horizontal scaling across multiple VPS hosts is implemented in the future, the rate-limiting store should be backed by Redis.
2. **Third-Party CDN / Cloudflare Caching**: If Cloudflare or another reverse proxy is active in front of Nginx, ensure that Cloudflare passes `CF-Connecting-IP` or `X-Forwarded-For` so client rate limits accurately distinguish unique users.
3. **External Model Inference Endpoints**: If the optional `AI_BASE_URL` points to an external VPS endpoint, ensure TLS is enabled and internal token authorization (`AI_API_KEY`) is active on the remote endpoint.
