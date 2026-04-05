import Link from "next/link";
import { CasebsHeroLogo } from "@/components/CasebsHeroLogo";
import { CaseListingCard } from "@/components/CaseListingCard";
import { NavBar } from "@/components/NavBar";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

export const dynamic = "force-dynamic";

function IconCase() {
  return (
    <svg
      className="h-6 w-6 text-indigo-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function IconSwords() {
  return (
    <svg
      className="h-6 w-6 text-indigo-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      className="h-6 w-6 text-indigo-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

const highlights = [
  {
    title: "Ouverture de caisses",
    text: "Roulette fluide, suspense sur le bandeau, puis révélation du skin — inventaire mis à jour tout de suite.",
    icon: IconCase,
  },
  {
    title: "Battle",
    text: "Plusieurs joueurs sur la même caisse : le meilleur drop remporte la manche. Idéal pour comparer la chance.",
    icon: IconSwords,
  },
  {
    title: "Transparence",
    text: "RNG avec graines (client / serveur / nonce) pour le tirage — démo locale, aucun argent réel.",
    icon: IconShield,
  },
] as const;

export default async function Home() {
  await ensureDemoSeed();
  const cases = await prisma.case.findMany({
    orderBy: { price: "asc" },
    select: { slug: true, name: true, price: true },
  });

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main id="contenu-principal">
        <div className="relative overflow-hidden border-b border-white/[0.06]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.28),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <CasebsHeroLogo />

            <section
              className="mt-2 border-t border-white/10 pt-8 sm:mt-4 sm:pt-10"
              aria-labelledby="apercu-cases"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2
                    id="apercu-cases"
                    className="text-lg font-semibold text-white sm:text-xl"
                  >
                    Aperçu des caisses
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Clique sur une caisse pour voir les skins et ouvrir.
                  </p>
                </div>
                <Link
                  href="/cases"
                  className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
                >
                  Toutes les cases →
                </Link>
              </div>

              {cases.length === 0 ? (
                <p className="rk-card mt-6 p-6 text-sm text-zinc-500">
                  Aucune caisse en base — lance les migrations et le seed si besoin.
                </p>
              ) : (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cases.slice(0, 6).map((c) => (
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
              {cases.length > 6 ? (
                <p className="mt-4 text-center text-sm text-zinc-500">
                  {cases.length - 6 === 1 ? (
                    <>
                      <Link
                        href="/cases"
                        className="font-medium text-indigo-300 hover:text-indigo-200"
                      >
                        1 autre caisse
                      </Link>{" "}
                      sur la liste complète.
                    </>
                  ) : (
                    <>
                      <Link
                        href="/cases"
                        className="font-medium text-indigo-300 hover:text-indigo-200"
                      >
                        {cases.length - 6} autres caisses
                      </Link>{" "}
                      sur la liste complète.
                    </>
                  )}
                </p>
              ) : null}
            </section>

            <h1 className="mt-10 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:mt-12 sm:text-5xl sm:leading-[1.1]">
              Ouvre des caisses,{" "}
              <span className="bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                gagne des skins
              </span>
              <br className="hidden sm:block" />
              <span className="text-zinc-300">comme un case opening.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              <strong className="font-medium text-zinc-200">Casebs</strong> te
              propose des caisses thématiques, une roulette animée et des battles
              entre drops — tout tourne en local, sans dépôt ni retrait.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/cases"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                Parcourir les cases
              </Link>
              <Link
                href="/battle"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Lancer un battle
              </Link>
            </div>

            <div className="mt-10 flex justify-center sm:mt-12">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Démo locale · BS Coin fictifs
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
          <section className="mb-12 sm:mb-14" aria-labelledby="accueil-giveaway">
            <div className="rk-card relative overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-rose-500/[0.05] p-6 sm:p-8">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Giveaway
                  </p>
                  <h2
                    id="accueil-giveaway"
                    className="mt-1 text-xl font-semibold text-white sm:text-2xl"
                  >
                    Tirages et récompenses communautaires
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Découvre le lot du moment, les étapes pour participer et les
                    règles — tout est centralisé sur la page dédiée.
                  </p>
                </div>
                <Link
                  href="/giveaway"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  Voir le giveaway
                </Link>
              </div>
            </div>
          </section>

          <section aria-labelledby="pourquoi-casebs">
            <h2
              id="pourquoi-casebs"
              className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
            >
              En bref
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {highlights.map(({ title, text, icon: Icon }) => (
                <div key={title} className="rk-card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-4 border-t border-white/10 pt-8 text-center text-xs leading-relaxed text-zinc-600">
            Projet de démonstration — pas de monnaie réelle, pas de marché secondaire.
            Les probabilités affichées sont indicatives.
          </p>
        </div>
      </main>
    </div>
  );
}
