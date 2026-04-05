import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  BATTLE_ROUNDS_MAX,
  BATTLE_ROUNDS_MIN,
  BATTLE_SLOTS_MAX,
  BATTLE_SLOTS_MIN,
} from "@/lib/battleConfig";
import { battleSlotLabel } from "@/lib/battleBots";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";
import { pickWeightedIndex, seededUnitFloat } from "@/server/rng";

export async function POST(req: Request) {
  try {
  const body = (await req.json().catch(() => null)) as
    | { caseSlug?: string; slots?: number; rounds?: number; clientSeed?: string }
    | null;

  const caseSlug = body?.caseSlug?.toString() ?? "";
  const rawSlots = Number(body?.slots);
  const slots = Math.trunc(rawSlots);
  const rawRounds = Number(body?.rounds ?? 1);
  const rounds = Math.trunc(rawRounds);
  const clientSeed = (body?.clientSeed?.toString() ?? "").slice(0, 64);

  if (!caseSlug) {
    return NextResponse.json({ error: "Missing caseSlug" }, { status: 400 });
  }
  if (
    !Number.isFinite(rawSlots) ||
    rawSlots !== slots ||
    slots < BATTLE_SLOTS_MIN ||
    slots > BATTLE_SLOTS_MAX
  ) {
    return NextResponse.json(
      {
        error: `slots (toi + bots) doit être un entier entre ${BATTLE_SLOTS_MIN} et ${BATTLE_SLOTS_MAX}`,
      },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(rawRounds) ||
    rawRounds !== rounds ||
    rounds < BATTLE_ROUNDS_MIN ||
    rounds > BATTLE_ROUNDS_MAX
  ) {
    return NextResponse.json(
      {
        error: `rounds (manches) doit être un entier entre ${BATTLE_ROUNDS_MIN} et ${BATTLE_ROUNDS_MAX}`,
      },
      { status: 400 },
    );
  }

  const userId = await getCurrentUserId();

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

  const totalPaid = c.price * slots * rounds;
  if (user.balance < totalPaid) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const serverSeed = randomBytes(24).toString("hex");
  const effectiveClientSeed = clientSeed || "demo-client-seed";
  const baseNonce =
    (await prisma.caseBattle.count()) * 100 + (await prisma.opening.count());

  const weights = c.drops.map((d) => d.weight);

  type Roll = {
    slotIndex: number;
    roundIndex: number;
    label: string;
    itemId: string;
    nonce: number;
    item: (typeof c.drops)[number]["item"];
  };

  const rolls: Roll[] = [];
  for (let round = 0; round < rounds; round++) {
    for (let s = 0; s < slots; s++) {
      const nonce = baseNonce + round * slots + s + 1;
      const u = seededUnitFloat({
        serverSeed,
        clientSeed: effectiveClientSeed,
        nonce,
      });
      const idx = pickWeightedIndex(weights, u);
      const drop = c.drops[idx]!;
      rolls.push({
        slotIndex: s,
        roundIndex: round,
        label: battleSlotLabel(s),
        itemId: drop.item.id,
        nonce,
        item: drop.item,
      });
    }
  }

  const slotTotals = new Map<number, number>();
  for (const r of rolls) {
    slotTotals.set(
      r.slotIndex,
      (slotTotals.get(r.slotIndex) ?? 0) + r.item.value,
    );
  }
  const best = Math.max(...slotTotals.values());
  const tiedSlots = [...slotTotals.entries()]
    .filter(([, v]) => v === best)
    .map(([slot]) => slot)
    .sort((a, b) => a - b);

  let winnerSlot: number;
  let tiebreaker: {
    nonce: number;
    tiedSlotIndices: number[];
    rollIndex: number;
  } | null = null;

  const tieNonce = baseNonce + rounds * slots + 1;

  if (tiedSlots.length === 1) {
    winnerSlot = tiedSlots[0]!;
  } else {
    const u = seededUnitFloat({
      serverSeed,
      clientSeed: effectiveClientSeed,
      nonce: tieNonce,
    });
    const rollIndex = Math.min(
      Math.floor(u * tiedSlots.length),
      tiedSlots.length - 1,
    );
    winnerSlot = tiedSlots[rollIndex]!;
    tiebreaker = {
      nonce: tieNonce,
      tiedSlotIndices: tiedSlots,
      rollIndex,
    };
  }

  const userWon = winnerSlot === 0;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalPaid } },
    });

    const battle = await tx.caseBattle.create({
      data: {
        caseId: c.id,
        userId,
        slots,
        rounds,
        serverSeed,
        clientSeed: effectiveClientSeed,
        totalPaid,
        winnerSlot,
      },
    });

    for (const r of rolls) {
      await tx.caseBattleRoll.create({
        data: {
          battleId: battle.id,
          slotIndex: r.slotIndex,
          roundIndex: r.roundIndex,
          label: r.label,
          itemId: r.itemId,
          nonce: r.nonce,
        },
      });
    }

    if (userWon) {
      for (const r of rolls) {
        await tx.inventoryItem.create({
          data: { userId, itemId: r.itemId },
        });
      }
    }

    const updatedUser = await tx.user.findUnique({ where: { id: userId } });
    return { battle, updatedUser };
  });

  const caseDrops = c.drops.map((d) => ({
    item: d.item,
    weight: d.weight,
  }));

  return NextResponse.json({
    balance: result.updatedUser?.balance ?? null,
    battle: {
      id: result.battle.id,
      case: { slug: c.slug, name: c.name, price: c.price },
      slots,
      rounds,
      winnerSlot,
      userWon,
      tiebreaker,
      serverSeed,
      clientSeed: effectiveClientSeed,
      rolls: rolls.map((r) => ({
        slotIndex: r.slotIndex,
        roundIndex: r.roundIndex,
        label: r.label,
        nonce: r.nonce,
        item: r.item,
      })),
      caseDrops,
    },
  });
  } catch (err) {
    console.error("[api/battle]", err);
    const message =
      err instanceof Error ? err.message : "Erreur serveur inattendue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
