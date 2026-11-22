import React from 'react';
import iconUrl from '@/assets/fb-icons/color/fb-remembrance.svg';

// The remembrance artwork from the FinBump icon pack, imported directly so the
// tile always shows it (the shared icon loader resolves its files at load time,
// which misses a newly added one until a restart).
export default function RemembranceIcon({ size = 24, className }) {
  return (
    <img
      src={iconUrl}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    />
  );
}