"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import { csgoTier } from "@/components/RouletteSkinCard";
import { BSCoinInline } from "@/components/BSCoin";
import { formatBSCoinLabel } from "@/lib/money";
import { getSkinPreviewSrc } from "@/lib/skinVisual";
import type { RouletteItem } from "@/lib/rouletteReel";

type InvRow = {
  id: string;
  createdAt: string;
  item: RouletteItem;
};

export function InventoryClient() {
  const [items, setItems] = useState<InvRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellingAll, setSellingAll] = useState(false);

  const totalInventoryCents = useMemo(
    () => (items ?? []).reduce((s, r) => s + r.item.value, 0),
    [items],
  );

  const busy = sellingId !== null || sellingAll;

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/inventory");
      if (!r.ok) throw new Error("Impossible de charger l’inventaire.");
      const j = (await r.json()) as { items: InvRow[] };
      setItems(j.items);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onInv = () => void load();
    window.addEventListener("casebs:inventory", onInv);
    return () => window.removeEventListener("casebs:inventory", onInv);
  }, [load]);

  async function sellAll() {
    if (busy || !items || items.length === 0) return;
    const ok = window.confirm(
      `Vendre les ${items.length} objet${items.length > 1 ? "s" : ""} pour ${formatBSCoinLabel(totalInventoryCents)} ? Cette action est définitive.`,
    );
    if (!ok) return;
    setSellingAll(true);
    setError(null);
    try {
      const r = await fetch("/api/inventory/sell-all", { method: "POST" });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Vente impossible");
      }
      const j = (await r.json()) as {
        balance?: number;
        soldCount?: number;
      };
      if (typeof j.balance === "number") {
        window.dispatchEvent(
          new CustomEvent("casebs:balance", { detail: { balance: j.balance } }),
        );
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSellingAll(false);
    }
  }

  async function sellOne(inventoryItemId: string) {
    if (busy) return;
    setSellingId(inventoryItemId);
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
          new CustomEvent("casebs:balance", { detail: { balance: j.balance } }),
        );
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSellingId(null);
    }
  }

  if (items === null) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">Chargement…</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Inventaire</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white">Inventaire</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Chaque skin gagné à l&apos;ouverture d&apos;une caisse est ajouté ici.
        Utilise <span className="font-medium text-zinc-300">Tout vendre</span>{" "}
        pour liquider tout l&apos;inventaire, ou{" "}
        <span className="font-medium text-zinc-300">Vendre cette arme</span> sur
        chaque carte pour les vendre une par une.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rk-card mt-8 p-8 text-center">
          <p className="text-sm text-zinc-400">
            Ton inventaire est vide pour l&apos;instant.
          </p>
          <Link
            href="/cases"
            className="mt-4 inline-flex rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Ouvrir des caisses
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              <span className="font-medium text-zinc-300">{items.length}</span>{" "}
              objet{items.length > 1 ? "s" : ""} · Valeur totale{" "}
              <span className="inline-flex items-center font-medium text-emerald-200/90">
                <BSCoinInline cents={totalInventoryCents} iconSize={14} />
              </span>
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sellAll()}
              className="shrink-0 rounded-xl border border-amber-500/45 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-40"
            >
              {sellingAll ? "Vente en cours…" : "Tout vendre l’inventaire"}
            </button>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((row) => (
            <li
              key={row.id}
              className="rk-card flex flex-col overflow-hidden border-white/10"
            >
              <div className="flex justify-center bg-gradient-to-b from-zinc-900/80 to-black/50 px-2 py-3">
                <div className="relative aspect-[4/3] w-full max-w-[120px] sm:max-w-[132px]">
                  <SkinPreviewImage
                    src={getSkinPreviewSrc(row.item)}
                    alt={row.item.name}
                    fill
                    sizes="(max-width:640px) 140px, 160px"
                    className="object-contain object-center"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-white sm:text-[13px]">
                  {row.item.name}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {csgoTier[row.item.rarity]} ·{" "}
                  <span className="inline-flex text-emerald-200/90">
                    <BSCoinInline cents={row.item.value} iconSize={12} />
                  </span>
                </p>
                <p className="text-[10px] text-zinc-600">
                  Obtenu le{" "}
                  {new Date(row.createdAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sellOne(row.id)}
                  className="mt-auto w-full rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40 sm:py-2 sm:text-xs"
                >
                  {sellingId === row.id
                    ? "Vente…"
                    : `Vendre cette arme (${formatBSCoinLabel(row.item.value)})`}
                </button>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
