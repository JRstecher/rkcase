import { createHash } from "crypto";

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

// Deterministic pseudo-random number in [0, 1) from seeds.
export function seededUnitFloat(params: {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}) {
  const h = sha256Hex(
    `${params.serverSeed}:${params.clientSeed}:${params.nonce}`,
  );
  // Take 52 bits (like JS float mantissa) from hex.
  const slice = h.slice(0, 13); // 13 hex chars = 52 bits
  const n = parseInt(slice, 16);
  return n / 2 ** 52;
}

export function pickWeightedIndex(weights: number[], u: number) {
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

