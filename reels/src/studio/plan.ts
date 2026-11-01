// The studio cut: 31 s at 30 fps, cut to a 90 BPM score (a beat is 20 frames, a bar 80). The score is trimmed so its
// first downbeat is frame 0; its closing chord lands on frame 800, where the logo appears, and rings out to the end.
// One idea per shot. Each scene fades in and out on the paper over XF frames, overlapping its neighbours.
export const FPS = 30;
export const BEAT = 20;
export const XF = 12;
export const MUSIC = {file: 'audio/studio/studio.wav', take: 'public/audio/studio/score.mp3', trim: 0.62};

export const SCENES = [
  {id: 'site', from: 0, len: 160}, // the new site: a foldable phone opens
  {id: 'doctors', from: 160, len: 180}, // the doctors, one portrait at a time, three beats each
  {id: 'guide', from: 340, len: 120}, // the symptoms and conditions guide
  {id: 'games', from: 460, len: 160}, // brain games: name the ink, then the three games
  {id: 'booking', from: 620, len: 100}, // booking in a few steps, a choice on every beat
  {id: 'screens', from: 720, len: 80}, // every screen: desktop and phone
  {id: 'close', from: 800, len: 130}, // logo, name, address, on the closing chord
] as const;

export const TOTAL = 930;
