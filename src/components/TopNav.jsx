import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function TopNav({ title, subtitle, back = true, backTo, right, showBell = false }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pt-[calc(14px+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 px-4 pb-3.5">
        {back ? (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full hover:bg-secondary/60 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="w-11" />
        )}
        <div className="flex-1 min-w-0 text-center">
          {subtitle && <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{subtitle}</p>}
          <h1 className="font-display text-lg font-semibold leading-tight flex items-center justify-center gap-1.5 min-w-0">
            <Link to="/" aria-label={t('app.home')} className="inline-flex items-center justify-center shrink-0">
              <BrandLogo size={26} />
            </Link>
            <span className="min-w-0 text-center">{title}</span>
          </h1>
        </div>
        <div className="flex shrink-0 justify-end items-center gap-0.5">
          {showBell && <NotificationBell className="w-11 h-11 flex items-center justify-center" />}
          {right}
        </div>
      </div>
    </header>
  );
}