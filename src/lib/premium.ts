/** Bonus XP pour abonnés Premium (ouvertures de caisses). */
export const PREMIUM_XP_MULTIPLIER = 1.15;

export function isPremiumActive(
  premiumUntil: Date | null | undefined,
): boolean {
  if (!premiumUntil) return false;
  return premiumUntil.getTime() > Date.now();
}

export function applyPremiumXpBonus(baseXp: number, premium: boolean): number {
  if (!premium || baseXp <= 0) return baseXp;
  return Math.max(1, Math.floor(baseXp * PREMIUM_XP_MULTIPLIER));
}
