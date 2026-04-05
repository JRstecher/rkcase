import type { ComponentType } from "react";

export type NavMainIcon = ComponentType<{ className?: string }>;

export type NavMainItem = {
  href: string;
  label: string;
  Icon: NavMainIcon;
  /** Titre de section affiché au-dessus de ce lien (séparateur discret). */
  railSectionLabel?: string;
};

/** Ordre : accueil, cases, battle, pass, puis le reste. */
export const NAV_MAIN_ITEMS: readonly NavMainItem[] = [
  { href: "/", label: "Accueil", Icon: IconHome },
  { href: "/cases", label: "Cases", Icon: IconCases },
  { href: "/battle", label: "Battle", Icon: IconBattle },
  { href: "/battle-pass", label: "Battle Pass", Icon: IconBattlePass },
  { href: "/giveaway", label: "Giveaway", Icon: IconGift },
  { href: "/inventory", label: "Inventaire", Icon: IconInventory },
  {
    href: "/leaderboard",
    label: "Classement",
    Icon: IconLeaderboard,
    railSectionLabel: "Communauté",
  },
  {
    href: "/premium",
    label: "Premium",
    Icon: IconPremium,
    railSectionLabel: "Offres",
  },
  { href: "/wallet", label: "Portefeuille", Icon: IconWallet },
  {
    href: "/kyc",
    label: "Identité",
    Icon: IconShield,
    railSectionLabel: "Compte",
  },
  { href: "/support", label: "Support", Icon: IconSupport },
  { href: "/profil", label: "Profil", Icon: IconUser },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function IconCases({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="7" height="7" rx="1.5" />
      <rect x="14" y="5" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconGift({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12v10H4V12" />
      <path d="M22 7H2v5h20V7Z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />
    </svg>
  );
}

function IconBattlePass({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M8 12h4M8 16h8" />
    </svg>
  );
}

function IconInventory({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h8l4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9l4-4Z" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

function IconBattle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.5 4.5 5 5-8 8H6.5v-5l8-8Z" />
      <path d="m5 19 3-3M9 5l2 2M16 14l2 2" />
    </svg>
  );
}

function IconLeaderboard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8M12 17V3M5 9l2 3h10l2-3" />
      <path d="M7 13h10v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5Z" />
    </svg>
  );
}

function IconPremium({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21 8 13.4l-6-4.6h7.6L12 2z" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M16 14h.01" />
      <path d="M3 8V7a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s8-4.5 8-11V5l-8-3-8 3v5c0 6.5 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconSupport({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-3H5a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v9Z" />
      <path d="M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}
