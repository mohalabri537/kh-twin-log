# Neuro Universe Clinic: website launch reel

A 62-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
It's a calm, slow tour of the real site, captured from its code, on a light background. The music and sound effects are original, synthesised in `audio/make_audio.py`.

## The tour

| Time | Scene | Caption |
|---|---|---|
| 0–4.5 s | Phone rises, the homepage logo opens | «أطلقنا موقعنا الجديد» |
| 4.5–12 s | Homepage: intro and doctors, then clinic photos and reviews | «كل ما تحتاجه عن العيادة» · «صور العيادة والتقييمات» |
| 12–18.5 s | Doctors page | «تعرّف على أطبائنا» |
| 18.5–24 s | Services page | «خدماتنا» |
| 24–30.5 s | EEG: the brainwave on the homepage, then how to prepare | «تخطيط كهربائية الدماغ» · «وكيف تستعد للفحص» |
| 30.5–36 s | First visit: price, duration, what to bring | «زيارتك الأولى» |
| 36–45.5 s | Booking, ending in the WhatsApp message | «احجز موعدك بسهولة» · «رسالة جاهزة على واتساب» |
| 45.5–51 s | Articles on a computer | «مقالات طبية موثوقة» |
| 51–56.5 s | Arabic → English → dark mode | «بالعربية والإنجليزية» |
| 56.5–62.5 s | Logo draws in, name, website, «احجز الآن», address | |

The booking demo uses the sample name «أحمد»; the patient phone field is hidden.

## Commands

```bash
npm install
npm run studio   # preview and scrub in the browser
npm run audio    # rebuild public/audio/reel.wav
npm run render   # -> out/neuro-universe-launch-reel.mp4 (about 6 min on 4 cores)
```

To re-capture the site after it changes, serve the website folder on port 8765 (`python3 -m http.server 8765`), then run
`node scripts/capture-site.js public/cap` and `node scripts/capture-extra.js public/cap`.

## How it fits together

- `src/timeline.json`: scene lengths and every sound effect. The video and the audio script both read it, so taps and sounds stay in sync.
- `src/scenes/Tour.tsx`, `Tour2.tsx`: one component per scene.
- `src/lib/kit.tsx`: light background, captions, phone placement, finger gestures.
- `src/lib/PhoneCam.tsx`: a phone showing a captured page, scrolled and filmed by a virtual camera.
- `public/cap`: the site captures.
