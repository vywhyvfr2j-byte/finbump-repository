import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Keyboard-only escape hatch past the app chrome: hidden until it takes focus,
// then it becomes the first visible tab stop and jumps to the page content.
export default function SkipToContent() {
  const { t } = useI18n();

  return (
    <a
      href="#main-content"
      className="ks-skip-link rounded-full border border-border bg-card text-sm font-medium text-primary shadow-lg"
    >
      {t('common.skipToContent')}
    </a>
  );
}