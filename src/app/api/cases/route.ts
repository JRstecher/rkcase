import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

export async function GET() {
  await ensureDemoSeed();
  const list = await prisma.case.findMany({
    orderBy: { price: "asc" },
    select: { slug: true, name: true, price: true },
  });
  return NextResponse.json({ cases: list });
}
