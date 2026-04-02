import Link from "next/link";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <section className="rk-card overflow-hidden rounded-2xl">
          <div className="relative px-6 py-10 sm:px-10">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                100% gratuit · 0 argent réel · inventaire démo
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Ouvre des cases,
                <span className="text-indigo-200"> gagne des drops</span>, crée
                ton inventaire.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Style “Hellcase” en mode démo: animations, raretés, probabilités
                visibles, historique, et inventaire. Aucun dépôt / retrait.
              </p>

              <div className="mt-7 flex flex-col flex-wrap gap-3 sm:flex-row">
                <Link
                  href="/cases"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                >
                  Voir les cases
                </Link>
                <Link
                  href="/inventory"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Mon inventaire
                </Link>
                <Link
                  href="/battle"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/15"
                >
                  Battle de caisses
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Drops & raretés",
              body: "Common → Legendary, couleurs, chances affichées.",
            },
            {
              title: "Ouverture animée",
              body: "Roulette / reveal + suspense (sans triche).",
            },
            {
              title: "Admin simple",
              body: "Créer cases & items, ajuster chances, seed démo.",
            },
          ].map((c) => (
            <div key={c.title} className="rk-card rounded-2xl p-5">
              <div className="text-sm font-semibold text-white">{c.title}</div>
              <div className="mt-2 text-sm leading-6 text-white/70">
                {c.body}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
