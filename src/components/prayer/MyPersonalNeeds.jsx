import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Send, Users, HandHeart, Heart, Sparkles, Layers, Pencil } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

const MAX_CHARS = 40;
const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function isExpired(endDate) {
  if (!endDate) return false;
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

function isUpcoming(startDate) {
  if (!startDate) return false;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Date.now() < start.getTime();
}

export default function MyPersonalNeeds({ initialCategory = 'all' }) {
  const { t } = useI18n();
  const { personalNeeds, people, addPersonalNeed, deletePersonalNeed } = useKeepsake();
  const { toast } = useToast();

  const CATEGORIES = [
    {
      value: 'prayer',
      label: t('prayer.tab.prayer'),
      icon: HandHeart,
      singular: t('personalNeeds.prayerRequest'),
      heading: t('personalNeeds.myPrayerRequests'),
      blurb: t('personalNeeds.prayerBlurb'),
      placeholder: t('personalNeeds.prayerPlaceholder'),
      empty: t('personalNeeds.prayerEmpty'),
    },
    {
      value: 'health',
      label: t('prayer.tab.health'),
      icon: Heart,
      singular: t('personalNeeds.healthNeed'),
      heading: t('personalNeeds.myHealthNeeds'),
      blurb: t('personalNeeds.healthBlurb'),
      placeholder: t('personalNeeds.healthPlaceholder'),
      empty: t('personalNeeds.healthEmpty'),
    },
    {
      value: 'other',
      label: t('prayer.tab.other'),
      icon: Sparkles,
      singular: t('personalNeeds.personalNeed'),
      heading: t('personalNeeds.myOtherNeeds'),
      blurb: t('personalNeeds.otherBlurb'),
      placeholder: t('personalNeeds.otherPlaceholder'),
      empty: t('personalNeeds.otherEmpty'),
    },
  ];

  const FILTERS = [
    { value: 'all', label: t('personalNeeds.all'), icon: Layers },
    ...CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon })),
  ];
  const [filter, setFilter] = useState(initialCategory); // 'all' | 'prayer' | 'health' | 'other'
  const [formCategory, setFormCategory] = useState('prayer');
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [recipientId, setRecipientId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  const partner = people.find((p) => p.relation === 'partner');
  const otherConnections = people.filter((p) => p.relation !== 'partner');
  const activeCat = filter === 'all' ? formCategory : filter;
  const meta = CATEGORIES.find((c) => c.value === activeCat);

  const defaultEndDate = () => {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() + DEFAULT_DAYS);
    return start.toISOString().slice(0, 10);
  };

  const maxEndDate = () => {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() + MAX_DAYS);
    return start.toISOString().slice(0, 10);
  };

  const resetForm = () => {
    setDescription('');
    setRecipientId('all');
    setStartDate('');
    setEndDate('');
    setAdding(false);
    setEditingId(null);
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setDescription(r.description || '');
    setRecipientId(r.recipientId || 'all');
    setStartDate(r.startDate || '');
    setEndDate(r.endDate || '');
    if (r.category) setFormCategory(r.category);
    setFilter('all');
    setAdding(true);
  };

  const handleAdd = () => {
    const desc = description.trim();
    if (!desc) {
      toast({ title: t('personalNeeds.addShortDesc'), variant: 'destructive' });
      return;
    }
    if (desc.length > MAX_CHARS) {
      toast({ title: t('personalNeeds.keepUnderChars', { n: MAX_CHARS }), variant: 'destructive' });
      return;
    }

    const category = activeCat;
    const start = startDate || new Date().toISOString().slice(0, 10);
    let end = endDate || defaultEndDate();

    const max = maxEndDate();
    if (end > max) {
      end = max;
      toast({ title: t('personalNeeds.endDateCapped', { n: MAX_DAYS }) });
    }

    const allPeople = [partner, ...otherConnections].filter(Boolean);
    const recipient = recipientId === 'all' ? null : allPeople.find((c) => c.id === recipientId);

    addPersonalNeed({
      description: desc,
      category,
      recipientId: recipientId === 'all' ? '' : recipientId,
      recipientName: recipient ? recipient.name : '',
      startDate: start,
      endDate: end,
      shared: recipientId === 'all',
    });
    if (editingId) deletePersonalNeed(editingId);

    resetForm();
  };

  const switchFilter = (f) => {
    resetForm();
    setFilter(f);
  };

  const needsFor = (cat) => personalNeeds.filter((r) => (r.category || 'prayer') === cat);
  const activeFor = (cat) => needsFor(cat).filter((r) => !isExpired(r.endDate));
  const expiredFor = (cat) => needsFor(cat).filter((r) => isExpired(r.endDate));

  const renderNeed = (r) => {
    const upcoming = isUpcoming(r.startDate);
    return (
      <div
        key={r.id}
        className={`rounded-2xl border p-4 ${
          upcoming ? 'border-border bg-muted/40' : 'border-primary/30 bg-primary/5'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{r.description}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              {r.recipientId ? (
                <span className="flex items-center gap-1"><Send size={11} /> {t('personalNeeds.toName', { name: r.recipientName })}</span>
              ) : (
                <span className="flex items-center gap-1"><Users size={11} /> {t('personalNeeds.allSyncedBadge')}</span>
              )}
              <span>·</span>
              <span>{formatDate(r.startDate)} → {formatDate(r.endDate)}</span>
              {upcoming && <span className="text-muted-foreground/70">· {t('personalNeeds.startsSoon')}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => startEdit(r)}
              className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => deletePersonalNeed(r.id)}
              className="flex items-center justify-center w-11 h-11 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={t('personalNeeds.delete')}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExpired = (r) => (
    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground truncate">{r.description}</p>
        <p className="text-[11px] text-muted-foreground/70">{t('personalNeeds.ended', { date: formatDate(r.endDate) })}</p>
      </div>
      <button
        onClick={() => deletePersonalNeed(r.id)}
        className="flex items-center justify-center w-11 h-11 rounded-full text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        aria-label={t('personalNeeds.delete')}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  const anyActiveInAll = CATEGORIES.some((c) => activeFor(c.value).length > 0);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-1.5">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => switchFilter(f.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Icon size={15} /> {f.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-1">
        {filter === 'all' ? (
          <>
            <p className="text-sm font-medium">{t('personalNeeds.allMyNeeds')}</p>
            <p className="text-xs text-muted-foreground">{t('personalNeeds.allMyNeedsDesc')}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{meta.heading}</p>
            <p className="text-xs text-muted-foreground">{meta.blurb}</p>
          </>
        )}
      </div>

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
        >
          <Plus size={16} /> {filter === 'all' ? t('personalNeeds.addA') : meta.singular}
        </button>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          {filter === 'all' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('personalNeeds.category')}</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2"><Icon size={14} /> {c.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">{t('personalNeeds.description')}</label>
              <span className={`text-[11px] ${description.length > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                {description.length}/{MAX_CHARS}
              </span>
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              placeholder={meta.placeholder}
              className="h-11"
              maxLength={MAX_CHARS}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('personalNeeds.sendTo')}</label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2"><Users size={14} /> {t('personalNeeds.allSynced')}</span>
                </SelectItem>
                {partner && (
                  <>
                    <SelectItem value="__sep1" disabled>{t('personalNeeds.partnerSep')}</SelectItem>
                    <SelectItem value={partner.id}>
                      <span className="flex items-center gap-2"><Send size={13} /> {partner.name}</span>
                    </SelectItem>
                  </>
                )}
                {otherConnections.length > 0 && (
                  <>
                    <SelectItem value="__sep2" disabled>{t('personalNeeds.connectionsSep')}</SelectItem>
                    {otherConnections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2"><Send size={13} /> {c.name}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {recipientId === 'all'
                ? t('personalNeeds.allSyncedHint')
                : t('personalNeeds.directHint')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('personalNeeds.startDate')}</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('personalNeeds.endDate')}</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 10)}
                max={maxEndDate()}
                className="h-11"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('personalNeeds.dateHint')}
          </p>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!description.trim()} className="flex-1 h-11 rounded-xl">
              {editingId ? 'Update' : t('personalNeeds.saveType', { type: meta.singular })}
            </Button>
            <Button onClick={resetForm} variant="outline" className="h-11 rounded-xl px-4">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {filter === 'all' ? (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = activeFor(cat.value);
            const expired = expiredFor(cat.value);
            if (items.length === 0 && expired.length === 0) return null;
            const Icon = cat.icon;
            return (
              <div key={cat.value} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                  {items.length > 0 && <span className="text-xs text-muted-foreground/70">{items.length}</span>}
                </div>
                {items.length > 0 && (
                  <div className="space-y-2.5">
                    {items.map(renderNeed)}
                  </div>
                )}
                {expired.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">{t('personalNeeds.expired')}</p>
                    {expired.map(renderExpired)}
                  </div>
                )}
              </div>
            );
          })}
          {!anyActiveInAll && !adding && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <p className="font-display text-base font-semibold mb-1">{t('personalNeeds.noActiveYet')}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t('personalNeeds.noActiveYetDesc')}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {activeFor(filter).length === 0 && !adding && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <p className="font-display text-base font-semibold mb-1">{t('personalNeeds.noActiveCategory', { category: meta.label.toLowerCase() })}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{meta.empty}</p>
            </div>
          )}
          {activeFor(filter).length > 0 && (
            <div className="space-y-2.5">
              {activeFor(filter).map(renderNeed)}
            </div>
          )}
          {expiredFor(filter).length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{t('personalNeeds.expired')}</p>
              {expiredFor(filter).map(renderExpired)}
            </div>
          )}
        </>
      )}
    </div>
  );
}