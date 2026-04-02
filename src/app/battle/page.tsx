import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";
import { BattleClient } from "./BattleClient";

export const metadata: Metadata = {
  title: "Battle de caisses — RKCase",
  description:
    "Ouvre la même caisse sur plusieurs slots : le meilleur drop gagne la manche (démo).",
};

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
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <BattleClient cases={cases} />
      </main>
    </div>
  );
}
