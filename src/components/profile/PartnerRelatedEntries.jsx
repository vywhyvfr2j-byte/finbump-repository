import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate, actStatus, isActDueOnHome } from '@/lib/keepsakeUtils';
import { Gift, Heart, CalendarDays, Film, BookOpen, Tv, UtensilsCrossed, Plane, Milestone, ChevronRight, ChevronDown, Trash2, MapPin } from 'lucide-react';

function resolvePersonName(item, people) {
  if (item.personId) {
    const p = people.find((x) => String(x.id) === String(item.personId));
    return p?.name || '';
  }
  return typeof item.person === 'string' ? item.person.trim() : '';
}

function Section({ title, icon: Icon, items, linkTo, render }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 flex-1 min-w-0">
          <Icon size={15} className="text-muted-foreground shrink-0" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </button>
        <div className="flex items-center gap-1">
          {linkTo && (
            <Link to={linkTo} className="flex items-center text-xs text-primary font-medium">
              View all <ChevronRight size={13} />
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {render(items)}
        </div>
      )}
    </div>
  );
}

const STATUS_DOT = { overdue: 'bg-destructive', soon: 'bg-accent', fresh: 'bg-emerald-500', idle: 'bg-muted-foreground/40' };
const TREAT_LABEL = { drinks: 'Drinks', snacks: 'Snacks', meals: 'Meals', desserts: 'Desserts' };

export default function PartnerRelatedEntries() {
  const {
    profile, giftIdeas, acts, events, movieIdeas, bookIdeas, seriesIdeas, drinks, snacks, meals, desserts,
    trips, milestones, people, vacationIdeas, getawayIdeas,
    deleteMovieIdea, toggleMovieWatched,
    deleteBookIdea, toggleBookRead,
    deleteSeriesIdea, toggleSeriesWatched,
    deleteFavorite,
    deleteVacationIdea, deleteGetawayIdea,
  } = useKeepsake();
  const partnerName = (profile.name || '').trim();

  const matchesPartner = (item) => {
    if (!partnerName) return false;
    const name = resolvePersonName(item, people);
    return name !== '' && name === partnerName;
  };

  const partnerGifts = giftIdeas.filter(matchesPartner);
  const partnerActs = acts.filter((a) => (!a.person || a.person === partnerName) && isActDueOnHome(a));
  const PARTNER_RELATION_KEYS = ['partner', 'spouse', 'husband', 'wife'];
  const partnerEvents = events.filter((e) => PARTNER_RELATION_KEYS.includes(e.relation));
  const partnerMovies = movieIdeas.filter(matchesPartner);
  const partnerSeries = seriesIdeas.filter(matchesPartner);
  const partnerBooks = bookIdeas.filter(matchesPartner);
  const partnerTreats = [...drinks, ...snacks, ...meals, ...desserts].filter(matchesPartner);
  const partnerTrips = trips.filter((t) => t.who === 'both' || t.who === 'partner');
  const partnerPlaces = [
    ...vacationIdeas.filter(matchesPartner).map((p) => ({ ...p, _kind: 'vacation' })),
    ...getawayIdeas.filter(matchesPartner).map((p) => ({ ...p, _kind: 'getaway' })),
  ];

  if (!partnerGifts.length && !partnerActs.length && !partnerEvents.length &&
      !partnerMovies.length && !partnerSeries.length && !partnerBooks.length &&
      !partnerTreats.length && !partnerTrips.length && !milestones.length && !partnerPlaces.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">For {partnerName || 'them'}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Gifts & ideas */}
      <Section title="Gift ideas" icon={Gift} items={partnerGifts} linkTo="/gift-tracker"
        render={(items) => items.slice(0, 6).map((g) => (
          <Link key={g.id} to="/gift-tracker" className="flex items-center justify-between text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-secondary/60 transition-colors">
            <span className="truncate pr-2">{g.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {g.gifted ? 'Gifted' : g.purchased ? 'Purchased' : 'Idea'}
            </span>
          </Link>
        ))}
      />

      <Section title="Acts of support" icon={Heart} items={partnerActs} linkTo="/"
        render={(items) => items.slice(0, 6).map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[actStatus(a)] || 'bg-muted-foreground/40'}`} />
            <span className="truncate">{a.emoji} {a.name}</span>
          </div>
        ))}
      />

      <Section title="Events" icon={CalendarDays} items={partnerEvents} linkTo="/events"
        render={(items) => items.slice(0, 6).map((e) => (
          <div key={e.id} className="flex items-center justify-between text-sm py-0.5">
            <span className="truncate pr-2">{e.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{formatDate(e.date)}</span>
          </div>
        ))}
      />

      {/* Media & treats */}
      <Section title="Movies & series" icon={Film} items={[...partnerMovies, ...partnerSeries]} linkTo="/ideas"
        render={(items) => items.slice(0, 6).map((m, i) => {
          const isMovie = partnerMovies.includes(m);
          const toggle = isMovie ? toggleMovieWatched : toggleSeriesWatched;
          const del = isMovie ? deleteMovieIdea : deleteSeriesIdea;
          return (
            <div key={m.id || i} className="flex items-center gap-2 text-sm py-0.5">
              <button onClick={() => toggle(m.id)} className="shrink-0">
                {m.watched ? <Tv size={13} className="text-muted-foreground" /> : <Film size={13} className="text-accent" />}
              </button>
              <span className={`truncate flex-1 ${m.watched ? 'line-through text-muted-foreground' : ''}`}>{m.title}</span>
              <button onClick={() => del(m.id)} className="text-muted-foreground shrink-0 hover:text-destructive">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      />

      <Section title="Books" icon={BookOpen} items={partnerBooks} linkTo="/ideas"
        render={(items) => items.slice(0, 6).map((b) => (
          <div key={b.id} className="flex items-center gap-2 text-sm py-0.5">
            <button onClick={() => toggleBookRead(b.id)} className="shrink-0">
              <BookOpen size={13} className={b.read ? 'text-muted-foreground' : 'text-accent'} />
            </button>
            <span className={`truncate flex-1 ${b.read ? 'line-through text-muted-foreground' : ''}`}>{b.title}</span>
            {b.author && <span className="text-xs text-muted-foreground truncate">— {b.author}</span>}
            <button onClick={() => deleteBookIdea(b.id)} className="text-muted-foreground shrink-0 hover:text-destructive">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      />

      <Section title="Treats" icon={UtensilsCrossed} items={partnerTreats} linkTo="/ideas"
        render={(items) => items.slice(0, 6).map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm py-0.5">
            <span className="truncate pr-2">{t.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{TREAT_LABEL[t.category] || ''}</span>
              <button onClick={() => deleteFavorite(t.category, t.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      />

      {partnerPlaces.length > 0 && (
        <Section title="Places" icon={MapPin} items={partnerPlaces} linkTo="/ideas"
          render={(items) => items.slice(0, 6).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm py-0.5">
              <span className="truncate pr-2">{p.destination}</span>
              <button onClick={() => (p._kind === 'vacation' ? deleteVacationIdea(p.id) : deleteGetawayIdea(p.id))} className="text-muted-foreground shrink-0 hover:text-destructive">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        />
      )}

      {/* Trips & milestones */}
      <Section title="Trips" icon={Plane} items={partnerTrips} linkTo="/vacation-planner"
        render={(items) => items.slice(0, 6).map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm py-0.5">
            <span className="truncate pr-2">{t.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{t.startDate ? formatDate(t.startDate) : 'Unscheduled'}</span>
          </div>
        ))}
      />

      <Section title="Milestones" icon={Milestone} items={milestones} linkTo="/milestones"
        render={(items) => items.slice(0, 6).map((m) => (
          <div key={m.id} className="flex items-center justify-between text-sm py-0.5">
            <span className="truncate pr-2">{m.title}</span>
            {m.date && <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.date)}</span>}
          </div>
        ))}
      />
    </div>
  );
}