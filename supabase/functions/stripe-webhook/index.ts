/**
 * Supabase Edge Function: stripe-webhook
 *
 * Handles Stripe webhook events. On `checkout.session.completed`:
 *  - Digital: inserts a row in user_libraries
 *  - Physical: dispatches a print order to Gelato
 *
 * Configure in Stripe dashboard:
 *   Webhook endpoint: https://<supabase-project>.supabase.co/functions/v1/stripe-webhook
 *   Events: checkout.session.completed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

serve(async (req: Request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  // Only process completed sessions
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.payment_intent && typeof session.payment_intent !== "string"
    ? (session.payment_intent as Stripe.PaymentIntent).metadata
    : null;

  // Stripe puts metadata on payment_intent; fall back to session metadata
  const metadata = meta ?? (session as unknown as { metadata: Record<string, string> }).metadata ?? {};
  const { bookId, parentId, type, childId } = metadata;

  if (!bookId || !parentId || !type) {
    console.error("Missing metadata fields", metadata);
    return new Response("Missing metadata", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (type === "digital") {
    // ── Digital: unlock the book ────────────────────────────────────────────
    const { error } = await supabase
      .from("user_libraries")
      .upsert({ parent_id: parentId, book_id: bookId }, { onConflict: "parent_id,book_id" });

    if (error) {
      console.error("Failed to insert user_library:", error);
      return new Response("DB error", { status: 500 });
    }

    console.log(`Digital unlock: parent=${parentId} book=${bookId}`);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  if (type === "physical") {
    // ── Physical: dispatch to Gelato ────────────────────────────────────────
    if (!childId) {
      return new Response("Missing childId for physical order", { status: 400 });
    }

    // Fetch the child's colored pages for all pages in this book
    const { data: savedPages, error: spError } = await supabase
      .from("user_saved_pages")
      .select("page_id, colored_image_url, pages(page_number, outline_url)")
      .eq("child_id", childId)
      .not("colored_image_url", "is", null)
      .order("pages(page_number)", { ascending: true });

    if (spError) {
      console.error("Failed to fetch saved pages:", spError);
      return new Response("DB error", { status: 500 });
    }

    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";

    // Build Gelato file list: colored image first, then outline overlay
    const files: { type: string; url: string }[] = (savedPages ?? []).flatMap(
      (sp) => {
        const files: { type: string; url: string }[] = [];
        if (sp.colored_image_url) {
          // Supabase storage path → public URL
          const coloredUrl = sp.colored_image_url.startsWith("http")
            ? sp.colored_image_url
            : `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${sp.colored_image_url}`;
          files.push({ type: "content", url: coloredUrl });
        }
        return files;
      }
    );

    if (files.length === 0) {
      console.error("No colored pages found for child", childId);
      return new Response("No colored pages", { status: 400 });
    }

    const shippingAddress = session.shipping_details?.address;
    if (!shippingAddress) {
      return new Response("Missing shipping address", { status: 400 });
    }

    // Build Gelato order payload
    const gelatoPayload = {
      orderReferenceId: session.id,
      customerReferenceId: parentId,
      currency: "GBP",
      items: [
        {
          itemReferenceId: `${session.id}-item-1`,
          productUid: Deno.env.get("GELATO_BOOK_SKU") ?? "photobook_softcover_a4_portrait",
          files,
          quantity: 1,
        },
      ],
      shipmentMethodUid: "standard",
      shippingAddress: {
        firstName: session.shipping_details?.name?.split(" ")[0] ?? "Customer",
        lastName: session.shipping_details?.name?.split(" ").slice(1).join(" ") ?? "",
        addressLine1: shippingAddress.line1 ?? "",
        addressLine2: shippingAddress.line2 ?? "",
        city: shippingAddress.city ?? "",
        postCode: shippingAddress.postal_code ?? "",
        country: shippingAddress.country ?? "GB",
        email: session.customer_email ?? "",
      },
    };

    const gelatoRes = await fetch("https://order.gelatoapis.com/v4/orders", {
      method: "POST",
      headers: {
        "X-API-KEY": Deno.env.get("GELATO_API_KEY")!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gelatoPayload),
    });

    if (!gelatoRes.ok) {
      const err = await gelatoRes.text();
      console.error("Gelato API error:", err);
      return new Response("Gelato order failed", { status: 500 });
    }

    const gelatoOrder = await gelatoRes.json();
    console.log("Gelato order created:", gelatoOrder.id);

    return new Response(
      JSON.stringify({ received: true, gelatoOrderId: gelatoOrder.id }),
      { status: 200 }
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
