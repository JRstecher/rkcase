/** Solde de départ pour un nouveau joueur : 100,00 BS Coin (stocké en centimes). */
export const STARTING_BALANCE_CENTS = 10_000;

/** Solde et prix in-game (unité affichée = centième de « BS Coin »). */
export function formatBSCoinAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Libellé court pour textes (confirmations, toasts). */
export function formatBSCoinLabel(cents: number): string {
  return `${formatBSCoinAmount(cents)} BS Coin`;
}

/** Dépôts Stripe / montants réels en euros (UI portefeuille uniquement). */
export function formatCentsEUR(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}
