import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveTab, setActiveTab, syncTabLocation, tabForPath } from '@/lib/tabStacks';

// Keeps every tab's own stack in step with the router, everywhere in the app —
// not just while the bottom bar is on screen. Mounted once inside the router.
export default function TabStacksSync() {
  const location = useLocation();

  useEffect(() => {
    const tab = tabForPath(location.pathname) || getActiveTab(location.pathname);
    setActiveTab(tab);
    syncTabLocation(tab, location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}