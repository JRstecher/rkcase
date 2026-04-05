import { Suspense } from "react";
import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { PremiumClient } from "./PremiumClient";

export const metadata: Metadata = {
  title: "Premium — Casebs",
  description: "Abonnement Premium : bonus XP et avantages Casebs.",
};

export default function PremiumPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <Suspense
        fallback={
          <p className="py-16 text-center text-sm text-zinc-500">Chargement…</p>
        }
      >
        <PremiumClient />
      </Suspense>
    </div>
  );
}
