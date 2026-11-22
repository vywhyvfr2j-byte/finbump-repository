import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Trash2, Plus, Copy } from 'lucide-react';
import { generateAccessCode } from '@/lib/accessCode';
import { optimisticWrite } from '@/lib/optimisticWrite';

export default function AccessCodeManager() {
  const { t } = useI18n();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const { toast } = useToast();

  const load = async () => {
    try {
      const list = await base44.entities.AccessCode.list('-created_date');
      setCodes(list);
    } catch (e) {
      console.error('AccessCode load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // The new code shows in the list the instant Generate is tapped; the record is
  // written behind it, and a failure takes the row back out and says so.
  const create = () => {
    const code = generateAccessCode();
    const labelValue = label.trim() || undefined;
    const temp = { id: 'tmp-' + Date.now(), code, label: labelValue };
    setLabel('');
    toast({ title: 'Code created', description: code });
    optimisticWrite({
      setItems: setCodes,
      prev: codes,
      next: [temp, ...codes],
      write: () => base44.entities.AccessCode.create({ code, label: labelValue }),
      onSuccess: (created) => setCodes((list) => list.map((c) => (c.id === temp.id ? created : c))),
      onError: () => toast({ title: 'Could not create code', variant: 'destructive' }),
    });
  };

  const remove = (id) => {
    optimisticWrite({
      setItems: setCodes,
      prev: codes,
      next: codes.filter((c) => c.id !== id),
      write: () => base44.entities.AccessCode.delete(id),
      onSuccess: () => toast({ title: 'Code deleted' }),
      onError: () => toast({ title: 'Could not delete', variant: 'destructive' }),
    });
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(code);
    toast({ title: 'Copied', description: code });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div>
        <p className="font-display text-base font-semibold">Access codes</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t('app.invitePeople')}</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Note (e.g. 'for Sarah')"
          className="flex-1"
        />
        <Button onClick={create} className="rounded-xl">
          <Plus className="size-4" /> Generate
        </Button>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No codes yet. Generate one to invite someone.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold tracking-widest">{c.code}</p>
                {c.label && <p className="text-xs text-muted-foreground truncate">{c.label}</p>}
                {c.usedBy ? (
                  <p className="text-xs text-muted-foreground">Used</p>
                ) : (
                  <p className="text-xs text-primary">Available</p>
                )}
              </div>
              {!c.usedBy && (
                <Button variant="ghost" size="icon" onClick={() => copy(c.code)} className="h-11 w-11">
                  <Copy className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="h-11 w-11 text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}