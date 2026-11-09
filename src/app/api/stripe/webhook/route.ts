import type Stripe from "stripe";
import { db, first, newId } from "@/lib/db";
import { secret as readSecret } from "@/lib/secrets";
import { getStripe, webCrypto } from "@/lib/stripe";

/**
 * Stripe webhook. Configure it in the Stripe dashboard to send
 * `checkout.session.completed` and `checkout.session.async_payment_succeeded`
 * to https://<your-domain>/api/stripe/webhook.
 */
export async function POST(request: Request) {
  const secret = readSecret("STRIPE_WEBHOOK_SECRET");
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
  if (await first("SELECT 1 FROM orders WHERE stripe_session_id = ?", session.id)) return; // already recorded

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const orderId = newId();
  const userId = session.client_reference_id || session.metadata?.user_id || null;
  const shipping = session.collected_information?.shipping_details ?? null;

  const items = lineItems.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    return {
      productId: product?.metadata?.product_id ?? null,
      title: li.description ?? product?.name ?? "Item",
      kind: product?.metadata?.kind ?? "digital",
      unitPrice: li.price?.unit_amount ?? 0,
      quantity: li.quantity ?? 1,
    };
  });

  const d1 = db();
  const statements = [
    // INSERT OR IGNORE + the UNIQUE stripe_session_id makes duplicate deliveries harmless.
    d1
      .prepare(
        `INSERT OR IGNORE INTO orders (id, user_id, email, stripe_session_id, status, amount_total, currency, shipping)
         VALUES (?, (SELECT id FROM users WHERE id = ?), ?, ?, 'paid', ?, ?, ?)`,
      )
      .bind(
        orderId,
        userId,
        session.customer_details?.email ?? null,
        session.id,
        session.amount_total ?? 0,
        session.currency ?? "usd",
        shipping ? JSON.stringify(shipping) : null,
      ),
    ...items.map((i) =>
      d1
        .prepare(
          // Only add items if this delivery created the order; product_id is kept only if the product still exists.
          `INSERT INTO order_items (id, order_id, product_id, title, kind, unit_price_cents, quantity)
           SELECT ?, ?, (SELECT id FROM products WHERE id = ?), ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)`,
        )
        .bind(newId(), orderId, i.productId, i.title, i.kind, i.unitPrice, i.quantity, orderId),
    ),
    ...items
      .filter((i) => i.kind === "physical" && i.productId)
      .map((i) =>
        d1
          .prepare(
            `UPDATE products SET stock = MAX(stock - ?, 0)
              WHERE id = ? AND stock IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE id = ?)`,
          )
          .bind(i.quantity, i.productId, orderId),
      ),
  ];

  // D1 runs a batch as a single transaction: all of it is written, or none of it.
  await d1.batch(statements);
}
