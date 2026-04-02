import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await ensureDemoSeed();
  const { slug } = await context.params;

  const c = await prisma.case.findUnique({
    where: { slug },
    include: { drops: { include: { item: true } } },
  });

  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let total = 0;
  for (const d of c.drops) total += d.weight;
  type DropRow = {
    item: (typeof c.drops)[number]["item"];
    weight: number;
    chance: number;
  };
  const drops: DropRow[] = [];
  for (const d of c.drops) {
    drops.push({
      item: d.item,
      weight: d.weight,
      chance: total > 0 ? d.weight / total : 0,
    });
  }
  drops.sort((a, b) => b.chance - a.chance);

  return NextResponse.json({
    case: { slug: c.slug, name: c.name, price: c.price },
    drops,
  });
}

