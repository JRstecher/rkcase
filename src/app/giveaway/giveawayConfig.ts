/**
 * Contenu éditable du giveaway (pas de back-office : modifie ce fichier puis redéploie).
 * Les tickets sont calculés côté serveur (voir `lib/giveawayTickets.ts`).
 */
const spendPerTicketLabel = "100,00 BS Coin" as const;

export const giveawayConfig = {
  active: true,
  title: "Giveaway Casebs",
  subtitle: "Tente ta chance chaque mois",
  /** Sous-titre de la section « À gagner » (ton institutionnel). */
  prizeSectionKicker: "Récompense du tirage",
  prizeSectionTitle: "Dotation pour le gagnant",
  prizeIntro:
    "Un seul lauréat est désigné à l’issue du tirage au sort. La dotation cumule les deux éléments ci-dessous.",
  prizeItems: [
    {
      title: "Versement en euros",
      amount: "10 €",
      description:
        "Montant net versé au gagnant après le tirage, selon une modalité convenue avec nos équipes (virement bancaire, PayPal ou équivalent, sous réserve des obligations légales applicables).",
    },
    {
      title: "Abonnement Premium Casebs",
      amount: "1 mois offert",
      description:
        "Accès VIP à l’ensemble des avantages Premium pendant trente jours calendaires, activé sur le compte du gagnant une fois le tirage validé.",
    },
  ] as const,
  prizeFootnote:
    "Le calendrier du tirage au sort, les pièces éventuellement demandées et les délais de versement sont communiqués par le support Casebs au moment de la prise de contact avec le lauréat.",
  endLabel:
    "Annonce officielle des résultats sur cette page et par le canal support à l’issue de la période de jeu.",
  /** Affichage : aligné avec GIVEAWAY_SPEND_CENTS_PER_TICKET dans `lib/giveawayTickets.ts`. */
  spendPerTicketLabel,
  howItWorks: [
    "Gagne un battle (tu es le joueur 1 et tu remportes la manche) : +1 ticket.",
    `Dépense cumulée en caisses (hors ouvertures gratuites) : 1 ticket tous les ${spendPerTicketLabel} débités sur tes ouvertures.`,
    "Tes tickets s’affichent sur cette page et se mettent à jour après chaque battle ou ouverture.",
    "Les gagnants sont contactés via le support — pense à laisser un moyen de te joindre.",
  ],
  rules: [
    "Les tickets sont calculés automatiquement à partir de l’historique en base (battles gagnées + total payé sur les ouvertures).",
    "Une participation par compte pour le tirage principal.",
    "Le versement des 10 € réels et l’activation du mois de VIP sont organisés avec le gagnant après le tirage (coordonnées et modalités via le support).",
    "Les litiges se règlent via la page Support.",
  ],
} as const;
