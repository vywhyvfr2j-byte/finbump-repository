import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PRIMARY_TABS } from '@/lib/navItems';
import { tabForPath } from '@/lib/tabStacks';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';
import FbIcon from '@/components/icons/FbIcon';
import useTabNavigation from '@/hooks/useTabNavigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PARTNER_RELATION_KEYS = {
  partner: 'relation.partnerCap',
  spouse: 'relation.spouseCap',
  husband: 'relation.husbandCap',
  wife: 'relation.wifeCap',
};

const NAV_LABEL_KEYS = {
  'Home': 'nav.home',
  'Calendar': 'nav.calendar',
  'Explore': 'nav.explore',
  'My Profile': 'nav.myProfile',
  'Who You Love': 'nav.whoYouLove',
  'Groups': 'nav.groups',
  'Care & Prayer': 'nav.carePrayer',
  'Acts': 'nav.acts',
  'Message Writer': 'nav.messageWriter',
  'Cards': 'nav.cards',
  'Ideas': 'nav.ideas',
  'Relationship Notes': 'nav.relationshipNotes',
  'Progress': 'nav.progress',
  'Help & Chat': 'nav.helpChat',
  'Settings': 'nav.settings',
  'About Us': 'nav.aboutUs',
  'User Guide': 'nav.userGuide',
  'History': 'nav.history',
  'Saved Items': 'nav.savedItems',
  'Budget & Tracker': 'nav.budgetTracker',
  'Personal Notes': 'nav.personalNotes',
  'Trip Ideas': 'nav.tripIdeas',
  'Suggest a Change': 'nav.suggestChange',
  'People & Pets': 'nav.peoplePets',
  'Connect & Express': 'nav.connectExpress',
  'Gifts & Ideas': 'nav.giftsIdeas',
  'Relaxation & Wellness': 'nav.relaxationWellness',
  'Track & Reflect': 'nav.trackReflect',
  'Support & Info': 'nav.supportInfo',
};

// A tab stays lit anywhere inside its own stack, so /acts/123 still reads as
// Acts and tapping it pops back to the tab's root page.
function activeTabFor(pathname) {
  return tabForPath(pathname);
}

export default function BottomNav() {
  const location = useLocation();
  const { people } = useKeepsake();
  const { t } = useI18n();

  const partnerPerson = people.find((p) =>
    ['partner', 'spouse', 'husband', 'wife'].includes((p.relation || '').toLowerCase())
  );
  const partnerLabel = (partnerPerson && PARTNER_RELATION_KEYS[partnerPerson.relation] && t(PARTNER_RELATION_KEYS[partnerPerson.relation])) || t('relation.partnerCap');
  const tabs = PRIMARY_TABS.map((tab) => {
    if (tab.to === '/profile') return { ...tab, label: partnerLabel };
    const key = NAV_LABEL_KEYS[tab.label] || NAV_LABEL_KEYS[tab.label.replace(/&/g, '&amp;')];
    return key ? { ...tab, label: t(key) } : tab;
  });

  // Explore stays lit on the hub page itself and on any of its destinations.
  const activeTab = activeTabFor(location.pathname);

  // Tabs keep their own place: switching resumes where that tab was left,
  // instead of stacking a new page on top of the current one.
  const goToTab = useTabNavigation();

  const handleTabClick = (event, to) => {
    // Leave modified clicks (open in new tab, etc.) to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    goToTab(to);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[440px] bg-card/90 backdrop-blur-lg border-t border-border">
      <TooltipProvider delayDuration={250}>
        {/* Every tab is one equal slice of the bar, and the slice IS the whole
            target: the link stretches the full height of the bar (safe-area
            gutter included) with no outer padding, so tapping anywhere on the
            icon, its label, or the space around them always hits that tab. The
            icon and label never capture the pointer themselves. */}
        <div className="flex items-stretch">
          {tabs.map(({ to, label, tipKey, icon: Icon, fbIcon }) => {
            const active = activeTab === to;
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={(event) => handleTabClick(event, to)}
                    className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] rounded-lg transition-colors duration-200 touch-manipulation active:scale-95 ${
                      active ? 'bg-primary/10' : 'hover:bg-secondary/40'
                    }`}
                  >
                    {fbIcon ? (
                      <FbIcon
                        name={fbIcon}
                        style="color"
                        size={22}
                        className={`shrink-0 pointer-events-none transition-transform duration-200 ${active ? 'scale-105' : 'opacity-60'}`}
                      />
                    ) : (
                      <Icon
                        size={20}
                        className={`shrink-0 pointer-events-none transition-transform duration-200 ${active ? 'scale-105' : ''}`}
                        style={active ? { stroke: 'hsl(var(--primary))', strokeWidth: 2.4 } : undefined}
                      />
                    )}
                    <span
                      className={`w-full text-center text-xs tracking-tight leading-[1.15] pointer-events-none transition-colors duration-200 ${
                        active ? 'text-primary font-bold' : 'text-muted-foreground font-medium'
                      }`}
                    >
                      {label}
                    </span>
                    {active && (
                      <span className="absolute top-0.5 h-0.5 w-5 rounded-full bg-primary" />
                    )}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="max-w-[190px] text-center leading-snug">
                  {t(tipKey)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </nav>
  );
}