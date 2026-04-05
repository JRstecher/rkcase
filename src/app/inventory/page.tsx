import { Suspense } from "react";
import { InventoryClient } from "./InventoryClient";
import { NavBar } from "@/components/NavBar";

export default function InventoryPage() {
  return (
    <>
      <NavBar />
      <Suspense
        fallback={<div className="p-8 text-center text-zinc-500">Chargement…</div>}
      >
        <InventoryClient />
      </Suspense>
    </>
  );
}
