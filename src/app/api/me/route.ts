import { NextResponse } from "next/server";
import { getGiveawayTicketSnapshot } from "@/lib/giveawayTickets";
import {
  levelFromTotalXp,
  xpIntoCurrentLevel,
  xpRemainingToNextLevel,
  XP_PER_LEVEL,
} from "@/lib/playerLevel";
import { isPremiumActive } from "@/lib/premium";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";

export async function GET() {
  const userId = await getCurrentUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      balance: true,
      kycStatus: true,
      kycVerifiedAt: true,
      xp: true,
      freeCaseOpens: true,
      displayName: true,
      authSub: true,
      premiumUntil: true,
    },
  });
  if (!user) {
    return NextResponse.json({ balance: null }, { status: 500 });
  }
  const level = levelFromTotalXp(user.xp);
  const isPremium = isPremiumActive(user.premiumUntil);
  const giveaway = await getGiveawayTicketSnapshot(prisma, userId);
  return NextResponse.json({
    balance: user.balance,
    displayName: user.displayName,
    isOAuthUser: Boolean(user.authSub),
    isPremium,
    premiumUntil: user.premiumUntil?.toISOString() ?? null,
    kycStatus: user.kycStatus,
    kycVerifiedAt: user.kycVerifiedAt?.toISOString() ?? null,
    xp: user.xp,
    level,
    freeCaseOpens: user.freeCaseOpens,
    xpIntoLevel: xpIntoCurrentLevel(user.xp),
    xpPerLevel: XP_PER_LEVEL,
    xpToNextLevel: xpRemainingToNextLevel(user.xp),
    giveaway,
  });
}
