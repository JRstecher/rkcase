import { useCallback, useRef } from "react";

/**
 * Un court « clic » (tick) — utilisé quand la roulette fait passer un skin sous le marqueur.
 */
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
  g.gain.exponentialRampToValueAtTime(0.1, t0 + 0.0012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.02);
}

/**
 * Audio pour la roulette : un tick par passage de skin sous le centre (l’appelant pilote le timing).
 */
export function useRoulettePassTick() {
  const ctxRef = useRef<AudioContext | null>(null);
  const tickCountRef = useRef(0);

  const playTick = useCallback((delayMs = 0) => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();

    const when = ctx.currentTime + delayMs / 1000;
    tickCountRef.current += 1;
    scheduleOneTick(ctx, when, tickCountRef.current);
  }, []);

  /** Plusieurs skins « passés » dans la même frame (FPS bas) : ticks espacés de quelques ms. */
  const playTicksBurst = useCallback((count: number) => {
    const n = Math.min(Math.max(count, 1), 12);
    for (let i = 0; i < n; i++) playTick(i * 5);
  }, [playTick]);

  return { playTick, playTicksBurst };
}
