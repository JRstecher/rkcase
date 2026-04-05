export type SkinRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

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

function skinPalette(fullName: string, rarity: SkinRarity) {
  const h = hashName(fullName);
  const hue1 = h % 360;
  const hue2 = (h * 17 + 127) % 360;
  const sat = 42 + (h % 38);
  const bump = { COMMON: 0, RARE: 6, EPIC: 12, LEGENDARY: 18 }[rarity];
  const s = Math.min(88, sat + bump);
  const L1 = 22 + (h % 15);
  const L2 = 38 + ((h >> 8) % 22);
  const L3 = 55 + ((h >> 16) % 18);
  return {
    a: `hsl(${hue1},${s}%,${L2}%)`,
    b: `hsl(${hue2},${Math.min(90, s + 8)}%,${L1}%)`,
    c: `hsl(${(h * 7 + 240) % 360},${s - 5}%,${L3}%)`,
    shine: `hsl(${hue1},30%,85%)`,
  };
}

export function getSkinPreviewDataUrl(name: string, rarity: SkinRarity): string {
  const line = name.includes("|")
    ? name.split("|").map((s) => s.trim())
    : [name];
  const weapon = line[0] ?? name;
  const skin = line[1] ?? "";
  const p = skinPalette(name, rarity);
  const f = rarityFrame[rarity];
  const w = escSvgText(weapon.slice(0, 22));
  const s = escSvgText(skin.slice(0, 20));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="180" viewBox="0 0 280 180">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${p.a}"/>
      <stop offset="50%" style="stop-color:${p.b}"/>
      <stop offset="100%" style="stop-color:${p.c}"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="280" height="180" fill="#0f1118"/>
  <circle cx="220" cy="40" r="70" fill="${p.b}" opacity="0.35" filter="url(#blur)"/>
  <rect x="24" y="44" width="232" height="92" rx="14" fill="url(#g)" stroke="#${f.stroke}" stroke-width="2"/>
  <text x="140" y="88" text-anchor="middle" fill="${p.shine}" font-family="system-ui,sans-serif" font-size="13" font-weight="700">${w}</text>
  <text x="140" y="112" text-anchor="middle" fill="#cbd5e1" font-family="system-ui,sans-serif" font-size="11">${s}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getSkinPreviewSrc(item: {
  name: string;
  rarity: SkinRarity;
  imageUrl?: string | null;
}): string {
  const u = item.imageUrl?.trim();
  if (u && /^https:\/\//i.test(u)) return u;
  return getSkinPreviewDataUrl(item.name, item.rarity);
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

export function wearLabelAt(idx: number): { key: string; label: string } {
  const r = WEAR_ROWS[Math.max(0, Math.min(idx, WEAR_ROWS.length - 1))]!;
  return { key: r.key, label: r.label };
}
