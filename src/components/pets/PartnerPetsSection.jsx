import React from 'react';
import { PawPrint } from 'lucide-react';

// Read-only list of pets shared by the paired partner. Shown beneath the
// user's own pets so both partners' furry family are visible in one place.
export default function PartnerPetsSection({ partnerName, pets }) {
  if (!pets || pets.length === 0) return null;
  const label = partnerName || 'your partner';
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <PawPrint size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">{label}'s pets</h3>
        <span className="text-xs text-muted-foreground">{pets.length}</span>
      </div>
      <div className="space-y-2">
        {pets.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3"
          >
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={p.name} loading="lazy" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                <PawPrint size={18} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {p.species || 'Pet'}{p.breed ? ` · ${p.breed}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}