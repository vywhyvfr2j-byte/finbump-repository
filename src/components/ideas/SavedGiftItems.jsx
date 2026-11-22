import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ExternalLink, UserRound, Bookmark, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { isSafeUrl } from '@/lib/giftPurchase';

export default function SavedGiftItems() {
  const { giftIdeas, addGiftIdea, deleteGiftIdea, people } = useKeepsake();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [personId, setPersonId] = useState('');
  const [listOpen, setListOpen] = useState(true);

  const sortedPeople = useMemo(() => sortPeopleForPicker(people), [people]);

  // Only show items explicitly saved in this section (those with a note or a
  // direct item link and not yet purchased) so it reads as a reference list,
  // distinct from the per-person gift tracker.
  const savedItems = useMemo(
    () =>
      giftIdeas
        .filter((g) => !g.purchased && (g.note || g.link))
        .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')),
    [giftIdeas]
  );

  const personNameFor = (item) => {
    if (item.personId) {
      const p = people.find((x) => x.id === item.personId);
      if (p) return p.preferredName || p.name;
    }
    return item.person || '';
  };

  const profilePathFor = (item) =>
    item.personId ? `/people?person=${encodeURIComponent(item.personId)}` : null;

  const handleAdd = () => {
    if (!title.trim()) return;
    addGiftIdea({
      title: title.trim(),
      link: link.trim(),
      note: note.trim(),
      personId: personId || null,
      person: personNameFor({ personId }) || '',
    });
    setTitle('');
    setLink('');
    setNote('');
    setPersonId('');
  };

  return (
    <div className="mt-2">
      <h3 className="font-display text-base font-semibold mb-1">Saved Gift Items</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Save specific items you find and link them to a person for later reference.
      </p>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 mb-5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gift item name"
          className="h-11"
        />
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Item link (optional)"
          className="h-11"
        />
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why this gift / notes for later"
          className="min-h-[60px]"
        />
        {sortedPeople.length > 0 && (
          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Link to a person (optional)" />
            </SelectTrigger>
            <SelectContent>
              {sortedPeople.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={handleAdd} disabled={!title.trim()} className="w-full h-11 rounded-xl">
          Save item
        </Button>
      </div>

      <Collapsible open={listOpen} onOpenChange={setListOpen} className="space-y-2.5">
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground py-1.5">
          <span>{savedItems.length} saved item{savedItems.length === 1 ? '' : 's'}</span>
          <ChevronDown size={16} className={`transition-transform ${listOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2.5">
        {savedItems.map((g) => {
          const profilePath = profilePathFor(g);
          const personName = personNameFor(g);
          return (
            <div key={g.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{g.title}</p>
                  {g.note && <p className="text-xs text-muted-foreground mt-1">{g.note}</p>}
                </div>
                <button onClick={() => deleteGiftIdea(g.id)} className="text-muted-foreground shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                {/* The link is free-text the user typed, so only render it as a
                    real anchor when it is an http(s) URL — never javascript: or
                    data: (see isSafeUrl). */}
                {isSafeUrl(g.link) && (
                  <a
                    href={g.link.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
                  >
                    <ExternalLink size={12} /> View item
                  </a>
                )}
                {profilePath && (
                  <Link
                    to={profilePath}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
                  >
                    <UserRound size={12} /> {personName}'s profile
                  </Link>
                )}
                {!profilePath && personName && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <UserRound size={12} /> {personName}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {savedItems.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Bookmark size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No saved items yet.</p>
            <p className="text-xs mt-1">Save a gift item above to keep it handy for later.</p>
          </div>
        )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}