/** Normalise et valide le pseudo affiché sur le site (2–24 caractères). */
export function normalizeDisplayName(
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "Pseudo invalide." };
  }
  const s = raw.trim().replace(/\s+/g, " ");
  if (s.length < 2) {
    return { ok: false, error: "Au moins 2 caractères." };
  }
  if (s.length > 24) {
    return { ok: false, error: "24 caractères maximum." };
  }
  if (!/^[\p{L}\p{N}\s_.-]+$/u.test(s)) {
    return {
      ok: false,
      error: "Utilise des lettres, chiffres, espaces, tirets ou underscores.",
    };
  }
  return { ok: true, value: s };
}
