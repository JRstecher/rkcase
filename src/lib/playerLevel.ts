/**
 * Progression joueur : XP gagnée à l’ouverture de caisses, niveaux et récompenses aux paliers.
 */

/** XP totale nécessaire pour être au début du niveau `level` (1-indexé). */
export function totalXpForLevelStart(level: number): number {
  if (level <= 1) return 0;
  const per = XP_PER_LEVEL;
  return (level - 1) * per;
}

/** Niveau actuel à partir de l’XP totale (minimum 1). */
export function levelFromTotalXp(xp: number): number {
  if (xp < 0) return 1;
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

/** XP dans le niveau courant [0, XP_PER_LEVEL). */
export function xpIntoCurrentLevel(totalXp: number): number {
  if (totalXp < 0) return 0;
  return totalXp % XP_PER_LEVEL;
}

/** XP encore nécessaire pour passer au niveau suivant. */
export function xpRemainingToNextLevel(totalXp: number): number {
  const into = xpIntoCurrentLevel(totalXp);
  return into === 0 && totalXp > 0 ? XP_PER_LEVEL : XP_PER_LEVEL - into;
}

export const XP_PER_LEVEL = 75;

/** XP gagnée par ouverture (une caisse = une ouverture), légèrement liée au prix. */
export function xpPerCaseOpen(casePriceCents: number): number {
  const bonus = Math.min(18, Math.floor(casePriceCents / 4));
  return 10 + bonus;
}

export type LevelEnterReward = {
  balanceCents?: number;
  freeOpens?: number;
};

/** Récompenses en franchissant le niveau `level` (une seule fois par niveau). */
export const LEVEL_ENTER_REWARDS: Record<number, LevelEnterReward> = {
  2: { balanceCents: 15 },
  3: { balanceCents: 20 },
  4: { balanceCents: 25 },
  5: { balanceCents: 50, freeOpens: 1 },
  7: { balanceCents: 40 },
  10: { balanceCents: 120, freeOpens: 1 },
  12: { balanceCents: 80 },
  15: { balanceCents: 200, freeOpens: 2 },
  20: { balanceCents: 500, freeOpens: 3 },
};

/** Paliers avec bonus (niveau → récompense), triés pour l’UI. */
export function getSortedRewardMilestones(): {
  level: number;
  reward: LevelEnterReward;
  /** XP totale cumulée pour atteindre ce niveau (début du niveau). */
  totalXpToReach: number;
}[] {
  return Object.entries(LEVEL_ENTER_REWARDS)
    .map(([k, reward]) => {
      const level = Number(k);
      return {
        level,
        reward,
        totalXpToReach: totalXpForLevelStart(level),
      };
    })
    .sort((a, b) => a.level - b.level);
}

export type LevelUpGrant = {
  level: number;
  balanceCents?: number;
  freeOpens?: number;
};

/** Calcule les récompenses à appliquer quand on passe de `rewardedUpTo` à `newLevel`. */
export function collectLevelEnterRewards(
  rewardedUpTo: number,
  newLevel: number,
): { grants: LevelUpGrant[]; balanceSum: number; freeOpensSum: number } {
  const grants: LevelUpGrant[] = [];
  let balanceSum = 0;
  let freeOpensSum = 0;
  const from = Math.max(1, rewardedUpTo);
  for (let level = from + 1; level <= newLevel; level++) {
    const r = LEVEL_ENTER_REWARDS[level];
    if (!r) continue;
    const g: LevelUpGrant = { level };
    if (r.balanceCents) {
      g.balanceCents = r.balanceCents;
      balanceSum += r.balanceCents;
    }
    if (r.freeOpens) {
      g.freeOpens = r.freeOpens;
      freeOpensSum += r.freeOpens;
    }
    grants.push(g);
  }
  return { grants, balanceSum, freeOpensSum };
}
