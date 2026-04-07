/**
 * CheckoutButton.tsx
 *
 * Triggers a Stripe Checkout session for a given listing.
 *
 * Flow:
 *   1. User clicks "Buy"
 *   2. We POST to /api/create-checkout-session with { listingId, price, title }
 *   3. Server creates a Stripe session and returns { url }
 *   4. We redirect the browser to Stripe Checkout
 *   5. On success, Stripe fires checkout.session.completed to /api/webhook
 *   6. Webhook marks listing as 'sold' and records the transaction
 *
 * client_reference_id is set to listingId so the webhook knows which listing to update.
 * metadata.buyer_id is set to the logged-in user's Supabase ID (if authenticated).
 */

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/utils/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const stripePromise = loadStripe(env.STRIPE_PUBLISHABLE_KEY);

interface CheckoutButtonProps {
  listingId: string;
  price: number;     // dollars (e.g. 49.99)
  title: string;
}

export function CheckoutButton({ listingId, price, title }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      // Get current user (may be null for anon)
      const { data: { user } } = await supabase.auth.getUser();

      // Call our own API route to create the Stripe session server-side
      // (we never expose the secret key to the browser)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          price,
          title,
          buyerId: user?.id ?? null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error: ${response.status}`);
      }

      const { url, sessionId } = await response.json();

      if (url) {
        // Redirect to Stripe-hosted checkout page
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: redirect via Stripe.js
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe.js failed to load');
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 min-w-0">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={[
          'rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors duration-150',
          loading
            ? 'bg-indigo-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
        ].join(' ')}
      >
        {loading ? 'Redirecting...' : 'Buy'}
      </button>
      {error && (
        <p className="text-xs text-red-500 max-w-[160px] text-right">{error}</p>
      )}
    </div>
  );
}
