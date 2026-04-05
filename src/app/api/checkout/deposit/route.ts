import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";
import { getStripe } from "@/server/stripe";
import { getCurrentUser } from "@/server/currentUser";

/** Montant min 1 €, max 500 € (centimes côté DB comme le reste de l’app). */
const MIN_CENTS = 100;
const MAX_CENTS = 500_000;

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Paiements non configurés : ajoutez STRIPE_SECRET_KEY dans .env (voir README ou commentaires).",
      },
      { status: 503 },
    );
  }

  await ensureDemoSeed();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const amountEur =
    typeof body === "object" &&
    body !== null &&
    "amountEur" in body &&
    typeof (body as { amountEur: unknown }).amountEur === "number"
      ? (body as { amountEur: number }).amountEur
      : NaN;

  if (!Number.isFinite(amountEur)) {
    return NextResponse.json({ error: "amountEur requis (nombre)." }, { status: 400 });
  }

  const amountCents = Math.round(amountEur * 100);
  if (amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
    return NextResponse.json(
      { error: `Montant entre ${MIN_CENTS / 100} € et ${MAX_CENTS / 100} €.` },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: "Crédit portefeuille Casebs",
            description: "Crédit pour ouvertures de caisses (démo / prototype).",
          },
        },
      },
    ],
    success_url: `${origin.replace(/\/$/, "")}/wallet?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin.replace(/\/$/, "")}/wallet?canceled=1`,
    metadata: {
      userId: user.id,
      amountCents: String(amountCents),
    },
    client_reference_id: user.id,
  });

  if (!session.id || !session.url) {
    return NextResponse.json(
      { error: "Session Stripe incomplète." },
      { status: 502 },
    );
  }

  await prisma.deposit.create({
    data: {
      userId: user.id,
      stripeCheckoutSessionId: session.id,
      amountCents,
      status: "PENDING",
      currency: "eur",
    },
  });

  return NextResponse.json({ url: session.url });
}
