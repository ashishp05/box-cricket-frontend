// Vector illustrations recreated from the Flutter site: ball logo, map, empty states.
import { useId } from 'react';

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
