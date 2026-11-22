import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';

// Entities to include in the export (user-owned data only — excludes
// platform entities like Base44Purchase, AccessCode, AppConfig).
const ENTITIES = [
  'Act', 'ActCompletion', 'Person', 'Pet', 'Event', 'GiftIdea',
  'Milestone', 'Goal', 'PersonalNote', 'Trip', 'PrayerRequest',
  'FavoriteIdea', 'UserPreference', 'CommLog',
];

export default function DataExport() {
  const { t } = useI18n();
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = {};
      for (const name of ENTITIES) {
        try {
          data[name] = await base44.entities[name].list();
        } catch {
          // Some entities may be empty or restricted — skip silently.
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keepsake-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: 'Your data has been downloaded.' });
    } catch {
      toast({ title: 'Export failed', description: 'Please try again.', variant: 'destructive' });
    }
    setExporting(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Export your data</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('app.downloadData')}
        </p>
      </div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full h-11 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        <Download size={16} />
        {exporting ? 'Exporting…' : 'Download all data'}
      </button>
    </div>
  );
}