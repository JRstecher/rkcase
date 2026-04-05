import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

const LIMIT = 50;

export async function GET() {
  await ensureDemoSeed();

  const users = await prisma.user.findMany({
    select: { id: true, displayName: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.displayName]));

  const [openingGroups, battleWinGroups, openingsWithItems, battleWinsWithRolls] =
    await Promise.all([
      prisma.opening.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
      prisma.caseBattle.groupBy({
        by: ["userId"],
        where: { winnerSlot: 0 },
        _count: { _all: true },
      }),
      prisma.opening.findMany({
        where: { wonItem: { isNot: null } },
        select: {
          userId: true,
          wonItem: { select: { value: true, name: true } },
        },
      }),
      prisma.caseBattle.findMany({
        where: { winnerSlot: 0 },
        select: {
          userId: true,
          rolls: { select: { item: { select: { value: true, name: true } } } },
        },
      }),
    ]);

  const openings = openingGroups
    .map((g) => ({
      userId: g.userId,
      displayName: nameById.get(g.userId) ?? "Joueur",
      openingsCount: g._count._all,
    }))
    .filter((r) => r.openingsCount > 0)
    .sort((a, b) => b.openingsCount - a.openingsCount)
    .slice(0, LIMIT)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const battleWins = battleWinGroups
    .map((g) => ({
      userId: g.userId,
      displayName: nameById.get(g.userId) ?? "Joueur",
      battlesWon: g._count._all,
    }))
    .filter((r) => r.battlesWon > 0)
    .sort((a, b) => b.battlesWon - a.battlesWon)
    .slice(0, LIMIT)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const bestByUser = new Map<string, { value: number; name: string }>();

  function considerDrop(
    userId: string,
    value: number,
    name: string,
  ) {
    const prev = bestByUser.get(userId);
    if (!prev || value > prev.value) {
      bestByUser.set(userId, { value, name });
    }
  }

  for (const o of openingsWithItems) {
    if (!o.wonItem) continue;
    considerDrop(o.userId, o.wonItem.value, o.wonItem.name);
  }

  for (const b of battleWinsWithRolls) {
    for (const r of b.rolls) {
      considerDrop(b.userId, r.item.value, r.item.name);
    }
  }

  const bestDrops = [...bestByUser.entries()]
    .map(([userId, { value, name }]) => ({
      userId,
      displayName: nameById.get(userId) ?? "Joueur",
      itemValueCents: value,
      itemName: name,
    }))
    .sort((a, b) => b.itemValueCents - a.itemValueCents)
    .slice(0, LIMIT)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return NextResponse.json({ openings, battleWins, bestDrops });
}
