"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Me = {
  balance?: number;
  kycStatus?: string;
  kycVerifiedAt?: string | null;
};

const LABEL: Record<string, string> = {
  NONE: "Non vérifié",
  PENDING: "Vérification en cours",
  VERIFIED: "Identité vérifiée",
  FAILED: "Échec de vérification",
  CANCELED: "Annulé",
};

export function KycClient() {
  const searchParams = useSearchParams();
  const returned = searchParams.get("returned");

  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Me | null) => {
        if (j) setMe(j);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (returned !== "1") return;
    load();
    const id = window.setInterval(() => load(), 2500);
    const stop = window.setTimeout(() => window.clearInterval(id), 45_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [returned, load]);

  useEffect(() => {
    const onBal = () => load();
    window.addEventListener("casebs:balance", onBal);
    return () => window.removeEventListener("casebs:balance", onBal);
  }, [load]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/kyc/start", { method: "POST" });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error("Pas d’URL Stripe Identity.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, []);

  const status = me?.kycStatus ?? "NONE";
  const label = LABEL[status] ?? status;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Identité (KYC)</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white">
        Vérification d&apos;identité
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Vérification par{" "}
        <span className="text-zinc-300">Stripe Identity</span> : pièce
        d&apos;identité + selfie (comparaison visage). Les données sont traitées
        par Stripe selon leur politique.
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/95">
        Activez{" "}
        <strong className="font-semibold">Stripe Identity</strong> dans le
        dashboard Stripe et ajoutez les événements{" "}
        <code className="rounded bg-zinc-800 px-1">
          identity.verification_session.*
        </code>{" "}
        au même endpoint webhook que les paiements.
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Statut actuel
        </p>
        <p className="mt-1 text-lg font-semibold text-white">{label}</p>
        {me?.kycVerifiedAt ? (
          <p className="mt-1 text-xs text-zinc-500">
            Vérifié le :{" "}
            {new Date(me.kycVerifiedAt).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        ) : null}
      </div>

      {status !== "VERIFIED" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
          className="mt-6 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {busy ? "Redirection…" : "Lancer la vérification Stripe"}
        </button>
      ) : (
        <p className="mt-6 text-center text-sm text-emerald-300/95">
          Ton identité est vérifiée.
        </p>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/wallet" className="text-indigo-300 hover:underline">
          → Portefeuille
        </Link>
        <Link href="/cases" className="text-indigo-300 hover:underline">
          → Cases
        </Link>
      </div>
    </div>
  );
}
