/**
 * Lien visible uniquement au focus clavier — saute la barre de navigation (WCAG 2.4.1).
 */
export function SkipLink() {
  return (
    <a
      href="#contenu-principal"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
    >
      Aller au contenu principal
    </a>
  );
}
