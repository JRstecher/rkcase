import { NavBar } from "@/components/NavBar";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";
import { BattleClient } from "./BattleClient";

export const dynamic = "force-dynamic";

export default async function BattlePage() {
  await ensureDemoSeed();
  const cases = await prisma.case.findMany({
    orderBy: { price: "asc" },
    select: { slug: true, name: true, price: true },
  });

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main>
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Battle de caisses
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Jusqu&apos;à 4 participants (toi inclus). Crée une battle, puis ajoute
            les bots un par un jusqu&apos;à la limite choisie. Tous ouvrent la même
            caisse ; tu peux enchaîner plusieurs manches. Gagnant = meilleure somme
            sur les manches ; égalité = départage provably fair. Si tu gagnes, tout
            le butin va dans ton inventaire.
          </p>
        </div>
        <BattleClient cases={cases} />
      </main>
    </div>
  );
}
