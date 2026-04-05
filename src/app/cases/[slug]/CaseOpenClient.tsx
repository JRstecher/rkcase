"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { CaseHorizontalRoulette } from "@/components/CaseHorizontalRoulette";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import { csgoTier } from "@/components/RouletteSkinCard";
import {
  primeRouletteTickAudio,
  useRoulettePassTick,
} from "@/hooks/useCaseSpinAudio";
import { BSCoinInline } from "@/components/BSCoin";
import { formatBSCoinLabel } from "@/lib/money";
import {
  buildSpinReel,
  pickRandomApproachIndices,
  ROULETTE_REEL_LEN,
  ROULETTE_WIN_INDEX,
  type ApproachIndices,
  type CaseRollDirection,
  type RouletteItem,
} from "@/lib/rouletteReel";
import { getSkinPreviewSrc } from "@/lib/skinVisual";
import {
  playWinRevealChime,
  primeWinRevealAudio,
} from "@/lib/winRevealSound";
import {
  getCaseVisualTheme,
  getDragonCaseArtSrc,
  getNihonCaseThumbSrc,
  getNihonCaseVideoSrc,
  getSakuraCaseBannerArtSrc,
  getSakuraCaseVideoSrc,
  isJapanCaseTheme,
  type CaseVisualTheme,
} from "@/lib/caseTheme";

/** Données renvoyées par POST /api/open pour vérifier le tirage (graines + nonce). */
export type OpeningFairness = {
  clientSeed: string;
  serverSeed: string;
  nonce: number;
};

/** Une ligne renvoyée dans `openings` par POST /api/open. */
export type OpenApiOpening = {
  id: string;
  /** Ligne d’inventaire créée pour ce tirage (pour vendre ce slot précis). */
  inventoryItemId: string;
  createdAt: string;
  case: { slug: string; name: string; price: number };
  wonItem: RouletteItem;
  fairness: OpeningFairness;
  rouletteStopOffsetPx?: number;
};

const OPEN_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function NihonVideoBg({ className }: { className: string }) {
  return (
    <video
      src={getNihonCaseVideoSrc()}
      autoPlay
      muted
      loop
      playsInline
      className={className}
      aria-hidden
    />
  );
}

/** Fond vidéo Sakura : zoom + léger décalage vers le haut pour rogner le bas (logo Veo). */
function SakuraCaseVideoFill() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        src={getSakuraCaseVideoSrc()}
        autoPlay
        muted
        loop
        playsInline
        className="absolute left-1/2 top-[40%] h-[132%] w-full min-w-[108%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-[center_45%]"
        aria-hidden
      />
    </div>
  );
}

/** Visuel central bannière Sakura (caisse + arme) — fond vidéo derrière, image statique au milieu. */
function SakuraBannerArtThumb({
  maxWidthClass,
  roundedClass = "rounded-2xl",
  sizes,
}: {
  maxWidthClass: string;
  roundedClass?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative aspect-[5/4] w-full overflow-hidden border border-pink-300/40 bg-black shadow-[0_12px_48px_-8px_rgba(0,0,0,0.85),0_0_36px_-6px_rgba(244,114,182,0.2)] ring-1 ring-rose-300/25 ${maxWidthClass} ${roundedClass}`}
    >
      <Image
        src={getSakuraCaseBannerArtSrc()}
        alt=""
        fill
        className="object-contain object-center p-2 sm:p-4"
        sizes={sizes ?? "(max-width: 640px) 92vw, 440px"}
      />
    </div>
  );
}

function DragonCaseArtFill({ priority }: { priority?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a1628] to-black">
      <Image
        src={getDragonCaseArtSrc()}
        alt=""
        fill
        className="object-contain object-center p-3 sm:p-6"
        sizes="(max-width: 1152px) 100vw, 1152px"
        priority={priority ?? false}
      />
    </div>
  );
}

function DragonCaseArtThumb({
  maxWidthClass,
  roundedClass = "rounded-xl",
  sizes,
}: {
  maxWidthClass: string;
  roundedClass?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden border border-cyan-400/25 bg-slate-950 shadow-lg shadow-cyan-950/30 ${maxWidthClass} ${roundedClass}`}
    >
      <Image
        src={getDragonCaseArtSrc()}
        alt=""
        fill
        className="object-contain object-center p-1.5 sm:p-2"
        sizes={sizes ?? "300px"}
      />
    </div>
  );
}

export type CaseDropDTO = {
  item: RouletteItem;
  weight: number;
  chance: number;
};

export type CaseOpenInitial = {
  case: { slug: string; name: string; price: number };
  drops: CaseDropDTO[];
  /** Solde lu côté serveur (évite bouton bloqué si /api/me est lent) */
  balance?: number | null;
};

const WEAR_ORDER = [
  "Battle-Scarred",
  "Well-Worn",
  "Field-Tested",
  "Minimal Wear",
  "Factory New",
] as const;

function isStatTrakName(name: string): boolean {
  return /^StatTrak™/i.test(name.trim());
}

function wearFromName(name: string): string | null {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m?.[1]?.trim() ?? null;
}

/** Clé d’affichage : arme + skin, sans usure ni préfixe StatTrak. */
function weaponSkinKey(name: string): string {
  const n = name.replace(/^StatTrak™\s+/i, "").trim();
  return n.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

function wearSortKey(wear: string | null): number {
  if (!wear) return 999;
  const i = WEAR_ORDER.indexOf(wear as (typeof WEAR_ORDER)[number]);
  return i >= 0 ? i : 100;
}

type WeaponGroup = {
  key: string;
  label: string;
  /** Variante choisie pour la vignette (en général meilleure usure du groupe). */
  previewItem: RouletteItem;
  rows: {
    wear: string | null;
    st: boolean;
    chance: number;
    itemId: string;
    item: RouletteItem;
  }[];
};

function buildWeaponGroups(drops: CaseDropDTO[]): WeaponGroup[] {
  const map = new Map<
    string,
    { label: string; rows: WeaponGroup["rows"] }
  >();

  for (const d of drops) {
    const key = weaponSkinKey(d.item.name);
    const label = key;
    const wear = wearFromName(d.item.name);
    const st = isStatTrakName(d.item.name);
    let g = map.get(key);
    if (!g) {
      g = { label, rows: [] };
      map.set(key, g);
    }
    g.rows.push({
      wear,
      st,
      chance: d.chance,
      itemId: d.item.id,
      item: d.item,
    });
  }

  const groups: WeaponGroup[] = [];
  for (const [key, g] of map) {
    g.rows.sort((a, b) => {
      const dw = wearSortKey(a.wear) - wearSortKey(b.wear);
      if (dw !== 0) return dw;
      return Number(a.st) - Number(b.st);
    });
    const last = g.rows[g.rows.length - 1];
    groups.push({
      key,
      label: g.label,
      previewItem: last?.item ?? g.rows[0]!.item,
      rows: g.rows,
    });
  }
  groups.sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}

function formatPct(p: number): string {
  if (p < 0.0001) return "<0.01%";
  if (p < 0.01) return `${(p * 100).toFixed(3)}%`;
  return `${(p * 100).toFixed(2)}%`;
}

type OpenApiProgress = {
  xp: number;
  level: number;
  freeCaseOpens: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  freeOpensUsedThisRequest?: number;
  levelUp?: {
    level: number;
    grants: {
      level: number;
      balanceCents?: number;
      freeOpens?: number;
    }[];
  };
};

function formatLevelUpBanner(levelUp: NonNullable<OpenApiProgress["levelUp"]>) {
  const bonus: string[] = [];
  for (const g of levelUp.grants) {
    if (g.balanceCents)
      bonus.push(`+${formatBSCoinLabel(g.balanceCents)} sur le solde`);
    if (g.freeOpens)
      bonus.push(
        `+${g.freeOpens} ouverture${g.freeOpens > 1 ? "s" : ""} gratuite${g.freeOpens > 1 ? "s" : ""}`,
      );
  }
  const tail = bonus.length ? ` — ${bonus.join(" · ")}` : "";
  return `Battle Pass — palier ${levelUp.level} débloqué !${tail}`;
}

export type ParallelRollSlot = {
  spinKey: number;
  strip: RouletteItem[];
  approachIndices: ApproachIndices;
  rouletteStopOffsetPx: number;
  opening: OpenApiOpening;
};

function buildParallelRollSlot(
  o: OpenApiOpening,
  spinKey: number,
  drops: CaseDropDTO[],
  isJapan: boolean,
): ParallelRollSlot {
  const rollDir: CaseRollDirection = isJapan ? "rtl" : "ltr";
  const approach = pickRandomApproachIndices(
    ROULETTE_WIN_INDEX,
    ROULETTE_REEL_LEN,
    rollDir,
  );
  const reel = buildSpinReel(
    drops.map((d) => ({ item: d.item })),
    o.wonItem,
    ROULETTE_WIN_INDEX,
    ROULETTE_REEL_LEN,
    {
      nearMiss: true,
      rollDirection: rollDir,
      approachIndices: approach,
    },
  );
  return {
    spinKey,
    strip: reel,
    approachIndices: approach,
    rouletteStopOffsetPx:
      typeof o.rouletteStopOffsetPx === "number" ? o.rouletteStopOffsetPx : 0,
    opening: o,
  };
}

/** Plusieurs roulettes en parallèle — mise en page selon le nombre de caisses. */
function ParallelRouletteCells({
  slots,
  isJapan,
  onSlotTick,
  onSlotDone,
}: {
  slots: ParallelRollSlot[];
  isJapan: boolean;
  /** Son pendant le défilement (souvent throttlé côté parent : N roulettes → un flux audible). */
  onSlotTick?: () => void;
  onSlotDone: (index: number) => void;
}) {
  const count = slots.length;
  const rollDir: CaseRollDirection = isJapan ? "rtl" : "ltr";
  const denseLayout = count >= 4;

  const cell = (idx: number, slot: ParallelRollSlot, wrapClass: string) => (
    <div key={slot.spinKey} className={wrapClass}>
      <CaseHorizontalRoulette
        strip={slot.strip}
        spinKey={slot.spinKey}
        approachIndices={slot.approachIndices}
        onSpinComplete={() => onSlotDone(idx)}
        rollDirection={rollDir}
        onSlotTick={onSlotTick}
        winStopOffsetPx={slot.rouletteStopOffsetPx}
        denseLayout={denseLayout}
      />
    </div>
  );

  if (count === 2) {
    return (
      <div className="flex w-full max-w-4xl flex-col gap-5">
        {cell(0, slots[0]!, "min-w-0 w-full")}
        {cell(1, slots[1]!, "min-w-0 w-full")}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="flex w-full max-w-5xl flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cell(0, slots[0]!, "min-w-0 w-full")}
          {cell(1, slots[1]!, "min-w-0 w-full")}
        </div>
        <div className="min-w-0 w-full">{cell(2, slots[2]!, "w-full")}</div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
        {slots.map((slot, idx) => cell(idx, slot, "min-w-0 w-full"))}
      </div>
    );
  }

  if (count === 5) {
    return (
      <div className="flex w-full max-w-6xl flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => cell(i, slots[i]!, "min-w-0 w-full"))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[3, 4].map((i) => cell(i, slots[i]!, "min-w-0 w-full"))}
        </div>
      </div>
    );
  }

  if (count === 6) {
    return (
      <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, idx) => cell(idx, slot, "min-w-0 w-full"))}
      </div>
    );
  }

  if (count === 7) {
    return (
      <div className="flex w-full max-w-6xl flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => cell(i, slots[i]!, "min-w-0 w-full"))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[3, 4, 5].map((i) => cell(i, slots[i]!, "min-w-0 w-full"))}
        </div>
        <div className="flex w-full justify-center">
          <div className="w-full min-w-0 sm:w-[min(100%,calc((100%-1.5rem)/3))]">
            {cell(6, slots[6]!, "w-full")}
          </div>
        </div>
      </div>
    );
  }

  if (count === 8) {
    return (
      <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2">
        {slots.map((slot, idx) => cell(idx, slot, "min-w-0 w-full"))}
      </div>
    );
  }

  if (count === 9) {
    return (
      <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, idx) => cell(idx, slot, "min-w-0 w-full"))}
      </div>
    );
  }

  /* 10 (ou plus) : 2 colonnes max pour éviter min-w × colonnes > largeur écran */
  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {slots.map((slot, idx) => cell(idx, slot, "min-w-0 w-full"))}
    </div>
  );
}

export function CaseOpenClient({ initial }: { initial: CaseOpenInitial }) {
  const { case: caseRow, drops } = initial;
  const caseTheme: CaseVisualTheme = getCaseVisualTheme(caseRow.slug);
  const isJapan = isJapanCaseTheme(caseTheme);
  const [clientSeed, setClientSeed] = useState("demo-client-seed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(
    () => initial.balance ?? null,
  );
  const [freeCaseOpens, setFreeCaseOpens] = useState<number | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);
  const [strip, setStrip] = useState<RouletteItem[]>([]);
  const [approachIndices, setApproachIndices] = useState<ApproachIndices | null>(
    null,
  );
  const [rouletteStopOffsetPx, setRouletteStopOffsetPx] = useState(0);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [lastWon, setLastWon] = useState<RouletteItem | null>(null);
  const [soldThisWin, setSoldThisWin] = useState(false);
  /** Dernière ouverture : ID + graines pour transparence (résultat fixé avant l’anim). */
  const [lastOpeningProof, setLastOpeningProof] = useState<{
    openingId: string;
    fairness: OpeningFairness;
  } | null>(null);
  const [openCount, setOpenCount] = useState<
    (typeof OPEN_COUNT_OPTIONS)[number]
  >(1);
  const [showBatchWin, setShowBatchWin] = useState(false);
  const [batchOpenings, setBatchOpenings] = useState<OpenApiOpening[]>([]);
  const [soldBatchInventoryIds, setSoldBatchInventoryIds] = useState<string[]>(
    [],
  );
  const [batchSellBusy, setBatchSellBusy] = useState(false);
  const [sellingBatchItemId, setSellingBatchItemId] = useState<string | null>(
    null,
  );
  const [lastWinInventoryItemId, setLastWinInventoryItemId] = useState<
    string | null
  >(null);
  const [detailGroupKey, setDetailGroupKey] = useState<string | null>(null);
  /** Plusieurs roulettes en parallèle (même requête API). */
  const [parallelSlots, setParallelSlots] = useState<ParallelRollSlot[] | null>(
    null,
  );
  const parallelSlotsRef = useRef<ParallelRollSlot[] | null>(null);
  const parallelDoneRef = useRef<Set<number>>(new Set());
  const nextParallelSpinKeyRef = useRef(1000);
  const chimePlayed = useRef(false);
  const spinFinishedRef = useRef(false);
  const { playTicksBurst, playTick, playHellTac, playHellRollIntro } =
    useRoulettePassTick();

  const parallelSlotTickLastRef = useRef(0);
  const onParallelSlotTick = useCallback(() => {
    const now = performance.now();
    if (now - parallelSlotTickLastRef.current < 38) return;
    parallelSlotTickLastRef.current = now;
    if (isJapan) {
      playHellTac();
    } else {
      playTick();
    }
  }, [isJapan, playHellTac, playTick]);

  const weaponGroups = useMemo(() => buildWeaponGroups(drops), [drops]);
  const totalOpenCost = caseRow.price * openCount;
  const coinsCharged = useMemo(() => {
    const free = freeCaseOpens ?? 0;
    const used = Math.min(openCount, free);
    return caseRow.price * (openCount - used);
  }, [caseRow.price, openCount, freeCaseOpens]);

  const batchRemainingOpenings = useMemo(() => {
    return batchOpenings.filter(
      (o) =>
        o.inventoryItemId &&
        !soldBatchInventoryIds.includes(o.inventoryItemId),
    );
  }, [batchOpenings, soldBatchInventoryIds]);

  const batchRemainingTotalCents = useMemo(
    () => batchRemainingOpenings.reduce((s, o) => s + o.wonItem.value, 0),
    [batchRemainingOpenings],
  );
  const detailGroup = useMemo(
    () =>
      detailGroupKey
        ? weaponGroups.find((g) => g.key === detailGroupKey) ?? null
        : null,
    [detailGroupKey, weaponGroups],
  );

  const startSpinFromOpening = useCallback(
    (o: OpenApiOpening) => {
      setLastOpeningProof({
        openingId: o.id,
        fairness: o.fairness,
      });
      const rollDir: CaseRollDirection = isJapan ? "rtl" : "ltr";
      const approach = pickRandomApproachIndices(
        ROULETTE_WIN_INDEX,
        ROULETTE_REEL_LEN,
        rollDir,
      );
      const reel = buildSpinReel(
        drops.map((d) => ({ item: d.item })),
        o.wonItem,
        ROULETTE_WIN_INDEX,
        ROULETTE_REEL_LEN,
        {
          nearMiss: true,
          rollDirection: rollDir,
          approachIndices: approach,
        },
      );
      setLastWon(o.wonItem);
      setApproachIndices(approach);
      setRouletteStopOffsetPx(
        typeof o.rouletteStopOffsetPx === "number"
          ? o.rouletteStopOffsetPx
          : 0,
      );
      setStrip(reel);
      setSpinKey((k) => k + 1);
    },
    [drops, isJapan],
  );

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(
        (j: { balance?: number; freeCaseOpens?: number }) => {
          if (typeof j.balance === "number") setBalance(j.balance);
          if (typeof j.freeCaseOpens === "number")
            setFreeCaseOpens(j.freeCaseOpens);
        },
      )
      .catch(() => {
        /* garde le solde SSR si présent */
      });
    const onBal = (e: Event) => {
      const ce = e as CustomEvent<{ balance?: number }>;
      if (typeof ce.detail?.balance === "number") {
        setBalance(ce.detail.balance);
      }
    };
    const onProg = (e: Event) => {
      const ce = e as CustomEvent<{ freeCaseOpens?: number }>;
      if (typeof ce.detail?.freeCaseOpens === "number") {
        setFreeCaseOpens(ce.detail.freeCaseOpens);
      }
    };
    window.addEventListener("casebs:balance", onBal);
    window.addEventListener("casebs:progress", onProg);
    return () => {
      window.removeEventListener("casebs:balance", onBal);
      window.removeEventListener("casebs:progress", onProg);
    };
  }, []);

  useEffect(() => {
    if (!detailGroupKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailGroupKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailGroupKey]);

  const onParallelSlotDone = useCallback((idx: number) => {
    const slots = parallelSlotsRef.current;
    if (!slots || slots.length <= 1) return;
    parallelDoneRef.current.add(idx);
    if (parallelDoneRef.current.size < slots.length) return;

    playWinRevealChime();
    spinFinishedRef.current = true;
    setSpinning(false);
    setSoldBatchInventoryIds([]);
    setBatchOpenings(slots.map((s) => s.opening));
    setShowBatchWin(true);
    setParallelSlots(null);
    parallelSlotsRef.current = null;
    parallelDoneRef.current.clear();
    const last = slots[slots.length - 1]!.opening;
    setLastOpeningProof({
      openingId: last.id,
      fairness: last.fairness,
    });
    setLastWon(last.wonItem);
  }, []);

  const onSpinDone = useCallback(() => {
    if (chimePlayed.current) return;
    chimePlayed.current = true;
    spinFinishedRef.current = true;
    playWinRevealChime();
    setSpinning(false);
    setShowWin(true);
  }, []);

  async function openCase() {
    if (busy || spinning) return;
    primeWinRevealAudio();
    if (isJapan || openCount > 1) primeRouletteTickAudio();
    setBusy(true);
    setError(null);
    setLevelUpBanner(null);
    setShowWin(false);
    setShowBatchWin(false);
    setSoldThisWin(false);
    setLastWinInventoryItemId(null);
    setParallelSlots(null);
    parallelSlotsRef.current = null;
    parallelDoneRef.current.clear();
    chimePlayed.current = false;
    spinFinishedRef.current = false;
    try {
      const openAbort = new AbortController();
      const openAbortTimer = window.setTimeout(() => openAbort.abort(), 30_000);
      let r: Response;
      try {
        r = await fetch("/api/open", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            caseSlug: caseRow.slug,
            clientSeed,
            count: openCount,
          }),
          signal: openAbort.signal,
        });
      } catch (err) {
        const aborted =
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError");
        if (aborted) {
          throw new Error(
            "Délai dépassé : le serveur ne répond pas. Vérifie que Next tourne et réessaie.",
          );
        }
        throw err;
      } finally {
        window.clearTimeout(openAbortTimer);
      }
      const raw = await r.text();
      let json: {
        balance?: number | null;
        openings?: OpenApiOpening[];
        progress?: OpenApiProgress;
        error?: string;
      };
      try {
        json = JSON.parse(raw) as typeof json;
      } catch {
        throw new Error(raw || "Erreur serveur");
      }
      if (!r.ok) {
        throw new Error((json.error ?? raw) || "Erreur serveur");
      }
      const openings = json.openings ?? [];
      if (openings.length === 0) {
        throw new Error("Réponse serveur invalide.");
      }

      if (typeof json.balance === "number") {
        window.dispatchEvent(
          new CustomEvent("casebs:balance", {
            detail: { balance: json.balance },
          }),
        );
      }
      if (json.progress) {
        window.dispatchEvent(
          new CustomEvent("casebs:progress", { detail: json.progress }),
        );
        setFreeCaseOpens(json.progress.freeCaseOpens);
        if (json.progress.levelUp) {
          setLevelUpBanner(formatLevelUpBanner(json.progress.levelUp));
        }
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      window.dispatchEvent(new CustomEvent("casebs:giveaway"));

      if (openings.length === 1) {
        const first = openings[0]!;
        flushSync(() => {
          setLastWinInventoryItemId(first.inventoryItemId);
          startSpinFromOpening(first);
        });
        setSpinning(true);
        parallelSlotTickLastRef.current = 0;
        if (isJapan) {
          playHellRollIntro();
        } else {
          playTicksBurst(10);
        }
      } else {
        flushSync(() => {
          parallelSlotTickLastRef.current = 0;
          setLastWinInventoryItemId(null);
          setStrip([]);
          setApproachIndices(null);
          const slots = openings.map((o) => {
            nextParallelSpinKeyRef.current += 1;
            return buildParallelRollSlot(
              o,
              nextParallelSpinKeyRef.current,
              drops,
              isJapan,
            );
          });
          parallelSlotsRef.current = slots;
          parallelDoneRef.current.clear();
          setParallelSlots(slots);
          const last = slots[slots.length - 1]!.opening;
          setLastOpeningProof({
            openingId: last.id,
            fairness: last.fairness,
          });
          setLastWon(last.wonItem);
        });
        setSpinning(true);
        if (isJapan) {
          playHellRollIntro();
        } else {
          playTicksBurst(Math.min(12, Math.max(8, openings.length)));
        }
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible d’ouvrir la caisse.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sellWon() {
    if (!lastWon || soldThisWin) return;
    try {
      const r = await fetch("/api/inventory/sell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          lastWinInventoryItemId
            ? { inventoryItemId: lastWinInventoryItemId }
            : { itemId: lastWon.id },
        ),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Vente impossible");
      }
      const j = (await r.json()) as { balance?: number };
      if (typeof j.balance === "number") {
        window.dispatchEvent(
          new CustomEvent("casebs:balance", {
            detail: { balance: j.balance },
          }),
        );
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      setSoldThisWin(true);
      setLastWinInventoryItemId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur vente");
    }
  }

  const batchSellLocked = batchSellBusy || sellingBatchItemId !== null;

  async function sellBatchOneFromModal(inventoryItemId: string) {
    if (
      batchSellLocked ||
      soldBatchInventoryIds.includes(inventoryItemId)
    ) {
      return;
    }
    setSellingBatchItemId(inventoryItemId);
    setError(null);
    try {
      const r = await fetch("/api/inventory/sell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inventoryItemId }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Vente impossible");
      }
      const j = (await r.json()) as { balance?: number };
      if (typeof j.balance === "number") {
        window.dispatchEvent(
          new CustomEvent("casebs:balance", {
            detail: { balance: j.balance },
          }),
        );
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      setSoldBatchInventoryIds((prev) => [...prev, inventoryItemId]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur vente");
    } finally {
      setSellingBatchItemId(null);
    }
  }

  async function sellBatchAllFromModal() {
    if (batchSellLocked || batchRemainingOpenings.length === 0) return;
    const ok = window.confirm(
      `Vendre les ${batchRemainingOpenings.length} skin${batchRemainingOpenings.length > 1 ? "s" : ""} restant${batchRemainingOpenings.length > 1 ? "s" : ""} de ce lot pour ${formatBSCoinLabel(batchRemainingTotalCents)} ?`,
    );
    if (!ok) return;
    setBatchSellBusy(true);
    setError(null);
    try {
      const sold: string[] = [];
      for (const o of batchRemainingOpenings) {
        const r = await fetch("/api/inventory/sell", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inventoryItemId: o.inventoryItemId }),
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || "Vente impossible");
        }
        const j = (await r.json()) as { balance?: number };
        if (typeof j.balance === "number") {
          window.dispatchEvent(
            new CustomEvent("casebs:balance", {
              detail: { balance: j.balance },
            }),
          );
        }
        sold.push(o.inventoryItemId);
      }
      setSoldBatchInventoryIds((prev) => [...prev, ...sold]);
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur vente");
    } finally {
      setBatchSellBusy(false);
    }
  }

  function reopenFromPopup() {
    setShowWin(false);
    setLastWon(null);
    void openCase();
  }

  useEffect(() => {
    if (!showWin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowWin(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showWin]);

  useEffect(() => {
    if (!showBatchWin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBatchWin(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showBatchWin]);

  useEffect(() => {
    if (!spinning) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [spinning]);

  /**
   * Sans flushSync, un rendu peut avoir `spinning` true alors que `strip` est encore vide :
   * l’overlay ne monte pas, la roulette ne s’affiche pas et `onSpinComplete` ne part jamais.
   */
  useEffect(() => {
    if (!spinning) return;
    const hasRouletteUi =
      (parallelSlots !== null && parallelSlots.length > 1) ||
      (strip.length > 0 && approachIndices !== null);
    if (hasRouletteUi) return;
    const id = window.setTimeout(() => {
      setSpinning(false);
      setError((prev) =>
        prev ??
        "Impossible d’afficher la roulette. Réessaie ou actualise la page.",
      );
    }, 2800);
    return () => window.clearTimeout(id);
  }, [spinning, parallelSlots, strip.length, approachIndices]);

  /** Si la fin d’animation ne se déclenche pas (onglet en arrière-plan, timers bridés). */
  useEffect(() => {
    if (!spinning) return;
    const n = parallelSlotsRef.current?.length ?? 0;
    const ms =
      n > 1 ? Math.max(120_000, n * 12_000) : 90_000;
    const id = window.setTimeout(() => {
      if (spinFinishedRef.current) return;
      setSpinning(false);
      setParallelSlots(null);
      parallelSlotsRef.current = null;
      parallelDoneRef.current.clear();
      setError((prev) => prev ?? "Animation interrompue — réessaie ou recharge la page.");
    }, ms);
    return () => window.clearTimeout(id);
  }, [spinning]);

  const caseHeroInner = (
    <>
      <h1
        className={`text-2xl font-semibold text-white sm:text-3xl ${
          isJapan ? "drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]" : ""
        }`}
      >
        {caseRow.name}
      </h1>
      <p
        className={`mt-2 text-sm ${
          isJapan
            ? "text-zinc-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]"
            : "text-zinc-400"
        }`}
      >
        Prix :{" "}
        <span
          className={
            isJapan
              ? "font-semibold text-indigo-100"
              : "font-semibold text-indigo-200"
          }
        >
          <BSCoinInline cents={caseRow.price} iconSize={15} />
        </span>
      </p>

      {caseTheme === "sakura" ? (
        <div className="mt-6 flex w-full justify-center px-1">
          <SakuraBannerArtThumb maxWidthClass="max-w-[min(92vw,440px)]" />
        </div>
      ) : caseTheme === "nihon" ? (
        <div className="mt-6 flex w-full justify-center px-1">
          <div className="relative aspect-[5/4] w-full max-w-[min(92vw,440px)] overflow-hidden rounded-2xl border border-amber-500/35 bg-black shadow-[0_12px_48px_-8px_rgba(0,0,0,0.9),0_0_36px_-6px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/20 sm:aspect-[4/3]">
            <Image
              src={getNihonCaseThumbSrc()}
              alt=""
              fill
              className="object-contain object-center p-2 sm:p-4"
              sizes="(max-width: 640px) 92vw, 440px"
            />
          </div>
        </div>
      ) : caseTheme === "dragon" ? (
        <div className="mt-6 flex w-full justify-center bg-transparent">
          <DragonCaseArtThumb maxWidthClass="max-w-[300px]" sizes="300px" />
        </div>
      ) : (
        <div className="mt-6 flex w-full justify-center">
          <div className="flex aspect-[4/3] w-full max-w-[280px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/40 to-zinc-950/90">
            <span className="text-5xl font-black text-zinc-700">
              {caseRow.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Caisse
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void openCase()}
        disabled={
          busy ||
          spinning ||
          (balance !== null && balance < coinsCharged)
        }
        className="mt-5 min-h-11 w-full max-w-xs rounded-xl bg-indigo-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 hover:bg-indigo-400 disabled:opacity-50"
      >
        {busy
          ? "Ouverture…"
          : spinning
            ? "Roulette…"
            : openCount > 1
              ? `Ouvrir ×${openCount}`
              : "Ouvrir la caisse"}
      </button>

      <div className="mt-4 w-full max-w-xs">
        <p
          className={`text-center text-[11px] font-semibold uppercase tracking-wide ${
            isJapan ? "text-zinc-300" : "text-zinc-500"
          }`}
        >
          Quantité
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {OPEN_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy || spinning}
              onClick={() => setOpenCount(n)}
              className={`min-h-9 min-w-9 rounded-lg text-sm font-semibold transition disabled:opacity-40 ${
                openCount === n
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-950/30"
                  : isJapan
                    ? "border border-white/20 bg-black/30 text-zinc-200 hover:bg-white/10"
                    : "border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {openCount > 1 ? (
          <p
            className={`mt-2 text-center text-xs ${
              isJapan ? "text-zinc-300" : "text-zinc-400"
            }`}
          >
            {coinsCharged < totalOpenCost ? (
              <>
                Débit solde :{" "}
                <span className="inline-flex items-center font-semibold text-indigo-200">
                  <BSCoinInline cents={coinsCharged} iconSize={13} />
                </span>
                <span className="text-zinc-500">
                  {" "}
                  ({openCount}× prix, dont{" "}
                  {Math.min(openCount, freeCaseOpens ?? 0)} gratuite
                  {Math.min(openCount, freeCaseOpens ?? 0) > 1 ? "s" : ""})
                </span>
              </>
            ) : (
              <>
                Total :{" "}
                <span className="inline-flex items-center font-semibold text-indigo-200">
                  <BSCoinInline cents={totalOpenCost} iconSize={13} />
                </span>
                <span className="text-zinc-500"> ({openCount}× prix caisse)</span>
              </>
            )}
          </p>
        ) : null}
        {freeCaseOpens !== null && freeCaseOpens > 0 ? (
          <p
            className={`mt-2 text-center text-xs ${
              isJapan ? "text-emerald-100/90" : "text-emerald-300/90"
            }`}
          >
            {freeCaseOpens} ouverture{freeCaseOpens > 1 ? "s" : ""} gratuite
            {freeCaseOpens > 1 ? "s" : ""} — déduite
            {Math.min(openCount, freeCaseOpens) > 1 ? "s" : ""} en premier sur ce
            tirage.
          </p>
        ) : null}
      </div>

      <Link
        href="/cases"
        className={`mt-4 inline-flex min-h-10 items-center text-sm hover:underline ${
          isJapan ? "text-indigo-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]" : "text-indigo-300"
        }`}
      >
        ← Toutes les cases
      </Link>

      {balance !== null && balance < coinsCharged ? (
        <p
          className={`mt-3 max-w-md text-sm ${
            isJapan
              ? "text-amber-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]"
              : "text-amber-200/90"
          }`}
        >
          Solde insuffisant pour ouvrir {openCount > 1 ? `${openCount} caisses` : "cette caisse"}{" "}
          (il reste à payer {formatBSCoinLabel(coinsCharged)}
          {coinsCharged < totalOpenCost
            ? ` après ${Math.min(openCount, freeCaseOpens ?? 0)} gratuite(s)`
            : ""}
          ).
        </p>
      ) : null}
      {levelUpBanner ? (
        <p
          className={`mt-3 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm ${
            isJapan
              ? "text-amber-50 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]"
              : "text-amber-100"
          }`}
          role="status"
        >
          {levelUpBanner}
        </p>
      ) : null}
      {error ? (
        <p
          className={`mt-2 max-w-md text-sm ${
            isJapan ? "drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]" : ""
          } text-red-300`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-zinc-500">
        <Link href="/cases" className="hover:text-white">
          Cases
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{caseRow.slug}</span>
      </nav>

      <section className="mt-6 w-full">
        {isJapan ? (
          <div className="overflow-hidden rounded-2xl">
            <div className="relative min-h-[280px] w-full sm:min-h-[300px]">
              {caseTheme === "sakura" ? (
                <>
                  <SakuraCaseVideoFill />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-rose-950/25 via-transparent to-black/50"
                    aria-hidden
                  />
                </>
              ) : caseTheme === "nihon" ? (
                <>
                  <NihonVideoBg className="absolute inset-0 h-full w-full object-cover object-center" />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/65"
                    aria-hidden
                  />
                </>
              ) : caseTheme === "dragon" ? (
                <>
                  <DragonCaseArtFill priority />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-black/25 via-cyan-950/10 to-black/60"
                    aria-hidden
                  />
                </>
              ) : null}
              <div className="relative z-10 flex flex-col items-center bg-transparent px-4 py-10 text-center sm:py-14">
                {caseHeroInner}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {caseHeroInner}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Contenu &amp; chances</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cliquez sur une arme pour voir chaque usure, StatTrak™ et la probabilité.
          Les pourcentages viennent des poids serveur (même logique que l&apos;API).
        </p>
        <div className="mx-auto mt-4 grid max-w-5xl grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {weaponGroups.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setDetailGroupKey(g.key)}
              className="group overflow-hidden rounded-lg border border-white/10 bg-[#12141c]/90 text-left shadow-md shadow-black/15 transition hover:border-indigo-500/40 hover:bg-[#161a24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-zinc-900/80 to-black/90">
                <SkinPreviewImage
                  src={getSkinPreviewSrc(g.previewItem)}
                  alt={g.label}
                  fill
                  sizes="(max-width: 640px) 28vw, 120px"
                  className="object-cover transition group-hover:brightness-110"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1.5 pt-6 text-[9px] font-medium uppercase tracking-wide text-white/90 opacity-0 transition group-hover:opacity-100">
                  Détails
                </span>
              </div>
              <div className="border-t border-white/5 px-1.5 py-1.5 sm:px-2 sm:py-1.5">
                <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white sm:text-[11px]">
                  {g.label}
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-500 sm:text-[10px]">
                  {g.rows.length} variante{g.rows.length > 1 ? "s" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Client seed &amp; équité</h2>
        <label className="mt-3 block text-xs font-semibold uppercase text-zinc-500">
          Client seed
        </label>
        <input
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          className="mt-2 w-full max-w-md rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-400">Équité :</span> le gain est
          tiré sur le serveur dès la requête (nombre pseudo-aléatoire dérivé des
          graines client + serveur et du nonce, puis choix pondéré dans la caisse).
          La roulette ne fait qu&apos;illustrer ce résultat : elle s&apos;arrête
          toujours sur l&apos;objet déjà attribué. Les skins qui défilent
          « à côté » ou donnent l&apos;impression d&apos;un quasi-gain sont
          uniquement là pour le suspense.
        </p>
        {lastOpeningProof ? (
          <details className="mt-3 max-w-2xl rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
            <summary className="cursor-pointer font-medium text-zinc-300">
              Vérifier la dernière ouverture (graines enregistrées)
            </summary>
            <dl className="mt-3 space-y-2 font-mono text-[11px] leading-snug break-all">
              <div>
                <dt className="text-zinc-500">ID d&apos;ouverture</dt>
                <dd className="text-zinc-300">{lastOpeningProof.openingId}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Client seed (effectif)</dt>
                <dd className="text-zinc-300">
                  {lastOpeningProof.fairness.clientSeed}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Server seed</dt>
                <dd className="text-zinc-300">
                  {lastOpeningProof.fairness.serverSeed}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Nonce</dt>
                <dd className="text-zinc-300">
                  {lastOpeningProof.fairness.nonce}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Pour revérifier : même chaîne que{" "}
              <code className="rounded bg-zinc-800 px-1">seededUnitFloat</code>{" "}
              (<code className="rounded bg-zinc-800 px-1">
                clientSeed:nonce:serverSeed
              </code>
              , puis SHA-256), puis tirage pondéré sur les poids des drops de la
              caisse — voir{" "}
              <code className="rounded bg-zinc-800 px-1">@/server/rng</code>.
            </p>
          </details>
        ) : null}
      </section>

      {detailGroup ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
            aria-label="Fermer"
            onClick={() => setDetailGroupKey(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-drop-detail-title"
            className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#12141c] shadow-2xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 justify-center border-b border-white/10 bg-black/35 px-4 py-4">
              <div className="relative aspect-[4/3] w-full max-w-[168px] overflow-hidden rounded-xl border border-white/10 bg-black/50 sm:max-w-[200px]">
                <SkinPreviewImage
                  src={getSkinPreviewSrc(detailGroup.previewItem)}
                  alt={detailGroup.label}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
              <h3
                id="case-drop-detail-title"
                className="text-base font-semibold leading-snug text-white sm:text-lg"
              >
                {detailGroup.label}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {csgoTier[detailGroup.previewItem.rarity]} · Prix de revente
                (inventaire) pour chaque usure et StatTrak™.
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[360px] text-left text-xs">
                  <thead>
                    <tr className="bg-white/[0.06] text-zinc-400">
                      <th className="px-3 py-2 font-medium">Usure</th>
                      <th className="px-3 py-2 font-medium">StatTrak™</th>
                      <th className="px-3 py-2 text-right font-medium">Prix</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Chance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailGroup.rows.map((row) => (
                      <tr
                        key={`${detailGroup.key}-${row.itemId}`}
                        className="border-t border-white/5 text-zinc-300"
                      >
                        <td className="px-3 py-2">{row.wear ?? "—"}</td>
                        <td className="px-3 py-2">
                          {row.st ? (
                            <span className="text-amber-200/95">Oui</span>
                          ) : (
                            "Non"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-200/95">
                          <span className="inline-flex justify-end">
                            <BSCoinInline cents={row.item.value} iconSize={12} />
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-100">
                          {formatPct(row.chance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setDetailGroupKey(null)}
                className="mt-4 w-full rounded-xl border border-white/15 bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {spinning ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-stretch justify-start gap-3 overflow-y-auto overscroll-contain p-3 pt-5 sm:gap-4 sm:p-4 sm:pt-8"
          role="dialog"
          aria-modal="true"
          aria-label="Roulette"
        >
          {caseTheme === "sakura" ? (
            <div className="pointer-events-none absolute inset-0 z-0">
              <SakuraCaseVideoFill />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65"
                aria-hidden
              />
            </div>
          ) : caseTheme === "nihon" ? (
            <>
              <div className="pointer-events-none absolute inset-0 z-0">
                <NihonVideoBg className="h-full w-full object-cover object-center" />
              </div>
              <div
                className="absolute inset-0 z-0 bg-black/55 backdrop-blur-[2px]"
                aria-hidden
              />
            </>
          ) : caseTheme === "dragon" ? (
            <div className="pointer-events-none absolute inset-0 z-0">
              <DragonCaseArtFill />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70"
                aria-hidden
              />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-black/90 backdrop-blur-sm" />
          )}
          <div
            className={`relative z-10 mx-auto flex w-full min-w-0 flex-col items-center gap-3 ${
              parallelSlots !== null && parallelSlots.length > 4
                ? "max-w-7xl"
                : "max-w-5xl"
            }`}
          >
          {parallelSlots !== null && parallelSlots.length > 1 ? (
            <>
              {caseTheme === "sakura" ? (
                <div className="relative z-10 flex w-full shrink-0 justify-center bg-transparent px-2">
                  <SakuraBannerArtThumb
                    maxWidthClass="max-w-[120px] sm:max-w-[140px]"
                    roundedClass="rounded-lg"
                    sizes="140px"
                  />
                </div>
              ) : caseTheme === "nihon" ? (
                <div className="relative z-10 flex w-full shrink-0 justify-center px-2">
                  <div className="relative aspect-video w-full max-w-[130px] overflow-hidden rounded-lg border border-white/30 shadow-lg shadow-black/40 sm:max-w-[150px]">
                    <NihonVideoBg className="h-full w-full object-cover" />
                  </div>
                </div>
              ) : caseTheme === "dragon" ? (
                <div className="relative z-10 flex w-full shrink-0 justify-center bg-transparent px-2">
                  <DragonCaseArtThumb
                    maxWidthClass="max-w-[120px] sm:max-w-[140px]"
                    roundedClass="rounded-lg"
                    sizes="140px"
                  />
                </div>
              ) : (
                <div className="relative z-10 flex w-full max-w-[160px] shrink-0 flex-col items-center sm:max-w-[200px]">
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/40 to-zinc-950/90">
                    <span className="text-3xl font-black text-zinc-700 sm:text-4xl">
                      {caseRow.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                      Caisse
                    </span>
                  </div>
                </div>
              )}
              <p
                className={`relative z-10 shrink-0 text-center text-xs font-semibold sm:text-sm ${
                  isJapan
                    ? "text-amber-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                    : "text-zinc-300"
                }`}
              >
                {parallelSlots.length} roulettes en même temps
              </p>
              <div className="relative z-10 flex w-full max-w-full flex-1 items-start justify-center px-1 pb-10 sm:px-2">
                <ParallelRouletteCells
                  slots={parallelSlots}
                  isJapan={isJapan}
                  onSlotTick={onParallelSlotTick}
                  onSlotDone={onParallelSlotDone}
                />
              </div>
            </>
          ) : strip.length > 0 && approachIndices ? (
            <>
              <div
                className={`relative z-10 flex w-full shrink-0 justify-center px-2 ${
                  isJapan ? "bg-transparent" : ""
                }`}
              >
                {caseTheme === "sakura" ? (
                  <SakuraBannerArtThumb
                    maxWidthClass="max-w-[150px] sm:max-w-[170px]"
                    sizes="170px"
                  />
                ) : caseTheme === "nihon" ? (
                  <div className="relative aspect-video w-full max-w-[170px] overflow-hidden rounded-xl border border-white/30 shadow-lg shadow-black/40 sm:max-w-[200px]">
                    <NihonVideoBg className="h-full w-full object-cover" />
                  </div>
                ) : caseTheme === "dragon" ? (
                  <DragonCaseArtThumb
                    maxWidthClass="max-w-[150px] sm:max-w-[170px]"
                    sizes="170px"
                  />
                ) : (
                  <div className="flex w-full max-w-[200px] flex-col items-center sm:max-w-[240px]">
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/40 to-zinc-950/90">
                      <span className="text-4xl font-black text-zinc-700 sm:text-5xl">
                        {caseRow.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                        Caisse
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full min-w-[min(100%,42rem)] max-w-4xl shrink-0 px-2">
                <CaseHorizontalRoulette
                  key={spinKey}
                  strip={strip}
                  spinKey={spinKey}
                  approachIndices={approachIndices}
                  onSpinComplete={onSpinDone}
                  rollDirection={isJapan ? "rtl" : "ltr"}
                  onSlotTick={isJapan ? playHellTac : undefined}
                  winStopOffsetPx={rouletteStopOffsetPx}
                />
              </div>
            </>
          ) : (
            <p className="max-w-sm px-4 text-center text-sm text-zinc-200">
              Préparation du tirage…
            </p>
          )}
          </div>
        </div>
      ) : null}

      {showBatchWin && batchOpenings.length > 0 ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            aria-label="Fermer"
            onClick={() => setShowBatchWin(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#12141c] shadow-2xl sm:max-w-2xl"
          >
            <div className="shrink-0 border-b border-white/10 p-5">
              <h2 className="text-xl font-bold text-white">
                {batchOpenings.length} caisses ouvertes
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Tout est dans ton{" "}
                <Link
                  href="/inventory"
                  className="font-medium text-indigo-300 underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  inventaire
                </Link>
                . Valeur du lot :{" "}
                <span className="inline-flex items-center font-semibold text-emerald-200/95">
                  <BSCoinInline
                    cents={batchOpenings.reduce((s, o) => s + o.wonItem.value, 0)}
                    iconSize={14}
                  />
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Tu peux tout vendre d’un coup ou vendre chaque arme une par une
                ci-dessous.
              </p>
              {batchRemainingOpenings.length === 0 &&
              batchOpenings.length > 0 ? (
                <p className="mt-2 text-sm font-medium text-emerald-200/95">
                  Tout le lot a été vendu — le solde a été mis à jour.
                </p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {batchOpenings.map((o) => {
                  const sold =
                    o.inventoryItemId &&
                    soldBatchInventoryIds.includes(o.inventoryItemId);
                  return (
                    <li
                      key={o.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <SkinPreviewImage
                          src={getSkinPreviewSrc(o.wonItem)}
                          alt={o.wonItem.name}
                          fill
                          sizes="(max-width:640px) 45vw, 200px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white">
                          {o.wonItem.name}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1 text-[10px] text-zinc-500">
                          <span>
                            {csgoTier[o.wonItem.rarity]} ·
                          </span>
                          <BSCoinInline cents={o.wonItem.value} iconSize={11} />
                        </p>
                        {sold ? (
                          <p className="mt-auto text-center text-[10px] font-medium text-emerald-300/95">
                            Vendu
                          </p>
                        ) : o.inventoryItemId ? (
                          <button
                            type="button"
                            disabled={batchSellLocked}
                            onClick={() =>
                              void sellBatchOneFromModal(o.inventoryItemId)
                            }
                            className="mt-auto w-full rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-1.5 text-[10px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40 sm:text-xs"
                          >
                            {sellingBatchItemId === o.inventoryItemId
                              ? "Vente…"
                              : `Vendre cette arme (${formatBSCoinLabel(o.wonItem.value)})`}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <details className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-400">
                <summary className="cursor-pointer font-medium text-zinc-300">
                  Équité (nonce / graines par tirage)
                </summary>
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto font-mono text-[10px] leading-relaxed break-all">
                  {batchOpenings.map((o) => (
                    <li
                      key={`fair-${o.id}`}
                      className="border-t border-white/5 pt-2 first:border-t-0 first:pt-0"
                    >
                      <span className="text-zinc-500">#{o.fairness.nonce}</span>{" "}
                      · {o.fairness.serverSeed.slice(0, 16)}…
                    </li>
                  ))}
                </ul>
              </details>
            </div>
            <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 p-4">
              {batchRemainingOpenings.length > 0 ? (
                <button
                  type="button"
                  disabled={batchSellLocked}
                  onClick={() => void sellBatchAllFromModal()}
                  className="w-full rounded-xl border border-amber-500/45 bg-amber-500/15 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-40"
                >
                  {batchSellBusy
                    ? "Vente en cours…"
                    : `Tout vendre le lot (${formatBSCoinLabel(batchRemainingTotalCents)})`}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void openCase()}
                disabled={busy || (balance !== null && balance < coinsCharged)}
                className="w-full rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {openCount > 1
                  ? `Ouvrir ×${openCount} à nouveau`
                  : "Ouvrir à nouveau"}
              </button>
              <button
                type="button"
                onClick={() => setShowBatchWin(false)}
                className="w-full rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showWin && lastWon ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            aria-label="Fermer"
            onClick={() => setShowWin(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-[#12141c] p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white">Tu as gagné</h2>
            <div className="relative mx-auto mt-4 aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <SkinPreviewImage
                src={getSkinPreviewSrc(lastWon)}
                alt={lastWon.name}
                fill
                sizes="280px"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-white">
              {lastWon.name}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-center text-xs text-zinc-400">
              <span>{csgoTier[lastWon.rarity]} ·</span>
              <BSCoinInline cents={lastWon.value} iconSize={12} />
            </p>
            {!soldThisWin ? (
              <p className="mt-3 text-center text-xs leading-relaxed text-zinc-400">
                Le skin est enregistré dans ton{" "}
                <Link
                  href="/inventory"
                  className="font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  inventaire
                </Link>
                .
              </p>
            ) : null}
            {soldThisWin ? (
              <p className="mt-3 text-center text-sm text-emerald-300">
                Vendu — le solde a été mis à jour.
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void sellWon()}
                disabled={soldThisWin}
                className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
              >
                <span className="inline-flex items-center justify-center gap-1">
                  Vendre (
                  <BSCoinInline cents={lastWon.value} iconSize={14} />)
                </span>
              </button>
              <button
                type="button"
                onClick={() => void reopenFromPopup()}
                disabled={busy || (balance !== null && balance < coinsCharged)}
                className="w-full rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                Ouvrir à nouveau
              </button>
              <button
                type="button"
                onClick={() => setShowWin(false)}
                className="w-full rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
