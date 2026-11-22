import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RELATIONS } from '@/lib/peopleConstants';
import KeepsakeUserBadge from './KeepsakeUserBadge';

// Displays people grouped into stacked, collapsible sections by relation.
// Each category header is always visible; tapping it expands the names within.
export default function PeopleBubbles({ people, activeTab, selectedId, onSelect, keepsakeEmails = {} }) {
  const groups = RELATIONS.filter((r) => r.key !== 'partner');

  const sections = activeTab === 'all'
    ? groups
        .map((g) => ({ group: g, items: people.filter((p) => (p.relation || 'other') === g.key) }))
        .filter((s) => s.items.length > 0)
    : groups
        .filter((g) => g.key === activeTab)
        .map((g) => ({ group: g, items: people }));

  // Auto-expand the group containing the selected person.
  const initialOpen = sections
    .filter((s) => s.items.some((p) => p.id === selectedId))
    .reduce((acc, s) => ({ ...acc, [s.group.key]: true }), {});
  const [open, setOpen] = useState(initialOpen);

  if (sections.length === 0) return null;

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-2.5 mb-4">
      {sections.map(({ group, items }) => {
        const isOpen = activeTab !== 'all' || !!open[group.key];
        return (
          <div key={group.key} className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => activeTab === 'all' && toggle(group.key)}
              className="w-full flex items-center justify-between px-4 h-12"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-base leading-none">{group.emoji}</span>
                {group.label}
                <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
              </span>
              {activeTab === 'all' && (
                <ChevronDown
                  size={18}
                  className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-2 px-4 pb-3.5 pt-0">
                {items.map((p) => {
                  const selected = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                      className={`flex items-center gap-2 h-11 px-3.5 rounded-full border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-secondary/60'
                      }`}
                    >
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="text-base leading-none">{group.emoji}</span>
                      )}
                      <span className="text-sm font-medium leading-none">
                        {p.preferredName || p.name}
                      </span>
                      {keepsakeEmails[(p.email || '').trim().toLowerCase()] && (
                        <KeepsakeUserBadge variant="dot" selected={selected} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}