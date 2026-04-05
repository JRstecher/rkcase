/**
 * Battle Pass (UI) — réutilise la progression XP / paliers de {@link ./playerLevel}.
 */
import {
  LEVEL_ENTER_REWARDS,
  levelFromTotalXp,
  totalXpForLevelStart,
  xpIntoCurrentLevel,
  xpPerCaseOpen,
  xpRemainingToNextLevel,
  XP_PER_LEVEL,
  type LevelEnterReward,
} from "@/lib/playerLevel";

export const BATTLE_PASS_MAX_TIER = 25;

export const BATTLE_PASS_SEASON_LABEL = "Saison 1 — Démo";

export type BattlePassTierRow = {
  tier: number;
  xpRequired: number;
  reward: LevelEnterReward | null;
};

export function getBattlePassTierRows(): BattlePassTierRow[] {
  const rows: BattlePassTierRow[] = [];
  for (let tier = 1; tier <= BATTLE_PASS_MAX_TIER; tier++) {
    rows.push({
      tier,
      xpRequired: totalXpForLevelStart(tier),
      reward: LEVEL_ENTER_REWARDS[tier] ?? null,
    });
  }
  return rows;
}

export {
  levelFromTotalXp,
  totalXpForLevelStart,
  xpIntoCurrentLevel,
  XP_PER_LEVEL,
  xpPerCaseOpen,
  xpRemainingToNextLevel,
  type LevelEnterReward,
};
