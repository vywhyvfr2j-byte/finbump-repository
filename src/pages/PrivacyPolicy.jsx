import React from 'react';
import LegalDocument from '@/components/legal/LegalDocument';
import { useI18n } from '@/lib/i18n/I18nContext';
import { getLegalContent } from '@/lib/content/legalContent';

export default function PrivacyPolicy() {
  const { language } = useI18n();
  const doc = getLegalContent(language).privacy;
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      lastUpdated={getLegalContent(language).lastUpdated}
      sections={doc.sections}
    />
  );
}