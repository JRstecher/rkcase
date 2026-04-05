"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GIVEAWAY_SPEND_CENTS_PER_TICKET } from "@/lib/giveawayTickets";
import { formatBSCoinLabel } from "@/lib/money";
import { giveawayConfig } from "./giveawayConfig";

type MeGiveaway = {
  ticketsFromBattles: number;
  ticketsFromCaseSpend: number;
  totalTickets: number;
  caseSpendCents: number;
  centsUntilNextSpendTicket: number;
};

export function GiveawayClient() {
  const {
    active,
    title,
    subtitle,
    prizeSectionKicker,
    prizeSectionTitle,
    prizeIntro,
    prizeItems,
    prizeFootnote,
    endLabel,
    howItWorks,
    rules,
  } = giveawayConfig;

  const [giveaway, setGiveaway] = useState<MeGiveaway | null>(null);
  const [giveawayErr, setGiveawayErr] = useState<string | null>(null);

  const loadGiveaway = useCallback(async () => {
    try {
      const r = await fetch("/api/me");
      if (!r.ok) {
        setGiveawayErr("Impossible de charger tes tickets.");
        return;
      }
      const j = (await r.json()) as { giveaway?: MeGiveaway };
      if (j.giveaway) {
        setGiveaway(j.giveaway);
        setGiveawayErr(null);
      }
    } catch {
      setGiveawayErr("Impossible de charger tes tickets.");
    }
  }, []);

  useEffect(() => {
    void loadGiveaway();
  }, [loadGiveaway]);

  useEffect(() => {
    const onRefresh = () => void loadGiveaway();
    window.addEventListener("casebs:giveaway", onRefresh);
    return () => window.removeEventListener("casebs:giveaway", onRefresh);
  }, [loadGiveaway]);

  const G = GIVEAWAY_SPEND_CENTS_PER_TICKET;
  const spend = giveaway?.caseSpendCents ?? 0;
  const mod = spend % G;
  const spendBarRatio =
    mod === 0 && spend > 0 ? 0 : Math.min(1, Math.max(0, mod / G));

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] max-w-none -translate-x-1/2 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(251,191,36,0.12),transparent)]"
        aria-hidden
      />

      <nav className="relative text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Giveaway</span>
      </nav>

      <header className="relative mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
          Communauté
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-zinc-400">{subtitle}</p>
      </header>

      <section
        className="rk-card relative mt-10 overflow-hidden p-6 sm:p-8"
        aria-labelledby="giveaway-tickets"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="giveaway-tickets"
              className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
            >
              Tes tickets
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              1 battle gagné = 1 ticket · 1 ticket tous les{" "}
              {giveawayConfig.spendPerTicketLabel} dépensés en caisses (hors
              gratuits).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadGiveaway()}
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
          >
            Actualiser
          </button>
        </div>

        {giveawayErr ? (
          <p className="mt-4 text-sm text-amber-200/90">{giveawayErr}</p>
        ) : giveaway ? (
          <>
            <p className="mt-6 text-center text-5xl font-bold tabular-nums text-white sm:text-6xl">
              {giveaway.totalTickets}
            </p>
            <p className="mt-1 text-center text-sm text-zinc-500">
              ticket{giveaway.totalTickets > 1 ? "s" : ""} au total
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Battles gagnés
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-100">
                  {giveaway.ticketsFromBattles}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  <Link
                    href="/battle"
                    className="text-indigo-300 hover:text-indigo-200"
                  >
                    Lancer un battle →
                  </Link>
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Dépenses caisses
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-100">
                  {giveaway.ticketsFromCaseSpend}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Total payé :{" "}
                  <span className="font-medium text-zinc-400">
                    {formatBSCoinLabel(giveaway.caseSpendCents)}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Progression vers le prochain ticket (dépense)</span>
                <span className="tabular-nums text-zinc-400">
                  encore {formatBSCoinLabel(giveaway.centsUntilNextSpendTicket)}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800"
                role="progressbar"
                aria-valuenow={Math.round(spendBarRatio * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression dépense caisse pour un ticket"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-[width] duration-500"
                  style={{ width: `${spendBarRatio * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Chargement…</p>
        )}
      </section>

      <section
        className="relative mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#08090e]/90 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:rounded-3xl"
        aria-labelledby="giveaway-lot"
      >
        <div
          className="h-1 w-full bg-gradient-to-r from-amber-400/90 via-amber-500/60 to-rose-500/70"
          aria-hidden
        />
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {prizeSectionKicker}
              </p>
              <h2
                id="giveaway-lot"
                className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl"
              >
                {prizeSectionTitle}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">
                {prizeIntro}
              </p>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                active
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200/95"
                  : "border-zinc-600/50 bg-zinc-800/40 text-zinc-500"
              }`}
            >
              {active ? "Opération en cours" : "Hors période"}
            </span>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {prizeItems.map((item) => (
              <li
                key={item.title}
                className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.025] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
                  <h3 className="text-sm font-semibold leading-snug text-zinc-100 sm:text-[15px]">
                    {item.title}
                  </h3>
                  <span className="text-lg font-semibold tabular-nums tracking-tight text-amber-200/95 sm:text-xl">
                    {item.amount}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-4 border-t border-white/[0.06] pt-8">
            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm">
              {prizeFootnote}
            </p>
            <p className="text-xs leading-relaxed text-zinc-600">{endLabel}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
            <Link
              href="/cases"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
            >
              Ouvrir des caisses
            </Link>
            <Link
              href="/battle"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
            >
              Battle
            </Link>
            <Link
              href="/battle-pass"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
            >
              Battle Pass
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="giveaway-comment">
        <h2
          id="giveaway-comment"
          className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
        >
          Comment participer
        </h2>
        <ol className="mt-4 space-y-3">
          {howItWorks.map((line, i) => (
            <li
              key={i}
              className="rk-card flex gap-4 p-4 text-sm leading-relaxed text-zinc-300"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-200">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="giveaway-regles">
        <h2
          id="giveaway-regles"
          className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
        >
          Règles
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-400/90" aria-hidden>
                ·
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rk-card mt-10 p-6">
        <h2 className="text-sm font-semibold text-white">Une question ?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Écris-nous via le support pour t&apos;inscrire explicitement au tirage
          ou signaler un souci.
        </p>
        <Link
          href="/support"
          className="mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          Contacter le support →
        </Link>
      </section>
    </main>
  );
}
