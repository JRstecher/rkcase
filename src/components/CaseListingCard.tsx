import Image from "next/image";
import Link from "next/link";
import { BSCoinInline } from "@/components/BSCoin";
import {
  getDragonCaseArtSrc,
  getNihonCaseThumbSrc,
  getSakuraCaseBannerArtSrc,
} from "@/lib/caseTheme";

type Props = {
  slug: string;
  name: string;
  price: number;
};

/**
 * Carte caisse : visuel en haut, nom centré, prix en dessous (plus de bandeau horizontal type « rectangle »).
 */
export function CaseListingCard({ slug, name, price }: Props) {
  const isSakura = slug === "hell";
  const isNihon = slug === "nihon";
  const isDragon = slug === "dragon";
  const isThemed = isSakura || isNihon || isDragon;

  return (
    <Link
      href={`/cases/${slug}`}
      className={
        isThemed
          ? "group flex flex-col overflow-hidden rounded-2xl bg-transparent p-0 transition hover:opacity-95"
          : "rk-card group flex flex-col overflow-hidden p-0 transition hover:border-indigo-400/35 hover:shadow-indigo-500/10"
      }
    >
      {isSakura ? (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-t-2xl border-b border-pink-400/30 bg-black ring-1 ring-pink-400/20 ring-inset">
          <Image
            src={getSakuraCaseBannerArtSrc()}
            alt={name}
            fill
            className="object-contain object-center p-2 transition duration-300 group-hover:brightness-110"
            sizes="(max-width: 640px) 50vw, 200px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-rose-950/20"
            aria-hidden
          />
        </div>
      ) : isNihon ? (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-t-2xl border-b border-amber-500/25 bg-black ring-1 ring-amber-500/15 ring-inset">
          <Image
            src={getNihonCaseThumbSrc()}
            alt={name}
            fill
            className="object-contain object-center p-2 transition duration-300 group-hover:brightness-110"
            sizes="(max-width: 640px) 50vw, 200px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-amber-950/10"
            aria-hidden
          />
        </div>
      ) : isDragon ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
          <Image
            src={getDragonCaseArtSrc()}
            alt={name}
            fill
            className="object-contain object-center p-2 transition duration-300 group-hover:brightness-110"
            sizes="(max-width: 640px) 50vw, 200px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-cyan-950/20"
            aria-hidden
          />
        </div>
      ) : (
        <div className="relative aspect-[4/3] w-full bg-[#08060c]">
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center bg-gradient-to-b from-zinc-800/35 to-zinc-950/90 px-4">
            <span className="text-4xl font-black tracking-tight text-zinc-700 sm:text-5xl">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Caisse
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3 text-center">
        <span className="text-base font-semibold leading-snug text-white group-hover:text-indigo-100 sm:text-lg">
          {name}
        </span>
        <span className="flex justify-center text-sm font-semibold text-indigo-200/95">
          <BSCoinInline cents={price} iconSize={15} gapClass="gap-1.5" />
        </span>
        <span className="text-[11px] text-zinc-600">{slug}</span>
      </div>
    </Link>
  );
}
