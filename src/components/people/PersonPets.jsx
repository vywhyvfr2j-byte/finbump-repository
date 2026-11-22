import React from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { PawPrint, X } from 'lucide-react';

// Shows pets associated with this person (via ownerId), each linking to the
// pet's full profile on the Pets page.
export default function PersonPets({ person }) {
  const { pets, updatePet } = useKeepsake();
  const ownedPets = pets.filter((p) => p.ownerId === person.id);

  if (ownedPets.length === 0) return null;

  const unlinkPet = (petId) => updatePet(petId, { ownerId: '' });

  return (
    <div className="space-y-1.5">
      {ownedPets.map((pet) => (
        <Link
          key={pet.id}
          to={`/pets?pet=${encodeURIComponent(pet.id)}`}
          className="flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 hover:bg-secondary transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <PawPrint size={16} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{pet.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {pet.species || 'Pet'}{pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>
          <span className="text-xs text-primary font-medium shrink-0">View →</span>
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); unlinkPet(pet.id); }}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={`Unlink ${pet.name}`}
          >
            <X size={16} />
          </button>
        </Link>
      ))}
    </div>
  );
}