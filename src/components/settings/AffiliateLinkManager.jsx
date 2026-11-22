import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { optimisticWrite } from '@/lib/optimisticWrite';

const OCCASIONS = ['birthday', 'anniversary', 'gotcha day', 'prayer support', 'health check-in', 'other'];
const CATEGORIES = ['', 'Funny', 'Romantic', 'Sentimental', 'Serious', 'Age-appropriate', 'Religious', 'Heartfelt'];

// Admin-only manager for occasion-keyed affiliate buy URLs. The builder
// generates a tagged URL in the Amazon Associates (or Etsy/Awin) dashboard,
// pastes it here keyed by occasion + optional tone, and it goes live to every
// user without an app release. Card pickers look these up before falling back
// to the generated search URL.
export default function AffiliateLinkManager() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('birthday');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const { toast } = useToast();

  const load = async () => {
    try {
      const list = await base44.entities.AffiliateLink.list('-created_date');
      setLinks(list);
    } catch (e) {
      console.error('AffiliateLink load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Each of these shows the change in the list at once and writes behind it; a
  // failure restores the previous list and reports what went wrong.
  const add = () => {
    if (!url.trim()) return;
    const payload = {
      occasion: occasion,
      category: category || '',
      url: url.trim(),
      label: label.trim() || undefined,
      active: true,
    };
    const temp = { id: 'tmp-' + Date.now(), ...payload };
    setUrl('');
    setLabel('');
    toast({ title: 'Affiliate link saved' });
    optimisticWrite({
      setItems: setLinks,
      prev: links,
      next: [temp, ...links],
      write: () => base44.entities.AffiliateLink.create(payload),
      onSuccess: (created) => setLinks((list) => list.map((l) => (l.id === temp.id ? created : l))),
      onError: () => toast({ title: 'Could not save link', variant: 'destructive' }),
    });
  };

  const toggle = (l) => {
    optimisticWrite({
      setItems: setLinks,
      prev: links,
      next: links.map((x) => (x.id === l.id ? { ...x, active: !l.active } : x)),
      write: () => base44.entities.AffiliateLink.update(l.id, { active: !l.active }),
      onError: () => toast({ title: 'Could not update', variant: 'destructive' }),
    });
  };

  const remove = (id) => {
    optimisticWrite({
      setItems: setLinks,
      prev: links,
      next: links.filter((l) => l.id !== id),
      write: () => base44.entities.AffiliateLink.delete(id),
      onSuccess: () => toast({ title: 'Link deleted' }),
      onError: () => toast({ title: 'Could not delete', variant: 'destructive' }),
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div>
        <p className="font-display text-base font-semibold">Affiliate buy links</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Paste URLs from each dashboard's link builder, keyed by occasion. They go live to every user instantly — no app release needed.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Occasion" /></SelectTrigger>
            <SelectContent>
              {OCCASIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category || '__none__'} onValueChange={(v) => setCategory(v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Tone (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Default for occasion</SelectItem>
              {CATEGORIES.filter(Boolean).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Affiliate URL from dashboard link builder" className="h-9" />
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Button label (optional)" className="h-9" />
        <Button onClick={add} disabled={!url.trim()} className="w-full rounded-xl h-9">
          <Plus className="size-4" /> Save link
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground">No links yet. Generate one in the Amazon Associates dashboard and paste it above.</p>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">{l.occasion}</span>
                {l.category && <span className="text-xs text-muted-foreground">{l.category}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{l.active === false ? 'Paused' : 'Live'}</span>
                  <Switch checked={l.active !== false} onCheckedChange={() => toggle(l)} aria-label="Toggle active" />
                </div>
              </div>
              {l.label && <p className="text-xs font-medium">{l.label}</p>}
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary truncate">
                <ExternalLink className="size-3 shrink-0" />
                <span className="truncate">{l.url}</span>
              </a>
              <Button variant="ghost" size="icon" onClick={() => remove(l.id)} className="h-11 w-11 text-destructive">
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}