import Link from "next/link";
import { NavBar } from "@/components/NavBar";

export default function AdminPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Admin (démo)
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Ici on branchera Prisma pour gérer Cases / Items / chances.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rk-card rounded-2xl p-5">
            <div className="text-sm font-semibold text-white">Cases</div>
            <div className="mt-2 text-sm text-white/70">
              Créer / modifier le prix, les drops, les probabilités.
            </div>
            <div className="mt-5">
              <Link
                href="/cases"
                className="inline-flex items-center rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
              >
                Voir les cases →
              </Link>
            </div>
          </div>

          <div className="rk-card rounded-2xl p-5">
            <div className="text-sm font-semibold text-white">Seed & demo data</div>
            <div className="mt-2 text-sm text-white/70">
              Un bouton “seed” pour remplir la DB avec des exemples.
            </div>
            <div className="mt-5">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="rounded-xl bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 ring-1 ring-indigo-300/20 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Seed (bientôt)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

