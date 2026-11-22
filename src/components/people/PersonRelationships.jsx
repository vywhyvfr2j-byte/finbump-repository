import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, X, Plus, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKeepsake } from '@/lib/keepsakeStore';
import { sortPeopleForPicker, sortPetsForPicker } from '@/lib/peopleConstants';

export const RELATIONSHIP_TYPES = [
  'Spouse',
  'Partner',
  'Child',
  'Parent',
  'Sibling',
  'Grandchild',
  'Grandparent',
  'Stepchild',
  'Stepparent',
  'In-law',
  'Cousin',
  'Niece',
  'Nephew',
  'Aunt',
  'Uncle',
  'Friend',
  'Pet',
  'Other',
];

// Shows a person's links to other connections (people or pets) as tappable
// buttons, and lets the user add/remove relationships. Only targets that are
// also the user's own connections appear — entries pointing to someone outside
// the user's people/pets lists show as "(removed)".
export default function PersonRelationships({ person, people, onUpdate, onSelectPerson }) {
  const { pets } = useKeepsake();
  const [adding, setAdding] = useState(false);
  const [relType, setRelType] = useState('Spouse');
  const [customType, setCustomType] = useState('');
  const [targetId, setTargetId] = useState('');

  const relationships = person.relationships || [];

  // Build the available-target list from the user's own people + pets, minus
  // self and anyone already linked.
  const availablePeople = sortPeopleForPicker(people.filter((p) => p.id !== person.id && !relationships.some((r) => r.personId === p.id)));
  const availablePets = sortPetsForPicker(pets.filter((p) => !relationships.some((r) => r.petId === p.id)));

  const addRelationship = () => {
    if (!targetId) return;
    const type = relType === 'Other' ? customType.trim() || 'Other' : relType;
    const isPet = availablePets.some((p) => p.id === targetId);
    const entry = {
      id: 'r' + Date.now(),
      ...(isPet ? { petId: targetId } : { personId: targetId }),
      type,
    };
    onUpdate({ relationships: [...relationships, entry] });
    setAdding(false);
    setRelType('Spouse');
    setCustomType('');
    setTargetId('');
  };

  const removeRelationship = (id) =>
    onUpdate({ relationships: relationships.filter((r) => r.id !== id) });

  // Resolve a relationship entry to a person or pet from the user's own lists.
  // Returns null if the target isn't one of the user's connections.
  const resolveTarget = (rel) => {
    if (rel.petId) {
      const pet = pets.find((p) => p.id === rel.petId);
      return pet ? { name: pet.name, isPet: true, id: pet.id, birthday: pet.birthday || pet.adoptionDate } : null;
    }
    const p = people.find((p) => p.id === rel.personId);
    return p ? { name: p.name, isPet: false, id: p.id, birthday: p.birthday } : null;
  };

  // Category priority: Spouse/Partner → Children → Pets → Siblings → Parents → Grandkids → Other
  const categoryRank = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'spouse' || t === 'partner') return 0;
    if (t === 'child' || t === 'stepchild') return 1;
    if (t === 'pet') return 2;
    if (t === 'sibling') return 3;
    if (t === 'parent' || t === 'stepparent') return 4;
    if (t === 'grandchild') return 5;
    return 6;
  };

  // Sort relationships by category, then within each category:
  //  - Children: alphabetical by name, unless they have a birthday → oldest first (ascending)
  //  - Pets: oldest first (ascending birthday), then by name
  //  - Others: alphabetical by name
  const sortedRelationships = [...relationships].sort((a, b) => {
    const rankDiff = categoryRank(a.type) - categoryRank(b.type);
    if (rankDiff !== 0) return rankDiff;
    const ta = resolveTarget(a);
    const tb = resolveTarget(b);
    const nameA = ta?.name || '';
    const nameB = tb?.name || '';
    const cat = categoryRank(a.type);
    if (cat === 1) {
      // Children: birthday takes precedence over alphabetical
      if (ta?.birthday && tb?.birthday) return ta.birthday.localeCompare(tb.birthday);
      if (ta?.birthday) return -1;
      if (tb?.birthday) return 1;
      return nameA.localeCompare(nameB);
    }
    if (cat === 2) {
      // Pets: oldest first, then by name
      if (ta?.birthday && tb?.birthday) return ta.birthday.localeCompare(tb.birthday);
      if (ta?.birthday) return -1;
      if (tb?.birthday) return 1;
      return nameA.localeCompare(nameB);
    }
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Users size={13} /> Family connections
      </label>

      {adding ? (
        <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
          <Select value={relType} onValueChange={setRelType}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {relType === 'Other' && (
            <Input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Relationship label"
              className="h-10"
            />
          )}
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Connect to…" />
            </SelectTrigger>
            <SelectContent>
              {availablePeople.length > 0 && (
                <>
                  <SelectItem key="__people_header" value="__people_header" disabled className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    People
                  </SelectItem>
                  {availablePeople.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </>
              )}
              {availablePets.length > 0 && (
                <>
                  <SelectItem key="__pets_header" value="__pets_header" disabled className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pets
                  </SelectItem>
                  {availablePets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>🐾 {p.name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAdding(false)} className="flex-1 h-9">Cancel</Button>
            <Button onClick={addRelationship} disabled={!targetId || targetId.startsWith('__')} className="flex-1 h-9">Connect</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full h-9 text-sm">
          <Plus size={15} /> Connect a person or pet
        </Button>
      )}

      {sortedRelationships.length > 0 && (
        <div className="space-y-1.5">
          {sortedRelationships.map((r) => {
            const target = resolveTarget(r);
            if (!target) {
              return (
                <div key={r.id} className="flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5">
                  <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Users size={16} className="text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-muted-foreground">{r.type} · (removed)</p>
                  </div>
                  <button onClick={() => removeRelationship(r.id)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="Remove relationship">
                    <X size={16} />
                  </button>
                </div>
              );
            }
            const initial = (target.name || '?').charAt(0).toUpperCase();
            const subtitle = target.isPet ? `${r.type}` : r.type;
            const rowContent = (
              <>
                {target.isPet ? (
                  <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <PawPrint size={16} className="text-primary" />
                  </span>
                ) : (
                  <span className="w-9 h-9 rounded-full ks-brand-gradient flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0">
                    {initial}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{target.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                </div>
                <span className="text-xs text-primary font-medium shrink-0">View →</span>
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeRelationship(r.id); }}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label={`Remove relationship with ${target.name}`}
                >
                  <X size={16} />
                </button>
              </>
            );
            if (target.isPet) {
              return (
                <Link
                  key={r.id}
                  to={`/pets?pet=${encodeURIComponent(target.id)}`}
                  className="flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  {rowContent}
                </Link>
              );
            }
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectPerson?.(target.id)}
                className="flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 hover:bg-secondary transition-colors w-full text-left"
              >
                {rowContent}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}