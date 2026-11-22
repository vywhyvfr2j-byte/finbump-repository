import React, { useMemo, useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysUntil, formatDate, nextEventDate, buildPersonDateEntries } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarPlus, X, Sparkles, List, Calendar, Bell, BellOff, Trash2, CalendarCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import MonthCalendar from '@/components/events/MonthCalendar';

const EVENT_ICONS = {
  birthday: '🎂',
  anniversary: '💍',
  holiday: '🎉',
  custom: '📌',
  trip: '✈️',
};

const RELATIONS = [
  { key: 'partner', label: 'Partner', emoji: '💍' },
  { key: 'kids', label: 'Kids', emoji: '🧒' },
  { key: 'siblings', label: 'Siblings', emoji: '🧑‍🤝‍🧑' },
  { key: 'parents', label: 'Parents', emoji: '👴' },
  { key: 'other', label: 'Other', emoji: '🙂' },
];

export default function Events() {
  const { events, addEvent, deleteEvent, milestones, history, completeEvent, acts, people, trips, profile } = useKeepsake();
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

  const urlParams = new URLSearchParams(window.location.search);
  const relationFilter = urlParams.get('relation');
  const searchQuery = urlParams.get('q');

  const personDates = useMemo(() => buildPersonDateEntries(profile, people, events), [profile, people, events]);
  const sorted = useMemo(() => {
    const list = relationFilter ? events.filter((e) => e.relation === relationFilter) : events;
    const extra = relationFilter ? personDates.filter((e) => e.relation === relationFilter) : personDates;
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
    const deduped = [...extra, ...list].filter((e) => {
      const person = resolvePerson(e.name);
      const key = person ? `${person.id}-${e.type}` : `${(e.name || '').toLowerCase()}-${e.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.sort((a, b) => daysUntil(nextEventDate(a.date, a.type)) - daysUntil(nextEventDate(b.date, b.type)));
  }, [events, relationFilter, personDates, people]);

  const visibleList = hideCompleted ? sorted.filter((e) => !e.lastCompletedAt) : sorted;

  useEffect(() => {
    if (!searchQuery) return;
    const match = events.find((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) setSelected(match);
  }, [searchQuery, events]);

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
        title="Upcoming"
        back
        subtitle={relationFilter ? RELATIONS.find((r) => r.key === relationFilter)?.label || 'Events' : 'Events'}
        right={
          <button onClick={() => setAdding(true)} className="text-primary">
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
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'calendar' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Calendar size={14} /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="px-5 mb-6">
          <MonthCalendar events={events} milestones={milestones} history={history} acts={acts} people={people} trips={trips} />
        </div>
      )}

      {view === 'list' && (
      <div className="px-5 mt-2 space-y-3">
        <label className="flex items-center justify-between gap-3 py-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck size={14} /> Upcoming only
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
                        Passed
                      </span>
                    )}
                    {Array.isArray(event.reminderDays) && event.reminderDays.length === 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        <BellOff size={10} /> No reminder
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {isPast && !event._fromProfile ? (
                <button
                  onClick={() => setConfirmRemoveId(event.id)}
                  aria-label={`Remove ${event.name}`}
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
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">days</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm max-w-[440px] mx-auto" onClick={() => setAdding(false)}>
          <div className="w-full bg-card rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Add an event</h3>
              <button onClick={() => setAdding(false)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Event name" className="h-12" />
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-12" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Who is this for?</p>
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
                  {reminderOn ? <Bell size={15} /> : <BellOff size={15} />} Remind me
                </span>
                <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
              </div>
              {reminderOn && (
                <Input
                  value={reminderDaysStr}
                  onChange={(e) => setReminderDaysStr(e.target.value)}
                  placeholder="Days before, e.g. 30,7,3"
                  className="h-12"
                />
              )}
              <Button onClick={handleAdd} className="w-full h-12 rounded-2xl">
                Add event
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
              <button onClick={() => setSelected(null)}>
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
              {daysUntil(nextEventDate(selected.date, selected.type))} days to go
            </p>
            {Array.isArray(selected.reminderDays) && selected.reminderDays.length === 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 rounded-xl px-3 py-2 mb-3">
                <BellOff size={14} /> You won't get a scheduled reminder for this.
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
                <CalendarCheck size={14} /> Last marked complete {formatDate(selected.lastCompletedAt)}
              </div>
            )}
            {!selected._fromProfile && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl mb-2"
              onClick={() => {
                completeEvent(selected.id);
                setSelected({ ...selected, lastCompletedAt: new Date().toISOString() });
              }}
            >
              <CalendarCheck size={16} /> {selected.lastCompletedAt ? 'Mark complete again' : 'Mark as complete'}
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
              <h3 className="font-display text-lg font-semibold">Remove passed event?</h3>
              <button onClick={() => setConfirmRemoveId(null)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              This removes the event from your upcoming list. You'll need to add it again if you want a reminder next time.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmRemoveId(null)}>
                Keep it
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11"
                onClick={() => {
                  deleteEvent(confirmRemoveId);
                  setConfirmRemoveId(null);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}