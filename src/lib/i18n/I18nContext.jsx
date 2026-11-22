import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { translations } from './translations';
import { extendedTranslations } from './translationsExtended';

// Merge base + extended translations so every page can look up any key from a
// single dictionary without caring which file it lives in.
const mergedTranslations = {
  en: { ...translations.en, ...extendedTranslations.en },
  es: { ...translations.es, ...extendedTranslations.es },
};

const STORAGE_KEY = 'keepsake_language';
const DEFAULT_LANGUAGE = 'en';

// Cache the context on globalThis so HMR re-evaluations reuse the SAME
// context object (same pattern as keepsakeStore). Without this, HMR creates
// a new I18nContext while already-mounted consumers still hold the old
// reference, causing "useI18n must be used within I18nProvider".
export const I18nContext = globalThis.__I18N_CONTEXT__ ??= createContext(null);

// The signed-in user's OWN preference row. Listing the whole collection and
// taking the first entry can hand back another account's settings — and the
// language picker then writes that row back — so resolve the user first, then
// ask for their row only. Past 5,000 rows the unfiltered list also truncates,
// which could miss the user's own entry entirely.
async function loadMyPreferences() {
  const me = await base44.auth.me().catch(() => null);
  if (!me?.id) return [];
  const rows = await base44.entities.UserPreference.filter(
    { created_by_id: me.id },
    '-created_date',
    1
  );
  return Array.isArray(rows) ? rows : [];
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  // Keep <html lang> in sync for accessibility / screen readers.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Sync from the user's saved preference on mount (enables cross-device
  // persistence). Non-blocking — if the call fails (unauthenticated, offline)
  // the localStorage value from init is used.
  useEffect(() => {
    let cancelled = false;
    loadMyPreferences()
      .then((prefs) => {
        if (!cancelled && prefs[0]?.language) {
          setLanguageState(prefs[0].language);
          try { localStorage.setItem(STORAGE_KEY, prefs[0].language); } catch {}
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    document.documentElement.lang = lang;
    // Persist to UserPreference (fire-and-forget). Safe to skip if the user
    // isn't authenticated — localStorage already holds the choice.
    loadMyPreferences()
      .then((prefs) => {
        if (prefs[0]?.id) {
          return base44.entities.UserPreference.update(prefs[0].id, { language: lang });
        }
      })
      .catch(() => {});
  }, []);

  // t(key, vars?) — looks up the key in the active language, falls back to
  // English, then to the raw key. Supports {var} interpolation.
  const t = useCallback((key, vars) => {
    const dict = mergedTranslations[language] || mergedTranslations[DEFAULT_LANGUAGE];
    let str = dict[key] || mergedTranslations[DEFAULT_LANGUAGE][key] || key;
    if (vars && typeof str === 'string') {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return str;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(globalThis.__I18N_CONTEXT__ ?? I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

// Same HMR rationale as keepsakeStore: a context module cannot be safely
// hot-swapped without breaking already-mounted consumers.
if (import.meta.hot) {
  import.meta.hot.decline();
}