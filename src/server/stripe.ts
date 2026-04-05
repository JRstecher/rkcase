import Stripe from "stripe";

const API_VERSION: Stripe.LatestApiVersion = "2025-02-24.acacia";

let stripeSingleton: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (stripeSingleton === undefined) {
    stripeSingleton = new Stripe(key, { apiVersion: API_VERSION });
  }
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
