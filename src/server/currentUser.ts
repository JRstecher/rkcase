import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { STARTING_BALANCE_CENTS } from "@/lib/money";
import { prisma } from "@/server/db";
import { ensureDemoSeed, getDemoUserId } from "@/server/seed";

/**
 * Identifiant du joueur actuel : compte OAuth → User dédié ; sinon premier user démo (anonyme).
 */
export async function getCurrentUserId(): Promise<string> {
  await ensureDemoSeed();
  const session = await auth();
  if (!session?.user) {
    return getDemoUserId();
  }
  const sub = session.user.id?.trim();
  if (!sub) {
    return getDemoUserId();
  }

  const existing = await prisma.user.findUnique({
    where: { authSub: sub },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const name = (session.user.name?.trim() || "Joueur").slice(0, 80);

  try {
    const created = await prisma.user.create({
      data: {
        authSub: sub,
        displayName: name,
        balance: STARTING_BALANCE_CENTS,
      },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const again = await prisma.user.findUnique({
        where: { authSub: sub },
        select: { id: true },
      });
      if (again) return again.id;
    }
    throw e;
  }
}

export async function getCurrentUser() {
  const id = await getCurrentUserId();
  return prisma.user.findUnique({ where: { id } });
}
