"use client";

import Link from "next/link";
import { useState } from "react";

export function SupportClient() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  /** E-mail bien parti vers supportbs@casebs.com (Resend configuré). */
  const [mailedToSupport, setMailedToSupport] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const raw = await r.text();
      let j: { error?: string; ok?: boolean; emailSent?: boolean } = {};
      try {
        j = JSON.parse(raw) as typeof j;
      } catch {
        /* ignore */
      }
      if (!r.ok) {
        throw new Error(j.error ?? (raw || "Envoi impossible"));
      }
      setMailedToSupport(j.emailSent === true);
      setSent(true);
      setSubject("");
      setBody("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Support</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-white">Contacter le support</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Décris ton problème ou ta question. Ta demande est transmise à{" "}
        <span className="font-medium text-zinc-300">supportbs@casebs.com</span>{" "}
        par e-mail (Resend) lorsque{" "}
        <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-zinc-300">
          RESEND_API_KEY
        </code>{" "}
        est défini dans{" "}
        <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-zinc-300">
          .env
        </code>
        , et conservée en base.
      </p>

      {sent ? (
        <div className="rk-card mt-8 border-emerald-500/25 bg-emerald-500/5 p-6">
          <p className="text-sm font-medium text-emerald-100">
            Message bien envoyé. Merci !
          </p>
          {mailedToSupport ? (
            <p className="mt-2 text-xs text-zinc-400">
              Un e-mail a été envoyé à{" "}
              <span className="font-medium text-emerald-200/90">
                supportbs@casebs.com
              </span>
              . Tu recevras la réponse sur l’adresse que tu as indiquée.
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-200/80">
              Le message est enregistré, mais l&apos;envoi mail n&apos;est pas
              actif : ajoute{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-zinc-300">
                RESEND_API_KEY
              </code>{" "}
              (et éventuellement{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-zinc-300">
                RESEND_FROM
              </code>
              ) dans{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-zinc-300">
                .env
              </code>{" "}
              — voir{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 underline hover:text-indigo-200"
              >
                resend.com
              </a>
              .
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMailedToSupport(false);
            }}
            className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="rk-card mt-8 space-y-4 p-6">
          <div>
            <label
              htmlFor="support-email"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              E-mail <span className="text-rose-300/90">*</span>
            </label>
            <input
              id="support-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              placeholder="ton.adresse@email.com"
            />
            <p className="mt-1 text-[11px] text-zinc-600">
              Obligatoire — nous t’y répondrons.
            </p>
          </div>
          <div>
            <label
              htmlFor="support-subject"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Sujet
            </label>
            <input
              id="support-subject"
              required
              minLength={3}
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              placeholder="Ex. Problème de solde après ouverture"
            />
          </div>
          <div>
            <label
              htmlFor="support-body"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Message
            </label>
            <textarea
              id="support-body"
              required
              minLength={10}
              maxLength={8000}
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              placeholder="Décris ce qui s’est passé, avec le plus de détails possible."
            />
            <p className="mt-1 text-[11px] text-zinc-600">
              {body.length} / 8000 caractères
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Envoyer au support"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/cases" className="text-indigo-300 hover:underline">
          Retour aux cases
        </Link>
      </p>
    </main>
  );
}
