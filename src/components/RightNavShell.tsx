"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RightNavRail } from "@/components/RightNavRail";

function isMobileNav() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function RightNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(false);

  const closeRail = useCallback(() => setRailOpen(false), []);
  const toggleRail = useCallback(() => setRailOpen((v) => !v), []);

  useEffect(() => {
    if (isMobileNav()) closeRail();
  }, [pathname, closeRail]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setRailOpen(true);
  }, []);

  return (
    <>
      <div className="flex min-h-dvh">
        <div className="min-h-dvh min-w-0 flex-1">{children}</div>
        {railOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[46] bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
              aria-label="Fermer le menu de navigation"
              onClick={closeRail}
            />
            <RightNavRail
              onNavigate={() => {
                if (isMobileNav()) closeRail();
              }}
              className="max-lg:fixed max-lg:right-0 max-lg:top-0 max-lg:z-[47]"
            />
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={toggleRail}
        aria-expanded={railOpen}
        aria-controls={railOpen ? "right-nav-rail" : undefined}
        title={railOpen ? "Masquer le menu" : "Ouvrir le menu de navigation"}
        className={[
          "fixed bottom-6 z-[50] flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12] bg-zinc-900/95 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200",
          "hover:border-indigo-500/35 hover:bg-zinc-800/95 hover:text-white",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/60",
          railOpen
            ? "max-lg:right-[calc(5.25rem+0.75rem)] right-[calc(5.25rem+1rem)] sm:right-[calc(6.25rem+1rem)]"
            : "right-4 sm:right-5",
        ].join(" ")}
      >
        {railOpen ? (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="18" rx="1" />
          </svg>
        )}
        <span className="sr-only">
          {railOpen ? "Masquer le menu" : "Menu navigation"}
        </span>
      </button>
    </>
  );
}
