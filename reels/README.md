# Neuro Universe Clinic: website launch reel

A 36-second Instagram Reel (1080×1920, 30 fps, Arabic) announcing **neurouniverse.om**, built with [Remotion](https://remotion.dev).
Everything on screen is the real site, captured from its code; the soundtrack and sound effects are original and synthesised in `audio/make_audio.py`.

## The cut (100 BPM, every cut and tap on the beat)

Scenes are written on a 30-second grid (15 frames per beat) and stretched by `SLOW = 1.2` in `src/lib/time.ts`, so the times below run 1.2× longer in the final video.

| Time | Scene | Line |
|---|---|---|
| 0–4 s | EEG blip spikes → extreme close-up on the purple logo, a swipe opens it onto the EEG screen, camera pulls back to the phone | «أطلقنا موقعنا الجديد» |
| 4–8 s | Chase cam races down the doctors page, portraits fly out of the screen | «كل ما تحتاجه قبل زيارتك… في مكان واحد» |
| 8–15 s | Booking, one tap per beat: service → doctor → day → time → send. Race clock stops at 0:47, WhatsApp message flies out | «احجز موعدك في أقل من دقيقة» |
| 15–19 s | Breakdown: a giant brainwave draws itself with the camera riding the pen, then the site's own trace and the prep steps | «استعد لتخطيط الدماغ» |
| 19–23 s | First visit: price and duration punch out, "what to bring" ticks off on the beat | «اعرف ما ينتظرك في زيارتك الأولى» |
| 23–26 s | Desktop: camera chases the mouse across the articles page and into the EEG article | «معلومات موثوقة بالعربية» |
| 26–30 s | Logo draws itself and ignites, URL types out, finger taps «احجز الآن» | neurouniverse.om |

The booking demo uses the sample name «أحمد»; the patient phone field is hidden, so no personal number appears.

## Commands

```bash
npm install
npm run studio        # preview and scrub in the browser
npm run audio         # rebuild public/audio/reel.wav from src/cues.json
npm run render        # final MP4 with motion blur -> out/neuro-universe-launch-reel.mp4 (~35 min on 4 cores)
npm run render:draft  # same without motion blur, much faster
```

To re-capture the site after it changes: serve the website folder on port 8765 (`python3 -m http.server 8765`), then `npm run capture`.

## How it fits together

- `src/cues.json`: every sound effect by frame. The video and the audio script both read it, so they can't drift apart.
- `src/lib/chase.ts`: the chase camera. The pointer flies between keyframes; the camera glides after it and tilts slightly with its speed.
- `src/lib/PhoneCam.tsx`: a phone showing a captured page under that camera (zoom 1.4 = whole phone, 2.77 = page fills the width).
- `src/scenes/S1…S7`: one file per scene; `src/Reel.tsx` puts them on the beat grid, adds motion blur, grain and the audio.
- `public/cap`: the site captures (hero and EEG animations frame by frame, full pages, each booking step).
