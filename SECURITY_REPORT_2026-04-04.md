# SkillSwap Security Scan Report — Scan 11
**Date:** 2026-04-04 (LAUNCH DAY)
**Scanner:** CSO Automated Security Monitor
**Last Commit:** `42c0c483` — "Update skill category images" (unchanged since Scan 10)
**Framework:** OWASP Top 10

---

## 🚨 LAUNCH DAY ALERT — CRITICAL PATCHES STILL NOT DEPLOYED 🚨

Today is the scheduled launch to 500 users. As of this scan, the security fixes identified on 2026-04-02 remain uncommitted and undeployed. **Two critical vulnerabilities are live in production right now.** This scan is a final hold-the-line warning.

---

## EXECUTIVE SUMMARY

| Severity | Count | Change from Scan 10 |
|----------|-------|---------------------|
| 🔴 CRITICAL | 2 | No change |
| 🟠 HIGH | 3 | No change |
| 🟡 MEDIUM | 2 | No change |
| 🟢 LOW | 2 | No change |

**npm audit:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW (unchanged)

**Deployment gate:** DO NOT launch to 500 users until CRIT-2 and CRIT-4 are resolved.

---

## GIT STATUS — FIXES EXIST, NONE DEPLOYED

The following patches have been sitting in the working directory uncommitted since 2026-04-02:

| File | Fix | Severity Cleared |
|------|-----|-----------------|
| `src/Signup.jsx` | Password field restored, 12-char minimum | 🔴 CRIT-1 |
| `src/App.jsx` | Queries only non-sensitive columns from `profiles` | 🔴 CRIT-2 (partial) |
| `src/Auth.jsx` | Password strength enforcement added | 🟠 HIGH-1 |
| `server.js` | Security headers added (CSP, X-Frame, nosniff, etc.) | 🟠 HIGH-4 |
| `src/supabaseClient.js` | Keys moved to env vars | 🟡 MED-1 |
| `supabase/functions/create-checkout-session/index.ts` | JWT auth added | 🔴 CRIT-3 (already deployed) |

**These changes clear CRIT-1 and HIGH-1 from production as soon as they are committed and pushed.** The three-line commit command:

```bash
git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js
git commit -m "Security patch: fix password auth, add security headers, move keys to env"
git push
```

---

## 🔴 CRITICAL VULNERABILITIES — STILL OPEN IN PRODUCTION

---

### CRIT-2: Profiles Table PII Exposure — Database Migration Not Applied
**OWASP:** A01 — Broken Access Control
**Status:** 🔴 OPEN IN PRODUCTION — code fix ready but DB not updated

**Current state:**
- `SECURITY_MIGRATION.sql` was generated on 2026-04-02 and has not been run
- The live Supabase database still has `CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true)`
- Any person with the anon key (which is compiled into the production JS bundle) can call `supabase.from('profiles').select('*')` and retrieve every user's phone number, Stripe customer ID, Stripe subscription ID, and admin status
- `App.jsx` in the working directory now queries only safe columns — but even this fix is uncommitted

**Exploit in 3 lines:**
```javascript
const { data } = await supabase.from('profiles').select('phone, stripe_customer_id, is_admin')
// Returns: every user's phone, Stripe IDs, and whether they are an admin
```

**Fix:**
1. Run `SECURITY_MIGRATION.sql` in Supabase Dashboard → SQL Editor → New Query → Run (20 min)
2. Commit `src/App.jsx` changes (already in working dir) and push to Vercel

---

### CRIT-4: Live Stripe Secret Key in Git History — Rotation Unconfirmed
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 OPEN — requires action in Stripe Dashboard only

Key `sk_live_51TE7FM...` is permanently embedded in git commits `74580485`, `f9763677`, and message `7e18216d`. No code change removes it — it is baked into git history.

**If this key has not been rotated in Stripe Dashboard, it is live and usable by anyone who has cloned the repo or viewed those commits.**

**Fix (15 minutes):**
1. Stripe Dashboard → Developers → API Keys → Roll the live secret key
2. Update Supabase edge function secrets: `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY`
3. Review Stripe Dashboard → Events for any unauthorized charges since ~2026-03-28

**There is no code change that fixes this. It requires a human to open Stripe Dashboard.**

---

## 🟠 HIGH VULNERABILITIES — OPEN

---

### HIGH-1: No Password Strength Enforcement in Production
**File:** `src/Auth.jsx`
**OWASP:** A07 — Authentication Failures
**Status:** Fixed in working directory, NOT committed

Auth.jsx in the working directory enforces a 12-character minimum. The version in production does not. Until committed and deployed, accounts can be created with single-character passwords.

**Fix:** Included in the commit above (working directory version is correct).

---

### HIGH-2: No Server-Side Input Sanitization on Skill Listings
**File:** `src/PostSkill.jsx`
**OWASP:** A03 — Injection
**Status:** Still open

Text inputs in `PostSkill.jsx` (`offering`, `wanting`, `bio`) have no `maxLength` HTML attributes and no DOMPurify sanitization. React's JSX auto-escaping prevents XSS for now, but this is a single layer of defense. The database has `CHECK (char_length(...) <= 300)` constraints, but long payloads still hit the network.

**Fix:**
- Add `maxLength={300}` to `offering` and `wanting` inputs
- Add `maxLength={500}` to `bio` textarea
- Run `npm install dompurify` and sanitize values before insert
- Estimated: 30 minutes

---

### HIGH-3: 27 Dependency Vulnerabilities (15 HIGH)
**File:** `package.json` — `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components
**Status:** Unchanged since Scan 1

npm audit returns: **0 critical, 15 HIGH, 3 MODERATE, 9 LOW**

Notable runtime-affecting packages:
- `lodash` — prototype pollution (HIGH) — may be bundled into production build
- `jsonpath` via `bfj` — code injection (HIGH) — build-time risk
- `serialize-javascript` — RCE via RegExp (HIGH) — build-time risk
- `webpack-dev-server` — source theft on non-Chromium browsers (MODERATE) — dev only

**Short-term:** `npm audit fix` resolves auto-fixable issues. `npm audit --production` confirms runtime scope.
**Long-term:** Migrate from `react-scripts` to Vite to eliminate the entire chain (4-8 hours).

---

## 🟡 MEDIUM VULNERABILITIES

---

### MED-3: Supabase Auth Rate Limits — Not Verified
**Status:** Unconfirmed

Login brute-force protection depends on Supabase's built-in rate limiting being active. This has not been confirmed in the Dashboard since launch. With 500 users onboarding today, this is the window for credential-stuffing attacks.

**Fix:** Supabase Dashboard → Authentication → Rate Limits → Confirm limits are set. Recommended: max 5 attempts / 15 min per IP.

---

### MED-4: Student Discount Validated Client-Side Only
**Status:** Still open

The `.edu` email check in `Auth.jsx` that sets `is_student: true` is frontend-only. Any user can intercept and modify the signup payload to claim student pricing ($8.98/mo instead of $49.98/mo).

**Fix:** Add a Supabase database trigger or edge function that re-validates the email domain server-side before setting `is_student: true`. Estimated: 2 hours.

---

## 🟢 LOW VULNERABILITIES

**LOW-1:** Email verification not confirmed as enforced before login. Check Supabase Dashboard → Auth → Email Confirmations.

**LOW-2:** Phone number format not validated client-side. Free-text entry allows malformed data.

---

## CONFIRMED SECURE — NO CHANGE NEEDED

| Item | Status |
|------|--------|
| CRIT-3: JWT auth on checkout endpoint | ✅ Deployed |
| CORS: scoped to `SITE_URL` env var | ✅ Correct |
| Stripe webhook: `constructEventAsync` with signature | ✅ Secure |
| RLS enabled on all tables | ✅ (SELECT policy still overly broad — see CRIT-2) |
| Service role key: edge functions only, not in source | ✅ Correct |
| Path traversal: `server.js` `fullPath.startsWith(BUILD_DIR)` | ✅ Correct |
| `.gitignore`: excludes `.env`, `node_modules`, `build`, `*.log` | ✅ Correct |
| STRIPE_SECRET_KEY: blank in `.env` file | ✅ (but see CRIT-4 for git history) |

---

## LAUNCH DAY ACTION CHECKLIST

Complete these in order. Estimated total: 1 hour.

| # | Action | Where | Time | Closes |
|---|--------|--------|------|--------|
| 1 | **Rotate Stripe live secret key** | Stripe Dashboard → Developers → API Keys | 15 min | CRIT-4 |
| 2 | **Update Supabase with new Stripe key** | `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY` | 5 min | CRIT-4 |
| 3 | **Commit + push security patches** | `git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js && git commit -m "Security patches" && git push` | 10 min | CRIT-1, HIGH-1, HIGH-4, MED-1 |
| 4 | **Run SECURITY_MIGRATION.sql in Supabase** | Supabase Dashboard → SQL Editor | 20 min | CRIT-2, HIGH-5 |
| 5 | **Verify listings page still loads after migration** | Browser | 5 min | Confirm CRIT-2 |
| 6 | **Verify Supabase Auth rate limits are active** | Supabase Dashboard → Auth | 5 min | MED-3 |

**After steps 1-6: zero critical vulnerabilities. Safe to launch.**

---

## SCAN-OVER-SCAN TRACKER (All Scans)

| Issue | Scans 1-9 | Scan 10 (Apr 2) | Scan 11 (Apr 4 — Today) |
|-------|-----------|-----------------|-------------------------|
| CRIT-1: Username=Password | 🔴 Open | ✅ Fixed in source | ✅ Fixed in source — NOT deployed |
| CRIT-2: Profiles PII (DB) | 🔴 Open | ⚠️ Partial | 🔴 Still open — DB migration not run |
| CRIT-3: No JWT on checkout | 🔴 Open (1-8), ✅ (9) | ✅ Deployed | ✅ Deployed |
| CRIT-4: Stripe key in git | 🔴 Open (2-9) | 🔴 Open | 🔴 Open — Stripe Dashboard action required |
| HIGH-1: No password min | 🟠 Open | ✅ Fixed in source | ✅ Fixed in source — NOT deployed |
| HIGH-2: No input sanitization | 🟠 Open | 🟠 Open | 🟠 Open |
| HIGH-3: npm vulns (15 HIGH) | 🟠 Open | 🟠 Open | 🟠 Open |
| HIGH-4: No security headers | 🟠 Open (1-8), ✅ (9) | ✅ Fixed in source | ✅ Fixed in source — NOT deployed |
| HIGH-5: listing_views flood | 🟠 Open | ⚠️ Migration ready | ⚠️ Migration ready — DB not confirmed |
| MED-1: Anon key hardcoded | 🟡 Open | ✅ Fixed in source | ✅ Fixed in source — NOT deployed |
| MED-3: Rate limits unconfirmed | 🟡 Open | 🟡 Open | 🟡 Open |
| MED-4: Student discount bypass | 🟡 Open | 🟡 Open | 🟡 Open |

---

## NOTE TO DEAN — FORWARD TO ED IMMEDIATELY

Ed — today is launch day and two critical vulnerabilities are still live.

**The fastest path to green:**

1. Open Stripe Dashboard, roll the live key (15 min — no code needed)
2. Run one git commit (the code is already fixed — just needs `git commit` + `git push`)
3. Paste `SECURITY_MIGRATION.sql` into Supabase SQL Editor and hit Run (20 min)

The development work is done. These are deployment steps only. Once those three things happen, SkillSwap drops to zero critical vulnerabilities and is safe to launch.

If you need step-by-step instructions for any of these three actions, ask Claude and it can walk you through exactly what to click.

---

*Report generated by: CSO Automated Security Monitor*
*Scan 11 — 2026-04-04*
*Next scan: 1 hour*
