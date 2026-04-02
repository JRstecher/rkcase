export type SkinRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

/** États d’usure façon CS (démo — répartition type communauté). */
export const WEAR_ROWS = [
  { key: "FN", label: "Factory New", weight: 0.05 },
  { key: "MW", label: "Minimal Wear", weight: 0.15 },
  { key: "FT", label: "Field-Tested", weight: 0.45 },
  { key: "WW", label: "Well-Worn", weight: 0.25 },
  { key: "BS", label: "Battle-Scarred", weight: 0.1 },
] as const;

const rarityFrame: Record<SkinRarity, { stroke: string; glow: string }> = {
  COMMON: { stroke: "94a3b8", glow: "0,0,0" },
  RARE: { stroke: "60a5fa", glow: "59,130,246" },
  EPIC: { stroke: "c084fc", glow: "168,85,247" },
  LEGENDARY: { stroke: "fbbf24", glow: "245,158,11" },
};

function escSvgText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)!) | 0;
  }
  return h >>> 0;
}

/** Palette déterministe (même skin → mêmes couleurs), style “finish” sans copier un skin réel. */
function skinPalette(fullName: string, rarity: SkinRarity) {
  const h = hashName(fullName);
  const hue1 = h % 360;
  const hue2 = (h * 17 + 127) % 360;
  const hue3 = (h * 7 + 240) % 360;
  const sat = 42 + (h % 38);
  const bump = { COMMON: 0, RARE: 6, EPIC: 12, LEGENDARY: 18 }[rarity];
  const s = Math.min(88, sat + bump);
  const L1 = 22 + (h % 15);
  const L2 = 38 + ((h >> 8) % 22);
  const L3 = 55 + ((h >> 16) % 18);
  return {
    a: `hsl(${hue1},${s}%,${L2}%)`,
    b: `hsl(${hue2},${Math.min(90, s + 8)}%,${L1}%)`,
    c: `hsl(${hue3},${s - 5}%,${L3}%)`,
    shine: `hsl(${hue1},30%,85%)`,
  };
}

type WeaponKind = "sniper" | "rifle" | "pistol" | "knife" | "smg";

function weaponKind(weaponLine: string): WeaponKind {
  const w = weaponLine.toUpperCase();
  if (w.includes("AWP") || w.includes("SSG") || w.includes("SCAR")) return "sniper";
  if (
    w.includes("KNIFE") ||
    w.includes("KARAMBIT") ||
    w.includes("BAYONET") ||
    w.includes("DAGGER")
  )
    return "knife";
  if (
    w.includes("GLOCK") ||
    w.includes("USP") ||
    w.includes("P250") ||
    w.includes("DESERT") ||
    w.includes("TEC-9") ||
    w.includes("FIVE-SEVEN") ||
    w.includes("CZ75") ||
    w.includes("R8")
  )
    return "pistol";
  if (
    w.includes("MAC-10") ||
    w.includes("MP9") ||
    w.includes("UMP") ||
    w.includes("P90") ||
    w.includes("PP-BIZON")
  )
    return "smg";
  return "rifle";
}

/** Silhouettes vectorielles originales (vue de côté, style caisse). */
function weaponPaths(kind: WeaponKind): string {
  switch (kind) {
    case "sniper":
      return `
  <path d="M 24 98 L 178 86 L 248 80 L 252 88 L 248 96 L 178 94 L 26 104 Z" fill="url(#finish)" opacity="0.95"/>
  <path d="M 248 80 L 272 76 L 276 88 L 272 100 L 248 96 Z" fill="url(#finish)" opacity="0.88"/>
  <rect x="32" y="92" width="38" height="14" rx="2" fill="url(#metal)" opacity="0.5"/>
  <path d="M 178 86 L 188 78 L 192 102 L 178 94 Z" fill="#0f172a" opacity="0.35"/>`;
    case "pistol":
      return `
  <path d="M 72 96 L 168 92 L 188 88 L 194 100 L 188 108 L 72 110 Z" fill="url(#finish)" opacity="0.95"/>
  <path d="M 168 92 L 208 90 L 212 100 L 208 108 L 168 104 Z" fill="url(#finish)" opacity="0.85"/>
  <ellipse cx="98" cy="100" rx="22" ry="10" fill="url(#metal)" opacity="0.4"/>`;
    case "knife":
      return `
  <path d="M 118 42 L 138 118 L 132 124 L 108 52 Z" fill="url(#finish)" opacity="0.92"/>
  <path d="M 108 52 L 118 42 L 96 48 L 92 58 Z" fill="url(#metal)" opacity="0.55"/>
  <path d="M 132 118 L 148 122 L 138 128 L 128 122 Z" fill="#1e293b" opacity="0.6"/>`;
    case "smg":
      return `
  <path d="M 36 94 L 168 88 L 210 84 L 216 98 L 210 108 L 168 100 L 38 102 Z" fill="url(#finish)" opacity="0.93"/>
  <rect x="44" y="90" width="52" height="16" rx="2" fill="url(#metal)" opacity="0.45"/>
  <path d="M 210 84 L 232 82 L 236 98 L 232 110 L 210 108 Z" fill="url(#finish)" opacity="0.8"/>`;
    default:
      return `
  <path d="M 28 96 L 188 88 L 232 84 L 238 96 L 232 106 L 188 102 L 30 106 Z" fill="url(#finish)" opacity="0.94"/>
  <path d="M 232 84 L 258 82 L 262 96 L 258 108 L 232 106 Z" fill="url(#finish)" opacity="0.85"/>
  <rect x="36" y="90" width="48" height="16" rx="2" fill="url(#metal)" opacity="0.42"/>
  <path d="M 188 88 L 200 80 L 206 110 L 188 102 Z" fill="#0f172a" opacity="0.3"/>`;
  }
}

/** Utilise l’image Steam en base si présente, sinon le SVG de secours. */
export function getSkinPreviewSrc(item: {
  name: string;
  rarity: SkinRarity;
  imageUrl?: string | null;
}): string {
  const u = item.imageUrl?.trim();
  if (u && /^https:\/\//i.test(u)) return u;
  return getSkinPreviewDataUrl(item.name, item.rarity);
}

/**
 * Aperçu local (SVG data URL) — style “skin” : silhouette + dégradés propres (secours sans URL Steam).
 */
export function getSkinPreviewDataUrl(name: string, rarity: SkinRarity): string {
  const line = name.includes("|") ? name.split("|").map((s) => s.trim()) : [name];
  const weapon = line[0] ?? name;
  const finish = line[1] ?? "";
  const line1 = escSvgText(weapon.slice(0, 22));
  const line2 = finish ? escSvgText(finish.slice(0, 24)) : "";
  const frame = rarityFrame[rarity];
  const pal = skinPalette(name, rarity);
  const kind = weaponKind(weapon);
  const uid = hashName(name).toString(36);

  const paths = weaponPaths(kind);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="168" viewBox="0 0 280 168">
  <defs>
    <linearGradient id="bg-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${pal.b}"/>
      <stop offset="55%" style="stop-color:#050508"/>
      <stop offset="100%" style="stop-color:${pal.a}"/>
    </linearGradient>
    <radialGradient id="hot-${uid}" cx="35%" cy="35%" r="65%">
      <stop offset="0%" style="stop-color:${pal.c};stop-opacity:0.55"/>
      <stop offset="70%" style="stop-color:#000;stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="finish-${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${pal.a}"/>
      <stop offset="35%" style="stop-color:${pal.shine};stop-opacity:0.9"/>
      <stop offset="50%" style="stop-color:${pal.c}"/>
      <stop offset="100%" style="stop-color:${pal.b}"/>
    </linearGradient>
    <linearGradient id="metal-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:0.7"/>
      <stop offset="50%" style="stop-color:#1e293b;stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:0.6"/>
    </linearGradient>
    <filter id="soft-${uid}" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.8"/>
    </filter>
    <pattern id="grid-${uid}" width="14" height="14" patternUnits="userSpaceOnUse">
      <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="0.6"/>
    </pattern>
  </defs>
  <rect width="280" height="168" fill="url(#bg-${uid})"/>
  <rect width="280" height="168" fill="url(#hot-${uid})"/>
  <rect width="280" height="168" fill="url(#grid-${uid})" opacity="0.85"/>
  <rect x="2" y="2" width="276" height="164" rx="10" fill="none" stroke="#${frame.stroke}" stroke-opacity="0.55" stroke-width="2"/>
  <rect x="4" y="4" width="272" height="160" rx="8" fill="none" stroke="rgb(${frame.glow})" stroke-opacity="0.15" stroke-width="1"/>
  <g filter="url(#soft-${uid})">
    <g transform="translate(0,6)">
      ${paths.replace(/url\(#finish\)/g, `url(#finish-${uid})`).replace(/url\(#metal\)/g, `url(#metal-${uid})`)}
    </g>
  </g>
  <rect x="0" y="118" width="280" height="50" fill="url(#bg-${uid})" opacity="0.88"/>
  <line x1="16" y1="118" x2="264" y2="118" stroke="#${frame.stroke}" stroke-opacity="0.35" stroke-width="1"/>
  <text x="140" y="138" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="800" letter-spacing="0.04em">${line1}</text>
  ${line2 ? `<text x="140" y="156" text-anchor="middle" fill="#cbd5e1" font-family="system-ui,Segoe UI,sans-serif" font-size="10" font-weight="600" opacity="0.92">${line2}</text>` : `<text x="140" y="156" text-anchor="middle" fill="#94a3b8" font-family="system-ui,Segoe UI,sans-serif" font-size="9" font-weight="500" opacity="0.75">Démo visuelle</text>`}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** @deprecated préférer getSkinPreviewSrc / getSkinPreviewDataUrl */
export function getSkinImageUrl(name: string, rarity: SkinRarity): string {
  return getSkinPreviewDataUrl(name, rarity);
}

export function rollWearIndex(seedStr: string): number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)!) | 0;
  }
  const u = ((h >>> 0) % 10000) / 10000;
  let acc = 0;
  for (let i = 0; i < WEAR_ROWS.length; i++) {
    acc += WEAR_ROWS[i]!.weight;
    if (u < acc) return i;
  }
  return WEAR_ROWS.length - 1;
}

export function wearLabelAt(index: number): (typeof WEAR_ROWS)[number] {
  return WEAR_ROWS[Math.max(0, Math.min(WEAR_ROWS.length - 1, index))]!;
}
