# SkillSwap Security Scan Report — Scan 5
**Date:** 2026-04-02 (Fifth automated scan)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + git history + dependencies
**Framework:** OWASP Top 10
**Pre-Launch Status:** 🚨 LAUNCH BLOCKED — 4 CRITICAL issues. ALL 4 remain UNPATCHED after 5 scans.

---

## 🔴 THIS IS SCAN 5. ZERO PATCHES HAVE BEEN APPLIED.

The 5 most recent git commits are all UI changes: category images, photo positioning, title text. No security work has been done. Launch is scheduled for Friday. **Friday is today.**

**Ed: these are not theoretical risks. They are confirmed open vulnerabilities in production-bound code. None require more than 45 minutes to fix.**

---

## EXECUTIVE SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 4 | ALL OPEN — unchanged since Scan 1 |
| 🟠 HIGH | 5 | ALL OPEN — unchanged since Scan 1 |
| 🟡 MEDIUM | 4 | ALL OPEN |
| 🟢 LOW | 3 | ALL OPEN |

---

## 🔴 CRITICAL VULNERABILITIES — ALL STILL OPEN

---

### CRIT-1: Username Used as Password — CONFIRMED OPEN ⚠️

**File:** `src/Signup.jsx`, line 56
**Confirmed:** `/signup` route is still active in `App.jsx` lines 229-231
**OWASP:** A07 — Identification and Authentication Failures

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to the username. Usernames appear publicly on listings. Any attacker who can see a listing page can take over that account. This is account takeover at 0% effort.

**Fix (30 min):** Add a real password field to `Signup.jsx`. Remove line 56. The `Auth.jsx` component already has a proper signup flow — consider routing `/signup` there instead.

---

### CRIT-2: Profiles Table Exposes PII to Anyone — CONFIRMED OPEN ⚠️

**File:** `SUPABASE_SCHEMA.sql` + `src/App.jsx` line 83
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);
```
```javascript
.from('profiles').select('*')   // App.jsx line 83
```

The profiles table — containing `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at` — is readable by any anonymous request using the hardcoded anon key. Phone numbers and Stripe IDs of every user are publicly accessible right now.

**Fix (20 min):**
- Change SELECT policy to `USING (auth.uid() = id)`
- Create a public view with only `full_name`, `primary_skill`, `seeking_skill`, `bio`
- Change `App.jsx` line 83 to select only display columns

---

### CRIT-3: Checkout Endpoint Has No JWT Verification — CONFIRMED OPEN ⚠️

**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id from untrusted request body
```

The endpoint accepts `user_id` directly from the request body with no check that the caller is actually that user. Combined with CRIT-2 (all user UUIDs are publicly readable), any attacker can initiate a Stripe checkout session on behalf of any user.

**Fix (45 min):** Extract `user_id` from the verified Supabase JWT:
```typescript
const { data: { user } } = await supabase.auth.getUser(
  req.headers.get('authorization')?.replace('Bearer ', '')
);
const user_id = user?.id;
```
Never trust `user_id` from the request body.

---

### CRIT-4: Live Stripe Secret Key in Git History — ROTATION UNCONFIRMED ⚠️

**Commits:** `74580485`, `f9763677`, commit message of `7e18216d`
**OWASP:** A02 — Cryptographic Failures

The live Stripe secret key (`sk_live_51TE7FM...`) is permanently embedded in git history. The `.env` is now empty — but the key is 100% recoverable from the commit log. The commit that "removed" the key printed it verbatim in the commit message.

This key has been sitting in git history for multiple days. Automated scanners (GitGuardian, TruffleHog, GitHub Secret Scanning) typically harvest exposed keys within minutes.

**What needs to happen RIGHT NOW:**
1. Open Stripe Dashboard. Confirm whether this key has been rotated.
2. If NOT rotated: rotate it immediately, then check event logs for unauthorized API calls, refunds, or customer data access.
3. Add the new key to Vercel environment variables only. Never in source code.

---

## 🟠 HIGH VULNERABILITIES — ALL OPEN

**HIGH-1: Phone Numbers in Plaintext**
Stored as plain `TEXT` in profiles table. Compounded by CRIT-2. Fix CRIT-2 first, then consider app-layer encryption.

**HIGH-2: No Password Strength Enforcement**
`Auth.jsx` accepts any password string with no minimum length or complexity check. Set minimum password length in Supabase Dashboard > Auth > Settings (recommended: 8+ chars, enforce in UI too).

**HIGH-3: 15 High-Severity Dependency Vulnerabilities**
`npm audit` confirms: 15 HIGH, 3 MODERATE, 9 LOW. Notable: `serialize-javascript` (RCE), `lodash` (prototype pollution + code injection), `nth-check` (ReDoS), `webpack-dev-server` (source code theft via CVE). Run `npm audit --production` to scope production impact. Est. fix: 1–8 hours.

**HIGH-4: No Security Headers**
`server.js` serves static files with no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy`. Exposes users to clickjacking and MIME-sniffing attacks. Add headers in `serveFile()` and/or via `vercel.json`. Est. fix: 30 min.

**HIGH-5: listing_views INSERT Open to Unauthenticated Abuse**
`WITH CHECK (true)` allows anyone to flood this table with fake view counts and consume database resources. Change to `WITH CHECK (auth.uid() IS NOT NULL)`. Est. fix: 15 min.

---

## 🟡 MEDIUM VULNERABILITIES

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` — should use `process.env.REACT_APP_SUPABASE_ANON_KEY`. Makes key rotation require a code change.

**MED-2:** No CSRF protection on edge functions. Largely resolved once CRIT-3 JWT fix is in place.

**MED-3:** No explicit rate limiting on auth endpoints. Verify in Supabase Dashboard > Auth > Rate Limits.

**MED-4:** Student discount applied client-side — `is_student` flag set based on `.edu` email detection in `Auth.jsx` line 15, passed to user metadata. A user can manipulate the request payload to claim student pricing. Validate `.edu` domain server-side.

---

## 🟢 LOW VULNERABILITIES

**LOW-1:** Email verification not enforced before login. Enable in Supabase Dashboard > Auth > Email Confirmations.

**LOW-2:** Phone number accepted as free-text with no format validation. Add regex or library-based formatting.

**LOW-3:** Confirm `server.log` was never committed with sensitive data before `.gitignore` was added.

---

## WHAT'S WORKING (Keep These)

- CORS on edge functions scoped to `SITE_URL` env var
- Stripe webhook uses `constructEventAsync` with signature verification
- RLS enabled on all tables (policies need tightening)
- Service role key in edge function env vars only — never in source
- Path traversal prevention in `server.js` (`fullPath.startsWith(BUILD_DIR)`)
- `.gitignore` now correctly excludes `.env`, `node_modules/`, `build/`, `*.log`

---

## REMEDIATION ORDER (Do These Now)

| Priority | Issue | Est. Time |
|----------|-------|-----------|
| 🚨 0 | Stripe Dashboard: confirm key is rotated, check for fraudulent activity | 15 min |
| 1 | Fix `Signup.jsx` line 56 — add real password field | 30 min |
| 2 | Fix profiles RLS SELECT policy + change `App.jsx select('*')` | 20 min |
| 3 | Add JWT verification to `create-checkout-session` edge function | 45 min |
| 4 | Add security headers to `server.js` / `vercel.json` | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users | 15 min |
| 6 | Enforce password minimum length in `Auth.jsx` | 30 min |
| 7 | Move anon key to env vars | 10 min |

**Total to clear all launch blockers: ~3 hours.**

---

## SCAN-OVER-SCAN PATCH TRACKER

| Issue | Scan 1 | Scan 2 | Scan 3 | Scan 4 | Scan 5 |
|-------|--------|--------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open |

**5 scans. 0 patches. Launch is today.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 5 — 2026-04-02*
*Next scan: Scheduled hourly*
*Dean: Escalate all CRITICAL items to Ed immediately. Friday is today.*
