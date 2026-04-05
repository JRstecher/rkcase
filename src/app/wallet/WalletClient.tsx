"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCentsEUR } from "@/lib/money";

const PRESETS_EUR = [5, 10, 20, 50] as const;

type Props = {
  stripeConfigured: boolean;
};

export function WalletClient({ stripeConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paid = searchParams.get("paid");
  const canceled = searchParams.get("canceled");

  const [amountEur, setAmountEur] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint = useMemo(() => {
    if (paid === "1")
      return "Paiement reçu — le solde se met à jour après confirmation Stripe (webhook).";
    if (canceled === "1") return "Paiement annulé.";
    return null;
  }, [paid, canceled]);

  useEffect(() => {
    if (paid !== "1") return;
    void fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { balance?: number } | null) => {
        if (typeof j?.balance === "number") {
          window.dispatchEvent(
            new CustomEvent("casebs:balance", { detail: { balance: j.balance } }),
          );
        }
      });
  }, [paid]);

  const startCheckout = useCallback(async () => {
    if (!stripeConfigured || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountEur }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        throw new Error(j.error ?? "Erreur serveur");
      }
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error("Pas d’URL de paiement.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, [amountEur, busy, stripeConfigured]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Portefeuille</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white">Portefeuille</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Ajoutez des fonds en euros via Stripe (carte bancaire). Le solde in‑game
        est crédité en centimes, comme le reste du site.
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/95">
        <strong className="font-semibold">Légal &amp; prod :</strong> l’argent réel
        sur des mécaniques de type jeu / caisse est souvent réglementé (licence,
        KYC, âge). Ce flux est un socle technique ; vérifiez vos obligations avant
        mise en ligne.
      </div>

      {!stripeConfigured ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          Paiements désactivés : définissez{" "}
          <code className="rounded bg-zinc-800 px-1">STRIPE_SECRET_KEY</code> et{" "}
          <code className="rounded bg-zinc-800 px-1">STRIPE_WEBHOOK_SECRET</code>{" "}
          dans <code className="rounded bg-zinc-800 px-1">.env</code>, puis
          redémarrez le serveur. En local, utilisez les clés de{" "}
          <span className="text-white">test</span> Stripe et{" "}
          <code className="rounded bg-zinc-800 px-1">stripe listen</code> pour le
          webhook.
        </p>
      ) : null}

      {hint ? (
        <p
          className={`mt-4 text-sm ${
            canceled === "1" ? "text-amber-200/95" : "text-emerald-200/95"
          }`}
          role="status"
        >
          {hint}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Montant (€)
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS_EUR.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmountEur(n)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                amountEur === n
                  ? "border-indigo-400 bg-indigo-500/25 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"
              }`}
            >
              {n} €
            </button>
          ))}
        </div>
        <label className="block text-xs text-zinc-500">
          Autre montant (1 – 500 €)
          <input
            type="number"
            min={1}
            max={500}
            step={0.01}
            value={Number.isFinite(amountEur) ? amountEur : ""}
            onChange={(e) => setAmountEur(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <p className="text-xs text-zinc-500">
          Crédit prévu :{" "}
          <span className="font-medium text-zinc-300">
            {formatCentsEUR(Math.round(amountEur * 100))}
          </span>
        </p>

        <button
          type="button"
          disabled={!stripeConfigured || busy}
          onClick={() => void startCheckout()}
          className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
        >
          {busy ? "Redirection…" : "Payer avec Stripe"}
        </button>

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => router.push("/cases")}
          className="w-full text-sm text-indigo-300 hover:underline"
        >
          ← Retour aux cases
        </button>
      </div>
    </div>
  );
}
