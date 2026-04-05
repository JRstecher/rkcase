"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeProgress = {
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
};

export function BattlePassBadge() {
  const [p, setP] = useState<MeProgress | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/me")
        .then((r) => r.json())
        .then(
          (j: {
            level?: number;
            xpIntoLevel?: number;
            xpPerLevel?: number;
          }) => {
            if (
              typeof j.level === "number" &&
              typeof j.xpIntoLevel === "number" &&
              typeof j.xpPerLevel === "number" &&
              j.xpPerLevel > 0
            ) {
              setP({
                level: j.level,
                xpIntoLevel: j.xpIntoLevel,
                xpPerLevel: j.xpPerLevel,
              });
            } else {
              setP(null);
            }
          },
        )
        .catch(() => setP(null));
    }
    load();
    const onProg = (e: Event) => {
      const ce = e as CustomEvent<Partial<MeProgress> & { level?: number }>;
      const d = ce.detail;
      if (
        typeof d?.level === "number" &&
        typeof d?.xpIntoLevel === "number" &&
        typeof d?.xpPerLevel === "number" &&
        d.xpPerLevel > 0
      ) {
        setP({
          level: d.level,
          xpIntoLevel: d.xpIntoLevel,
          xpPerLevel: d.xpPerLevel,
        });
      }
    };
    window.addEventListener("casebs:progress", onProg);
    return () => window.removeEventListener("casebs:progress", onProg);
  }, []);

  const base =
    "block min-w-[7.5rem] rounded-xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-2.5 py-2 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:from-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60";

  if (!p) {
    return (
      <Link
        href="/battle-pass"
        className={`${base} border-amber-400/20 text-zinc-500`}
        role="status"
      >
        Pass …
      </Link>
    );
  }

  const pct = Math.min(100, (p.xpIntoLevel / p.xpPerLevel) * 100);

  return (
    <Link
      href="/battle-pass"
      className={`${base} border-amber-400/30 text-zinc-300`}
      role="status"
      aria-live="polite"
      aria-label={`Battle Pass palier ${p.level}, voir la progression`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-zinc-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/30">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M8 12h4M8 16h8" />
            </svg>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Pass
          </span>
        </span>
        <span className="font-semibold tabular-nums text-amber-200">{p.level}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800"
        title={`${p.xpIntoLevel} / ${p.xpPerLevel} XP dans ce palier`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-300 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
