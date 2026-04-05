import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { ProfilClient } from "./ProfilClient";

export const metadata: Metadata = {
  title: "Profil — Casebs",
  description: "Pseudo et compte Casebs",
};

export default function ProfilPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main>
        <ProfilClient />
      </main>
    </div>
  );
}
