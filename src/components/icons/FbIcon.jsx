import React from 'react';

// The FinBump icon pack (src/assets/fb-icons). Two styles ship for every icon:
//
//  - colour (default): the full brand artwork, drawn from the bundled SVG.
//  - mono: one tone plus a 50% tint, painted as a CSS mask so it takes the
//    surrounding text colour (currentColor) and follows the theme and dark mode.
//
// Usage: <FbIcon name="home" style="mono" size={18} /> — names match the files
// in src/assets/fb-icons (fb-home.svg → name="home"). Each SVG keeps its own
// gradient ids inside its own file, so nothing collides when many are on screen.
const colorFiles = import.meta.glob('/src/assets/fb-icons/color/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const monoFiles = import.meta.glob('/src/assets/fb-icons/mono/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urlFor = (files, style, name) => files[`/src/assets/fb-icons/${style}/fb-${name}.svg`] || null;

export default function FbIcon({ name, style = 'color', size = 24, className, label }) {
  const mono = style === 'mono';
  const src = urlFor(mono ? monoFiles : colorFiles, mono ? 'mono' : 'color', name);
  if (!src) return null;

  if (mono) {
    return (
      <span
        className={className}
        role={label ? 'img' : undefined}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          flexShrink: 0,
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={label || ''}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    />
  );
}