import { prisma } from "@/server/db";

/** Joueur démo (premier utilisateur) — sans auth réelle. */
export async function getDemoUser() {
  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
}
