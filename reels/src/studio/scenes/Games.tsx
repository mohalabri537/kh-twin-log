import React from 'react';
import {AbsoluteFill} from 'remotion';
import meta from '../../../public/cap/meta.json';
import {AR} from '../../theme';
import {pageToFrame, Phone} from '../devices';
import {clamp, GREY, Heading, inOut, lerp, Line, outQuint, prog, useF} from '../ui';

// 14.7–20 s. Brain games. First the idea itself, typeset alone on the page: a colour word printed in another colour
// ("name the ink, not the word"), long enough to try. Then the word settles into the real Stroop screen on the phone,
// which then shows the other two games.
type Word = {file: string; ink: string; text: string; word: {x: number; y: number}};
const G = (meta as unknown as {games: {stroop: {words: Word[]}}}).games;
const W = G.stroop.words.find((w) => !inkMatches(w)) ?? G.stroop.words[0]; // a word whose ink disagrees with it
function inkMatches(w: Word) {
  return ({red: 'أحمر', blue: 'أزرق', green: 'أخضر', purple: 'بنفسجي'} as Record<string, string>)[w.ink] === w.text;
}
// the games' ink colours (site.css, light theme)
const INKS: Record<string, string> = {red: '#D92D20', blue: '#1D5BD8', green: '#16833E', purple: '#8B2FD8'};

const K = 1.22, TOP = 720;

export const Games: React.FC = () => {
  const f = useF();
  // the word: set big, then glides into the phone, landing on the game's own word as the phone fades in
  const land = inOut(prog(f, 60, 30)); // the word glides into place over a bar and a half
  const big = 300, small = 48 * K; // px; the site sets the word at 48 px on a phone
  const from = {x: 540, y: 1000}, to = pageToFrame(K, 540, TOP, 0, W.word);
  const pos = {x: lerp(from.x, to.x, land), y: lerp(from.y, to.y, land)};
  const scale = lerp(1, small / big, land);
  const phone = outQuint(prog(f, 84, 18)); // the phone appears around the word as it lands
  const wordO = Math.min(1, outQuint(prog(f, 4, 22)) * 1.3) * (1 - prog(f, 96, 8));
  // inside the phone: Stroop, then reaction time, then visual memory
  const toReaction = inOut(prog(f, 114, 12)), toMemory = inOut(prog(f, 134, 12)); // on the beats
  return (
    <AbsoluteFill>
      <Heading f={f} at={2} n="03" label="ألعاب الدماغ" title="اختبر دماغك" />
      <div dir="rtl" style={{position: 'absolute', top: 1230, width: '100%', textAlign: 'center', opacity: 1 - inOut(prog(f, 56, 12))}}>
        <Line f={f} at={18}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 46, color: GREY}}>سمِّ لون الحبر، لا الكلمة</div>
        </Line>
      </div>
      {f > 80 && (
        <Phone src={W.file} k={K} cx={540} top={TOP} o={phone}
          layers={[{src: 'games/reaction-go.jpg', o: toReaction}, {src: 'games/memory-show.jpg', o: toMemory}]} />
      )}
      {wordO > 0 && (
        <div dir="rtl" style={{position: 'absolute', left: pos.x, top: pos.y, transform: `translate(-50%, -50%) scale(${scale})`, opacity: clamp(wordO),
          fontFamily: AR, fontWeight: 600, fontSize: big, lineHeight: 1, color: INKS[W.ink] ?? INKS.green, whiteSpace: 'nowrap'}}>
          {W.text}
        </div>
      )}
      <div dir="rtl" style={{position: 'absolute', top: 404, right: 96, left: 96, textAlign: 'right', opacity: phone}}>
        <Line f={f} at={86}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 40, color: GREY}}>ستروب · سرعة رد الفعل · الذاكرة البصرية</div>
        </Line>
      </div>
    </AbsoluteFill>
  );
};
