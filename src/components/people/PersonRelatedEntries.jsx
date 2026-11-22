import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate } from '@/lib/keepsakeUtils';
import { Gift, CalendarDays, Film, Tv, BookOpen, UtensilsCrossed, ChevronRight, ChevronDown, Trash2, MapPin } from 'lucide-react';

function resolvePersonName(item) {
  if (item.personId) return `__pid:${item.personId}`;
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
        <div className="px-3 pb-3 space-y-1.5">{render(items)}</div>
      )}
    </div>
  );
}

const TREAT_LABEL = { drinks: 'Drinks', snacks: 'Snacks', meals: 'Meals', desserts: 'Desserts' };

// Shows everything tied to a specific person (by personId, with a legacy name fallback),
// with inline delete and toggle management so ideas can be managed from the contact
// profile after they flow off the Ideas page.
export default function PersonRelatedEntries({ person }) {
  const {
    giftIdeas, events, movieIdeas, bookIdeas, seriesIdeas, drinks, snacks, meals, desserts,
    vacationIdeas, getawayIdeas,
    deleteMovieIdea, toggleMovieWatched,
    deleteBookIdea, toggleBookRead,
    deleteSeriesIdea, toggleSeriesWatched,
    deleteFavorite,
    deleteVacationIdea, deleteGetawayIdea,
  } = useKeepsake();

  const belongs = (item) => {
    if (item.personId) return String(item.personId) === String(person.id);
    const name = typeof item.person === 'string' ? item.person.trim() : '';
    return name !== '' && name === person.name;
  };

  const personGifts = giftIdeas.filter(belongs);
  const personEvents = events.filter((e) => String(e.personId) === String(person.id));
  const personMovies = movieIdeas.filter(belongs);
  const personSeries = seriesIdeas.filter(belongs);
  const personBooks = bookIdeas.filter(belongs);
  const personTreats = [...drinks, ...snacks, ...meals, ...desserts].filter(belongs);
  const personPlaces = [
    ...vacationIdeas.filter(belongs).map((p) => ({ ...p, _kind: 'vacation' })),
    ...getawayIdeas.filter(belongs).map((p) => ({ ...p, _kind: 'getaway' })),
  ];

  if (!personGifts.length && !personEvents.length && !personMovies.length && !personSeries.length && !personBooks.length && !personTreats.length && !personPlaces.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">For {person.name}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Section title="Gift ideas" icon={Gift} items={personGifts} linkTo={`/gift-tracker?person=${encodeURIComponent(person.name)}`}
        render={(items) => items.slice(0, 6).map((g) => (
          <Link key={g.id} to={`/gift-tracker?person=${encodeURIComponent(person.name)}`} className="flex items-center justify-between text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-secondary/60 transition-colors">
            <span className="truncate pr-2">{g.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {g.gifted ? 'Gifted' : g.purchased ? 'Purchased' : 'Idea'}
            </span>
          </Link>
        ))}
      />

      <Section title="Events" icon={CalendarDays} items={personEvents} linkTo="/events"
        render={(items) => items.slice(0, 6).map((e) => (
          <div key={e.id} className="flex items-center justify-between text-sm py-0.5">
            <span className="truncate pr-2">{e.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{formatDate(e.date)}</span>
          </div>
        ))}
      />

      <Section title="Movies & series" icon={Film} items={[...personMovies, ...personSeries]} linkTo="/ideas"
        render={(items) => items.slice(0, 6).map((m, i) => {
          const isMovie = personMovies.includes(m);
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

      <Section title="Books" icon={BookOpen} items={personBooks} linkTo="/ideas"
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

      <Section title="Treats" icon={UtensilsCrossed} items={personTreats} linkTo="/ideas"
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

      {personPlaces.length > 0 && (
        <Section title="Places" icon={MapPin} items={personPlaces} linkTo="/ideas"
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
    </div>
  );
}