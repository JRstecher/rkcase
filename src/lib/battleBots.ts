/** Noms d’affichage cycliques pour les adversaires bots (slots 1…n). */
const BATTLE_BOT_NAMES = [
  "Nova",
  "Pixel",
  "Kato",
  "Vex",
  "Luna",
  "Orion",
  "Flux",
  "Rex",
  "Mira",
  "Ace",
  "Zed",
] as const;

/** Libellé d’un slot battle : toi en 0, bots nommés ensuite. */
export function battleSlotLabel(slotIndex: number): string {
  if (slotIndex === 0) return "Toi";
  const name = BATTLE_BOT_NAMES[(slotIndex - 1) % BATTLE_BOT_NAMES.length];
  return `Bot · ${name}`;
}

/** Liste des participants pour l’aperçu UI (totalSlots = 1 + nombre de bots). */
export function battleParticipantsLine(totalSlots: number): string[] {
  const n = Math.max(0, Math.floor(totalSlots));
  return Array.from({ length: n }, (_, i) => battleSlotLabel(i));
}
