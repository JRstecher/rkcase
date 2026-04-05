import type Stripe from "stripe";
import { prisma } from "@/server/db";

export async function setUserPremiumFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  const end = subscription.current_period_end;
  if (typeof end !== "number") {
    console.warn("[premium] current_period_end manquant", subscription.id);
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      premiumUntil: new Date(end * 1000),
      stripeSubscriptionId: subscription.id,
    },
  });
}

export async function syncPremiumBySubscriptionId(
  subscription: Stripe.Subscription,
) {
  const user = await prisma.user.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });
  if (!user) {
    console.warn("[premium] User introuvable pour abonnement", subscription.id);
    return;
  }
  await setUserPremiumFromSubscription(user.id, subscription);
}

export async function clearPremiumBySubscriptionId(subscriptionId: string) {
  await prisma.user.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      premiumUntil: null,
      stripeSubscriptionId: null,
    },
  });
}
