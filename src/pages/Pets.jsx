import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, X, Search, PawPrint, UserCircle2 } from 'lucide-react';
import PetProfilePanel from '@/components/pets/PetProfilePanel';
import PartnerPetsSection from '@/components/pets/PartnerPetsSection';
import { nextOccurrence, buildOwnerOptions, ownerDisplayName, SELF_OWNER_ID } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function Pets() {
  const { t } = useI18n();
  const { pets, people, myName, addPet, updatePet, deletePet, addEvent, partnerPets, partnerName } = useKeepsake();

  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState('');
  const [adoptionDate, setAdoptionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('pet') || '');

  const ownerName = (id) => ownerDisplayName(id, people, myName);

  const searchList = query.trim()
    ? pets.filter((p) => {
        const q = query.trim().toLowerCase();
        if (p.name.toLowerCase().includes(q)) return true;
        const owner = ownerName(p.ownerId);
        return owner && owner.toLowerCase().includes(q);
      })
    : pets;

  useEffect(() => {
    if (!pets.length) {
      setSelectedId('');
      return;
    }
    if (selectedId && pets.some((p) => p.id === selectedId)) return;
    const urlPet = new URLSearchParams(window.location.search).get('pet');
    if (urlPet && pets.some((p) => p.id === urlPet)) { setSelectedId(urlPet); return; }
    setSelectedId(pets[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets]);

  const handleAdd = () => {
    if (!name.trim()) return;
    const id = addPet({
      name: name.trim(),
      ownerId: ownerId || null,
      species: species.trim(),
      breed: breed.trim(),
      birthday,
      adoptionDate,
      notes: notes.trim(),
    });
    if (birthday) {
      addEvent({ name: t('pets.birthdayEvent', { name: name.trim() }), date: nextOccurrence(birthday), type: 'birthday', note: '', personId: id });
    }
    if (adoptionDate) {
      addEvent({ name: t('pets.adoptionEvent', { name: name.trim() }), date: nextOccurrence(adoptionDate), type: 'adoption', note: '', personId: id });
    }
    setName(''); setOwnerId(''); setSpecies(''); setBreed('');
    setBirthday(''); setAdoptionDate(''); setNotes('');
    setAdding(false);
    setSelectedId(id);
  };

  const selectedPet = pets.find((p) => p.id === selectedId) || null;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('nav.pets')}
        subtitle={t('pets.subtitle')}
        back
        right={
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors"
            aria-label={adding ? t('pets.cancelAria') : t('pets.addPetAria')}
          >
            {adding ? <X size={20} /> : <Plus size={20} />}
          </button>
        }
      />

      <div className="px-5 mt-2">
        {adding && (
          <div className="rounded-2xl border p-4 mb-5 shadow-card ks-card-tint">
            <div className="space-y-2.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pets.namePlaceholder')} aria-label={t('pets.namePlaceholder')} className="h-11" autoFocus />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground pl-1 flex items-center gap-1.5">
                  <UserCircle2 size={13} /> {t('pets.owner')}
                </label>
                <Select value={ownerId || '_none'} onValueChange={(v) => setOwnerId(v === '_none' ? '' : v)}>
                  <SelectTrigger className="h-11" aria-label={t('pets.ownerAria')}>
                    <SelectValue placeholder={t('pets.ownerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{t('pets.noConnection')}</SelectItem>
                    {buildOwnerOptions(people, myName).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder={t('pets.speciesPlaceholder')} aria-label={t('pets.speciesAria')} className="h-11" />
                <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('pets.breedPlaceholder')} aria-label={t('pets.breedAria')} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground pl-1">{t('pets.birthdayLabel')}</label>
                  <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} aria-label={t('pets.birthdayAria')} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground pl-1">{t('pets.adoptionLabel')}</label>
                  <Input type="date" value={adoptionDate} onChange={(e) => setAdoptionDate(e.target.value)} aria-label={t('pets.adoptionAria')} className="h-11" />
                </div>
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('pets.notesPlaceholder')} aria-label={t('pets.notesAria')} className="min-h-[70px]" />
              <Button onClick={handleAdd} disabled={!name.trim()} className="w-full h-11">
                {t('pets.savePet')}
              </Button>
            </div>
          </div>
        )}

        {pets.length > 0 && (
          <div className="mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('pets.searchPlaceholder')} aria-label={t('pets.searchAria')} className="h-11 pl-9" />
            </div>
          </div>
        )}

        {/* Pet selector bubbles */}
        {pets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchList.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2 text-sm font-medium border transition-colors ${
                  p.id === selectedId
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:bg-secondary/60'
                }`}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                    <PawPrint size={13} />
                  </span>
                )}
                {p.name}
                {p.ownerId && ownerName(p.ownerId) && (
                  <span className="text-[10px] opacity-60 font-normal">· {ownerName(p.ownerId)}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {pets.length > 0 && query.trim() && searchList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pb-2">{t('pets.noMatch', { query: query.trim() })}</p>
        )}

        {pets.length === 0 && !adding && (
          <div className="text-center py-16 text-muted-foreground">
            <PawPrint size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('pets.noPets')}</p>
            <p className="text-sm mt-1 mb-5">{t('pets.noPetsDesc')}</p>
            <Button onClick={() => setAdding(true)} className="h-11 px-6">
              <Plus size={18} /> {t('pets.addPetBtn')}
            </Button>
          </div>
        )}

        {pets.length > 0 && !adding && (
          <Button onClick={() => setAdding(true)} variant="outline" className="w-full h-11 mb-4">
            <Plus size={18} /> {t('pets.addPetBtn')}
          </Button>
        )}

        {selectedPet && (
          <PetProfilePanel
            pet={selectedPet}
            onUpdate={(patch) => updatePet(selectedPet.id, patch)}
            onDelete={deletePet}
          />
        )}

        <PartnerPetsSection partnerName={partnerName} pets={partnerPets} />
      </div>
    </div>
  );
}