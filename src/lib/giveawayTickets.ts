import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Dépense cumulée en caisses (somme des `pricePaid` des ouvertures) pour obtenir 1 ticket giveaway.
 * Stockage en centimes : 10_000 = 100,00 BS Coin affichés.
 */
export const GIVEAWAY_SPEND_CENTS_PER_TICKET = 10_000;

export type GiveawayTicketSnapshot = {
  ticketsFromBattles: number;
  ticketsFromCaseSpend: number;
  totalTickets: number;
  /** Somme des `pricePaid` (centimes réellement débités, hors gratuits). */
  caseSpendCents: number;
  /** Centimes restants avant le prochain ticket « dépense caisse ». */
  centsUntilNextSpendTicket: number;
};

export async function getGiveawayTicketSnapshot(
  db: PrismaClient,
  userId: string,
): Promise<GiveawayTicketSnapshot> {
  const [battleWins, spendAgg] = await Promise.all([
    db.caseBattle.count({ where: { userId, winnerSlot: 0 } }),
    db.opening.aggregate({
      where: { userId },
      _sum: { pricePaid: true },
    }),
  ]);

  const spend = spendAgg._sum.pricePaid ?? 0;
  const G = GIVEAWAY_SPEND_CENTS_PER_TICKET;
  const ticketsFromSpend = Math.floor(spend / G);
  const intoBucket = spend % G;
  const centsUntilNextSpendTicket =
    intoBucket === 0 && spend > 0 ? G : G - intoBucket;

  return {
    ticketsFromBattles: battleWins,
    ticketsFromCaseSpend: ticketsFromSpend,
    totalTickets: battleWins + ticketsFromSpend,
    caseSpendCents: spend,
    centsUntilNextSpendTicket,
  };
}
