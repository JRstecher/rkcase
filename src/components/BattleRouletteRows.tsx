"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import { getSkinPreviewSrc } from "@/lib/skinVisual";
import type { RouletteItem } from "@/lib/rouletteReel";
import {
  BATTLE_FAST_EASING,
  BATTLE_FAST_PHASE_MS,
  BATTLE_FAST_PHASE_TRAVEL_RATIO,
  BATTLE_ROULETTE_CARD_H,
  BATTLE_ROULETTE_SLOT_V,
  BATTLE_ROULETTE_SPIN_END_BUFFER_MS,
  BATTLE_ROULETTE_SPIN_EXTRA_PX,
  BATTLE_ROULETTE_TOTAL_MS,
  BATTLE_SLOW_EASING,
  BATTLE_SLOW_PHASE_MS,
  ROULETTE_GAP,
  ROULETTE_WIN_INDEX,
} from "@/lib/rouletteReel";

/** Image seule pendant le roll (pas de carte / nom / rareté). */
function BattleRollSkinImage({ item }: { item: RouletteItem }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg bg-black/50"
      style={{ width: 120, height: BATTLE_ROULETTE_CARD_H }}
    >
      <SkinPreviewImage
        src={getSkinPreviewSrc(item)}
        alt=""
        fill
        sizes="120px"
        className="object-cover object-center"
      />
    </div>
  );
}

function columnCenterTranslateY(col: HTMLDivElement | null): number | null {
  if (!col) return null;
  const h = col.clientHeight;
  const centerY =
    ROULETTE_GAP / 2 +
    ROULETTE_WIN_INDEX * BATTLE_ROULETTE_SLOT_V +
    BATTLE_ROULETTE_SLOT_V / 2;
  return h / 2 - centerY;
}

/** Hauteur totale du strip (cartes + gaps). */
function stripHeightPx(itemCount: number): number {
  if (itemCount <= 0) return 0;
  return itemCount * BATTLE_ROULETTE_SLOT_V - ROULETTE_GAP;
}

/**
 * Début du roll : idéalement on recule de EXTRA px, mais si on va trop loin
 * la fenêtre dépasse le bas du strip — on borne pour garder des armes visibles.
 */
function battleSpinStartY(
  col: HTMLDivElement,
  stripLen: number,
  finalY: number,
): number {
  const h = col.clientHeight;
  const H = stripHeightPx(stripLen);
  const ideal = finalY - BATTLE_ROULETTE_SPIN_EXTRA_PX;
  const midY =
    finalY -
    BATTLE_ROULETTE_SPIN_EXTRA_PX *
      (1 - BATTLE_FAST_PHASE_TRAVEL_RATIO);
  const minTy = h - H;
  let start = Math.max(ideal, minTy);
  if (start > midY) start = midY - 1;
  if (start >= finalY) start = ideal;
  return Math.min(start, finalY - 1);
}

type Props = {
  strips: RouletteItem[][];
  labels: string[];
  spinKey: number;
  onAllSpinsComplete: () => void;
  /** 1v1 (2 joueurs) : roulettes plus grandes, centrées à l’écran */
  duel?: boolean;
};

export function BattleRouletteRows({
  strips,
  labels,
  spinKey,
  onAllSpinsComplete,
  duel = false,
}: Props) {
  const duelLayout = duel && strips.length === 2;
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const phase2TimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ty, setTy] = useState<number[]>(() => strips.map(() => 0));
  const [transition, setTransition] = useState<string[]>(() =>
    strips.map(() => "none"),
  );

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    const nextTy: number[] = [];
    const nextTr: string[] = [];

    for (let c = 0; c < strips.length; c++) {
      const col = colRefs.current[c];
      const strip = strips[c];
      if (!col || !strip?.length) {
        nextTy.push(0);
        nextTr.push("none");
        continue;
      }
      const finalY = columnCenterTranslateY(col);
      if (finalY == null) {
        nextTy.push(0);
        nextTr.push("none");
        continue;
      }
      if (reduced) {
        nextTy.push(finalY);
        nextTr.push("none");
      } else {
        nextTy.push(battleSpinStartY(col, strip.length, finalY));
        nextTr.push("none");
      }
    }
    setTransition(nextTr);
    setTy(nextTy);

    if (reduced) {
      queueMicrotask(() => onAllSpinsComplete());
      return;
    }

    let rafInner = 0;
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(() => {
        const tr1 = `transform ${BATTLE_FAST_PHASE_MS / 1000}s ${BATTLE_FAST_EASING}`;
        setTransition(strips.map((s) => (s?.length ? tr1 : "none")));
        setTy((prev) => {
          const out = [...prev];
          for (let c = 0; c < strips.length; c++) {
            const col = colRefs.current[c];
            if (!col || !strips[c]?.length) continue;
            const finalY = columnCenterTranslateY(col);
            if (finalY == null) continue;
            const midY =
              finalY -
              BATTLE_ROULETTE_SPIN_EXTRA_PX *
                (1 - BATTLE_FAST_PHASE_TRAVEL_RATIO);
            out[c] = midY;
          }
          return out;
        });

        phase2TimeoutRef.current = setTimeout(() => {
          const tr2 = `transform ${BATTLE_SLOW_PHASE_MS / 1000}s ${BATTLE_SLOW_EASING}`;
          setTransition(strips.map((s) => (s?.length ? tr2 : "none")));
          setTy((prev) => {
            const out = [...prev];
            for (let c = 0; c < strips.length; c++) {
              const col = colRefs.current[c];
              if (!col || !strips[c]?.length) continue;
              const finalY = columnCenterTranslateY(col);
              if (finalY == null) continue;
              out[c] = finalY;
            }
            return out;
          });
          phase2TimeoutRef.current = null;
        }, BATTLE_FAST_PHASE_MS);
      });
    });

    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      if (phase2TimeoutRef.current) {
        clearTimeout(phase2TimeoutRef.current);
        phase2TimeoutRef.current = null;
      }
    };
  }, [strips, spinKey, onAllSpinsComplete]);

  useEffect(() => {
    if (strips.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;
    const t = window.setTimeout(
      () => onAllSpinsComplete(),
      BATTLE_ROULETTE_TOTAL_MS + BATTLE_ROULETTE_SPIN_END_BUFFER_MS,
    );
    return () => window.clearTimeout(t);
  }, [spinKey, strips.length, onAllSpinsComplete]);

  return (
    <div
      className={
        duelLayout
          ? "flex w-full flex-row flex-wrap items-end justify-center gap-10 md:gap-16 lg:gap-24"
          : "grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(118px,1fr))] justify-items-center"
      }
    >
      {strips.map((strip, c) => (
        <div
          key={`${spinKey}-col-${c}`}
          className="flex flex-col items-center"
        >
          <div
            className={
              duelLayout
                ? "mb-3 text-center text-sm font-bold tracking-wide text-amber-200/90 md:text-base"
                : "mb-2 text-center text-xs font-semibold text-amber-200/90"
            }
          >
            {labels[c] ?? `Slot ${c + 1}`}
          </div>
          <div
            ref={(el) => {
              colRefs.current[c] = el;
            }}
            className={
              duelLayout
                ? "relative h-[min(580px,72vh)] w-[min(280px,42vw)] overflow-hidden rounded-2xl border border-amber-400/20 bg-[#0c0e14] shadow-lg shadow-black/40 sm:h-[min(620px,74vh)] sm:w-[min(340px,38vw)]"
                : "relative h-[min(420px,52vh)] w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14]"
            }
          >
            <div className="pointer-events-none absolute inset-x-0 left-0 right-0 top-1/2 z-20 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-amber-300/90 to-transparent" />
            <div
              className={`flex h-full w-full items-start justify-center ${duelLayout ? "px-1" : ""}`}
            >
              <div
                className="flex w-[120px] shrink-0 flex-col gap-2 px-2 py-2 will-change-transform"
                style={{
                  transform: `translateY(${ty[c] ?? 0}px)`,
                  transition: transition[c] ?? "none",
                }}
              >
                {strip.map((it, idx) => (
                  <BattleRollSkinImage
                    key={`${spinKey}-${c}-${it.id}-${idx}`}
                    item={it}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
