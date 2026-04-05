"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RouletteSkinCard } from "@/components/RouletteSkinCard";
import type {
  ApproachIndices,
  CaseRollDirection,
  RouletteItem,
} from "@/lib/rouletteReel";
import { getScrollWaypointOrder } from "@/lib/rouletteReel";
import {
  ROULETTE_CARD_W,
  ROULETTE_GAP,
  ROULETTE_RECENTER_MS,
  ROULETTE_SPIN_EXTRA_PX,
  ROULETTE_SPIN_MS,
  ROULETTE_SLOT,
  ROULETTE_WIN_INDEX,
  txForCardCenter,
  txForCardStop,
} from "@/lib/rouletteReel";

/** Largeur totale du bandeau (cartes + gaps). */
function stripWidthPx(itemCount: number): number {
  if (itemCount <= 0) return 0;
  return itemCount * (ROULETTE_CARD_W + ROULETTE_GAP) - ROULETTE_GAP;
}

/**
 * Une seule courbe sur le temps (plus de WAAPI avec easing différent par segment → saccades aux paliers).
 * En 1D, start → tEnd aligne les paliers décoratifs sur la trajectoire : même défilement qu’une interpolation linéaire.
 */
function easeOutQuint(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return 1 - (1 - u) ** 5;
}

function easeOutCubic(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return 1 - (1 - u) ** 3;
}

/**
 * Ajuste le point de départ pour qu’il soit toujours **avant** le 1er palier sur la trajectoire
 * (pas de saut ni de segment qui recule) — le gain reste `finalX`.
 */
function clampLeadInStart(
  direction: CaseRollDirection,
  rawStart: number,
  txFirst: number,
  txSecond: number,
  txEnd: number,
): number {
  const pad = Math.min(ROULETTE_SPIN_EXTRA_PX * 0.45, 1800);
  if (direction === "ltr") {
    if (txFirst < txSecond && txSecond < txEnd && rawStart < txFirst) {
      return rawStart;
    }
    return txFirst - pad;
  }
  if (txFirst > txSecond && txSecond > txEnd && rawStart > txFirst) {
    return rawStart;
  }
  return txFirst + pad;
}

/**
 * Départ du spin : `translateX` anime de `start` à `finalX`.
 * - **ltr** : `start < finalX` → `tx` augmente → bandeau vers la droite (défilement gauche→droite).
 * - **rtl** : `start > finalX` → `tx` diminue → bandeau vers la gauche (défilement droite→gauche).
 */
function caseSpinStartX(
  vpWidth: number,
  stripLen: number,
  finalX: number,
  direction: CaseRollDirection,
): number {
  const W = stripWidthPx(stripLen);
  const minTx = vpWidth - W;
  const maxTx = 0;

  if (direction === "ltr") {
    const ideal = finalX - ROULETTE_SPIN_EXTRA_PX;
    let start = Math.max(ideal, minTx);
    if (start >= finalX) start = ideal;
    start = Math.min(start, finalX - 1);
    return start < finalX ? start : finalX - ROULETTE_SPIN_EXTRA_PX;
  }

  const ideal = finalX + ROULETTE_SPIN_EXTRA_PX;
  let start = Math.min(ideal, maxTx);
  if (start <= finalX) start = ideal;
  start = Math.max(start, finalX + 1);
  return start > finalX ? start : finalX + ROULETTE_SPIN_EXTRA_PX;
}

/**
 * Roulette purement **illustrative** : le strip inclut déjà le gain au slot fixe
 * (`ROULETTE_WIN_INDEX`) ; l’animation s’y arrête toujours.
 */
type Props = {
  strip: RouletteItem[];
  spinKey: number;
  onSpinComplete: () => void;
  /** Même tirage que le bandeau : deux paliers d’approche avant le slot gagnant. */
  approachIndices: ApproachIndices;
  /** Caisse Hell : `ltr` ou `rtl`. Autres caisses : laisser `ltr` (défaut). */
  rollDirection?: CaseRollDirection;
  /** Caisse Hell : « tac » quand l’index sous le trait change (sync sur le transform réel). */
  onSlotTick?: () => void;
  /** Décalage horizontal (px) du trait sur la carte gagnante par rapport au centre (positif = vers la droite). */
  winStopOffsetPx?: number;
  /** Plusieurs roulettes côte à côte : retire `min-w-[280px]` pour éviter les débordements. */
  denseLayout?: boolean;
};

export function CaseHorizontalRoulette({
  strip,
  spinKey,
  onSpinComplete,
  approachIndices,
  rollDirection = "ltr",
  onSlotTick,
  winStopOffsetPx = 0,
  denseLayout = false,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const spinRafRef = useRef(0);
  const [tx, setTx] = useState(0);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const stripEl = stripRef.current;
    if (!vp || !stripEl || strip.length === 0) return;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const w = vp.clientWidth;
      if (w < 8) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      const finalX = txForCardStop(w, ROULETTE_WIN_INDEX, winStopOffsetPx);
      const win = ROULETTE_WIN_INDEX;
      const tCenter = txForCardCenter(w, win);

      if (reduced) {
        cancelAnimationFrame(spinRafRef.current);
        spinRafRef.current = 0;
        setTx(tCenter);
        queueMicrotask(() => onSpinComplete());
        return;
      }

      const { firstIdx, secondIdx } = getScrollWaypointOrder(
        approachIndices.i0,
        approachIndices.i1,
        rollDirection,
      );
      const tEnd = txForCardStop(w, win, winStopOffsetPx);
      const needsRecenter = Math.abs(tEnd - tCenter) > 0.5;
      const t0 = txForCardCenter(w, firstIdx);
      const t1 = txForCardCenter(w, secondIdx);
      const rawStart = caseSpinStartX(w, strip.length, finalX, rollDirection);
      const start = clampLeadInStart(
        rollDirection,
        rawStart,
        t0,
        t1,
        tEnd,
      );

      cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = 0;
      setTx(start);

      const tAnim0 = performance.now();
      const dur = ROULETTE_SPIN_MS;

      const frame = (now: number) => {
        if (cancelled || !stripRef.current) return;
        const raw = Math.min(1, (now - tAnim0) / dur);
        const u = easeOutQuint(raw);
        const x = start + (tEnd - start) * u;
        const el = stripRef.current;
        el.style.transform = `translate3d(${x}px,0,0)`;
        if (raw < 1) {
          spinRafRef.current = requestAnimationFrame(frame);
        } else {
          el.style.transform = `translate3d(${tEnd}px,0,0)`;
          setTx(tEnd);
          if (!needsRecenter || cancelled) {
            spinRafRef.current = 0;
            setTx(tCenter);
            queueMicrotask(() => onSpinComplete());
            return;
          }
          const tRecenter0 = performance.now();
          const recenterFrame = (now: number) => {
            if (cancelled || !stripRef.current) return;
            const r = Math.min(1, (now - tRecenter0) / ROULETTE_RECENTER_MS);
            const u = easeOutCubic(r);
            const x = tEnd + (tCenter - tEnd) * u;
            stripRef.current.style.transform = `translate3d(${x}px,0,0)`;
            if (r < 1) {
              spinRafRef.current = requestAnimationFrame(recenterFrame);
            } else {
              stripRef.current.style.transform = `translate3d(${tCenter}px,0,0)`;
              spinRafRef.current = 0;
              setTx(tCenter);
              queueMicrotask(() => onSpinComplete());
            }
          };
          spinRafRef.current = requestAnimationFrame(recenterFrame);
        }
      };
      spinRafRef.current = requestAnimationFrame(frame);
    };

    if (vp.clientWidth >= 8) {
      run();
    } else {
      const ro = new ResizeObserver(() => {
        if (cancelled) return;
        if (vp.clientWidth >= 8) {
          run();
          ro.disconnect();
        }
      });
      ro.observe(vp);
      return () => {
        cancelled = true;
        ro.disconnect();
        cancelAnimationFrame(spinRafRef.current);
        spinRafRef.current = 0;
      };
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = 0;
    };
  }, [strip, spinKey, onSpinComplete, rollDirection, approachIndices, winStopOffsetPx]);

  useEffect(() => {
    if (strip.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;
    const recenterExtra =
      Math.abs(winStopOffsetPx) > 0.5 ? ROULETTE_RECENTER_MS : 0;
    const t = window.setTimeout(
      () => onSpinComplete(),
      ROULETTE_SPIN_MS + recenterExtra + 500,
    );
    return () => window.clearTimeout(t);
  }, [spinKey, strip.length, onSpinComplete, winStopOffsetPx]);

  useEffect(() => {
    if (!onSlotTick || strip.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;

    const vp = viewportRef.current;
    const stripEl = stripRef.current;
    if (!vp || !stripEl) return;

    const leftPad = ROULETTE_GAP;
    let lastIdx = -1;
    let rafId = 0;
    let running = true;

    const sample = () => {
      if (!running) return;
      const style = getComputedStyle(stripEl);
      const tr = style.transform;
      let mtx = 0;
      if (tr && tr !== "none") {
        try {
          const m = new DOMMatrix(tr);
          mtx = m.m41;
        } catch {
          /* ignore */
        }
      }
      const w = vp.clientWidth;
      const stripX = w / 2 - mtx;
      const rel =
        (stripX - leftPad - ROULETTE_CARD_W / 2) / ROULETTE_SLOT;
      let idx = Math.round(rel);
      idx = Math.max(0, Math.min(strip.length - 1, idx));

      if (lastIdx >= 0 && idx !== lastIdx) {
        const steps = Math.abs(idx - lastIdx);
        const n = Math.min(steps, 16);
        for (let s = 0; s < n; s++) onSlotTick();
      }
      lastIdx = idx;

      rafId = requestAnimationFrame(sample);
    };

    rafId = requestAnimationFrame(sample);

    const recenterExtra =
      Math.abs(winStopOffsetPx) > 0.5 ? ROULETTE_RECENTER_MS : 0;
    const failSafe = window.setTimeout(() => {
      running = false;
      cancelAnimationFrame(rafId);
    }, ROULETTE_SPIN_MS + recenterExtra + 900);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.clearTimeout(failSafe);
    };
  }, [spinKey, strip.length, onSlotTick, rollDirection, winStopOffsetPx]);

  return (
    <div
      ref={viewportRef}
      dir="ltr"
      className={`relative h-[200px] w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14] ${
        denseLayout ? "min-w-0" : "min-w-[280px]"
      }`}
    >
      <div className="pointer-events-none absolute inset-y-4 left-1/2 z-20 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-300/90 to-transparent" />
      <div
        ref={stripRef}
        className="flex h-full w-max shrink-0 flex-row items-center justify-start gap-2 px-2 will-change-transform [backface-visibility:hidden]"
        style={{ transform: `translate3d(${tx}px,0,0)` }}
      >
        {strip.map((it, idx) => (
          <div key={`${spinKey}-${it.id}-${idx}`} className="shrink-0">
            <RouletteSkinCard item={it} />
          </div>
        ))}
      </div>
    </div>
  );
}
