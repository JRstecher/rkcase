import Link from "next/link";
import { BalanceBadge } from "@/components/BalanceBadge";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/cases", label: "Cases" },
  { href: "/battle", label: "Battle" },
  { href: "/inventory", label: "Inventaire" },
  { href: "/profile", label: "Profil" },
  { href: "/admin", label: "Admin" },
] as const;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/35 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="group inline-flex min-h-[44px] min-w-[44px] items-center gap-2 font-semibold tracking-tight"
          aria-label="RKCase — Accueil (démo)"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-300/30"
            aria-hidden="true"
          >
            RK
          </span>
          <span className="text-white">
            <span className="text-white/80 group-hover:text-white">RK</span>
            <span className="text-indigo-200 group-hover:text-indigo-100">
              Case
            </span>
          </span>
          <span className="ml-2 rounded-full border border-indigo-300/25 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-100">
            demo
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="order-3 flex w-full basis-full flex-wrap items-center justify-center gap-1 sm:order-none sm:w-auto sm:basis-auto sm:justify-end"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:ml-auto">
          <BalanceBadge />
          <Link
            href="/cases"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
          >
            Ouvrir
          </Link>
        </div>
      </div>
    </header>
  );
}
