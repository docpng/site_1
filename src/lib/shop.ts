import type Stripe from "stripe";

/** Countries Stripe Checkout will accept shipping addresses for (physical goods). */
export const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  "US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL", "BE", "ES", "IT", "PT", "AT", "CH", "SE", "NO", "DK", "FI", "PL",
];
