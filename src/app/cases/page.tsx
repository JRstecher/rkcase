import Link from "next/link";
import { NavBar } from "@/components/NavBar";

export const dynamic = "force-dynamic";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";
import { formatCentsEUR } from "@/lib/money";

type Rarity = "common" | "rare" | "epic" | "legendary";

const rarityLabel: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const rarityClass: Record<Rarity, string> = {
  common: "text-zinc-200 ring-zinc-400/20 bg-white/5",
  rare: "text-sky-200 ring-sky-400/25 bg-sky-500/10",
  epic: "text-fuchsia-200 ring-fuchsia-400/25 bg-fuchsia-500/10",
  legendary: "text-amber-200 ring-amber-400/25 bg-amber-500/10",
};

function badgeForPrice(cents: number): Rarity {
  if (cents >= 50_000) return "legendary";
  if (cents >= 25_000) return "epic";
  if (cents >= 10_000) return "rare";
  return "common";
}

function teaserForPrice(cents: number) {
  if (cents >= 100_000) return "Sommet — jusqu’à 1000 €.";
  if (cents >= 10_000) return "Premium — grosses cotes.";
  if (cents >= 5000) return "Milieu de gamme.";
  if (cents >= 500) return "Prix doux.";
  return "Entrée de gamme — à partir de 0,20 €.";
}

export default async function CasesPage() {
  await ensureDemoSeed();
  const cases: { slug: string; name: string; price: number }[] =
    await prisma.case.findMany({
      orderBy: { price: "asc" },
      select: { slug: true, name: true, price: true },
    });

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Cases
          </h1>
          <p className="text-sm text-white/70">
            Démo gratuite — prix affichés en € (pas d’argent réel).{" "}
            <span className="text-white/90">
              {cases.length} caisses · 85 sous 100 € · 15 entre 100 € et 1000 €
            </span>
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const top = badgeForPrice(c.price);
            return (
              <Link
                key={c.slug}
                href={`/cases/${c.slug}`}
                className="rk-card group rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                aria-label={`Ouvrir la caisse ${c.name}, prix ${formatCentsEUR(c.price)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-white">
                      {c.name}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      {teaserForPrice(c.price)}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${rarityClass[top]}`}
                  >
                    {rarityLabel[top]}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-white/70">Prix</div>
                  <div className="text-base font-semibold text-white">
                    {formatCentsEUR(c.price)}
                  </div>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 group-hover:bg-white/10">
                  Ouvrir →
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
