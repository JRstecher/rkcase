"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BattleTiebreakerRoll,
  type TiebreakPlayer,
} from "@/components/BattleTiebreakerRoll";
import { BattleRouletteRows } from "@/components/BattleRouletteRows";
import { SkinPreviewImage } from "@/components/SkinPreviewImage";
import {
  BATTLE_MAX_PARTICIPANTS_MAX,
  BATTLE_MAX_PARTICIPANTS_MIN,
  BATTLE_ROUNDS_MAX,
  BATTLE_ROUNDS_MIN,
  clampBattleMaxParticipants,
  clampBattleRounds,
  clampLobbyBotCount,
} from "@/lib/battleConfig";
import { battleParticipantsLine, battleSlotLabel } from "@/lib/battleBots";
import { BSCoinInline } from "@/components/BSCoin";
import { formatBSCoinLabel } from "@/lib/money";
import {
  BATTLE_REEL_LEN,
  buildSpinReel,
  type RouletteItem,
  ROULETTE_WIN_INDEX,
} from "@/lib/rouletteReel";
import { getSkinPreviewSrc } from "@/lib/skinVisual";
import { csgoTier } from "@/components/RouletteSkinCard";
import {
  playBattleCaseOpenSound,
  playBattleEndSound,
  primeWinRevealAudio,
} from "@/lib/winRevealSound";

type CaseRow = { slug: string; name: string; price: number };

type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

type ApiItem = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  imageUrl: string | null;
};

type BattleRoll = {
  slotIndex: number;
  roundIndex: number;
  label: string;
  nonce: number;
  item: ApiItem;
};

type BattleTiebreaker = {
  nonce: number;
  tiedSlotIndices: number[];
  rollIndex: number;
};

type BattleResult = {
  balance: number | null;
  battle: {
    id: string;
    case: CaseRow;
    slots: number;
    rounds: number;
    winnerSlot: number;
    userWon: boolean;
    tiebreaker: BattleTiebreaker | null;
    serverSeed: string;
    clientSeed: string;
    rolls: BattleRoll[];
    caseDrops: { item: ApiItem; weight: number }[];
  };
};

function battleModeLabel(slots: number): string {
  return Array.from({ length: slots }, () => "1").join("v");
}

const BETWEEN_ROUNDS_MS = 650;

export function BattleClient({ cases }: { cases: CaseRow[] }) {
  const [slug, setSlug] = useState(() => cases[0]?.slug ?? "");
  /** Capacité max (toi inclus), fixée avant le lobby — max 4. */
  const [maxParticipants, setMaxParticipants] = useState(
    BATTLE_MAX_PARTICIPANTS_MAX,
  );
  const [lobbyCreated, setLobbyCreated] = useState(false);
  /** Bots ajoutés dans le lobby (0 → ajouter un par un jusqu’à max − 1). */
  const [lobbyBotCount, setLobbyBotCount] = useState(0);
  const slots = 1 + lobbyBotCount;
  const [rounds, setRounds] = useState(1);
  const [clientSeed, setClientSeed] = useState("demo-client-seed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [activeRound, setActiveRound] = useState(0);
  const [betweenRounds, setBetweenRounds] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [spinFinished, setSpinFinished] = useState(false);
  const [tiebreakDone, setTiebreakDone] = useState(true);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const battleOpenSoundForSpinKey = useRef<number | null>(null);
  const battleEndSoundForSpinKey = useRef<number | null>(null);

  const onAllBattleSpinsComplete = useCallback(() => {
    setSpinFinished(true);
  }, []);

  const onTiebreakComplete = useCallback(() => {
    setTiebreakDone(true);
  }, []);

  const closeResultAndResetLobby = useCallback(() => {
    setPopupDismissed(true);
    setLobbyCreated(false);
    setLobbyBotCount(0);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!lobbyCreated) return;
    setLobbyBotCount((b) => clampLobbyBotCount(b, maxParticipants));
  }, [maxParticipants, lobbyCreated]);

  const roundsTotal = result?.battle.rounds ?? 1;
  const lastRoundIdx = roundsTotal - 1;
  const allRoundsDone =
    Boolean(result) && spinFinished && activeRound >= lastRoundIdx;

  const roundRolls = useMemo(() => {
    if (!result) return [];
    return result.battle.rolls
      .filter((r) => r.roundIndex === activeRound)
      .sort((a, b) => a.slotIndex - b.slotIndex);
  }, [result, activeRound]);

  const roundStrips: RouletteItem[][] = useMemo(() => {
    if (!result || roundRolls.length === 0) return [];
    return roundRolls.map((roll) =>
      buildSpinReel(
        result.battle.caseDrops,
        roll.item,
        ROULETTE_WIN_INDEX,
        BATTLE_REEL_LEN,
      ),
    );
  }, [result, roundRolls]);

  const needsTiebreakAnim = Boolean(
    result?.battle.tiebreaker && !tiebreakDone,
  );
  const battleOverlayOpen =
    Boolean(result) &&
    roundStrips.length > 0 &&
    (!allRoundsDone || needsTiebreakAnim);

  const showPopup =
    Boolean(result) && allRoundsDone && tiebreakDone && !popupDismissed;

  const lobbyLocked = busy || battleOverlayOpen || showPopup;

  const tiebreakPlayers: TiebreakPlayer[] = useMemo(() => {
    const tb = result?.battle.tiebreaker;
    if (!tb || !result) return [];
    return tb.tiedSlotIndices.map((si) => ({
      slotIndex: si,
      label:
        result.battle.rolls.find((r) => r.slotIndex === si)?.label ??
        battleSlotLabel(si),
    }));
  }, [result]);

  useEffect(() => {
    if (!result || !spinFinished) return;
    if (activeRound >= result.battle.rounds - 1) return;
    setBetweenRounds(true);
    const t = window.setTimeout(() => {
      setBetweenRounds(false);
      setActiveRound((r) => r + 1);
      setSpinFinished(false);
      setSpinKey((k) => k + 1);
    }, BETWEEN_ROUNDS_MS);
    return () => window.clearTimeout(t);
  }, [result, spinFinished, activeRound]);

  /** Un seul son d’ouverture de caisse au début de chaque manche (spinKey). */
  useEffect(() => {
    if (!battleOverlayOpen) return;
    if (battleOpenSoundForSpinKey.current === spinKey) return;
    battleOpenSoundForSpinKey.current = spinKey;
    playBattleCaseOpenSound();
  }, [battleOverlayOpen, spinKey]);

  useEffect(() => {
    if (!showPopup || !result) return;
    if (battleEndSoundForSpinKey.current === spinKey) return;
    battleEndSoundForSpinKey.current = spinKey;
    playBattleEndSound();
  }, [showPopup, spinKey, result]);

  useEffect(() => {
    if (!showPopup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeResultAndResetLobby();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showPopup, closeResultAndResetLobby]);

  useEffect(() => {
    if (!battleOverlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [battleOverlayOpen]);

  const selected = useMemo(
    () => cases.find((c) => c.slug === slug),
    [cases, slug],
  );

  const totalCost =
    selected && lobbyCreated && lobbyBotCount >= 1
      ? selected.price * slots * rounds
      : null;
  const estimatedMinCost = selected
    ? selected.price * BATTLE_MAX_PARTICIPANTS_MIN * rounds
    : 0;
  const estimatedMaxCost = selected
    ? selected.price * maxParticipants * rounds
    : 0;
  const canAddBot = lobbyBotCount < maxParticipants - 1;
  const canLaunch = lobbyCreated && lobbyBotCount >= 1;

  const sortedRollsForPopup = useMemo(() => {
    if (!result) return [];
    return [...result.battle.rolls].sort(
      (a, b) => a.roundIndex - b.roundIndex || a.slotIndex - b.slotIndex,
    );
  }, [result]);

  const multiRound = (result?.battle.rounds ?? 1) > 1;

  async function launch() {
    if (!slug || !selected || !lobbyCreated) return;
    const safeMax = clampBattleMaxParticipants(maxParticipants);
    const safeBots = clampLobbyBotCount(lobbyBotCount, safeMax);
    if (safeBots < 1) return;
    const safeSlots = 1 + safeBots;
    const safeRounds = clampBattleRounds(rounds);
    setMaxParticipants(safeMax);
    setLobbyBotCount(safeBots);
    setRounds(safeRounds);
    primeWinRevealAudio();
    setBusy(true);
    setError(null);
    setResult(null);
    setActiveRound(0);
    setBetweenRounds(false);
    setSpinFinished(false);
    setTiebreakDone(true);
    setPopupDismissed(false);
    try {
      const r = await fetch("/api/battle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseSlug: slug,
          slots: safeSlots,
          rounds: safeRounds,
          clientSeed,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        let message = t || "Erreur serveur";
        try {
          const j = JSON.parse(t) as { error?: string };
          if (typeof j.error === "string" && j.error.length > 0) {
            message = j.error;
          }
        } catch {
          /* corps non-JSON */
        }
        throw new Error(message);
      }
      const json = (await r.json()) as BattleResult;
      setResult(json);
      setTiebreakDone(json.battle.tiebreaker == null);
      setSpinKey((k) => k + 1);
      if (typeof json.balance === "number") {
        window.dispatchEvent(
          new CustomEvent("casebs:balance", {
            detail: { balance: json.balance },
          }),
        );
      }
      window.dispatchEvent(new CustomEvent("casebs:inventory"));
      window.dispatchEvent(new CustomEvent("casebs:giveaway"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de lancer la battle.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (cases.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Aucune caisse. Lance le seed (API) ou recharge la page.
      </p>
    );
  }

  const overlayTitle =
    allRoundsDone && result?.battle.tiebreaker && !tiebreakDone
      ? "Départage"
      : result && roundsTotal > 1
        ? `Battle ${battleModeLabel(result.battle.slots)} · Manche ${activeRound + 1} / ${roundsTotal}`
        : result
          ? `Battle ${battleModeLabel(result.battle.slots)}`
          : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <section className="rk-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">
          {lobbyCreated ? "Battle prête" : "Configuration"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase text-zinc-500">
              Caisse
            </label>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={lobbyCreated}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {cases.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} — {formatBSCoinLabel(c.price)}
                </option>
              ))}
            </select>
          </div>
          {!lobbyCreated ? (
            <div className="sm:col-span-2">
              <label
                htmlFor="battle-max-players"
                className="text-xs font-semibold uppercase text-zinc-500"
              >
                Places max (toi inclus)
              </label>
              <p className="mt-1 text-xs text-zinc-500">
                Jusqu&apos;à {BATTLE_MAX_PARTICIPANTS_MAX} personnes par battle.
                Après création, tu ajoutes les bots un par un.
              </p>
              <select
                id="battle-max-players"
                value={maxParticipants}
                onChange={(e) =>
                  setMaxParticipants(
                    clampBattleMaxParticipants(Number(e.target.value)),
                  )
                }
                className="mt-2 w-full max-w-xs rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {Array.from(
                  {
                    length:
                      BATTLE_MAX_PARTICIPANTS_MAX -
                      BATTLE_MAX_PARTICIPANTS_MIN +
                      1,
                  },
                  (_, i) => BATTLE_MAX_PARTICIPANTS_MIN + i,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} places ({n - 1} bot{n > 2 ? "s" : ""} max)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Lobby
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Capacité : <span className="text-white">{maxParticipants}</span>{" "}
                places · mode{" "}
                <span className="text-zinc-400">
                  {lobbyBotCount === 0 ? "—" : battleModeLabel(slots)}
                </span>
              </p>
              <p className="mt-3 text-xs text-zinc-500">Participants</p>
              <p className="mt-1 font-mono text-xs text-zinc-300">
                {lobbyBotCount === 0
                  ? "Toi"
                  : battleParticipantsLine(slots).join(" · ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLobbyBotCount((b) =>
                      clampLobbyBotCount(b + 1, maxParticipants),
                    )
                  }
                  disabled={!canAddBot || lobbyLocked}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ajouter un bot
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLobbyBotCount((b) => Math.max(0, b - 1))
                  }
                  disabled={lobbyBotCount <= 0 || lobbyLocked}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Retirer le dernier bot
                </button>
              </div>
              {!canAddBot ? (
                <p className="mt-2 text-xs text-amber-200/80">
                  Capacité atteinte ({maxParticipants} places).
                </p>
              ) : null}
              {lobbyBotCount === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Ajoute au moins un bot pour lancer la battle.
                </p>
              ) : null}
            </div>
          )}
          <div className={lobbyCreated ? "sm:col-span-2" : ""}>
            <label
              htmlFor="battle-rounds"
              className="text-xs font-semibold uppercase text-zinc-500"
            >
              Caisses (manches)
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="battle-rounds"
                type="number"
                inputMode="numeric"
                min={BATTLE_ROUNDS_MIN}
                max={BATTLE_ROUNDS_MAX}
                step={1}
                value={rounds}
                disabled={lobbyCreated}
                onChange={(e) => {
                  const s = e.target.value;
                  if (s === "") return;
                  const n = Number.parseInt(s, 10);
                  if (Number.isNaN(n)) return;
                  if (n > BATTLE_ROUNDS_MAX) setRounds(BATTLE_ROUNDS_MAX);
                  else setRounds(n);
                }}
                onBlur={() => setRounds((r) => clampBattleRounds(r))}
                className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white tabular-nums disabled:opacity-50"
              />
              <span className="text-xs text-zinc-500">
                {BATTLE_ROUNDS_MIN}–{BATTLE_ROUNDS_MAX} · une roue par
                participant par manche, dans l&apos;ordre
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase text-zinc-500">
            Client seed
          </label>
          <input
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            disabled={lobbyCreated}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50"
          />
        </div>
        {selected ? (
          <p className="mt-3 text-sm text-zinc-400">
            {lobbyCreated && totalCost != null ? (
              <>
                Coût de cette battle :{" "}
                <span className="inline-flex items-center font-semibold text-white">
                  <BSCoinInline
                    cents={totalCost}
                    iconSize={15}
                    gapClass="gap-1.5"
                  />
                </span>{" "}
                ({slots} participant{slots > 1 ? "s" : ""} × {rounds} manche
                {rounds > 1 ? "s" : ""} ×{" "}
                <BSCoinInline
                  cents={selected.price}
                  iconSize={14}
                  gapClass="gap-1"
                  className="align-middle"
                />
                )
              </>
            ) : (
              <>
                Fourchette de coût (selon bots ajoutés) :{" "}
                <span className="inline-flex items-center font-semibold text-white">
                  <BSCoinInline
                    cents={estimatedMinCost}
                    iconSize={15}
                    gapClass="gap-1.5"
                  />
                </span>
                {" — "}
                <span className="inline-flex items-center font-semibold text-white">
                  <BSCoinInline
                    cents={estimatedMaxCost}
                    iconSize={15}
                    gapClass="gap-1.5"
                  />
                </span>{" "}
                ({BATTLE_MAX_PARTICIPANTS_MIN}–{maxParticipants} places ×{" "}
                {rounds} manche{rounds > 1 ? "s" : ""})
              </>
            )}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          {!lobbyCreated ? (
            <button
              type="button"
              onClick={() => {
                setMaxParticipants((m) => clampBattleMaxParticipants(m));
                setLobbyCreated(true);
                setLobbyBotCount(0);
                setError(null);
              }}
              disabled={!selected}
              className="min-h-11 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              Créer la battle
            </button>
          ) : (
            <>
              <button
                type="button"
                onPointerDown={() => primeWinRevealAudio()}
                onClick={() => void launch()}
                disabled={!selected || busy || !canLaunch}
                className="min-h-11 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {busy ? "Battle…" : "Lancer la battle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLobbyCreated(false);
                  setLobbyBotCount(0);
                  setError(null);
                }}
                disabled={lobbyLocked}
                className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-50"
              >
                Annuler
              </button>
            </>
          )}
          <Link
            href="/cases"
            className="self-center text-sm text-indigo-300 hover:underline"
          >
            ← Cases
          </Link>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {battleOverlayOpen && result ? (
        <div
          className={`fixed inset-0 z-[55] flex items-center justify-center bg-black/90 backdrop-blur-sm ${
            result.battle.slots === 2 ? "p-2 sm:p-4" : "p-4"
          }`}
        >
          <div
            className={`rk-card min-h-0 overflow-auto ${
              result.battle.slots === 2
                ? "flex max-h-[96vh] w-[min(1400px,calc(100vw-12px))] max-w-[98vw] flex-col items-center justify-center px-3 py-6 sm:px-10 sm:py-10"
                : `max-h-[90vh] w-full min-w-0 p-6 ${
                    result.battle.slots > 4
                      ? "max-w-[min(1600px,98vw)]"
                      : "max-w-5xl"
                  }`
            }`}
          >
            <h2
              className={`text-center font-semibold text-white ${
                result.battle.slots === 2
                  ? "text-xl sm:text-2xl"
                  : "text-lg"
              }`}
            >
              {overlayTitle}
            </h2>
            <div className={result.battle.slots === 2 ? "mt-8 w-full" : "mt-6"}>
              {betweenRounds ? (
                <p className="py-16 text-center text-sm text-zinc-400">
                  Manche suivante…
                </p>
              ) : allRoundsDone &&
                result.battle.tiebreaker &&
                !tiebreakDone &&
                tiebreakPlayers.length > 0 ? (
                <BattleTiebreakerRoll
                  key={`tie-${spinKey}`}
                  tied={tiebreakPlayers}
                  rollIndex={result.battle.tiebreaker.rollIndex}
                  spinKey={spinKey}
                  onComplete={onTiebreakComplete}
                />
              ) : !spinFinished ? (
                <BattleRouletteRows
                  key={spinKey}
                  duel={result.battle.slots === 2}
                  strips={roundStrips}
                  labels={roundRolls.map((r) => r.label)}
                  spinKey={spinKey}
                  onAllSpinsComplete={onAllBattleSpinsComplete}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showPopup && result ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            aria-label="Fermer"
            onClick={closeResultAndResetLobby}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#12141c] p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white">Résultat</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Solde :{" "}
              <span className="text-white">
                {result.balance != null ? (
                  <BSCoinInline cents={result.balance} iconSize={15} />
                ) : (
                  "—"
                )}
              </span>
            </p>
            {result.battle.tiebreaker ? (
              <p className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/10 p-3 text-sm text-sky-100">
                {multiRound
                  ? "Égalité sur la somme des valeurs sur toutes les manches — "
                  : "Égalité sur la meilleure valeur — "}
                départage provably fair (nonce{" "}
                {result.battle.tiebreaker.nonce}, en lice :{" "}
                {result.battle.tiebreaker.tiedSlotIndices
                  .map((si) => {
                    const label = result.battle.rolls.find(
                      (r) => r.slotIndex === si,
                    )?.label;
                    return label ?? battleSlotLabel(si);
                  })
                  .join(", ")}
                ).
              </p>
            ) : null}
            {result.battle.userWon ? (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                Tu gagnes : toutes les armes de toutes les manches sont dans ton
                inventaire.
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                Un bot a gagné
                {result.battle.tiebreaker
                  ? " (après départage)"
                  : multiRound
                    ? " (meilleure somme totale)"
                    : " (meilleure valeur)"}
                . Rien n&apos;est ajouté à l&apos;inventaire — tu dois gagner
                pour récupérer le butin.
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {sortedRollsForPopup.map((r) => (
                <li
                  key={`${r.roundIndex}-${r.slotIndex}`}
                  className="flex items-center gap-3 rounded-lg bg-white/5 p-2"
                >
                  <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded border border-white/10">
                    <SkinPreviewImage
                      src={getSkinPreviewSrc(r.item)}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium text-white">
                      {r.label}
                      {multiRound ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          · Manche {r.roundIndex + 1}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-zinc-400">
                      {r.item.name} · {csgoTier[r.item.rarity]} ·{" "}
                      <BSCoinInline cents={r.item.value} iconSize={13} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={closeResultAndResetLobby}
              className="mt-6 w-full rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
