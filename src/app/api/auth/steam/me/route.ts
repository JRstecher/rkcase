import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const jar = await cookies();
  const steamId = jar.get("casebs_steam_id")?.value ?? null;
  return NextResponse.json({ steamId });
}
