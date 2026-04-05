import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { AuthWelcomeModal } from "@/components/AuthWelcomeModal";
import { Providers } from "@/components/Providers";
import { RightNavShell } from "@/components/RightNavShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casebs — Ouverture de caisses (démo)",
  description:
    "Démo style case opening : caisses, battles, inventaire. Aucun argent réel.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const session = await auth();

  const authProviders = {
    google: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
    apple: Boolean(
      process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET,
    ),
    steam: true,
  };

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#07080c] text-zinc-100">
        <Providers session={session}>
          <RightNavShell>{children}</RightNavShell>
          <AuthWelcomeModal enabled={authProviders} />
        </Providers>
      </body>
    </html>
  );
}
