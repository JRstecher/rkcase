import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { getDemoUserId } from "@/server/seed";
import { pickWeightedIndex, seededUnitFloat } from "@/server/rng";

const SLOT_LABELS = ["Vous", "Rival 2", "Rival 3", "Rival 4"] as const;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { caseSlug?: string; slots?: number; clientSeed?: string }
    | null;

  const caseSlug = body?.caseSlug?.toString() ?? "";
  const slotsRaw = body?.slots;
  const slots =
    typeof slotsRaw === "number"
      ? slotsRaw
      : typeof slotsRaw === "string"
        ? Number.parseInt(slotsRaw, 10)
        : NaN;
  const clientSeed = (body?.clientSeed?.toString() ?? "").slice(0, 64);

  if (!caseSlug) {
    return NextResponse.json({ error: "Missing caseSlug" }, { status: 400 });
  }
  if (!Number.isFinite(slots) || slots < 2 || slots > 4) {
    return NextResponse.json(
      { error: "slots must be 2, 3 ou 4" },
      { status: 400 },
    );
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

  const totalCost = c.price * slots;
  if (user.balance < totalCost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const serverSeed = randomBytes(24).toString("hex");
  const effectiveClientSeed = clientSeed || "demo-client-seed";

  const weights: number[] = c.drops.map((d) => d.weight);

  type Picked = { slotIndex: number; label: string; nonce: number; item: typeof c.drops[0]["item"] };
  const picks: Picked[] = [];

  for (let slot = 0; slot < slots; slot++) {
    const nonce = slot + 1;
    const u = seededUnitFloat({
      serverSeed,
      clientSeed: effectiveClientSeed,
      nonce,
    });
    const idx = pickWeightedIndex(weights, u);
    const won = c.drops[idx]!.item;
    picks.push({
      slotIndex: slot,
      label: SLOT_LABELS[slot] ?? `Slot ${slot + 1}`,
      nonce,
      item: won,
    });
  }

  let winnerSlot = 0;
  let maxVal = -1;
  for (const p of picks) {
    if (p.item.value > maxVal) {
      maxVal = p.item.value;
      winnerSlot = p.slotIndex;
    }
  }

  const out = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalCost } },
    });

    const battle = await tx.caseBattle.create({
      data: {
        caseId: c.id,
        userId,
        slots,
        serverSeed,
        clientSeed: effectiveClientSeed,
        totalPaid: totalCost,
        winnerSlot,
      },
    });

    for (const p of picks) {
      await tx.caseBattleRoll.create({
        data: {
          battleId: battle.id,
          slotIndex: p.slotIndex,
          label: p.label,
          itemId: p.item.id,
          nonce: p.nonce,
        },
      });
      await tx.inventoryItem.create({
        data: { userId, itemId: p.item.id },
      });
    }

    const updatedUser = await tx.user.findUnique({ where: { id: userId } });

    const rolls = await tx.caseBattleRoll.findMany({
      where: { battleId: battle.id },
      orderBy: { slotIndex: "asc" },
      include: { item: true },
    });

    return { battle, updatedUser, rolls };
  });

  return NextResponse.json({
    balance: out.updatedUser?.balance ?? null,
    battle: {
      id: out.battle.id,
      createdAt: out.battle.createdAt,
      case: {
        slug: c.slug,
        name: c.name,
        price: c.price,
      },
      slots,
      winnerSlot: out.battle.winnerSlot,
      serverSeed: out.battle.serverSeed,
      clientSeed: out.battle.clientSeed,
      rolls: out.rolls.map((r) => ({
        slotIndex: r.slotIndex,
        label: r.label,
        nonce: r.nonce,
        item: r.item,
      })),
    },
  });
}
