"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "casebs_presence_id";
const HEARTBEAT_MS = 25_000;

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  }
}

export function OnlinePlayersBadge() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    async function ping() {
      try {
        const r = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!r.ok) return;
        const j = (await r.json()) as { online?: number };
        if (!cancelled && typeof j.online === "number") setOnline(j.online);
      } catch {
        if (!cancelled) setOnline(null);
      }
    }

    void ping();
    const id = window.setInterval(ping, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 to-emerald-600/5 px-2.5 py-1.5 text-[10px] font-semibold tabular-nums text-emerald-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      title="Estimation : navigateurs ayant envoyé un signal récemment (démo, mémoire serveur)."
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
        aria-hidden
      />
      {online === null ? (
        <span className="text-emerald-200/50">…</span>
      ) : (
        <span>
          {online} joueur{online > 1 ? "s" : ""} en ligne
        </span>
      )}
    </span>
  );
}
