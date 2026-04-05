import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { itemId?: string; inventoryItemId?: string }
    | null;

  const inventoryItemId = body?.inventoryItemId?.toString() ?? "";
  const itemId = body?.itemId?.toString() ?? "";
  if (!inventoryItemId && !itemId) {
    return NextResponse.json(
      { error: "Missing inventoryItemId or itemId" },
      { status: 400 },
    );
  }

  const userId = await getCurrentUserId();

  const inv = inventoryItemId
    ? await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, userId },
        include: { item: true },
      })
    : await prisma.inventoryItem.findFirst({
        where: { userId, itemId },
        orderBy: { createdAt: "desc" },
        include: { item: true },
      });

  if (!inv) {
    return NextResponse.json(
      { error: "Item absent de l'inventaire" },
      { status: 404 },
    );
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.inventoryItem.delete({ where: { id: inv.id } });
    return tx.user.update({
      where: { id: userId },
      data: { balance: { increment: inv.item.value } },
    });
  });

  return NextResponse.json({ balance: updated.balance });
}
