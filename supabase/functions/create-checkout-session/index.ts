import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { price_id, user_id, user_email, plan_name } = await req.json();

    if (!price_id || !user_id || !user_email) {
      throw new Error("Missing required fields: price_id, user_id, user_email");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user_email,
      metadata: { user_id, plan_name },
      success_url: `${siteUrl}?checkout=success&plan=${plan_name}`,
      cancel_url: `${siteUrl}?checkout=cancelled#pricing`,
      subscription_data: {
        metadata: { user_id, plan_name },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout session error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
