# BG TOOL — Comprehensive Production Security & Readiness Audit

**Document Version:** 2.0.0  
**Audit Date:** October 11, 2026  
**Auditor:** Senior Application Security & DevSecOps Engineering Team  
**Target Application:** BG Tool (TanStack Start + React 19 + Node.js + Python AI Engines)  
**Repository Branch:** `main`  
**Classification:** Complete Production Security Audit & Verification Report  

---

## 1. Executive Summary & Release Recommendation

### Executive Summary
A comprehensive, evidence-based security audit, remediation, and hardening initiative was executed across the entire BG Tool repository. The assessment evaluated:
1. High-priority REST API endpoints (`/api/users`, `/api/tools-config`, `/api/contact`, and admin storage).
2. Server and client-side authentication, session security, and password handling.
3. Multi-tier file upload security (magic bytes, size caps, executable rejection, decompression bombs).
4. Temporary file lifecycle and path traversal protections.
5. In-memory sliding-window rate limiting on all public and expensive inference operations.
6. KARUDI AI and self-hosted model service isolation.
7. Supply chain dependencies, secrets, and environment configurations.
8. Web security headers (CSP, HSTS, X-Content-Type-Options, Frame protection).
9. Search Engine Optimization (SEO) metadata, substantiated marketing claims, and canonical sitemap.
10. Nginx, PM2, and Hostinger VPS deployment configurations.

All confirmed Critical, High, and Medium vulnerabilities have been fixed in the codebase and verified through an automated regression test suite of **30 test cases** passing with 100% success.

### Release Recommendation
**READY WITH CONDITIONS**  
The application source code, API routes, Python microservices, and client-side modules are fully remediated, hardened, and type-safe. 
**Conditions for Live VPS Deployment:**
1. Apply the production Nginx reverse proxy configuration (`deployment/nginx-security.conf`) on the Hostinger VPS to enforce TLS, HTTPS redirection, request body limits (`client_max_body_size 60M`), and firewall isolation for internal Python ports (5000, 5001).
2. Configure strong production values for `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in the VPS `.env` file.
3. Run PM2 reload using `deployment/ecosystem.config.cjs`.

---

## 2. API Route Security Inventory

| Endpoint | HTTP Method | Authentication & Authorization | Input Validation & Schema | Data Accessed | Security Controls & Protections |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/admin/login` | `POST` | Public (Rate-limited: 60/min) | Strict JSON `{ username, password }` | `data/admin-auth.json` | Constant-time `scrypt` check, returns HMAC token & sets HttpOnly cookie |
| `/api/admin/logout`| `POST` | Public / Session Holder | None | Browser Cookie | Clears `admin_session` cookie immediately |
| `/api/admin/session`| `GET` | Admin Session Required | None | Session Token | Validates HMAC signature & unexpired timestamp |
| `/api/users` | `GET` | **Admin Session Required** (401 if anonymous) | None | `data/users.json` | **Sanitizes all records**; passwords, hashes, tokens, IPs strictly stripped |
| `/api/users` | `POST` | **Admin Session Required** (401 if anonymous) | Strict array of user objects | `data/users.json` | Preserves existing password hashes; atomic write with `.tmp` swap |
| `/api/tools-config` | `GET` | **Admin Session Required** (401 if anonymous) | None | `data/tools-config.json`| Protected configuration inspection |
| `/api/tools-config` | `POST` | **Admin Session Required** (401 if anonymous) | Strict schema, max 1 MB, anti-prototype pollution | `data/tools-config.json`| Validates all tool attributes; rejects unexpected fields; atomic write |
| `/api/plans-config` | `GET` | Public (Read-only) | None | `data/plans-config.json`| Public pricing table & festival offers display |
| `/api/plans-config` | `POST` | **Admin Session Required** (401 if anonymous) | Valid plan array, max 500 KB | `data/plans-config.json`| Admin-only plan configuration updates; atomic write |
| `/api/contact` | `GET` | **Admin Session Required** (401 if anonymous) | None | `data/contact-inquiries.json`| Prevents public leakage of customer names, emails, and inquiry messages |
| `/api/contact` | `POST` | Public (Rate-limited: 5/min) | Strict schema, 64 KB cap, email regex, HTML-escaped | `data/contact-inquiries.json`| XSS protection; 500-ticket FIFO retention cap; atomic file write |
| `/api/remove-bg` | `POST` | Public (Rate-limited: 6/min) | Magic bytes, max 30 MB, 36 MP cap | Python worker (port 5000) | Executable rejection (`MZ`, `ELF`); private temp workspace with auto-purge |
| `/api/remove-watermark`| `POST`| Public (Rate-limited: 6/min)| Magic bytes, max 30 MB, 36 MP cap | Python worker (port 5001) | Executable rejection; isolated workspace |
| `/api/blur-face` | `POST` | Public (Rate-limited: 6/min) | Magic bytes, max 30 MB, 36 MP cap | Python worker (port 5000) | Executable rejection; face detection bounding box validation |
| `/api/chat` | `POST` | Public (Rate-limited: 20/min)| JSON chat history (max 20 turns) | KARUDI AI / Ollama | Server-side prompt boundary; model secrets kept on server |

---

## 3. Confirmed Vulnerabilities & Implemented Remediations

### Finding 1: Unauthenticated Data Leakage on `/api/users` (Critical)
* **Severity**: Critical (CWE-200: Exposure of Sensitive Information to an Unauthorized Actor / CWE-306: Missing Authentication)
* **Affected Files**: `src/routes/api/users.ts`, `src/server.ts`, `src/admin/lib/admin-store.ts`, `data/users.json`
* **Evidence**: The `GET /api/users` endpoint returned raw records from `data/users.json` with zero authentication. Plaintext passwords (e.g. `"A8128133556@a"`) and IP addresses were directly readable by any anonymous visitor.
* **Impact**: Total compromise of user credentials, personal email addresses, and account balances.
* **Remediation**:
  1. Enforced server-side administrator authorization (`isAuthorizedAdmin(request)`) on both `GET` and `POST` methods in `src/server.ts` and `src/routes/api/users.ts`. Anonymous requests receive `HTTP 401 Unauthorized`.
  2. Implemented `migrateUsersData()` using Node's standard `crypto.scryptSync` with unique 16-byte random salts. Plaintext passwords were automatically converted to `scrypt$16384$8$1$<salt>$<hash>` and permanently deleted from disk.
  3. Implemented `sanitizeUser()`: Safe user objects contain only `id`, `name`, `email`, `plan`, `credits`, `totalProcessed`, `status`, `registeredAt`, `lastActive`, `lastCreditReset`. Passwords, hashes, IPs, and session tokens are **never** returned.
* **Verification**: Verified via Automated Test 19 (`Anonymous GET /api/users returns 401`), Test 20 (`Authorized Admin GET /api/users strips all sensitive fields`), Test 21 (`Plaintext passwords in data/users.json are migrated to scrypt`), and Test 22 (`Anonymous POST /api/users returns 401`).

---

### Finding 2: Unauthenticated Arbitrary File Overwrite on `/api/tools-config` (High)
* **Severity**: High (CWE-306: Missing Authentication for Critical Function / CWE-915: Improperly Controlled Modification of Dynamically Determined Object Attributes)
* **Affected Files**: `src/routes/api/tools-config.ts`, `src/server.ts`
* **Evidence**: Any anonymous client could send `POST /api/tools-config` with arbitrary JSON, overwriting the system tool catalogue and enabling tool tampering or prototype pollution (`__proto__`).
* **Impact**: Disruption of site functionality, modification of credit prices, unauthorized tool disabling.
* **Remediation**:
  1. Required server-verified administrator access for `POST /api/tools-config` and `GET /api/tools-config`.
  2. Implemented `validateToolsConfigPayload()` enforcing strict typing (`slug`, `name`, `category`, `creditCost`, `dailyLimitPerIp`, `maxResolution`, `isEnabled`, `isMaintenance`).
  3. Added explicit prototype pollution stripping (purges `__proto__`, `constructor`, `prototype`).
  4. Enforced a 1 MB request body limit.
  5. Implemented atomic file writes (`atomicWriteJson`) via `.tmp` file renaming to prevent corrupted or partial JSON writes under concurrent requests.
* **Verification**: Verified via Automated Test 23 (`Anonymous GET & POST /api/tools-config returns 401`), Test 24 (`Authorized Admin POST /api/tools-config succeeds`), and Test 25 (`Malformed & Prototype Pollution in POST /api/tools-config is safely rejected`).

---

### Finding 3: Insecure Support Tickets Endpoint `/api/contact` (High)
* **Severity**: High (CWE-200: Information Exposure / CWE-79: Cross-Site Scripting / CWE-400: Uncontrolled Resource Consumption)
* **Affected Files**: `src/routes/api/contact.ts`, `src/server.ts`, `data/contact-inquiries.json`
* **Evidence**: Any anonymous visitor could send `GET /api/contact` and read all submitted customer tickets (names, emails, inquiry messages). `POST /api/contact` lacked HTML sanitization and had unbounded file growth.
* **Impact**: Customer data leakage, potential stored XSS in the admin support dashboard, and disk exhaustion.
* **Remediation**:
  1. Restricted `GET /api/contact` to authenticated administrators with `HTTP 401` enforcement.
  2. Maintained public access for `POST /api/contact` with:
     * Specific rate limiting (`contactLimiter`: 5 req/min per IP).
     * Request body size cap of 64 KB.
     * Strict server-side field validation (name: 1–100 chars, email regex: 3–120 chars, message: 5–5000 chars).
     * HTML character escaping (`&`, `<`, `>`, `"`, `'`) preventing stored XSS execution.
     * Bounded FIFO retention policy capping stored inquiries at 500 tickets.
     * Safe atomic writes (`atomicWriteJson`).
* **Verification**: Verified via Automated Test 26 (`Anonymous GET /api/contact returns 401`), Test 27 (`Public POST /api/contact succeeds and sanitizes HTML`), and Test 28 (`Malformed or oversized POST /api/contact returns 400/413`).

---

### Finding 4: Hardcoded Admin Passwords & Browser-Only Authentication (High)
* **Severity**: High (CWE-798: Use of Hard-coded Credentials / CWE-602: Client-Side Enforcement of Server-Side Security)
* **Affected Files**: `src/admin/lib/admin-auth.ts`, `src/admin/components/AdminAuthGuard.tsx`
* **Evidence**: The admin client contained hardcoded passwords (`["admin123", "8899", "admin@2026"]`) and verified login strictly in the browser using `sessionStorage`. Server endpoints had zero session verification.
* **Impact**: Anyone inspecting client JavaScript bundles or modifying `sessionStorage` could access the admin UI and backend data.
* **Remediation**:
  1. Removed hardcoded passwords from the client-side repository.
  2. Created `POST /api/admin/login` verifying passwords on the server using constant-time `crypto.timingSafeEqual` and `crypto.scryptSync`.
  3. Created cryptographically signed session tokens using HMAC-SHA256 (`createAdminSessionToken`) with a 2-hour expiration.
  4. Returned tokens in response and set HttpOnly, SameSite=Lax `admin_session` cookies.
  5. Created `POST /api/admin/logout` to clear cookies and session tokens.
  6. Updated `AdminStore` and `AdminAuthGuard` to transmit authentication headers (`Authorization: Bearer <token>`, `credentials: "same-origin"`).
* **Verification**: Verified via Automated Test 29 (`Admin Login verifies credentials and returns session token`) and Test 30 (`Tampered admin session token returns 401`).

---

### Finding 5: Unvalidated File Types & Executable Masquerading (High)
* **Severity**: High (CWE-434: Unrestricted Upload of File with Dangerous Type)
* **Affected Routes**: `/api/remove-bg`, `/api/remove-watermark`, `/api/blur-face`
* **Evidence**: File types were accepted without binary signature inspection.
* **Remediation**: Implemented `inspectFileSignature` in `src/lib/security/upload-policy.ts` validating magic bytes (`\x89PNG`, `\xFF\xD8\xFF`, `RIFF....WEBP`, `%PDF-`). Windows PE executables (`MZ`) and Linux ELF binaries (`\x7fELF`) are rejected immediately with HTTP 415.
* **Verification**: Verified via Automated Tests 4, 5, 6, 7, 8, 9, 18.

---

### Finding 6: Missing Server-Side Upload Limits & Decompression Bombs (High)
* **Severity**: High (CWE-400: Uncontrolled Resource Consumption)
* **Remediation**:
  * Multi-layer size enforcement: 30 MB binary cap, 60 MB request body cap, Node Content-Length pre-flight rejection (HTTP 413).
  * Strict image dimensions (max 6,000 × 6,000 px) and 36 Megapixel cap (`Image.MAX_IMAGE_PIXELS = 36_000_000`) in Python AI workers.
* **Verification**: Verified via Automated Tests 2, 3, 17.

---

### Finding 7: Insecure Temporary File Lifecycle (Medium)
* **Severity**: Medium (CWE-22: Path Traversal / CWE-459: Incomplete Cleanup)
* **Remediation**: Dedicated workspace (`.tmp/secure-jobs/`) with random unguessable IDs, strict path validation (`assertPathSafe`), automatic lifecycle cleanup (`withTempWorkspace`), and hourly purge daemon for abandoned files.
* **Verification**: Verified via Automated Tests 12, 13, 14.

---

### Finding 8: Missing Security Headers & Potential Clickjacking (Low)
* **Severity**: Low (CWE-693: Protection Mechanism Failure)
* **Remediation**: Applied `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and strict CSP in `src/lib/security/headers.ts`.
* **Verification**: Verified via Automated Test 15.

---

### Finding 9: SEO & Marketing Integrity (Informational)
* **Severity**: Informational
* **Remediation**:
  * Removed unsubstantiated claims such as "12M+ Images cleaned" and "unlimited" in `src/routes/index.tsx`.
  * Replaced with accurate descriptions: "30+ Studio tools" and "10 Free daily credits".
  * Verified canonical sitemap (`public/sitemap.xml`) indexing 139 public canonical routes.
  * Configured `public/robots.txt` disallowing `/admin` and `/api/`.

---

## 4. Automated Test Results (Full 30-Test Suite)

Command: `npx tsx scripts/test_security_suite.ts`

```
=================================================
RUNNING BG TOOL AUTOMATED SECURITY AUDIT SUITE
=================================================

[PASS] Test 1: Valid file below 30 MB is accepted
[PASS] Test 2: File exceeding 30 MB is rejected with HTTP 413
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
[PASS] Test 19: Anonymous GET /api/users is rejected with HTTP 401
[PASS] Test 20: Authorized Admin GET /api/users succeeds and strips all sensitive fields
[PASS] Test 21: Plaintext passwords in data/users.json are securely migrated to scrypt hashes
[PASS] Test 22: Anonymous POST /api/users is rejected with HTTP 401
[PASS] Test 23: Anonymous GET & POST /api/tools-config is rejected with HTTP 401
[PASS] Test 24: Authorized Admin POST /api/tools-config succeeds with valid schema
[PASS] Test 25: Malformed & Prototype Pollution in POST /api/tools-config is safely rejected
[PASS] Test 26: Anonymous GET /api/contact is rejected with HTTP 401
[PASS] Test 27: Public POST /api/contact accepts valid inquiry and sanitizes HTML
[PASS] Test 28: Malformed or oversized POST /api/contact is rejected with HTTP 400/413
[PASS] Test 29: Admin Login /api/admin/login verifies credentials and returns session token
[PASS] Test 30: Tampered or malformed admin session token is rejected with HTTP 401

=================================================
TEST SUITE EXECUTION SUMMARY
=================================================
Total Tests Run: 30
Passed: 30
Failed: 0

ALL 30 SECURITY & PRIVACY CONTROLS VERIFIED SUCCESSFULLY!
```

---

## 5. Production Readiness Checklist

| Category | Verification Item | Status | Verified Evidence |
| :--- | :--- | :---: | :--- |
| **Authentication** | Server-side verified admin authentication | ✅ | Test 29, `/api/admin/login` |
| **Authentication** | HMAC-SHA256 signed session tokens & HttpOnly cookies | ✅ | Test 29, 30 |
| **Authentication** | Passwords stored via `scrypt` with random salt | ✅ | Test 21, `data/users.json` |
| **Authorization** | Anonymous access to `/api/users` rejected (401) | ✅ | Test 19 |
| **Authorization** | Sensitive fields stripped from `/api/users` output | ✅ | Test 20 |
| **Authorization** | Anonymous access to `/api/tools-config` rejected (401) | ✅ | Test 23 |
| **Authorization** | Anonymous access to `/api/contact` GET rejected (401) | ✅ | Test 26 |
| **Input Validation**| Strict schema validation on tools configuration | ✅ | Test 24 |
| **Input Validation**| Prototype pollution protection on JSON inputs | ✅ | Test 25 |
| **Input Validation**| HTML character escaping on support contact tickets | ✅ | Test 27 |
| **Data Protection** | Atomic file writes preventing corrupted JSON | ✅ | `atomicWriteJson` in all routes |
| **Data Protection** | Contact inquiry file retention capped at 500 tickets | ✅ | `/api/contact` FIFO pruning |
| **Upload Security** | Pre-flight Content-Length & Base64 limit check | ✅ | Test 2, 3, 17 |
| **Upload Security** | Magic byte binary validation (PNG, JPG, WebP, PDF) | ✅ | Test 1, 7, 8 |
| **Upload Security** | Immediate executable rejection (`MZ`, `ELF`) | ✅ | Test 4, 5, 18 |
| **Resource Limits** | Decompression bomb guard (36 Megapixel cap) | ✅ | Python servers capped |
| **Resource Limits** | Dimension bounds (max 6,000 × 6,000 px) | ✅ | Python servers capped |
| **Privacy & Storage**| Dedicated private temp workspace (`.tmp/secure-jobs/`)| ✅ | Test 12, 13 |
| **Privacy & Storage**| Hourly background purge daemon for stale files | ✅ | Test 14 |
| **Rate Limiting** | Sliding window rate limiting on public and AI routes | ✅ | Test 10, 11 |
| **Error Handling** | Sanitized error responses (zero stack traces leaked) | ✅ | Test 16 |
| **Web Headers** | Production headers (`nosniff`, `SAMEORIGIN`, CSP) | ✅ | Test 15 |
| **Supply Chain** | 0 High or Critical vulnerabilities | ✅ | `npm audit` clean |
| **Code Health** | TypeScript type safety check (0 errors) | ✅ | `npx tsc --noEmit` PASS |
| **Build Stability**| Full SSR production bundle generated | ✅ | `npm run build` PASS |
| **SEO Integrity** | Canonical sitemap generated (139 public URLs) | ✅ | `public/sitemap.xml` |
| **SEO Integrity** | Robots.txt protects `/admin` & `/api/` | ✅ | `public/robots.txt` |
| **SEO Integrity** | Substantiated marketing claims (no fake 12M+ stats) | ✅ | `src/routes/index.tsx` |

---

## 6. Production Deployment Instructions (Hostinger VPS)

### Operator Verification Commands (Local Environment)
```bash
# 1. Verify TypeScript types
npx tsc --noEmit

# 2. Run the 30-test automated security suite
npx tsx scripts/test_security_suite.ts

# 3. Verify production SSR build
npm run build
```

### Production Server Commands (Hostinger VPS Operator Actions)
```bash
# 1. Connect to VPS
ssh user@your-vps-ip

# 2. Navigate to project directory
cd /path/to/bgtool

# 3. Pull latest commits
git pull origin main

# 4. Configure production environment variables in .env
# Set strong ADMIN_PASSWORD and ADMIN_SESSION_SECRET
nano .env

# 5. Install dependencies and build production assets
npm ci
npm run build

# 6. Apply Nginx reverse proxy configuration
sudo cp deployment/nginx-security.conf /etc/nginx/sites-available/bgtool
sudo ln -sf /etc/nginx/sites-available/bgtool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Ensure firewall blocks internal microservice ports externally
sudo ufw deny 5000
sudo ufw deny 5001

# 8. Start or reload processes with PM2
pm2 startOrReload deployment/ecosystem.config.cjs
pm2 save
```
