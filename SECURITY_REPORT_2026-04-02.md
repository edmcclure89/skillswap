# SkillSwap Security Scan Report
**Date:** 2026-04-02
**Scanner:** CSO Automated Security Monitor
**Scope:** Full codebase + schema + edge functions
**Framework:** OWASP Top 10
**Pre-Launch Status:** LAUNCH BLOCKED — 3 CRITICAL issues require immediate fix

---

## EXECUTIVE SUMMARY

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 5 |
| 🟡 MEDIUM | 4 |
| 🟢 LOW | 3 |

**Do not launch to 500 users until the 3 CRITICAL items are resolved.**

---

## 🔴 CRITICAL VULNERABILITIES

---

### CRIT-1: Username Used as Password in Signup.jsx

**File:** `src/Signup.jsx`, line ~50
**OWASP:** A07 — Identification and Authentication Failures

**What it is:**
The `Signup.jsx` component sets the user's password equal to their username at account creation time:

```javascript
password: formData.username, // Using username as password for now
```

This means every user's password is their publicly visible username. Any attacker who knows a username can log in as that user immediately.

**Risk:**
- Full account takeover for 100% of accounts created through this flow
- Username is likely shown publicly on listings (user_name field in listings table)
- This affects real users if `Signup.jsx` is reachable in the current app routing

**Remediation (30 min):**
Add a proper password field to `Signup.jsx` and remove the `username-as-password` shortcut. Use `Auth.jsx` pattern which has a dedicated password field. Verify neither component is duplicating the other in routing — if `Signup.jsx` is unreachable/deprecated, remove it entirely to eliminate the risk.

**Estimated fix time:** 30 minutes
**Priority:** Fix before ANY deployment.

---

### CRIT-2: Sensitive PII Publicly Readable — Profiles Table RLS

**File:** `SUPABASE_SCHEMA.sql`, profiles RLS policy
**OWASP:** A01 — Broken Access Control

**What it is:**
The RLS policy on the `profiles` table allows any anonymous user to SELECT all rows:

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);
```

The `profiles` table contains: `phone`, `stripe_customer_id`, `stripe_subscription_id`, `is_admin`, `subscription_tier`, `agreed_at`.

Since the Supabase anon key is bundled in the frontend (`supabaseClient.js`), any person on the internet can run:

```javascript
supabase.from('profiles').select('*')
```

...and receive every user's phone number, Stripe IDs, and admin status.

**Risk:**
- All 500 launch users' phone numbers scraped in seconds
- Stripe customer/subscription IDs exposed (enables billing manipulation)
- `is_admin` flag exposed — attackers can enumerate admin accounts
- GDPR/CCPA liability for PII exposure

**Remediation (15 min):**
Replace the permissive SELECT policy with a scoped one:

```sql
-- Drop the existing overly-broad policy
DROP POLICY "Anyone can view profiles" ON profiles;

-- Users can only see their own full profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Public can see a limited view (for listings display)
-- Only expose: id, full_name — nothing sensitive
-- Implement this as a separate view or handle in-app
```

**Estimated fix time:** 15 minutes
**Priority:** Fix before launch.

---

### CRIT-3: Unauthenticated IDOR on Checkout Session Endpoint

**File:** `supabase/functions/create-checkout-session/index.ts`
**OWASP:** A01 — Broken Access Control / A07 — Authentication Failures

**What it is:**
The `create-checkout-session` edge function accepts `user_id` from the request body without validating the caller's JWT. There is no server-side check that the person calling the function is actually the `user_id` they provide.

```typescript
const { price_id, user_id, user_email, plan_name } = await req.json();
// No JWT verification — user_id comes from untrusted input
```

An attacker can pass any other user's UUID and create a Stripe checkout session on their behalf. Combined with CRIT-2 (profile data including UUIDs is publicly readable), this creates a viable exploit chain.

**Risk:**
- Any user can create billing records linked to another user's account
- Subscription tier manipulation (could force subscription assignments via webhook)
- Stripe fraud potential at scale

**Remediation (45 min):**
Validate the JWT inside the edge function and extract the user ID server-side:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Extract and verify the caller's JWT
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response("Unauthorized", { status: 401 });
}

const supabaseUser = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
if (authError || !user) {
  return new Response("Unauthorized", { status: 401 });
}

// Use user.id from JWT — not from request body
const { price_id, plan_name } = await req.json();
const user_id = user.id;
const user_email = user.email;
```

**Estimated fix time:** 45 minutes
**Priority:** Fix before launch.

---

## 🟠 HIGH VULNERABILITIES

---

### HIGH-1: Phone Numbers Stored in Plaintext

**File:** `SUPABASE_SCHEMA.sql` + `src/Auth.jsx`
**OWASP:** A02 — Cryptographic Failures

Phone numbers are collected at signup and stored as plaintext `TEXT` in the `profiles` table. This compounds CRIT-2 — if the data is ever breached or inadvertently exposed, phone numbers are immediately readable.

**Remediation:** Encrypt phone numbers at the application layer before insert, or use Supabase Vault for sensitive fields. At minimum, fix CRIT-2 to restrict access.
**Estimated fix time:** 2–4 hours (encryption approach)

---

### HIGH-2: No Password Strength Enforcement

**File:** `src/Auth.jsx`
**OWASP:** A07 — Identification and Authentication Failures

The signup form accepts any string as a password with no minimum length, complexity, or breach-check. Supabase has a minimum password length setting — confirm it is set to at least 8 characters in Auth settings. Frontend validation should reinforce this.

**Remediation:** Add frontend validation (min 8 chars, at least 1 number or symbol). Enable Supabase Auth minimum password length in Dashboard > Authentication > Policies.
**Estimated fix time:** 30 minutes

---

### HIGH-3: 15 High-Severity Dependency Vulnerabilities in react-scripts

**File:** `package.json` — `react-scripts@5.0.1`
**OWASP:** A06 — Vulnerable and Outdated Components

`npm audit` returned 27 total vulnerabilities: 15 HIGH, 3 MODERATE, 9 LOW. All HIGH findings trace back to `react-scripts@5.0.1` being pinned and internally bundling outdated packages (svgo, nth-check, serialize-javascript, lodash, workbox).

Most of these are build-time only and do NOT affect runtime production. However, `serialize-javascript` and `lodash` may be bundled into the production build and could expose XSS risk.

**Remediation:**
- Evaluate migration to Vite (recommended) or CRACO which resolves these chain issues
- Short-term: run `npm audit --production` to isolate runtime-only risks
- Pin lodash to 4.17.21+
**Estimated fix time:** 4–8 hours (Vite migration) or 1 hour (targeted patches)

---

### HIGH-4: Missing Security Headers on Static Server

**File:** `server.js`
**OWASP:** A05 — Security Misconfiguration

The Node.js static server (`server.js`) does not set any security headers. Missing:
- `Content-Security-Policy`
- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Referrer-Policy`

**Remediation:** Add security headers to all responses in `server.js`:

```javascript
res.writeHead(200, {
  'Content-Type': contentType,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.stripe.com"
});
```

**Estimated fix time:** 30 minutes

---

### HIGH-5: `listing_views` INSERT Open to Abuse

**File:** `SUPABASE_SCHEMA.sql`
**OWASP:** A01 — Broken Access Control

```sql
CREATE POLICY "Anyone can insert a view"
  ON listing_views FOR INSERT
  WITH CHECK (true);
```

Unauthenticated users can flood the `listing_views` table with arbitrary records — inflating view counts and consuming database resources. No rate limiting or viewer deduplication exists.

**Remediation:** Restrict INSERT to authenticated users only (`auth.uid() IS NOT NULL`), or implement a server-side view counting function with deduplication logic.
**Estimated fix time:** 15 minutes

---

## 🟡 MEDIUM VULNERABILITIES

---

### MED-1: Supabase Anon Key Hardcoded in Source

**File:** `src/supabaseClient.js`
**OWASP:** A02 — Cryptographic Failures

The Supabase URL and anon key are hardcoded as constants rather than read from environment variables:

```javascript
const SUPABASE_URL = 'https://dvabymxhcefstjpzvznw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGci...'
```

The anon key is by design public-safe for client apps, but hardcoding it in source means it will be committed to git history permanently and cannot be rotated without a code change. It also bypasses the `.env.example` pattern already set up for this purpose.

**Remediation:** Move to `process.env.REACT_APP_SUPABASE_URL` and `process.env.REACT_APP_SUPABASE_ANON_KEY` following the pattern already documented in `.env.example`.
**Estimated fix time:** 10 minutes

---

### MED-2: No CSRF Protection on Edge Functions

**File:** `supabase/functions/create-checkout-session/index.ts`
**OWASP:** A01 — Broken Access Control

CORS is restricted to `ALLOWED_ORIGIN`, which is good. But the OPTIONS preflight allows `authorization, x-client-info, apikey, content-type`. Once CRIT-3 is fixed with JWT validation, CSRF risk drops significantly — but it's worth confirming the Supabase JWT validation approach also rejects cross-origin tokens.

**Remediation:** After fixing CRIT-3, verify server-side JWT extraction is in place. CORS header is already correctly scoped.
**Estimated fix time:** Resolved as part of CRIT-3

---

### MED-3: No Rate Limiting on Authentication Endpoints

**File:** `src/Auth.jsx`
**OWASP:** A07 — Identification and Authentication Failures

No rate limiting is implemented on login or signup attempts. Supabase has built-in rate limiting for auth endpoints, but it should be verified in the dashboard. Brute-force attacks on the login form are otherwise possible.

**Remediation:** Confirm Supabase Auth rate limits are enabled (Dashboard > Authentication > Rate Limits). Add frontend exponential backoff after 3 failed attempts.
**Estimated fix time:** 30 minutes

---

### MED-4: `is_admin` Flag Managed Manually via SQL

**File:** `SUPABASE_SCHEMA.sql`
**OWASP:** A01 — Broken Access Control

Admin elevation is done by running a raw SQL UPDATE in the Supabase dashboard. There's no audit trail, no 2FA requirement for admin access, and `is_admin` is publicly readable (see CRIT-2). If an attacker gains Supabase dashboard access, they can silently self-escalate.

**Remediation:** After fixing CRIT-2, restrict `is_admin` visibility. Long-term: move to Supabase custom claims or a dedicated admin management flow with logging.
**Estimated fix time:** 1–2 hours

---

## 🟢 LOW VULNERABILITIES

---

### LOW-1: No Email Verification Enforcement Before Login

The app sends a confirmation email but does not block login if the email is unconfirmed. Supabase can enforce email confirmation. Verify this is enabled in Dashboard > Authentication > Providers > Email.

---

### LOW-2: Phone Number Not Validated Client-Side

`Auth.jsx` collects phone numbers with a free-text field and no format validation. Invalid or fake phone numbers can be stored. Add basic E.164 validation or a phone input library.

---

### LOW-3: `server.log` May Be Committed to Repo

`server.log` is listed in the `skillswap/` directory. If committed to git, it could expose request patterns, error details, or user data. Ensure `*.log` is in `.gitignore` (it is listed, but confirm the file was never tracked before the rule was added).

---

## DEPENDENCY AUDIT SUMMARY

| Severity | Count | Notable Packages |
|----------|-------|-----------------|
| HIGH | 15 | svgo, nth-check, serialize-javascript, lodash, workbox |
| MODERATE | 3 | postcss, webpack-dev-server |
| LOW | 9 | jsdom, jest-related |

All HIGH findings are transitive dependencies of `react-scripts@5.0.1`. Most are build-time tools. Priority: verify `serialize-javascript` and `lodash` are not bundled into the production output.

---

## INFRASTRUCTURE NOTES

- **CORS:** Edge functions use environment-variable-scoped origin — GOOD
- **Stripe Webhook:** Uses `constructEventAsync` with signature verification — GOOD
- **RLS enabled:** on all tables — GOOD (but policies need tightening per CRIT-2/HIGH-5)
- **Service role key:** Not exposed in source code, used only in edge functions via env vars — GOOD
- **Path traversal:** `server.js` has `fullPath.startsWith(BUILD_DIR)` check — GOOD
- **Supabase anon key in `.env`:** The `.env` file is in `.gitignore` — GOOD, but the key is also hardcoded in source (see MED-1)

---

## REMEDIATION PRIORITY ORDER

| # | Issue | Severity | Est. Time |
|---|-------|----------|-----------|
| 1 | Fix username-as-password in Signup.jsx | CRITICAL | 30 min |
| 2 | Restrict profiles table SELECT RLS | CRITICAL | 15 min |
| 3 | Add JWT auth to checkout edge function | CRITICAL | 45 min |
| 4 | Add security headers to server.js | HIGH | 30 min |
| 5 | Restrict listing_views INSERT to auth users | HIGH | 15 min |
| 6 | Enforce password strength | HIGH | 30 min |
| 7 | Move anon key to env vars | MEDIUM | 10 min |
| 8 | Encrypt phone numbers | HIGH | 2–4 hrs |
| 9 | Address react-scripts dep chain | HIGH | 4–8 hrs |

**Total time to clear Critical + High blockers (items 1–6): ~3 hours**

---

## ESCALATION STATUS

Per protocol:
- CRIT-1, CRIT-2, CRIT-3: **Deployment halted.** Dean to notify Ed immediately.
- HIGH-1 through HIGH-5: Must be resolved before Friday launch.
- MEDIUM/LOW: Schedule in next sprint.

---

*Report generated by: CSO Automated Security Monitor*
*Next scan: Scheduled hourly*
