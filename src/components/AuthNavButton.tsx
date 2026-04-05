"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAuthWelcomeModalControl } from "@/components/AuthWelcomeModalContext";
import { UserAccountMenu } from "@/components/UserAccountMenu";

export function AuthNavButton() {
  const { status } = useSession();
  const { openAuthWelcomeModal } = useAuthWelcomeModalControl();
  const [steamId, setSteamId] = useState<string | null | undefined>(undefined);

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

  const loading =
    status === "loading" || steamId === undefined;
  const identified =
    status === "authenticated" || steamId !== null;

  if (status === "authenticated") {
    return <UserAccountMenu />;
  }

  if (loading || identified) return null;

  return (
    <button
      type="button"
      onClick={openAuthWelcomeModal}
      className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-b from-indigo-500/25 to-indigo-600/10 px-3 py-2 text-xs font-semibold tracking-wide text-indigo-50 shadow-[0_0_20px_-10px_rgba(99,102,241,0.55)] transition hover:border-indigo-300/55 hover:from-indigo-500/35 hover:to-indigo-600/15"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/35 text-indigo-100 ring-1 ring-indigo-400/30">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
      <span className="hidden sm:inline">Se connecter</span>
    </button>
  );
}
