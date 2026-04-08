/**
 * api/webhook.ts — Stripe Webhook Handler (Vercel Serverless Function)
 *
 * Handles: checkout.session.completed
 * Actions:
 *   1. Verifies Stripe signature (rejects tampered requests)
 *   2. Inserts a row into transactions
 *   3. Updates the matching listing status to 'sold'
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — bypasses RLS intentionally.
 * This file runs server-side only. The service role key is NEVER
 * sent to the browser.
 *
 * Deploy path: /api/webhook  (Vercel auto-routes api/ directory)
 * Stripe Dashboard: Webhooks > Add endpoint > https://yoursite.com/api/webhook
 * Event to listen for: checkout.session.completed
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── Env guards (server-side — no VITE_ prefix) ──────────────────────────────
const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL           = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

for (const [name, val] of Object.entries({
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_KEY,
})) {
  if (!val) throw new Error(`[webhook] Missing env var: ${name}`);
}

// ── Clients ──────────────────────────────────────────────────────────────────
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// service_role client: bypasses RLS. Only used server-side.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Stripe requires the raw body for signature verification.
  // Vercel provides it as a Buffer when bodyParser is disabled (see config below).
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook] Signature verification failed:', message);
    return res.status(400).json({ error: `Webhook signature invalid: ${message}` });
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const listingId  = session.client_reference_id;
    const buyerEmail = session.customer_details?.email ?? null;
    const amountTotal = (session.amount_total ?? 0) / 100; // convert cents to dollars

    if (!listingId) {
      console.error('[webhook] checkout.session.completed missing client_reference_id');
      return res.status(400).json({ error: 'Missing client_reference_id' });
    }

    // Resolve buyer_id from email (may be null if buyer not registered)
    let buyerId: string | null = null;
    if (buyerEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id',
          // Look up via auth.users by email — requires admin API
          // Simpler: store buyer_id in Stripe metadata at checkout creation time
          // See CheckoutButton.tsx for how to pass metadata
          session.metadata?.buyer_id ?? ''
        )
        .maybeSingle();
      buyerId = profile?.id ?? null;
    }

    // Also check metadata directly (preferred path — set in CheckoutButton)
    if (!buyerId && session.metadata?.buyer_id) {
      buyerId = session.metadata.buyer_id;
    }

    // 1. Insert transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        listing_id:        listingId,
        buyer_id:          buyerId,
        stripe_session_id: session.id,
        amount:            amountTotal,
      });

    if (txError) {
      // Duplicate session ID means this webhook fired twice — safe to ignore
      if (txError.code === '23505') {
        console.log('[webhook] Duplicate session, skipping:', session.id);
        return res.status(200).json({ received: true, note: 'duplicate' });
      }
      console.error('[webhook] Failed to insert transaction:', txError);
      return res.status(500).json({ error: 'Failed to record transaction' });
    }

    // 2. Mark listing as sold
    const { error: listingError } = await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', listingId)
      .eq('status', 'available'); // idempotent guard

    if (listingError) {
      console.error('[webhook] Failed to update listing status:', listingError);
      // Don't return 500 — transaction was already recorded successfully
      // Log and monitor, but ack the webhook so Stripe doesn't retry
    }

    console.log(`[webhook] Completed: listing ${listingId} sold, session ${session.id}`);
  }

  // Always return 200 to Stripe for unhandled event types
  return res.status(200).json({ received: true });
}

// ── Vercel config: disable body parsing so we get raw Buffer ─────────────────
export const config = {
  api: {
    bodyParser: false,
  },
};
