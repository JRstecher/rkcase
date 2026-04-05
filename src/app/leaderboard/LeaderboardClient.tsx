"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BSCoinInline } from "@/components/BSCoin";
import { formatBSCoinLabel } from "@/lib/money";

type OpeningRow = {
  rank: number;
  userId: string;
  displayName: string;
  openingsCount: number;
};

type BattleRow = {
  rank: number;
  userId: string;
  displayName: string;
  battlesWon: number;
};

type DropRow = {
  rank: number;
  userId: string;
  displayName: string;
  itemValueCents: number;
  itemName: string;
};

type Payload = {
  openings: OpeningRow[];
  battleWins: BattleRow[];
  bestDrops: DropRow[];
};

const tabs = [
  { id: "openings" as const, label: "Ouvertures de caisses" },
  { id: "battles" as const, label: "Victoires battle" },
  { id: "drops" as const, label: "Meilleur drop" },
];

function rankStyle(rank: number) {
  if (rank === 1) return "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40";
  if (rank === 2) return "bg-zinc-400/20 text-zinc-100 ring-1 ring-zinc-400/30";
  if (rank === 3) return "bg-orange-700/25 text-orange-100 ring-1 ring-orange-500/35";
  return "bg-white/[0.06] text-zinc-300 ring-1 ring-white/10";
}

export function LeaderboardClient() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("openings");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch("/api/leaderboard")
      .then((r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        return r.json() as Promise<Payload>;
      })
      .then(setData)
      .catch(() => setError("Impossible de charger le classement."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Classement</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
        Classement
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Trois classements : caisses ouvertes, battles gagnées (tu es le joueur 1),
        et valeur du meilleur item obtenu (caisse ou battle gagnée). Connecte-toi avec
        Google (ou un autre fournisseur configuré) pour apparaître avec ton propre
        profil — sans connexion, tout le monde partage le compte démo.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "border border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/15 hover:text-zinc-200",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"
        >
          Actualiser
        </button>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <p className="mt-8 text-center text-sm text-zinc-500">Chargement…</p>
      ) : null}

      {data && tab === "openings" ? (
        <ol className="rk-card mt-6 divide-y divide-white/10 overflow-hidden p-0">
          {data.openings.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              Aucune ouverture enregistrée pour l’instant.
            </li>
          ) : (
            data.openings.map((r) => (
              <li
                key={r.userId}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankStyle(r.rank)}`}
                >
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-white">
                  {r.displayName}
                </span>
                <span className="shrink-0 tabular-nums text-indigo-200">
                  {r.openingsCount} ouverture{r.openingsCount > 1 ? "s" : ""}
                </span>
              </li>
            ))
          )}
        </ol>
      ) : null}

      {data && tab === "battles" ? (
        <ol className="rk-card mt-6 divide-y divide-white/10 overflow-hidden p-0">
          {data.battleWins.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              Aucune victoire en battle pour l’instant.
            </li>
          ) : (
            data.battleWins.map((r) => (
              <li
                key={r.userId}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankStyle(r.rank)}`}
                >
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-white">
                  {r.displayName}
                </span>
                <span className="shrink-0 tabular-nums text-indigo-200">
                  {r.battlesWon} victoire{r.battlesWon > 1 ? "s" : ""}
                </span>
              </li>
            ))
          )}
        </ol>
      ) : null}

      {data && tab === "drops" ? (
        <ol className="rk-card mt-6 divide-y divide-white/10 overflow-hidden p-0">
          {data.bestDrops.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              Aucun drop enregistré pour l’instant.
            </li>
          ) : (
            data.bestDrops.map((r) => (
              <li
                key={r.userId}
                className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-3"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankStyle(r.rank)}`}
                >
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">{r.displayName}</div>
                  <div className="truncate text-xs text-zinc-500">{r.itemName}</div>
                </div>
                <div className="shrink-0 text-emerald-200/95">
                  <BSCoinInline cents={r.itemValueCents} iconSize={14} />
                  <span className="sr-only">
                    {formatBSCoinLabel(r.itemValueCents)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ol>
      ) : null}
    </div>
  );
}
