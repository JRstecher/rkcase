"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function UserAccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [siteName, setSiteName] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadMe = () => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: { displayName?: string }) => {
        if (typeof j.displayName === "string") setSiteName(j.displayName);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    function onProfile() {
      loadMe();
    }
    window.addEventListener("casebs:profile", onProfile);
    return () => window.removeEventListener("casebs:profile", onProfile);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = siteName ?? session?.user?.name ?? "Compte";
  const img = session?.user?.image;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[200px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-indigo-400/35 hover:bg-white/[0.09]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {img ? (
          <Image
            src={img}
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded-lg object-cover ring-1 ring-white/15"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-[11px] font-bold text-indigo-100 ring-1 ring-indigo-400/25">
            {label.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden min-w-0 truncate sm:inline">{label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-xl border border-white/10 bg-[#12141c] py-1 shadow-xl shadow-black/50 ring-1 ring-white/5"
          role="menu"
        >
          <Link
            href="/profil"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.06]"
            onClick={() => setOpen(false)}
          >
            Mon profil · pseudo
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
