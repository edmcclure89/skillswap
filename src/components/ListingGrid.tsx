/**
 * ListingGrid.tsx
 *
 * Fetches all 'available' listings from Supabase and renders them in a grid.
 * - Works for anon users (RLS allows public read on listings)
 * - Handles loading, error, and empty states
 * - Passes each listing to CheckoutButton for purchase flow
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/utils/env';
import { CheckoutButton } from './CheckoutButton';

// ── Supabase client (anon key — safe to use in browser) ──────────────────────
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: 'available' | 'sold';
  user_id: string;
  created_at: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ListingGrid() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('id, title, description, price, status, user_id, created_at')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setListings(data ?? []);
      }
      setLoading(false);
    }

    fetchListings();
  }, []);

  // ── States ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Failed to load listings</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-red-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg font-medium">No listings yet.</p>
        <p className="text-sm mt-1">Be the first to post a skill!</p>
      </div>
    );
  }

  // ── Grid ────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-5 flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {listing.title}
        </h3>
        {listing.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">
            {listing.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-indigo-600">
          ${listing.price.toFixed(2)}
        </span>
        <CheckoutButton listingId={listing.id} price={listing.price} title={listing.title} />
      </div>
    </div>
  );
}
