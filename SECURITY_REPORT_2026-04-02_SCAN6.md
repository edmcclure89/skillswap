# SkillSwap Security Scan Report — Scan 6
**Date:** 2026-04-02 (Sixth automated scan — LAUNCH DAY)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + dependencies
**Framework:** OWASP Top 10
**Pre-Launch Status:** 🚨 LAUNCH BLOCKED — 4 CRITICAL issues. ALL 4 remain UNPATCHED after 6 scans.

---

## 🔴 THIS IS SCAN 6. ZERO SECURITY PATCHES HAVE BEEN APPLIED.

The 10 most recent git commits are all UI/cosmetic changes: category images, photo positioning, title text, trust badge additions. No security work has been done. **Launch is today and users are about to hit a platform with 4 confirmed critical vulnerabilities.**

**Ed: this is the 6th consecutive scan with the same result. These fixes total ~3 hours of work. The fixes are detailed below with exact line numbers. If launch proceeds without these patches, user accounts, phone numbers, and payment data are at real risk.**

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

### CRIT-1: Username Used as Password — CONFIRMED OPEN
**File:** `src/Signup.jsx`, line 56
**OWASP:** A07 — Identification and Authentication Failures

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to its publicly visible username. Zero-effort account takeover for any attacker who can read a listing card.

**Fix (30 min):** Add a real `password` field to `Signup.jsx`. Remove the `// Using username as password for now` line. Route `/signup` to the existing `Auth.jsx` component which already handles this correctly.

---

### CRIT-2: Profiles Table Exposes PII to Anyone — CONFIRMED OPEN
**File:** `SUPABASE_SCHEMA.sql` + `src/App.jsx` line 83
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);
```

The profiles table contains `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, and `agreed_at`. Every single row is readable by anyone with the anon key — which is hardcoded in the public source code. This means **all 500 launch users' phone numbers and Stripe IDs are immediately public.**

**Fix (20 min):**
- Change SELECT policy: `USING (auth.uid() = id)`
- Create a separate public view with only display-safe columns
- Update `App.jsx` line 83 to select only display columns

---

### CRIT-3: Checkout Endpoint Has No JWT Verification — CONFIRMED OPEN
**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id accepted from untrusted request body
```

Any caller can submit any `user_id` and initiate a Stripe checkout on behalf of that user. Combined with CRIT-2 (all UUIDs are public), this is a trivial privilege escalation.

**Fix (45 min):** Verify the JWT and extract `user_id` from the token, never from the request body:
```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: { user } } = await supabase.auth.getUser(
  req.headers.get('authorization')?.replace('Bearer ', '')
);
if (!user) return new Response('Unauthorized', { status: 401 });
const user_id = user.id; // never trust body
```

---

### CRIT-4: Live Stripe Secret Key in Git History — ROTATION UNCONFIRMED
**Commits:** `74580485`, `f9763677`, commit message of `7e18216d`
**OWASP:** A02 — Cryptographic Failures

The live Stripe secret key (`sk_live_51TE7FM...`) is permanently embedded in git history. The `.env` file is now empty, but the key is fully recoverable from the commit log. The commit that "removed" the key printed it in the commit message verbatim.

**Fix:** Log into Stripe Dashboard → Developers → API Keys → Roll the key immediately. Then verify no fraudulent charges or unauthorized webhook endpoints exist. This is the only item that cannot be fixed with a code change.

---

## 🟠 HIGH VULNERABILITIES — ALL STILL OPEN

**HIGH-1: No Password Minimum Length**
`Auth.jsx` accepts any password including 1-character passwords. Supabase default minimum is 6 characters but this is not enforced in the UI. Add client-side validation (12+ chars recommended) and verify Supabase Auth settings.

**HIGH-2: No Output Encoding / XSS in Listing Display**
User-submitted `offering`, `wanting`, and `bio` fields are rendered directly from the database into the DOM. React's JSX encoding provides some protection, but no explicit sanitization exists server-side or client-side. If any raw HTML rendering is ever introduced, this becomes a stored XSS vector.

**HIGH-3: 15 High-Severity Dependency Vulnerabilities**
`npm audit` confirms: 15 HIGH, 3 MODERATE, 9 LOW vulnerabilities in dependencies. Notable packages: `serialize-javascript` (RCE risk), `lodash` (prototype pollution + code injection), `nth-check` (ReDoS), `@svgr/plugin-svgo`. Run `npm audit --production` to scope actual production risk. The high-severity issues in `react-scripts` are mostly build-time, not runtime.

**HIGH-4: No Security Headers**
`server.js` serves static files with no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy` headers. Exposes users to clickjacking and MIME-sniffing attacks.

**Fix (30 min):** Add to `serveFile()` in `server.js`:
```javascript
res.writeHead(200, {
  'Content-Type': contentType,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com"
});
```

**HIGH-5: listing_views INSERT Open to Unauthenticated Abuse**
`WITH CHECK (true)` on the `listing_views` INSERT policy allows anyone — no auth needed — to flood the table. Easy denial-of-service against the database.

**Fix (15 min):** Change to `WITH CHECK (auth.uid() IS NOT NULL)`.

---

## 🟡 MEDIUM VULNERABILITIES

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js`. Should use `process.env.REACT_APP_SUPABASE_ANON_KEY`. Makes key rotation require a code change and redeploy.

**MED-2:** No CSRF protection on edge functions. Partially mitigated by JWT verification once CRIT-3 is fixed. No additional action needed after that.

**MED-3:** No explicit rate limiting on auth endpoints. Verify in Supabase Dashboard > Auth > Rate Limits. Brute-force login is possible if Supabase defaults are not configured.

**MED-4:** Student discount applied client-side. The `is_student` flag is set from `.edu` email detection in `Auth.jsx` line 15, passed via user metadata. A user can manipulate the sign-up payload to claim student pricing without a real `.edu` email. Validate server-side (edge function or Supabase trigger).

---

## 🟢 LOW VULNERABILITIES

**LOW-1:** Email verification not enforced before login. Enable in Supabase Dashboard > Auth > Email Confirmations.

**LOW-2:** Phone number accepted as free-text with no format validation or normalization.

**LOW-3:** Confirm `server.log` was never committed with sensitive data prior to `.gitignore` addition.

---

## WHAT'S WORKING (Unchanged — Keep These)

- CORS on edge functions scoped to `SITE_URL` env var
- Stripe webhook uses `constructEventAsync` with signature verification — properly secured
- RLS enabled on all tables (policies need tightening but the scaffolding is correct)
- Service role key stored only in edge function env vars — never in source code
- Path traversal prevention in `server.js` via `fullPath.startsWith(BUILD_DIR)` check
- `.gitignore` correctly excludes `.env`, `node_modules/`, `build/`, `*.log`

---

## REMEDIATION ORDER

| Priority | Issue | Est. Time |
|----------|-------|-----------|
| 🚨 0 | Stripe Dashboard: rotate live key, check for fraudulent activity | 15 min |
| 1 | `Signup.jsx` line 56 — add real password field | 30 min |
| 2 | Profiles RLS SELECT policy + `App.jsx select('*')` | 20 min |
| 3 | JWT verification in `create-checkout-session` | 45 min |
| 4 | Security headers in `server.js` / `vercel.json` | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users | 15 min |
| 6 | Enforce password minimum length in `Auth.jsx` | 30 min |
| 7 | Move anon key to `process.env` | 10 min |

**Total to clear all critical and high launch blockers: ~3 hours.**

---

## SCAN-OVER-SCAN PATCH TRACKER

| Issue | Scan 1 | Scan 2 | Scan 3 | Scan 4 | Scan 5 | Scan 6 |
|-------|--------|--------|--------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open |

**6 scans. 0 patches. All 4 critical vulnerabilities are present in the version going to users today.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 6 — 2026-04-02*
*Next scan: Scheduled hourly*
*Dean: Escalate all CRITICAL items to Ed immediately. This is the launch day scan. 500 users are being onboarded to a platform with public PII exposure and account takeover vulnerabilities.*
