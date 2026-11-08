import "server-only";
import Stripe from "stripe";
import { secret } from "./secrets";

let client: Stripe | null = null;

/** Stripe client using fetch, so it runs on Cloudflare Workers. */
export function getStripe() {
  if (client) return client;
  const key = secret("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

export const webCrypto = Stripe.createSubtleCryptoProvider();
