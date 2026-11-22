import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Image } from '@/components/ui/image';

// Dark-background app mark — the default everywhere, so it reads on the app's
// cream surfaces and dark headers alike.
const ICON_URL = 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/56b61e622_apple-touch-icon-180.png';
// Light-background stacked artwork (dolphins + wordmark), used large on Home only.
const STACKED_URL = 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/d205d2295_xxx.svg';
const STACKED_RATIO = 920.3 / 989;

export default function BrandLogo({ size = 40, stacked = false, className = '' }) {
  const { t } = useI18n();

  if (stacked) {
    const width = Math.round(size * 1.85);
    const height = Math.round(width * STACKED_RATIO);
    return (
      <Image
        src={STACKED_URL}
        alt={t('app.name')}
        width={width}
        height={height}
        fittingType="fit"
        loading="eager"
        className={`shrink-0 object-contain ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <Image
        src={ICON_URL}
        alt={t('app.name')}
        width={size}
        height={size}
        fittingType="fit"
        loading="eager"
        className="shrink-0 overflow-hidden"
        style={{ width: size, height: size, borderRadius: Math.max(4, size * 0.18) }}
      />
    </div>
  );
}