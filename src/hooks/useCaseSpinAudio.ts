import { useCallback, useRef } from "react";

let sharedRouletteCtx: AudioContext | null = null;

function getRouletteAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  sharedRouletteCtx ??= new Ctor();
  return sharedRouletteCtx;
}

/** Court silence pour aider Chrome / Safari à « verrouiller » le contexte après resume. */
function silentUnlock(ctx: AudioContext): void {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g);
    g.connect(ctx.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/**
 * À appeler dans le geste utilisateur (clic « Lancer », pointerdown, etc.)
 * pour créer / réveiller l’AudioContext avant tout async.
 */
export function primeRouletteTickAudio(): void {
  const ctx = getRouletteAudioContext();
  if (!ctx) return;
  void ctx.resume().then(() => {
    silentUnlock(ctx);
  });
}

function scheduleOneTick(
  ctx: AudioContext,
  when: number,
  variant: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 1550 + (variant & 7) * 35;
  const g = ctx.createGain();
  const t0 = when;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.025);
}

/** « Tac » sec quand le trait passe sur une arme (caisse Hell) — triangle court, pas le carré des autres cases. */
function scheduleHellTac(
  ctx: AudioContext,
  when: number,
  variant: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 380 + (variant & 15) * 12;
  const g = ctx.createGain();
  const t0 = when;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.42, t0 + 0.0012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.028);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.032);
}

/** Début du roll Hell : léger grondement (remplace le burst de ticks des autres caisses). */
function scheduleHellRollIntro(ctx: AudioContext, when: number): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(88, when);
  osc.frequency.exponentialRampToValueAtTime(42, when + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.14, when + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.24);
}

export function useRoulettePassTick() {
  const tickCountRef = useRef(0);
  const hellTacCountRef = useRef(0);

  const playTick = useCallback((delayMs = 0) => {
    const ctx = getRouletteAudioContext();
    if (!ctx) return;

    const fire = () => {
      const when = ctx.currentTime + delayMs / 1000;
      tickCountRef.current += 1;
      scheduleOneTick(ctx, when, tickCountRef.current);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(fire);
    } else {
      fire();
    }
  }, []);

  const playTicksBurst = useCallback(
    (count: number) => {
      const n = Math.min(Math.max(count, 1), 12);
      for (let i = 0; i < n; i++) playTick(i * 5);
    },
    [playTick],
  );

  const playHellTac = useCallback(() => {
    const ctx = getRouletteAudioContext();
    if (!ctx) return;

    const fire = () => {
      const when = ctx.currentTime;
      hellTacCountRef.current += 1;
      scheduleHellTac(ctx, when, hellTacCountRef.current);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(fire);
    } else {
      fire();
    }
  }, []);

  const playHellRollIntro = useCallback(() => {
    const ctx = getRouletteAudioContext();
    if (!ctx) return;

    const fire = () => {
      scheduleHellRollIntro(ctx, ctx.currentTime);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(fire);
    } else {
      fire();
    }
  }, []);

  return { playTick, playTicksBurst, playHellTac, playHellRollIntro };
}
