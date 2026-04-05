/** Thème visuel / UX pour l’ouverture de caisse (fond, RTL, sons). */
export type CaseVisualTheme = "default" | "sakura" | "nihon" | "dragon";

const NIHON_VIDEO_SRC = "/videos/nihon-case-bg.mp4";
const NIHON_THUMB_SRC = "/images/nihon-case-thumb.png";
const SAKURA_VIDEO_SRC = "/videos/sakura-case-bg.mp4";
const SAKURA_BANNER_ART_SRC = "/images/sakura-case-banner-art.png";
const DRAGON_CASE_ART_SRC = "/images/dragon-case-art.png";

export function getCaseVisualTheme(slug: string): CaseVisualTheme {
  if (slug === "hell") return "sakura";
  if (slug === "nihon") return "nihon";
  if (slug === "dragon") return "dragon";
  return "default";
}

export function isJapanCaseTheme(theme: CaseVisualTheme): boolean {
  return theme === "sakura" || theme === "nihon" || theme === "dragon";
}

export function getNihonCaseVideoSrc(): string {
  return NIHON_VIDEO_SRC;
}

export function getNihonCaseThumbSrc(): string {
  return NIHON_THUMB_SRC;
}

export function getSakuraCaseVideoSrc(): string {
  return SAKURA_VIDEO_SRC;
}

export function getSakuraCaseBannerArtSrc(): string {
  return SAKURA_BANNER_ART_SRC;
}

export function getDragonCaseArtSrc(): string {
  return DRAGON_CASE_ART_SRC;
}
