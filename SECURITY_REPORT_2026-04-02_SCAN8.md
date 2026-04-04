# SkillSwap Security Scan Report — Scan 8
**Date:** 2026-04-02 (Eighth automated scan — POST-LAUNCH DAY)
**Scanner:** CSO Automated Security Monitor
**Latest Commit Scanned:** `42c0c483` — "Update skill category images: Crafts and Design tiles with new photos" (2026-04-01 12:13)
**Framework:** OWASP Top 10
**Prior Report:** SECURITY_REPORT_2026-04-02_SCAN7.md

---

## 🚨 LAUNCH BLOCKED — 4 CRITICAL VULNERABILITIES. 8 SCANS. ZERO PATCHES.

This is Scan 8. The latest commit is a photo swap. The commit before that was also a photo swap. There has been **no security work at any point in the codebase history.** All 4 critical vulnerabilities are confirmed open in the code users are hitting right now.

---

## CHANGES SINCE SCAN 7

**New commits since Scan 7:** 1 (`42c0c483` — category image swap, cosmetic only)
**Security patches applied:** 0
**Critical vulnerabilities resolved:** 0
**High vulnerabilities resolved:** 0

Status is **unchanged** from Scan 7.

---

## EXECUTIVE SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 4 | ALL OPEN — unchanged since Scan 1 |
| 🟠 HIGH | 5 | ALL OPEN — unchanged since Scan 1 |
| 🟡 MEDIUM | 4 | ALL OPEN |
| 🟢 LOW | 3 | ALL OPEN |

**npm audit (live):** 15 HIGH, 3 MODERATE, 9 LOW — confirmed by running `npm audit` against current `package-lock.json` this scan.

---

## 🔴 CRITICAL VULNERABILITIES — ALL CONFIRMED OPEN IN SCAN 8

---

### CRIT-1: Username Used as Password
**File:** `src/Signup.jsx`, line 56
**OWASP:** A07 — Identification and Authentication Failures
**Status:** 🔴 OPEN — code unchanged across all 8 scans

```javascript
password: formData.username, // Using username as password for now
```

Every account created through `/signup` has a password identical to their publicly visible username. Any attacker who reads a user's listing card has instant account access. All accounts created via this flow are permanently compromised until users change passwords manually.

**Fix (30 min):** Add a separate `password` field to `Signup.jsx`. The existing `Auth.jsx` already handles this correctly — consider redirecting `/signup` to it.

---

### CRIT-2: Profiles Table Exposes PII to the Public Internet
**File:** `SUPABASE_SCHEMA.sql` line 32 + `src/App.jsx` line 83
**OWASP:** A01 — Broken Access Control
**Status:** 🔴 OPEN — schema and code unchanged across all 8 scans

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);
```

The `profiles` table contains phone numbers, Stripe customer IDs, Stripe subscription IDs, `is_admin` flag, subscription tier, and terms agreement timestamp. The Supabase anon key is hardcoded in public source (`supabaseClient.js` line 4). Anyone with a browser can execute:

```
GET https://dvabymxhcefstjpzvznw.supabase.co/rest/v1/profiles?select=*
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

...and receive every user's phone number and Stripe billing data. With 500 users onboarded at launch, all 500 profiles are currently readable by anyone on the internet.

**Fix (20 min):**
- Change SELECT policy to: `USING (auth.uid() = id)`
- Create a separate public view exposing only: `id`, `full_name`, `primary_skill`, `bio`
- Update `App.jsx` line 83 to query the public view, not `profiles` directly

---

### CRIT-3: Checkout Endpoint Trusts Untrusted user_id
**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures
**Status:** 🔴 OPEN — code unchanged across all 8 scans

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification performed. user_id trusted from POST body.
```

The checkout endpoint accepts `user_id` directly from the request body with no JWT verification. Combined with CRIT-2 (all user UUIDs are publicly readable), any attacker can initiate a Stripe checkout on behalf of any user, or manipulate subscription associations via the webhook flow.

**Fix (45 min):**
```typescript
const authHeader = req.headers.get('authorization');
const { data: { user }, error } = await supabaseClient.auth.getUser(
  authHeader?.replace('Bearer ', '')
);
if (!user || error) return new Response('Unauthorized', { status: 401 });
const user_id = user.id; // Never accept from request body
```

---

### CRIT-4: Live Stripe Secret Key Permanently in Git History
**Commits:** `74580485`, `f9763677`, and printed verbatim in commit message `7e18216d`
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 OPEN — key is permanently recoverable from git log

The live key `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` is in the repository history and **printed in full in commit message `7e18216d`**. The `.env` file was later cleared, but this does not remove it from history. Anyone who has cloned this repo has had access to this key.

**If this key has not been rotated in Stripe Dashboard, it must be rotated immediately.** This is the only issue that cannot be resolved with a code change alone.

**Required action:** Stripe Dashboard → Developers → API Keys → Roll the key. Then audit for unauthorized charges, new webhook endpoints, and unauthorized API calls since commit `74580485` (2026-03-28).

---

## 🟠 HIGH VULNERABILITIES — ALL STILL OPEN

**HIGH-1: No Password Minimum Length**
`Auth.jsx` enforces no minimum password length. Supabase default is 6 characters but UI has no enforcement. Brute-force and credential stuffing risk is elevated at launch with 500 accounts. Recommended: 12+ characters with client-side enforcement.

**HIGH-2: No Server-Side Output Sanitization (Stored XSS Risk)**
User-submitted `offering`, `wanting`, and `bio` fields are rendered from the database without explicit sanitization. React JSX provides escape-by-default, but any future use of `dangerouslySetInnerHTML` (e.g., for rich text, email content, or admin dashboards) would expose stored XSS immediately. No sanitization library (DOMPurify, xss) is installed.

**HIGH-3: 15 High-Severity Dependency Vulnerabilities**
`npm audit` run this scan confirms: **15 HIGH, 3 MODERATE, 9 LOW**. Notable packages with runtime exposure:
- `lodash` — prototype pollution + code injection
- `jsonpath` — code injection
- `nth-check` — ReDoS
- `bfj` — JSON parsing vulnerabilities

Run `npm audit --production` to scope runtime vs build-only exposure. Most are in `react-scripts` build toolchain but `lodash` and `jsonpath` carry production risk.

**HIGH-4: No Security Headers**
`server.js` serves all files with no HTTP security headers. No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy`. Users are exposed to clickjacking and MIME-sniffing attacks.

**Fix (30 min):** Add to `serveFile()` in `server.js`:
```javascript
res.writeHead(200, {
  'Content-Type': contentType,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.stripe.com"
});
```

Or add a `vercel.json` headers config if deploying via Vercel.

**HIGH-5: listing_views Table Open to Unauthenticated Flood**
```sql
CREATE POLICY "Anyone can insert a view" ON listing_views FOR INSERT WITH CHECK (true);
```
Unauthenticated callers can flood the `listing_views` table — a straightforward denial-of-service against the Supabase free-tier row limits and billing thresholds. **Fix:** Change to `WITH CHECK (auth.uid() IS NOT NULL)`.

---

## 🟡 MEDIUM VULNERABILITIES

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` line 4. Should use `process.env.REACT_APP_SUPABASE_ANON_KEY`. Key rotation currently requires a full code deploy. The `.env.example` file already has the correct pattern — this is a 10-minute fix.

**MED-2:** No CSRF protection on edge functions. Partially mitigated once CRIT-3 (JWT verification) is applied.

**MED-3:** No explicit rate limiting on auth endpoints. Verify Supabase Dashboard → Auth → Rate Limits are tightened. Default brute-force protection may not be sufficient for a production launch.

**MED-4:** Student discount validated client-side only. The `is_student` flag is derived from `.edu` email detection in `Auth.jsx` line 15, passed via unverified user metadata. Any user can craft a signup payload claiming student pricing. Must be validated server-side.

---

## 🟢 LOW VULNERABILITIES

**LOW-1:** Email verification not enforced before login. Enable in Supabase Dashboard → Auth → Email Confirmations. Without this, anyone can create accounts with arbitrary email addresses.

**LOW-2:** Phone number accepted as free-text. No format validation, normalization, or uniqueness check. Can result in duplicate or garbage data at scale.

**LOW-3:** `server.log` exists in the repo directory. Confirm it contains no sensitive data (tokens, IDs, error traces with PII) before finalizing the git history.

---

## WHAT IS WORKING — KEEP THESE

- CORS on edge functions scoped to `SITE_URL` env var (not wildcard)
- Stripe webhook uses `constructEventAsync` with signature verification — correctly secured
- RLS enabled on all four tables (policies need tightening, but structure is correct)
- Service role key stored only in Supabase edge function env vars — never in source
- Path traversal prevention in `server.js` via `fullPath.startsWith(BUILD_DIR)` check
- `.gitignore` correctly excludes `.env`, `node_modules/`, `build/`, `*.log`
- Password field is not rendered as plain text anywhere in the UI

---

## REMEDIATION ORDER

| Priority | Issue | File | Est. Time |
|----------|-------|------|-----------|
| 🚨 0 | Rotate Stripe live key in Stripe Dashboard. Audit for fraud. | Stripe Dashboard | 15 min |
| 1 | `Signup.jsx` line 56 — replace username-as-password with real password field | `src/Signup.jsx` | 30 min |
| 2 | Profiles RLS: restrict SELECT to owner + create public view | `SUPABASE_SCHEMA.sql` + `App.jsx` | 20 min |
| 3 | JWT verification in checkout edge function | `supabase/functions/create-checkout-session/index.ts` | 45 min |
| 4 | Add security headers to `server.js` or `vercel.json` | `server.js` | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users | `SUPABASE_SCHEMA.sql` | 15 min |
| 6 | Password minimum length enforcement in `Auth.jsx` | `src/Auth.jsx` | 30 min |
| 7 | Move Supabase anon key to environment variable | `src/supabaseClient.js` | 10 min |

**Total to clear all critical and high blockers: ~3 hours of focused work.**

---

## SCAN-OVER-SCAN PATCH TRACKER

| Issue | Scan 1 | Scan 2 | Scan 3 | Scan 4 | Scan 5 | Scan 6 | Scan 7 | Scan 8 |
|-------|--------|--------|--------|--------|--------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open |

**8 scans. 0 patches. Every critical vulnerability found in Scan 1 and 2 remains open in the code users are hitting today.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 8 — 2026-04-02*
*Next scan: Scheduled hourly*

**Dean:** Escalate all CRITICAL items to Ed immediately. This is Scan 8 on launch day. CRIT-2 means every user's phone number and Stripe ID is readable right now by any person with an internet connection and a copy of the anon key (which is public in the source code). CRIT-1 means any account created via `/signup` can be taken over in seconds by reading the user's listing card. Three hours of dev work resolves all 4 criticals and all 5 highs. This needs to happen before the next user signs up.
