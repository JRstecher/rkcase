import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { BattlePassClient } from "./BattlePassClient";

export const metadata: Metadata = {
  title: "Battle Pass — Casebs",
  description: "Parcours saisonnier : XP, paliers et récompenses.",
};

export default function BattlePassPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <BattlePassClient />
    </div>
  );
}
