import React from 'react';

// Custom, animated, representative SVG icons for each seasonal / holiday theme.
// Decorative only — not clickable. Each is self-contained (viewBox 0 0 48 48)
// and driven by the keyframe classes defined in src/index.css (ks-* ).

const wrap = (children) => (
  <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

// ── Spring: swaying flower ──
function FlowerIcon() {
  const petals = [
    [31, 20], [27.5, 26.1], [20.5, 26.1], [17, 20], [20.5, 13.9], [27.5, 13.9],
  ];
  return wrap(
    <g>
      <path d="M24 44 L24 28" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 36 Q18 34 15 30 Q20 30 24 35" fill="#22C55E" />
      {petals.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5" fill={i % 2 ? '#EC4899' : '#F472B6'} />
      ))}
      <circle cx="24" cy="20" r="3.6" fill="#FBBF24" />
    </g>
  );
}

// ── Summer: sun with rotating rays ──
function SunIcon() {
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rays.push(
      <line key={i} x1={24 + 10 * Math.cos(a)} y1={24 + 10 * Math.sin(a)}
        x2={24 + 17 * Math.cos(a)} y2={24 + 17 * Math.sin(a)}
        stroke="#F97316" strokeWidth="2.8" strokeLinecap="round" />
    );
  }
  return wrap(
    <g>
      <g>{rays}</g>
      <circle cx="24" cy="24" r="9" fill="#FBBF24" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="#F97316" strokeWidth="1.5" />
    </g>
  );
}

// ── Autumn: pumpkin with a face ──
function AutumnSceneIcon() {
  return wrap(
    <g>
      {/* Stem */}
      <path d="M22 10 Q22 6 25 6 Q25 9 24 11" fill="none" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 10 Q20 8 18 9" fill="none" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" />
      {/* Pumpkin body — three rounded lobes */}
      <ellipse cx="24" cy="28" rx="17" ry="15" fill="#F97316" />
      <ellipse cx="15" cy="28" rx="7" ry="14" fill="#FB923C" />
      <ellipse cx="33" cy="28" rx="7" ry="14" fill="#EA580C" />
      <ellipse cx="24" cy="28" rx="6" ry="14" fill="#F97316" opacity="0.5" />
      {/* Face — triangle eyes + jagged mouth */}
      <path d="M16 24 L20 24 L18 19 Z" fill="#1E1B0F" />
      <path d="M32 24 L28 24 L30 19 Z" fill="#1E1B0F" />
      <path d="M15 32 L18 34 L20 32 L22 34 L24 32 L26 34 L28 32 L30 34 L33 32 L33 35 L15 35 Z" fill="#1E1B0F" />
    </g>
  );
}

// ── Winter: snowman with falling snow ──
function SnowmanIcon() {
  return wrap(
    <g>
      <circle cx="24" cy="37" r="11" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.2" />
      <circle cx="24" cy="23" r="8" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.2" />
      <circle cx="24" cy="13" r="6" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.2" />
      <rect x="18" y="3" width="12" height="3" rx="1" fill="#1E40AF" />
      <rect x="20" y="0" width="8" height="5" rx="1" fill="#1E40AF" />
      <circle cx="22" cy="12" r="1" fill="#1E1B0F" />
      <circle cx="26" cy="12" r="1" fill="#1E1B0F" />
      <path d="M24 14 L29 15 L24 16 Z" fill="#F97316" />
      <circle cx="24" cy="21" r="1.1" fill="#1E1B0F" />
      <circle cx="24" cy="25" r="1.1" fill="#1E1B0F" />
      <line x1="16" y1="23" x2="9" y2="19" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="32" y1="23" x2="39" y2="19" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      {/* Scarf */}
      <path d="M18 18 Q24 20 30 18 L30 21 Q24 23 18 21 Z" fill="#DC2626" />
    </g>
  );
}

// ── Christmas: tree with flashing lights ──
function ChristmasTreeIcon() {
  const lights = [
    [24, 14, '#F87171', '0s'], [20, 24, '#FBBF24', '0.35s'],
    [28, 24, '#60A5FA', '0.7s'], [16, 36, '#F472B6', '1.05s'],
    [24, 38, '#34D399', '0.5s'], [32, 36, '#A78BFA', '0.85s'],
  ];
  return wrap(
    <g>
      <path d="M24 2 L25.6 6.4 L30 6.4 L26.4 9.2 L27.7 13.6 L24 11.1 L20.3 13.6 L21.6 9.2 L18 6.4 L22.4 6.4 Z"
        fill="#FCD34D" className="ks-twinkle" />
      <path d="M24 8 L18 20 L30 20 Z" fill="#16A34A" />
      <path d="M24 16 L14 30 L34 30 Z" fill="#15803D" />
      <path d="M24 26 L10 44 L38 44 Z" fill="#166534" />
      <rect x="21" y="44" width="6" height="4" fill="#92400E" />
      {lights.map(([cx, cy, c, d], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill={c} className="ks-light" style={{ animationDelay: d }} />
      ))}
    </g>
  );
}

// ── Hanukkah: menorah with flickering flames ──
function MenorahIcon() {
  const candles = [4, 9, 14, 19, 24, 29, 34, 39, 44];
  return wrap(
    <g>
      <rect x="4" y="44" width="40" height="3" rx="1.5" fill="#D4AF37" />
      <rect x="6" y="40" width="36" height="2" rx="1" fill="#D4AF37" />
      {candles.map((x, i) => {
        const shamash = i === 4;
        const top = shamash ? 26 : 30;
        return (
          <g key={x}>
            <rect x={x - 1} y={top} width="2" height={44 - top} fill="#E5E7EB" />
            <path d={`M${x} ${top} Q${x - 2.2} ${top - 4} ${x} ${top - 7} Q${x + 2.2} ${top - 4} ${x} ${top} Z`}
              fill="#FB923C" className="ks-flame" style={{ animationDelay: `${i * 0.08}s` }} />
            <path d={`M${x} ${top + 1} Q${x - 1.4} ${top - 2} ${x} ${top - 4} Q${x + 1.4} ${top - 2} ${x} ${top + 1} Z`}
              fill="#FCD34D" className="ks-flame" style={{ animationDelay: `${i * 0.08 + 0.1}s` }} />
          </g>
        );
      })}
    </g>
  );
}

// ── Diwali: diya lamp with flickering flame ──
function DiyaIcon() {
  return wrap(
    <g>
      <path d="M24 10 Q19 17 24 22 Q29 17 24 10 Z" fill="#FB923C" className="ks-flame" />
      <path d="M24 13 Q21.5 17 24 20 Q26.5 17 24 13 Z" fill="#FCD34D" className="ks-flame" style={{ animationDelay: '0.12s' }} />
      <path d="M8 30 Q24 40 40 30 L34 35 Q24 41 14 35 Z" fill="#B45309" />
      <path d="M10 28 Q24 36 38 28 L34 32 Q24 37 14 32 Z" fill="#D97706" />
      <path d="M14 35 Q24 39 34 35" stroke="#FCD34D" strokeWidth="1.2" fill="none" opacity="0.7" />
    </g>
  );
}

// ── Easter: decorated egg, gently floating ──
function EasterEggIcon() {
  return wrap(
    <g className="ks-float">
      <path d="M24 6 Q11 6 11 22 Q11 42 24 42 Q37 42 37 22 Q37 6 24 6 Z" fill="#F472B6" />
      <path d="M13 18 Q24 15 35 18" stroke="#A855F7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M12 26 Q24 23 36 26" stroke="#FCD34D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M13 34 Q24 31 35 34" stroke="#34D399" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="12" r="1.3" fill="#FCD34D" />
      <circle cx="29" cy="13" r="1.1" fill="#A855F7" />
      <circle cx="24" cy="39" r="1.2" fill="#34D399" />
    </g>
  );
}

// ── Eid / Ramadan: crescent moon with twinkling stars ──
function CrescentMoonIcon() {
  return wrap(
    <g>
      <path d="M30 8 A16 16 0 1 0 30 40 A12 12 0 1 1 30 8 Z" fill="#FCD34D" />
      <circle cx="12" cy="14" r="1.3" fill="#FCD34D" className="ks-twinkle" />
      <circle cx="9" cy="27" r="1.1" fill="#FCD34D" className="ks-twinkle" style={{ animationDelay: '0.6s' }} />
      <circle cx="15" cy="38" r="1.3" fill="#FCD34D" className="ks-twinkle" style={{ animationDelay: '1.1s' }} />
      <circle cx="38" cy="10" r="1" fill="#FCD34D" className="ks-twinkle" style={{ animationDelay: '0.3s' }} />
    </g>
  );
}

// ── Valentine's: beating heart ──
function HeartIcon() {
  return wrap(
    <g className="ks-beat">
      <path d="M24 41 L7 24 Q7 13 16 13 Q22 13 24 19 Q26 13 32 13 Q41 13 41 24 Z" fill="#E11D48" />
      <path d="M16 16 Q20 16 22 20" stroke="#FECDD3" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

// ── Halloween: jack-o'-lantern with flickering face ──
function JackOLanternIcon() {
  return wrap(
    <g>
      <rect x="22" y="8" width="4" height="5" rx="1.5" fill="#16A34A" />
      <ellipse cx="24" cy="28" rx="16" ry="14" fill="#F97316" />
      <ellipse cx="16" cy="28" rx="6" ry="13" fill="#EA580C" opacity="0.5" />
      <ellipse cx="32" cy="28" rx="6" ry="13" fill="#C2410C" opacity="0.5" />
      <path d="M16 24 L20 24 L18 19 Z" fill="#FBBF24" className="ks-light" />
      <path d="M32 24 L28 24 L30 19 Z" fill="#FBBF24" className="ks-light" style={{ animationDelay: '0.3s' }} />
      <path d="M15 32 L19 34 L21 32 L23 34 L25 32 L27 34 L29 32 L31 34 L31 36 L17 36 Z"
        fill="#FBBF24" className="ks-light" style={{ animationDelay: '0.6s' }} />
    </g>
  );
}

// ── St. Patrick's: swaying shamrock ──
function ShamrockIcon() {
  return wrap(
    <g className="ks-sway">
      <path d="M24 44 L24 32" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="15" r="6.5" fill="#16A34A" />
      <circle cx="15" cy="23" r="6.5" fill="#16A34A" />
      <circle cx="33" cy="23" r="6.5" fill="#16A34A" />
      <circle cx="24" cy="22" r="4.5" fill="#22C55E" />
    </g>
  );
}

// ── Fireworks (July 4th / New Year's) ──
function FireworkBurst({ cx, cy, colors, delay }) {
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x2 = cx + 7 * Math.cos(a);
    const y2 = cy + 7 * Math.sin(a);
    const dx = cx + 9 * Math.cos(a);
    const dy = cy + 9 * Math.sin(a);
    const c = colors[i % colors.length];
    rays.push(
      <g key={i}>
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx={dx} cy={dy} r="1.4" fill={c} />
      </g>
    );
  }
  return <g className="ks-burst" style={{ animationDelay: `${delay}s` }}>{rays}</g>;
}

function FireworksIcon({ colors }) {
  return wrap(
    <g>
      <FireworkBurst cx={16} cy={16} colors={colors} delay={0} />
      <FireworkBurst cx={34} cy={30} colors={colors} delay={0.9} />
      <FireworkBurst cx={30} cy={12} colors={colors} delay={1.3} />
    </g>
  );
}

function JulyFourthIcon() {
  return <FireworksIcon colors={['#DC2626', '#2563EB', '#F3F4F6']} />;
}

function NewYearIcon() {
  return <FireworksIcon colors={['#EAB308', '#C0C0C0', '#A78BFA']} />;
}

// ── Thanksgiving: swaying maple leaf ──
function MapleLeafIcon() {
  return wrap(
    <g className="ks-sway">
      <path d="M24 44 L24 37" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 7 L27 13 L33 11 L31 19 L38 21 L32 25 L36 32 L28 30 L24 36 L20 30 L12 32 L16 25 L10 21 L17 19 L15 11 L21 13 Z"
        fill="#C2410C" />
      <path d="M24 7 L27 13 L33 11 L31 19 L38 21 L32 25 L36 32 L28 30 L24 36 L20 30 L12 32 L16 25 L10 21 L17 19 L15 11 L21 13 Z"
        fill="none" stroke="#9A3412" strokeWidth="0.8" opacity="0.5" />
    </g>
  );
}

// ── Map: theme id → custom animated icon component ──
export const SEASONAL_ICONS = {
  spring: FlowerIcon,
  summer: SunIcon,
  autumn: AutumnSceneIcon,
  winter: SnowmanIcon,
  christmas: ChristmasTreeIcon,
  hanukkah: MenorahIcon,
  diwali: DiyaIcon,
  eid: CrescentMoonIcon,
  easter: EasterEggIcon,
  ramadan: CrescentMoonIcon,
  valentines: HeartIcon,
  halloween: JackOLanternIcon,
  stpatricks: ShamrockIcon,
  fourthjuly: JulyFourthIcon,
  thanksgiving: MapleLeafIcon,
  newyear: NewYearIcon,
};