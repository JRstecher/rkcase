import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/server/db";
import { applyIdentityVerificationSession } from "@/server/applyIdentitySession";
import { getStripe } from "@/server/stripe";
import {
  clearPremiumBySubscriptionId,
  setUserPremiumFromSubscription,
  syncPremiumBySubscriptionId,
} from "@/server/stripePremium";

const IDENTITY_EVENTS = new Set<string>([
  "identity.verification_session.verified",
  "identity.verification_session.processing",
  "identity.verification_session.requires_input",
  "identity.verification_session.canceled",
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json(
      { error: "Webhook Stripe non configuré." },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signature invalide.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      const userId = session.metadata?.userId;
      const subId = session.subscription;
      if (
        userId &&
        typeof subId === "string" &&
        session.metadata?.kind === "premium"
      ) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await setUserPremiumFromSubscription(userId, sub);
      }
      return NextResponse.json({ received: true });
    }

    const sessionId = session.id;
    const paid = session.amount_total;

    const deposit = await prisma.deposit.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });

    if (!deposit) {
      console.warn("[stripe webhook] Deposit inconnu:", sessionId);
      return NextResponse.json({ received: true });
    }

    if (deposit.status === "COMPLETED") {
      return NextResponse.json({ received: true });
    }

    if (paid == null || paid !== deposit.amountCents) {
      console.error("[stripe webhook] Montant incohérent", {
        paid,
        expected: deposit.amountCents,
      });
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: paid } },
      }),
      prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "COMPLETED" },
      }),
    ]);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    if (
      sub.status === "canceled" ||
      sub.status === "unpaid" ||
      sub.status === "incomplete_expired"
    ) {
      await clearPremiumBySubscriptionId(sub.id);
    } else {
      await syncPremiumBySubscriptionId(sub);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await clearPremiumBySubscriptionId(sub.id);
  }

  if (IDENTITY_EVENTS.has(event.type)) {
    const vs = event.data.object as Stripe.Identity.VerificationSession;
    await applyIdentityVerificationSession(vs);
  }

  return NextResponse.json({ received: true });
}
