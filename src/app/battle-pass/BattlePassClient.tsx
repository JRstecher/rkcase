"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatBSCoinAmount, formatBSCoinLabel } from "@/lib/money";
import {
  BATTLE_PASS_MAX_TIER,
  BATTLE_PASS_SEASON_LABEL,
  getBattlePassTierRows,
  levelFromTotalXp,
  xpIntoCurrentLevel,
  xpPerCaseOpen,
  xpRemainingToNextLevel,
  XP_PER_LEVEL,
  type LevelEnterReward,
} from "@/lib/battlePass";

const DEMO_CASE_PRICE_CENTS = 20;

function rewardLabel(r: LevelEnterReward): string {
  const parts: string[] = [];
  if (r.balanceCents) parts.push(formatBSCoinLabel(r.balanceCents));
  if (r.freeOpens)
    parts.push(
      `${r.freeOpens} ouverture${r.freeOpens > 1 ? "s" : ""} gratuite${r.freeOpens > 1 ? "s" : ""}`,
    );
  return parts.join(" · ") || "—";
}

export function BattlePassClient() {
  const tiers = useMemo(() => getBattlePassTierRows(), []);
  const [me, setMe] = useState<{
    xp: number;
    level: number;
    freeCaseOpens: number;
    xpIntoLevel: number;
    xpPerLevel: number;
    xpToNextLevel: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (j: {
          xp?: number;
          level?: number;
          freeCaseOpens?: number;
          xpIntoLevel?: number;
          xpPerLevel?: number;
          xpToNextLevel?: number;
        }) => {
          if (
            typeof j.xp === "number" &&
            typeof j.level === "number" &&
            typeof j.freeCaseOpens === "number"
          ) {
            setMe({
              xp: j.xp,
              level: j.level,
              freeCaseOpens: j.freeCaseOpens,
              xpIntoLevel: j.xpIntoLevel ?? xpIntoCurrentLevel(j.xp),
              xpPerLevel: j.xpPerLevel ?? XP_PER_LEVEL,
              xpToNextLevel:
                j.xpToNextLevel ?? xpRemainingToNextLevel(j.xp),
            });
          } else {
            setMe(null);
          }
        },
      )
      .catch(() => setMe(null));

    const onProg = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail;
      if (typeof d?.xp !== "number") return;
      const xp = d.xp as number;
      setMe({
        xp,
        level: typeof d.level === "number" ? d.level : levelFromTotalXp(xp),
        freeCaseOpens:
          typeof d.freeCaseOpens === "number" ? d.freeCaseOpens : 0,
        xpIntoLevel:
          typeof d.xpIntoLevel === "number"
            ? d.xpIntoLevel
            : xpIntoCurrentLevel(xp),
        xpPerLevel:
          typeof d.xpPerLevel === "number" ? d.xpPerLevel : XP_PER_LEVEL,
        xpToNextLevel: xpRemainingToNextLevel(xp),
      });
    };
    window.addEventListener("casebs:progress", onProg);
    return () => window.removeEventListener("casebs:progress", onProg);
  }, []);

  const xpPerDemoOpen = xpPerCaseOpen(DEMO_CASE_PRICE_CENTS);
  const barPct = me
    ? Math.min(100, (me.xpIntoLevel / me.xpPerLevel) * 100)
    : 0;
  const currentTier = me?.level ?? 1;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Battle Pass</span>
      </nav>

      <div className="mt-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/80 via-[#0c0e14] to-indigo-950/40 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
          {BATTLE_PASS_SEASON_LABEL}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Battle Pass
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Gagne de l&apos;XP à chaque ouverture de caisse pour avancer les paliers.
          Les récompenses listées sont créditées automatiquement une fois par
          palier atteint — même logique qu&apos;avant, présentée en parcours Battle
          Pass.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#0c0e14] p-6 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Progression
        </h2>
        {me === null ? (
          <p className="mt-4 text-sm text-zinc-500">Chargement…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-zinc-500">Palier actuel</p>
                <p className="text-3xl font-bold tabular-nums text-amber-300">
                  {currentTier}
                </p>
                <p className="text-[11px] text-zinc-600">sur {BATTLE_PASS_MAX_TIER}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">XP totale</p>
                <p className="text-xl font-semibold tabular-nums text-zinc-100">
                  {me.xp}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Ouvertures gratuites</p>
                <p className="text-xl font-semibold tabular-nums text-indigo-200">
                  {me.freeCaseOpens}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Vers palier {me.level + 1}</span>
                <span>
                  {me.xpIntoLevel} / {me.xpPerLevel} XP · encore{" "}
                  {me.xpToNextLevel} XP
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-amber-500/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-300 transition-[width] duration-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Parcours des paliers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Défile horizontalement — palier = niveau de progression (XP).
        </p>
        <div className="mt-4 flex gap-0 overflow-x-auto pb-4 pt-2 [scrollbar-width:thin]">
          {tiers.map((row, idx) => {
            const past = me !== null && me.level > row.tier;
            const isCurrent = me !== null && me.level === row.tier;
            const locked = me !== null && me.level < row.tier;
            const rewardUnlocked = me !== null && me.level >= row.tier;
            const hasReward = row.reward !== null;
            return (
              <div key={row.tier} className="flex items-stretch">
                {idx > 0 ? (
                  <div
                    className={`relative top-8 h-0.5 w-4 shrink-0 sm:w-6 ${
                      me !== null && me.level >= row.tier
                        ? "bg-amber-500/50"
                        : "bg-zinc-800"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={[
                    "flex w-[100px] shrink-0 flex-col items-center rounded-xl border p-3 text-center sm:w-[112px]",
                    past
                      ? "border-amber-500/35 bg-amber-500/10"
                      : isCurrent
                        ? "border-amber-400/60 bg-amber-500/15 shadow-[0_0_24px_-8px_rgba(251,191,36,0.5)]"
                        : "border-white/10 bg-black/30",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold tabular-nums ring-2",
                      past
                        ? "bg-amber-500/30 text-amber-100 ring-amber-400/40"
                        : isCurrent
                          ? "bg-amber-400 text-amber-950 ring-amber-200"
                          : "bg-zinc-800 text-zinc-500 ring-zinc-700",
                    ].join(" ")}
                  >
                    {past ? "✓" : row.tier}
                  </div>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Palier {row.tier}
                  </p>
                  <p className="mt-1 text-[10px] tabular-nums text-zinc-600">
                    {row.xpRequired} XP
                  </p>
                  <div className="mt-2 min-h-[2.5rem] text-[10px] leading-snug text-zinc-400">
                    {hasReward ? (
                      <span
                        className={rewardUnlocked ? "text-amber-100/95" : ""}
                      >
                        {rewardLabel(row.reward!)}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </div>
                  {me ? (
                    <p className="mt-1 text-[9px] font-medium uppercase text-zinc-600">
                      {past
                        ? "Terminé"
                        : isCurrent
                          ? "En cours"
                          : locked
                            ? "Verrouillé"
                            : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Comment gagner de l&apos;XP</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Chaque ouverture de caisse compte. Formule :{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-amber-200/90">
            10 + min(18, ⌊prix caisse ÷ 4⌋)
          </code>{" "}
          XP par ouverture (multi-tirage : une fois par caisse). Abonnés{" "}
          <Link href="/premium" className="font-medium text-amber-300 hover:underline">
            Premium
          </Link>{" "}
          : +15 % d&apos;XP sur ces gains.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Exemple à {formatBSCoinAmount(DEMO_CASE_PRICE_CENTS)} BS Coin :{" "}
          <span className="font-medium text-zinc-300">{xpPerDemoOpen} XP</span>{" "}
          par ouverture (~
          {Math.ceil(XP_PER_LEVEL / xpPerDemoOpen)} ouvertures pour un palier).
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Récompenses par palier</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Paliers avec bonus BS Coin ou ouvertures gratuites.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Palier</th>
                <th className="px-4 py-3 font-medium">XP min.</th>
                <th className="px-4 py-3 font-medium">Récompense</th>
                {me ? (
                  <th className="hidden w-28 px-4 py-3 font-medium sm:table-cell">
                    État
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tiers
                .filter((t) => t.reward)
                .map((row) => {
                  const done = me !== null && me.level >= row.tier;
                  return (
                    <tr
                      key={row.tier}
                      className={
                        done
                          ? "bg-amber-500/[0.07]"
                          : "bg-transparent hover:bg-white/[0.02]"
                      }
                    >
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-100">
                        {row.tier}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-400">
                        {row.xpRequired}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {row.reward ? rewardLabel(row.reward) : "—"}
                      </td>
                      {me ? (
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {done ? (
                            <span className="text-xs font-medium text-amber-400/95">
                              Débloqué
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link
          href="/cases"
          className="font-medium text-amber-300 hover:text-amber-200 hover:underline"
        >
          Ouvrir des caisses
        </Link>{" "}
        pour faire progresser ton Battle Pass.
      </p>
    </main>
  );
}
