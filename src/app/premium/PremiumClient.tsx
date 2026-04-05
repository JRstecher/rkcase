"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PREMIUM_XP_MULTIPLIER } from "@/lib/premium";

const priceLabel =
  process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL?.trim() || "Abonnement mensuel";

export function PremiumClient() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  const [me, setMe] = useState<{
    isPremium: boolean;
    premiumUntil: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const load = useCallback(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(
        (j: {
          isPremium?: boolean;
          premiumUntil?: string | null;
          error?: string;
        }) => {
          if (typeof j.isPremium === "boolean") {
            setMe({
              isPremium: j.isPremium,
              premiumUntil: j.premiumUntil ?? null,
            });
          } else {
            setMe(null);
          }
        },
      )
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    load();
  }, [load, checkout]);

  useEffect(() => {
    fetch("/api/checkout/premium")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) =>
        setConfigured(j.configured === true),
      )
      .catch(() => setConfigured(false));
  }, []);

  async function subscribe() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/checkout/premium", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url) {
        setErr(j.error ?? "Impossible de démarrer le paiement.");
        return;
      }
      window.location.href = j.url;
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  const untilFmt =
    me?.premiumUntil != null
      ? new Date(me.premiumUntil).toLocaleString("fr-FR", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Premium</span>
      </nav>

      <div className="mt-6 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/90 via-[#0c0e14] to-violet-950/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/20 text-2xl ring-1 ring-amber-400/40">
            ★
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
              Casebs
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Abonnement Premium
            </h1>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
          Soutiens le projet et débloque des avantages en jeu. Paiement sécurisé
          par Stripe (abonnement avec renouvellement automatique ; géré depuis ton
          portail client Stripe après souscription).
        </p>
      </div>

      {checkout === "success" ? (
        <p
          className="mt-6 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          Paiement pris en compte. Ton statut Premium se met à jour après
          confirmation du webhook Stripe (quelques secondes). Actualise la page
          si besoin.
        </p>
      ) : null}
      {checkout === "cancel" ? (
        <p className="mt-6 rounded-xl border border-zinc-600/40 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300">
          Paiement annulé. Tu peux réessayer quand tu veux.
        </p>
      ) : null}

      {me?.isPremium ? (
        <div className="rk-card mt-8 border-amber-500/25 bg-amber-500/5 p-5">
          <p className="text-sm font-semibold text-amber-100">
            Tu es membre Premium
          </p>
          {untilFmt ? (
            <p className="mt-1 text-sm text-zinc-400">
              Actif au moins jusqu&apos;au{" "}
              <span className="font-medium text-zinc-200">{untilFmt}</span>{" "}
              (période courante Stripe).
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Avantages</h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-300">
          <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-amber-400" aria-hidden>
              ⚡
            </span>
            <span>
              <span className="font-medium text-white">
                +{Math.round((PREMIUM_XP_MULTIPLIER - 1) * 100)} % d&apos;XP
              </span>{" "}
              sur chaque ouverture de caisse — ton Battle Pass avance plus vite.
            </span>
          </li>
          <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-amber-400" aria-hidden>
              ✦
            </span>
            <span>
              <span className="font-medium text-white">Badge visuel</span> (à
              terme : couronne ou cadre profil) — la base technique est prête côté
              statut <code className="rounded bg-black/40 px-1 text-xs">isPremium</code>.
            </span>
          </li>
          <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-amber-400" aria-hidden>
              ♥
            </span>
            <span>
              <span className="font-medium text-white">Soutien</span> au
              développement : nouvelles caisses, modes de jeu et contenus.
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-[#0c0e14] p-6">
        <p className="text-sm text-zinc-400">
          <span className="font-semibold text-zinc-200">{priceLabel}</span>
          {configured === false ? (
            <span className="mt-2 block text-amber-200/90">
              Côté serveur : ajoute{" "}
              <code className="rounded bg-black/50 px-1.5 py-0.5 text-xs">
                STRIPE_PREMIUM_PRICE_ID
              </code>{" "}
              (prix récurrent créé dans le dashboard Stripe) et configure le
              webhook pour{" "}
              <code className="rounded bg-black/50 px-1 text-[11px]">
                customer.subscription.updated
              </code>{" "}
              et{" "}
              <code className="rounded bg-black/50 px-1 text-[11px]">
                customer.subscription.deleted
              </code>
              .
            </span>
          ) : null}
        </p>

        {err ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {err}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={
              busy || me?.isPremium || configured === false || configured === null
            }
            onClick={() => void subscribe()}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-amber-950 shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40"
          >
            {busy ? "Redirection…" : me?.isPremium ? "Déjà Premium" : "S’abonner"}
          </button>
          <Link
            href="/cases"
            className="inline-flex items-center rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-white/25 hover:text-white"
          >
            Retour aux caisses
          </Link>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-zinc-600">
        Les abonnements sont facturés par Stripe. Annulation et facturation selon
        les conditions affichées sur la page de paiement Stripe.
      </p>
    </main>
  );
}
