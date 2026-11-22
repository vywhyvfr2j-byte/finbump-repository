import React from 'react';
import { useAppHealth } from '@/lib/AppHealthContext';
import { AlertCircle, RefreshCw, Wrench } from 'lucide-react';
import { APP_VERSION } from '@/lib/appConfig';
import { useI18n } from '@/lib/i18n/I18nContext';

// Blocks the app when the server says this build is too old (minimumVersion
// gate) or when maintenance mode is on. Both are server-side toggles the
// admin can flip without an app release — critical for forcing an upgrade
// off a broken build while Apple/Google review the fix.
export default function AppHealthGate({ children }) {
  const { config, needsUpgrade } = useAppHealth();
  const { t } = useI18n();

  if (config.maintenanceMode) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 text-accent-foreground mx-auto mb-4">
            <Wrench size={28} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">Under maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {t('app.underMaintenance')}
          </p>
        </div>
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">Update required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t('app.versionUnsupported', { version: APP_VERSION })}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            <RefreshCw size={16} />
            Check for update
          </button>
        </div>
      </div>
    );
  }

  return children;
}