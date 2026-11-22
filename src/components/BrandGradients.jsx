// Hidden SVG defs that expose the FinBump brand gradient
// (Teal -> Coral -> Gold) so any lucide icon can reference it via
// `stroke: url(#finbump-gradient)` in CSS. Rendered once at the app root.
export default function BrandGradients() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <linearGradient id="finbump-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#165E5C" />
          <stop offset="50%" stopColor="#C94455" />
          <stop offset="100%" stopColor="#A86A14" />
        </linearGradient>
      </defs>
    </svg>
  );
}