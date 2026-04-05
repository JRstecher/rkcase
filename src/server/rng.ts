import { createHash } from "crypto";

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * u ∈ [0, 1) dérivé d’un hash SHA-256 sur la chaîne
 * `clientSeed:nonce:serverSeed` — utilisé pour le tirage pondéré côté serveur
 * avant toute animation cliente.
 */
export function seededUnitFloat(input: {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}): number {
  const payload = `${input.clientSeed}:${input.nonce}:${input.serverSeed}`;
  const digest = createHash("sha256").update(payload).digest("hex");
  const bytes = hexToBytes(digest.slice(0, 16));
  let x = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    x = (x << BigInt(8)) | BigInt(bytes[i]!);
  }
  const max = BigInt(256) ** BigInt(bytes.length);
  const denom = Number(max);
  return Number(x % BigInt(denom)) / denom;
}

/**
 * u ∈ [0, 1) indépendant du tirage principal, pour un usage purement visuel
 * (ex. position du trait sur la carte) — payload distinct via `purpose`.
 */
export function seededUnitFloatForPurpose(
  input: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
  },
  purpose: string,
): number {
  const payload = `${input.clientSeed}:${input.nonce}:${input.serverSeed}:${purpose}`;
  const digest = createHash("sha256").update(payload).digest("hex");
  const bytes = hexToBytes(digest.slice(0, 16));
  let x = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    x = (x << BigInt(8)) | BigInt(bytes[i]!);
  }
  const max = BigInt(256) ** BigInt(bytes.length);
  const denom = Number(max);
  return Number(x % BigInt(denom)) / denom;
}

export function pickWeightedIndex(weights: number[], u: number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) throw new Error("Invalid weights");
  const t = u * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (t < acc) return i;
  }
  return weights.length - 1;
}
