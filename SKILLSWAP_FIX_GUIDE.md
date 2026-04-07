# SkillSwap MVP Fix Guide

Everything you need to get the site live. Three areas: database, code files, deployment.

---

## What was written

| File | Purpose |
|---|---|
| `supabase/migrations/20260407_skillswap_mvp.sql` | Full schema + RLS — run this in Supabase |
| `src/utils/env.ts` | Crashes hard at startup if env vars are missing |
| `.env.production.template` | Copy, rename, fill in your keys |
| `api/webhook.ts` | Stripe webhook handler (Vercel serverless) |
| `api/create-checkout-session.ts` | Creates Stripe session server-side |
| `src/components/ListingGrid.tsx` | Fetches + displays all available listings |
| `src/components/CheckoutButton.tsx` | Triggers Stripe checkout for a listing |
| `DEPLOY.sh` | One-shot deployment script |

---

## Step 1 — Run the database migration

Your existing Supabase edge functions target a `profiles.subscription_tier` column,
which is different from the listings/transactions schema you described.
The migration adds the correct MVP tables without touching what's already there.

1. Go to https://supabase.com/dashboard
2. Open your project > SQL Editor
3. Paste the entire contents of `supabase/migrations/20260407_skillswap_mvp.sql`
4. Click Run

---

## Step 2 — Set up env vars

Copy the template:
```bash
cp .env.production.template .env.local
```

Fill in these values from your dashboards:

- `VITE_SUPABASE_URL` — Supabase > Project Settings > API > Project URL
- `VITE_SUPABASE_ANON_KEY` — same page, "anon public" key
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe Dashboard > Developers > API Keys
- `STRIPE_SECRET_KEY` — Stripe secret key (server-side only, never VITE_)
- `STRIPE_WEBHOOK_SECRET` — after you register the webhook (Step 4)
- `SUPABASE_URL` — same as VITE_SUPABASE_URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase > Project Settings > API > service_role key

---

## Step 3 — Wire up env.ts in main.tsx

Add this as the very first import in `src/main.tsx`:

```ts
import '@/utils/env'  // validates env vars before anything else loads
```

Then use env values like this anywhere:

```ts
import { env } from '@/utils/env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
```

---

## Step 4 — Deploy to Vercel

Run the deploy script (it will prompt you for each env var):

```bash
chmod +x DEPLOY.sh
./DEPLOY.sh
```

Or manually:

```bash
# Install deps
npm install --save @supabase/supabase-js @stripe/stripe-js stripe @vercel/node

# Deploy
vercel --prod
```

---

## Step 5 — Register Stripe webhook

After deploy, you'll have a URL like `https://skillswap-xyz.vercel.app`.

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://YOUR-URL.vercel.app/api/webhook`
4. Event: `checkout.session.completed`
5. Copy the signing secret (`whsec_...`)
6. Add it to Vercel: `vercel env add STRIPE_WEBHOOK_SECRET production`
7. Redeploy: `vercel --prod`

---

## Note on existing Supabase edge functions

Your project already has Deno edge functions in `supabase/functions/`. These are
a valid alternative, but require Docker to deploy locally (the issue you hit).
The new `api/webhook.ts` and `api/create-checkout-session.ts` files replace that
with Vercel serverless functions — no Docker needed. They do the same job.

If you later fix Docker and want to go back to Supabase edge functions, the logic
is the same; just move it back. For now, the Vercel path is the path of least resistance.

---

## How the checkout flow works

```
User clicks Buy
    → CheckoutButton POSTs to /api/create-checkout-session
        → Server creates Stripe session with client_reference_id = listing.id
        → Returns { url }
    → Browser redirects to Stripe Checkout
        → User pays
    → Stripe POSTs to /api/webhook
        → Signature verified
        → Transaction inserted into DB
        → Listing status set to 'sold'
    → User lands on /success page
```
