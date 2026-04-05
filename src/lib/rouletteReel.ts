/** Référence vitesse : ~0,63 px/ms pour la portion dominante du trajet. */
const CASE_SPIN_BASE_MS = 5400;
const CASE_SPIN_BASE_EXTRA_PX = 3400;

/** Durée du roll caisse (horizontal). */
export const ROULETTE_SPIN_MS = 6300;
/** Après l’arrêt (souvent avec décalage sur la carte), glissement jusqu’au centre de l’arme. */
export const ROULETTE_RECENTER_MS = 480;
export const ROULETTE_CARD_W = 120;
export const ROULETTE_GAP = 8;
export const ROULETTE_SLOT = ROULETTE_CARD_W + ROULETTE_GAP;
/** Marge pour que le trait d’arrêt ne colle pas au bord de la carte. */
export const ROULETTE_STOP_MARGIN_PX = 10;

/**
 * u ∈ [0, 1) → décalage horizontal (px) du trait par rapport au **centre** de la carte
 * (positif = vers la droite sur la carte).
 */
export function stopOffsetPxFromUnit(u: number): number {
  const half = ROULETTE_CARD_W / 2 - ROULETTE_STOP_MARGIN_PX;
  if (half <= 0) return 0;
  const t = Math.min(1, Math.max(0, u));
  return (t * 2 - 1) * half;
}

/** `translateX` pour que le centre de la carte `cardIndex` soit sous le trait du milieu. */
export function txForCardCenter(vpWidth: number, cardIndex: number): number {
  const leftPad = ROULETTE_GAP;
  const cx =
    leftPad +
    cardIndex * (ROULETTE_CARD_W + ROULETTE_GAP) +
    ROULETTE_CARD_W / 2;
  return vpWidth / 2 - cx;
}

/**
 * Trait vertical à `offsetFromCenterPx` du centre de la carte (positif = vers la droite sur la carte).
 */
export function txForCardStop(
  vpWidth: number,
  cardIndex: number,
  offsetFromCenterPx: number,
): number {
  return txForCardCenter(vpWidth, cardIndex) - offsetFromCenterPx;
}

export const ROULETTE_TRACK_PAD = 16;
export const ROULETTE_WIN_INDEX = 52;
export const ROULETTE_REEL_LEN = 64;
/** Même ratio que l’ancien 3400 px / 5,4 s → roll plus long sans ralentir nettement. */
export const ROULETTE_SPIN_EXTRA_PX = Math.round(
  (CASE_SPIN_BASE_EXTRA_PX * ROULETTE_SPIN_MS) / CASE_SPIN_BASE_MS,
);

/**
 * Bandeau battle : assez long pour que le scroll EXTRA ne soit pas plafonné
 * (sinon peu de px parcourus → défilement lent).
 */
export const BATTLE_REEL_LEN = 170;

export const BATTLE_ROULETTE_CARD_H = 132;
export const BATTLE_ROULETTE_SLOT_V = BATTLE_ROULETTE_CARD_H + ROULETTE_GAP;

/** Distance scroll battle (plus cette valeur est grande, plus les armes défilent vite à durée fixe). */
export const BATTLE_ROULETTE_SPIN_EXTRA_PX = 15_000;

/** ~3,5 s au total (entre 3 et 4 s) : même ratio 11/15 rapide + 4/15 fin. */
export const BATTLE_FAST_PHASE_MS = 2567;
export const BATTLE_FAST_EASING = "linear";

export const BATTLE_FAST_PHASE_TRAVEL_RATIO = 0.94;

export const BATTLE_SLOW_PHASE_MS = 933;
export const BATTLE_SLOW_EASING = "cubic-bezier(0.18, 0.88, 0.22, 1)";

export const BATTLE_ROULETTE_TOTAL_MS =
  BATTLE_FAST_PHASE_MS + BATTLE_SLOW_PHASE_MS;

/** Marge avant callback fin de roll (durée anim + petit buffer). */
export const BATTLE_ROULETTE_SPIN_END_BUFFER_MS = 280;

/** Sens du bandeau horizontal (caisse Hell) : `ltr` = gauche→droite, `rtl` = droite→gauche. */
export type CaseRollDirection = "ltr" | "rtl";

export type RouletteItem = {
  id: string;
  name: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  value: number;
  imageUrl: string | null;
};

export function randomFromPool(pool: RouletteItem[]): RouletteItem {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

const RARITY_RANK: Record<RouletteItem["rarity"], number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
};

/**
 * Arme « appât » : en général plus rare / plus chère que le gain réel, pour un effet
 * quasi-jackpot (le vrai tirage reste `won`, décidé serveur).
 */
export function pickNearMissTease(
  pool: RouletteItem[],
  won: RouletteItem,
): RouletteItem | null {
  const byId = new Map(pool.map((p) => [p.id, p]));
  const unique = Array.from(byId.values());
  const others = unique.filter((p) => p.id !== won.id);
  if (others.length === 0) return null;

  const looksBetter = others.filter(
    (p) =>
      p.value > won.value || RARITY_RANK[p.rarity] > RARITY_RANK[won.rarity],
  );
  const pickFrom = looksBetter.length > 0 ? looksBetter : others;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)]!;
}

export type ApproachIndices = { i0: number; i1: number };

/** Entier aléatoire « triangulaire » : moins d’extrêmes, approche plus fluide à l’œil. */
function smoothRandomInt(min: number, max: number): number {
  if (min >= max) return min;
  const t = (Math.random() + Math.random()) / 2;
  return min + Math.floor(t * (max - min + 1));
}

/**
 * Deux cases intermédiaires avant le slot gagnant (chaque ouverture = tirage différent).
 * ltr : i0 > i1 > win. rtl : i0 < i1 < win.
 * Plage limitée (±6 cases) pour ne pas brutalement changer la distance parcourue entre les spins.
 */
export function pickRandomApproachIndices(
  winIndex: number,
  reelLen: number,
  direction: CaseRollDirection,
): ApproachIndices {
  const SPAN = 6;

  if (direction === "ltr") {
    const minI0 = winIndex + 2;
    const maxI0 = Math.min(winIndex + SPAN, reelLen - 1);
    if (minI0 > maxI0) {
      const i1 = Math.min(winIndex + 1, reelLen - 1);
      const i0 = Math.min(winIndex + 2, reelLen - 1);
      if (i0 > i1 && i1 > winIndex) return { i0, i1 };
      return {
        i0: Math.min(winIndex + 3, reelLen - 1),
        i1: Math.min(winIndex + 1, reelLen - 2),
      };
    }
    const i0 = smoothRandomInt(minI0, maxI0);
    const minI1 = winIndex + 1;
    const maxI1 = i0 - 1;
    if (minI1 > maxI1) {
      return { i0, i1: winIndex + 1 };
    }
    const i1 = smoothRandomInt(minI1, maxI1);
    return { i0, i1 };
  }

  const minI0 = Math.max(0, winIndex - SPAN);
  const maxI0 = winIndex - 2;
  if (minI0 > maxI0) {
    const i1 = Math.max(winIndex - 1, 0);
    const i0 = Math.max(winIndex - 2, 0);
    if (i0 < i1 && i1 < winIndex) return { i0, i1 };
    return {
      i0: Math.max(0, winIndex - 3),
      i1: Math.max(0, winIndex - 1),
    };
  }
  const i0 = smoothRandomInt(minI0, maxI0);
  const minI1 = i0 + 1;
  const maxI1 = winIndex - 1;
  if (minI1 > maxI1) {
    return { i0, i1: winIndex - 1 };
  }
  const i1 = smoothRandomInt(minI1, maxI1);
  return { i0, i1 };
}

/**
 * Ordre temporel des paliers pour un scroll **physiquement cohérent** (sans aller-retour).
 * - ltr : on centre d’abord la carte d’index le plus **élevé**, puis le suivant, puis le gain.
 * - rtl : d’abord l’index le plus **bas**, etc.
 * Si `i0` / `i1` étaient inversés dans les données, l’animation suit quand même le bon chemin.
 */
export function getScrollWaypointOrder(
  i0: number,
  i1: number,
  direction: CaseRollDirection,
): { firstIdx: number; secondIdx: number } {
  if (direction === "ltr") {
    const hi = Math.max(i0, i1);
    const lo = Math.min(i0, i1);
    return { firstIdx: hi, secondIdx: lo };
  }
  const lo = Math.min(i0, i1);
  const hi = Math.max(i0, i1);
  return { firstIdx: lo, secondIdx: hi };
}

export type BuildSpinReelOptions = {
  /**
   * Place un item plus allant juste avant l’arrêt sur le trait (adjacent au slot gagnant).
   * Le résultat réel (`won`) ne change pas.
   */
  nearMiss?: boolean;
  /** Nécessaire pour choisir la case voisine (ltr vs rtl). */
  rollDirection?: CaseRollDirection;
  /** Si absent avec `nearMiss`, indices tirés au hasard dans `pickRandomApproachIndices`. */
  approachIndices?: ApproachIndices;
};

/**
 * Construit le bandeau affiché **après** que le serveur a fixé `won`.
 * Le slot `winIndex` contient toujours l’objet gagnant ; le reste est décoratif
 * (dont les « proches » / near-miss) pour le suspense — sans effet sur le tirage.
 */
export function buildSpinReel(
  drops: { item: RouletteItem }[],
  won: RouletteItem,
  winIndex: number,
  len: number,
  options?: BuildSpinReelOptions,
): RouletteItem[] {
  const pool = drops.map((d) => d.item);
  const out: RouletteItem[] = [];
  for (let i = 0; i < len; i++) {
    if (i === winIndex) out.push(won);
    else out.push(randomFromPool(pool));
  }

  if (options?.nearMiss) {
    const dir = options.rollDirection ?? "ltr";
    const { i0, i1 } =
      options.approachIndices ??
      pickRandomApproachIndices(winIndex, len, dir);
    const tease = pickNearMissTease(pool, won);
    if (tease) {
      /** Case la plus proche du gain parmi les deux paliers (i1). */
      if (i1 >= 0 && i1 < len && i1 !== winIndex) {
        out[i1] = tease;
      }
      const pool2 = pool.filter((p) => p.id !== tease.id);
      const t2 =
        pickNearMissTease(pool2, won) ?? randomFromPool(pool2.length ? pool2 : pool);
      if (i0 >= 0 && i0 < len && i0 !== winIndex) {
        out[i0] = t2;
      }
    }
  }

  return out;
}
