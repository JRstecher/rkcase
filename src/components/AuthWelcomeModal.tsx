"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  AUTH_WELCOME_DISMISSED_KEY,
  useAuthWelcomeModalControl,
} from "@/components/AuthWelcomeModalContext";

export type AuthProviderFlags = {
  google: boolean;
  facebook: boolean;
  apple: boolean;
  steam: boolean;
};

export function AuthWelcomeModal({ enabled }: { enabled: AuthProviderFlags }) {
  const { status } = useSession();
  const { reopenNonce } = useAuthWelcomeModalControl();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [steamId, setSteamId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setDismissed(localStorage.getItem(AUTH_WELCOME_DISMISSED_KEY) === "1");
      } catch {
        setDismissed(false);
      }
    });
  }, []);

  useEffect(() => {
    if (reopenNonce > 0) {
      queueMicrotask(() => setDismissed(false));
    }
  }, [reopenNonce]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/steam/me", { credentials: "include" });
        const j = (await r.json()) as { steamId: string | null };
        if (!cancelled) setSteamId(j.steamId);
      } catch {
        if (!cancelled) setSteamId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(AUTH_WELCOME_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const identified =
    status === "authenticated" || (steamId !== undefined && steamId !== null);
  const loading =
    status === "loading" ||
    steamId === undefined ||
    dismissed === null;
  const open = !loading && !identified && dismissed === false;

  const anyOAuth =
    enabled.google || enabled.facebook || enabled.apple || enabled.steam;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-welcome-title"
    >
      <div className="rk-card relative max-w-md border-white/15 p-6 shadow-2xl">
        <h2
          id="auth-welcome-title"
          className="text-lg font-semibold tracking-tight text-white"
        >
          Bienvenue sur Casebs
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Avec Google, tu as ton propre solde, ton pseudo sur le site et tu
          apparais dans les classements. Tu peux aussi continuer en mode démo sans
          compte.
        </p>

        {anyOAuth ? (
          <div className="mt-5 flex flex-col gap-2">
            {enabled.google ? (
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <span className="text-[15px]">G</span>
                Continuer avec Google
              </button>
            ) : null}
            {enabled.facebook ? (
              <button
                type="button"
                onClick={() => signIn("facebook", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1877f2]/40 bg-[#1877f2]/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1877f2]/30"
              >
                Continuer avec Facebook
              </button>
            ) : null}
            {enabled.apple ? (
              <button
                type="button"
                onClick={() => signIn("apple", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/50 px-4 py-3 text-sm font-medium text-white transition hover:bg-black/70"
              >
                Continuer avec Apple
              </button>
            ) : null}
            {enabled.steam ? (
              <Link
                href="/api/auth/steam/begin"
                prefetch={false}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#66c0f4]/35 bg-[#1b2838]/80 px-4 py-3 text-sm font-medium text-[#c7d5e0] transition hover:bg-[#1b2838]"
              >
                Continuer avec Steam
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-200/90">
            Aucun fournisseur OAuth n’est configuré. Ajoutez les variables{" "}
            <code className="rounded bg-black/40 px-1 text-xs">AUTH_*</code>{" "}
            (voir <code className="rounded bg-black/40 px-1 text-xs">.env.example</code>
            ).
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Continuer sans compte
          </button>
        </div>
      </div>
    </div>
  );
}
