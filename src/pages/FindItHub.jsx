import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import { Search as SearchIcon, Crown } from 'lucide-react';
import { MORE_GROUPS } from '@/lib/navItems';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Image } from '@/components/ui/image';
import FbIcon from '@/components/icons/FbIcon';

// The main brand graphic — the two-dolphins "fin bump" logo, shown on the
// About Us tile in place of a generic circle icon.
const MAIN_LOGO_URL = 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/228827c3a_logo.png';

function isActive(pathname, to) {
  return to === '/' ? pathname === '/' : pathname === to;
}

export default function FindItHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('explore.title')} subtitle={t('explore.subtitle')} back={false} />
      <div className="px-5 mt-2 space-y-5">
        <Link to="/search" className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-secondary/60 transition-colors shadow-card active:scale-[0.98] ks-card-tint">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
            <SearchIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-medium">{t('explore.searchEverything')}</p>
            <p className="text-xs text-muted-foreground">{t('explore.searchDesc')}</p>
          </div>
        </Link>
        {MORE_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className="block w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent" />
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">{t(group.titleKey)}</p>
              <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.items.map(({ to, label, labelKey, icon: Icon, fbIcon, premium }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigate(to)}
                  className={`relative flex flex-col items-center gap-1.5 py-4 px-1 rounded-2xl border transition-colors active:scale-[0.95] ${
                    isActive(location.pathname, to)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-foreground hover:bg-secondary/60'
                  }`}
                  title={t(labelKey)}
                >
                  {premium && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-accent-foreground" title="Premium">
                      <Crown size={10} />
                    </span>
                  )}
                  {to === '/about-us' ? (
                    <Image
                      src={MAIN_LOGO_URL}
                      alt={t(labelKey)}
                      width={28}
                      height={28}
                      fittingType="fit"
                      loading="eager"
                      className="shrink-0 rounded-lg"
                      style={{ width: 28, height: 28 }}
                    />
                  ) : fbIcon ? (
                    <FbIcon name={fbIcon} style="color" size={26} />
                  ) : (
                    <Icon size={24} />
                  )}
                  <span className="text-[11px] font-medium leading-tight text-center">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}