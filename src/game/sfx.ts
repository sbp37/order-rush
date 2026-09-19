let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, when = 0, detune = 0): void {
  const c = ac();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.detune.setValueAtTime(detune, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur);
}

function sizzle(dur: number, gain = 0.06, when = 0): void {
  const c = ac();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 5200;
  f.Q.value = 0.6;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

export const sfx = {
  click: () => tone(520, 0.07, 'triangle', 0.08),
  startCook: () => {
    sizzle(0.35, 0.05);
    tone(330, 0.08, 'triangle', 0.1);
    tone(392, 0.1, 'triangle', 0.1, 0.06);
  },
  done: () => {
    // ding-dong bell
    tone(880, 0.35, 'sine', 0.1);
    tone(1174, 0.4, 'sine', 0.09, 0.12);
    tone(587, 0.1, 'triangle', 0.06, 0);
  },
  serve: (combo = 0) => {
    const st = Math.min(combo, 10) * 100; // cents up per combo level
    tone(784, 0.08, 'square', 0.07, 0, st);
    tone(988, 0.08, 'square', 0.07, 0.06, st);
    tone(1319, 0.14, 'square', 0.07, 0.12, st);
    if (combo >= 2) tone(1568, 0.12, 'square', 0.05, 0.18, st);
    sizzle(0.12, 0.03);
  },
  pickup: () => {
    tone(500, 0.05, 'triangle', 0.09);
    tone(700, 0.07, 'triangle', 0.07, 0.04);
  },
  angry: () => {
    tone(300, 0.15, 'sawtooth', 0.08);
    tone(220, 0.25, 'sawtooth', 0.08, 0.12);
    tone(150, 0.3, 'sawtooth', 0.06, 0.22);
  },
  denied: () => tone(180, 0.12, 'square', 0.08),
  fever: () => {
    tone(523, 0.08, 'sawtooth', 0.07);
    tone(659, 0.08, 'sawtooth', 0.07, 0.06);
    tone(784, 0.08, 'sawtooth', 0.07, 0.12);
    tone(1046, 0.16, 'sawtooth', 0.07, 0.18);
    sizzle(0.5, 0.05);
  },
  buy: () => {
    tone(988, 0.09, 'sine', 0.1);
    tone(1319, 0.14, 'sine', 0.1, 0.07);
  },
  end: () => {
    tone(523, 0.15, 'triangle', 0.1);
    tone(659, 0.15, 'triangle', 0.1, 0.15);
    tone(784, 0.25, 'triangle', 0.1, 0.3);
    tone(1046, 0.35, 'sine', 0.08, 0.45);
  },
};
