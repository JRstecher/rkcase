import { NavBar } from "@/components/NavBar";

const mockInventory = [
  { id: "inv_1", name: "Neon Knife", rarity: "epic", value: 1200 },
  { id: "inv_2", name: "Blue Fade Gloves", rarity: "rare", value: 540 },
  { id: "inv_3", name: "Sticker Pack", rarity: "common", value: 40 },
] as const;

export default function InventoryPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Inventaire
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Pour l’instant c’est mocké. On le rend persistant avec Prisma
              juste après.
            </p>
          </div>
          <div className="rk-card rounded-2xl px-4 py-3">
            <div className="text-xs text-white/60">Valeur (coins)</div>
            <div className="text-lg font-semibold text-white">
              {mockInventory
                .reduce((sum, it) => sum + it.value, 0)
                .toLocaleString("fr-FR")}
            </div>
          </div>
        </div>

        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {mockInventory.map((it) => (
            <li key={it.id} className="rk-card rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {it.rarity}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {it.name}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-white/60">Valeur</div>
                <div className="text-sm font-semibold text-white">
                  {it.value.toLocaleString("fr-FR")} coins
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  className="min-h-[44px] flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
                  aria-label={`Équiper ${it.name} (démonstration, non disponible)`}
                >
                  Équiper
                </button>
                <button
                  type="button"
                  className="min-h-[44px] flex-1 rounded-xl bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-100 ring-1 ring-indigo-300/20 hover:bg-indigo-500/15"
                  aria-label={`Vendre ${it.name} (démonstration, non disponible)`}
                >
                  Vendre (demo)
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

