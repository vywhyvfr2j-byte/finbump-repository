import React from 'react';
import TopNav from '@/components/TopNav';
import SavedGiftItems from '@/components/ideas/SavedGiftItems';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function SavedItems() {
  const { t } = useI18n();
  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('savedItems.title')} back backTo="/find-it" subtitle={t('savedItems.subtitle')} />
      <div className="px-5 mt-2">
        <SavedGiftItems />
      </div>
    </div>
  );
}