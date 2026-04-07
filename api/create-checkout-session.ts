/**
 * api/create-checkout-session.ts — Vercel Serverless Function
 *
 * Called by CheckoutButton.tsx to create a Stripe Checkout session.
 * This keeps the Stripe secret key server-side only.
 *
 * Returns: { url: string }  — the Stripe-hosted checkout URL
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const APP_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.APP_URL ?? 'http://localhost:5173';

if (!STRIPE_SECRET_KEY) {
  throw new Error('[create-checkout-session] Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listingId, price, title, buyerId } = req.body as {
    listingId: string;
    price: number;
    title: string;
    buyerId: string | null;
  };

  if (!listingId || !price || !title) {
    return res.status(400).json({ error: 'Missing required fields: listingId, price, title' });
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(price * 100), // Stripe uses cents
            product_data: {
              name: title,
            },
          },
        },
      ],

      // This is how the webhook knows which listing was purchased
      client_reference_id: listingId,

      // Pass buyer_id so the webhook can link the transaction to a Supabase user
      metadata: {
        listing_id: listingId,
        buyer_id: buyerId ?? '',
      },

      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/listings`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[create-checkout-session] Stripe error:', message);
    return res.status(500).json({ error: message });
  }
}
