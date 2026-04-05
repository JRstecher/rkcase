import { NextResponse } from "next/server";
import { normalizeDisplayName } from "@/lib/displayName";
import { prisma } from "@/server/db";
import { getCurrentUserId } from "@/server/currentUser";

/** Met à jour le pseudo du joueur connecté (compte OAuth uniquement). */
export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const displayNameRaw =
    typeof body === "object" &&
    body !== null &&
    "displayName" in body &&
    typeof (body as { displayName: unknown }).displayName === "string"
      ? (body as { displayName: string }).displayName
      : null;

  if (displayNameRaw === null) {
    return NextResponse.json(
      { error: "Champ displayName requis." },
      { status: 400 },
    );
  }

  const parsed = normalizeDisplayName(displayNameRaw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { authSub: true },
  });

  if (!user?.authSub) {
    return NextResponse.json(
      {
        error:
          "Connecte-toi avec Google (ou un autre compte) pour personnaliser ton pseudo.",
      },
      { status: 403 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { displayName: parsed.value },
  });

  return NextResponse.json({ displayName: parsed.value });
}
