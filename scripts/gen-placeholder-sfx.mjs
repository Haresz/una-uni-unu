// Generates audible placeholder sound effects as 16-bit PCM WAV files.
// These are stand-ins so you can hear each game event; replace the files in
// public/sounds/ with your own clips (same filenames).
//
//   node scripts/gen-placeholder-sfx.mjs
//
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');

/** Encode mono Float32 samples (range -1..1) as a 16-bit PCM WAV buffer. */
function encodeWav(samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }
  return buffer;
}

function seconds(count) {
  return Math.round(count * SAMPLE_RATE);
}

/** A short percussive envelope: fast attack, exponential-ish decay. */
function envelope(t, durationMs, attackMs = 6) {
  const attack = attackMs / 1000;
  if (t < attack) return t / attack;
  const decay = (t - attack) / Math.max(0.001, durationMs / 1000 - attack);
  return Math.pow(1 - Math.min(1, decay), 2.2) * 0.9;
}

/** Tone from a frequency or a [from, to] sweep, over durationMs. */
function tone({ durationMs, freq, sweep = null, vibrato = 0, gain = 0.7 }) {
  const n = seconds(durationMs / 1000);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    let f = sweep ? sweep[0] + (sweep[1] - sweep[0]) * progress : freq;
    if (vibrato) f *= 1 + Math.sin(2 * Math.PI * vibrato * t) * 0.01;
    phase += (2 * Math.PI * f) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * envelope(t, durationMs) * gain;
  }
  return out;
}

function mix(...parts) {
  const length = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(length);
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) out[i] += part[i];
  }
  return out;
}

function concat(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function silence(ms) {
  return new Float32Array(seconds(ms / 1000));
}

function noise({ durationMs, decay = 3, gain = 0.5 }) {
  const n = seconds(durationMs / 1000);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const progress = i / n;
    out[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, decay) * gain;
  }
  return out;
}

function arpeggio(freqs, noteMs, gain = 0.6) {
  return concat(...freqs.map((freq) => tone({ durationMs: noteMs, freq, gain })));
}

const SOUNDS = {
  click: tone({ durationMs: 55, freq: 1300, gain: 0.5 }),
  play: tone({ durationMs: 120, freq: 520, gain: 0.7 }),
  draw: tone({ durationMs: 100, freq: 320, gain: 0.7 }),
  deal: tone({ durationMs: 80, freq: 700, gain: 0.55 }),
  shuffle: noise({ durationMs: 240, decay: 2, gain: 0.45 }),
  skip: concat(tone({ durationMs: 70, freq: 920, gain: 0.6 }), silence(45), tone({ durationMs: 70, freq: 920, gain: 0.6 })),
  reverse: tone({ durationMs: 240, freq: 0, sweep: [360, 980], gain: 0.6 }),
  wild: mix(tone({ durationMs: 300, freq: 660, gain: 0.45 }), tone({ durationMs: 300, freq: 990, gain: 0.35 })),
  uno: tone({ durationMs: 250, freq: 880, vibrato: 6, gain: 0.7 }),
  penalty: tone({ durationMs: 320, freq: 0, sweep: [720, 170], gain: 0.7 }),
  turn: tone({ durationMs: 130, freq: 1000, gain: 0.5 }),
  win: arpeggio([523.25, 659.25, 783.99, 1046.5], 130, 0.6),
  lose: arpeggio([783.99, 587.33, 440, 329.63], 130, 0.6),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  const file = resolve(OUT_DIR, `${name}.wav`);
  writeFileSync(file, encodeWav(samples));
  console.log(`wrote ${file} (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}
console.log(`\n${Object.keys(SOUNDS).length} placeholder sounds in ${OUT_DIR}`);
