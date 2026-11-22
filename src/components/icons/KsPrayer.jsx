// Praying hands icon for the Prayer list.
const G = 'url(#finbump-gradient)';
const CORAL = '#FF8C8C';

export default function KsPrayer({ size = 20, className, label }) {
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
      {/* Two hands clasped together in prayer */}
      <path
        fill={G}
        d="M8.2 4.2c.5 0 .9.4.9.9v6.2l-1.8 1.2V5.1c0-.5.4-.9.9-.9Z"
      />
      <path
        fill={G}
        d="M15.8 4.2c.5 0 .9.4.9.9v7.4l-1.8-1.2V5.1c0-.5.4-.9.9-.9Z"
      />
      <path
        fill={G}
        d="M6.4 11.8c0-.5.4-.9.9-.9h1.8v3.6l-2.7-1.5c-.3-.2-.4-.5-.4-.8Z"
      />
      <path
        fill={G}
        d="M17.6 11.8c0-.5-.4-.9-.9-.9h-1.8v3.6l2.7-1.5c.3-.2.4-.5.4-.8Z"
      />
      {/* Clasped fingers */}
      <path
        fill={G}
        d="M9.1 12.7h5.8v2.2c0 .5-.4.9-.9.9H10c-.5 0-.9-.4-.9-.9v-2.2Z"
      />
      {/* Small coral heart above hands */}
      <path
        fill={CORAL}
        d="M12 2.4c.8-.8 2.2-.4 2.2.6 0 .8-1.2 1.6-2.2 2.4-1-.8-2.2-1.6-2.2-2.4 0-1 1.4-1.4 2.2-.6Z"
      />
    </svg>
  );
}