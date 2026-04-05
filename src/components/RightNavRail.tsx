"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, NAV_MAIN_ITEMS } from "@/components/navMainItems";

export type RightNavRailProps = {
  id?: string;
  className?: string;
  /** Appelé après clic sur un lien (ex. fermer le panneau sur mobile). */
  onNavigate?: () => void;
};

export function RightNavRail({
  id = "right-nav-rail",
  className = "",
  onNavigate,
}: RightNavRailProps) {
  const pathname = usePathname() ?? "";

  return (
    <aside
      id={id}
      className={`sticky top-0 z-[35] flex h-dvh w-[5.25rem] shrink-0 flex-col border-l border-white/[0.07] bg-[#090a0f]/92 shadow-[-16px_0_48px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:w-[6.25rem] ${className}`}
      aria-label="Navigation principale"
    >
      <div className="shrink-0 border-b border-white/[0.06] px-2 py-3 sm:py-3.5">
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/90 text-sm font-semibold tracking-tight text-zinc-100 ring-1 ring-white/[0.08] transition-colors hover:bg-zinc-800/90 hover:ring-white/[0.12]"
          title="Casebs — Accueil"
        >
          C
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3 sm:px-2.5 sm:py-4 [scrollbar-color:rgba(255,255,255,0.12)_transparent] [scrollbar-width:thin]">
        {NAV_MAIN_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.Icon;

          return (
            <div key={item.href}>
              {item.railSectionLabel ? (
                <div
                  className="mb-2 mt-3 first:mt-0"
                  role="presentation"
                >
                  <div className="mx-auto mb-2 h-px w-8 bg-gradient-to-r from-transparent via-white/15 to-transparent sm:w-10" />
                  <p className="px-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600 sm:text-[10px]">
                    {item.railSectionLabel}
                  </p>
                </div>
              ) : null}
              <Link
                href={item.href}
                title={item.label}
                onClick={() => onNavigate?.()}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-center outline-none transition-colors duration-150 sm:gap-2 sm:py-3",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f]",
                  active
                    ? "bg-white/[0.06] text-zinc-50"
                    : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300",
                ].join(" ")}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.45)]"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 sm:h-10 sm:w-10",
                    active
                      ? "border-indigo-500/25 bg-indigo-500/15 text-indigo-200"
                      : "border-transparent bg-zinc-900/50 text-zinc-500 group-hover:border-white/[0.06] group-hover:bg-zinc-800/60 group-hover:text-zinc-300",
                  ].join(" ")}
                >
                  <Icon
                    className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]"
                    aria-hidden
                  />
                </span>
                <span className="line-clamp-2 w-full px-0.5 text-[10px] font-medium leading-tight tracking-tight sm:text-[11px] sm:leading-snug">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
