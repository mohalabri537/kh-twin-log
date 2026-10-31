# Neuro Universe Clinic: website reels

## Film (`Film`, current)

A 31-second Reel (1080×1920, 30 fps, Arabic) in the manner of a product film: real 3D devices (Three.js through
`@remotion/three`) on the website's own light, grainy violet backdrop, each playing a recording of the live site.
One idea per shot, a slow camera move, one line of type; shots dissolve on the downbeats of the 90 BPM score
(the closing chord lands on the logo at frame 800).

| Time | Shot |
|---|---|
| 0–5.3 s | «موقعنا الجديد.»: the phone turns towards the camera, the homepage playing on it. |
| 5.3–10.7 s | «أطباؤنا.»: the homepage's doctors scroll by, their portraits rising. |
| 10.7–14.7 s | «دليل الأعراض والأمراض.»: the guide, past the red 9999 box. |
| 14.7–20 s | «اختبر دماغك.»: the games, cut on the beat: Stroop words, the reaction target and time, the memory pattern. |
| 20–24 s | «احجز موعدك بسهولة.»: the booking form, a choice at a time. |
| 24–26.7 s | «على كل شاشة.»: a laptop and a phone on the floor, the same homepage on both. |
| 26.7–31 s | Logo, name and address; then the backdrop alone, so the loop restarts cleanly. |

- `src/three/Phone3D.tsx`, `src/three/Laptop3D.tsx`: devices modelled from real proportions (no logos or trademarks).
  `src/three/stage.tsx`: the studio light (softboxes baked into an environment map), soft shadows, shape helpers.
  `src/three/screen.ts`: paints each recorded frame (with a status bar or a browser bar) onto the screens.
  `src/three/Film.tsx`: the shots, type and backdrop.
- Recordings: serve the website on port 8765, then `node scripts/record-site.js public/rec` (phone: a sharp screenshot per
  frame at 2.5×, the page's own animations slowed to match; desktop: a screencast), `sh scripts/rec-frames.sh` (unpacks
  them into frames) and `python3 scripts/games-frames.py` (the games, from the captured game states).
- `npx remotion render Film out/neuro-universe-film.mp4 --crf=16` (about 1 s a frame).

---

## Studio cut (`StudioReel`, earlier)

A calm, editorial 31-second Reel (1080×1920, 30 fps, Arabic): paper-white, generous space, light type, one idea per
shot, realistic devices, no effects for their own sake. Cut to a 90 BPM score (a beat is 20 frames, a bar 80);
the score is trimmed so its first downbeat is frame 0 and its closing chord lands on the logo (frame 800).

| Time | Shot |
|---|---|
| 0–5.3 s | «موقعنا الجديد.»: a book-style foldable, closed, shows the site on its outer screen; it opens in about a second and the camera moves in until the website fills the frame. |
| 5.3–11.3 s | 01 الأطباء: each doctor as on the site (cut-out portrait over the drifting brand light, head above the frame), three beats each. |
| 11.3–15.3 s | 02 الأعراض والأمراض: the guide, large, scrolling past the red 9999 box and the topics. |
| 15.3–20.7 s | 03 ألعاب الدماغ: three colour words in the wrong ink, one per beat («سمِّ لون الحبر، لا الكلمة»); the last settles into the real Stroop screen, then reaction time and visual memory. |
| 20.7–24 s | 04 الحجز: the real form, a choice on each beat, set beside it as a quiet list. |
| 24–26.7 s | 05 كل الشاشات: the desktop homepage in a browser window, the phone in front. |
| 26.7–31 s | On the closing chord: logo, name, address; then the page empties so the loop restarts cleanly. |

Headlines are centred and land word by word; scenes rise in from below as the previous one leaves upwards.
The website is the subject: devices only frame it, and carry no logos or trademarks.

- `src/studio/plan.ts`: scene timing and the music take. `src/studio/ui.tsx`: paper, type, easing. `src/studio/devices.tsx`:
  the phone (metal rim, camera island, side buttons, status bar, the browser's address bar), the foldable (real 3D
  hinge; `scripts/capture-fold.js` captures its two screens) and a desktop browser window, drawn in CSS.
- Music: ElevenLabs Music (eleven_music_v2_5), four takes of one brief (kept locally in `public/audio/studio/candidates/`); take A is
  used (most air; resolves at 27 s) and saved as `public/audio/studio/score.mp3`. `python3 audio/analyse_takes.py <takes>` measures tempo, level and endings;
  `npm run audio:studio` mixes it to the cut at -14 LUFS (`public/audio/studio/studio.wav`). No sound effects.
- `npm run render:studio`, `npm run cover:studio`.
- Captures: as below, plus `node scripts/capture-new.js public/cap` (the games being played, the conditions pages,
  the games hub). `node scripts/stills.mjs StudioReel <dir> <frame>...` renders full-size stills for checking.

---

## Launch cut (`LaunchReel`, earlier)

A 30.5-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
Everything shown of the site is the real site, captured from its code. Every cut, tap and effect lands on the 120 BPM beat.

## The cut ("Neuro Universe")

| Time | Scene |
|---|---|
| 0–4 s | The site boots up: the homepage swings in on a phone as a glowing blueprint (traced from the real capture, `public/cap/top-ar-wire.jpg`) inside a drawing-style HUD; a beam of light renders it to life top to bottom while a tag counts 0→100% → LIVE, and the NU mark lights up as the beam clears it. «أطلقنا موقعنا الجديد» from frame 0. |
| 4–10 s | The homepage breaks into glass panels floating in 3D over a grid, each tagged like a schematic (الرئيسية، الأطباء، تخطيط الدماغ، زيارتك الأولى، الحجز، المقالات، English), camera orbiting; then it snaps back into the phone. «كل ما تحتاجه في مكان واحد». |
| 10–14 s | «على كل الشاشات»: the desktop homepage in a browser window, which narrows while the real layout reflows (the page captured at 36 widths, 1440→390 px, `public/cap/resp/`) and a dimension line counts the width down, until it is the phone. |
| 14–23 s | Booking, step by step: a paediatric consultation with Dr. Wafaa Bani Uraba on her first clinic day; each choice lifts off the screen as a glass chip and docks in a summary bar; on send the chips pour into the WhatsApp message. |
| 23–27 s | The Google rating counts to 5.0, stars fill on the beat, real reviews from the site fly past the camera. |
| 27–30.5 s | A short outro (a long, quiet one is where viewers swipe away): neurons gather into the logo, then the name, the website (revealed by a scan of light), «احجز الآن» tapped and «الرابط في البايو». The beat never stops and the hook's neural network fades back in, so the reel loops straight into its first frame. |

The booking demo uses the sample name «أحمد»; the patient phone field is hidden. The exploded view's «الأطباء» panel shows all three doctors (the home page's doctors section).

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

- the score in use (take 3) drives from the first bar, four-on-the-floor, and runs to the last frame with no
  ending, so Instagram's replay continues the beat (bars of it repeat under the desktop scene and near the end to span
  the edit; its own ending is never used); `make_audio.py` writes where the beat runs to `src/score.json` and the frame pumps on every kick.
  A take that builds into a drop instead gets its drop placed on the last booking tap (17 s, the WhatsApp send),
  its quiet build lifted, and a peak that runs past the logo hit cut there into the score's ringing tail;
- each chime is re-pitched from its measured pitch so the steps climb in the score's key (D);
- the score ducks a few dB under each effect where it is loud;
- the tone settings (how far chimes are pitched, how much the harsh highs are tamed, loudness) are named at the
  top of `audio/make_audio.py`, with the values that sounded too sharp (v9) and too dull (v10) beside them.

Every sound in the mix is an ElevenLabs take; `make_audio.py` stops with an error if a cue has none. Only if
`public/audio/eleven/` is empty does it fall back to synthesising everything itself.

To try other takes: put them in `public/audio/eleven/candidates/` as `music-<n>.mp3` and `sfx-<type>-<n>.mp3`, then

```bash
python3 audio/pick_eleven.py public/audio/eleven/candidates --music 3   # a take per sound; the score aligned to the kick
# (leave out --music to let it pick the score whose loudness best fits the edit)
npm run audio && npm run render
```

`ELEVENLABS_API_KEY=... node audio/eleven.mjs` generates a fresh set through the API (prompts in `audio/eleven-prompts.json`).

### Re-capturing the site

Serve the website folder on port 8765 (`python3 -m http.server 8765`), then run `node scripts/capture-site.js public/cap`,
`node scripts/capture-extra.js public/cap`, `node scripts/capture-responsive.js public/cap/resp` and `python3 scripts/make-panels.py`.
`node scripts/capture-booking.js public/cap` re-captures only the booking demo and the home page's doctors section
(choices at the top of the script), without touching the other captures.

## How it fits together

- `src/timeline.json`: scene lengths and every sound cue (with notes for chimes). The video and the audio script both read it.
- `src/scenes/`: `NeuroHook`, `Explode`, `Desktop`, `Booking`, `Reviews`, `Finale`.
- `src/lib/neural.tsx`: the 3D neuron field that flies, fires and morphs into the logo outline.
- `src/lib/kit.tsx`: backgrounds, kinetic captions, whip transitions with motion blur, beat helpers.
- `src/lib/PhoneCam.tsx`: a phone showing a captured page, filmed by a virtual camera; `src/lib/chase.ts`: the camera that follows the finger.
- `public/cap`: the site captures; `public/cap/panels`: sections cut out for the exploded view.
