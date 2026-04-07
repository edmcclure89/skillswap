#!/usr/bin/env bash
# ============================================================
# SkillSwap — Full Deployment Script
# Run from the root of your skillswap/ project directory.
# Prerequisites: npm, vercel CLI, git
# ============================================================

set -e  # Exit immediately on any error

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   SkillSwap Deployment — Starting...     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── STEP 1: Install dependencies ──────────────────────────────────────────────
echo "📦 Installing dependencies..."
npm install

# Install required packages if not already in package.json
npm install --save @supabase/supabase-js @stripe/stripe-js stripe @vercel/node
npm install --save-dev typescript @types/node

echo "✅ Dependencies installed."
echo ""

# ── STEP 2: Install Vercel CLI if needed ──────────────────────────────────────
if ! command -v vercel &> /dev/null; then
  echo "🔧 Installing Vercel CLI..."
  npm install -g vercel
fi
echo "✅ Vercel CLI ready."
echo ""

# ── STEP 3: Set Vercel environment variables ──────────────────────────────────
# These are your SERVER-SIDE secrets (set via Vercel CLI, not in code)
# You will be prompted to paste each value.
echo "🔑 Setting Vercel environment variables..."
echo "   (You will be prompted for each value)"
echo ""

# Public (available to browser via VITE_ prefix in build)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production

# Private (server-side only — used by /api/* functions)
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo ""
echo "✅ Environment variables set."
echo ""

# ── STEP 4: Deploy to Vercel ──────────────────────────────────────────────────
echo "🚀 Deploying to Vercel (production)..."
vercel --prod

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Deployment Complete!                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Copy your Vercel deployment URL (e.g. https://skillswap.vercel.app)"
echo ""
echo "2. Register Stripe webhook:"
echo "   → Go to: https://dashboard.stripe.com/webhooks"
echo "   → Add endpoint: https://YOUR-VERCEL-URL.vercel.app/api/webhook"
echo "   → Select event: checkout.session.completed"
echo "   → Copy the Signing Secret"
echo "   → Run: vercel env add STRIPE_WEBHOOK_SECRET production"
echo "   → Paste the whsec_... value"
echo "   → Redeploy: vercel --prod"
echo ""
echo "3. Run the SQL migration in Supabase:"
echo "   → Go to: https://supabase.com/dashboard"
echo "   → Open your project > SQL Editor"
echo "   → Paste and run: supabase/migrations/20260407_skillswap_mvp.sql"
echo ""
