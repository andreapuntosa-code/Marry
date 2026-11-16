#!/usr/bin/env node
/**
 * Genera la voce narrante e i tempi di ogni parola per scenes.json.
 *
 *   npm run tts                         → ElevenLabs se c'è ELEVENLABS_API_KEY in .env, altrimenti audio segnaposto (silenzio)
 *   npm run tts -- --provider=elevenlabs
 *   npm run tts -- --provider=placeholder   → file WAV muti con durata stimata
 *   npm run tts -- --provider=kokoro        → voce locale gratuita (Python + kokoro-onnx, vedi README)
 *   npm run tts -- --provider=manual        → usa i TUOI file in public/audio/<id-scena>.mp3|wav|m4a
 *   aggiungi --only=id1,id2 per rigenerare solo alcune scene
 *
 * Scrive i file audio in public/audio/ e i tempi in src/generated/timings.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const TIMINGS = path.join(ROOT, 'src', 'generated', 'timings.json');

// --- .env minimale -------------------------------------------------------
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'scenes.json'), 'utf8'));
const provider = args.provider ?? (process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'placeholder');
const only = args.only ? String(args.only).split(',') : null;
fs.mkdirSync(AUDIO_DIR, {recursive: true});
fs.mkdirSync(path.dirname(TIMINGS), {recursive: true});

// --- stima dei tempi delle parole ----------------------------------------
const PAUSE = {',': 2.5, ';': 3.5, ':': 3.5, '.': 5, '?': 5, '!': 5, '…': 6};
/** Distribuisce le parole di `text` nell'intervallo [start, end] in proporzione alla lunghezza. */
export const estimateWords = (text, start, end) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const items = tokens.map((t, i) => {
    const letters = t.replace(/[^\p{L}\p{N}]/gu, '').length;
    const tail = t.endsWith('...') ? PAUSE['…'] : PAUSE[t.slice(-1)] ?? 0;
    return {t, w: letters + 1.5, pause: i === tokens.length - 1 ? 0 : tail};
  });
  const units = items.reduce((a, b) => a + b.w + b.pause, 0);
  const k = (end - start) / units;
  let cur = start;
  return items.map(({t, w, pause}) => {
    const s = cur;
    cur += w * k;
    const e = cur;
    cur += pause * k;
    return {text: t, start: +s.toFixed(3), end: +e.toFixed(3)};
  });
};
const splitSentences = (text) => text.split(/(?<=[.?!…])\s+/).filter(Boolean);
const estimateDuration = (text) => {
  const letters = text.replace(/[^\p{L}\p{N}]/gu, '').length;
  const pauses = (text.match(/[,;:]/g) ?? []).length * 0.25 + (text.match(/[.?!]/g) ?? []).length * 0.45;
  return +(letters / 13.5 + pauses + 0.3).toFixed(2);
};

// --- WAV muto ---------------------------------------------------------------
const writeSilentWav = (dest, seconds, sr = 22050) => {
  const n = Math.round(seconds * sr);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  fs.writeFileSync(dest, buf);
};

// --- provider -----------------------------------------------------------------
const clearOld = (id, keepExt) => {
  for (const ext of ['mp3', 'wav', 'm4a']) {
    const f = path.join(AUDIO_DIR, `${id}.${ext}`);
    if (ext !== keepExt && fs.existsSync(f)) fs.rmSync(f);
  }
};

const elevenlabs = async (scene, i, scenes) => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY mancante in .env');
  const cfg = file.voice?.elevenlabs ?? {};
  const voiceId = process.env.ELEVENLABS_VOICE_ID || cfg.voiceId;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text: scene.narration,
      model_id: cfg.modelId ?? 'eleven_multilingual_v2',
      previous_text: scenes[i - 1]?.narration,
      next_text: scenes[i + 1]?.narration,
      voice_settings: {
        stability: cfg.stability ?? 0.5,
        similarity_boost: cfg.similarityBoost ?? 0.75,
        style: cfg.style ?? 0,
        speed: cfg.speed ?? 1,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = await res.json();
  clearOld(scene.id, 'mp3');
  fs.writeFileSync(path.join(AUDIO_DIR, `${scene.id}.mp3`), Buffer.from(json.audio_base64, 'base64'));
  const al = json.alignment;
  const words = [];
  let cur = null;
  al.characters.forEach((ch, k) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = {text: '', start: al.character_start_times_seconds[k], end: 0};
    cur.text += ch;
    cur.end = al.character_end_times_seconds[k];
  });
  if (cur) words.push(cur);
  const duration = (words.at(-1)?.end ?? 0) + 0.35;
  return {audio: `audio/${scene.id}.mp3`, duration: +duration.toFixed(3), words};
};

const placeholder = async (scene) => {
  const duration = estimateDuration(scene.narration);
  clearOld(scene.id, 'wav');
  writeSilentWav(path.join(AUDIO_DIR, `${scene.id}.wav`), duration);
  return {audio: `audio/${scene.id}.wav`, duration, words: estimateWords(scene.narration, 0.1, duration - 0.2)};
};

const probeDuration = (f) => {
  const r = spawnSync('npx', ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const d = parseFloat(r.stdout);
  if (!Number.isFinite(d)) throw new Error(`Non riesco a leggere la durata di ${f}: ${r.stderr}`);
  return d;
};

const manual = async (scene) => {
  const ext = ['mp3', 'wav', 'm4a'].find((e) => fs.existsSync(path.join(AUDIO_DIR, `${scene.id}.${e}`)));
  if (!ext) throw new Error(`Manca public/audio/${scene.id}.mp3 (o .wav/.m4a)`);
  const duration = probeDuration(path.join(AUDIO_DIR, `${scene.id}.${ext}`));
  return {audio: `audio/${scene.id}.${ext}`, duration: +duration.toFixed(3), words: estimateWords(scene.narration, 0.15, duration - 0.25)};
};

let kokoroCache = null;
const kokoro = async (scene) => {
  if (!kokoroCache) {
    const py = process.env.PYTHON ?? 'python3';
    const r = spawnSync(py, [path.join(ROOT, 'scripts', 'tts_kokoro.py'), path.join(ROOT, 'scenes.json'), AUDIO_DIR, ...(only ?? [])], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
      maxBuffer: 1 << 26,
    });
    if (r.status !== 0) throw new Error('tts_kokoro.py non riuscito (vedi messaggi sopra)');
    kokoroCache = JSON.parse(r.stdout);
  }
  const res = kokoroCache[scene.id];
  clearOld(scene.id, 'wav');
  const sentences = splitSentences(scene.narration);
  if (sentences.length !== res.sentences.length) throw new Error(`Scena ${scene.id}: frasi non allineate`);
  const words = sentences.flatMap((s, k) => estimateWords(s, res.sentences[k][0], res.sentences[k][1]));
  return {audio: `audio/${scene.id}.wav`, duration: res.duration, words};
};

const PROVIDERS = {elevenlabs, placeholder, manual, kokoro};
if (!PROVIDERS[provider]) throw new Error(`Provider sconosciuto: ${provider}`);
console.log(`Voce: ${provider}${provider === 'placeholder' ? ' (audio muto segnaposto: aggiungi ELEVENLABS_API_KEY in .env per la voce vera)' : ''}`);

const previous = fs.existsSync(TIMINGS) ? JSON.parse(fs.readFileSync(TIMINGS, 'utf8')) : {scenes: []};
const out = {provider, generatedAt: new Date().toISOString(), scenes: []};
for (const [i, scene] of file.scenes.entries()) {
  const old = previous.scenes.find((s) => s.id === scene.id);
  if (only && !only.includes(scene.id) && old) {
    out.scenes.push(old);
    continue;
  }
  const r = await PROVIDERS[provider](scene, i, file.scenes);
  out.scenes.push({id: scene.id, narration: scene.narration, ...r});
  console.log(`  ${scene.id.padEnd(12)} ${r.duration.toFixed(2)} s  ${r.words.length} parole`);
}
fs.writeFileSync(TIMINGS, JSON.stringify(out, null, 1));
const total = out.scenes.reduce((a, s) => a + s.duration, 0);
const t = file.timing;
const video = t.leadIn + total + (out.scenes.length - 1) * (t.hold + t.erase) + t.tail;
console.log(`Narrazione ${total.toFixed(1)} s → video ≈ ${video.toFixed(1)} s. Scritto ${path.relative(ROOT, TIMINGS)}`);
