// Custom FinBump icon set — crisp, clear silhouettes that echo the main
// FinBump mark (a calendar speech-bubble with a coral heart).
// Style: bold rounded shapes filled with the Teal -> Coral -> Gold brand
// gradient, with a coral heart (#FF8C8C) accent on memory-focused icons
// and white details for contrast. Rendered as plain SVG (not lucide) so
// they are unaffected by the global `svg.lucide` gradient stroke rule.
// Each accepts { size, className, label }.

const G = 'url(#finbump-gradient)';
const CORAL = '#FF8C8C';

// A small coral heart, reusable across icons to tie them to the main mark.
// Centered at (cx, cy) with scale s.
function Heart({ cx = 12, cy = 10, s = 1 }) {
  return (
    <path
      transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}
      fill={CORAL}
      d={`M${cx} ${cy + 3.2} C${cx} ${cy + 3.2} ${cx - 4} ${cy + 0.4} ${cx - 4} ${cy - 1.6} C${cx - 4} ${cy - 2.8} ${cx - 3} ${cy - 3.6} ${cx - 1.8} ${cy - 3.6} C${cx - 0.9} ${cy - 3.6} ${cx - 0.1} ${cy - 3.2} ${cx} ${cy - 2.6} C${cx + 0.1} ${cy - 3.2} ${cx + 0.9} ${cy - 3.6} ${cx + 1.8} ${cy - 3.6} C${cx + 3} ${cy - 3.6} ${cx + 4} ${cy - 2.8} ${cx + 4} ${cy - 1.6} C${cx + 4} ${cy + 0.4} ${cx} ${cy + 3.2} ${cx} ${cy + 3.2} Z`}
    />
  );
}

// Reusable person silhouette anchored to baseline y=20, centered on x=0.
function Person({ cx = 12, s = 1, fill = G }) {
  return (
    <g transform={`translate(${cx} 20) scale(${s}) translate(0 -20)`}>
      <circle cx={0} cy={8.4} r={3.2} fill={fill} />
      <path
        fill={fill}
        d="M-5.2 19.8c0-3.2 2.6-5.6 5.2-5.6s5.2 2.4 5.2 5.6c0 .3-.2.5-.5.5H-4.7c-.3 0-.5-.2-.5-.5Z"
      />
    </g>
  );
}

function Svg({ size = 20, className, children, label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
    >
      {children}
    </svg>
  );
}

// Home — a clean house with a coral heart as the doorway (keepsake = home of memories).
export const KsHome = (p) => (
  <Svg {...p}>
    <path
      fill={G}
      d="M12 2.6 3 9.4V20a1.6 1.6 0 0 0 1.6 1.6h14.8A1.6 1.6 0 0 0 21 20V9.4Z"
    />
    <path fill={G} d="M2.6 10 12 2.6 21.4 10l-.9 1.2L12 4.4 3.5 11.2Z" />
    <Heart cx={12} cy={15.4} s={0.95} />
  </Svg>
);

// Events — a clean calendar page with a coral heart (echoes the main FinBump mark).
export const KsEvents = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" fill={G} />
    <rect x="3" y="5" width="18" height="4.4" rx="3" fill={G} />
    <rect x="3" y="7.4" width="18" height="2" fill="#fff" fillOpacity="0.25" />
    <rect x="7.4" y="2.6" width="2.4" height="5.2" rx="1.2" fill={G} />
    <rect x="14.2" y="2.6" width="2.4" height="5.2" rx="1.2" fill={G} />
    <Heart cx={12} cy={14.8} s={0.9} />
  </Svg>
);

// Ideas — a clean lightbulb with a coral heart glow.
export const KsIdeas = (p) => (
  <Svg {...p}>
    <path
      fill={G}
      d="M12 2.4a6.6 6.6 0 0 1 4.1 11.8c-.6.5-1 1.3-1 2.1v.2a1.6 1.6 0 0 1-1.6 1.6h-3a1.6 1.6 0 0 1-1.6-1.6v-.2c0-.8-.4-1.6-1-2.1A6.6 6.6 0 0 1 12 2.4Z"
    />
    <Heart cx={12} cy={9.2} s={0.72} />
    <rect x="9.4" y="19.4" width="5.2" height="1.7" rx="0.85" fill={G} />
    <rect x="10.2" y="21.6" width="3.6" height="1.4" rx="0.7" fill={G} />
  </Svg>
);

// Find It — a crisp magnifying glass with a small heart in the lens.
export const KsFindIt = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="6.4" fill={G} />
    <Heart cx={10} cy={10} s={0.62} />
    <rect
      x="14.6"
      y="15.2"
      width="2.6"
      height="7.6"
      rx="1.3"
      fill={G}
      transform="rotate(45 15.9 19)"
    />
  </Svg>
);

// You — a clean single person silhouette.
export const KsYou = (p) => <Svg {...p}><Person cx={12} s={1} /></Svg>;

// Two adults, lightly paired (partner / parents).
export const KsPeoplePair = (p) => (
  <Svg {...p}>
    <Person cx={9.2} s={0.84} />
    <Person cx={14.8} s={0.84} />
  </Svg>
);

// Two small persons side by side.
export const KsKids = (p) => (
  <Svg {...p}>
    <Person cx={8.4} s={0.64} />
    <Person cx={15.6} s={0.64} />
  </Svg>
);

// One larger person with two smaller flanking.
export const KsGrandkids = (p) => (
  <Svg {...p}>
    <Person cx={6.2} s={0.52} />
    <Person cx={12} s={0.84} />
    <Person cx={17.8} s={0.52} />
  </Svg>
);

// Two overlapping persons.
export const KsSiblings = (p) => (
  <Svg {...p}>
    <Person cx={9.8} s={0.8} />
    <Person cx={14.2} s={0.8} />
  </Svg>
);

// Three overlapping persons.
export const KsPeopleCluster = (p) => (
  <Svg {...p}>
    <Person cx={8.2} s={0.72} />
    <Person cx={12} s={0.72} />
    <Person cx={15.8} s={0.72} />
  </Svg>
);

// Three dots, Teal / Gold / Coral.
export const KsPeopleDots = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="3" fill="#18A999" />
    <circle cx="12" cy="12" r="3" fill="#FFD93D" />
    <circle cx="18" cy="12" r="3" fill="#FF6B6B" />
  </Svg>
);

export const KsStar = (p) => (
  <Svg {...p}>
    <path
      fill={G}
      d="M12 3.4l2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.1l-5 2.75.95-5.6L3.9 9.3l5.6-.8z"
    />
  </Svg>
);

// Four decreasing circles: Teal, Coral, Gold, light Coral.
export const KsMore = (p) => (
  <Svg {...p}>
    <circle cx="5.5" cy="12" r="3.1" fill="#18A999" />
    <circle cx="11" cy="12" r="2.5" fill="#FF6B6B" />
    <circle cx="15.6" cy="12" r="1.95" fill="#FFD93D" />
    <circle cx="19.6" cy="12" r="1.45" fill="#FFB3B3" />
  </Svg>
);

// Gifts — a clean gift box with a coral heart bow.
export const KsGifts = (p) => (
  <Svg {...p}>
    <rect x="4" y="9.5" width="16" height="10.5" rx="1.6" fill={G} />
    <rect x="4" y="7.6" width="16" height="2.8" rx="1.4" fill={G} />
    <rect x="11.2" y="7.6" width="1.6" height="12.4" fill="#fff" fillOpacity="0.9" />
    <Heart cx={12} cy={6.2} s={0.62} />
  </Svg>
);

// Gift budget — a gift box with a coin.
export const KsGiftBudget = (p) => (
  <Svg {...p}>
    <rect x="3" y="8.4" width="18" height="12" rx="2.4" fill={G} />
    <rect x="3" y="8.4" width="18" height="2.6" rx="1.3" fill={G} />
    <rect x="11.3" y="8.4" width="1.4" height="12" fill="#fff" fillOpacity="0.9" />
    <circle cx="17" cy="14.4" r="2.4" fill="#fff" />
    <text x="17" y="15.6" textAnchor="middle" fontSize="3.4" fontWeight="700" fill={G}>$</text>
  </Svg>
);

// Dashboard — a clean gauge with a needle.
export const KsDashboard = (p) => (
  <Svg {...p}>
    <path fill={G} d="M3 17a9 9 0 0 1 18 0Z" />
    <path fill="#fff" d="M6.4 17a5.6 5.6 0 0 1 11.2 0Z" />
    <rect
      x="11.3"
      y="11"
      width="1.4"
      height="6.2"
      rx="0.7"
      fill={G}
      transform="rotate(-35 12 17.2)"
    />
    <circle cx="12" cy="17.2" r="1.5" fill={G} />
  </Svg>
);

// Special Dates — a calendar with a coral heart (like the main mark, with a ribbon detail).
export const KsSpecialDates = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" fill={G} />
    <rect x="3" y="5" width="18" height="4.4" rx="3" fill={G} />
    <rect x="3" y="7.4" width="18" height="2" fill="#fff" fillOpacity="0.25" />
    <rect x="7.4" y="2.6" width="2.4" height="5.2" rx="1.2" fill={G} />
    <rect x="14.2" y="2.6" width="2.4" height="5.2" rx="1.2" fill={G} />
    <Heart cx={12} cy={14.8} s={0.9} />
  </Svg>
);

// Personal Notes — a clean notebook with a pencil.
export const KsPersonalNotes = (p) => (
  <Svg {...p}>
    <rect x="3.4" y="3.6" width="12" height="17" rx="2.2" fill={G} />
    <rect x="6" y="7" width="7" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.9" />
    <rect x="6" y="10" width="7" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.9" />
    <rect x="6" y="13" width="4.5" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.9" />
    <g transform="rotate(45 17.6 16.8)">
      <rect x="16.8" y="9.2" width="1.7" height="14.4" rx="0.85" fill={G} />
      <path fill={G} d="M16.8 23.6h1.7l-.85 2.6z" />
      <rect x="16.6" y="8.8" width="2.1" height="1.7" rx="0.4" fill={G} />
    </g>
  </Svg>
);

// Vacation — a clean palm tree.
export const KsVacation = (p) => (
  <Svg {...p}>
    <path fill={G} d="M11 9.2h2l-.6 11h-.8z" />
    <path
      fill={G}
      d="M12 8.4c-3-3.2-7.4-3-9.2-1 .2 2.4 3.4 3.6 6 3.2-2.4 1-4 3.4-3.4 5.6 2.2.4 4.8-1 6-3.4 1.2 2.4 3.8 3.8 6 3.4.6-2.2-1-4.6-3.4-5.6 2.6.4 5.8-.8 6-3.2-1.8-2-6.2-2.2-9.2 1Z"
    />
    <ellipse cx="12" cy="20.6" rx="8.5" ry="2.4" fill={G} />
  </Svg>
);

// Milestones — a clean flag on a hill (a milestone reached).
export const KsMilestones = (p) => (
  <Svg {...p}>
    <path fill={G} d="M2.5 20.4c0-4 4.2-6.2 9.5-6.2s9.5 2.2 9.5 6.2Z" />
    <rect x="11.2" y="5.4" width="1.3" height="9.4" rx="0.65" fill={G} />
    <path fill={G} d="M12.5 5.6h6.5l-1.9 2.3 1.9 2.3h-6.5z" />
  </Svg>
);

// The standalone FinBump coral heart — the same heart that sits at the center
// of the main brand mark, available on its own for accents like the home banner.
export const KsHeart = ({ size = 20, className, label }) => (
  <Svg size={size} className={className} label={label}>
    <Heart cx={12} cy={11} s={1.7} />
  </Svg>
);