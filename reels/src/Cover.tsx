import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {LightBg} from './lib/kit';
import {Neural} from './lib/neural';
import {PhoneCam} from './lib/PhoneCam';
import {AR, C, EN} from './theme';

// Cover image for the reel (1080x1920). Instagram's profile grid shows only the centre 3:4 of a reel
// cover (y 240-1680), so the headline and devices sit inside it; the clinic line below is a bonus
// for the full 9:16 view in the Reels tab. Same look as the reel: light, neural, the real site.
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <LightBg />
    <Neural f={40} mode="light" travel={520} fire={0.7} opacity={0.3} />
    <div style={{position: 'absolute', left: 540 - 680, top: 1240 - 680, width: 1360, height: 1360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(169,139,255,.5), transparent 60%)'}} />

    <div dir="rtl" style={{position: 'absolute', top: 296, width: '100%', textAlign: 'center'}}>
      <div style={{fontFamily: AR, fontWeight: 300, fontSize: 92, lineHeight: 1.1, color: C.purple}}>أطلقنا</div>
      <div style={{fontFamily: AR, fontWeight: 700, fontSize: 150, lineHeight: 1.25, color: C.ink}}>موقعنا الجديد</div>
      <div dir="ltr" style={{fontFamily: EN, fontWeight: 300, fontSize: 60, color: C.purple, marginTop: 6}}>neurouniverse.om</div>
    </div>

    {/* the desktop site, angled back */}
    <div style={{position: 'absolute', left: 64, top: 792, width: 820, perspective: 2200}}>
      <div style={{transform: 'rotateY(16deg) rotateX(3deg)', transformOrigin: 'left center', borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 2px rgba(29,29,31,.08), 0 70px 120px -30px rgba(90,40,200,.35), 0 30px 60px -20px rgba(29,29,31,.25)'}}>
        <div style={{height: 46, background: '#F2F2F5', borderBottom: '1px solid rgba(29,29,31,.08)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 15, height: 15, borderRadius: 8, background: c}} />
          ))}
          <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
            <div style={{padding: '4px 22px', borderRadius: 999, background: '#fff', fontFamily: EN, fontSize: 20, color: '#55555C'}}>🔒 neurouniverse.om</div>
          </div>
        </div>
        <Img src={staticFile('cap/resp/w1440.jpg')} style={{width: 820, display: 'block'}} />
      </div>
    </div>

    {/* the phone in front */}
    <PhoneCam src="top-ar.jpg" pageH={844} header={false} focus={{x: 195, y: 422}} zoom={1.02} screenAt={{x: 800, y: 1212}} ry={-10} rx={3} />

    <div dir="rtl" style={{position: 'absolute', top: 1738, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 500, fontSize: 44, color: C.ink}}>
      طبّ وعلوم الأعصاب <span style={{fontFamily: EN, fontWeight: 400, fontSize: 30, letterSpacing: 3, color: '#55555C'}}>· NEURO UNIVERSE CLINIC</span>
    </div>
  </AbsoluteFill>
);
