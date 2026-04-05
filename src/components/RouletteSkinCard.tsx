import { getSkinPreviewSrc } from "@/lib/skinVisual";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import type { RouletteItem } from "@/lib/rouletteReel";

export const csgoTier: Record<RouletteItem["rarity"], string> = {
  COMMON: "Mil-spec",
  RARE: "Restricted",
  EPIC: "Classified",
  LEGENDARY: "Covert",
};

const csgoFrame: Record<RouletteItem["rarity"], string> = {
  COMMON: "border-l-zinc-400",
  RARE: "border-l-sky-400",
  EPIC: "border-l-fuchsia-500",
  LEGENDARY: "border-l-amber-400",
};

const rarityBadge: Record<RouletteItem["rarity"], string> = {
  COMMON: "text-zinc-300",
  RARE: "text-sky-300",
  EPIC: "text-fuchsia-300",
  LEGENDARY: "text-amber-300",
};

export function RouletteSkinCard({ item }: { item: RouletteItem }) {
  return (
    <div
      className={`flex w-[120px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/10 border-l-4 bg-[#12141c] ${csgoFrame[item.rarity]}`}
    >
      <div className="relative aspect-[4/3] w-full bg-black/40">
        <SkinPreviewImage
          src={getSkinPreviewSrc(item)}
          alt={item.name}
          fill
          sizes="120px"
          className="object-cover object-center"
        />
      </div>
      <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
        <div
          className={`text-[8px] font-bold uppercase ${rarityBadge[item.rarity]}`}
        >
          {csgoTier[item.rarity]}
        </div>
        <div className="line-clamp-2 min-h-[2rem] text-[9px] font-semibold leading-tight text-white/90">
          {item.name}
        </div>
      </div>
    </div>
  );
}
