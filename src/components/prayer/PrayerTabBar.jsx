import React from 'react';
import { HandHeart, Heart, Sparkles, UserCog } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

const TABS = [
  { key: 'prayer', labelKey: 'prayer.tab.prayer', Icon: HandHeart },
  { key: 'health', labelKey: 'prayer.tab.health', Icon: Heart },
  { key: 'other', labelKey: 'prayer.tab.other', Icon: Sparkles },
  { key: 'mine', labelKey: 'prayer.tab.mine', Icon: UserCog },
];

export default function PrayerTabBar({ tab, onSwitch }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-1.5 mb-5">
      {TABS.map(({ key, labelKey, Icon }) => (
        <button
          key={key}
          onClick={() => onSwitch(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-colors ${
            tab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <Icon size={15} /> {t(labelKey)}
        </button>
      ))}
    </div>
  );
}