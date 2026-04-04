# SkillSwap Security Scan Report — Scan 4
**Date:** 2026-04-02 (Fourth automated scan of the day)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + git history + dependencies
**Framework:** OWASP Top 10
**Pre-Launch Status:** 🚨 LAUNCH BLOCKED — 4 CRITICAL issues. ALL 4 from Scans 1–3 remain UNPATCHED.

---

## CRITICAL ALERT: FRIDAY LAUNCH IS TOMORROW

**This is Scan 4. All 4 Critical vulnerabilities first identified in Scan 1 remain completely unpatched.**

Launch is scheduled for Friday. That is tomorrow. If these are not patched tonight, launch cannot happen safely. Dean: escalate to Ed immediately.

---

## EXECUTIVE SUMMARY

| Severity | Count | Status vs. Scan 3 |
|----------|-------|-------------------|
| 🔴 CRITICAL | 4 | Unchanged — all unpatched |
| 🟠 HIGH | 5 | Unchanged — all unpatched |
| 🟡 MEDIUM | 4 | Unchanged |
| 🟢 LOW | 3 | Unchanged |

**Zero patches applied since Scan 1. Launch is tomorrow.**

---

## 🔴 CRITICAL VULNERABILITIES (All Still Unpatched)

---

### CRIT-1: Username Used as Password — STILL UNPATCHED ⚠️

**File:** `src/Signup.jsx`, line 56
**Route:** `/signup` is live and active (`App.jsx` line 230)
**OWASP:** A07 — Identification and Authentication Failures

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to their username. Usernames appear publicly on listings. This means 100% of accounts created via this flow can be taken over by any attacker who can see the listing page.

**Remediation (30 min):** Add a real password field to `Signup.jsx`. Remove line 56. Either add password validation inline or redirect users to `Auth.jsx` which already has a proper signup flow.

---

### CRIT-2: Profiles Table Exposes PII to Anyone on the Internet — STILL UNPATCHED ⚠️

**File:** `SUPABASE_SCHEMA.sql` + `src/App.jsx` line 82–83
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);
```

```javascript
.from('profiles').select('*')
```

The profiles table contains: `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at`. The Supabase anon key is hardcoded in the frontend bundle (MED-1). Anyone on the internet can query the full profiles table with zero authentication and get every user's phone number, Stripe IDs, and admin status.

**Remediation (20 min):**
1. Change the SELECT policy to `USING (auth.uid() = id)` — users can only see their own full profile.
2. Create a separate `public_profiles` view that exposes only `full_name`, `primary_skill`, `seeking_skill`, `bio` for the listings directory.
3. Update `App.jsx` `select('*')` to only request the columns needed for display.

---

### CRIT-3: Checkout Session Endpoint Has No JWT Auth — STILL UNPATCHED ⚠️

**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id taken from untrusted request body
```

The endpoint accepts `user_id` from the request body with no verification that the caller is actually that user. Combined with CRIT-2 (all user UUIDs are publicly readable), an attacker can:
1. Query the profiles table to enumerate all user UUIDs.
2. Call this endpoint with any user's UUID to initiate a checkout on their behalf.

**Remediation (45 min):** Extract `user_id` from the verified Supabase JWT server-side:
```typescript
const { data: { user }, error } = await supabase.auth.getUser(
  req.headers.get('authorization')?.replace('Bearer ', '')
);
const user_id = user?.id;
```
Never trust `user_id` from the request body.

---

### CRIT-4: Live Stripe Secret Key in Git History and Commit Message — ROTATION UNCONFIRMED ⚠️

**Commits:** `74580485` (original exposure), `f9763677`, commit message of `7e18216d`
**OWASP:** A02 — Cryptographic Failures

The Stripe live secret key (`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`) is permanently embedded in:
- The `.env` file contents of commits `74580485` and `f9763677` (accessible via `git show`)
- The plain-text commit message of `7e18216d` (which "removed" the key from the file but wrote it verbatim in the commit message)

The `.env` is now empty and `.gitignore` has been updated — but the key is still 100% recoverable from git history by anyone with repo access, now or in the future. The commit message noted "must be rotated immediately" — that was 3 days ago.

**Automated secret scanning tools (GitGuardian, TruffleHog, GitHub secret scanning) likely harvested this key within minutes of the original push.**

**Remediation:**
1. Go to Stripe Dashboard NOW. Confirm whether this key has been rotated. If it has not, rotate it immediately.
2. Check Stripe event logs for unauthorized API calls, unusual refunds, customer data access, or webhook activity from unrecognized IPs.
3. Add new live key to Vercel environment variables only — never in source code.
4. Scrub key from git history using `git filter-repo` and force-push (coordinate with team to re-clone).
5. If repo is on GitHub, use the "Revoke" button in GitHub Secret Scanning alerts.

---

## 🟠 HIGH VULNERABILITIES (All Unpatched from Scan 1)

**HIGH-1: Phone Numbers Stored in Plaintext**
- File: `SUPABASE_SCHEMA.sql`, `src/Auth.jsx`
- Phone numbers collected at signup are stored as plain `TEXT` in the profiles table. Currently compounded by CRIT-2 (anyone can read them). Fix CRIT-2 first, then encrypt at the app layer.
- Est. time: 2–4 hours

**HIGH-2: No Password Strength Enforcement**
- File: `src/Auth.jsx`
- The `Auth.jsx` signup flow accepts any password string with no minimum length, complexity, or breach checking. Also set minimum password length in Supabase Dashboard > Auth > Settings.
- Est. time: 30 minutes

**HIGH-3: 15 High-Severity Dependencies in react-scripts Chain**
- File: `package.json` — `react-scripts@5.0.1`
- npm audit confirms: 15 HIGH, 3 MODERATE, 9 LOW findings. Notable: `serialize-javascript` (RCE via regex, CPU exhaustion), `lodash` (code injection via template + prototype pollution), `nth-check` (ReDoS), `webpack-dev-server` (source code theft CVE). Run `npm audit --production` to determine which vulnerabilities affect the production bundle.
- Est. time: 1 hour (targeted patches) or 4–8 hours (Vite migration)

**HIGH-4: No Security Headers on Static Server**
- File: `server.js` — no `vercel.json` exists either
- Missing: `Content-Security-Policy`, `X-Frame-Options` (clickjacking), `X-Content-Type-Options` (MIME sniffing), `Strict-Transport-Security`, `Referrer-Policy`.
- Est. time: 30 minutes (add to `serveFile()` in server.js; also add via vercel.json for Vercel deployments)

**HIGH-5: listing_views INSERT Open to Unauthenticated Abuse**
- File: `SUPABASE_SCHEMA.sql`
- `WITH CHECK (true)` allows anyone to flood this table with fake view counts and consume database resources without any rate limit or authentication.
- Est. time: 15 minutes — change to `WITH CHECK (auth.uid() IS NOT NULL)`

---

## 🟡 MEDIUM VULNERABILITIES (Unpatched)

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` instead of environment variables. Should be `process.env.REACT_APP_SUPABASE_ANON_KEY`. The anon key is considered public-safe by Supabase design, but hardcoding makes rotation impossible without a code change.

**MED-2:** No CSRF protection on edge functions. Largely mitigated once CRIT-3 is fixed with JWT verification.

**MED-3:** No explicit rate limiting on auth endpoints. Verify in Supabase Dashboard > Auth > Rate Limits that email/password rate limits are enabled.

**MED-4:** Student discount (`is_student: isStudentEmail`) is set client-side based on `.edu` email detection in `Auth.jsx` line 15. Server-side, nothing prevents a user from manipulating this flag. The metadata is passed directly to `options.data` and written to the profiles table. This could be exploited by modifying the request to claim student pricing. Validate `.edu` domain server-side before applying discount.

---

## 🟢 LOW VULNERABILITIES (Unpatched)

**LOW-1:** No email verification enforcement before login. Can be enabled in Supabase Dashboard > Auth > Email Confirmations.

**LOW-2:** Phone number accepted as free-text with no format validation. Add regex or library-based formatting client-side.

**LOW-3:** `server.log` was in the project before `.gitignore` was added — confirm it was never committed with sensitive request or error data.

---

## DEPENDENCY AUDIT (Confirmed Live — npm audit)

| Severity | Count | Notable Packages |
|----------|-------|-----------------|
| HIGH | 15 | serialize-javascript (RCE), lodash (code injection + proto pollution), svgo, nth-check (ReDoS), bfj, jsonpath |
| MODERATE | 3 | webpack-dev-server (source code theft), postcss |
| LOW | 9 | jsdom, jest-related |

All HIGH findings trace to `react-scripts@5.0.1`. No critical-severity npm CVEs at this time.

---

## WHAT'S WORKING (Don't Break These)

- CORS on edge functions scoped to `SITE_URL` env var — GOOD
- Stripe webhook uses `constructEventAsync` with signature verification — GOOD
- RLS enabled on all tables (policies need tightening) — GOOD
- Service role key only in edge function env vars, never in source — GOOD
- Path traversal prevention in `server.js` (`fullPath.startsWith(BUILD_DIR)`) — GOOD
- `.gitignore` now correctly excludes `.env`, `node_modules/`, `build/`, `*.log` — GOOD

---

## REMEDIATION PRIORITY ORDER (Tonight)

| Priority | Issue | Severity | Est. Time |
|----------|-------|----------|-----------|
| 🚨 0 | Stripe key: Go to Stripe Dashboard. Confirm it's rotated. Check event logs for fraud. | CRITICAL | 15 min |
| 1 | Fix username-as-password in `Signup.jsx` line 56 | CRITICAL | 30 min |
| 2 | Restrict profiles RLS SELECT policy + fix `App.jsx select('*')` | CRITICAL | 20 min |
| 3 | Add JWT verification to create-checkout-session edge function | CRITICAL | 45 min |
| 4 | Add security headers to `server.js` and/or `vercel.json` | HIGH | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users only | HIGH | 15 min |
| 6 | Enforce password minimum length in `Auth.jsx` | HIGH | 30 min |
| 7 | Move anon key to env vars | MEDIUM | 10 min |

**Total time to clear all launch blockers: ~3 hours if starting now.**

---

## SCAN-OVER-SCAN PATCH TRACKER

| Issue | Scan 1 | Scan 2 | Scan 3 | Scan 4 |
|-------|--------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Open | 🔴 Open |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Open | 🟠 Open | 🟠 Open |

**4 scans. 0 patches. Launch is tomorrow.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 4 — 2026-04-02*
*Next scan: Scheduled hourly*
*Dean: Please forward CRIT items to Ed immediately.*
