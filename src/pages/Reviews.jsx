import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2, Reply, Flag, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

function Stars({ value, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? 'fill-accent text-accent' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { t } = useI18n();
  const SOURCES = [
    { value: 'all', label: t('reviews.allSources') },
    { value: 'in_app', label: t('reviews.inApp') },
    { value: 'apple', label: t('reviews.apple') },
    { value: 'google', label: t('reviews.google') },
  ];
  const STATUSES = [
    { value: 'all', label: t('reviews.allStatuses') },
    { value: 'new', label: t('reviews.new') },
    { value: 'responded', label: t('reviews.responded') },
    { value: 'reported', label: t('reviews.reported') },
  ];
  const sourceLabel = (s) => SOURCES.find((x) => x.value === s)?.label || s;
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  // manual entry form
  const [mSource, setMSource] = useState('apple');
  const [mName, setMName] = useState('');
  const [mHandle, setMHandle] = useState('');
  const [mRating, setMRating] = useState(5);
  const [mText, setMText] = useState('');
  const [reportingTo, setReportingTo] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const load = async () => {
    const [me, list, sumRes] = await Promise.all([
      base44.auth.me(),
      base44.entities.AppReview.list('-created_date', 500),
      base44.functions.invoke('get-review-summary', {}),
    ]);
    setUser(me);
    setReviews(list || []);
    setSummary(sumRes.data || sumRes);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isAdmin = user?.role === 'admin';

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
        if (statusFilter !== 'all' && (r.status || 'new') !== statusFilter) return false;
        return true;
      }),
    [reviews, sourceFilter, statusFilter]
  );

  const submitResponse = async (id) => {
    if (!responseText.trim()) return;
    await base44.entities.AppReview.update(id, {
      adminResponse: responseText.trim(),
      respondedAt: new Date().toISOString(),
      status: 'responded',
    });
    setRespondingTo(null);
    setResponseText('');
    await load();
  };

  const submitReport = async (id) => {
    await base44.entities.AppReview.update(id, {
      status: 'reported',
      reportReason: reportReason.trim() || 'Flagged by admin',
    });
    setReportingTo(null);
    setReportReason('');
    await load();
  };

  const remove = async (id) => {
    if (!confirm(t('reviews.deleteConfirm'))) return;
    await base44.entities.AppReview.delete(id);
    await load();
  };

  const addManual = async () => {
    if (!mName.trim() && !mHandle.trim()) return;
    await base44.entities.AppReview.create({
      rating: mRating,
      reviewText: mText.trim(),
      source: mSource,
      reviewerName: mName.trim(),
      storeHandle: mHandle.trim(),
      isManual: true,
      status: 'new',
    });
    setMSource('apple'); setMName(''); setMHandle(''); setMRating(5); setMText('');
    setShowAdd(false);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[100dvh] max-w-[440px] mx-auto">
        <TopNav title={t('reviews.title')} back />
        <div className="px-5 py-20 text-center">
          <p className="text-sm font-medium text-destructive">{t('reviews.adminOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('reviews.title')} subtitle={t('reviews.subtitle')} back />

      <div className="px-5 pt-4 space-y-4">
        <Link to="/analytics" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <ArrowLeft size={14} /> {t('reviews.backToAnalytics')}
        </Link>

        {/* Aggregate stats */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4 shadow-card ks-card-tint">
              <p className="text-xs text-muted-foreground mb-1">{t('reviews.allTimeAvg')}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-display font-bold">{summary.average || '—'}</span>
                <Star size={16} className="fill-accent text-accent" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{summary.total} {summary.total === 1 ? t('reviews.reviewSingle') : t('reviews.reviewPlural')}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <StatRow label="In-app" data={summary.inApp} />
              <StatRow label="Apple" data={summary.apple} />
              <StatRow label="Google" data={summary.google} />
            </div>
          </div>
        )}

        <Button onClick={() => setShowAdd((v) => !v)} variant="outline" className="w-full h-10">
          <Plus size={16} /> {t('reviews.addStoreReview')}
        </Button>

        {showAdd && (
          <div className="rounded-2xl border p-4 space-y-3 shadow-card ks-card-tint">
            <p className="text-sm font-medium">{t('reviews.addRealReview')}</p>
            <Select value={mSource} onValueChange={setMSource}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple App Store</SelectItem>
                <SelectItem value="google">Google Play</SelectItem>
              </SelectContent>
            </Select>
            <Input value={mName} onChange={(e) => setMName(e.target.value)} placeholder={t('reviews.reviewerName')} className="h-11" />
            <Input value={mHandle} onChange={(e) => setMHandle(e.target.value)} placeholder={t('reviews.storeHandle')} className="h-11" />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('reviews.rating')}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setMRating(n)} className="p-0.5">
                    <Star size={24} className={n <= mRating ? 'fill-accent text-accent' : 'text-muted-foreground/40'} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea value={mText} onChange={(e) => setMText(e.target.value)} rows={3} placeholder={t('reviews.reviewText')} />
            <Button onClick={addManual} disabled={!mName.trim() && !mHandle.trim()} className="w-full h-10">
              {t('reviews.saveStoreReview')}
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-10 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Review list */}
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">{t('reviews.noMatch')}</p>
          )}
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs font-medium text-muted-foreground">{sourceLabel(r.source)}</span>
                    {r.isManual && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">{t('reviews.manual')}</span>}
                    {(r.status || 'new') === 'reported' && (
                      <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">{t('reviews.reported')}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    {r.reviewerName || (r.isManual ? r.storeHandle : t('reviews.anonymous'))}
                  </p>
                  {(r.reviewerEmail || (r.isManual && r.storeHandle)) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {r.reviewerEmail || r.storeHandle}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(r.created_date).toLocaleDateString()}
                </span>
              </div>

              {r.reviewText && <p className="text-sm">{r.reviewText}</p>}

              {r.adminResponse && (
                <div className="rounded-lg bg-secondary/60 p-2.5">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{t('reviews.yourResponse')}</p>
                  <p className="text-sm">{r.adminResponse}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {respondingTo === r.id ? (
                  <div className="w-full space-y-2">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={2}
                      placeholder={t('reviews.typeResponse')}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submitResponse(r.id)} disabled={!responseText.trim()}>
                        {t('reviews.sendResponse')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRespondingTo(null); setResponseText(''); }}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : reportingTo === r.id ? (
                  <div className="w-full space-y-2">
                    <Input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder={t('reviews.flagReason')}
                      className="h-9"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => submitReport(r.id)}>
                        {t('reviews.flagReview')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setReportingTo(null); setReportReason(''); }}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setRespondingTo(r.id); setResponseText(r.adminResponse || ''); }}>
                      <Reply size={14} /> {r.adminResponse ? t('reviews.editResponse') : t('reviews.respond')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReportingTo(r.id)}>
                      <Flag size={14} /> {t('reviews.report')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, data }) {
  if (!data || !data.count) return <p className="text-xs text-muted-foreground">{label}: —</p>;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{data.average} ★ ({data.count})</span>
    </div>
  );
}