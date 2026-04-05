import { HELL_CASE_DROPS } from "@/data/hellCaseDrops";
import { STARTING_BALANCE_CENTS } from "@/lib/money";
import { prisma } from "@/server/db";

const HELL_CASE_SLUG = "hell";
const HELL_CASE_NAME = "Sakura Blossom Case 🌸";
const NIHON_CASE_SLUG = "nihon";
const NIHON_CASE_NAME = "Caisse Nihon 日本 · Lame silencieuse";
const DRAGON_CASE_SLUG = "dragon";
const DRAGON_CASE_NAME = "Caisse Dragon d'azur 🐉 · AWP & vague";
const HELL_CASE_PRICE_CENTS = 20;
const HELL_ITEM_COUNT = HELL_CASE_DROPS.length;
const HELL_FIRST_NAME = HELL_CASE_DROPS[0]!.name;

function pragmaColumnNames(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  const out: string[] = [];
  for (const row of rows) {
    if (row && typeof row === "object") {
      const o = row as Record<string, unknown>;
      const v = o.name ?? o.NAME;
      if (typeof v === "string") out.push(v);
    }
  }
  return out;
}

/**
 * Si la base a été créée avant les manches battle, les colonnes manquent et Prisma plante.
 * SQLite uniquement (schéma actuel).
 */
async function ensurePlayerLevelColumns() {
  try {
    const cols = await prisma.$queryRawUnsafe('PRAGMA table_info("User")');
    const names = pragmaColumnNames(cols);
    if (!names.includes("xp")) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0',
      );
    }
    if (!names.includes("freeCaseOpens")) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "User" ADD COLUMN "freeCaseOpens" INTEGER NOT NULL DEFAULT 0',
      );
    }
    if (!names.includes("enterLevelRewardedUpTo")) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "User" ADD COLUMN "enterLevelRewardedUpTo" INTEGER NOT NULL DEFAULT 1',
      );
    }
  } catch (err) {
    console.error("[seed] ensurePlayerLevelColumns:", err);
  }
}

/** Table support (SQLite) si migration pas encore appliquée. */
async function ensureSupportMessagesTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupportMessage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "email" TEXT,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt")`,
    );
  } catch (err) {
    console.error("[seed] ensureSupportMessagesTable:", err);
  }
}

async function ensureBattleRoundColumns() {
  try {
    const battleCols = await prisma.$queryRawUnsafe(
      'PRAGMA table_info("CaseBattle")',
    );
    if (!pragmaColumnNames(battleCols).includes("rounds")) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "CaseBattle" ADD COLUMN "rounds" INTEGER NOT NULL DEFAULT 1',
      );
    }
    const rollCols = await prisma.$queryRawUnsafe(
      'PRAGMA table_info("CaseBattleRoll")',
    );
    if (!pragmaColumnNames(rollCols).includes("roundIndex")) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "CaseBattleRoll" ADD COLUMN "roundIndex" INTEGER NOT NULL DEFAULT 0',
      );
    }
  } catch (err) {
    console.error("[seed] ensureBattleRoundColumns:", err);
  }
}

async function wipeCaseGraph() {
  await prisma.$transaction([
    prisma.caseBattleRoll.deleteMany(),
    prisma.caseBattle.deleteMany(),
    prisma.caseDrop.deleteMany(),
    prisma.opening.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.case.deleteMany(),
    prisma.item.deleteMany(),
  ]);
}

async function seedHellItems() {
  await prisma.item.createMany({
    data: HELL_CASE_DROPS.map((d) => ({
      name: d.name,
      rarity: d.rarity,
      value: d.value,
      imageUrl: d.imageUrl,
    })),
  });
  const items = await prisma.item.findMany({
    select: { id: true, name: true },
  });
  return new Map(items.map((i) => [i.name, { id: i.id }]));
}

async function hellCatalogNeedsFullReset(): Promise<boolean> {
  const n = await prisma.item.count();
  if (n !== HELL_ITEM_COUNT) return true;
  const probe = await prisma.item.findFirst({
    where: { name: HELL_FIRST_NAME },
    select: { id: true },
  });
  return !probe;
}

async function syncHellItemFields() {
  for (const d of HELL_CASE_DROPS) {
    const row = await prisma.item.findFirst({
      where: { name: d.name },
      select: { id: true, value: true, rarity: true, imageUrl: true },
    });
    if (
      row &&
      (row.value !== d.value ||
        row.rarity !== d.rarity ||
        row.imageUrl !== d.imageUrl)
    ) {
      await prisma.item.update({
        where: { id: row.id },
        data: {
          value: d.value,
          rarity: d.rarity,
          imageUrl: d.imageUrl,
        },
      });
    }
  }
}

async function ensureHellCase(itemsByName: Map<string, { id: string }>) {
  const hell = await prisma.case.upsert({
    where: { slug: HELL_CASE_SLUG },
    create: {
      slug: HELL_CASE_SLUG,
      name: HELL_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
    update: {
      name: HELL_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
  });

  const dropCount = await prisma.caseDrop.count({
    where: { caseId: hell.id },
  });
  if (dropCount !== HELL_ITEM_COUNT) {
    await prisma.caseDrop.deleteMany({ where: { caseId: hell.id } });
    await prisma.caseDrop.createMany({
      data: HELL_CASE_DROPS.map((d) => {
        const it = itemsByName.get(d.name);
        if (!it) throw new Error(`Item manquant: ${d.name}`);
        return {
          caseId: hell.id,
          itemId: it.id,
          weight: d.weight,
        };
      }),
    });
  }
}

async function ensureDragonCase(itemsByName: Map<string, { id: string }>) {
  const dragon = await prisma.case.upsert({
    where: { slug: DRAGON_CASE_SLUG },
    create: {
      slug: DRAGON_CASE_SLUG,
      name: DRAGON_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
    update: {
      name: DRAGON_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
  });

  const dropCount = await prisma.caseDrop.count({
    where: { caseId: dragon.id },
  });
  if (dropCount !== HELL_ITEM_COUNT) {
    await prisma.caseDrop.deleteMany({ where: { caseId: dragon.id } });
    await prisma.caseDrop.createMany({
      data: HELL_CASE_DROPS.map((d) => {
        const it = itemsByName.get(d.name);
        if (!it) throw new Error(`Item manquant: ${d.name}`);
        return {
          caseId: dragon.id,
          itemId: it.id,
          weight: d.weight,
        };
      }),
    });
  }
}

async function ensureNihonCase(itemsByName: Map<string, { id: string }>) {
  const nihon = await prisma.case.upsert({
    where: { slug: NIHON_CASE_SLUG },
    create: {
      slug: NIHON_CASE_SLUG,
      name: NIHON_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
    update: {
      name: NIHON_CASE_NAME,
      price: HELL_CASE_PRICE_CENTS,
    },
  });

  const dropCount = await prisma.caseDrop.count({
    where: { caseId: nihon.id },
  });
  if (dropCount !== HELL_ITEM_COUNT) {
    await prisma.caseDrop.deleteMany({ where: { caseId: nihon.id } });
    await prisma.caseDrop.createMany({
      data: HELL_CASE_DROPS.map((d) => {
        const it = itemsByName.get(d.name);
        if (!it) throw new Error(`Item manquant: ${d.name}`);
        return {
          caseId: nihon.id,
          itemId: it.id,
          weight: d.weight,
        };
      }),
    });
  }
}

export async function ensureDemoSeed() {
  await ensureBattleRoundColumns();
  await ensurePlayerLevelColumns();
  await ensureSupportMessagesTable();
  if (await hellCatalogNeedsFullReset()) {
    await wipeCaseGraph();
    const itemsByName = await seedHellItems();
    await ensureHellCase(itemsByName);
    await ensureNihonCase(itemsByName);
    await ensureDragonCase(itemsByName);
  } else {
    await syncHellItemFields();
    const items = await prisma.item.findMany({
      select: { id: true, name: true },
    });
    const itemsByName = new Map(items.map((i) => [i.name, { id: i.id }]));
    await ensureHellCase(itemsByName);
    await ensureNihonCase(itemsByName);
    await ensureDragonCase(itemsByName);
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    await prisma.user.create({
      data: {
        displayName: "Demo Player",
        balance: STARTING_BALANCE_CENTS,
      },
    });
  }
}

export async function getDemoUserId() {
  await ensureDemoSeed();
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("Demo user missing");
  return user.id;
}
