"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Petit indicateur si le joueur a un abonnement Premium actif. */
export function PremiumMiniBadge() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: { isPremium?: boolean }) => {
        if (j.isPremium === true) setOn(true);
      })
      .catch(() => {});
  }, []);

  if (!on) return null;

  return (
    <Link
      href="/premium"
      className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200 shadow-[0_0_12px_-4px_rgba(251,191,36,0.6)] hover:border-amber-300/60 hover:bg-amber-500/25"
      title="Abonnement Premium actif"
    >
      Pro
    </Link>
  );
}
