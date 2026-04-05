import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";

export async function GET() {
  const userId = await getCurrentUserId();

  const rows = await prisma.inventoryItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        select: {
          id: true,
          name: true,
          rarity: true,
          value: true,
          imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      item: r.item,
    })),
  });
}
