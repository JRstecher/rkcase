let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  sharedCtx ??= new Ctor();
  return sharedCtx;
}

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  const t0 = startAt;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** À appeler au clic « Ouvrir » (geste utilisateur) pour éviter le blocage autoplay. */
export function primeWinRevealAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
}

export function playWinRevealChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const t0 = ctx.currentTime;
  const layers: { freq: number; delay: number; dur: number; peak: number }[] =
    [
      { freq: 392.0, delay: 0, dur: 0.22, peak: 0.11 },
      { freq: 523.25, delay: 0.07, dur: 0.24, peak: 0.13 },
      { freq: 659.25, delay: 0.14, dur: 0.26, peak: 0.14 },
      { freq: 783.99, delay: 0.21, dur: 0.35, peak: 0.16 },
    ];
  for (const L of layers) {
    scheduleTone(ctx, L.freq, t0 + L.delay, L.dur, L.peak);
  }
}

/** Court motif « caisse qui s’ouvre » (battle) — accord montant, pas des ticks. */
export function playBattleCaseOpenSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const t0 = ctx.currentTime;
  const layers: { freq: number; delay: number; dur: number; peak: number }[] =
    [
      { freq: 155.56, delay: 0, dur: 0.38, peak: 0.1 },
      { freq: 233.08, delay: 0.05, dur: 0.34, peak: 0.09 },
      { freq: 349.23, delay: 0.1, dur: 0.3, peak: 0.11 },
      { freq: 466.16, delay: 0.14, dur: 0.26, peak: 0.12 },
      { freq: 698.46, delay: 0.18, dur: 0.22, peak: 0.13 },
    ];
  for (const L of layers) {
    scheduleTone(ctx, L.freq, t0 + L.delay, L.dur, L.peak);
  }
}

/** Fin de battle : motif descendant (résolution), quand le popup résultat apparaît. */
export function playBattleEndSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const t0 = ctx.currentTime;
  const layers: { freq: number; delay: number; dur: number; peak: number }[] =
    [
      { freq: 783.99, delay: 0, dur: 0.2, peak: 0.12 },
      { freq: 659.25, delay: 0.06, dur: 0.22, peak: 0.11 },
      { freq: 523.25, delay: 0.12, dur: 0.26, peak: 0.12 },
      { freq: 392.0, delay: 0.18, dur: 0.32, peak: 0.11 },
      { freq: 261.63, delay: 0.24, dur: 0.38, peak: 0.1 },
    ];
  for (const L of layers) {
    scheduleTone(ctx, L.freq, t0 + L.delay, L.dur, L.peak);
  }
}
