/**
 * Genera assets/sounds/cumple.wav: dos notas suaves, tipo campanita, de un segundo.
 * Para cambiar el sonido alcanza con reemplazar ese archivo (WAV o MP3 corto, con el mismo nombre
 * o ajustando el require en src/lib/sound.ts). Uso: node scripts/generar-sonido.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const LENGTH = 1.2; // segundos
const PEAK = 0.32; // ~ -10 dB: que se escuche, sin sobresaltar

// Sol y Do una cuarta arriba: suena a "¡ding-ding!" alegre pero tranquilo.
const NOTES = [
  { freq: 783.99, start: 0, gain: 0.8 },
  { freq: 1046.5, start: 0.13, gain: 1 },
];

const samples = new Float32Array(Math.round(RATE * LENGTH));
for (const { freq, start, gain } of NOTES) {
  const from = Math.round(start * RATE);
  for (let i = from; i < samples.length; i++) {
    const t = (i - from) / RATE;
    const attack = Math.min(1, t / 0.006); // sin "clic" al empezar
    const body = Math.exp(-t / 0.32);
    const shimmer = Math.exp(-t / 0.09);
    samples[i] +=
      gain *
      attack *
      (body * Math.sin(2 * Math.PI * freq * t) +
        0.18 * body * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.06 * shimmer * Math.sin(2 * Math.PI * freq * 2.76 * t));
  }
}

// Final suave y normalizado.
let max = 0;
for (const s of samples) max = Math.max(max, Math.abs(s));
const fadeFrom = samples.length - Math.round(0.15 * RATE);
const pcm = Buffer.alloc(samples.length * 2);
samples.forEach((s, i) => {
  const fade = i > fadeFrom ? 1 - (i - fadeFrom) / (samples.length - fadeFrom) : 1;
  pcm.writeInt16LE(Math.round((s / max) * PEAK * fade * 32767), i * 2);
});

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'cumple.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`Listo: ${out} (${Math.round((header.length + pcm.length) / 1024)} KB)`);
