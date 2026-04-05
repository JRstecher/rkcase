"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ROULETTE_RECENTER_MS,
  ROULETTE_STOP_MARGIN_PX,
} from "@/lib/rouletteReel";

const CARD_W = 152;
const GAP = 10;
const SLOT = CARD_W + GAP;
/** Longueur du bandeau ; le gagnant est toujours à cet index. */
const REEL_LEN = 44;
const WIN_INDEX = 34;

const FAST_MS = 2200;
const SLOW_MS = 900;
const FAST_EASING = "linear";
const SLOW_EASING = "cubic-bezier(0.18, 0.88, 0.22, 1)";
const SPIN_EXTRA_PX = 5200;
const END_BUFFER_MS = 200;
/** Même idée que la caisse : easing court pour glisser au centre après l’arrêt décalé. */
const RECENTER_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";

export type TiebreakPlayer = { slotIndex: number; label: string };

function stripWidthPx(n: number): number {
  if (n <= 0) return 0;
  return n * SLOT - GAP;
}

function txTiebreakCenter(vpW: number, winIdx: number): number {
  const cardCenterX = GAP / 2 + winIdx * SLOT + CARD_W / 2;
  return vpW / 2 - cardCenterX;
}

/** Comme `stopOffsetPxFromUnit` mais pour la largeur des cartes départage. */
function tiebreakStopOffsetPxFromUnit(u: number): number {
  const half = CARD_W / 2 - ROULETTE_STOP_MARGIN_PX;
  if (half <= 0) return 0;
  const t = Math.min(1, Math.max(0, u));
  return (t * 2 - 1) * half;
}

/** u ∈ [0,1) déterministe : même spin = même « faux espoir », sans RNG client. */
function tiebreakStopUnit(spinKey: number, rollIndex: number): number {
  const n = (spinKey * 1103515245 + rollIndex * 747796405 + 12345) >>> 0;
  return (n % 10000) / 10000;
}

/** Départ à droite (tx élevé) → animation vers `finalX` : le bandeau défile de droite à gauche. */
function spinStartXRtl(_vpW: number, _stripLen: number, finalX: number): number {
  const maxTx = 0;
  const ideal = finalX + SPIN_EXTRA_PX;
  let start = Math.min(ideal, maxTx);
  if (start <= finalX) start = ideal;
  start = Math.max(start, finalX + 1);
  if (start <= finalX) start = Math.min(maxTx, finalX + SPIN_EXTRA_PX);
  return start > finalX ? start : Math.min(maxTx, finalX + 800);
}

/**
 * Bandeau décoratif : le slot `WIN_INDEX` correspond toujours au gagnant (`tied[rollIndex]`).
 */
function buildTiebreakStrip(
  tied: TiebreakPlayer[],
  rollIndex: number,
): TiebreakPlayer[] {
  const out: TiebreakPlayer[] = [];
  for (let i = 0; i < REEL_LEN; i++) {
    if (i === WIN_INDEX) {
      out.push(tied[rollIndex]!);
    } else {
      const j = (i * 13 + rollIndex * 5 + tied.length) % tied.length;
      out.push(tied[j]!);
    }
  }
  return out;
}

type Props = {
  tied: TiebreakPlayer[];
  /** Index du gagnant dans `tied` (ordre serveur). */
  rollIndex: number;
  spinKey: number;
  onComplete: () => void;
};

export function BattleTiebreakerRoll({
  tied,
  rollIndex,
  spinKey,
  onComplete,
}: Props) {
  const vpRef = useRef<HTMLDivElement | null>(null);
  const [tx, setTx] = useState(0);
  const [tr, setTr] = useState("none");
  const strip = useMemo(
    () => buildTiebreakStrip(tied, rollIndex),
    [tied, rollIndex],
  );

  useLayoutEffect(() => {
    const vp = vpRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (!vp) return;

    const vpW = vp.clientWidth || 520;
    const tCenter = txTiebreakCenter(vpW, WIN_INDEX);
    const stopU = tiebreakStopUnit(spinKey, rollIndex);
    const winStopOffsetPx = tiebreakStopOffsetPxFromUnit(stopU);
    const tStop = tCenter - winStopOffsetPx;
    const needsRecenter = Math.abs(winStopOffsetPx) > 0.5;

    if (reduced) {
      queueMicrotask(() => {
        setTr("none");
        setTx(tCenter);
        queueMicrotask(() => onComplete());
      });
      return;
    }

    const minTx = vpW - stripWidthPx(strip.length);
    const start = spinStartXRtl(vpW, strip.length, tStop);
    const midX = tStop + SPIN_EXTRA_PX * (1 - 0.94);
    const midClamped = Math.max(midX, minTx + 1);
    const phase1To =
      start > midClamped && midClamped > tStop ? midClamped : tStop;

    /* Position initiale synchronisée avec le layout avant la chaîne rAF. */
    /* eslint-disable react-hooks/set-state-in-effect */
    setTr("none");
    setTx(start);
    /* eslint-enable react-hooks/set-state-in-effect */

    let rafInner = 0;
    let phase2: number | null = null;
    let phase3: number | null = null;
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(() => {
        const tr1 = `transform ${FAST_MS / 1000}s ${FAST_EASING}`;
        setTr(tr1);
        setTx(phase1To);
        phase2 = window.setTimeout(() => {
          const tr2 = `transform ${SLOW_MS / 1000}s ${SLOW_EASING}`;
          setTr(tr2);
          setTx(tStop);
          phase2 = null;
        }, FAST_MS);
        phase3 = window.setTimeout(() => {
          if (needsRecenter) {
            setTr(
              `transform ${ROULETTE_RECENTER_MS / 1000}s ${RECENTER_EASING}`,
            );
            setTx(tCenter);
          }
          phase3 = null;
        }, FAST_MS + SLOW_MS);
      });
    });

    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      if (phase2) clearTimeout(phase2);
      if (phase3) clearTimeout(phase3);
    };
  }, [spinKey, rollIndex, onComplete, strip]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;
    const stopU = tiebreakStopUnit(spinKey, rollIndex);
    const winStopOffsetPx = tiebreakStopOffsetPxFromUnit(stopU);
    const needsRecenter = Math.abs(winStopOffsetPx) > 0.5;
    const totalMs =
      FAST_MS +
      SLOW_MS +
      (needsRecenter ? ROULETTE_RECENTER_MS : 0) +
      END_BUFFER_MS;
    const t = window.setTimeout(() => onComplete(), totalMs);
    return () => window.clearTimeout(t);
  }, [spinKey, rollIndex, onComplete]);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center px-4">
      <p className="mb-6 text-center text-sm font-medium text-sky-200/90">
        Égalité — départage
      </p>
      <div
        ref={vpRef}
        className="relative h-[140px] w-full max-w-[min(100%,520px)] overflow-hidden rounded-2xl border border-sky-400/25 bg-[#0a0c12] shadow-inner shadow-black/50"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-sky-300/95 to-transparent" />
        <div className="flex h-full w-full items-center justify-start pl-0">
          <div
            className="flex h-full shrink-0 flex-row items-center gap-[10px] px-3 py-4 will-change-transform"
            style={{ transform: `translateX(${tx}px)`, transition: tr }}
          >
            {strip.map((p, idx) => (
              <div
                key={`${spinKey}-tb-${idx}-${p.slotIndex}`}
                className={`flex shrink-0 items-center justify-center rounded-xl border-2 bg-gradient-to-b from-white/12 to-white/5 px-3 text-center font-bold tracking-tight text-white shadow-lg ${
                  idx === WIN_INDEX
                    ? "border-sky-400/70 ring-2 ring-sky-400/30"
                    : "border-white/15"
                }`}
                style={{
                  width: CARD_W,
                  minHeight: 100,
                  fontSize: tied.length === 2 ? "1.05rem" : "0.95rem",
                }}
              >
                <span className="line-clamp-3 leading-tight">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Le résultat est fixé côté serveur (provably fair) ; l&apos;animation
        s&apos;arrête sur le gagnant.
      </p>
    </div>
  );
}
