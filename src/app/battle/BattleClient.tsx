"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import { formatCentsEUR } from "@/lib/money";
import { getSkinPreviewSrc } from "@/lib/skinVisual";

type CaseRow = { slug: string; name: string; price: number };

type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

type ApiItem = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  imageUrl: string | null;
};

type BattleRoll = {
  slotIndex: number;
  label: string;
  nonce: number;
  item: ApiItem;
};

type BattleResult = {
  balance: number | null;
  battle: {
    id: string;
    case: CaseRow;
    slots: number;
    winnerSlot: number;
    serverSeed: string;
    clientSeed: string;
    rolls: BattleRoll[];
  };
};

const slotOptions = [2, 3, 4] as const;

export function BattleClient({ cases }: { cases: CaseRow[] }) {
  const [slug, setSlug] = useState(() => cases[0]?.slug ?? "");
  const [slots, setSlots] = useState<(typeof slotOptions)[number]>(2);
  const [clientSeed, setClientSeed] = useState("demo-client-seed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);

  const selected = useMemo(
    () => cases.find((c) => c.slug === slug),
    [cases, slug],
  );

  const totalCost = selected ? selected.price * slots : 0;

  async function launch() {
    if (!slug || !selected) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/battle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseSlug: slug, slots, clientSeed }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Erreur serveur");
      }
      const json = (await r.json()) as BattleResult;
      setResult(json);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de lancer la battle.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (cases.length === 0) {
    return (
      <p className="text-sm text-white/70">
        Aucune caisse disponible. Reviens après le seed de la base.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Battle de caisses
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/70">
          Chaque participant ouvre la <strong className="text-white/90">même caisse</strong>{" "}
          en parallèle. Le drop le plus cher remporte la manche (égalité : avantage au slot le
          plus bas). En démo, vous payez{" "}
          <strong className="text-white/90">toutes les ouvertures</strong> (vous + rivaux
          simulés) et récupérez chaque skin dans votre inventaire.
        </p>
      </header>

      <section
        className="rk-card rounded-2xl p-5"
        aria-labelledby="battle-config-heading"
      >
        <h2
          id="battle-config-heading"
          className="text-lg font-semibold text-white"
        >
          Configuration
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="battle-case"
              className="text-xs font-semibold uppercase tracking-wide text-white/60"
            >
              Caisse
            </label>
            <select
              id="battle-case"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
            >
              {cases.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} — {formatCentsEUR(c.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Joueurs (slots)
              </legend>
              <div
                className="mt-2 flex flex-wrap gap-2"
                role="group"
                aria-label="Nombre de participants"
              >
                {slotOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSlots(n)}
                    aria-pressed={slots === n}
                    className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                      slots === n
                        ? "bg-indigo-500 text-white ring-indigo-400/40"
                        : "bg-white/5 text-white/85 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {n} joueurs
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="battle-seed"
            className="text-xs font-semibold uppercase tracking-wide text-white/60"
          >
            Client seed (fairness)
          </label>
          <input
            id="battle-seed"
            name="clientSeed"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            autoComplete="off"
            className="mt-2 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90 focus:border-indigo-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
          />
        </div>

        {selected ? (
          <p className="mt-4 text-sm text-white/70">
            Coût total :{" "}
            <span className="font-semibold text-white">
              {formatCentsEUR(totalCost)}
            </span>{" "}
            ({slots} × {formatCentsEUR(selected.price)})
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={launch}
            disabled={!selected || busy}
            aria-busy={busy}
            className="min-h-[44px] rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 enabled:hover:bg-indigo-400 disabled:opacity-50"
          >
            {busy ? "Battle en cours…" : "Lancer la battle"}
          </button>
          <Link
            href="/cases"
            className="text-sm font-medium text-indigo-200/90 hover:text-indigo-100"
          >
            ← Catalogue des cases
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        ) : null}
      </section>

      {result ? (
        <section
          className="rk-card rounded-2xl p-5"
          aria-live="polite"
          role="status"
        >
          <h2 className="text-lg font-semibold text-white">Résultat</h2>
          <p className="mt-1 text-sm text-white/65">
            Gagnant :{" "}
            <span className="font-semibold text-amber-200">
              {result.battle.rolls.find(
                (r) => r.slotIndex === result.battle.winnerSlot,
              )?.label ?? "—"}
            </span>{" "}
            · Nouveau solde :{" "}
            <span className="font-semibold text-white">
              {result.balance != null
                ? formatCentsEUR(result.balance)
                : "—"}
            </span>
          </p>

          <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {result.battle.rolls.map((r) => {
              const win = r.slotIndex === result.battle.winnerSlot;
              return (
                <li
                  key={r.slotIndex}
                  className={`rounded-2xl border p-4 ${
                    win
                      ? "border-amber-400/50 bg-amber-500/10 ring-2 ring-amber-400/30"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {r.label}
                    </span>
                    {win ? (
                      <span className="text-xs font-bold uppercase tracking-wide text-amber-200">
                        Gagnant
                      </span>
                    ) : null}
                  </div>
                  <div className="relative mt-3 aspect-[5/3] w-full overflow-hidden rounded-lg border border-white/10">
                    <SkinPreviewImage
                      src={getSkinPreviewSrc(r.item)}
                      alt={r.item.name}
                      fill
                      sizes="(max-width: 640px) 45vw, 200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {r.item.name}
                  </div>
                  <div className="mt-1 text-xs text-white/55">
                    {r.item.rarity} · {formatCentsEUR(r.item.value)}
                  </div>
                  <div className="mt-2 text-[10px] text-white/40">
                    nonce fairness : {r.nonce}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Seeds : clientSeed={result.battle.clientSeed} · serverSeed=
            {result.battle.serverSeed.slice(0, 14)}… · battleId={result.battle.id}
          </p>
        </section>
      ) : null}
    </div>
  );
}
