import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { sendSupportEmail } from "@/server/sendSupportEmail";
import { ensureDemoSeed } from "@/server/seed";

const SUBJECT_MAX = 160;
const BODY_MAX = 8000;
const EMAIL_MAX = 254;

function trimStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

export async function POST(req: Request) {
  await ensureDemoSeed();

  const body = (await req.json().catch(() => null)) as
    | {
        email?: string;
        subject?: string;
        body?: string;
        website?: string;
      }
    | null;

  if (body?.website) {
    return NextResponse.json({ ok: true });
  }

  const subject = trimStr(body?.subject, SUBJECT_MAX);
  const text = trimStr(body?.body, BODY_MAX);
  const email = trimStr(body?.email, EMAIL_MAX);

  if (!email) {
    return NextResponse.json(
      { error: "L’adresse e-mail est obligatoire." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }

  if (subject.length < 3) {
    return NextResponse.json(
      { error: "Le sujet doit faire au moins 3 caractères." },
      { status: 400 },
    );
  }
  if (text.length < 10) {
    return NextResponse.json(
      { error: "Le message doit faire au moins 10 caractères." },
      { status: 400 },
    );
  }

  try {
    await prisma.supportMessage.create({
      data: {
        email,
        subject,
        body: text,
      },
    });
  } catch (e) {
    console.error("[api/support]", e);
    return NextResponse.json(
      {
        error:
          "Enregistrement impossible. Vérifie que la migration Prisma a été appliquée (SupportMessage).",
      },
      { status: 500 },
    );
  }

  const mail = await sendSupportEmail({
    subject,
    body: text,
    contactEmail: email,
  });

  if (!mail.sent) {
    console.warn("[api/support] E-mail non envoyé :", mail.error ?? "inconnu");
  }

  return NextResponse.json({
    ok: true,
    emailSent: mail.sent,
  });
}
