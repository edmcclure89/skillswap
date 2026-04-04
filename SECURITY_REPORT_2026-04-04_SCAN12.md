# SkillSwap Security Scan Report — Scan 12
**Date:** 2026-04-04 (LAUNCH DAY +1 hour since Scan 11)
**Scanner:** CSO Automated Security Monitor
**Last Commit:** `42c0c483` — "Update skill category images" (NO CHANGE — zero commits since Scan 11)
**Framework:** OWASP Top 10

---

## 🚨 LAUNCH DAY RED ALERT — ZERO PROGRESS SINCE SCAN 11 🚨

Zero commits. Zero deployments. Zero database migrations run.
All critical and high vulnerabilities remain exactly where they were one hour ago.
**NEW FINDING this scan: Full live Stripe secret key sitting in plaintext in `SKILLSWAP_TEAM_CREDENTIALS.txt` in the workspace folder.**

---

## EXECUTIVE SUMMARY

| Severity | Count | Change from Scan 11 |
|----------|-------|---------------------|
| 🔴 CRITICAL | 3 | +1 NEW (CRIT-5: plaintext key in workspace file) |
| 🟠 HIGH | 3 | No change |
| 🟡 MEDIUM | 2 | No change |
| 🟢 LOW | 2 | No change |

**npm audit:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW (unchanged)

**Deployment gate:** DO NOT launch. Three critical vulnerabilities are live.

---

## GIT STATUS — UNCHANGED FROM SCAN 11

The security patches remain uncommitted. Last commit was `42c0c483` on 2026-04-01.

| File | Fix Ready | Deployed |
|------|-----------|----------|
| `src/Signup.jsx` | ✅ Password min enforced in working dir | ❌ NOT committed |
| `src/App.jsx` | ✅ Safe column select in working dir | ❌ NOT committed |
| `src/Auth.jsx` | ✅ Password strength in working dir | ❌ NOT committed |
| `server.js` | ✅ Security headers in working dir | ❌ NOT committed |
| `src/supabaseClient.js` | ✅ Keys use env vars in working dir | ❌ NOT committed |
| `SECURITY_MIGRATION.sql` | ✅ Ready to run | ❌ NOT applied to Supabase |

---

## 🔴 CRITICAL VULNERABILITIES

---

### CRIT-2: Profiles Table PII Exposure — Database Migration Not Applied
**OWASP:** A01 — Broken Access Control
**Status:** 🔴 OPEN — no change

The live Supabase database still has `"Anyone can view profiles"` SELECT policy.
Anyone with the anon key (compiled into the production JS bundle) can enumerate every user's phone number, Stripe customer ID, Stripe subscription ID, and admin status.

App.jsx in the working directory already queries only safe columns, but it is NOT committed and NOT deployed. The production version fetches from `profiles` with a safe explicit column list (`id, full_name, primary_skill, seeking_skill, bio, created_at`) — which is correct — but the database policy itself still exposes everything to direct API calls that bypass the frontend.

**Fix (20 minutes):**
1. Supabase Dashboard → SQL Editor → New Query
2. Paste `SECURITY_MIGRATION.sql` (already in the repo root)
3. Hit Run

---

### CRIT-4: Live Stripe Secret Key in Git History — Rotation Unconfirmed
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 OPEN — no change

Key `sk_live_51TE7FM...` is permanently in git commits `74580485`, `f9763677`, and `7e18216d`.
This cannot be fixed by code change. It requires rotating the key in Stripe Dashboard.

**Fix (15 minutes):**
1. Stripe Dashboard → Developers → API Keys → Roll the live secret key
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY`
3. Check Stripe Events log for any unauthorized activity

---

### 🆕 CRIT-5: Live Stripe Secret Key Stored in Plaintext Workspace File
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 NEW THIS SCAN

`SKILLSWAP_TEAM_CREDENTIALS.txt` in the App workspace folder contains the full live Stripe secret key in plaintext:

```
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
```

This file also contains: Supabase URL, anon key, Vercel project IDs, and database schema details. If this workspace folder is synced to any cloud storage (Dropbox, iCloud, Google Drive, OneDrive) or shared with anyone, this key is compromised in a second location beyond git history.

**Fix (immediate):**
1. Delete or scrub the Stripe key from `SKILLSWAP_TEAM_CREDENTIALS.txt`
2. Rotate the Stripe key in Stripe Dashboard (required for CRIT-4 anyway)
3. Confirm the workspace folder is NOT synced to cloud storage

---

## 🟠 HIGH VULNERABILITIES — UNCHANGED

---

### HIGH-1: No Password Strength Enforcement in Production
**File:** `src/Auth.jsx`
**OWASP:** A07 — Authentication Failures
**Status:** Fixed in working directory, NOT committed

The working directory version of `Auth.jsx` enforces a 12-character minimum. Production does not. Accounts can be created with single-character passwords via the login form's signup path.

**Note:** `Signup.jsx` in the working directory correctly enforces 12 chars with a real-time counter. This fix exists — it just needs to be committed.

**Fix:** Included in the security commit below.

---

### HIGH-2: No Input Sanitization on Skill Listings
**File:** `src/PostSkill.jsx`
**OWASP:** A03 — Injection
**Status:** 🟠 OPEN — no change

Confirmed this scan: grep finds zero instances of `maxLength`, `DOMPurify`, or `sanitize` in `PostSkill.jsx`. React JSX auto-escaping provides one layer of XSS protection, but there is no length enforcement at the input level and no sanitization before database insert.

**Fix (30 minutes):**
- Add `maxLength={300}` to `offering` and `wanting` inputs
- Add `maxLength={500}` to `bio` textarea
- `npm install dompurify` and wrap values in `DOMPurify.sanitize()` before insert

---

### HIGH-3: 27 Dependency Vulnerabilities (15 HIGH)
**File:** `package.json` — `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components
**Status:** Unchanged — 0 critical, 15 HIGH, 3 MODERATE, 9 LOW

Root cause is the `react-scripts` dependency chain. Most HIGH severity issues are build-time (webpack, babel toolchain). Runtime-affecting issues include `lodash` prototype pollution.

**Fix:**
- Short-term: `npm audit fix` for auto-fixable items
- Long-term: migrate from `react-scripts` to Vite (4-8 hours, post-launch)

---

## 🟡 MEDIUM VULNERABILITIES — UNCHANGED

---

### MED-3: Supabase Auth Rate Limits — Not Verified
**Status:** Unconfirmed

Brute-force protection on login has not been confirmed active in the Supabase Dashboard. With 500 users signing up today, this is the window for credential-stuffing attacks.

**Fix (5 minutes):** Supabase Dashboard → Authentication → Rate Limits → Confirm: max 5 attempts / 15 min per IP.

---

### MED-4: Student Discount Validated Client-Side Only
**Status:** Open

`.edu` email check setting `is_student: true` is frontend-only. Any user can intercept the signup payload and claim student pricing ($8.98/mo vs. $49.98/mo).

**Fix (2 hours):** Supabase edge function or DB trigger to re-validate email domain server-side.

---

## 🟢 LOW VULNERABILITIES — UNCHANGED

**LOW-1:** Email verification enforcement not confirmed in Supabase Dashboard → Auth → Email Confirmations.

**LOW-2:** Phone number field accepts free-text with no format validation.

---

## CONFIRMED SECURE — NO CHANGE

| Item | Status |
|------|--------|
| CRIT-3: JWT auth on checkout endpoint | ✅ Deployed |
| CORS: scoped to SITE_URL env var | ✅ Correct |
| Stripe webhook: `constructEventAsync` + signature | ✅ Secure |
| RLS enabled on all tables | ✅ (SELECT policy still too broad — CRIT-2) |
| Service role key: edge functions only | ✅ Correct |
| Path traversal guard in server.js | ✅ `fullPath.startsWith(BUILD_DIR)` correct |
| `.gitignore`: excludes .env, node_modules, build | ✅ Correct |
| STRIPE_SECRET_KEY in .env file | ✅ Blank (key is in git history and credentials file — see CRIT-4/5) |
| Security headers in working dir server.js | ✅ Ready (NOT deployed — see HIGH-4 note) |

---

## PRIORITY ACTION CHECKLIST — DO THESE NOW

Estimated total: 60 minutes. Zero coding required for items 1-5.

| # | Action | Where | Time | Closes |
|---|--------|--------|------|--------|
| 1 | **Delete Stripe key from SKILLSWAP_TEAM_CREDENTIALS.txt** | Text editor | 2 min | CRIT-5 |
| 2 | **Rotate live Stripe secret key** | Stripe Dashboard → Developers → API Keys | 10 min | CRIT-4, CRIT-5 |
| 3 | **Update Supabase edge function with new Stripe key** | Terminal: `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY` | 5 min | CRIT-4, CRIT-5 |
| 4 | **Commit and push security patches** | Terminal: `git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js && git commit -m "Security patches: password enforcement, security headers, env vars" && git push` | 10 min | CRIT-1, HIGH-1, HIGH-4, MED-1 |
| 5 | **Run SECURITY_MIGRATION.sql in Supabase** | Supabase Dashboard → SQL Editor → Paste file → Run | 20 min | CRIT-2, HIGH-5 |
| 6 | **Confirm Supabase auth rate limits active** | Supabase Dashboard → Authentication → Rate Limits | 5 min | MED-3 |
| 7 | **Verify listings page still loads** | Browser → skillswap.vercel.app | 5 min | Confirm no regressions |

**After steps 1-7: zero critical vulnerabilities. Safe to launch.**

---

## SCAN-OVER-SCAN TRACKER

| Issue | Scan 11 Status | Scan 12 Status |
|-------|---------------|----------------|
| CRIT-1: Weak password auth | ✅ Fixed in source, NOT deployed | ✅ Fixed in source, NOT deployed |
| CRIT-2: Profiles PII (DB policy) | 🔴 Open | 🔴 Open — no change |
| CRIT-3: No JWT on checkout | ✅ Deployed | ✅ Deployed |
| CRIT-4: Stripe key in git history | 🔴 Open | 🔴 Open — no change |
| CRIT-5: Stripe key in credentials file | Not scanned | 🔴 NEW — plaintext in workspace |
| HIGH-1: No password min (Auth.jsx) | Fixed in source, not deployed | Fixed in source, not deployed |
| HIGH-2: No input sanitization | 🟠 Open | 🟠 Open — confirmed |
| HIGH-3: npm vulns (15 HIGH) | 🟠 Open | 🟠 Open — unchanged |
| HIGH-4: No security headers | Fixed in source, not deployed | Fixed in source, not deployed |
| MED-1: Anon key hardcoded | Fixed in source, not deployed | Fixed in source, not deployed |
| MED-3: Rate limits unconfirmed | 🟡 Open | 🟡 Open |
| MED-4: Student discount bypass | 🟡 Open | 🟡 Open |

---

## NOTE TO DEAN — FORWARD TO ED IMMEDIATELY

Ed — this is the Scan 12 report.

**The situation has not changed, but there is one new finding that is urgent:**

`SKILLSWAP_TEAM_CREDENTIALS.txt` in your workspace folder contains your full live Stripe key in plaintext. If that folder syncs to iCloud, Dropbox, or any cloud storage — or if you've shared the folder with anyone — the key is exposed in a second location. Open that file right now and delete the Stripe key line, then rotate the key in Stripe Dashboard.

Everything else is the same as Scan 11: the fixes are written, they are sitting uncommitted, and nothing has been deployed. The three terminal commands and two browser actions from Scan 11 still apply and will still take about 60 minutes total.

**This is the last report before the launch window. If you have any questions about how to execute any of these steps, ask Claude and it will walk you through exactly what to click.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 12 — 2026-04-04*
*Next scan: 1 hour*
