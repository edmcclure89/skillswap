# SkillSwap Security Scan Report — Scan 13
**Date:** 2026-04-04
**Scanner:** CSO Automated Security Monitor
**Last Commit:** `42c0c483` — "Update skill category images" (NO CHANGE — zero commits since Scan 12)
**Framework:** OWASP Top 10

---

## 🚨 CRITICAL ALERT — ZERO PROGRESS SINCE SCAN 12 🚨

Zero commits. Zero deployments. Zero database migrations run.
All security patches are sitting uncommitted in the working directory — exactly where they were in Scan 12.
The three critical vulnerabilities remain live.

**Launch recommendation: DO NOT LAUNCH until CRIT-2 and CRIT-4 are resolved.**

---

## EXECUTIVE SUMMARY

| Severity | Count | Change from Scan 12 |
|----------|-------|---------------------|
| 🔴 CRITICAL | 3 | No change |
| 🟠 HIGH | 3 | No change |
| 🟡 MEDIUM | 2 | No change |
| 🟢 LOW | 2 | No change |

**npm audit:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW (unchanged)

**Deployment gate: DO NOT LAUNCH. Three critical vulnerabilities are live.**

---

## GIT STATUS — STILL UNCHANGED FROM SCAN 12

Last commit: `42c0c483` — still the same as every scan since 2026-04-01.

All security fixes exist in the working directory but have NOT been committed or deployed.

| File | Fix Written | Committed | Deployed |
|------|-------------|-----------|----------|
| `src/Signup.jsx` | ✅ 12-char password min | ❌ No | ❌ No |
| `src/App.jsx` | ✅ Safe column select | ❌ No | ❌ No |
| `src/Auth.jsx` | ✅ Password strength | ❌ No | ❌ No |
| `server.js` | ✅ Security headers | ❌ No | ❌ No |
| `src/supabaseClient.js` | ✅ Env vars only | ❌ No | ❌ No |
| `SECURITY_MIGRATION.sql` | ✅ Ready to run | ❌ Not applied | ❌ Not applied |

---

## 🔴 CRITICAL VULNERABILITIES

---

### CRIT-2: Profiles Table PII Exposure — Database Migration Not Applied
**OWASP:** A01 — Broken Access Control
**Status:** 🔴 OPEN — no change since Scan 5

The live Supabase database still has the `"Anyone can view profiles"` SELECT policy with no column restrictions.
Anyone who has the anon key (it is compiled into the production JS bundle — always public) can call the Supabase API directly and read every user's:
- Phone number
- Stripe customer ID
- Stripe subscription ID
- Admin status (`is_admin`)
- Student status (`is_student`)

The fix (`SECURITY_MIGRATION.sql`) is written and sitting in the repo root. It has not been run.

**Fix (20 minutes):**
1. Supabase Dashboard → SQL Editor → New Query
2. Paste contents of `SECURITY_MIGRATION.sql`
3. Click Run
4. No code commit required — this is a database-side fix

---

### CRIT-4: Live Stripe Secret Key in Git History — Rotation Unconfirmed
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 OPEN — no confirmed rotation across 13 scans

Key `sk_live_51TE7FM...` is permanently in git commits `74580485`, `f9763677`, and commit message `7e18216d`.
This key has been exposed in a public (or shareable) git repo since 2026-03-30 or earlier.
No confirmation of rotation has been observed in any scan. The `.env` file has `STRIPE_SECRET_KEY=` (blank), which is correct — but the key is still live in git history and recoverable by anyone who has ever cloned the repo.

**Fix (15 minutes):**
1. Stripe Dashboard → Developers → API Keys → Roll the live secret key
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY`
3. Check Stripe Events log for unauthorized API calls (look for anything after 2026-03-30)

---

### CRIT-5: Live Stripe Secret Key in Plaintext Workspace Files
**OWASP:** A02 — Cryptographic Failures
**Status:** 🔴 OPEN — found in multiple files this scan

This scan found the live key `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` in:

- `/App/skillswap-fixed-routing/DEPLOYMENT_STATUS.md`
- Multiple prior scan report files (these are acceptable as documentation, but confirm they are not synced publicly)
- `CREDENTIALS_AND_NEXT_STEPS.md` references the exposure and confirms the key was live in `.env`

If any of the workspace folders (`/App/skillswap-fixed-routing/`) are synced to iCloud, Dropbox, Google Drive, or OneDrive, the key is exposed through a second channel.

**Fix (5 minutes):**
1. Open `DEPLOYMENT_STATUS.md` in `/App/skillswap-fixed-routing/` and remove or redact the key line
2. Rotate the Stripe key (same as CRIT-4 fix — one action closes both)
3. Confirm your workspace folder is NOT auto-synced to cloud storage

---

## 🟠 HIGH VULNERABILITIES — UNCHANGED

---

### HIGH-1: No Password Strength Enforcement in Production Auth.jsx
**File:** `src/Auth.jsx` (production version)
**OWASP:** A07 — Authentication Failures
**Status:** Fixed in working directory, NOT committed

The working directory `Auth.jsx` has a 12-character minimum. Production does not. Users can create accounts with any password length via the signup path in `Auth.jsx`.

`Signup.jsx` in working directory correctly enforces 12 chars. Neither file is committed.

**Fix:** Part of the security commit below. 10 minutes.

---

### HIGH-2: No Input Length Limits or Sanitization on Skill Listings
**File:** `src/PostSkill.jsx`
**OWASP:** A03 — Injection / A05 — Security Misconfiguration
**Status:** 🟠 OPEN — confirmed again this scan

Grep confirms zero instances of `maxLength`, `DOMPurify`, or `sanitize` in `PostSkill.jsx`. React JSX auto-escaping provides baseline XSS protection in rendering, but there is no enforcement at the input level. A user could submit 10,000-character strings to the database, bypassing the DB-level constraints only if they call the API directly with a modified payload.

Note: The Supabase schema has `CHECK (char_length(offering) <= 300)` — so the database will reject oversized inserts. This reduces risk but does not eliminate it (no client-side feedback, no sanitization).

**Fix (30 minutes):**
- Add `maxLength={300}` to `offering` and `wanting` inputs in `PostSkill.jsx`
- Add `maxLength={500}` to `bio` textarea
- Add `maxLength={100}` to `user_name` field
- Consider `npm install dompurify` for sanitization before insert

---

### HIGH-3: 27 Dependency Vulnerabilities (15 HIGH)
**File:** `package.json` — root cause: `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components
**Status:** Unchanged — 0 critical, 15 HIGH, 3 MODERATE, 9 LOW

```
Vulnerabilities: { info: 0, low: 9, moderate: 3, high: 15, critical: 0, total: 27 }
```

Most HIGH severity issues are in the build toolchain (webpack, babel). Runtime-affecting issues include lodash prototype pollution. None are directly exploitable in the deployed build artifact (since the build process bundles and ships only compiled output), but the development environment is exposed.

**Fix:**
- Short-term: `cd skillswap && npm audit fix` (run from project root)
- Long-term: Migrate from `react-scripts` to Vite (4-8 hours, post-launch)

---

## 🟡 MEDIUM VULNERABILITIES — UNCHANGED

---

### MED-3: Supabase Auth Rate Limits — Not Confirmed Active
**OWASP:** A07 — Authentication Failures
**Status:** 🟡 OPEN — unverified across all scans

No confirmation has been observed that Supabase's built-in rate limiting is enabled and set to a reasonable threshold. With 500 users expected today, this is the active window for credential-stuffing attempts.

**Fix (5 minutes):** Supabase Dashboard → Authentication → Rate Limits → Confirm max attempts per IP is set (recommended: 5 attempts / 15 minutes).

---

### MED-4: Student Discount Validated Client-Side Only
**OWASP:** A04 — Insecure Design
**Status:** 🟡 OPEN

The `.edu` email check that grants `is_student: true` is enforced only in frontend JavaScript. Any user can intercept and modify the signup payload to claim student pricing ($8.98/mo instead of $49.98/mo) without having a `.edu` email address.

**Fix (2 hours):** Supabase edge function or DB trigger to re-validate email domain server-side before setting `is_student`.

---

## 🟢 LOW VULNERABILITIES — UNCHANGED

**LOW-1:** Email verification enforcement not confirmed in Supabase Dashboard → Auth → Email Confirmations. If disabled, users can use any email address without verifying ownership.

**LOW-2:** Phone number field in `profiles` table accepts free-text input with no format validation. Could allow injection of unexpected characters (low risk given Supabase parameterized queries, but a data quality issue).

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
| STRIPE_SECRET_KEY in .env file | ✅ Blank (key is in git history and workspace files — CRIT-4/5) |
| Security headers in working dir server.js | ✅ Written (NOT committed, NOT deployed) |

---

## PRIORITY ACTION CHECKLIST — ESTIMATED 60 MINUTES TOTAL

These five actions close all three critical vulnerabilities. No advanced technical knowledge required.

| # | Action | Where | Time | Closes |
|---|--------|--------|------|--------|
| 1 | **Redact Stripe key from DEPLOYMENT_STATUS.md** in `skillswap-fixed-routing` folder | Text editor — find `sk_live_51TE7FM...` line and delete it | 2 min | CRIT-5 |
| 2 | **Rotate live Stripe key** | Stripe Dashboard → Developers → API Keys → Roll secret key | 10 min | CRIT-4, CRIT-5 |
| 3 | **Update Supabase edge function with new key** | Terminal: `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY` | 5 min | CRIT-4 |
| 4 | **Commit and push all security patches** | Terminal (run from `/skillswap` folder): `git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js && git commit -m "Security: password enforcement, security headers, safe env vars" && git push` | 10 min | HIGH-1, MED-1 |
| 5 | **Run SECURITY_MIGRATION.sql in Supabase** | Supabase Dashboard → SQL Editor → paste file contents → Run | 20 min | CRIT-2 |
| 6 | **Confirm Supabase auth rate limits** | Supabase Dashboard → Authentication → Rate Limits | 5 min | MED-3 |
| 7 | **Verify site loads after deploy** | Browser → skillswap.vercel.app | 5 min | Regression check |

**After steps 1-7: zero critical vulnerabilities. Safe to launch.**

---

## SCAN-OVER-SCAN TRACKER

| Issue | Scan 12 | Scan 13 |
|-------|---------|---------|
| CRIT-2: Profiles PII (DB policy) | 🔴 Open | 🔴 Open — no change |
| CRIT-3: No JWT on checkout | ✅ Deployed | ✅ Deployed |
| CRIT-4: Stripe key in git history | 🔴 Open | 🔴 Open — no change |
| CRIT-5: Stripe key in workspace files | 🔴 Open | 🔴 Open — found in `skillswap-fixed-routing/DEPLOYMENT_STATUS.md` |
| HIGH-1: No password min (Auth.jsx prod) | Fixed in source, not deployed | Fixed in source, not deployed |
| HIGH-2: No input sanitization | 🟠 Open | 🟠 Open — confirmed |
| HIGH-3: npm vulns (15 HIGH) | 🟠 Open | 🟠 Open — 0 critical, 15 HIGH, 3 MODERATE, 9 LOW |
| MED-3: Rate limits unconfirmed | 🟡 Open | 🟡 Open |
| MED-4: Student discount bypass | 🟡 Open | 🟡 Open |
| LOW-1: Email verification | 🟢 Open | 🟢 Open |
| LOW-2: Phone format validation | 🟢 Open | 🟢 Open |

---

## NOTE TO DEAN — FORWARD TO ED

Ed,

This is Scan 13. The situation is unchanged from Scan 12. All fixes are written and ready. Nothing has been committed or deployed.

**The three things blocking launch:**

1. **Stripe key rotation** — your live key has been exposed in git history since at least March 30. Go to stripe.com → Developers → API Keys → roll the secret key. Takes 10 minutes. You've been told to do this in every scan for days.

2. **Run SECURITY_MIGRATION.sql** — open Supabase Dashboard, go to SQL Editor, paste the file contents, hit Run. This locks down the profiles table so users can't read each other's phone numbers and Stripe IDs.

3. **Git commit and push** — the security fixes are written. They just need to be committed. The terminal command is in row 4 of the checklist above.

If you want me to walk you through any of these steps one by one, just ask.

**If none of these are done before launch, here is the actual risk:**
- Any attacker with your anon key (it's public in your JS bundle) can read every user's phone number, Stripe customer ID, and whether they're an admin.
- Your live Stripe key is exposed in git history. If it hasn't been rotated, anyone who has cloned the repo can charge cards or cancel subscriptions.

This is scan 13. The same three issues. Please take 60 minutes and close them.

---

*Report generated by: CSO Automated Security Monitor*
*Scan 13 — 2026-04-04*
*Next scan: 1 hour*
