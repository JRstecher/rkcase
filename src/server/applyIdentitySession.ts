import type Stripe from "stripe";
import { KycStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

/** Met à jour le joueur démo à partir d’une session Stripe Identity (webhook ou synchro). */
export async function applyIdentityVerificationSession(
  vs: Stripe.Identity.VerificationSession,
) {
  const userId = vs.metadata?.userId;
  if (!userId || typeof userId !== "string") {
    console.warn("[kyc] metadata.userId manquant", vs.id);
    return;
  }

  let next: KycStatus;
  switch (vs.status) {
    case "verified":
      next = KycStatus.VERIFIED;
      break;
    case "canceled":
      next = KycStatus.CANCELED;
      break;
    case "requires_input":
    case "processing":
      next = KycStatus.PENDING;
      break;
    default:
      next = KycStatus.PENDING;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: next,
      ...(next === KycStatus.VERIFIED ? { kycVerifiedAt: new Date() } : {}),
    },
  });
}
