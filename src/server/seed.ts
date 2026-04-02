import type { Rarity } from "@/generated/prisma/enums";
import { STEAM_PREVIEW_URL_BY_SKIN_NAME } from "@/lib/steamSkinImages";
import { prisma } from "@/server/db";

const TARGET_CASE_COUNT = 100;

const CSGO_SKIN_ROWS = [
  { name: "P250 | Sand Dune", rarity: "COMMON" as const, value: 400 },
  { name: "Nova | Predator", rarity: "COMMON" as const, value: 650 },
  { name: "AK-47 | Redline", rarity: "RARE" as const, value: 5400 },
  { name: "Glock-18 | Water Elemental", rarity: "RARE" as const, value: 6200 },
  { name: "M4A1-S | Hyper Beast", rarity: "EPIC" as const, value: 12000 },
  { name: "AWP | Asiimov", rarity: "EPIC" as const, value: 16500 },
  { name: "AWP | Dragon Lore", rarity: "LEGENDARY" as const, value: 65000 },
  { name: "Karambit | Fade", rarity: "LEGENDARY" as const, value: 92000 },
] as const;

/** Skins façon CS + vignettes CDN Steam (démo). */
const CSGO_SKINS = CSGO_SKIN_ROWS.map((s) => ({
  ...s,
  imageUrl: STEAM_PREVIEW_URL_BY_SKIN_NAME[s.name] ?? null,
}));

/** Met à jour les noms / valeurs des items même si le catalogue des caisses est déjà à 100. */
async function syncCsgoItems() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" } });
  if (items.length !== CSGO_SKINS.length) return;
  for (let i = 0; i < CSGO_SKINS.length; i++) {
    const t = CSGO_SKINS[i]!;
    const row = items[i]!;
    if (
      row.name !== t.name ||
      row.value !== t.value ||
      row.rarity !== t.rarity ||
      row.imageUrl !== t.imageUrl
    ) {
      await prisma.item.update({
        where: { id: row.id },
        data: {
          name: t.name,
          rarity: t.rarity,
          value: t.value,
          imageUrl: t.imageUrl,
        },
      });
    }
  }
}

/** Prix case en centimes (0,20 € = 20 ; 1000 € = 100_000). */
function buildCasePrices(): { cents: number; tier: "budget" | "premium" }[] {
  const cheap: { cents: number; tier: "budget" }[] = [];
  for (let i = 0; i < 85; i++) {
    const cents = Math.round(20 + (i * (9999 - 20)) / 84);
    cheap.push({ cents, tier: "budget" });
  }
  const premium: { cents: number; tier: "premium" }[] = [];
  for (let i = 0; i < 15; i++) {
    const cents = Math.round(10000 + (i * (100000 - 10000)) / 14);
    premium.push({ cents, tier: "premium" });
  }
  return [...cheap, ...premium];
}

const NAME_BASES = [
  "Brume",
  "Cuivre",
  "Sable",
  "Neon",
  "Cyber",
  "Pixel",
  "Nano",
  "Flash",
  "Glace",
  "Feu",
  "Ombre",
  "Aube",
  "Vague",
  "Flux",
  "Echo",
  "Nova",
  "Urban",
  "Lucky",
  "Loot",
  "Prime",
] as const;

function caseNameAt(index: number, tier: "budget" | "premium") {
  const base = NAME_BASES[index % NAME_BASES.length]!;
  const wave = Math.floor(index / NAME_BASES.length) + 1;
  const core = wave > 1 ? `Caisse ${base} ${wave}` : `Caisse ${base}`;
  return tier === "premium" ? `${core} ★` : core;
}

function weightForDrop(
  priceCents: number,
  item: { id: string; rarity: Rarity },
): number {
  const t = Math.min(1, priceCents / 100_000);
  let w = 10;
  switch (item.rarity) {
    case "COMMON":
      w = Math.round(48 * (1 - t) + 12);
      break;
    case "RARE":
      w = Math.round(32 * (1 - t * 0.65) + 14);
      break;
    case "EPIC":
      w = Math.round(22 * t + 8);
      break;
    case "LEGENDARY":
      w = Math.round(14 * t * t + 2);
      break;
    default:
      w = 10;
  }
  return Math.max(1, w);
}

export async function ensureDemoSeed() {
  await syncCsgoItems();

  const n = await prisma.case.count();
  if (n === TARGET_CASE_COUNT) {
    const u = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (u && u.balance < 50_000) {
      await prisma.user.update({
        where: { id: u.id },
        data: { balance: 500_000 },
      });
    }
    return;
  }

  await prisma.$transaction([
    prisma.caseDrop.deleteMany(),
    prisma.opening.deleteMany(),
    prisma.case.deleteMany(),
  ]);

  let user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    user = await prisma.user.create({
      data: { displayName: "Demo Player", balance: 500_000 },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: 500_000 },
    });
  }

  let items = await prisma.item.findMany({ orderBy: { createdAt: "asc" } });
  if (items.length === 0) {
    items = await prisma.item.createManyAndReturn({
      data: CSGO_SKINS.map((s) => ({ ...s })),
    });
  } else {
    await syncCsgoItems();
    items = await prisma.item.findMany({ orderBy: { createdAt: "asc" } });
  }

  const priced = buildCasePrices().sort((a, b) => a.cents - b.cents);

  for (let i = 0; i < priced.length; i++) {
    const { cents, tier } = priced[i]!;
    const slug = `rk-${String(i + 1).padStart(3, "0")}`;
    const name = caseNameAt(i, tier);
    const c = await prisma.case.create({
      data: {
        slug,
        name,
        price: cents,
      },
    });

    const drops = items.map((it) => ({
      caseId: c.id,
      itemId: it.id,
      weight: weightForDrop(cents, it),
    }));

    await prisma.caseDrop.createMany({ data: drops });
  }

  const invCount = await prisma.inventoryItem.count({
    where: { userId: user.id },
  });
  if (invCount === 0) {
    const commons = items.filter((i) => i.rarity === "COMMON").slice(0, 2);
    await prisma.inventoryItem.createMany({
      data: commons.map((i) => ({ userId: user.id, itemId: i.id })),
    });
  }
}

export async function getDemoUserId() {
  await ensureDemoSeed();
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("Demo user missing");
  return user.id;
}
