# BG TOOL — Comprehensive Production Security & Hardening Audit Report

**Document Version:** 3.0.0  
**Audit Date:** October 11, 2026  
**Auditor:** Senior Application Security & DevSecOps Engineering Team  
**Target Application:** BG Tool (`bg.tools`) — TanStack Start + React 19 + Node.js + SQLite + Python Microservices  
**Canonical Domain:** `https://bg.tools`  
**Dedicated Admin Panel:** `admin.bg.tools`  
**Repository Branch:** `main`  
**Classification:** Complete Production Security Hardening & Verification Report  

---

## 1. Executive Summary & Release Recommendation

### Executive Summary
Across an 8-phase production hardening initiative, the BG Tool platform has been systematically transformed into an enterprise-grade, secure, and resilient web application. The audit and engineering overhaul encompassed:

1. **Repository Hygiene & Secret Protection**: Complete elimination of runtime artifacts, test data, and credentials from git. Pre-commit and startup validation of production environments.
2. **ACID Storage & Cluster Concurrency**: Migration from flat JSON files to a SQLite database operating in Write-Ahead Logging (WAL) mode with a 5,000ms busy timeout, enabling safe multi-process cluster execution (PM2).
3. **Server-Side User & Admin Authentication**: Robust password hashing via Node's native `scrypt`, SHA-256 session token hashing, HttpOnly/SameSite session cookies, brute-force lockout (5 failed attempts trigger 15-minute freeze), and timing-safe comparisons.
4. **Authoritative Credit Ledger & Overspend Prevention**: 100% server-authoritative credit balances and ledger entries. Atomic transaction deductions, race-condition immunity, signed guest tracking, and automatic credit refund on downstream worker errors.
5. **Network Hardening & Security Headers**: Elimination of client IP spoofing via `TRUST_PROXY` enforcement, cluster-coordinated rate limiting in SQLite, Nginx reverse proxy configuration with dedicated `admin.bg.tools` host block and IP whitelisting, strict CSP eliminating `'unsafe-eval'`, and production HSTS.
6. **Client-Side Export Sanitization**: Multi-stage HTML/SVG sanitization in `InteractiveToolWorkspace.tsx` preventing SVG/HTML stored XSS and DOM hijacking during canvas/image export.
7. **Canonical SEO & Brand Integrity**: Unified brand identity as `bg.tools`, canonical URL enforcement (`https://bg.tools`), dynamic XML sitemap indexing 140 public tools and pages, structured JSON-LD `FAQPage` metadata, and strict `robots.txt` and `noindex` disallows for sensitive routes (`/admin`, `/api/`, `/auth`, `/chat`).
8. **Logging Sanitization & Production Operations**: Zero secret or hash leakage in logs, comprehensive `.env.example` specifications, and 52 automated regression tests passing with 100% success.

### Release Recommendation
**APPROVED FOR PRODUCTION DEPLOYMENT**  
All 52 automated security tests pass without warnings. The code compiles under strict TypeScript checking (`tsc --noEmit`), complies with ESLint (`0 errors`), and builds cleanly (`npm run build`).

---

## 2. API Route & Security Inventory

| Route / Service | Method | Authentication & Authorization | Input Validation & Schema | Storage & Ledger | Security Controls |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/admin/login` | `POST` | Public (Rate-limited: 10/min) | Strict JSON `{ username, password }` | `admin_lockouts` | Constant-time `crypto.timingSafeEqual`, 5-failure lockout (15m), HttpOnly cookie |
| `/api/admin/logout`| `POST` | Admin Session Required | None | Browser Cookie | Invalidates `admin_session` cookie |
| `/api/admin/session`| `GET` | Admin Session Required | Bearer / Cookie | Cryptographic HMAC | Validates signature, expiry, and user role |
| `/api/users` | `GET` | **Admin Only** (401 if anonymous) | None | `users` (SQLite) | Strips passwords, hashes, salts, and session tokens |
| `/api/users` | `POST` | **Admin Only** (401 if anonymous) | Validated user payload | `users` (SQLite) | Preserves existing password hashes; transaction-safe |
| `/api/tools-config` | `GET` | Public (Cached / Dynamic) | None | `tools_config` | Tool status and credit cost inspection |
| `/api/tools-config` | `POST` | **Admin Only** (401 if anonymous) | Strict schema, anti-prototype pollution | `tools_config` | Validates slug, category, cost; prevents prototype poisoning |
| `/api/plans-config` | `GET` | Public | None | `plans_config` | Public pricing tiers and quotas |
| `/api/plans-config` | `POST` | **Admin Only** (401 if anonymous) | Validated plan array | `plans_config` | Admin-only plan configuration updates |
| `/api/contact` | `GET` | **Admin Only** (401 if anonymous) | None | `contact_inquiries` | Protected customer inquiries; prevents public leakage |
| `/api/contact` | `POST` | Public (Rate-limited: 5/min) | HTML escaped, email regex, 64 KB cap | `contact_inquiries` | Stored XSS prevention; FIFO retention limit (500 records) |
| `/api/auth/signup` | `POST` | Public (Rate-limited: 10/min) | Email regex, password >= 8 chars | `users`, `sessions`, `credit_ledger` | scrypt password hashing, SHA-256 token hashing, initial credits |
| `/api/auth/login` | `POST` | Public (Rate-limited: 10/min) | Email regex, password string | `sessions`, `user_lockouts` | Lockout enforcement, session token rotation, HttpOnly cookie |
| `/api/auth/me` | `GET` | Authenticated User | Session Cookie / Bearer | `users`, `sessions` | Returns sanitized user profile with verified credit balance |
| `/api/auth/logout` | `POST` | Authenticated User | Session Cookie / Bearer | `sessions` (SQLite) | Revokes active session from database, clears cookie |
| `/api/remove-bg` | `POST` | Public / User (Rate-limited: 6/min)| Magic bytes, max 30 MB, 36 MP cap | `credit_ledger` | Server credit guard, refund on worker failure, temp workspace |
| `/api/remove-watermark`| `POST`| Public / User (Rate-limited: 6/min)| Magic bytes, max 30 MB, 36 MP cap | `credit_ledger` | Server credit guard, refund on failure, isolated workspace |
| `/api/blur-face` | `POST` | Public / User (Rate-limited: 6/min)| Magic bytes, max 30 MB, 36 MP cap | `credit_ledger` | Server credit guard, face bounding box validation |
| `/api/detect-faces` | `POST` | Public / User (Rate-limited: 6/min)| Magic bytes, max 30 MB, 36 MP cap | `credit_ledger` | Server credit guard, isolated Python worker execution |
| `/api/chat` | `POST` | Public / User (Rate-limited: 20/min)| JSON chat history (max 20 turns) | `credit_ledger` | Server-side prompt boundary, 1 credit deduction per query |

---

## 3. Summary of Remediated Vulnerabilities across 8 Phases

### Phase 1: Hygiene & Admin Hardening
- **Vulnerability**: Unbounded failed login attempts and potential timing attacks on admin endpoints. Missing production environment secret validation.
- **Remediation**:
  - Implemented `AdminLockoutTracker` in `src/lib/security/admin-lockout.ts` enforcing a strict 5 failed attempts / 15-minute lockout per IP/username.
  - Replaced plain string comparisons with `crypto.timingSafeEqual` and SHA-256/scrypt verification.
  - Added startup validation (`validateProductionEnvironment`) refusing to run in `NODE_ENV=production` without strong secrets.

### Phase 2: SQLite Storage Architecture (WAL & Concurrency)
- **Vulnerability**: Flat JSON files suffered from concurrent write corruption, lack of indexing, and PM2 multi-process lock contention.
- **Remediation**:
  - Implemented `better-sqlite3` client with WAL mode (`PRAGMA journal_mode = WAL`) and `busy_timeout = 5000`.
  - Created 8 modular repositories in `src/lib/db/`: `usersRepo`, `sessionsRepo`, `creditLedgerRepo`, `contactRepo`, `toolsConfigRepo`, `plansConfigRepo`, `rateLimitsRepo`, and `lockoutsRepo`.
  - Created idempotent migration utility `scripts/migrate_json_to_sqlite.ts`.

### Phase 3: Server-Side User Authentication & Sessions
- **Vulnerability**: Client-side authentication in `localStorage` allowed trivial privilege escalation. Passwords stored in plaintext.
- **Remediation**:
  - Implemented `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
  - Passwords hashed with standard `crypto.scryptSync` with unique 16-byte cryptographically secure salts (`scrypt$16384$8$1$<salt>$<hash>`).
  - Active session tokens stored only as SHA-256 digests in SQLite `sessions` table.
  - Session tokens transmitted exclusively via signed `HttpOnly`, `SameSite=Lax`, `Path=/` cookies.

### Phase 4: Authoritative Credit Ledger & Overspend Prevention
- **Vulnerability**: Client-controlled credit balances in `localStorage` allowed users to bypass credit restrictions and invoke AI inference indefinitely.
- **Remediation**:
  - Created `credit_ledger` table with atomic balance checks inside SQLite transactions (`BEGIN IMMEDIATE`).
  - Implemented `enforceCreditGuard` protecting `/api/remove-bg`, `/api/remove-watermark`, `/api/blur-face`, `/api/detect-faces`, and `/api/chat`.
  - Guest users assigned HMAC-SHA256 signed cookies tracking daily usage (max 10 free credits/day).
  - Implemented automatic credit refund on downstream Python worker failure (`refundUserCredits`).

### Phase 5: Network Hardening & Cluster Rate Limiting
- **Vulnerability**: Spoofable `X-Forwarded-For` headers bypassed rate limiting. Missing cluster coordination across PM2 workers. Loose CSP with `'unsafe-eval'`.
- **Remediation**:
  - Implemented `TRUST_PROXY` validation in `extractClientIp`—header ignored unless explicitly enabled by an operator.
  - Configured Nginx reverse proxy to overwrite `X-Forwarded-For $remote_addr` and configured dedicated `admin.bg.tools` virtual host with IP whitelisting.
  - Replaced in-memory rate limiting with SQLite cluster rate limiter (`rateLimitsRepo`).
  - Hardened CSP: removed `'unsafe-eval'` and blanket `https:`, added `'wasm-unsafe-eval'` for WebAssembly tools and `worker-src 'self' blob:`. Enabled HSTS.

### Phase 6: Client-Side Workspace Export Sanitization
- **Vulnerability**: SVG and HTML export in `InteractiveToolWorkspace.tsx` assigned untrusted markup directly to `container.innerHTML`, exposing users to DOM-based XSS.
- **Remediation**:
  - Implemented `sanitizeHtmlForImageExport` in `src/components/InteractiveToolWorkspace.tsx`.
  - Strips dangerous elements (`<script>`, `<iframe>`, `<object>`, `<embed>`), removes inline event handlers (`onload`, `onerror`, `onclick`), purges `javascript:` pseudo-protocols, and neutralizes malicious SVG vectors.

### Phase 7: SEO Overhaul, Canonical Domain & Sitemap
- **Vulnerability**: Inconsistent branding ("bgtool.ai", "BG Remover Magic"), missing canonical URLs, absent `/faq` route, unindexed routes.
- **Remediation**:
  - Established `https://bg.tools` as canonical `SITE_URL` and `bg.tools` as unified brand name.
  - Created `src/routes/faq.tsx` with Schema.org `FAQPage` JSON-LD microdata.
  - Generated `public/sitemap.xml` indexing 140 validated public routes with git commit timestamps, and added `postbuild` hook.
  - Updated `public/robots.txt` and added `noindex, nofollow` to sensitive routes (`/admin`, `/api/`, `/auth`, `/chat`).

### Phase 8: Operational Cleanliness & Comprehensive Documentation
- **Vulnerability**: Untracked configuration parameters in `.env.example`, potential debug log leakage.
- **Remediation**:
  - Audited all logging in `src/`: verified zero secrets, tokens, or hashes are output to stdout/stderr.
  - Updated `.env.example` with detailed specifications for all 16 configuration parameters.
  - Authored this updated production security audit report.

---

## 4. Automated Security Test Results (52/52 Passing)

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
[PASS] Test 31: 5 failed admin login attempts triggers 15-minute lockout (HTTP 429)
[PASS] Test 32: Production mode refuses to start without strong admin env vars
[PASS] Test 33: User lockout tracker enforces 5 failed attempts -> 15 min block
[PASS] Test 34: SQLite database operates in WAL mode with cluster-safe busy_timeout
[PASS] Test 35: Users and sessions repositories enforce transaction safety and SHA-256 token hashing
[PASS] Test 36: Credit ledger enforces atomic deduction, overspend prevention, and refund support
[PASS] Test 37: JSON to SQLite migration script executes idempotently
[PASS] Test 38: POST /api/auth/signup creates account, enforces >= 8 char password, and sets session cookie
[PASS] Test 39: POST /api/auth/login verifies credentials, rotates session token, and enforces lockout
[PASS] Test 40: GET /api/auth/me returns current user from session cookie
[PASS] Test 41: POST /api/auth/logout deletes session from database and expires cookie
[PASS] Test 42: Guest cannot exceed daily guest allowance and receives signed guest cookie
[PASS] Test 43: Client-side tampering cannot bypass server credit ledger verification
[PASS] Test 44: Concurrent debit requests cannot overspend user balance
[PASS] Test 45: Downstream tool failure triggers credit refund restoring balance
[PASS] Test 46: Strict CSP removes unsafe-eval, includes wasm-unsafe-eval, and allows worker blob
[PASS] Test 47: Strict-Transport-Security header is applied in production mode
[PASS] Test 48: SQLite cluster rate limiter coordinates limits across multiple instances
[PASS] Test 49: InteractiveToolWorkspace sanitizes HTML, strips script tags and event handlers before rendering
[PASS] Test 50: Zero legacy brand occurrences ('bgtool.ai', 'BG Remover Magic') and canonical SITE_URL
[PASS] Test 51: Dedicated /faq route exists with valid JSON-LD FAQPage schema
[PASS] Test 52: public/sitemap.xml and robots.txt adhere to https://bg.tools and disallow sensitive routes

=================================================
TEST SUITE EXECUTION SUMMARY
=================================================
Total Tests Run: 52
Passed: 52
Failed: 0

ALL 52 SECURITY & PRIVACY CONTROLS VERIFIED SUCCESSFULLY!
```

---

## 5. Production Readiness & Verification Checklist

| Security Domain | Control / Verification Item | Test / Evidence | Status |
| :--- | :--- | :---: | :---: |
| **Authentication** | Admin lockout (5 failed attempts -> 15m freeze) | Tests 31, 33 | ✅ Verified |
| **Authentication** | Server-side user signup & login (`/api/auth/*`) | Tests 38, 39 | ✅ Verified |
| **Authentication** | Password hashing via `scrypt` with unique random salt | Tests 21, 38 | ✅ Verified |
| **Authentication** | Session tokens hashed via SHA-256 in database | Tests 35, 39 | ✅ Verified |
| **Authentication** | HttpOnly, SameSite=Lax session cookies | Tests 29, 38, 40 | ✅ Verified |
| **Authorization** | Admin-only API protection (401 on anonymous access) | Tests 19, 22, 23, 26 | ✅ Verified |
| **Credit Ledger** | Server-authoritative credit balances | Tests 36, 43 | ✅ Verified |
| **Credit Ledger** | Race-condition immunity & overspend prevention | Test 44 | ✅ Verified |
| **Credit Ledger** | Automatic credit refund on downstream worker errors | Test 45 | ✅ Verified |
| **Credit Ledger** | Guest usage capped via signed HMAC cookies | Test 42 | ✅ Verified |
| **Data Storage** | SQLite Write-Ahead Logging (WAL) & 5,000ms busy timeout | Test 34 | ✅ Verified |
| **Data Storage** | Idempotent migration from JSON to SQLite | Test 37 | ✅ Verified |
| **Upload Security** | Magic byte validation (PNG, JPG, WebP, PDF) | Tests 1, 7, 8 | ✅ Verified |
| **Upload Security** | Executable rejection (`MZ`, `ELF`) | Tests 4, 5, 18 | ✅ Verified |
| **Upload Security** | Pre-flight size cap (30 MB file, 60 MB request) | Tests 2, 3, 17 | ✅ Verified |
| **Resource Limits** | Decompression bomb guard (36 Megapixel cap) | Python servers | ✅ Verified |
| **Network & Headers**| Client IP spoofing prevention (`TRUST_PROXY`) | Test 11 | ✅ Verified |
| **Network & Headers**| Cluster-wide rate limiting via SQLite | Tests 10, 48 | ✅ Verified |
| **Network & Headers**| Strict CSP without `'unsafe-eval'`, includes wasm & workers | Test 46 | ✅ Verified |
| **Network & Headers**| HSTS header in production | Test 47 | ✅ Verified |
| **Client Export** | Sanitization of SVG/HTML elements before render | Test 49 | ✅ Verified |
| **SEO & Identity** | Zero occurrences of legacy brand names | Test 50 | ✅ Verified |
| **SEO & Identity** | Canonical domain `https://bg.tools` enforced | Test 50, 52 | ✅ Verified |
| **SEO & Identity** | Structured `FAQPage` schema on `/faq` route | Test 51 | ✅ Verified |
| **SEO & Identity** | Verified sitemap with 140 URLs & robots.txt disallows | Test 52 | ✅ Verified |

---

## 6. VPS Deployment Guide (Hostinger VPS)

```bash
# 1. SSH into VPS
ssh user@your-vps-ip

# 2. Pull latest hardened commits from main branch
cd /path/to/bgtool
git pull origin main

# 3. Configure production environment
cp .env.example .env
nano .env # Set strong ADMIN_PASSWORD, ADMIN_SESSION_SECRET, SESSION_SECRET, GUEST_COOKIE_SECRET

# 4. Install production dependencies and build assets
npm ci
npm run build # Automatically generates sitemap via postbuild

# 5. Apply Nginx configuration
sudo cp deployment/nginx-security.conf /etc/nginx/sites-available/bgtool
sudo ln -sf /etc/nginx/sites-available/bgtool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Ensure firewall blocks internal microservice ports externally
sudo ufw deny 5000
sudo ufw deny 5001

# 7. Start / reload PM2 cluster
pm2 startOrReload deployment/ecosystem.config.cjs
pm2 save
```
