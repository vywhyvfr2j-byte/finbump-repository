import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';

// Settings footer: links to Privacy Policy & Terms, plus a one-tap export of
// the user's FinBump data (their local state) — supports GDPR/CCPA data-
// portability alongside the account-deletion flow. Backend-shared records
// (people, trips, media ideas) live server-side and are covered by the export
// via each entity's list endpoint.
export default function SettingsLegal() {
  const state = useKeepsake();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const localBlob = JSON.parse(localStorage.getItem('keepsake_proto_v1') || '{}');
      // Pull the user's shared backend records so the export is complete.
      const [people, movieIdeas, bookIdeas, seriesIdeas, treatIdeas, trips, acts, actCompletions, events, giftIdeas] = await Promise.all([
        import('@/api/base44Client').then((m) => m.base44.entities.Person.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.MovieIdea.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.BookIdea.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.SeriesIdea.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.TreatIdea.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.Trip.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.Act.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.ActCompletion.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.Event.list('-created_date')),
        import('@/api/base44Client').then((m) => m.base44.entities.GiftIdea.list('-created_date')),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        localData: localBlob,
        sharedRecords: { people, movieIdeas, bookIdeas, seriesIdeas, treatIdeas, trips, acts, actCompletions, events, giftIdeas },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keepsake-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Your data was downloaded' });
    } catch (e) {
      toast({ title: 'Export failed', description: e?.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <p className="text-sm font-medium">Data & legal</p>
      <div className="flex flex-col gap-2 text-sm text-primary">
        <Link to="/privacy" className="inline-flex items-center min-h-[44px] -my-2.5 w-fit underline-offset-4 hover:underline">Privacy Policy</Link>
        <Link to="/terms" className="inline-flex items-center min-h-[44px] -my-2.5 w-fit underline-offset-4 hover:underline">Terms of Service</Link>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={exporting} className="w-full h-10 rounded-xl gap-1.5">
        <Download size={15} /> {exporting ? 'Preparing…' : 'Export my data'}
      </Button>
      <div className="pt-1">
        <p className="text-xs font-medium mb-1">Affiliate links</p>
        <AffiliateDisclosure />
      </div>
    </div>
  );
}