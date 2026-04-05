import { notFound } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";
import { ensureDemoSeed } from "@/server/seed";
import { CaseOpenClient } from "./CaseOpenClient";

export const dynamic = "force-dynamic";

export default async function CaseSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureDemoSeed();
  const { slug } = await params;

  const c = await prisma.case.findUnique({
    where: { slug },
    include: { drops: { include: { item: true } } },
  });

  if (!c) notFound();

  let total = 0;
  for (const d of c.drops) total += d.weight;

  const drops = c.drops.map((d) => ({
    item: {
      id: d.item.id,
      name: d.item.name,
      rarity: d.item.rarity,
      value: d.item.value,
      imageUrl: d.item.imageUrl,
    },
    weight: d.weight,
    chance: total > 0 ? d.weight / total : 0,
  }));
  drops.sort((a, b) => b.chance - a.chance);

  const userId = await getCurrentUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main>
        <CaseOpenClient
          initial={{
            case: { slug: c.slug, name: c.name, price: c.price },
            drops,
            balance: user?.balance ?? null,
          }}
        />
      </main>
    </div>
  );
}
