"use client";

import { useEffect, useState } from "react";
import { BSCoinIcon } from "@/components/BSCoin";
import { formatBSCoinAmount } from "@/lib/money";

export function BalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/me")
        .then((r) => r.json())
        .then((j: { balance?: number }) =>
          setBalance(typeof j.balance === "number" ? j.balance : null),
        )
        .catch(() => setBalance(null));
    }
    load();
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ balance?: number }>;
      if (typeof ce.detail?.balance === "number") {
        setBalance(ce.detail.balance);
      }
    };
    window.addEventListener("casebs:balance", onUpdate);
    return () => window.removeEventListener("casebs:balance", onUpdate);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-2.5 py-2 text-xs text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-400/25">
        <BSCoinIcon size={26} className="drop-shadow-[0_0_6px_rgba(99,102,241,0.35)]" />
      </span>
      <div className="min-w-[4.5rem] pr-0.5">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          BS Coin
        </span>
        <span className="font-semibold tabular-nums text-white">
          {balance === null ? "…" : formatBSCoinAmount(balance)}
        </span>
      </div>
    </div>
  );
}
