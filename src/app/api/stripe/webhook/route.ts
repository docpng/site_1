import type Stripe from "stripe";
import { getStripe, webCrypto } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductKind } from "@/lib/types";

/**
 * Stripe webhook. Configure it in the Stripe dashboard to send
 * `checkout.session.completed` and `checkout.session.async_payment_succeeded`
 * to https://<your-domain>/api/stripe/webhook.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Missing signature", { status: 400 });

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    // Async + SubtleCrypto: the variant that works on Cloudflare Workers.
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret, undefined, webCrypto);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      try {
        await recordOrder(stripe, session);
      } catch (err) {
        console.error("Failed to record order", err);
        // A non-2xx response makes Stripe retry the event later.
        return new Response("Failed to record order", { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}

async function recordOrder(stripe: Stripe, session: Stripe.Checkout.Session) {
  const db = createAdminClient();

  const { data: existing } = await db.from("orders").select("id").eq("stripe_session_id", session.id).maybeSingle();
  if (existing) return; // already recorded (Stripe can deliver an event more than once)

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const userId = session.client_reference_id || session.metadata?.user_id || null;
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: userId,
      email: session.customer_details?.email ?? null,
      stripe_session_id: session.id,
      status: "paid",
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      shipping: session.collected_information?.shipping_details ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return; // unique violation: a parallel delivery won the race
    throw error;
  }

  const items = lineItems.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    return {
      order_id: order.id,
      product_id: product?.metadata?.product_id ?? null,
      title: li.description ?? product?.name ?? "Item",
      kind: (product?.metadata?.kind ?? "digital") as ProductKind,
      unit_price_cents: li.price?.unit_amount ?? 0,
      quantity: li.quantity ?? 1,
    };
  });

  const { error: itemsError } = await db.from("order_items").insert(items);
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id); // let Stripe retry cleanly
    throw itemsError;
  }

  for (const item of items) {
    if (item.kind === "physical" && item.product_id) {
      await db.rpc("decrement_stock", { p_product_id: item.product_id, p_qty: item.quantity });
    }
  }
}
