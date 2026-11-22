// Each bottom tab keeps its own navigation stack. Walking deeper inside a tab
// pushes onto that tab's stack only; switching tabs leaves every other stack
// untouched, and coming back reopens the page that tab was showing. Tapping the
// tab you are already in pops its own stack back to the tab's root page.
import { PRIMARY_TABS, ALL_MORE_ITEMS } from '@/lib/navItems';

export const TAB_ROOTS = PRIMARY_TABS.map((tab) => tab.to);

// Explore owns the hub plus every destination listed on it.
const MORE_ROUTES = ALL_MORE_ITEMS.map((item) => item.to);

function normalize(pathname) {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

// The tab a path belongs to — including pages that live inside a tab, such as
// /acts/123, /groups/abc or /meals/xyz, and every Explore destination.
export function tabForPath(pathname) {
  const path = normalize(pathname || '/');

  const root = TAB_ROOTS.find((r) => (r === '/' ? path === '/' : path === r));
  if (root) return root;

  if (path.startsWith('/acts/')) return '/acts';
  if (path.startsWith('/profile/')) return '/profile';
  if (path.startsWith('/calendar/')) return '/calendar';
  if (path === '/find-it' || path.startsWith('/find-it/')) return '/find-it';
  if (MORE_ROUTES.some((r) => path === r || path.startsWith(`${r}/`))) return '/find-it';

  return null;
}

// tab root -> ordered paths visited inside that tab (last = page on screen)
const stacks = new Map();
let activeTab = null;

export function getActiveTab(pathname) {
  return tabForPath(pathname) || activeTab || '/';
}

export function setActiveTab(tab) {
  activeTab = tab;
}

export function getStack(tab) {
  return stacks.get(tab) || [];
}

// The page a tab was last showing, or null if it has not been visited yet.
export function recallTabPlace(tab) {
  const stack = stacks.get(tab);
  return stack && stack.length ? stack[stack.length - 1] : null;
}

export function rememberTabPlace(tab, path) {
  if (!tab || !path) return;
  const stack = stacks.get(tab) || [];
  if (stack[stack.length - 1] !== path) stack.push(path);
  stacks.set(tab, stack);
}

// Called on every location change so a tab's stack follows both directions:
// moving forward into a new page pushes, while going back (or being sent to a
// page already in this tab) trims the stack back to that page.
export function syncTabLocation(tab, path) {
  if (!tab || !path) return;
  const stack = stacks.get(tab) || [];
  const top = stack[stack.length - 1];
  if (top === path) return;

  const seenAt = stack.lastIndexOf(path);
  if (seenAt !== -1) stack.length = seenAt + 1;
  else stack.push(path);

  stacks.set(tab, stack);
}

// Tapping the active tab clears everything it had opened, leaving its root.
export function resetTabStack(tab, path) {
  if (!tab) return;
  stacks.set(tab, [path || tab]);
}