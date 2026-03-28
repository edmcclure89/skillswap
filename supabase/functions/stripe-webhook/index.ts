import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Maps Stripe plan_name metadata → profiles.subscription_tier value
const TIER_MAP: Record<string, string> = {
  student: "student",
  plus_monthly: "plus",
  plus_annual: "plus",
  elite_monthly: "elite",
  elite_annual: "elite",
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const user_id = session.metadata?.user_id;
    const plan_name = session.metadata?.plan_name;

    if (!user_id) {
      console.error("No user_id in session metadata");
      return new Response("Missing user_id", { status: 400 });
    }

    const tier = TIER_MAP[plan_name ?? ""] ?? "free";

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq("id", user_id);

    if (error) {
      console.error("Supabase update error:", error.message);
      return new Response("DB update failed", { status: 500 });
    }

    console.log(`Updated user ${user_id} to tier: ${tier}`);
  }

  if (event.type === "customer.subscription.deleted") {
    // Downgrade back to free when subscription is cancelled
    const sub = event.data.object as Stripe.Subscription;
    const user_id = sub.metadata?.user_id;

    if (user_id) {
      await supabase
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("id", user_id);
      console.log(`Downgraded user ${user_id} to free (subscription cancelled)`);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
