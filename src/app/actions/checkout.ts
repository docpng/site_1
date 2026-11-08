"use server";

import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { SHIPPING_COUNTRIES } from "@/lib/shop";
import { siteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { toProduct } from "@/lib/data";
import { all } from "@/lib/db";

type CheckoutResult = { url?: string; error?: string; needsLogin?: boolean };

export async function startCheckout(items: { id: string; quantity: number }[]): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { needsLogin: true, error: "Please sign in to check out." };
  if (!Array.isArray(items) || items.length === 0) return { error: "Your cart is empty." };

  // Never trust prices from the browser: load them from the database.
  const ids = [...new Set(items.map((i) => String(i.id)))].slice(0, 50);
  const products = (
    await all<Record<string, unknown>>(
      `SELECT * FROM products WHERE published = 1 AND kind <> 'free' AND id IN (${ids.map(() => "?").join(",")})`,
      ...ids,
    )
  ).map(toProduct);

  if (!products?.length) return { error: "Those items are no longer available." };

  const { currency } = await getSettings();
  const lineItems = [];
  let needsShipping = false;
  for (const p of products) {
    const requested = Math.floor(Number(items.find((i) => i.id === p.id)?.quantity) || 1);
    const quantity = p.kind === "physical" ? Math.min(Math.max(requested, 1), 99) : 1;
    if (p.kind === "physical") {
      needsShipping = true;
      if (p.stock !== null && p.stock < quantity) {
        return { error: `Only ${p.stock} of "${p.title}" left in stock.` };
      }
    }
    lineItems.push({
      quantity,
      price_data: {
        currency,
        unit_amount: p.price_cents,
        product_data: {
          name: p.title,
          description: p.summary || undefined,
          // Stripe needs absolute https URLs for product images.
          images: p.images
            .map((src) => (src.startsWith("/") ? `${siteUrl()}${src}` : src))
            .filter((src) => src.startsWith("https://"))
            .slice(0, 1),
          metadata: { product_id: p.id, kind: p.kind },
        },
      },
    });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      shipping_address_collection: needsShipping ? { allowed_countries: SHIPPING_COUNTRIES } : undefined,
      success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/cart`,
    });
    if (!session.url) return { error: "Couldn't start checkout." };
    return { url: session.url };
  } catch (err) {
    console.error("Stripe checkout error", err);
    return { error: "Couldn't start checkout. Please try again." };
  }
}
