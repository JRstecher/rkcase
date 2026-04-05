/** Boîte qui reçoit les demandes du formulaire Support. */
export const SUPPORT_INBOX = "supportbs@casebs.com";

type SendSupportParams = {
  subject: string;
  body: string;
  /** Toujours fourni (formulaire obligatoire). */
  contactEmail: string;
};

/**
 * Envoie la demande à {@link SUPPORT_INBOX} via l’API Resend (HTTPS + fetch natif, aucun package npm).
 *
 * Variables : `RESEND_API_KEY` (obligatoire pour l’envoi),
 * `RESEND_FROM` (ex. `Casebs <noreply@tondomaine.com>` — domaine vérifié chez Resend).
 *
 * https://resend.com/docs/api-reference/emails/send-email
 */
export async function sendSupportEmail(
  params: SendSupportParams,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      sent: false,
      error: "RESEND_API_KEY non configuré dans .env",
    };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "Casebs <onboarding@resend.dev>";

  const mailSubject = `[Casebs — Support] ${params.contactEmail} · ${params.subject}`;
  const mailText = [
    `E-mail pour répondre : ${params.contactEmail}`,
    "",
    "— Message —",
    "",
    params.body,
    "",
    `— Fin · ${new Date().toISOString()} —`,
  ].join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [SUPPORT_INBOX],
        reply_to: params.contactEmail,
        subject: mailSubject,
        text: mailText,
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      let detail = raw;
      try {
        const j = JSON.parse(raw) as { message?: string };
        if (j.message) detail = j.message;
      } catch {
        /* ignore */
      }
      console.error("[sendSupportEmail] Resend:", r.status, detail);
      return { sent: false, error: detail };
    }

    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendSupportEmail]", e);
    return { sent: false, error: msg };
  }
}
