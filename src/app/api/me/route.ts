import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDemoSeed } from "@/server/seed";

export async function GET() {
  await ensureDemoSeed();
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return NextResponse.json({ balance: 0 }, { status: 500 });
  return NextResponse.json({ balance: user.balance });
}
