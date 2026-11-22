// Vector illustrations recreated from the Flutter site: ball logo, animated hero, gallery scenes, map.
import { useId, type CSSProperties } from 'react';

// Red cricket ball with a white ladder seam (the brand mark).
export const BallMark = ({ size = 32, spin = false, angle = -28 }: { size?: number; spin?: boolean; angle?: number }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={spin ? 'ball-spin' : undefined}>
      <defs>
        <radialGradient id={`b${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ff7a68" />
          <stop offset="0.55" stopColor="#e2402f" />
          <stop offset="1" stopColor="#b3241a" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#b${id})`} />
      <g clipPath={`url(#c${id})`} transform={`rotate(${angle} 32 32)`} stroke="#fff" strokeLinecap="round" fill="none" opacity="0.92">
        <path d="M24 0 C 18 20, 18 44, 24 64" strokeWidth="2.2" />
        <path d="M40 0 C 46 20, 46 44, 40 64" strokeWidth="2.2" />
        {[6, 13, 20, 27, 34, 41, 48, 55].map((y) => (
          <line key={y} x1={y < 32 ? 21 + (32 - y) * 0.06 : 21 + (y - 32) * 0.06} y1={y} x2={y < 32 ? 43 - (32 - y) * 0.06 : 43 - (y - 32) * 0.06} y2={y} strokeWidth="2" />
        ))}
      </g>
      <ellipse cx="22" cy="18" rx="9" ry="5" fill="#fff" opacity="0.18" transform="rotate(-30 22 18)" />
    </svg>
  );
};

// Brand lock-up: ball + "THE / Riverside Cricket Box".
export const Logo = ({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) => (
  <span className={`logo${inverse ? ' inverse' : ''}${compact ? ' compact' : ''}`}>
    <BallMark size={compact ? 28 : 30} />
    <span className="logo-text">
      <span className="logo-the">THE</span>
      <span className="logo-name">
        <b>Riverside</b> Cricket Box
      </span>
    </span>
  </span>
);

// Deterministic pseudo-random stars so the sky looks the same on every render.
const stars = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return { x: r(1) * 100, y: r(2) * 78, s: r(3) > 0.85 ? 3 : 2, o: 0.35 + r(4) * 0.5, d: r(5) * 4 };
});

const FloodLight = ({ side }: { side: 'left' | 'right' }) => (
  <div className={`floodlight ${side}`} aria-hidden>
    <div className="beam" />
    <div className="lamp">
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} />
      ))}
    </div>
    <div className="pole" />
  </div>
);

const Bat = () => (
  <svg className="hero-bat" viewBox="0 0 120 260" aria-hidden>
    <defs>
      <linearGradient id="batWood" x1="0" x2="1">
        <stop offset="0" stopColor="#f3d9a2" />
        <stop offset="0.6" stopColor="#e9cb8e" />
        <stop offset="1" stopColor="#d4b679" />
      </linearGradient>
    </defs>
    <g transform="rotate(-32 60 130)">
      {/* motion lines along the handle */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={50} y={8 + i * 11} width={20} height={3} rx={1.5} fill="#c8f23a" opacity={0.9 - i * 0.1} transform={`rotate(14 60 ${10 + i * 11})`} />
      ))}
      <rect x="55" y="62" width="10" height="44" rx="4" fill="#153127" />
      <circle cx="60" cy="104" r="8" fill="#153127" />
      <rect x="40" y="104" width="40" height="146" rx="18" fill="url(#batWood)" />
      <rect x="46" y="112" width="6" height="128" rx="3" fill="#fff" opacity="0.25" />
    </g>
  </svg>
);

const Stumps = () => (
  <svg className="hero-stumps" viewBox="0 0 60 120" aria-hidden>
    <rect x="6" y="4" width="22" height="5" rx="2.5" fill="#f1e3c0" />
    <rect x="32" y="4" width="22" height="5" rx="2.5" fill="#f1e3c0" />
    {[8, 26, 44].map((x) => (
      <g key={x}>
        <rect x={x} y="8" width="9" height="110" rx="4" fill="#f1e3c0" />
        <rect x={x + 5} y="8" width="4" height="110" rx="2" fill="#b5aa90" opacity="0.7" />
      </g>
    ))}
  </svg>
);

// Night-pitch hero: sky, stars, two floodlights with pulsing beams, ground waves, bat, stumps and a
// ball that is bowled left-to-right onto the stumps on a loop (timing measured from the Flutter site).
export const HeroScene = () => (
  <div className="hero-scene" aria-hidden>
    <div className="hero-sky" />
    {stars.map((s, i) => (
      <span key={i} className="star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o, animationDelay: `${s.d}s` } as CSSProperties} />
    ))}
    <FloodLight side="left" />
    <FloodLight side="right" />
    <div className="hero-ground">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d="M0 40 C 180 28, 320 52, 520 42 S 900 30, 1080 44 S 1340 34, 1440 40 L1440 90 L0 90Z" fill="#3c8857" />
        <path d="M0 52 C 200 40, 380 64, 600 54 S 980 44, 1180 56 S 1380 48, 1440 52 L1440 90 L0 90Z" fill="#a2c4a8" />
      </svg>
    </div>
    <Bat />
    <Stumps />
    <div className="hero-ball-track">
      {[4, 3, 2, 1].map((n) => (
        <span key={n} className="ball-trail" style={{ animationDelay: `${n * 0.09}s`, width: 16 - n * 2, height: 16 - n * 2, '--trail-opacity': 0.75 - n * 0.15 } as CSSProperties} />
      ))}
      <span className="hero-ball">
        <BallMark size={30} spin />
      </span>
    </div>
  </div>
);

export type GalleryVariant = 'lights' | 'aerial' | 'nets' | 'pavilion' | 'cafe';

// Gallery scenes for "Meet the arena" / arena page. Drawn in a 600x400 box.
export const GalleryScene = ({ variant }: { variant: GalleryVariant }) => {
  const id = useId().replace(/:/g, '');
  if (variant === 'aerial') {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="gallery-svg" aria-hidden>
        <rect width="600" height="400" fill="#2f8a5c" />
        <rect x="40" y="40" width="520" height="320" rx="40" fill="#2a7d53" stroke="#d8efe1" strokeWidth="6" />
        <ellipse cx="300" cy="200" rx="190" ry="120" fill="none" stroke="#d8efe1" strokeWidth="3" opacity="0.7" />
        <rect x="262" y="96" width="76" height="208" rx="6" fill="#e3d29e" />
        <rect x="270" y="100" width="60" height="4" fill="#fff" opacity="0.7" />
        <rect x="270" y="296" width="60" height="4" fill="#fff" opacity="0.7" />
        {[[150, 120], [440, 110], [470, 280], [140, 290], [300, 60], [310, 340]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" fill="#c8f23a" opacity="0.9" />
        ))}
      </svg>
    );
  }
  if (variant === 'nets') {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="gallery-svg" aria-hidden>
        <defs>
          <linearGradient id={`n${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3650" />
            <stop offset="1" stopColor="#3d5a72" />
          </linearGradient>
          <pattern id={`m${id}`} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 H26 M0 0 V26" stroke="#d6e0ea" strokeWidth="1.4" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="600" height="400" fill={`url(#n${id})`} />
        <rect width="600" height="290" fill={`url(#m${id})`} />
        <rect y="290" width="600" height="110" fill="#2f8a5c" />
        <g transform="translate(250 180)">
          {[0, 22, 44].map((x) => (
            <rect key={x} x={x} y="0" width="12" height="120" rx="5" fill="#f1e3c0" />
          ))}
        </g>
        <g transform="rotate(-30 160 300)">
          <rect x="150" y="190" width="40" height="150" rx="16" fill="#e9cb8e" />
          <rect x="164" y="150" width="12" height="44" rx="5" fill="#153127" />
        </g>
        <foreignObject x="378" y="226" width="46" height="46">
          <BallMark size={46} />
        </foreignObject>
      </svg>
    );
  }
  if (variant === 'pavilion') {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="gallery-svg" aria-hidden>
        <defs>
          <linearGradient id={`p${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b3550" />
            <stop offset="0.6" stopColor="#c97d52" />
            <stop offset="1" stopColor="#e9a46a" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill={`url(#p${id})`} />
        <rect y="270" width="600" height="130" fill="#3f8a63" />
        <path d="M140 170 L300 120 L460 170 Z" fill="#1d3a33" />
        <rect x="160" y="170" width="280" height="100" fill="#21463c" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={190 + i * 44} cy="200" r="10" fill="#ffd36b" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={170 + i * 38} y="232" width="26" height="12" rx="3" fill="#0f2d26" />
        ))}
        <g transform="translate(440 300)">
          {[0, 14, 28].map((x) => (
            <rect key={x} x={x} y="0" width="8" height="60" rx="3" fill="#f1e3c0" />
          ))}
        </g>
      </svg>
    );
  }
  if (variant === 'cafe') {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="gallery-svg" aria-hidden>
        <rect width="600" height="400" fill="#3a2a22" />
        <rect y="260" width="600" height="140" fill="#6b4a36" />
        {[60, 130].map((y, row) => (
          <g key={y}>
            <path d={`M0 ${y} Q 300 ${y + 40} 600 ${y}`} stroke="#5a4636" strokeWidth="2" fill="none" />
            {Array.from({ length: 11 }, (_, i) => {
              const x = 30 + i * 55;
              const t = x / 600;
              const yy = y + 4 * 40 * t * (1 - t) * (row ? 1 : 1);
              return <circle key={i} cx={x} cy={yy} r="6" fill="#ffd36b" />;
            })}
          </g>
        ))}
        {[110, 230, 350, 470].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="262" rx="40" ry="10" fill="#f1e3c0" />
            <rect x={x - 4} y="262" width="8" height="60" fill="#2b1f19" />
            <circle cx={x} cy="246" r="12" fill="#e2402f" />
          </g>
        ))}
      </svg>
    );
  }
  // 'lights': pitch in perspective under floodlights
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="gallery-svg" aria-hidden>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1a2b" />
          <stop offset="1" stopColor="#13314a" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a8a5c" />
          <stop offset="1" stopColor="#1d6e48" />
        </linearGradient>
        <linearGradient id={`beam${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f5d6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e9f5d6" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill={`url(#s${id})`} />
      {stars.slice(0, 24).map((s, i) => (
        <circle key={i} cx={s.x * 6} cy={s.y * 2.4} r={s.s / 2} fill="#fff" opacity={s.o * 0.7} />
      ))}
      <path d="M0 215 L90 190 L160 205 L250 185 L330 200 L420 182 L520 198 L600 188 L600 230 L0 230Z" fill="#0f2233" />
      <rect y="215" width="600" height="185" fill={`url(#g${id})`} />
      {[-260, -160, -60, 40, 140, 240, 340].map((dx, i) => (
        <path key={i} d={`M300 215 L${300 + dx * 2.4} 400 L${300 + (dx + 50) * 2.4} 400 Z`} fill="#fff" opacity="0.05" />
      ))}
      <path d="M262 215 L338 215 L400 400 L200 400 Z" fill="#e3d29e" />
      <rect x="256" y="230" width="88" height="3" fill="#fff" opacity="0.6" />
      <rect x="230" y="340" width="140" height="3" fill="#fff" opacity="0.6" />
      <path d="M70 20 L70 215" stroke="#4d6860" strokeWidth="3" />
      <path d="M530 20 L530 215" stroke="#4d6860" strokeWidth="3" />
      <path d="M70 26 L10 215 L180 215 Z" fill={`url(#beam${id})`} />
      <path d="M530 26 L420 215 L590 215 Z" fill={`url(#beam${id})`} />
      {[70, 530].map((x) => (
        <g key={x} transform={`translate(${x - 18} 10)`}>
          <rect width="36" height="20" rx="5" fill="#16352b" />
          {[0, 1, 2].map((c) => [0, 1].map((r) => <circle key={`${c}${r}`} cx={8 + c * 10} cy={6 + r * 8} r="2.6" fill="#edefee" />))}
        </g>
      ))}
      <ellipse cx="300" cy="326" rx="42" ry="6" fill="#000" opacity="0.25" />
      {[278, 294, 310].map((x) => (
        <rect key={x} x={x} y="214" width="12" height="112" rx="5" fill="#f1e3c0" />
      ))}
      <rect x="276" y="210" width="48" height="6" rx="3" fill="#f1e3c0" />
      <foreignObject x="324" y="254" width="40" height="40">
        <BallMark size={40} />
      </foreignObject>
    </svg>
  );
};

// Simplified street map with the venue pin (static illustration; "Directions" opens real maps).
export const MapArt = () => (
  <svg viewBox="0 0 1120 150" preserveAspectRatio="xMidYMid slice" className="map-svg" aria-hidden>
    <rect width="1120" height="150" fill="#e9efe2" />
    <rect x="112" y="22" width="280" height="60" rx="10" fill="#cfe6c5" />
    <g stroke="#fff" strokeLinecap="round" fill="none">
      <path d="M-20 120 L1140 20" strokeWidth="9" />
      <path d="M-20 70 L1140 140" strokeWidth="7" />
      <path d="M200 160 L640 -10" strokeWidth="6" />
      <path d="M540 160 L1000 -10" strokeWidth="5" />
      <path d="M-20 140 L1140 130" strokeWidth="4" />
      <path d="M-20 30 L700 75" strokeWidth="4" />
      <path d="M760 160 L1140 60" strokeWidth="4" />
    </g>
    <circle cx="560" cy="70" r="26" fill="#e2402f" opacity="0.15" />
    <foreignObject x="545" y="54" width="30" height="30">
      <BallMark size={30} />
    </foreignObject>
  </svg>
);

// "Log in to see your bookings" empty-state illustration.
export const EmptyTicketArt = () => (
  <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
    <circle cx="80" cy="80" r="80" fill="#dfe6dd" />
    <circle cx="80" cy="80" r="59" fill="#cddcd0" />
    {[68, 76, 84].map((x) => (
      <rect key={x} x={x} y="68" width="6" height="58" rx="2" fill="#1d6e48" />
    ))}
    <rect x="66" y="66" width="26" height="4" rx="2" fill="#1d6e48" />
    <ellipse cx="80" cy="127" rx="16" ry="3" fill="#000" opacity="0.15" />
    <foreignObject x="102" y="92" width="26" height="26">
      <BallMark size={26} />
    </foreignObject>
    <circle cx="115" cy="38" r="25" fill="#fff" />
    <g transform="translate(101 29)" fill="none" stroke="#0f6b47" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M2 2 H26 V7 A3 3 0 0 0 26 13 V18 H2 V13 A3 3 0 0 0 2 7 Z" />
      <path d="M14 5 V7 M14 9.5 V11 M14 13.5 V15" strokeLinecap="round" />
    </g>
  </svg>
);
