// Single source of truth for every navigation destination. Both the Home
// nav grid and the bottom-nav More sheet derive from this list so they can
// never drift out of sync. Add/remove a link here and it updates everywhere.
//
// Each destination carries `fbIcon` — its name in the FinBump icon pack
// (src/assets/fb-icons), rendered with <FbIcon />. Destinations with no pack
// equivalent keep their original icon.
import {
  KsHome,
  KsFindIt,
  KsPeoplePair,
  KsPeopleCluster,
  KsYou,
  KsGiftBudget,
  KsIdeas,
  KsPersonalNotes,
  KsVacation,
} from '@/components/icons/KsIcons';
import KsPrayer from '@/components/icons/KsPrayer';
import RemembranceIcon from '@/components/icons/RemembranceIcon';
import   { HeartHandshake, Heart, TrendingUp, Target, PenLine, Settings, PawPrint, Sparkles, Calendar, CalendarRange, Users, Info, BookOpen, Lightbulb, Bookmark, Mail, Utensils, Cake, Moon } from 'lucide-react';

// Flat list of every destination, in display order.
export const NAV_ITEMS = [
  { to: '/profile', label: 'Partner', labelKey: 'nav.partner', Icon: KsPeoplePair, fbIcon: 'partner' },
  { to: '/me', label: 'My Profile', labelKey: 'nav.myProfile', Icon: KsYou, fbIcon: 'my-profile' },
  { to: '/people', label: 'Who You Love', labelKey: 'nav.whoYouLove', Icon: KsPeopleCluster, fbIcon: 'who-you-love' },
  { to: '/occasions', label: 'Month Ahead', labelKey: 'nav.occasions', Icon: Cake, fbIcon: 'month-ahead' },
  { to: '/groups', label: 'Groups', labelKey: 'nav.groups', Icon: Users, fbIcon: 'groups' },
  { to: '/pets', label: 'Pets', labelKey: 'nav.pets', Icon: PawPrint, fbIcon: 'pets' },
  { to: '/prayer', label: 'Care & Prayer', labelKey: 'nav.carePrayer', Icon: KsPrayer, fbIcon: 'care-prayer' },
  { to: '/acts', label: 'Acts', labelKey: 'nav.acts', Icon: HeartHandshake, fbIcon: 'acts-of-kindness' },
  { to: '/message-writer', label: 'Message Writer', labelKey: 'nav.messageWriter', Icon: PenLine, fbIcon: 'message-writer', premium: true },
  { to: '/cards', label: 'Cards', labelKey: 'nav.cards', Icon: Mail, fbIcon: 'cards' },
  { to: '/meals', label: 'Grab a Meal', labelKey: 'nav.meals', Icon: Utensils, fbIcon: 'grab-a-meal', premium: true },
  { to: '/ideas', label: 'Ideas', labelKey: 'nav.ideas', Icon: KsIdeas, fbIcon: 'ideas', premium: true },
  { to: '/relationship-notes', label: 'Relationship Notes', labelKey: 'nav.relationshipNotes', Icon: Target, fbIcon: 'relationship-notes' },
  { to: '/memory', label: 'Memory Moments', labelKey: 'nav.memoryMoments', Icon: Moon, fbIcon: 'memory-moments' },
  { to: '/memory-summary', label: 'Year in Moments', labelKey: 'nav.memorySummary', Icon: CalendarRange, fbIcon: 'year-in-moments', premium: true },
  { to: '/remembering', label: 'Remembrance', labelKey: 'nav.remembering', Icon: RemembranceIcon, premium: true },
  { to: '/progress', label: 'Progress & History', labelKey: 'nav.progressHistory', Icon: TrendingUp, fbIcon: 'history' },
  { to: '/chat', label: 'Help & Chat', labelKey: 'nav.helpChat', Icon: Sparkles, fbIcon: 'ask-for-help', premium: true },
  { to: '/settings', label: 'Settings', labelKey: 'nav.settings', Icon: Settings, fbIcon: 'settings' },
  { to: '/about-us', label: 'About Us', labelKey: 'nav.aboutUs', Icon: Info },
  { to: '/user-guide', label: 'User Guide', labelKey: 'nav.userGuide', Icon: BookOpen, fbIcon: 'user-guide' },
  { to: '/saved-items', label: 'Saved Items', labelKey: 'nav.savedItems', Icon: Bookmark, fbIcon: 'saved-items' },
  { to: '/gift-tracker', label: 'Budget & Tracker', labelKey: 'nav.budgetTracker', Icon: KsGiftBudget, fbIcon: 'budget-tracker' },
  { to: '/personal-notes', label: 'Personal Notes', labelKey: 'nav.personalNotes', Icon: KsPersonalNotes, fbIcon: 'personal-notes' },
  { to: '/vacation-planner', label: 'Take a Trip', labelKey: 'nav.tripIdeas', Icon: KsVacation, fbIcon: 'take-a-trip', premium: true },
  { to: '/suggest-improvement', label: 'Suggest a Change', labelKey: 'nav.suggestChange', Icon: Lightbulb, fbIcon: 'suggest-a-change' },
];

// Bottom-nav primary tabs — always visible in the bar. The Partner label is
// overridden at runtime in BottomNav from settings.partnerLabel.
// `tipKey` is the hover tooltip on each tab — plain-language purpose, shown
// when a user hovers (or keyboard-focuses) the icon in the bottom bar.
export const PRIMARY_TABS = [
  { to: '/', label: 'Home', labelKey: 'nav.home', tipKey: 'navTip.home', icon: KsHome, fbIcon: 'home' },
  { to: '/acts', label: 'Acts', labelKey: 'nav.acts', tipKey: 'navTip.acts', icon: HeartHandshake, fbIcon: 'acts-of-kindness' },
  { to: '/profile', label: 'Partner', labelKey: 'nav.partner', tipKey: 'navTip.partner', icon: KsPeoplePair, fbIcon: 'partner' },
  { to: '/calendar', label: 'Calendar', labelKey: 'nav.calendar', tipKey: 'navTip.calendar', icon: Calendar, fbIcon: 'calendar' },
  { to: '/find-it', label: 'Explore', labelKey: 'nav.explore', tipKey: 'navTip.explore', icon: KsFindIt, fbIcon: 'explore' },
];

// Routes shown as primary tabs — excluded from the More sheet.
const PRIMARY_ROUTES = new Set(['/', '/acts', '/profile', '/calendar', '/find-it']);

// More sheet groups, derived from NAV_ITEMS so the sheet and grid never drift.
// Item order within each group follows NAV_ITEMS. Premium destinations are
// collected into their own group, kept last but for Support & Info.
export const MORE_GROUPS = [
  { title: 'People & Pets', titleKey: 'navGroup.peoplePets', routes: ['/me', '/profile', '/people', '/occasions', '/groups', '/pets'] },
  { title: 'Connect & Express', titleKey: 'navGroup.connectExpress', routes: ['/cards', '/relationship-notes', '/memory'] },
  { title: 'Relaxation & Wellness', titleKey: 'navGroup.relaxationWellness', routes: ['/prayer', '/personal-notes'] },
  { title: 'Track & Reflect', titleKey: 'navGroup.trackReflect', routes: ['/progress', '/gift-tracker', '/saved-items'] },
  { title: 'Premium Items', titleKey: 'navGroup.premiumItems', routes: ['/memory-summary', '/remembering', '/meals', '/message-writer', '/ideas', '/vacation-planner', '/chat'] },
  { title: 'Support & Info', titleKey: 'navGroup.supportInfo', routes: ['/settings', '/about-us', '/user-guide', '/suggest-improvement'] },
].map((g) => ({
  title: g.title,
  titleKey: g.titleKey,
  items: g.routes
    .map((r) => NAV_ITEMS.find((n) => n.to === r))
    .filter(Boolean)
    .map(({ to, label, labelKey, Icon, fbIcon, premium }) => ({ to, label, labelKey, icon: Icon, fbIcon, premium })),
}));

// Flatten all More items for active-state detection.
export const ALL_MORE_ITEMS = MORE_GROUPS.flatMap((g) => g.items);