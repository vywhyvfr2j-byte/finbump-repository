import React from 'react';
import { Search, Bell, Plus, ChevronDown, ChevronUp, PawPrint } from 'lucide-react';

// A stylized, non-interactive mockup of the People ("Who You Love") page,
// shown in onboarding to reassure new users where their loved ones live
// and that they can edit or add people anytime. Purely decorative — no
// tap targets — so it reads as a "preview" rather than a live screen.
export default function PeoplePreview() {
  const categories = [
    { label: 'Kids', count: 5, emoji: '🧒', open: false },
    { label: 'Grandkids', count: 4, emoji: '👶', open: false },
    { label: 'Siblings', count: 2, emoji: '🧑‍🤝‍🧑', open: false },
    { label: 'Parents', count: 2, emoji: '🧓', open: false },
    { label: 'Pets', count: 8, icon: PawPrint, open: true },
  ];

  const petChips = ['Clover', 'Goku', 'Frankie', 'Violet', 'Beaujou', 'Oreo'];

  return (
    <div
      aria-hidden="true"
      className="rounded-3xl border border-border bg-card overflow-hidden shadow-card select-none pointer-events-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground text-xs">‹</div>
        <div className="text-center">
          <p className="text-[10px] tracking-widest text-muted-foreground font-medium">EVERYONE YOU TRACK</p>
          <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
            <span className="inline-flex w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
              <PawPrint size={11} className="text-primary" />
            </span>
            Who You Love
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={16} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full px-1">9+</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Plus size={13} className="text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-1">
        <div className="inline-flex bg-secondary/50 rounded-full p-0.5 text-xs">
          <span className="px-3 py-1 rounded-full bg-card font-semibold shadow-sm">People</span>
          <span className="px-3 py-1 text-muted-foreground">Gifts</span>
          <span className="px-3 py-1 text-muted-foreground">Photos</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-2.5">
        <div className="flex items-center gap-2 bg-secondary/40 rounded-full px-3 py-2 text-muted-foreground text-xs">
          <Search size={13} />
          <span>Search people</span>
        </div>
      </div>

      {/* Category list */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-base">
                    {Icon ? <Icon size={14} className="text-muted-foreground" /> : c.emoji}
                  </span>
                  <span className="text-sm font-medium text-foreground">{c.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.count}</span>
                  {c.open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
                </div>
              </div>
              {c.open && (
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  {petChips.map((name) => (
                    <div key={name} className="flex items-center gap-2 rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-xs text-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                        <PawPrint size={9} className="text-primary" />
                      </span>
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom nav strip */}
      <div className="flex items-center justify-around border-t border-border bg-card px-2 py-2 text-[9px] text-muted-foreground">
        <span>Home</span>
        <span>Acts</span>
        <span>Partner</span>
        <span>Calendar</span>
        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Explore</span>
      </div>
    </div>
  );
}