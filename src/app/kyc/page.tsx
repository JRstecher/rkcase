import { Suspense } from "react";
import { KycClient } from "./KycClient";
import { NavBar } from "@/components/NavBar";

export default function KycPage() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<div className="p-8 text-zinc-500">Chargement…</div>}>
        <KycClient />
      </Suspense>
    </>
  );
}
