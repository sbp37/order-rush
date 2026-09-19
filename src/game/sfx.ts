let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, when = 0): void {
  const c = ac();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur);
}

export const sfx = {
  click: () => tone(520, 0.07, 'triangle', 0.08),
  startCook: () => {
    tone(330, 0.08, 'triangle', 0.1);
    tone(392, 0.1, 'triangle', 0.1, 0.06);
  },
  done: () => {
    tone(660, 0.1, 'sine', 0.12);
    tone(880, 0.16, 'sine', 0.12, 0.08);
  },
  serve: () => {
    tone(784, 0.08, 'square', 0.07);
    tone(988, 0.08, 'square', 0.07, 0.06);
    tone(1319, 0.14, 'square', 0.07, 0.12);
  },
  pickup: () => tone(600, 0.06, 'triangle', 0.09),
  angry: () => {
    tone(300, 0.15, 'sawtooth', 0.08);
    tone(220, 0.25, 'sawtooth', 0.08, 0.12);
  },
  denied: () => tone(180, 0.12, 'square', 0.08),
  end: () => {
    tone(523, 0.15, 'triangle', 0.1);
    tone(659, 0.15, 'triangle', 0.1, 0.15);
    tone(784, 0.25, 'triangle', 0.1, 0.3);
  },
};
