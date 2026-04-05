import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { applyPremiumXpBonus, isPremiumActive } from "@/lib/premium";
import {
  collectLevelEnterRewards,
  levelFromTotalXp,
  xpIntoCurrentLevel,
  xpPerCaseOpen,
  XP_PER_LEVEL,
} from "@/lib/playerLevel";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";
import { stopOffsetPxFromUnit } from "@/lib/rouletteReel";
import {
  pickWeightedIndex,
  seededUnitFloat,
  seededUnitFloatForPurpose,
} from "@/server/rng";

/** Nombre de caisses ouvertes en une requête (transaction unique). */
function parseCount(raw: unknown): number | null {
  if (raw === undefined || raw === null) return 1;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { caseSlug?: string; clientSeed?: string; count?: unknown }
    | null;

  const caseSlug = body?.caseSlug?.toString() ?? "";
  const clientSeed = (body?.clientSeed?.toString() ?? "").slice(0, 64);
  const count = parseCount(body?.count);

  if (!caseSlug) {
    return NextResponse.json({ error: "Missing caseSlug" }, { status: 400 });
  }
  if (count === null) {
    return NextResponse.json(
      {
        error:
          "count invalide — valeurs acceptées : 1 à 10 (entier)",
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

  const weights = c.drops.map((d) => d.weight);

  type RollPreview = {
    serverSeed: string;
    nonce: number;
    wonItemId: string;
    rouletteStopOffsetPx: number;
    pricePaid: number;
  };

  const effectiveClientSeed = clientSeed || "demo-client-seed";

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("NO_USER");

      const balance0 = Number(user.balance) || 0;
      const xp0 = Number(user.xp) || 0;
      const free0 = Number(user.freeCaseOpens) || 0;
      const rewarded0 =
        user.enterLevelRewardedUpTo == null
          ? 1
          : Math.max(1, Number(user.enterLevelRewardedUpTo) || 1);

      const freeRem = Math.min(count, free0);
      const paidCount = count - freeRem;
      const cost = paidCount * c.price;
      if (balance0 < cost) throw new Error("NOT_ENOUGH");

      const baseXp = xpPerCaseOpen(c.price) * count;
      const xpGain = applyPremiumXpBonus(
        baseXp,
        isPremiumActive(user.premiumUntil),
      );
      const newXp = xp0 + xpGain;
      const oldLevel = levelFromTotalXp(xp0);
      const newLevel = levelFromTotalXp(newXp);
      const { grants, balanceSum, freeOpensSum } = collectLevelEnterRewards(
        rewarded0,
        newLevel,
      );

      const baseNonce = await tx.opening.count({ where: { userId } });

      const rolls: RollPreview[] = [];
      for (let i = 0; i < count; i++) {
        const serverSeed = randomBytes(24).toString("hex");
        const nonce = baseNonce + i + 1;
        const u = seededUnitFloat({
          serverSeed,
          clientSeed: effectiveClientSeed,
          nonce,
        });
        const uStop = seededUnitFloatForPurpose(
          {
            serverSeed,
            clientSeed: effectiveClientSeed,
            nonce,
          },
          "roulette-stop-offset",
        );
        const rouletteStopOffsetPx = stopOffsetPxFromUnit(uStop);
        const idx = pickWeightedIndex(weights, u);
        const won = c.drops[idx]!.item;
        const usedFree = i < freeRem;
        rolls.push({
          serverSeed,
          nonce,
          wonItemId: won.id,
          rouletteStopOffsetPx,
          pricePaid: usedFree ? 0 : c.price,
        });
      }

      const nextBalance = balance0 - cost + balanceSum;
      const nextFree = Math.max(0, free0 - freeRem + freeOpensSum);

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: nextBalance,
          freeCaseOpens: nextFree,
          xp: newXp,
          enterLevelRewardedUpTo: newLevel,
        },
      });

      const openingsOut: {
        id: string;
        inventoryItemId: string;
        createdAt: Date;
        wonItem: (typeof c.drops)[0]["item"];
        clientSeed: string;
        serverSeed: string;
        nonce: number;
        rouletteStopOffsetPx: number;
      }[] = [];

      for (const roll of rolls) {
        const createdOpening = await tx.opening.create({
          data: {
            userId,
            caseId: c.id,
            clientSeed: effectiveClientSeed,
            serverSeed: roll.serverSeed,
            nonce: roll.nonce,
            pricePaid: roll.pricePaid,
            wonItem: { connect: { id: roll.wonItemId } },
          },
          include: { wonItem: true, case: true },
        });

        const invRow = await tx.inventoryItem.create({
          data: { userId, itemId: roll.wonItemId },
        });

        openingsOut.push({
          id: createdOpening.id,
          inventoryItemId: invRow.id,
          createdAt: createdOpening.createdAt,
          wonItem: createdOpening.wonItem!,
          clientSeed: createdOpening.clientSeed,
          serverSeed: createdOpening.serverSeed,
          nonce: createdOpening.nonce,
          rouletteStopOffsetPx: roll.rouletteStopOffsetPx,
        });
      }

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      return {
        openingsOut,
        updatedUser,
        grants,
        oldLevel,
        newLevel,
        freeSlotsUsed: freeRem,
      };
    });

    const u = result.updatedUser;
    const openings = result.openingsOut.map((o) => ({
      id: o.id,
      inventoryItemId: o.inventoryItemId,
      createdAt: o.createdAt,
      case: {
        slug: c.slug,
        name: c.name,
        price: c.price,
      },
      wonItem: o.wonItem,
      fairness: {
        clientSeed: o.clientSeed,
        serverSeed: o.serverSeed,
        nonce: o.nonce,
      },
      rouletteStopOffsetPx: o.rouletteStopOffsetPx,
    }));

    const progress =
      u != null
        ? {
            xp: u.xp,
            level: levelFromTotalXp(u.xp),
            freeCaseOpens: u.freeCaseOpens,
            xpIntoLevel: xpIntoCurrentLevel(u.xp),
            xpPerLevel: XP_PER_LEVEL,
            freeOpensUsedThisRequest: result.freeSlotsUsed,
            levelUp:
              result.newLevel > result.oldLevel
                ? { level: result.newLevel, grants: result.grants }
                : undefined,
          }
        : undefined;

    return NextResponse.json({
      balance: u?.balance ?? null,
      openings,
      progress,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_ENOUGH") {
      return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
    }
    if (msg === "NO_USER") {
      return NextResponse.json({ error: "No user" }, { status: 500 });
    }
    console.error("[api/open]", e);
    return NextResponse.json(
      {
        error:
          "Erreur serveur à l’ouverture. Vérifie les migrations Prisma et redémarre le serveur.",
      },
      { status: 500 },
    );
  }
}
