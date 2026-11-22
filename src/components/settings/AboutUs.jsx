import React from 'react';
import { Heart } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n/I18nContext';

// The main brand graphic — the two-dolphins "fin bump" logo (dark plate).
const MAIN_LOGO_URL = 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/228827c3a_logo.png';

export default function AboutUs() {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      {/* Header with logo */}
      <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src={MAIN_LOGO_URL}
            alt={t('app.name')}
            width={200}
            height={200}
            fittingType="fit"
            loading="eager"
            className="shrink-0 rounded-2xl"
            style={{ width: 200, height: 200 }}
          />
        </div>
        <p className="text-sm text-muted-foreground italic font-display">
          "Because the little things really are the big things."
        </p>
      </div>

      {/* Mission statement */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-primary" />
          <h3 className="font-heading text-sm font-semibold">Our Mission</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          Our mission is simple: to turn good intentions into real actions, so you can show up as the person you want to be for the people who need you most. Because the little things really are the big things.
        </p>
      </div>

      {/* Why dolphins — the story behind the name */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-primary" />
          <h3 className="font-heading text-sm font-semibold">{t('app.aboutWhyTitle')}</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {t('app.aboutWhyBody1')}
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {t('app.aboutWhyBody2')}
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {t('app.aboutWhyBody3')}
        </p>
      </div>

      {/* Owner / company */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
        <h3 className="font-heading text-sm font-semibold">Owned & operated by</h3>
        <p className="text-sm text-muted-foreground">Ugh No Ugh, LLC</p>
      </div>

      {/* Accessibility compliance */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
        <h3 className="font-heading text-sm font-semibold">Accessibility</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('app.aboutAccessibility')}
        </p>
      </div>

      {/* Security & compliance */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
        <h3 className="font-heading text-sm font-semibold">Security & Compliance</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('app.aboutSecurity')}
        </p>
      </div>
    </div>
  );
}