import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Gift, Clapperboard, BookOpen, Tv, Utensils, MapPin, Pencil, Trash2, Check, X } from 'lucide-react';

export default function PersonIdeasSummary({ personId, personName }) {
  const {
    giftIdeas, movieIdeas, bookIdeas, seriesIdeas, drinks, snacks, meals, desserts, vacationIdeas, getawayIdeas,
    deleteGiftIdea, updateGiftIdea,
    deleteMovieIdea, updateMovieIdea,
    deleteBookIdea, updateBookIdea,
    deleteSeriesIdea, updateSeriesIdea,
    deleteFavorite, updateFavorite,
    deleteVacationIdea, updateVacationIdea,
    deleteGetawayIdea, updateGetawayIdea,
  } = useKeepsake();
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');

  if (!personId) return null;

  const items = [
    ...giftIdeas.filter((g) => g.person === personName).map((g) => ({
      id: 'gift-' + g.id, icon: Gift, title: g.title,
      onDelete: () => deleteGiftIdea(g.id),
      onEdit: (val) => updateGiftIdea(g.id, { title: val }),
    })),
    ...movieIdeas.filter((m) => m.personId === personId).map((m) => ({
      id: 'movie-' + m.id, icon: Clapperboard, title: m.title,
      onDelete: () => deleteMovieIdea(m.id),
      onEdit: (val) => updateMovieIdea(m.id, { title: val }),
    })),
    ...bookIdeas.filter((b) => b.personId === personId).map((b) => ({
      id: 'book-' + b.id, icon: BookOpen, title: b.title,
      onDelete: () => deleteBookIdea(b.id),
      onEdit: (val) => updateBookIdea(b.id, { title: val }),
    })),
    ...seriesIdeas.filter((sr) => sr.personId === personId).map((sr) => ({
      id: 'series-' + sr.id, icon: Tv, title: sr.title,
      onDelete: () => deleteSeriesIdea(sr.id),
      onEdit: (val) => updateSeriesIdea(sr.id, { title: val }),
    })),
    ...[
      ...drinks.map((t) => ({ ...t, category: 'drinks' })),
      ...snacks.map((t) => ({ ...t, category: 'snacks' })),
      ...meals.map((t) => ({ ...t, category: 'meals' })),
      ...desserts.map((t) => ({ ...t, category: 'desserts' })),
    ]
      .filter((t) => t.personId === personId)
      .map((t) => ({
        id: 'treat-' + t.id, icon: Utensils, title: t.title,
        onDelete: () => deleteFavorite(t.category, t.id),
        onEdit: (val) => updateFavorite(t.category, t.id, { title: val }),
      })),
    ...[
      ...vacationIdeas.map((p) => ({ ...p, kind: 'vacation' })),
      ...getawayIdeas.map((p) => ({ ...p, kind: 'getaway' })),
    ]
      .filter((p) => p.personId === personId)
      .map((p) => ({
        id: 'place-' + p.id, icon: MapPin, title: p.destination,
        onDelete: () => (p.kind === 'vacation' ? deleteVacationIdea(p.id) : deleteGetawayIdea(p.id)),
        onEdit: (val) => (p.kind === 'vacation' ? updateVacationIdea(p.id, { destination: val }) : updateGetawayIdea(p.id, { destination: val })),
      })),
  ];

  if (items.length === 0) return null;

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraftTitle(item.title);
  };

  const saveEdit = (item) => {
    if (draftTitle.trim()) item.onEdit(draftTitle.trim());
    setEditingId(null);
  };

  return (
    <div className="mb-5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 pl-1">
        Previously identified for {personName}
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} className="flex items-center gap-2.5 bg-secondary/40 rounded-xl border border-border px-3 py-2.5">
              <Icon size={15} className="text-muted-foreground shrink-0" />
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item)}
                    className="flex-1 min-w-0 bg-transparent border-b border-border text-sm focus:outline-none"
                  />
                  <button onClick={() => saveEdit(item)} className="text-primary shrink-0">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground shrink-0">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm truncate flex-1">{item.title}</p>
                  <button onClick={() => startEdit(item)} className="text-muted-foreground shrink-0">
                    <Pencil size={14} />
                  </button>
                  <button onClick={item.onDelete} className="text-muted-foreground shrink-0">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}