import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getActiveTab,
  recallTabPlace,
  resetTabStack,
  setActiveTab,
  tabForPath,
} from '@/lib/tabStacks';

// Returns the handler for the bottom bar. Each tab owns its stack: switching
// tabs resumes the page that tab was left on, and tapping the tab you are
// already in pops that tab's stack back to its root.
export default function useTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (to) => {
      const currentPath = location.pathname + location.search;
      const currentTab = tabForPath(location.pathname) || getActiveTab(location.pathname);

      // Already in this tab: pop its own stack back to the root page (or just
      // back to the top when the root is the page on screen).
      if (currentTab === to) {
        setActiveTab(to);
        if (currentPath === to) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        resetTabStack(to, to);
        navigate(to, { replace: true });
        window.scrollTo({ top: 0 });
        return;
      }

      // Entering another tab reopens the page that tab was left on; its stack
      // is untouched, so every other tab keeps its place in parallel.
      const targetPath = recallTabPlace(to) || to;
      if (targetPath === currentPath) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Swapping the history entry keeps one browser-back step per tab rather
      // than piling a new entry on every switch.
      setActiveTab(to);
      navigate(targetPath, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );
}