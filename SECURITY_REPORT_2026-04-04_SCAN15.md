# SkillSwap Security Scan Report — Scan 15
**Date:** 2026-04-04
**Time:** Automated hourly scan
**Scanner:** CSO Automated Security Monitor
**Last Commit:** `42c0c483` — "Update skill category images" (NO NEW COMMITS since Scan 14)
**Framework:** OWASP Top 10

---

## LAUNCH RECOMMENDATION: DO NOT LAUNCH

Three critical vulnerabilities remain open. Zero commits since Scan 14. Zero fixes applied. This is now 15 consecutive scans with the same three criticals unresolved.

---

## EXECUTIVE SUMMARY

| Severity | Count | Change from Scan 14 |
|----------|-------|---------------------|
| CRITICAL | 3 | No change |
| HIGH | 3 | No change |
| MEDIUM | 2 | No change |
| LOW | 2 | No change |

**npm audit:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW (unchanged)

**Status of all prior fixes:** Written in working directory. Not committed. Not deployed. Database migration not run. Stripe key not rotated.

---

## GIT STATUS — STILL FROZEN

Last commit: `42c0c483` — unchanged across 15 scans.

| File | Fix Written | Committed | Deployed |
|------|-------------|-----------|----------|
| `src/Signup.jsx` | Yes | No | No |
| `src/App.jsx` | Yes | No | No |
| `src/Auth.jsx` | Yes | No | No |
| `server.js` | Yes | No | No |
| `src/supabaseClient.js` | Yes | No | No |
| `SECURITY_MIGRATION.sql` | Yes | Not applied | Not applied |

---

## CRITICAL VULNERABILITIES

---

### CRIT-2: Profiles Table PII Exposure — Database Migration Not Applied
**OWASP:** A01 — Broken Access Control
**Status:** OPEN — no change since Scan 5

The live Supabase database still has the "Anyone can view profiles" SELECT policy with no column restrictions. The anon key is compiled into the production JS bundle, meaning anyone can query the API directly and read every user's:
- Phone number
- Stripe customer ID
- Stripe subscription ID
- Admin flag (`is_admin`)
- Student flag (`is_student`)

`SECURITY_MIGRATION.sql` is ready and has never been run. Fix takes 20 minutes.

**Fix:**
1. Supabase Dashboard → SQL Editor → New Query
2. Paste contents of `SECURITY_MIGRATION.sql`
3. Click Run

---

### CRIT-4: Live Stripe Secret Key in Git History — Rotation Still Unconfirmed
**OWASP:** A02 — Cryptographic Failures
**Status:** OPEN — unconfirmed rotation across 15 scans

Key `sk_live_51TE7FM...` is permanently embedded in git commits `74580485`, `f9763677`, and commit message `7e18216d`. Anyone who has cloned this repo has full access to the key. No rotation confirmed in any scan.

**Fix (15 minutes):**
1. Stripe Dashboard → Developers → API Keys → Roll the live secret key
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY`
3. Check Stripe Events log for unauthorized API calls since 2026-03-30

---

### CRIT-5: Full Live Stripe Secret Key in Plaintext Workspace Files
**OWASP:** A02 — Cryptographic Failures
**Status:** OPEN — confirmed again this scan

The complete key `sk_live_51TE7FME5T5lhlnV1...` is still present in plaintext in multiple files in the App folder. This scan confirms it is still there, still unredacted, in at least:

- `App/SKILLSWAP_TEAM_CREDENTIALS.txt` — full key in plaintext
- `App/SKILLSWAP_URGENT_STATUS.md`
- `App/CSO_SECURITY_REPORT_2026-04-01.md`
- `App/STRIPE_SECURITY_FIX.md`
- `App/VERCEL_ENV_SETUP.md`
- `App/skillswap-fixed-routing/` — multiple files in this subfolder

If the App folder syncs to iCloud, Dropbox, or Google Drive, the key is accessible externally right now.

**Fix (5 minutes):**
1. Open `App/SKILLSWAP_TEAM_CREDENTIALS.txt` — delete the line starting with `sk_live_`
2. Do the same for `App/SKILLSWAP_URGENT_STATUS.md`
3. Rotate the Stripe key (same action as CRIT-4 — one rotation closes both)

---

## HIGH VULNERABILITIES — UNCHANGED

### HIGH-1: No Password Strength Enforcement in Production Auth.jsx
**File:** `src/Auth.jsx`
**OWASP:** A07 — Authentication Failures
**Status:** Fixed in working directory. NOT committed. NOT deployed.

The Auth.jsx login/signup form still accepts any password length in production. Signup.jsx enforces 12 characters but is also undeployed.

### HIGH-2: No Input Length Limits or Sanitization on Skill Listings
**File:** `src/PostSkill.jsx`
**OWASP:** A03 — Injection / A05 — Security Misconfiguration
**Status:** OPEN — no change

No `maxLength` attributes on any input field in PostSkill. No sanitization before database insert. A bad actor can submit arbitrarily large strings.

**Fix (30 minutes):** Add `maxLength={300}` to offering/wanting inputs, `maxLength={500}` to bio textarea.

### HIGH-3: 27 Dependency Vulnerabilities (15 HIGH)
**File:** `package.json` — root cause: `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components
**Status:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW — confirmed unchanged by npm audit this scan

---

## MEDIUM VULNERABILITIES — UNCHANGED

**MED-3:** Supabase auth rate limits — not confirmed active. Fix: Supabase Dashboard → Authentication → Rate Limits → Set to 5 attempts / 15 minutes.

**MED-4:** Student discount validated client-side only. `.edu` check is frontend-only. Any user can claim student pricing by modifying signup payload.

---

## LOW VULNERABILITIES — UNCHANGED

**LOW-1:** Email verification enforcement not confirmed active in Supabase Dashboard.

**LOW-2:** Phone number field accepts free-text with no format validation.

---

## CONFIRMED SECURE — NO CHANGE

| Item | Status |
|------|--------|
| CRIT-3: JWT auth on checkout endpoint | Deployed |
| CORS: scoped to SITE_URL env var | Correct |
| Stripe webhook: `constructEventAsync` + signature | Secure |
| RLS enabled on all tables | Yes (SELECT policy too broad — CRIT-2) |
| Service role key: edge functions only | Correct |
| Path traversal guard in server.js | Correct |
| `.gitignore`: excludes .env, node_modules, build | Correct |
| STRIPE_SECRET_KEY in .env file | Blank (key is in git history and workspace — CRIT-4/5) |
| CSP, X-Frame-Options, nosniff headers | Written in server.js — NOT committed, NOT deployed |

---

## PRIORITY ACTION CHECKLIST

These steps are unchanged from Scan 14. None of them have been done. They take 60 minutes total.

| # | Action | Where | Time | Closes |
|---|--------|--------|------|--------|
| 1 | Delete sk_live key from `App/SKILLSWAP_TEAM_CREDENTIALS.txt` | Text editor — delete the `sk_live_` line | 2 min | CRIT-5 |
| 2 | Delete sk_live key from `App/SKILLSWAP_URGENT_STATUS.md` | Text editor — same | 2 min | CRIT-5 |
| 3 | Rotate live Stripe key | stripe.com → Developers → API Keys → Roll secret key | 10 min | CRIT-4, CRIT-5 |
| 4 | Update Supabase edge function with new key | `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY` | 5 min | CRIT-4 |
| 5 | Commit and push all security patches | From `/skillswap`: `git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js && git commit -m "Security fixes" && git push` | 10 min | HIGH-1 |
| 6 | Run SECURITY_MIGRATION.sql in Supabase | Supabase Dashboard → SQL Editor → paste file → Run | 20 min | CRIT-2 |
| 7 | Confirm Supabase auth rate limits | Supabase Dashboard → Authentication → Rate Limits | 5 min | MED-3 |
| 8 | Verify site loads after deploy | Browser → skillswap.vercel.app | 5 min | Regression check |

---

## SCAN-OVER-SCAN TRACKER

| Issue | Scan 14 | Scan 15 |
|-------|---------|---------|
| CRIT-2: Profiles PII (DB policy) | OPEN | OPEN — no change |
| CRIT-3: No JWT on checkout | Deployed | Deployed |
| CRIT-4: Stripe key in git history | OPEN | OPEN — no change |
| CRIT-5: Stripe key in workspace files | OPEN | OPEN — still in SKILLSWAP_TEAM_CREDENTIALS.txt and 5+ other files |
| HIGH-1: No password min (Auth.jsx prod) | Fixed in source, not deployed | Fixed in source, not deployed |
| HIGH-2: No input sanitization | OPEN | OPEN |
| HIGH-3: npm vulns (15 HIGH) | OPEN | OPEN — confirmed 0 critical, 15 HIGH, 3 MODERATE, 9 LOW |
| MED-3: Rate limits unconfirmed | OPEN | OPEN |
| MED-4: Student discount bypass | OPEN | OPEN |
| LOW-1: Email verification | OPEN | OPEN |
| LOW-2: Phone format validation | OPEN | OPEN |

---

## NOTE TO ED — DIRECT FROM CSO

Ed,

This is Scan 15. This is the 15th consecutive scan with zero commits and zero fixes applied.

Launch was supposed to be Friday. It's now Saturday. The three criticals that have been blocking launch for days are still open.

Here is what still needs to happen before any user touches this platform:

**Step 1 — Rotate the Stripe key. Do this first.**
Go to stripe.com, log in, click Developers → API Keys → Roll the secret key. This takes 10 minutes. Without this, a live payment key that has been in git history for days is still active and usable by anyone who has seen it.

**Step 2 — Run the database migration.**
Open Supabase Dashboard, go to SQL Editor, open the file `SECURITY_MIGRATION.sql`, paste the contents, click Run. This stops every user's phone number and Stripe ID from being publicly readable via the API.

**Step 3 — Commit and push the security patches.**
Open a terminal in the `/skillswap` folder and run:
```
git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js
git commit -m "Security: password enforcement, security headers, safe env vars"
git push
```

These three steps clear all critical vulnerabilities. Nothing should go live before they are done.

If you need me to walk through any of these steps one at a time, I can do that right now.

---

*Report generated by: CSO Automated Security Monitor*
*Scan 15 — 2026-04-04*
*Next scan: 1 hour*
