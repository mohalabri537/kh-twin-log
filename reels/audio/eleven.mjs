// Generate the soundtrack and sound effects with ElevenLabs (Eleven Music + Sound Effects APIs).
// Usage:  ELEVENLABS_API_KEY=... node audio/eleven.mjs   then   python3 audio/make_audio.py
// Writes public/audio/eleven/music.mp3 and sfx-<type>.mp3; make_audio.py uses them in place of the synthesised sounds.
// Prompts live in audio/eleven-prompts.json. Pass --sfx-only or --music-only to do one part.
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('Set ELEVENLABS_API_KEY first.');
  process.exit(1);
}
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const out = path.join(root, 'public', 'audio', 'eleven');
fs.mkdirSync(out, {recursive: true});
const prompts = JSON.parse(fs.readFileSync(path.join(root, 'audio', 'eleven-prompts.json'), 'utf8'));
const only = process.argv[2];

const post = async (url, body, file) => {
  const res = await fetch(url, {method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!res.ok) throw new Error(`${url} ${res.status}: ${await res.text()}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log('wrote', path.relative(root, file));
};

if (only !== '--sfx-only') {
  await post('https://api.elevenlabs.io/v1/music', {prompt: prompts.music.prompt, music_length_ms: prompts.music.length_ms, force_instrumental: true}, path.join(out, 'music.mp3'));
}
if (only !== '--music-only') {
  for (const [type, p] of Object.entries(prompts.sfx)) {
    await post('https://api.elevenlabs.io/v1/sound-generation', {text: p.text, duration_seconds: p.duration, prompt_influence: 0.5}, path.join(out, `sfx-${type}.mp3`));
  }
}
