import { NextResponse } from "next/server";
import { ensureDemoSeed } from "@/server/seed";
import { getStripe } from "@/server/stripe";
import { getCurrentUser } from "@/server/currentUser";

/** Indique si l’abonnement Premium est configurable (prix Stripe renseigné). */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.STRIPE_PREMIUM_PRICE_ID?.trim()),
  });
}

/**
 * Checkout Stripe en mode abonnement (Premium).
 * Crée un produit + prix récurrent dans le dashboard Stripe, puis renseigne
 * STRIPE_PREMIUM_PRICE_ID=price_...
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID?.trim();

  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Paiements non configurés : ajoutez STRIPE_SECRET_KEY dans .env.",
      },
      { status: 503 },
    );
  }

  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Abonnement non configuré : créez un prix récurrent dans Stripe et définissez STRIPE_PREMIUM_PRICE_ID dans .env.",
      },
      { status: 503 },
    );
  }

  await ensureDemoSeed();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 500 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const base = origin.replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/premium?checkout=success`,
    cancel_url: `${base}/premium?checkout=cancel`,
    metadata: {
      userId: user.id,
      kind: "premium",
    },
    client_reference_id: user.id,
    allow_promotion_codes: true,
  });

  if (!session.id || !session.url) {
    return NextResponse.json(
      { error: "Session Stripe incomplète." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
