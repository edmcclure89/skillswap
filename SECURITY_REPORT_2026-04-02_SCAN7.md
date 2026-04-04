# SkillSwap Security Scan Report — Scan 7
**Date:** 2026-04-02 (Seventh automated scan — POST-LAUNCH DAY)
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions + dependencies
**Framework:** OWASP Top 10

---

## 🚨 LAUNCH BLOCKED — 4 CRITICAL VULNERABILITIES. 7 SCANS. ZERO PATCHES.

This is Scan 7. Every commit since Scan 1 has been a UI or cosmetic change. No security work has been done. The 10 most recent commits: category image swaps, photo positioning, title text, trust badge additions, hero section redesign. None touch Auth.jsx, Signup.jsx, supabaseClient.js, SUPABASE_SCHEMA.sql, or create-checkout-session.

**If SkillSwap has launched or is launching today, 500 users are being onboarded to a platform with confirmed public PII exposure and trivial account takeover vulnerabilities. This is not a theoretical risk.**

---

## EXECUTIVE SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 4 | ALL OPEN — unchanged since Scan 1 |
| 🟠 HIGH | 5 | ALL OPEN — unchanged since Scan 1 |
| 🟡 MEDIUM | 4 | ALL OPEN |
| 🟢 LOW | 3 | ALL OPEN |

---

## 🔴 CRITICAL VULNERABILITIES — CONFIRMED OPEN IN SCAN 7

---

### CRIT-1: Username Used as Password
**File:** `src/Signup.jsx`, line 56
**OWASP:** A07 — Identification and Authentication Failures
**Status:** OPEN (Confirmed. Code unchanged.)

```javascript
password: formData.username, // Using username as password for now
```

Every account created via `/signup` has a password equal to their publicly visible username. Any attacker who can read a user's listing card can take over their account in seconds. All historical accounts created through this flow are permanently compromised until those users change their passwords.

**Fix (30 min):** Add a `password` field to `Signup.jsx`. Remove the `// Using username as password for now` line. The existing `Auth.jsx` component already handles this correctly — consider routing `/signup` to it instead.

---

### CRIT-2: Profiles Table Exposes PII to Anyone
**File:** `SUPABASE_SCHEMA.sql` line 32 + `src/App.jsx` line 83
**OWASP:** A01 — Broken Access Control
**Status:** OPEN (Confirmed. Schema and code unchanged.)

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);
```

The `profiles` table contains: `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at`. The Supabase anon key is hardcoded in public source code (`supabaseClient.js` line 4). Anyone with a browser can query every user's phone number and Stripe IDs with a single API call. All 500 launch users' PII is immediately public.

**Fix (20 min):**
- Change SELECT policy: `USING (auth.uid() = id)`
- Create a public view with only display-safe columns (`id`, `full_name`, `primary_skill`, `bio`)
- Update `App.jsx` line 83 to select only display columns

---

### CRIT-3: Checkout Endpoint Accepts Untrusted user_id
**File:** `supabase/functions/create-checkout-session/index.ts`, line 18
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures
**Status:** OPEN (Confirmed. Code unchanged.)

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id accepted from untrusted request body
```

The endpoint trusts `user_id` from the POST body. Any caller can supply any `user_id` and initiate a Stripe checkout session on behalf of another user. Combined with CRIT-2 (all user UUIDs are public), this is a trivial privilege escalation. An attacker can purchase a subscription and associate it with a victim's account — or manipulate their subscription tier via the webhook flow.

**Fix (45 min):** Verify JWT from `Authorization` header. Extract `user_id` from the verified token, never from the request body:
```typescript
const authHeader = req.headers.get('authorization');
const { data: { user }, error } = await supabaseClient.auth.getUser(
  authHeader?.replace('Bearer ', '')
);
if (!user || error) return new Response('Unauthorized', { status: 401 });
const user_id = user.id; // never trust the body
```

---

### CRIT-4: Live Stripe Secret Key Permanently in Git History
**Commits:** `74580485`, `f9763677`, and verbatim in commit message `7e18216d`
**OWASP:** A02 — Cryptographic Failures
**Status:** UNCONFIRMED ROTATION — Key is recoverable from git log. `.env` is now empty but the key is still in history.

The live key `sk_live_51TE7FM...` is permanently retrievable from the commit log. Commit `7e18216d`'s message printed the full key verbatim. Anyone who has ever cloned this repo has had access to it. If this key has not been rotated in Stripe Dashboard, it must be rotated immediately. This is the only issue that cannot be resolved with a code change alone.

**Required action:** Log into Stripe Dashboard → Developers → API Keys → Roll the key. Then audit for unauthorized charges, new webhook endpoints, and unauthorized API access since the first commit containing the key.

---

## 🟠 HIGH VULNERABILITIES — ALL STILL OPEN

**HIGH-1: No Password Minimum Length**
`Auth.jsx` accepts any password length. Supabase default is 6 characters minimum but this is not enforced in the UI. Brute-force and credential stuffing risk is elevated. Recommended: 12+ character minimum with client-side enforcement.

**HIGH-2: No Output Encoding / Potential Stored XSS**
User-submitted `offering`, `wanting`, and `bio` fields are rendered directly from the database into the DOM. React JSX encoding provides baseline protection but no explicit server-side sanitization exists. Any future introduction of `dangerouslySetInnerHTML` or raw HTML rendering would immediately expose stored XSS.

**HIGH-3: 15 High-Severity Dependency Vulnerabilities**
`npm audit` confirms: **15 HIGH**, 3 MODERATE, 9 LOW vulnerabilities. Notable packages:
- `lodash` — prototype pollution + code injection
- `nth-check` — ReDoS
- `@svgr/plugin-svgo` — SVG parsing vulnerabilities
- `bfj` — JSON parsing vulnerabilities
- `jsonpath` — code injection risk
Most are in `react-scripts` build toolchain (not production runtime), but `lodash` and `jsonpath` carry runtime risk. Run `npm audit --production` to scope actual production exposure.

**HIGH-4: No Security Headers**
`server.js` serves all static files with no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy` headers. Exposes users to clickjacking and MIME-sniffing attacks.

**Fix (30 min):** Add to `serveFile()` in `server.js`:
```javascript
res.writeHead(200, {
  'Content-Type': contentType,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.stripe.com"
});
```

**HIGH-5: listing_views INSERT Open to Unauthenticated Abuse**
```sql
CREATE POLICY "Anyone can insert a view" ON listing_views FOR INSERT WITH CHECK (true);
```
Unauthenticated requests can flood the `listing_views` table. Easy denial-of-service against the Supabase database. Fix: `WITH CHECK (auth.uid() IS NOT NULL)`.

---

## 🟡 MEDIUM VULNERABILITIES

**MED-1:** Supabase anon key hardcoded in `src/supabaseClient.js` line 4. Should use `process.env.REACT_APP_SUPABASE_ANON_KEY`. Makes key rotation require a code deploy. The `.env.example` file already has the correct pattern — the app just isn't using it.

**MED-2:** No CSRF protection on edge functions. Partially mitigated by JWT verification once CRIT-3 is fixed.

**MED-3:** No explicit rate limiting on auth endpoints. Verify Supabase Dashboard → Auth → Rate Limits. Brute-force login is possible if defaults haven't been tightened.

**MED-4:** Student discount validated client-side only. The `is_student` flag is set from `.edu` email detection in `Auth.jsx` line 15, passed via user metadata. A user can manipulate the signup payload to claim student pricing. Validate server-side via a Supabase trigger or edge function.

---

## 🟢 LOW VULNERABILITIES

**LOW-1:** Email verification not enforced before login. Enable in Supabase Dashboard → Auth → Email Confirmations.

**LOW-2:** Phone number accepted as free-text with no format validation or normalization.

**LOW-3:** Confirm `server.log` was never committed with sensitive data prior to `.gitignore` addition.

---

## WHAT'S WORKING — UNCHANGED, KEEP THESE

- CORS on edge functions scoped to `SITE_URL` env var
- Stripe webhook uses `constructEventAsync` with signature verification — correctly secured
- RLS enabled on all tables (policies need tightening, but scaffolding is correct)
- Service role key stored only in edge function env vars — never in source code
- Path traversal prevention in `server.js` via `fullPath.startsWith(BUILD_DIR)` check
- `.gitignore` correctly excludes `.env`, `node_modules/`, `build/`, `*.log`

---

## REMEDIATION ORDER

| Priority | Issue | Est. Time |
|----------|-------|-----------|
| 🚨 0 | Stripe Dashboard: rotate live key, audit for fraud | 15 min |
| 1 | `Signup.jsx` line 56 — add real password field | 30 min |
| 2 | Profiles RLS SELECT policy + `App.jsx` `select('*')` | 20 min |
| 3 | JWT verification in `create-checkout-session` | 45 min |
| 4 | Security headers in `server.js` or `vercel.json` | 30 min |
| 5 | Restrict `listing_views` INSERT to authenticated users | 15 min |
| 6 | Enforce password minimum length in `Auth.jsx` | 30 min |
| 7 | Move anon key to `process.env.REACT_APP_SUPABASE_ANON_KEY` | 10 min |

**Total to clear all critical and high blockers: ~3 hours.**

---

## SCAN-OVER-SCAN PATCH TRACKER

| Issue | Scan 1 | Scan 2 | Scan 3 | Scan 4 | Scan 5 | Scan 6 | Scan 7 |
|-------|--------|--------|--------|--------|--------|--------|--------|
| CRIT-1: Username=Password | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-2: Profiles PII public | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-3: No JWT on checkout | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| CRIT-4: Stripe key in git | — | 🔴 Found | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open | 🔴 Open |
| HIGH-1 through HIGH-5 | 🟠 Found | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open | 🟠 Open |

**7 scans. 0 patches. All 4 critical vulnerabilities are present in the version users are hitting today.**

---

*Report generated by: CSO Automated Security Monitor*
*Scan 7 — 2026-04-02*
*Next scan: Scheduled hourly*
*Dean: Escalate all CRITICAL items to Ed immediately. This is Scan 7 on launch day. 500 users are being onboarded. CRIT-2 means their phone numbers and Stripe IDs are publicly readable right now. CRIT-1 means any account created via /signup can be taken over by anyone who reads their listing card.*
