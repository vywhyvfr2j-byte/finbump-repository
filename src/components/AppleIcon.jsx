import React from "react";

// Official Apple logo glyph (black). Per Apple's Sign in with Apple guidelines,
// used here on a white/light outline button next to "Continue with Apple".
export default function AppleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 12.43c-.02-2.05 1.67-3.03 1.75-3.08-1.96-2.86-5-3.25-6.07-3.28-2.56-.27-5.03 1.53-6.34 1.53-1.33 0-3.33-1.5-5.5-1.46-.28.01-.57.04-.85.1C-.7 6.68.42 9.9 1.6 11.6c.57.84 1.25 1.78 2.13 1.74.86-.03 1.18-.55 2.22-.55 1.03 0 1.33.55 2.23.53.92-.02 1.51-.84 2.07-1.69.66-.97.93-1.92.94-1.97 0 0 1.8-.7 2.18 2.36l1.99-.74c0 0-.04.65-.16 1.16zm-3.4-9.27c1.16-1.4 2.88-2.07 3.06-2.16 1 .04h.05c1.16-.04 1.16 1.4-.05.16-.27.05-2.5.07-3.06 2.16z" />
    </svg>
  );
}