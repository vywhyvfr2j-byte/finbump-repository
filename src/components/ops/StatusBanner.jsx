import React, { useContext } from 'react';
import { useAppHealth } from '@/lib/AppHealthContext';
import { KeepsakeContext } from '@/lib/keepsakeStore';
import { WifiOff, Info, AlertTriangle, AlertCircle } from 'lucide-react';

// Shows a server-controlled status banner (pushed from the admin Ops Control
// Panel) and/or an offline indicator when the backend can't be reached.
// Never shows a blank screen — always tells the user what's happening.
// Reads offline state from BOTH the AppConfig fetch (AppHealthContext) and the
// entity-data load (keepsakeStore) so a partial outage is still surfaced.
// Uses raw context (not useKeepsake) so it never throws on public pages.
export default function StatusBanner() {
  const { config, isOffline: configOffline } = useAppHealth();
  const keepsakeCtx = useContext(KeepsakeContext);
  const isOffline = configOffline || !!keepsakeCtx?.isOffline;

  if (isOffline) {
    return (
      <div className="mx-5 mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2 text-amber-800 text-xs">
        <WifiOff size={14} className="shrink-0" />
        <span>You're offline. Showing saved data — your changes will sync when you're back online.</span>
      </div>
    );
  }

  if (!config.statusMessage) return null;

  const level = config.statusLevel || 'info';
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };
  const Icon = { info: Info, warning: AlertTriangle, critical: AlertCircle }[level] || Info;

  return (
    <div className={`mx-5 mt-2 rounded-xl border px-3 py-2 flex items-center gap-2 text-xs ${styles[level]}`}>
      <Icon size={14} className="shrink-0" />
      <span>{config.statusMessage}</span>
    </div>
  );
}