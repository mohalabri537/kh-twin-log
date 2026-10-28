# Neuro Universe Clinic: website launch reel

A 29-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
Everything shown of the site is the real site, captured from its code. Every cut, tap and effect lands on the 120 BPM beat.

## The cut ("Neuro Universe")

| Time | Scene |
|---|---|
| 0–4 s | Flying through a glowing neural network, «أطلقنا موقعنا الجديد» on screen from frame 0. The neurons pull together into the NU logo, which opens onto the bright site (like the real homepage). |
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

### Sound from ElevenLabs

The soundtrack is synthesised in `audio/make_audio.py`. To use ElevenLabs music and effects instead:

```bash
ELEVENLABS_API_KEY=... node audio/eleven.mjs   # writes public/audio/eleven/*.mp3 from audio/eleven-prompts.json
npm run audio && npm run render                  # make_audio.py picks those files up automatically
```

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
