# SkillSwap Security Scan Report — Scan 2
**Date:** 2026-04-02 (Second automated scan)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + git history
**Framework:** OWASP Top 10
**Pre-Launch Status:** 🚨 LAUNCH BLOCKED — 4 CRITICAL issues. All 3 from Scan 1 remain UNPATCHED. 1 NEW CRITICAL discovered.

---

## CRITICAL UPDATE vs. PRIOR REPORT

The 3 Critical vulnerabilities identified in Scan 1 earlier today are **all still present and unpatched.** A new fourth Critical issue has been discovered in git history.

---

## EXECUTIVE SUMMARY

| Severity | Count | Status vs. Scan 1 |
|----------|-------|-------------------|
| 🔴 CRITICAL | 4 | +1 NEW (CRIT-4 git history) |
| 🟠 HIGH | 5 | Unchanged — all unpatched |
| 🟡 MEDIUM | 4 | Unchanged |
| 🟢 LOW | 3 | Unchanged |

**Friday launch cannot proceed until CRIT-1 through CRIT-4 are resolved.**

---

## 🔴 CRITICAL VULNERABILITIES

---

### CRIT-1: Username Used as Password — STILL UNPATCHED ⚠️

**File:** `src/Signup.jsx`, line 56
**OWASP:** A07 — Identification and Authentication Failures
**Route:** `/signup` IS ACTIVE and reachable (confirmed in App.jsx line 230)

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to their publicly visible username. Any attacker who sees a username can immediately log in as that user.

**Confirmed:** The `/signup` route is live in production routing. This is not dead code.

**Remediation (30 min):** Add a dedicated password field to Signup.jsx. Remove the username-as-password line. Consider whether Signup.jsx and Auth.jsx should be consolidated into one signup flow.

---

### CRIT-2: Profiles Table Exposes PII to Public — STILL UNPATCHED ⚠️

**File:** `SUPABASE_SCHEMA.sql`
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);
```

The `profiles` table contains: `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at`. All of this is readable by any unauthenticated user via the publicly bundled anon key.

Additionally, `App.jsx` line 82 fetches `select('*')` from profiles — even the frontend is pulling all columns including sensitive fields.

**Remediation (15 min):** Replace with a scoped RLS policy that restricts SELECT to `auth.uid() = id`. Update `App.jsx` to only request public-safe columns.

---

### CRIT-3: Checkout Session Endpoint Has No JWT Auth — STILL UNPATCHED ⚠️

**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id comes from untrusted input
```

Any caller can pass any user's UUID to create a Stripe checkout session on their behalf. Combined with CRIT-2 (all UUIDs are publicly readable), this is an active exploit chain.

**Remediation (45 min):** Extract `user_id` from the verified JWT server-side. Never trust `user_id` from the request body.

---

### CRIT-4: Live Stripe Secret Key Exposed in Git Commit History — NEW 🆕

**File:** `.git` commit history — commit `7e18216d` (March 30, 2026)
**OWASP:** A02 — Cryptographic Failures

A live Stripe secret key (`sk_live_...`) was committed to the repository and the key value appears verbatim in the git commit message for commit `7e18216d`. That commit acknowledges the exposure and says the key "must be rotated immediately" — but that was March 30, and today is April 2 (3 days ago).

**The key is now permanent in git history and will be visible to anyone who can access this repository.**

**Risk:**
- If the key has NOT been rotated: an attacker with repo access can charge cards, issue refunds, create customers, and access all Stripe data right now
- Even if rotated: if this is a public or semi-public repo, the key may have already been harvested by automated scanners that monitor GitHub for leaked secrets (TruffleHog, GitGuardian, etc.)
- Stripe itself may have auto-detected and blocked the key — but you need to verify this in the Stripe dashboard

**Remediation (IMMEDIATE — before anything else):**
1. Log into the Stripe dashboard NOW and confirm the key has been rotated or rotate it immediately
2. Check Stripe logs for any API calls using this key that were not made by you
3. Consider running `git filter-branch` or `git rebase` to scrub the key from history, then force-push — but only after rotating the key first
4. If this repo is on GitHub, report the secret to GitHub's secret scanning to ensure it is flagged

**Estimated fix time:** 15 minutes (rotation) + potentially hours if unauthorized Stripe activity is found

---

## 🟠 HIGH VULNERABILITIES (All Unpatched From Scan 1)

---

### HIGH-1: Phone Numbers Stored in Plaintext
**File:** `SUPABASE_SCHEMA.sql` + `src/Auth.jsx`
Phone numbers collected at signup stored as plaintext `TEXT`. Compounds CRIT-2.
**Fix:** Encrypt at app layer or use Supabase Vault. At minimum fix CRIT-2 first.
**Est. time:** 2–4 hours

---

### HIGH-2: No Password Strength Enforcement
**File:** `src/Auth.jsx`
The signup password field accepts any string with no minimum length, complexity check, or breach check. No frontend validation present.
**Fix:** Add min 8 chars + 1 number/symbol validation on the frontend. Confirm Supabase Auth minimum password length is set in the dashboard.
**Est. time:** 30 minutes

---

### HIGH-3: 15 High-Severity Dependency Vulnerabilities (react-scripts chain)
**File:** `package.json` — `react-scripts@5.0.1`
`npm audit` confirms: **15 HIGH, 3 MODERATE, 9 LOW** — all tracing to `react-scripts@5.0.1`. Notable packages: `serialize-javascript`, `lodash`, `nth-check`, `svgo`, `workbox`, `underscore`/`jsonpath`/`bfj` chain.

`webpack-dev-server` also has a MODERATE source code theft vulnerability (GHSA-9jgg-88mc-972h, GHSA-4v9v-hfq4-rm2v) — affects dev environment, not production.

Most HIGH findings are build-time only. `serialize-javascript` and `lodash` may be bundled into production output and could pose XSS risk.

**Fix:** Evaluate Vite migration (recommended) or run `npm audit --production` to isolate runtime-only risk. Pin `lodash` to 4.17.21+.
**Est. time:** 4–8 hours (Vite) or 1 hour (targeted patches)

---

### HIGH-4: Missing Security Headers on Static Server
**File:** `server.js`
Confirmed: `server.js` does not set any security headers. Missing: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`.
**Fix:** Add security headers to `res.writeHead(200, {...})` in `serveFile()`.
**Est. time:** 30 minutes

---

### HIGH-5: listing_views INSERT Open to Unauthenticated Abuse
**File:** `SUPABASE_SCHEMA.sql`
```sql
CREATE POLICY "Anyone can insert a view"
  ON listing_views FOR INSERT
  WITH CHECK (true);
```
Anyone can flood this table with fake view counts and consume database resources with no rate limit or deduplication.
**Fix:** Restrict to `auth.uid() IS NOT NULL`.
**Est. time:** 15 minutes

---

## 🟡 MEDIUM VULNERABILITIES (All Unpatched)

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` instead of reading from `process.env`. Move to env vars per `.env.example` pattern.

**MED-2:** No CSRF protection on edge functions. Mitigated once CRIT-3 is fixed with JWT validation.

**MED-3:** No rate limiting on auth endpoints. Verify Supabase Auth rate limits are enabled in dashboard.

**MED-4:** `is_admin` flag set via raw SQL with no audit trail or access controls. Fix after CRIT-2 restricts visibility.

---

## 🟢 LOW VULNERABILITIES (All Unpatched)

**LOW-1:** No email verification enforcement before login — can be enabled in Supabase Auth settings.

**LOW-2:** Phone number not validated client-side — free text `type="tel"` with no format check.

**LOW-3:** `server.log` may have been tracked before `.gitignore` entry was added — confirm it was never committed.

---

## DEPENDENCY AUDIT

| Severity | Count | Notable |
|----------|-------|---------|
| HIGH | 15 | svgo, nth-check, serialize-javascript, lodash, workbox, underscore |
| MODERATE | 3 | webpack-dev-server (source theft CVE), postcss |
| LOW | 9 | jsdom, jest-related |

All HIGH findings trace to `react-scripts@5.0.1`. Fixes require a major version bump or framework migration.

---

## INFRASTRUCTURE NOTES

- **CORS:** Edge functions scope to `SITE_URL` env var — GOOD
- **Stripe Webhook:** Uses `constructEventAsync` with signature verification — GOOD
- **RLS:** Enabled on all tables — GOOD (but policies need tightening per CRIT-2/HIGH-5)
- **Service role key:** Only in edge function env vars, not in source — GOOD
- **Path traversal:** `server.js` has `fullPath.startsWith(BUILD_DIR)` check — GOOD
- **`.gitignore`:** Now correctly excludes `.env`, `node_modules/`, `build/`, `*.log` — GOOD
- **Git history:** Contains live Stripe key in commit message — CRITICAL (CRIT-4)

---

## REVISED REMEDIATION PRIORITY ORDER

| Priority | Issue | Severity | Est. Time |
|----------|-------|----------|-----------|
| 🚨 0 | Rotate Stripe live key if not done — check for fraud | CRITICAL | 15 min |
| 1 | Fix username-as-password in Signup.jsx | CRITICAL | 30 min |
| 2 | Restrict profiles table SELECT RLS + fix App.jsx select | CRITICAL | 20 min |
| 3 | Add JWT auth to checkout edge function | CRITICAL | 45 min |
| 4 | Add security headers to server.js | HIGH | 30 min |
| 5 | Restrict listing_views INSERT to auth users | HIGH | 15 min |
| 6 | Enforce password strength | HIGH | 30 min |
| 7 | Move anon key to env vars | MEDIUM | 10 min |
| 8 | Encrypt phone numbers | HIGH | 2–4 hrs |
| 9 | Address react-scripts dep chain | HIGH | 4–8 hrs |

**Total time to clear all Critical + High blockers (items 0–6): ~3.5 hours**

---

## ESCALATION STATUS

- **CRIT-4 (Stripe key in git history):** IMMEDIATE action required. Dean to notify Ed within the hour. Check Stripe dashboard for unauthorized activity NOW.
- **CRIT-1, CRIT-2, CRIT-3:** Still unpatched from Scan 1. Deployment halted until resolved.
- **HIGH-1 through HIGH-5:** Must be resolved before Friday launch.
- **MEDIUM/LOW:** Next sprint.

---

## NEW FINDINGS SUMMARY (vs. Scan 1)

1. **CRIT-4 NEW:** Live Stripe secret key embedded in git commit message `7e18216d`. Must confirm rotation and check for fraud.
2. **CRIT-1 ACTIVE ROUTE CONFIRMED:** `/signup` route is live in production build. This is not dead code.
3. **App.jsx data exposure:** Frontend requests `select('*')` from profiles, pulling all sensitive columns — needs to be updated alongside CRIT-2 fix.
4. **Dependency count confirmed:** 27 total (15 HIGH, 3 MODERATE, 9 LOW) via live `npm audit`.

---

*Report generated by: CSO Automated Security Monitor*
*Scan 2 of hourly schedule — 2026-04-02*
*Next scan: Scheduled hourly*
