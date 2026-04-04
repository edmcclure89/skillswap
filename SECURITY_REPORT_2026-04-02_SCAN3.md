# SkillSwap Security Scan Report — Scan 3
**Date:** 2026-04-02 (Third automated scan of the day)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + git history + dependencies
**Framework:** OWASP Top 10
**Pre-Launch Status:** 🚨 LAUNCH BLOCKED — 4 CRITICAL issues. ALL 4 from Scan 2 remain UNPATCHED.

---

## CRITICAL UPDATE vs. PRIOR REPORTS

**All 4 Critical vulnerabilities identified in Scans 1 and 2 are STILL PRESENT and UNPATCHED.**

Friday launch is 2 days away. If these are not fixed today, launch cannot happen safely.

---

## EXECUTIVE SUMMARY

| Severity | Count | Status vs. Scan 2 |
|----------|-------|-------------------|
| 🔴 CRITICAL | 4 | Unchanged — all unpatched |
| 🟠 HIGH | 5 | Unchanged — all unpatched |
| 🟡 MEDIUM | 4 | Unchanged |
| 🟢 LOW | 3 | Unchanged |

**No new critical vulnerabilities discovered this scan.**
**The situation has not improved. Time is running out before Friday.**

---

## 🔴 CRITICAL VULNERABILITIES (All Unpatched)

---

### CRIT-1: Username Used as Password — STILL UNPATCHED ⚠️

**File:** `src/Signup.jsx`, line 56
**Route:** `/signup` is ACTIVE in production routing (`App.jsx` line 230)
**OWASP:** A07 — Identification and Authentication Failures

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to their username. Usernames are visible publicly on listings. This means **100% of accounts created via this flow can be taken over by any attacker who sees the listing page.**

**Confirmed still live:** `App.jsx` line 230 routes `/signup` directly to `Signup.jsx`. This is not dead code.

**Remediation (30 min):** Add a dedicated password field to `Signup.jsx`. Remove the username-as-password line. Consider consolidating with `Auth.jsx` into a single signup flow.

---

### CRIT-2: Profiles Table Exposes PII to Public — STILL UNPATCHED ⚠️

**File:** `SUPABASE_SCHEMA.sql` + `src/App.jsx` line 82
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);
```

The profiles table contains `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at`. All readable by any unauthenticated user via the publicly bundled anon key.

`App.jsx` line 82 requests `select('*')` — pulls all columns including sensitive fields to the browser.

**Remediation (20 min):** Replace SELECT policy with `auth.uid() = id`. Update `App.jsx` to only request public-safe columns (full_name, subscription_tier for display purposes).

---

### CRIT-3: Checkout Session Endpoint Has No JWT Auth — STILL UNPATCHED ⚠️

**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id and user_email come from untrusted request body
```

Any caller can pass any `user_id` to create a Stripe checkout session on their behalf. Combined with CRIT-2 (all UUIDs publicly readable via the anon key), this forms an active, exploitable attack chain. An attacker can enumerate user UUIDs from the profiles endpoint and create checkout sessions for any account.

**Remediation (45 min):** Extract `user_id` from the verified JWT server-side using Supabase's `auth.getUser()` with the Authorization header. Never trust `user_id` from the request body.

---

### CRIT-4: Live Stripe Secret Key in Git Commit Message — STILL NOT CONFIRMED ROTATED ⚠️

**Commit:** `7e18216d` (March 30, 2026)
**OWASP:** A02 — Cryptographic Failures

The Stripe live key (`sk_live_51TE7FM...`) is verbatim in the commit message of `7e18216d`. The commit says "must be rotated immediately" — that was 3 days ago. **No confirmation that rotation has occurred has been observed.**

**The key is permanently embedded in git history and readable by anyone with repo access.**

**Status of risk:**
- If NOT rotated: active Stripe account compromise. Full API access — charges, refunds, customer data.
- If rotated: risk is neutralized for active use but key remains in git history for future repo exposure.
- Automated secret scanners (GitGuardian, TruffleHog) may have already harvested this key.

**Remediation (IMMEDIATE):**
1. Confirm in Stripe Dashboard that this key has been rotated. If not, rotate NOW.
2. Review Stripe event logs for any unauthorized API calls.
3. Scrub key from git history (`git filter-branch` or `git rebase -i`) and force-push.
4. If repo is on GitHub, use GitHub's secret scanning/revocation feature.

---

## 🟠 HIGH VULNERABILITIES (All Unpatched From Scan 1)

---

### HIGH-1: Phone Numbers Stored in Plaintext
**File:** `SUPABASE_SCHEMA.sql` + `src/Auth.jsx`
Phone numbers collected at signup stored as plaintext `TEXT`. Compounds CRIT-2.
**Fix:** Encrypt at app layer or use Supabase Vault. At minimum fix CRIT-2 first to stop public exposure.
**Est. time:** 2–4 hours

---

### HIGH-2: No Password Strength Enforcement
**File:** `src/Auth.jsx`
Signup password field accepts any string with no minimum length, complexity check, or breach check.
**Fix:** Add min 8 chars + 1 number/symbol validation on the frontend. Set minimum password length in Supabase Auth dashboard settings.
**Est. time:** 30 minutes

---

### HIGH-3: 15 High-Severity Dependencies (react-scripts chain)
**File:** `package.json` — `react-scripts@5.0.1`
`npm audit` confirms: **15 HIGH, 3 MODERATE, 9 LOW** findings.
Notable HIGH packages: `svgo`, `nth-check`, `serialize-javascript`, `lodash`, `bfj`, `jsonpath`, `css-select`, `rollup-plugin-terser`.
`serialize-javascript` and `lodash` may be bundled into production output (XSS risk).
**Fix:** Evaluate Vite migration or run `npm audit --production` to isolate runtime-only risk. Pin `lodash` to 4.17.21+.
**Est. time:** 4–8 hours (Vite) or 1 hour (targeted patches)

---

### HIGH-4: Missing Security Headers on Static Server
**File:** `server.js`
No security headers set. Missing: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`.
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
Anyone can flood this table with fake view counts and consume database resources. No rate limit or deduplication exists.
**Fix:** Restrict to `auth.uid() IS NOT NULL`.
**Est. time:** 15 minutes

---

## 🟡 MEDIUM VULNERABILITIES (All Unpatched)

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` instead of reading from `process.env`. Move to env vars (`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`).

**MED-2:** No CSRF protection on edge functions. Mitigated once CRIT-3 is fixed with JWT validation.

**MED-3:** No rate limiting on auth endpoints. Verify Supabase Auth rate limits are enabled in the dashboard (Settings > Auth > Rate Limits).

**MED-4:** `is_admin` flag settable via direct SQL with no audit trail or access controls beyond RLS. Fix after CRIT-2 restricts visibility.

---

## 🟢 LOW VULNERABILITIES (All Unpatched)

**LOW-1:** No email verification enforcement before login — can be enabled in Supabase Auth settings (Settings > Auth > Enable email confirmations).

**LOW-2:** Phone number not validated client-side — free text `type="tel"` with no format check.

**LOW-3:** `server.log` may have been tracked before `.gitignore` entry was added — confirm it was never committed with sensitive content.

---

## DEPENDENCY AUDIT (Live npm audit results)

| Severity | Count | Notable Packages |
|----------|-------|-----------------|
| HIGH | 15 | svgo, nth-check, serialize-javascript, lodash, bfj, jsonpath |
| MODERATE | 3 | webpack-dev-server (source theft CVE), postcss |
| LOW | 9 | jsdom, jest-related |

All HIGH findings trace to `react-scripts@5.0.1`. No critical-severity npm CVEs at this time.

---

## INFRASTRUCTURE SNAPSHOT (What's Good)

- **CORS:** Edge functions scope to `SITE_URL` env var — GOOD
- **Stripe Webhook:** Uses `constructEventAsync` with signature verification — GOOD
- **RLS:** Enabled on all tables — GOOD (policies need tightening per CRIT-2/HIGH-5)
- **Service role key:** Only in edge function env vars, not in source — GOOD
- **Path traversal:** `server.js` has `fullPath.startsWith(BUILD_DIR)` check — GOOD
- **`.gitignore`:** Correctly excludes `.env`, `node_modules/`, `build/`, `*.log` — GOOD

---

## REMEDIATION PRIORITY ORDER

| Priority | Issue | Severity | Est. Time |
|----------|-------|----------|-----------|
| 🚨 0 | Confirm/complete Stripe key rotation. Check for fraud. | CRITICAL | 15 min |
| 1 | Fix username-as-password in `Signup.jsx` | CRITICAL | 30 min |
| 2 | Restrict profiles SELECT RLS + update App.jsx `select('*')` | CRITICAL | 20 min |
| 3 | Add JWT auth to create-checkout-session edge function | CRITICAL | 45 min |
| 4 | Add security headers to `server.js` | HIGH | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users | HIGH | 15 min |
| 6 | Enforce password strength in `Auth.jsx` | HIGH | 30 min |
| 7 | Move anon key to env vars | MEDIUM | 10 min |
| 8 | Encrypt phone numbers | HIGH | 2–4 hrs |
| 9 | Address react-scripts dependency chain | HIGH | 4–8 hrs |

**Total time to clear all Critical + High blockers (items 0–6): ~3.5 hours**
**Friday launch is in 2 days. These need to start today.**

---

## ESCALATION STATUS

- **CRIT-4 (Stripe key):** IMMEDIATE action. Confirm rotation in Stripe Dashboard. Check for unauthorized transactions.
- **CRIT-1, CRIT-2, CRIT-3:** 3 scans in, still unpatched. Dean to escalate to Ed — these are blocking launch.
- **HIGH-1 through HIGH-5:** Must be resolved before Friday launch.
- **MEDIUM/LOW:** Next sprint.

---

## SCAN-OVER-SCAN PATCH STATUS

| Issue | Scan 1 | Scan 2 | Scan 3 |
|-------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Unpatched | 🔴 Unpatched |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Unpatched | 🔴 Unpatched |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Unpatched | 🔴 Unpatched |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Unpatched/Unconfirmed |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Unpatched | 🟠 Unpatched |

---

*Report generated by: CSO Automated Security Monitor*
*Scan 3 of hourly schedule — 2026-04-02*
*Next scan: Scheduled hourly*
