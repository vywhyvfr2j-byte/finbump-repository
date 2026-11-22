import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Button } from '@/components/ui/button';
import { Calendar, Upload, Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CalendarImport() {
  const { people, addEvent } = useKeepsake();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState({});
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setCandidates([]);
    setSelected({});
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      const res = await base44.functions.invoke('import-calendar-ics', { file_url: signed_url });
      const cands = res?.data?.candidates || [];
      if (!cands.length) {
        toast({ title: 'No birthdays or anniversaries found', description: 'Export your device calendar as an .ics file and try again.' });
      }
      setCandidates(cands);
      const sel = {};
      cands.forEach((c, i) => { sel[i] = true; });
      setSelected(sel);
    } catch (e) {
      toast({ title: 'Could not read calendar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const importSelected = async () => {
    setImporting(true);
    try {
      const picks = candidates.filter((_, i) => selected[i]);
      for (const c of picks) {
        const match = people.find(
          (p) => p.name.toLowerCase() === c.summary.toLowerCase() ||
            c.summary.toLowerCase().startsWith(p.name.toLowerCase() + "'s")
        );
        addEvent({
          name: c.summary,
          date: c.nextDate,
          type: c.type,
          note: 'Imported from calendar',
          notify: true,
          personId: match ? match.id : '',
        });
      }
      setDone(true);
      setCandidates([]);
      setSelected({});
      toast({ title: `Imported ${picks.length} date${picks.length === 1 ? '' : 's'}`, description: 'They are now in your calendar with reminders on.' });
    } catch (e) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const pickedCount = candidates.filter((_, i) => selected[i]).length;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary shrink-0">
          <Calendar size={16} />
        </div>
        <div>
          <p className="text-sm font-medium">Import from calendar</p>
          <p className="text-xs text-muted-foreground mt-0.5">One tap to pull birthdays and anniversaries from your device calendar (.ics file).</p>
        </div>
      </div>
      <label className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Reading…</> : <><Upload size={16} /> Choose .ics file</>}
        <input type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} disabled={busy} />
      </label>
      {candidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{candidates.length} date{candidates.length === 1 ? '' : 's'} found — uncheck any you do not want.</p>
          {candidates.map((c, i) => (
            <label key={i} className="flex items-center gap-2.5 bg-secondary/50 rounded-xl px-3 py-2">
              <input type="checkbox" checked={!!selected[i]} onChange={(e) => setSelected((s) => ({ ...s, [i]: e.target.checked }))} className="w-4 h-4 accent-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.summary}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{c.type} · {new Date(c.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </label>
          ))}
          <Button onClick={importSelected} disabled={importing} className="w-full h-11 rounded-xl">
            {importing ? <><Loader2 size={16} className="animate-spin" /> Importing…</> : `Import ${pickedCount} date${pickedCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
      {done && <p className="text-xs text-green-600 flex items-center gap-1.5"><Check size={14} /> Imported.</p>}
    </div>
  );
}