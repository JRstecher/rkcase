import { Suspense } from "react";
import { WalletClient } from "./WalletClient";
import { NavBar } from "@/components/NavBar";
import { isStripeConfigured } from "@/server/stripe";

export default function WalletPage() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<div className="p-8 text-zinc-500">Chargement…</div>}>
        <WalletClient stripeConfigured={isStripeConfigured()} />
      </Suspense>
    </>
  );
}
