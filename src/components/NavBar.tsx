import Link from "next/link";
import { AuthNavButton } from "@/components/AuthNavButton";
import { BalanceBadge } from "@/components/BalanceBadge";
import { BattlePassBadge } from "@/components/BattlePassBadge";
import { PremiumMiniBadge } from "@/components/PremiumMiniBadge";
import { OnlinePlayersBadge } from "@/components/OnlinePlayersBadge";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-white"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/25 ring-1 ring-indigo-400/30">
              C
            </span>
            <span>
              <span className="text-white/90">Case</span>
              <span className="text-indigo-300">bs</span>
            </span>
            <span className="ml-1 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
              demo
            </span>
          </Link>
          <OnlinePlayersBadge />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <AuthNavButton />
          <PremiumMiniBadge />
          <BattlePassBadge />
          <BalanceBadge />
        </div>
      </div>
    </header>
  );
}
