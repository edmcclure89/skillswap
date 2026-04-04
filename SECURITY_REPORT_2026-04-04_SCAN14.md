# SkillSwap Security Scan Report — Scan 14
**Date:** 2026-04-04
**Time:** Automated hourly scan
**Scanner:** CSO Automated Security Monitor
**Last Commit:** `42c0c483` — "Update skill category images" (NO NEW COMMITS since Scan 13)
**Framework:** OWASP Top 10

---

## LAUNCH RECOMMENDATION: DO NOT LAUNCH

Three critical vulnerabilities remain open. Zero commits since Scan 13. Zero fixes applied.

---

## EXECUTIVE SUMMARY

| Severity | Count | Change from Scan 13 |
|----------|-------|---------------------|
| CRITICAL | 3 | No change |
| HIGH | 3 | No change |
| MEDIUM | 2 | No change |
| LOW | 2 | No change |

**npm audit:** 0 critical, 15 HIGH, 3 MODERATE, 9 LOW (unchanged)

**New finding this scan:** Full Stripe live secret key found in plaintext in `App/SKILLSWAP_TEAM_CREDENTIALS.txt`. Previous scans flagged partial exposure. This scan confirms the complete key string is sitting in a local file in the App workspace folder. If that folder syncs to cloud storage (iCloud, Dropbox, Google Drive, OneDrive), the key is fully exposed externally.

---

## GIT STATUS — STILL UNCHANGED

Last commit: `42c0c483` — unchanged across 14 scans.

All security fixes written in working directory. None committed. None deployed.

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

The live Supabase database still has the `"Anyone can view profiles"` SELECT policy with no column restrictions. The anon key is compiled into the production JS bundle (this is expected and unavoidable with Supabase), which means anyone can call the API directly and read every user's:
- Phone number
- Stripe customer ID
- Stripe subscription ID
- Admin flag (`is_admin`)
- Student flag (`is_student`)

`SECURITY_MIGRATION.sql` is ready. It has never been run.

**Fix (20 minutes):**
1. Supabase Dashboard → SQL Editor → New Query
2. Paste contents of `SECURITY_MIGRATION.sql`
3. Click Run
4. No code commit needed — this is database-side only

---

### CRIT-4: Live Stripe Secret Key in Git History — Rotation Unconfirmed
**OWASP:** A02 — Cryptographic Failures
**Status:** OPEN — no confirmed rotation across 14 scans

Key `sk_live_51TE7FM...` is permanently embedded in git commits `74580485`, `f9763677`, and commit message `7e18216d`. Anyone who has cloned this repo has access to the key. No rotation confirmed in any scan.

**Fix (15 minutes):**
1. Stripe Dashboard → Developers → API Keys → Roll the live secret key
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY`
3. Check Stripe Events log for unauthorized API calls since 2026-03-30

---

### CRIT-5: Full Live Stripe Secret Key in Plaintext Workspace Files
**OWASP:** A02 — Cryptographic Failures
**Status:** OPEN — upgraded severity this scan

**New finding this scan:** The complete key `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` is present in full in:

- `App/SKILLSWAP_TEAM_CREDENTIALS.txt` — **full key in plaintext**
- `App/SKILLSWAP_URGENT_STATUS.md`
- `App/CSO_SECURITY_REPORT_2026-04-01.md`
- `App/STRIPE_SECURITY_FIX.md`
- `App/VERCEL_ENV_SETUP.md`
- `skillswap/DEAN_URGENT_STATUS.md` (in git history, multiple commits)

Previous scans flagged partial key exposure. This scan confirms the full key string is accessible in at least 5 workspace files. If the App folder is synced to any cloud service, the key is externally accessible right now.

**Fix (5 minutes):**
1. Open `App/SKILLSWAP_TEAM_CREDENTIALS.txt` and delete or redact the `sk_live_` line
2. Do the same for `App/SKILLSWAP_URGENT_STATUS.md`
3. Rotate the Stripe key (same action as CRIT-4 — one rotation closes both)
4. Confirm the App folder is NOT synced to iCloud/Dropbox/Google Drive

---

## HIGH VULNERABILITIES — UNCHANGED

---

### HIGH-1: No Password Strength Enforcement in Production Auth.jsx
**File:** `src/Auth.jsx`
**OWASP:** A07 — Authentication Failures
**Status:** Fixed in working directory, NOT committed or deployed

Users can create accounts with single-character passwords via the Auth.jsx flow. Signup.jsx enforces 12 characters but is also not deployed.

---

### HIGH-2: No Input Length Limits or Sanitization on Skill Listings
**File:** `src/PostSkill.jsx`
**OWASP:** A03 — Injection / A05 — Security Misconfiguration
**Status:** OPEN

No `maxLength` attributes on any input field. No `DOMPurify` or sanitization before database insert. Database-level CHECK constraints provide a backstop, but no client-side protection exists.

**Fix (30 minutes):** Add `maxLength={300}` to offering and wanting inputs, `maxLength={500}` to bio textarea.

---

### HIGH-3: 27 Dependency Vulnerabilities (15 HIGH)
**File:** `package.json` — root cause: `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components
**Status:** Unchanged — 0 critical, 15 HIGH, 3 MODERATE, 9 LOW

Build toolchain is the primary surface. Runtime risk is limited to compiled output, but dev environment is exposed.

---

## MEDIUM VULNERABILITIES — UNCHANGED

### MED-3: Supabase Auth Rate Limits — Not Confirmed Active
**Status:** Unverified across all 14 scans
**Fix (5 minutes):** Supabase Dashboard → Authentication → Rate Limits → Set max to 5 attempts / 15 minutes

### MED-4: Student Discount Validated Client-Side Only
**Status:** OPEN
`.edu` email check is frontend-only. Any user can claim student pricing without a .edu address by modifying the signup payload.

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
| Security headers in working dir server.js | Written (NOT committed, NOT deployed) |

---

## PRIORITY ACTION CHECKLIST — 60 MINUTES TO CLEAR ALL CRITICALS

| # | Action | Where | Time | Closes |
|---|--------|--------|------|--------|
| 1 | Delete sk_live key from `App/SKILLSWAP_TEAM_CREDENTIALS.txt` | Text editor — delete the line starting with `sk_live_` | 2 min | CRIT-5 |
| 2 | Delete sk_live key from `App/SKILLSWAP_URGENT_STATUS.md` | Text editor — same | 2 min | CRIT-5 |
| 3 | Rotate live Stripe key | Stripe Dashboard → Developers → API Keys → Roll secret key | 10 min | CRIT-4, CRIT-5 |
| 4 | Update Supabase edge function with new key | Terminal: `supabase secrets set STRIPE_SECRET_KEY=sk_live_NEWKEY` | 5 min | CRIT-4 |
| 5 | Commit and push all security patches | Terminal (from `/skillswap`): `git add src/Signup.jsx src/App.jsx src/Auth.jsx server.js src/supabaseClient.js && git commit -m "Security: password enforcement, security headers, safe env vars" && git push` | 10 min | HIGH-1 |
| 6 | Run SECURITY_MIGRATION.sql in Supabase | Supabase Dashboard → SQL Editor → paste file → Run | 20 min | CRIT-2 |
| 7 | Confirm Supabase auth rate limits | Supabase Dashboard → Authentication → Rate Limits | 5 min | MED-3 |
| 8 | Verify site loads after deploy | Browser → skillswap.vercel.app | 5 min | Regression check |

**After steps 1-8: zero critical vulnerabilities. Safe to launch.**

---

## SCAN-OVER-SCAN TRACKER

| Issue | Scan 13 | Scan 14 |
|-------|---------|---------|
| CRIT-2: Profiles PII (DB policy) | OPEN | OPEN — no change |
| CRIT-3: No JWT on checkout | Deployed | Deployed |
| CRIT-4: Stripe key in git history | OPEN | OPEN — no change |
| CRIT-5: Stripe key in workspace files | OPEN | OPEN — full key found in SKILLSWAP_TEAM_CREDENTIALS.txt |
| HIGH-1: No password min (Auth.jsx prod) | Fixed in source, not deployed | Fixed in source, not deployed |
| HIGH-2: No input sanitization | OPEN | OPEN |
| HIGH-3: npm vulns (15 HIGH) | OPEN | OPEN — 0 critical, 15 HIGH, 3 MODERATE, 9 LOW |
| MED-3: Rate limits unconfirmed | OPEN | OPEN |
| MED-4: Student discount bypass | OPEN | OPEN |
| LOW-1: Email verification | OPEN | OPEN |
| LOW-2: Phone format validation | OPEN | OPEN |

---

## NOTE TO DEAN — FORWARD TO ED IMMEDIATELY

Ed,

This is Scan 14. Still no commits. Still no fixes applied.

I want to flag something new this scan. The **full** Stripe live secret key is sitting in plaintext in a file called `SKILLSWAP_TEAM_CREDENTIALS.txt` in your App folder. Not a partial key. The entire string. If that folder syncs to iCloud, Dropbox, or Google Drive, the key is accessible to anyone who can access your cloud storage.

The three things still blocking launch are the same as they've been for days:

1. **Rotate the Stripe key.** Go to stripe.com → Developers → API Keys → roll the secret key. 10 minutes. This is the most important action. Do it before anything else.

2. **Run SECURITY_MIGRATION.sql.** Open Supabase Dashboard, SQL Editor, paste the file, click Run. This stops every user's phone number and Stripe ID from being publicly readable.

3. **Git commit and push.** The security fixes are written and ready. The terminal command is in row 5 of the checklist above.

This is now 14 consecutive scans with the same three critical issues open. Launch Friday is tomorrow. If the Stripe key has not been rotated and the database migration has not been run, do not launch.

If you need me to walk through any of these steps one at a time, I can do that.

---

*Report generated by: CSO Automated Security Monitor*
*Scan 14 — 2026-04-04*
*Next scan: 1 hour*
