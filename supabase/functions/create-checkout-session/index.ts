/**
 * Supabase Edge Function: create-checkout-session
 *
 * Creates a Stripe Checkout session for either a digital book purchase
 * or a physical print order.
 *
 * Request body:
 *   { bookId: string, type: "digital" | "physical", childId?: string }
 *
 * Response:
 *   { url: string }  — redirect the user to this URL to complete payment
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse request ─────────────────────────────────────────────────────────
    const { bookId, type, childId } = await req.json();

    if (!bookId || !["digital", "physical"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: bookId and type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "physical" && !childId) {
      return new Response(
        JSON.stringify({ error: "childId required for physical orders" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch book details ────────────────────────────────────────────────────
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, price_digital_cents, price_physical_cents")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: "Book not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create Stripe session ─────────────────────────────────────────────────
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://localhost:3000";
    const unitAmount =
      type === "digital"
        ? book.price_digital_cents
        : book.price_physical_cents;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: `${appUrl}/library?purchase=success&bookId=${bookId}`,
      cancel_url: `${appUrl}/library?purchase=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            product_data: {
              name:
                type === "digital"
                  ? `${book.title} — Digital`
                  : `${book.title} — Printed Book`,
              description:
                type === "digital"
                  ? "Digital coloring book"
                  : "Printed & shipped to your door",
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          bookId,
          parentId: user.id,
          type,
          ...(childId ? { childId } : {}),
        },
      },
      customer_email: user.email,
    };

    // Physical orders require a shipping address
    if (type === "physical") {
      sessionParams.shipping_address_collection = {
        allowed_countries: ["GB", "US", "AU", "CA", "DE", "FR", "NL"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
