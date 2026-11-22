import React from 'react';
import { useAppHealth } from '@/lib/AppHealthContext';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Wrench, Crown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { isPremiumUser } from '@/lib/isPremium';

// Wraps a non-core feature. Two independent gates:
// 1. Kill switch — when the feature flag is off (or the client is outside the
//    rollout bucket), shows a "temporarily unavailable" message. No app release
//    required to re-enable it.
// 2. Premium — when `premium` is true and the current user is on the free plan
//    (and not an admin), shows a Premium upsell card instead of the feature.
//    This is how paid subscribers get exclusive access to AI-powered features.
export default function FeatureGate({ feature, premium, children, fallback }) {
  const { isFeatureEnabled } = useAppHealth();
  const { user } = useAuth();
  const { t } = useI18n();

  // Kill switch takes precedence — even Premium users see "unavailable" when
  // the flag is off, since the feature is genuinely down.
  if (!isFeatureEnabled(feature)) {
    if (fallback) return fallback;
    return (
      <div className="px-5 py-16 flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-muted-foreground mb-3">
          <Wrench size={22} />
        </div>
        <p className="font-display text-lg font-semibold mb-1">Temporarily unavailable</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          This feature is undergoing maintenance. We'll have it back up shortly — thanks for your patience.
        </p>
      </div>
    );
  }

  // Premium gate: admins and users with plan === 'premium' (or a lifetime tier)
  // pass through; everyone else sees the upsell.
  if (premium) {
    if (!isPremiumUser(user)) {
      return (
        <div className="px-5 py-16 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 text-accent mb-3">
            <Crown size={24} />
          </div>
          <p className="font-display text-lg font-semibold mb-1">{t('app.premiumFeature')}</p>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            {t('app.premiumFeatureDesc')}
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 h-11 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
          >
            <Crown size={16} className="mr-1.5" />
            Explore Premium
          </Link>
        </div>
      );
    }
  }

  return children;
}