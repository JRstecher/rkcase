"use client";

import { useEffect, useState } from "react";
import { formatCentsEUR } from "@/lib/money";

export function BalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: { balance?: number }) =>
        setBalance(typeof j.balance === "number" ? j.balance : null),
      )
      .catch(() => setBalance(null));
  }, []);

  return (
    <div
      className="rounded-lg border border-indigo-300/20 bg-black/40 px-3 py-2 text-sm text-white/80"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="text-white/70">Solde (démo) : </span>
      <span className="font-semibold text-white">
        {balance === null ? "…" : formatCentsEUR(balance)}
      </span>
    </div>
  );
}
