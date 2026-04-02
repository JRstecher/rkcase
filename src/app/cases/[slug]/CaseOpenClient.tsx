"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import { useRoulettePassTick } from "@/hooks/useCaseSpinAudio";
import { formatCentsEUR } from "@/lib/money";
import {
  getSkinPreviewSrc,
  rollWearIndex,
  wearLabelAt,
  WEAR_ROWS,
} from "@/lib/skinVisual";

type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

type ApiItem = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  imageUrl: string | null;
};

type CaseDrop = {
  item: ApiItem;
  weight: number;
  chance: number;
};

type CasePayload = {
  case: { slug: string; name: string; price: number };
  drops: CaseDrop[];
};

type OpenResult = {
  balance: number | null;
  opening: {
    id: string;
    createdAt: string;
    case: { slug: string; name: string; price: number };
    wonItem: ApiItem;
    fairness: { clientSeed: string; serverSeed: string; nonce: number };
  };
};

const SPIN_MS = 5400;

/** Largeur carte + gap */
const CARD_W = 120;
const GAP = 8;
const SLOT = CARD_W + GAP;
const TRACK_PAD = 16;
const WIN_INDEX = 52;
const REEL_LEN = 64;
const SPIN_EXTRA_PX = 3400;

const csgoTier: Record<Rarity, string> = {
  COMMON: "Consumer",
  RARE: "Mil-Spec",
  EPIC: "Classified",
  LEGENDARY: "Covert",
};

const csgoFrame: Record<Rarity, string> = {
  COMMON:
    "border-l-[#b0c3d9] bg-gradient-to-br from-[#2f323c] to-[#181a20] shadow-inner",
  RARE: "border-l-[#4b69ff] bg-gradient-to-br from-[#252a4a] to-[#141824]",
  EPIC: "border-l-[#d32ce6] bg-gradient-to-br from-[#3a1f45] to-[#160f1c]",
  LEGENDARY:
    "border-l-[#eb4b4b] bg-gradient-to-br from-[#4a2525] to-[#1a1010] ring-1 ring-amber-500/25",
};

const rarityBadge: Record<Rarity, string> = {
  COMMON: "text-[#b0c3d9]",
  RARE: "text-[#4b69ff]",
  EPIC: "text-[#d32ce6]",
  LEGENDARY: "text-[#caab05]",
};

function formatPct(p: number) {
  const v = p * 100;
  if (v >= 10) return `${v.toFixed(1)}%`;
  if (v >= 1) return `${v.toFixed(2)}%`;
  if (v >= 0.1) return `${v.toFixed(2)}%`;
  return `${v.toFixed(3)}%`;
}

function parseSkinName(full: string) {
  const i = full.indexOf("|");
  if (i === -1) return { weapon: full, finish: "" };
  return {
    weapon: full.slice(0, i).trim(),
    finish: full.slice(i + 1).trim(),
  };
}

function randomFromPool(pool: ApiItem[]): ApiItem {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function buildSpinReel(
  drops: CaseDrop[],
  won: ApiItem,
  winIndex: number,
  len: number,
): ApiItem[] {
  const pool = drops.map((d) => d.item);
  const out: ApiItem[] = [];
  for (let i = 0; i < len; i++) {
    if (i === winIndex) out.push(won);
    else out.push(randomFromPool(pool));
  }
  return out;
}

function SkinCard({ item }: { item: ApiItem }) {
  const { weapon, finish } = parseSkinName(item.name);
  const img = getSkinPreviewSrc(item);
  return (
    <div
      className={`flex w-[120px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/10 border-l-4 ${csgoFrame[item.rarity]}`}
    >
      <div className="relative h-[76px] w-full shrink-0 overflow-hidden bg-black/40">
        <SkinPreviewImage
          src={img}
          alt={item.name}
          fill
          sizes="120px"
          className="object-cover object-center"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-1.5">
        <div>
          <div className="text-[9px] font-medium uppercase tracking-wide text-white/55">
            {weapon}
          </div>
          <div className="line-clamp-2 text-[10px] font-semibold leading-tight text-white">
            {finish ? `| ${finish}` : item.name}
          </div>
        </div>
        <div className="flex items-end justify-between gap-1">
          <span
            className={`text-[8px] font-bold uppercase ${rarityBadge[item.rarity]}`}
          >
            {csgoTier[item.rarity]}
          </span>
          <span className="text-[8px] text-white/45">
            {formatCentsEUR(item.value)}
          </span>
        </div>
      </div>
    </div>
  );
}

function DropProbabilityTable({ drops }: { drops: CaseDrop[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Probabilités par skin et par état d&apos;usure pour cette caisse
        </caption>
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wide text-white/60">
            <th scope="col" className="px-2 py-2 font-semibold">
              Aperçu
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Skin
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Rareté
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              P(total)
            </th>
            {WEAR_ROWS.map((w) => (
              <th
                key={w.key}
                scope="col"
                className="px-1 py-2 text-center font-semibold"
              >
                {w.key}
                <span className="block font-normal normal-case text-white/40">
                  {w.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drops.map((d) => (
            <tr
              key={d.item.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
            >
              <td className="p-2 align-middle">
                <div className="relative h-12 w-16 overflow-hidden rounded-md border border-white/10">
                  <SkinPreviewImage
                    src={getSkinPreviewSrc(d.item)}
                    alt={d.item.name}
                    fill
                    sizes="64px"
                    className="object-cover object-center"
                  />
                </div>
              </td>
              <td className="max-w-[200px] px-2 align-middle font-medium text-white">
                {d.item.name}
              </td>
              <td className="px-2 align-middle text-white/80">
                {csgoTier[d.item.rarity]}
              </td>
              <td className="px-2 align-middle font-semibold text-indigo-200">
                {formatPct(d.chance)}
              </td>
              {WEAR_ROWS.map((w) => (
                <td
                  key={w.key}
                  className="px-1 py-2 text-center text-white/75"
                >
                  {formatPct(d.chance * w.weight)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/10 bg-black/20 px-3 py-2 text-[10px] leading-relaxed text-white/45">
        P(total) = chance d’obtenir ce skin dans la caisse. Colonnes FN→BS : probabilité
        conjointe skin + état d’usure (répartition démo). Somme des colonnes d’une ligne ≈
        P(skin).
      </p>
    </div>
  );
}

export function CaseOpenClient({ slug }: { slug: string }) {
  const [data, setData] = useState<CasePayload | null>(null);
  const [clientSeed, setClientSeed] = useState("demo-client-seed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OpenResult | null>(null);
  const [wheelStrip, setWheelStrip] = useState<ApiItem[] | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [tx, setTx] = useState(0);
  const [txTransition, setTxTransition] = useState("none");
  const [wheelAnimating, setWheelAnimating] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slotTickLastRef = useRef<number | null>(null);
  const { playTick, playTicksBurst } = useRoulettePassTick();

  const wonWear = useMemo(() => {
    if (!result) return null;
    const seed = `${result.opening.id}:${result.opening.wonItem.id}`;
    const idx = rollWearIndex(seed);
    return wearLabelAt(idx);
  }, [result]);

  /** Un tick audio à chaque fois qu’un nouveau slot (skin) passe sous le marqueur central. */
  useEffect(() => {
    if (!wheelAnimating || !wheelStrip?.length) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    slotTickLastRef.current = null;

    let rafId = 0;
    const loop = () => {
      const style = getComputedStyle(track);
      const raw = style.transform;
      const tx =
        raw === "none" ? 0 : new DOMMatrixReadOnly(raw).m41;
      const w = viewport.offsetWidth;
      const iFloat =
        (w / 2 - tx - TRACK_PAD - SLOT / 2) / SLOT;
      const slotIndex = Math.floor(iFloat);

      if (slotTickLastRef.current === null) {
        slotTickLastRef.current = slotIndex;
      } else if (slotIndex !== slotTickLastRef.current) {
        const prev = slotTickLastRef.current;
        const d = Math.abs(slotIndex - prev);
        if (d === 1) playTick();
        else playTicksBurst(d);
        slotTickLastRef.current = slotIndex;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [wheelAnimating, spinKey, wheelStrip?.length, playTick, playTicksBurst]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setResult(null);
    fetch(`/api/cases/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as CasePayload;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => setError("Case introuvable ou erreur serveur."));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const idlePool = useMemo(() => {
    if (!data) return [];
    return data.drops.map((d) => d.item);
  }, [data]);

  useLayoutEffect(() => {
    if (!wheelStrip?.length || !viewportRef.current) return;

    const el = viewportRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const w = el.offsetWidth;
    const centerOfWinCard = TRACK_PAD + WIN_INDEX * SLOT + SLOT / 2;
    const finalX = w / 2 - centerOfWinCard;

    if (reduced) {
      setTxTransition("none");
      setTx(finalX);
      setWheelAnimating(false);
      return;
    }

    const startX = finalX + SPIN_EXTRA_PX;
    setTxTransition("none");
    setTx(startX);

    const fallback = window.setTimeout(() => {
      setWheelAnimating(false);
    }, SPIN_MS + 600);

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTxTransition(
          `transform ${SPIN_MS / 1000}s cubic-bezier(0.1, 0.82, 0.12, 1)`,
        );
        setTx(finalX);
      });
    });

    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(fallback);
    };
  }, [wheelStrip, spinKey]);

  function onTrackTransitionEnd(e: React.TransitionEvent) {
    if (e.propertyName !== "transform") return;
    if (txTransition === "none") return;
    setWheelAnimating(false);
  }

  async function openCase() {
    if (!data || busy || wheelAnimating) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setWheelStrip(null);
    setTx(0);
    setTxTransition("none");
    setWheelAnimating(false);
    try {
      const r = await fetch("/api/open", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseSlug: data.case.slug, clientSeed }),
      });
      if (!r.ok) throw new Error(await r.text());
      const json = (await r.json()) as OpenResult;
      const strip = buildSpinReel(
        data.drops,
        json.opening.wonItem,
        WIN_INDEX,
        REEL_LEN,
      );
      setResult(json);
      setWheelStrip(strip);
      setSpinKey((k) => k + 1);
      setWheelAnimating(true);
    } catch {
      setError("Impossible d’ouvrir la case (serveur).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main
        id="contenu-principal"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="flex flex-col gap-2">
          <nav className="text-sm text-white/60" aria-label="Fil d’Ariane">
            <Link className="hover:text-white" href="/cases">
              Cases
            </Link>{" "}
            <span aria-hidden="true">/</span>{" "}
            <span className="text-white/80">{slug}</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {data?.case.name ?? "Chargement…"}
          </h1>
          <p className="text-sm text-white/70">
            Prix:{" "}
            <span className="font-semibold text-white">
              {data ? formatCentsEUR(data.case.price) : "—"}
            </span>
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rk-card rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">
                Roulette horizontale
              </div>
              <button
                type="button"
                onClick={openCase}
                disabled={!data || busy || wheelAnimating}
                aria-busy={busy || wheelAnimating}
                className="min-h-[44px] rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 enabled:hover:bg-indigo-400 disabled:opacity-60"
              >
                {busy
                  ? "Ouverture…"
                  : wheelAnimating
                    ? "Roulette en cours…"
                    : "Ouvrir la caisse"}
              </button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="client-seed"
                className="text-xs font-semibold uppercase tracking-wide text-white/60"
              >
                Client seed (fairness)
              </label>
              <input
                id="client-seed"
                name="clientSeed"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                autoComplete="off"
                className="mt-2 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90 focus:border-indigo-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12]"
              />
            </div>

            <div className="relative mt-6">
              <p id="roulette-hint" className="mb-2 text-center text-xs text-white/45">
                Aperçus SVG (démo) · un tick à chaque skin qui passe sous le marqueur · marqueur
                = drop
              </p>
              <div
                ref={viewportRef}
                role="region"
                aria-label="Roulette des skins"
                aria-busy={wheelAnimating}
                aria-describedby="roulette-hint"
                className="relative h-[168px] overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14] shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[3px] -translate-x-1/2 bg-gradient-to-b from-amber-300/90 via-white to-amber-300/90 shadow-[0_0_20px_rgba(251,191,36,0.7)]"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-black/85 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-black/85 to-transparent"
                  aria-hidden="true"
                />

                <div
                  ref={trackRef}
                  className="flex h-full items-center gap-2 px-4 will-change-transform"
                  aria-hidden="true"
                  style={{
                    transform: `translateX(${tx}px)`,
                    transition: txTransition,
                  }}
                  onTransitionEnd={onTrackTransitionEnd}
                >
                  {wheelStrip
                    ? wheelStrip.map((it, idx) => (
                        <SkinCard
                          key={`${spinKey}-${it.id}-${idx}`}
                          item={it}
                        />
                      ))
                    : idlePool.length > 0
                      ? Array.from({ length: 24 }, (_, idx) => (
                          <SkinCard
                            key={`idle-${idx}`}
                            item={idlePool[idx % idlePool.length] as ApiItem}
                          />
                        ))
                      : null}
                </div>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200"
              >
                {error}
              </div>
            ) : null}

            {result ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-4"
              >
                <div className="text-sm font-semibold text-white">
                  Obtenu :{" "}
                  <span className="text-indigo-100">
                    {result.opening.wonItem.name}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/70">
                  {csgoTier[result.opening.wonItem.rarity]}
                  {wonWear ? (
                    <>
                      {" "}
                      · <span className="text-amber-200/90">{wonWear.label}</span>
                    </>
                  ) : null}{" "}
                  · {formatCentsEUR(result.opening.wonItem.value)} · Solde:{" "}
                  <span className="font-semibold text-white">
                    {result.balance != null
                      ? formatCentsEUR(result.balance)
                      : "—"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-white/60">
                  Fairness: clientSeed={result.opening.fairness.clientSeed} ·
                  serverSeed=
                  {result.opening.fairness.serverSeed.slice(0, 10)}… · nonce=
                  {result.opening.fairness.nonce}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rk-card rounded-2xl p-5">
            <div className="text-sm font-semibold text-white">Résumé</div>
            <p className="mt-2 text-xs text-white/55">
              Le tableau complet (images, états FN–BS, probas) est sous la
              roulette.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {!data ? (
                <div className="text-sm text-white/60">Chargement…</div>
              ) : (
                data.drops.map((d) => (
                  <div
                    key={d.item.id}
                    className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-2 ring-1 ring-white/10"
                  >
                    <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded border border-white/10">
                      <SkinPreviewImage
                        src={getSkinPreviewSrc(d.item)}
                        alt={d.item.name}
                        fill
                        sizes="48px"
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">
                        {d.item.name}
                      </div>
                      <div className="text-[10px] text-white/55">
                        {formatPct(d.chance)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {data ? (
          <section className="rk-card mt-6 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white">
              Probabilités & états d’usure
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Chaque skin avec aperçu, rareté, probabilité globale dans la caisse,
              puis probabilité pour chaque état (Factory New … Battle-Scarred).
            </p>
            <DropProbabilityTable drops={data.drops} />
          </section>
        ) : null}
      </main>
    </div>
  );
}
