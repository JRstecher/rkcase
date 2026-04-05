/**
 * Présence « en ligne » (démo) : compteur par session navigateur, mémoire processus.
 * Hors heartbeat depuis {@link IDLE_MS}, une session est retirée du total.
 */

const IDLE_MS = 90_000;

const sessions = new Map<string, number>();

function prune(now: number) {
  const cutoff = now - IDLE_MS;
  for (const [id, last] of sessions) {
    if (last < cutoff) sessions.delete(id);
  }
}

function sanitizeSessionId(raw: string): string | null {
  const s = raw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 128);
  return s.length >= 8 ? s : null;
}

/** Enregistre une activité et renvoie le nombre de sessions encore actives. */
export function touchPresence(sessionId: string): number {
  const id = sanitizeSessionId(sessionId);
  if (!id) return getOnlineCount();
  const now = Date.now();
  sessions.set(id, now);
  prune(now);
  return sessions.size;
}

export function getOnlineCount(): number {
  const now = Date.now();
  prune(now);
  return sessions.size;
}
