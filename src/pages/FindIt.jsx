import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysUntil, formatDate, nextEventDate, buildPersonDateEntries } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarPlus, X, Sparkles, List, Calendar, Bell, BellOff, Trash2, CalendarCheck, Heart, Mail } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import MonthCalendar from '@/components/events/MonthCalendar';
import AppreciationCalendarView from '@/components/home/AppreciationCalendarView';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useNavigate } from 'react-router-dom';
import { cardBuilderLink, EVENT_OCCASION, stripEventName } from '@/lib/cardBuilderLink';
import { useI18n } from '@/lib/i18n/I18nContext';

const EVENT_ICONS = {
  birthday: '🎂',
  anniversary: '💍',
  holiday: '🎉',
  custom: '📌',
  trip: '✈️',
};

const RELATION_KEYS = [
  { key: 'partner', labelKey: 'relation.partner', emoji: '💍' },
  { key: 'kids', labelKey: 'relation.kids', emoji: '🧒' },
  { key: 'siblings', labelKey: 'relation.siblings', emoji: '🧑‍🤝‍🧑' },
  { key: 'parents', labelKey: 'relation.parents', emoji: '👴' },
  { key: 'other', labelKey: 'relation.other', emoji: '🙂' },
];

export default function FindIt() {
  useFeatureTracking('find_it');
  // Trips load lazily, so the calendar asks for them itself — without this the
  // trip markers only show up after visiting the trip planner in that session.
  useEnsureEntities(['trips']);
  const navigate = useNavigate();
  const { t } = useI18n();
  const RELATIONS = RELATION_KEYS.map((r) => ({ ...r, label: t(r.labelKey) }));
  const { events, addEvent, deleteEvent, milestones, completeEvent, people, pets, trips, profile } = useKeepsake();
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState('calendar');
  const [hideCompleted, setHideCompleted] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRelation, setNewRelation] = useState('partner');
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderDaysStr, setReminderDaysStr] = useState('30,7,3');
  const [meals, setMeals] = useState([]);

  // Group meals are their own entity, so load the ones with a date for the
  // calendar. Cancelled meals are left off.
  useEffect(() => {
    let cancelled = false;
    base44.entities.Meal.list('-created_date')
      .then((rows) => {
        if (!cancelled) setMeals((rows || []).filter((m) => m.status !== 'cancelled'));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const personDates = useMemo(() => buildPersonDateEntries(profile, people, events), [profile, people, events]);
  const sorted = useMemo(() => {
    const resolvePerson = (name) => {
      const stripped = (name || '').replace(/'s (Birthday|Anniversary|Gotcha Day).*$/i, '').trim().toLowerCase();
      if (!stripped) return null;
      let person = people.find((p) =>
        (p.name || '').toLowerCase() === stripped ||
        (p.preferredName || '').toLowerCase() === stripped
      );
      if (person) return person;
      person = people.find((p) =>
        (p.name && stripped.startsWith(p.name.toLowerCase())) ||
        (p.preferredName && stripped.startsWith(p.preferredName.toLowerCase()))
      );
      return person || null;
    };
    const seen = new Set();
    const deduped = [...personDates, ...events].filter((e) => {
      const person = resolvePerson(e.name);
      const key = person ? `${person.id}-${e.type}` : `${(e.name || '').toLowerCase()}-${e.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.sort(
      (a, b) => daysUntil(nextEventDate(a.date, a.type)) - daysUntil(nextEventDate(b.date, b.type))
    );
  }, [events, personDates, people]);

  const visibleList = hideCompleted ? sorted.filter((e) => !e.lastCompletedAt) : sorted;

  const handleAdd = () => {
    if (!newName.trim() || !newDate) return;
    const reminderDays = reminderOn
      ? reminderDaysStr.split(',').map((d) => Number(d.trim())).filter((d) => !Number.isNaN(d))
      : [];
    addEvent({ name: newName.trim(), date: new Date(newDate + 'T00:00:00').toISOString(), type: 'custom', note: '', relation: newRelation, reminderDays });
    setNewName('');
    setNewDate('');
    setNewRelation('partner');
    setReminderOn(true);
    setReminderDaysStr('30,7,3');
    setAdding(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        back={false}
        right={
          <button onClick={() => setAdding(true)} className="flex items-center justify-center w-11 h-11 rounded-full text-primary hover:bg-secondary/60 transition-colors" aria-label={t('calendar.addEventAria')}>
            <CalendarPlus size={20} />
          </button>
        }
      />

      <div className="px-5 mt-2 mb-4">
        <div className="inline-flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <List size={14} /> {t('calendar.list')}
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'calendar' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Calendar size={14} /> {t('calendar.calendar')}
          </button>
          <button
            onClick={() => setView('appreciation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'appreciation' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Heart size={14} /> {t('calendar.appreciation')}
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="px-5 mb-6">
          <MonthCalendar events={events} milestones={milestones} people={people} pets={pets} profile={profile} trips={trips} meals={meals} />
        </div>
      )}

      {view === 'appreciation' && (
        <div className="mt-2 mb-6">
          <AppreciationCalendarView />
        </div>
      )}

      {view === 'list' && (
      <div className="px-5 mt-2">
        <div className="rounded-2xl border px-4 py-4 shadow-card space-y-3 ks-card-tint">
        <label className="flex items-center justify-between gap-3 py-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck size={14} /> {t('calendar.upcomingOnly')}
          </span>
          <Switch checked={hideCompleted} onCheckedChange={setHideCompleted} />
        </label>
        {visibleList.map((event) => {
          const eventDate = nextEventDate(event.date, event.type);
          const days = daysUntil(eventDate);
          const isSoon = days <= 30;
          const isPast = days < 0;
          return (
            <div
              key={event.id}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <button
                onClick={() => setSelected(event)}
                className="flex items-center gap-4 flex-1 min-w-0 text-left"
              >
                <div className={`w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0 ${isPast ? 'opacity-60' : ''}`}>
                  {EVENT_ICONS[event.type] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[15px] truncate ${isPast ? 'line-through text-muted-foreground' : ''}`}>{event.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(eventDate)}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {event.relation && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {RELATIONS.find((r) => r.key === event.relation)?.label || event.relation}
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {t('calendar.passed')}
                      </span>
                    )}
                    {Array.isArray(event.reminderDays) && event.reminderDays.length === 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        <BellOff size={10} /> {t('calendar.noReminder')}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {isPast && !event._fromProfile ? (
                <button
                  onClick={() => setConfirmRemoveId(event.id)}
                  aria-label={t('calendar.removeEventAria', { name: event.name })}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-destructive"
                >
                  <Trash2 size={20} />
                </button>
              ) : isPast ? (
                <div className="shrink-0 w-11" />
              ) : (
                <div className="text-right">
                  <p className={`font-display text-xl font-semibold ${isSoon ? 'text-primary' : 'text-foreground'}`}>
                    {days}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('calendar.days')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm max-w-[440px] mx-auto" onClick={() => setAdding(false)}>
          <div className="w-full bg-card rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">{t('calendar.addEvent')}</h3>
              <button onClick={() => setAdding(false)} aria-label={t('calendar.close')}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('calendar.eventName')} aria-label={t('calendar.eventName')} className="h-12" />
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label={t('calendar.eventDate')} className="h-12" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('calendar.whoFor')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {RELATIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setNewRelation(r.key)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${newRelation === r.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                    >
                      {r.emoji} {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-3.5 py-2.5">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {reminderOn ? <Bell size={15} /> : <BellOff size={15} />} {t('calendar.remindMe')}
                </span>
                <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
              </div>
              {reminderOn && (
                <Input
                  value={reminderDaysStr}
                  onChange={(e) => setReminderDaysStr(e.target.value)}
                  placeholder={t('calendar.daysBefore')}
                  aria-label={t('calendar.daysBeforeAria')}
                  className="h-12"
                />
              )}
              <Button onClick={handleAdd} className="w-full h-12 rounded-2xl">
                {t('calendar.addEventBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm max-w-[440px] mx-auto" onClick={() => setSelected(null)}>
          <div className="w-full bg-card rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{EVENT_ICONS[selected.type] || '📌'}</span>
              <button onClick={() => setSelected(null)} aria-label={t('calendar.close')}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <h3 className="font-display text-2xl font-semibold">{selected.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">{formatDate(nextEventDate(selected.date, selected.type))}</p>
            {selected.relation && (
              <span className="inline-block mb-2 text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {RELATIONS.find((r) => r.key === selected.relation)?.label || selected.relation}
              </span>
            )}
            <p className="font-display text-lg font-semibold text-primary mb-4">
              {daysUntil(nextEventDate(selected.date, selected.type))} {t('calendar.daysToGo')}
            </p>
            {Array.isArray(selected.reminderDays) && selected.reminderDays.length === 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 rounded-xl px-3 py-2 mb-3">
                <BellOff size={14} /> {t('calendar.noScheduledReminder')}
              </div>
            )}
            {selected.note && (
              <div className="bg-secondary/60 rounded-2xl p-4 flex gap-2.5">
                <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.note}</p>
              </div>
            )}
            {selected.lastCompletedAt && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-500/10 rounded-xl px-3 py-2 mb-3">
                <CalendarCheck size={14} /> {t('calendar.lastMarkedComplete', { date: formatDate(selected.lastCompletedAt) })}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl mb-2"
              onClick={() => {
                const person = people.find((p) => p.name === stripEventName(selected.name));
                navigate(cardBuilderLink({
                  personId: person?.id,
                  personName: person?.name || stripEventName(selected.name),
                  occasion: EVENT_OCCASION[selected.type],
                }));
              }}
            >
              <Mail size={16} /> {t('calendar.sendCard')}
            </Button>
            {!selected._fromProfile && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl mb-2"
              onClick={() => {
                completeEvent(selected.id);
                setSelected({ ...selected, lastCompletedAt: new Date().toISOString() });
              }}
            >
              <CalendarCheck size={16} /> {selected.lastCompletedAt ? t('calendar.markCompleteAgain') : t('calendar.markAsComplete')}
            </Button>
            )}
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {confirmRemoveId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm max-w-[440px] mx-auto"
          onClick={() => setConfirmRemoveId(null)}
        >
          <div className="w-full bg-card rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">{t('calendar.removePassedEvent')}</h3>
              <button onClick={() => setConfirmRemoveId(null)} aria-label={t('calendar.close')}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              {t('calendar.removeEventDesc')}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmRemoveId(null)}>
                {t('calendar.keepIt')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11"
                onClick={() => {
                  deleteEvent(confirmRemoveId);
                  setConfirmRemoveId(null);
                }}
              >
                {t('calendar.remove')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}