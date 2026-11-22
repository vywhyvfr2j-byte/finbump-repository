import React from 'react';
import TopNav from '@/components/TopNav';
import AboutUs from '@/components/settings/AboutUs';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function AboutUsPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('about.title')} subtitle={t('about.subtitle')} back backTo="/find-it" />
      <div className="px-5 mt-2">
        <AboutUs />
      </div>
    </div>
  );
}