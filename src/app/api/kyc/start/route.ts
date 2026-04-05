import { NextResponse } from "next/server";
import { KycStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";
import { getCurrentUser } from "@/server/currentUser";
import { getStripe } from "@/server/stripe";

export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe non configuré (STRIPE_SECRET_KEY). Nécessaire pour Stripe Identity.",
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
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId: user.id },
      client_reference_id: user.id,
      return_url: `${origin}/kyc?returned=1`,
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe Identity n’a pas renvoyé d’URL — activez Identity dans le dashboard Stripe et vérifiez votre compte.",
        },
        { status: 502 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: KycStatus.PENDING,
        stripeIdentitySessionId: session.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Erreur Stripe Identity.";
    console.error("[kyc/start]", e);
    return NextResponse.json(
      {
        error: `${msg} — Vérifiez que Stripe Identity est activé (Dashboard → Identity).`,
      },
      { status: 502 },
    );
  }
}
