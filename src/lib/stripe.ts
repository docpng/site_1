import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe client using fetch, so it runs on Cloudflare Workers. */
export function getStripe() {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

export const webCrypto = Stripe.createSubtleCryptoProvider();
