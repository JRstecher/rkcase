/** Joueurs (slots) dans la battle — inclut toi + adversaires bots (max 4). */
export const BATTLE_SLOTS_MIN = 2;
export const BATTLE_SLOTS_MAX = 4;

/** Adversaires bots possibles une fois la battle créée (max = slots − 1). */
export const BATTLE_BOTS_MAX = BATTLE_SLOTS_MAX - 1;

/** Capacité max de la battle (toi inclus), choisie avant le lobby. */
export const BATTLE_MAX_PARTICIPANTS_MIN = 2;
export const BATTLE_MAX_PARTICIPANTS_MAX = BATTLE_SLOTS_MAX;

/**
 * Manches : tout le monde roule la même caisse, puis manche suivante, etc.
 * Coût = prix × joueurs × manches.
 */
export const BATTLE_ROUNDS_MIN = 1;
export const BATTLE_ROUNDS_MAX = 10;

export function clampBattleSlots(n: number): number {
  const x = Math.trunc(Number(n));
  if (!Number.isFinite(x)) return BATTLE_SLOTS_MIN;
  return Math.min(BATTLE_SLOTS_MAX, Math.max(BATTLE_SLOTS_MIN, x));
}

export function clampBattleRounds(n: number): number {
  const x = Math.trunc(Number(n));
  if (!Number.isFinite(x)) return BATTLE_ROUNDS_MIN;
  return Math.min(BATTLE_ROUNDS_MAX, Math.max(BATTLE_ROUNDS_MIN, x));
}

export function clampBattleMaxParticipants(n: number): number {
  const x = Math.trunc(Number(n));
  if (!Number.isFinite(x)) return BATTLE_MAX_PARTICIPANTS_MAX;
  return Math.min(
    BATTLE_MAX_PARTICIPANTS_MAX,
    Math.max(BATTLE_MAX_PARTICIPANTS_MIN, x),
  );
}

/** Bots dans le lobby (0 jusqu’à maxParticipants − 1). */
export function clampLobbyBotCount(
  botCount: number,
  maxParticipants: number,
): number {
  const maxP = clampBattleMaxParticipants(maxParticipants);
  const maxBots = maxP - 1;
  const x = Math.trunc(Number(botCount));
  if (!Number.isFinite(x)) return 0;
  return Math.min(maxBots, Math.max(0, x));
}
