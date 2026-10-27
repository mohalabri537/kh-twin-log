// Chase-camera maths. Everything is a pure function of the frame, so renders are deterministic.

export type Pt = {x: number; y: number};
export type Key = {f: number; x: number; y: number};
export type ZKey = {f: number; z: number};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Pointer position along keyframes; each hop is eased so the pointer darts, then settles.
export const pathAt = (keys: Key[], f: number): Pt => {
  if (f <= keys[0].f) return {x: keys[0].x, y: keys[0].y};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) {
      const t = easeInOut((f - a.f) / (b.f - a.f));
      // a slight arc makes the flight feel hand-made rather than a straight line
      const arc = Math.sin(t * Math.PI) * Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      return {x: lerp(a.x, b.x, t) + arc, y: lerp(a.y, b.y, t)};
    }
  }
  const l = keys[keys.length - 1];
  return {x: l.x, y: l.y};
};

// Camera trails the pointer: exponential smoothing, simulated from the start of the shot.
export const chaseAt = (keys: Key[], f: number, follow = 0.16): {c: Pt; v: Pt} => {
  let c = pathAt(keys, 0), prev = c;
  for (let i = 1; i <= Math.max(0, Math.floor(f)); i++) {
    const p = pathAt(keys, i);
    prev = c;
    c = {x: c.x + (p.x - c.x) * follow, y: c.y + (p.y - c.y) * follow};
  }
  return {c, v: {x: c.x - prev.x, y: c.y - prev.y}};
};

export const zoomAt = (keys: ZKey[], f: number) => {
  if (f <= keys[0].f) return keys[0].z;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) return lerp(a.z, b.z, easeInOut((f - a.f) / (b.f - a.f)));
  }
  return keys[keys.length - 1].z;
};

// 0→1 pulse right after frame `at`, decaying over `len` frames.
export const hit = (f: number, at: number, len = 10) => (f < at ? 0 : Math.exp(-(f - at) / (len / 3)));

// Everything a chase shot needs at frame f: pointer, trailing camera, tilt from speed, tap press/ripple.
export const chaseShot = (o: {f: number; keys: Key[]; zooms: ZKey[]; taps?: number[]; follow?: number; focus?: Pt; showFrom?: number; showTo?: number}) => {
  const {f, keys, zooms, taps = [], follow = 0.16} = o;
  const p = pathAt(keys, f);
  const {c, v} = chaseAt(keys, f, follow);
  const zoom = zoomAt(zooms, f);
  const trail = [5, 4, 3, 2, 1].map((d) => pathAt(keys, f - d));
  let press = 0, ripple = -1;
  for (const t of taps) {
    const d = f - t;
    if (d >= -3 && d <= 5) press = Math.max(press, d < 0 ? (d + 3) / 3 : 1 - d / 5);
    if (d >= 0) ripple = d;
  }
  const show = f >= (o.showFrom ?? -1e9) && f <= (o.showTo ?? 1e9);
  return {
    focus: o.focus ?? c,
    zoom,
    pointer: show ? p : null,
    trail: show ? trail : [],
    press,
    ripple,
    rot: clamp(v.x * 0.1, -7, 7),
    rx: clamp(-v.y * 0.045, -14, 14),
    ry: clamp(v.x * 0.07, -14, 14),
  };
};
