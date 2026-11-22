import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  APP_CONFIG_CACHE_KEY,
  DEFAULT_APP_CONFIG,
  APP_VERSION,
  compareVersions,
  isClientInRollout,
} from '@/lib/appConfig';
import { flushQueue } from '@/lib/writeQueue';

const AppHealthContext = createContext(null);

function loadCachedConfig() {
  try {
    const raw = localStorage.getItem(APP_CONFIG_CACHE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    return { ...DEFAULT_APP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

export function AppHealthProvider({ children }) {
  const [config, setConfig] = useState(loadCachedConfig);
  const [isOffline, setIsOffline] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const configs = await base44.entities.AppConfig.list('-updated_date', 1);
      if (configs.length > 0) {
        const merged = { ...DEFAULT_APP_CONFIG, ...configs[0] };
        setConfig(merged);
        localStorage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify(merged));
      }
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      // Keep last-known-good cached config
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    // Poll every 5 minutes so a kill-switch or status push reaches users fast.
    const interval = setInterval(fetchConfig, 5 * 60 * 1000);
    const onOnline = () => {
      setIsOffline(false);
      fetchConfig();
      flushQueue();
    };
    window.addEventListener('online', onOnline);
    // Re-fetch when the tab becomes visible again.
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchConfig();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchConfig]);

  // Kill switch: returns false if the feature flag is explicitly disabled.
  const isFeatureEnabled = useCallback(
    (featureName) => {
      if (config.featureFlags && config.featureFlags[featureName] === false) return false;
      if (!isClientInRollout(config.rolloutPercentage)) return false;
      return true;
    },
    [config]
  );

  const needsUpgrade = useMemo(
    () => config.minimumVersion ? compareVersions(APP_VERSION, config.minimumVersion) < 0 : false,
    [config.minimumVersion]
  );

  const value = useMemo(
    () => ({ config, isOffline, isFeatureEnabled, needsUpgrade, refetch: fetchConfig }),
    [config, isOffline, isFeatureEnabled, needsUpgrade, fetchConfig]
  );

  return <AppHealthContext.Provider value={value}>{children}</AppHealthContext.Provider>;
}

export function useAppHealth() {
  const ctx = useContext(AppHealthContext);
  if (!ctx) throw new Error('useAppHealth must be used within AppHealthProvider');
  return ctx;
}