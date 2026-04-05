"use client";

import { AuthWelcomeModalProvider } from "@/components/AuthWelcomeModalContext";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  /** Session serveur (évite flash + état incohérent si absent). */
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
    >
      <AuthWelcomeModalProvider>{children}</AuthWelcomeModalProvider>
    </SessionProvider>
  );
}
