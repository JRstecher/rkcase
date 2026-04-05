import { NextResponse } from "next/server";
import { getOnlineCount, touchPresence } from "@/server/onlinePresence";

export async function GET() {
  return NextResponse.json({ online: getOnlineCount() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { sessionId?: string }
    | null;
  const sessionId = body?.sessionId?.toString() ?? "";
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId manquant" },
      { status: 400 },
    );
  }
  const online = touchPresence(sessionId);
  return NextResponse.json({ online });
}
