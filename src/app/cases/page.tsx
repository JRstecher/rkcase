import { CaseListingCard } from "@/components/CaseListingCard";
import { NavBar } from "@/components/NavBar";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  await ensureDemoSeed();
  const cases = await prisma.case.findMany({
    orderBy: { price: "asc" },
    select: { slug: true, name: true, price: true },
  });

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Cases</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Choisis une caisse pour lancer la roulette et remplir ton inventaire
          (démo SQLite + Prisma).
        </p>
        {cases.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">
            Aucune caisse en base — vérifie les migrations et le seed.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <li key={c.slug}>
                <CaseListingCard
                  slug={c.slug}
                  name={c.name}
                  price={c.price}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
