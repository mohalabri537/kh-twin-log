# Neuro Universe Clinic: website launch reel

A 31-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
Everything on screen is the real site, captured from its code. The soundtrack and sound effects are original, synthesised in `audio/make_audio.py`.
Every cut, tap and whip lands on the 120 BPM beat.

## The cut

| Time | Scene | Caption |
|---|---|---|
| 0–4 s | Frame 0 (the cover) already reads «أطلقنا» over the purple logo; a swipe opens it and the camera pulls back | «أطلقنا موقعنا الجديد» |
| 4–12 s | Quick tour, one page per bar with whip transitions, each with something bursting out of the screen: doctor portrait cards, a brainwave drawn across the frame, price and duration chips, then articles on a laptop | one big label per page |
| 12–22 s | Booking: the big caption names each step as it's tapped («اختر الخدمة» → … → «أرسل عبر واتساب»), the tracker ticks, each tap plays a rising note, the clock stops at 0:47, WhatsApp message pops up | «احجز في أقل من دقيقة» |
| 22–26 s | Arabic → English, then dark mode turns the whole reel dark on the bass drop | «بالعربية والإنجليزية» · «وبالوضع الداكن» |
| 26–31 s | Light returns with the logo, name, website, «احجز الآن» tapped on the final chord, «الرابط في البايو» | |

The booking demo uses the sample name «أحمد»; the patient phone field is hidden.

## Commands

```bash
npm install
npm run studio   # preview and scrub in the browser
npm run audio    # rebuild public/audio/reel.wav
npm run render   # -> out/neuro-universe-launch-reel.mp4 (about 4 min on 4 cores)
```

To re-capture the site after it changes, serve the website folder on port 8765 (`python3 -m http.server 8765`), then run
`node scripts/capture-site.js public/cap` and `node scripts/capture-extra.js public/cap`.

## How it fits together

- `src/timeline.json`: scene lengths and every sound effect (with the note for each tap). The video and the audio script both read it, so taps and sounds stay in sync.
- `src/scenes/`: `Hook`, `Tour`, `Booking`, `DarkEnd` (dark mode and the ending).
- `src/lib/kit.tsx`: backgrounds, kinetic captions, whip transitions with motion blur, beat helpers.
- `src/lib/breakouts.tsx`: portrait cards, info chips and the brainwave sweep that burst out of the phone.
- `src/lib/PhoneCam.tsx`: a phone showing a captured page, filmed by a virtual camera; `src/lib/chase.ts`: the camera that follows the finger.
- `public/cap`: the site captures.
