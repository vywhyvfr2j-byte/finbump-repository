import React from 'react';
import TopNav from '@/components/TopNav';
import GuideLesson from '@/components/guide/GuideLesson';
import {
  GUIDE_INTRO,
  GUIDE_LESSONS,
  GUIDE_DAILY_ROUTINE,
  GUIDE_DAILY_EXPECT,
  GUIDE_CLOSING,
} from '@/lib/userGuideContent';
import { Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function UserGuide() {
  const { t } = useI18n();
  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('userGuide.title')} subtitle={t('userGuide.subtitle')} back />

      <div className="px-5 mt-2 space-y-5">
        {/* Intro */}
        <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-primary" />
            <h2 className="font-display text-lg font-semibold">{t('userGuide.welcome')}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{GUIDE_INTRO}</p>
        </div>

        {/* Lessons */}
        <div className="space-y-2.5">
          {GUIDE_LESSONS.map((lesson, i) => (
            <GuideLesson key={i} lesson={lesson} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Daily routine */}
        <div className="space-y-2.5">
          <h3 className="font-display text-base font-semibold px-1 pt-2">{t('userGuide.dailyFlow')}</h3>
          <GuideLesson lesson={GUIDE_DAILY_ROUTINE} />
          <GuideLesson lesson={GUIDE_DAILY_EXPECT} />
        </div>

        {/* Closing */}
        <div className="rounded-2xl bg-secondary/30 border border-border p-4">
          <p className="text-sm text-muted-foreground leading-relaxed italic">{GUIDE_CLOSING}</p>
        </div>
      </div>
    </div>
  );
}