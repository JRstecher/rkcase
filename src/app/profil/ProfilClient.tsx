"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type Me = {
  displayName?: string;
  isOAuthUser?: boolean;
};

export function ProfilClient() {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: Me) => {
        setMe(j);
        if (typeof j.displayName === "string") setPseudo(j.displayName);
      })
      .catch(() => setMe({}));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: pseudo }),
      });
      const j = (await r.json()) as { error?: string; displayName?: string };
      if (!r.ok) {
        setErr(j.error ?? "Enregistrement impossible.");
        return;
      }
      if (typeof j.displayName === "string") {
        setPseudo(j.displayName);
        setMsg("Pseudo enregistré.");
        window.dispatchEvent(new CustomEvent("casebs:profile"));
        load();
      }
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">Chargement…</p>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rk-card mx-auto mt-8 max-w-md p-8 text-center">
        <p className="text-sm text-zinc-400">
          Connecte-toi avec{" "}
          <span className="font-medium text-zinc-200">Google</span> pour créer un
          compte, choisir ton pseudo et apparaître dans le classement.
        </p>
        <p className="mt-4 text-xs text-zinc-600">
          Utilise le bouton « Se connecter » dans la barre du haut, ou la fenêtre
          d&apos;accueil si elle s&apos;affiche.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const oauthReady = me?.isOAuthUser === true;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Profil</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white">Mon profil</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Ton pseudo est visible sur le site et dans les classements. Il est distinct
        de ton nom Google.
      </p>

      <div className="rk-card mt-8 space-y-4 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Compte
          </p>
          <p className="mt-1 text-sm text-zinc-200">
            {session?.user?.email ?? "Connecté via Google"}
          </p>
        </div>

        {me === null ? (
          <p className="text-sm text-zinc-500">Chargement du profil…</p>
        ) : null}

        {me !== null && !oauthReady ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/95">
            Synchronisation du compte en cours… actualise la page dans un instant.
          </p>
        ) : null}

        <form onSubmit={(e) => void save(e)} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pseudo sur Casebs
            </span>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={32}
              autoComplete="nickname"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-400/50 focus:outline-none focus:ring-1 focus:ring-indigo-400/40"
              placeholder="Ex. ShadowFox"
              disabled={busy || me === null || !oauthReady}
            />
          </label>
          <p className="text-xs text-zinc-600">
            2 à 24 caractères : lettres, chiffres, espaces, tirets, underscores.
          </p>

          {err ? (
            <p className="text-sm text-red-300" role="alert">
              {err}
            </p>
          ) : null}
          {msg ? (
            <p className="text-sm text-emerald-300" role="status">
              {msg}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || me === null || !oauthReady}
            className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
          >
            {busy ? "Enregistrement…" : "Enregistrer le pseudo"}
          </button>
        </form>
      </div>
    </div>
  );
}
