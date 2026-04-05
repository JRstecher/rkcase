import Image from "next/image";
import { formatBSCoinAmount } from "@/lib/money";

export const BS_COIN_SRC = "/bs-coin.png";

type BSCoinIconProps = {
  className?: string;
  /** Taille en pixels (carré). */
  size?: number;
};

export function BSCoinIcon({ className = "", size = 16 }: BSCoinIconProps) {
  return (
    <Image
      src={BS_COIN_SRC}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
      aria-hidden
    />
  );
}

type BSCoinInlineProps = {
  cents: number;
  iconSize?: number;
  className?: string;
  gapClass?: string;
};

/** Montant in-game avec petite pièce BS à côté du nombre. */
export function BSCoinInline({
  cents,
  iconSize = 14,
  className = "",
  gapClass = "gap-1",
}: BSCoinInlineProps) {
  return (
    <span className={`inline-flex items-center ${gapClass} ${className}`}>
      <BSCoinIcon size={iconSize} />
      <span className="tabular-nums">{formatBSCoinAmount(cents)}</span>
    </span>
  );
}
