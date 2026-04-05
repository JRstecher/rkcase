import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";

export async function POST() {
  const userId = await getCurrentUserId();

  const out = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const rows = await tx.inventoryItem.findMany({
      where: { userId },
      include: { item: true },
    });

    if (rows.length === 0) {
      const u = await tx.user.findUnique({ where: { id: userId } });
      return {
        soldCount: 0,
        totalCents: 0,
        balance: u?.balance ?? 0,
      };
    }

    const totalCents = rows.reduce((sum, r) => sum + r.item.value, 0);
    await tx.inventoryItem.deleteMany({ where: { userId } });
    const u = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: totalCents } },
    });

    return {
      soldCount: rows.length,
      totalCents,
      balance: u.balance,
    };
  });

  return NextResponse.json(out);
}
