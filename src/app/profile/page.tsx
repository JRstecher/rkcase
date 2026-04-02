import { NavBar } from "@/components/NavBar";

export default function ProfilePage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Profil
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Version démo (sans login). Ensuite on pourra ajouter une auth locale
          (email+mdp) si tu veux.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rk-card rounded-2xl p-5 lg:col-span-2">
            <div className="text-sm font-semibold text-white">Statistiques</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Ouvertures", v: "42" },
                { k: "Meilleur drop", v: "Epic" },
                { k: "Profit (demo)", v: "+1,240" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60">{s.k}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rk-card rounded-2xl p-5">
            <div className="text-sm font-semibold text-white">Préférences</div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-sm font-semibold text-white">Animations</div>
                <div className="text-xs text-white/60">Roulette + reveal</div>
              </div>
              <button
                type="button"
                className="min-h-[44px] rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/20 hover:bg-indigo-500/20"
                aria-pressed="true"
                aria-label="Animations de la roulette et du reveal : activées"
              >
                ON
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

