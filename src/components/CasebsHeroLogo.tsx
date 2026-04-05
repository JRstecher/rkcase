import Image from "next/image";

/**
 * Bannière 1920×600 (ratio 16∶5) : `object-cover` + `object-center` pour garder le torii au centre.
 * Fichier `/public/hero-banner-casebs.png` — pour rivière / sakura étendues en vraie résolution,
 * générer l’image en 1920×600 px (IA / retouche) puis remplacer le PNG.
 */
export function CasebsHeroLogo() {
  return (
    <div className="mb-10 w-full px-2 sm:mb-12 sm:px-4 lg:px-6">
      <div className="relative mx-auto w-full max-w-[1920px]">
        <div className="relative z-0 aspect-[1920/600] w-full min-h-[160px] overflow-hidden rounded-[1.25rem] border border-fuchsia-400/20 bg-[#0a0612] shadow-[0_28px_80px_rgba(59,7,100,0.45)] ring-1 ring-cyan-400/10 sm:rounded-[2rem]">
          <Image
            src="/hero-banner-casebs.png"
            alt=""
            fill
            className="object-cover object-[center_42%] sm:object-center"
            sizes="(max-width: 1920px) 100vw, 1920px"
            priority
          />

          {/* Cadrage cinéma léger + renfort latéral discret (sans recréer l’image) */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,6,23,0.35)_0%,transparent_14%,transparent_86%,rgba(2,6,23,0.35)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(157,23,77,0.08)_0%,transparent_15%,transparent_85%,rgba(157,23,77,0.08)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40"
            aria-hidden
          />

          <div className="absolute inset-0 z-[2] flex items-center justify-center px-4 py-6 sm:py-10">
            <div className="inline-block [transform:perspective(520px)_rotateX(9deg)]">
              <p
                className="text-center text-4xl font-black tracking-[-0.06em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-6xl lg:text-8xl"
                style={{
                  color: "#f5f3ff",
                  textShadow: `
              0 1px 0 #e9d5ff,
              0 2px 0 #c4b5fd,
              0 3px 0 #a78bfa,
              0 4px 0 #8b5cf6,
              0 5px 0 #7c3aed,
              0 6px 0 #5b21b6,
              0 8px 6px rgba(0, 0, 0, 0.55),
              0 0 40px rgba(236, 72, 153, 0.35)
            `,
                }}
              >
                <span className="text-[#fdf4ff]">Case</span>
                <span className="text-[#ede9fe]">bs</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
