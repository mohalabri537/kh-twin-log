import {useCurrentFrame} from 'remotion';

// Scenes are authored on a 15-frame beat; SLOW stretches them in real time (1.2 → 18 frames = 100 BPM).
export const SLOW = 1.2;
export const useF = () => useCurrentFrame() / SLOW;
