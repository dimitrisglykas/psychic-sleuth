// Soft noir lounge ambience synthesized in the browser: slow jazz chords + vinyl crackle.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;

const CHORDS = [
  [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
  [98.0, 174.61, 246.94, 329.63, 349.23], // G13
  [130.81, 164.81, 246.94, 293.66, 392.0], // Cmaj9
  [110.0, 196.0, 277.18, 349.23, 466.16], // A7b9
];

function playChord(c: AudioContext, out: GainNode, freqs: number[], at: number, dur: number) {
  freqs.forEach((f, i) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(i === 0 ? 0.09 : 0.035, at + 0.6); g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
    o.connect(g).connect(out); o.start(at + i * 0.07); o.stop(at + dur + 0.1);
  });
}

function crackle(c: AudioContext, out: GainNode) {
  const len = c.sampleRate * 2; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0012 ? (Math.random() - 0.5) * 0.9 : (Math.random() - 0.5) * 0.015;
  const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
  const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
  src.connect(hp).connect(out); src.start();
}

export function startAmbience() {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain(); master.gain.value = 0.55;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
  master.connect(lp).connect(ctx.destination);
  crackle(ctx, master);
  let step = 0;
  const tick = () => { if (!ctx || !master) return; playChord(ctx, master, CHORDS[step % CHORDS.length]!, ctx.currentTime + 0.05, 3.8); step++; };
  tick(); timer = window.setInterval(tick, 3600);
}

export function stopAmbience() {
  if (timer) window.clearInterval(timer);
  timer = null; void ctx?.close(); ctx = null; master = null;
}
