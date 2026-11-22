import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { formatDate, relativeLast } from '@/lib/keepsakeUtils';
import { Bell, ChevronDown, Clock, Filter, Pencil, X } from 'lucide-react';
import MemoryRefreshPrompt from './MemoryRefreshPrompt';
import TimelineEntryEditor from './TimelineEntryEditor';

const KIND_META = {
  act: { label: 'Acts', emoji: '✅' },
  milestone: { label: 'Milestones', emoji: '🚩' },
  prayer: { label: 'Prayer', emoji: '🤲' },
  health: { label: 'Health', emoji: '❤️' },
  other: { label: 'Other', emoji: '✨' },
  event: { label: 'Events', emoji: '📅' },
  gift: { label: 'Gifts', emoji: '🎁' },
  trip: { label: 'Trips', emoji: '✈️' },
  goal: { label: 'Goals', emoji: '🎯' },
  note: { label: 'Notes', emoji: '📝' },
  comm: { label: 'Messages', emoji: '💬' },
  card: { label: 'Cards', emoji: '💌' },
};

// Color-coded tag per entry kind, so the history can be scanned at a glance.
const KIND_TAG = {
  act: 'bg-rose-500/15 text-rose-700',
  milestone: 'bg-amber-500/15 text-amber-700',
  prayer: 'bg-violet-500/15 text-violet-700',
  health: 'bg-emerald-500/15 text-emerald-700',
  other: 'bg-amber-500/15 text-amber-700',
  event: 'bg-sky-500/15 text-sky-700',
  gift: 'bg-pink-500/15 text-pink-700',
  trip: 'bg-cyan-500/15 text-cyan-700',
  goal: 'bg-green-500/15 text-green-700',
  note: 'bg-slate-500/15 text-slate-700',
  comm: 'bg-indigo-500/15 text-indigo-700',
  card: 'bg-fuchsia-500/15 text-fuchsia-700',
};

// Unified per-contact timeline. Merges every history source already loaded
// in the store (act completions, events, gifts, trips, goals, notes, comm
// logs) into one date-sorted list — no new API calls, no AI, no credits.
// Each entry can spawn a "remind me" memory refresh.
const INITIAL_LIMIT = 50;

export default function ContactTimeline({ personId, personName }) {
  useEnsureEntities(['history', 'personalNotes', 'goals', 'trips', 'commLog']);
  const {
    acts, history, events, giftIdeas, trips, goals, personalNotes, commLog, memoryRefreshes,
    milestones, people, updateMilestone, updatePersonalNote,
  } = useKeepsake();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshTarget, setRefreshTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeKinds, setActiveKinds] = useState(() => new Set(Object.keys(KIND_META)));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Cards aren't part of the central store, so load them locally (with live
  // updates) and merge sent cards into this contact's timeline.
  const [cards, setCards] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const all = await base44.entities.Card.list('-deliveredAt', 200);
        if (!cancelled) setCards(all);
      } catch {}
    };
    load();
    const unsub = base44.entities.Card.subscribe(() => { if (!cancelled) load(); });
    return () => { cancelled = true; unsub?.(); };
  }, []);

  const entries = useMemo(() => {
    const out = [];
    const pid = String(personId);

    // Act completions — join completion → act → personId
    const actMap = new Map(acts.map((a) => [a.id, a]));
    (history || []).forEach((c) => {
      const act = actMap.get(c.actId);
      if (!act) return;
      if (String(act.personId) !== pid) return;
      const cat = act.category && KIND_META[act.category] ? act.category : 'act';
      out.push({
        id: `act-${c.id}`,
        kind: cat,
        label: c.actName || act.name,
        at: c.completedAt,
        emoji: c.emoji || act.emoji || KIND_META[cat].emoji,
        sourceId: c.actId,
      });
    });

    // Events completed
    (events || []).forEach((e) => {
      if (!e.lastCompletedAt) return;
      if (String(e.personId) !== pid) return;
      out.push({ id: `evt-${e.id}`, kind: 'event', label: e.name, at: e.lastCompletedAt, emoji: '📅', sourceId: e.id });
    });

    // Gifts purchased / gifted
    (giftIdeas || []).forEach((g) => {
      if (String(g.personId) !== pid) return;
      if (g.purchasedAt) out.push({ id: `gift-p-${g.id}`, kind: 'gift', label: `Bought: ${g.title}`, at: g.purchasedAt, emoji: '🎁', sourceId: g.id });
      if (g.giftedAt) out.push({ id: `gift-g-${g.id}`, kind: 'gift', label: `Gifted: ${g.title}`, at: g.giftedAt, emoji: '🎁', sourceId: g.id });
    });

    // Trips
    (trips || []).forEach((t) => {
      if (String(t.personId) !== pid) return;
      if (!t.startDate) return;
      out.push({ id: `trip-${t.id}`, kind: 'trip', label: t.name, at: t.startDate, emoji: '✈️', sourceId: t.id });
    });

    // Goals completed
    (goals || []).forEach((g) => {
      if (!g.completedAt) return;
      if (String(g.personId) !== pid) return;
      out.push({ id: `goal-${g.id}`, kind: 'goal', label: g.title, at: g.completedAt, emoji: '🎯', sourceId: g.id });
    });

    // Milestones linked to this contact
    (milestones || []).forEach((m) => {
      if (String(m.personId) !== pid) return;
      if (!m.date) return;
      out.push({ id: `ms-${m.id}`, kind: 'milestone', label: m.title, at: m.date, emoji: '🚩', sourceId: m.id });
    });

    // Personal notes (scoped to this contact)
    (personalNotes || []).forEach((n) => {
      if (String(n.personId) !== pid) return;
      out.push({ id: `note-${n.id}`, kind: 'note', label: n.text?.slice(0, 80) || 'Personal note', at: n.created_date, emoji: '📝', sourceId: n.id });
    });

    // Communication logs (scoped to this contact)
    (commLog || []).forEach((c) => {
      if (String(c.personId) !== pid) return;
      out.push({ id: `comm-${c.id}`, kind: 'comm', label: c.text?.slice(0, 80) || 'Message log', at: c.created_date, emoji: '💬', sourceId: c.id });
    });

    // Cards sent to this contact
    (cards || []).forEach((card) => {
      if (String(card.personId) !== pid) return;
      if (!card.deliveredAt) return;
      const occ = (card.occasion || 'card').charAt(0).toUpperCase() + (card.occasion || 'card').slice(1);
      out.push({ id: `card-${card.id}`, kind: 'card', label: `Sent ${occ} card`, at: card.deliveredAt, emoji: '💌', sourceId: card.id });
    });

    return out.filter((e) => e.at).sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [acts, history, events, giftIdeas, trips, goals, personalNotes, commLog, cards, milestones, personId]);

  // Apply active filters (type + date range)
  const filtered = useMemo(() => {
    let list = entries.filter((e) => activeKinds.has(e.kind));
    if (fromDate) {
      const from = new Date(fromDate + 'T00:00:00').getTime();
      list = list.filter((e) => new Date(e.at).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59').getTime();
      list = list.filter((e) => new Date(e.at).getTime() <= to);
    }
    return list;
  }, [entries, activeKinds, fromDate, toDate]);

  const toggleKind = (k) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      if (next.size === 0) next.add(k); // never empty — keep at least one
      return next;
    });
  };

  const clearFilters = () => {
    setActiveKinds(new Set(Object.keys(KIND_META)));
    setFromDate('');
    setToDate('');
  };

  const filtersActive =
    activeKinds.size !== Object.keys(KIND_META).length || fromDate || toDate;

  // Upcoming memory refreshes for this contact (not yet due)
  const upcomingRefreshes = useMemo(() => {
    const now = Date.now();
    return (memoryRefreshes || [])
      .filter((m) => String(m.personId) === String(personId) && !m.done && m.refreshAt)
      .map((m) => ({ ...m, _ts: new Date(m.refreshAt).getTime() }))
      .filter((m) => !Number.isNaN(m._ts))
      .sort((a, b) => a._ts - b._ts);
  }, [memoryRefreshes, personId]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT);

  // Milestones and notes stay editable right on the contact's page — including
  // handing the entry to a different connection.
  const editRecord = useMemo(() => {
    if (!editing) return null;
    const list = editing.kind === 'milestone' ? milestones : personalNotes;
    return (list || []).find((r) => r.id === editing.id) || null;
  }, [editing, milestones, personalNotes]);

  const saveEdit = (patch) => {
    if (editing.kind === 'milestone') updateMilestone(editing.id, patch);
    else updatePersonalNote(editing.id, patch);
    setEditing(null);
  };

  const openRefresh = (entry) => {
    setRefreshTarget({
      personId,
      label: entry.label,
      sourceType: entry.kind,
      sourceId: entry.sourceId,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="w-full flex items-center justify-between p-3.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-display text-sm font-semibold"
        >
          <Clock size={16} /> History
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              {filtersActive ? `${filtered.length}/${entries.length}` : entries.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          {open && entries.length > 0 && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                filtersActive ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground'
              }`}
              aria-label="Filter timeline"
              title="Filter"
            >
              <Filter size={15} />
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary"
            aria-label={open ? 'Collapse history' : 'Expand history'}
          >
            <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="flex items-center justify-end mb-3">
            <Link to="/progress?tab=history" className="flex items-center text-xs text-primary font-medium">
              Full log <ChevronDown size={13} className="rotate-[-90deg]" />
            </Link>
          </div>

          {/* Filters */}
          {showFilters && entries.length > 0 && (
            <div className="mb-3 rounded-xl border border-border bg-secondary/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Type</span>
                {filtersActive && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 min-h-11 px-2 text-xs text-primary font-medium"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(KIND_META).map(([k, meta]) => {
                  const on = activeKinds.has(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toggleKind(k)}
                      className={`flex items-center gap-1 px-3 min-h-11 rounded-full text-xs font-medium border transition-colors ${
                        on
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border'
                      }`}
                    >
                      <span>{meta.emoji}</span> {meta.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs rounded-md border border-input bg-card px-2 flex-1 min-w-0"
                  aria-label="From date"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs rounded-md border border-input bg-card px-2 flex-1 min-w-0"
                  aria-label="To date"
                />
              </div>
            </div>
          )}

          {/* Upcoming memory refreshes */}
          {upcomingRefreshes.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {upcomingRefreshes.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-1.5">
                  <Bell size={12} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                    Remind you of <span className="text-foreground font-medium">{m.label}</span> · {formatDate(m.refreshAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {entries.length === 0
                ? `Nothing logged yet. As you complete acts, mark events, buy gifts, send cards, or jot notes for ${personName || 'this contact'}, they'll appear here on a timeline.`
                : 'No entries match your filters.'}
            </p>
          ) : (
            <ol className="space-y-2.5">
              {visible.map((en) => (
                <li key={en.id} className="flex items-start gap-2.5 group">
                  <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {en.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium leading-tight truncate">{en.label}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${KIND_TAG[en.kind] || 'bg-muted text-muted-foreground'}`}>
                        {KIND_META[en.kind]?.label || en.kind}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(en.at)} · {relativeLast(en.at)}
                    </p>
                    {editing?.id === en.sourceId && (
                      <TimelineEntryEditor
                        kind={en.kind}
                        record={editRecord}
                        people={people}
                        onSave={saveEdit}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                  {(en.kind === 'milestone' || en.kind === 'note') && (
                    <button
                      onClick={() => setEditing(editing?.id === en.sourceId ? null : { kind: en.kind, id: en.sourceId })}
                      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-primary shrink-0"
                      aria-label="Edit this entry"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => openRefresh(en)}
                    className="opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary shrink-0"
                    aria-label="Set a memory refresh reminder"
                    title="Remind me of this later"
                  >
                    <Bell size={14} />
                  </button>
                </li>
              ))}
            </ol>
          )}

          {filtered.length > INITIAL_LIMIT && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Show all {filtered.length}
              <ChevronDown size={16} />
            </button>
          )}

          <MemoryRefreshPrompt
            open={!!refreshTarget}
            onOpenChange={(v) => !v && setRefreshTarget(null)}
            target={refreshTarget}
          />
        </div>
      )}
    </div>
  );
}