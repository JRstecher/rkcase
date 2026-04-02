import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { getDemoUserId } from "@/server/seed";
import { pickWeightedIndex, seededUnitFloat } from "@/server/rng";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { caseSlug?: string; clientSeed?: string }
    | null;

  const caseSlug = body?.caseSlug?.toString() ?? "";
  const clientSeed = (body?.clientSeed?.toString() ?? "").slice(0, 64);

  if (!caseSlug) {
    return NextResponse.json({ error: "Missing caseSlug" }, { status: 400 });
  }

  const userId = await getDemoUserId();

  const c = await prisma.case.findUnique({
    where: { slug: caseSlug },
    include: { drops: { include: { item: true } } },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (c.drops.length === 0) {
    return NextResponse.json({ error: "Case has no drops" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "No user" }, { status: 500 });

  if (user.balance < c.price) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const serverSeed = randomBytes(24).toString("hex");
  const nonce = (await prisma.opening.count({ where: { userId } })) + 1;
  const effectiveClientSeed = clientSeed || "demo-client-seed";
  const u = seededUnitFloat({ serverSeed, clientSeed: effectiveClientSeed, nonce });

  const weights: number[] = [];
  for (const d of c.drops) weights.push(d.weight);
  const idx = pickWeightedIndex(weights, u);
  const won = c.drops[idx]!.item;

  const opening = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: c.price } },
    });

    const createdOpening = await tx.opening.create({
      data: {
        userId,
        caseId: c.id,
        clientSeed: effectiveClientSeed,
        serverSeed,
        nonce,
        pricePaid: c.price,
        wonItem: { connect: { id: won.id } },
      },
      include: { wonItem: true, case: true },
    });

    await tx.inventoryItem.create({
      data: { userId, itemId: won.id },
      include: { item: true },
    });

    const updatedUser = await tx.user.findUnique({ where: { id: userId } });

    return { createdOpening, updatedUser };
  });

  return NextResponse.json({
    balance: opening.updatedUser?.balance ?? null,
    opening: {
      id: opening.createdOpening.id,
      createdAt: opening.createdOpening.createdAt,
      case: {
        slug: opening.createdOpening.case.slug,
        name: opening.createdOpening.case.name,
        price: opening.createdOpening.case.price,
      },
      wonItem: opening.createdOpening.wonItem,
      fairness: {
        clientSeed: opening.createdOpening.clientSeed,
        serverSeed: opening.createdOpening.serverSeed,
        nonce: opening.createdOpening.nonce,
      },
    },
  });
}

