# Neuro Universe Clinic: website launch reel

A 29-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
Everything shown of the site is the real site, captured from its code. Every cut, tap and effect lands on the 120 BPM beat.

## The cut ("Neuro Universe")

| Time | Scene |
|---|---|
| 0–4 s | The site boots up: the homepage swings in on a phone as a glowing blueprint (traced from the real capture, `public/cap/top-ar-wire.jpg`) inside a drawing-style HUD; a beam of light renders it to life top to bottom while a tag counts 0→100% → LIVE, and the NU mark lights up as the beam clears it. «أطلقنا موقعنا الجديد» from frame 0. |
| 4–10 s | The homepage breaks into glass panels floating in 3D over a grid, each tagged like a schematic (الرئيسية، الأطباء، تخطيط الدماغ، زيارتك الأولى، الحجز، المقالات، English), camera orbiting; then it snaps back into the phone. «كل ما تحتاجه في مكان واحد». |
| 10–19 s | Booking, step by step: each choice lifts off the screen as a glass chip and docks in a summary bar; on send the chips pour into the WhatsApp message. |
| 19–23 s | The Google rating counts to 5.0, stars fill on the beat, real reviews from the site fly past the camera. |
| 23–29 s | Neurons gather into the logo, then the name, the website (revealed by a scan of light), «احجز الآن» and «الرابط في البايو». |

The booking demo uses the sample name «أحمد»; the patient phone field is hidden.

## Commands

```bash
npm install
npm run studio   # preview and scrub in the browser
npm run audio    # rebuild public/audio/reel.wav
npm run render   # -> out/neuro-universe-launch-reel.mp4 (about 4 min on 4 cores)
```

### Sound (ElevenLabs)

The score and effects in `public/audio/eleven/` were generated with ElevenLabs (music v2.5 and sound effects v2;
the ElevenLabs flow holds every take). `audio/make_audio.py` mixes them to the timeline:

- the score's drop is found automatically and placed on the last booking tap (17 s), when the WhatsApp message is sent;
  its quiet build is lifted so it still reads on a phone speaker, and the peak cuts on the logo hit (24.5 s) into the
  score's own ringing tail;
- each chime is re-pitched from its measured pitch so the steps climb in the score's key (D);
- the score ducks a few dB under each effect where it is loud.

Every sound in the mix is an ElevenLabs take; `make_audio.py` stops with an error if a cue has none. Only if
`public/audio/eleven/` is empty does it fall back to synthesising everything itself.

To try other takes: put them in `public/audio/eleven/candidates/` as `music-<n>.mp3` and `sfx-<type>-<n>.mp3`, then

```bash
python3 audio/pick_eleven.py public/audio/eleven/candidates   # picks a take per sound, aligns the score to the beat
npm run audio && npm run render
```

`ELEVENLABS_API_KEY=... node audio/eleven.mjs` generates a fresh set through the API (prompts in `audio/eleven-prompts.json`).

### Re-capturing the site

Serve the website folder on port 8765 (`python3 -m http.server 8765`), then run `node scripts/capture-site.js public/cap`,
`node scripts/capture-extra.js public/cap` and `python3 scripts/make-panels.py`.

## How it fits together

- `src/timeline.json`: scene lengths and every sound cue (with notes for chimes). The video and the audio script both read it.
- `src/scenes/`: `NeuroHook`, `Explode`, `Booking`, `Reviews`, `Finale`.
- `src/lib/neural.tsx`: the 3D neuron field that flies, fires and morphs into the logo outline.
- `src/lib/kit.tsx`: backgrounds, kinetic captions, whip transitions with motion blur, beat helpers.
- `src/lib/PhoneCam.tsx`: a phone showing a captured page, filmed by a virtual camera; `src/lib/chase.ts`: the camera that follows the finger.
- `public/cap`: the site captures; `public/cap/panels`: sections cut out for the exploded view.
