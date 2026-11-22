import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEAL_BUDGETS, MEAL_CUISINES } from '@/lib/mealConstants';
import { useToast } from '@/components/ui/use-toast';
import MenuItemsInput from '@/components/meals/MenuItemsInput';
import QuickLoadTemplateSheet from '@/components/meals/QuickLoadTemplateSheet';
import FindRestaurantSheet from '@/components/meals/FindRestaurantSheet';
import InviteVerifyDialog from '@/components/invites/InviteVerifyDialog';
import { X, UserPlus, Sparkles } from 'lucide-react';

// A host can name up to three food types, the same allowance the AI search
// offers, so "Italian" and "Thai" can both describe one gathering.
const MAX_CUISINES = 3;

// Creates a meal: a title, everything the host already knows they want, and the
// list of invitees. Invitees can come from the user's connections (matched by
// email) or be typed in by hand for people who aren't contacts yet.
export default function MealCreateForm({ people = [], templates = [], onTemplateSaved, onCreated, onCancel }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  // The time the gathering would start. It rides along with the date, so the
  // reminders count down to the real moment and stop once it has arrived.
  const [proposedTime, setProposedTime] = useState('18:00');
  const [cuisine, setCuisine] = useState('');
  const [cuisineInput, setCuisineInput] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState(null);
  const [finding, setFinding] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState('');

  // Connections that have an email and aren't already on the list, A→Z.
  const suggestions = useMemo(() => {
    const taken = new Set(participants.map((p) => p.email.toLowerCase()));
    return (people || [])
      .filter((p) => p.email && !taken.has(p.email.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [people, participants]);

  // The chosen food types, kept as one comma-separated value so the meal, its
  // saved template and the AI search all go on reading a single field.
  const cuisines = useMemo(
    () => (cuisine ? cuisine.split(',').map((c) => c.trim()).filter(Boolean) : []),
    [cuisine],
  );

  // The presets plus anything the host typed in, so a food choice of their own
  // shows up as a selected chip they can tap off again.
  const cuisineOptions = useMemo(() => {
    const presets = MEAL_CUISINES.slice(0, 12);
    return [...presets, ...cuisines.filter((c) => !presets.includes(c))];
  }, [cuisines]);

  const toggleCuisine = (c) => {
    const next = cuisines.includes(c)
      ? cuisines.filter((x) => x !== c)
      : cuisines.length >= MAX_CUISINES
        ? cuisines
        : [...cuisines, c];
    setCuisine(next.join(', '));
  };

  const addCuisine = () => {
    const v = cuisineInput.trim();
    if (!v) return;
    if (!cuisines.includes(v) && cuisines.length >= MAX_CUISINES) return;
    toggleCuisine(v);
    setCuisineInput('');
  };

  const addConnection = (person) => {
    setParticipants((prev) => [
      ...prev,
      { name: person.preferredName || person.name, email: person.email, personId: person.id },
    ]);
  };

  // Loads a saved template's details into the form. Fields the host has already
  // filled in keep their value unless the template has one of its own.
  const applyTemplate = (tpl) => {
    if (tpl.title) setTitle(tpl.title);
    if (tpl.venueName) setVenue({ name: tpl.venueName, address: tpl.venueAddress || '' });
    if (tpl.location) setLocation(tpl.location);
    if (tpl.cuisine) setCuisine(tpl.cuisine);
    if (tpl.budget) setBudget(tpl.budget);
    if (tpl.notes) setNotes(tpl.notes);
    if (tpl.menuItems?.length) setMenuItems(tpl.menuItems);
    toast({ title: t('meal.templateApplied', { name: tpl.name }) });
  };

  // Saves whatever is in the form right now as a reusable template, so the next
  // gathering of the same kind starts pre-filled.
  const saveTemplate = async () => {
    const label = templateName.trim() || title.trim();
    if (!label) return setError(t('meal.needTemplateName'));
    setError('');
    setSavingTemplate(true);
    try {
      const saved = await base44.entities.MealTemplate.create({
        name: label,
        title: title.trim(),
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        location: location.trim(),
        cuisine: cuisine.trim(),
        budget,
        notes: notes.trim(),
        menuItems,
      });
      onTemplateSaved?.(saved);
      setTemplateName('');
      toast({ title: t('meal.templateSaved'), description: label });
    } catch (err) {
      setError(t('meal.templateSaveFailed'));
    } finally {
      setSavingTemplate(false);
    }
  };

  // A restaurant chosen with AI: its name and address are kept with the meal, and
  // its area, food type and price band fill in the rest of the form.
  const applyRestaurant = (place) => {
    if (!place?.name) return;
    setVenue({ name: place.name, address: place.address || '' });
    if (place.area || place.address) setLocation(place.area || place.address);
    if (place.cuisine) setCuisine(place.cuisine);
    if (MEAL_BUDGETS.includes(place.priceBand)) setBudget(place.priceBand);
    toast({ title: t('meal.findPicked', { name: place.name }) });
  };

  // Nothing is sent until the host has seen, in the verification dialog, exactly
  // who will be emailed and who is invited with a link to share.
  const submit = () => {
    setError('');
    if (!title.trim()) return setError(t('meal.needTitle'));
    if (participants.length < 1) return setError(t('meal.minTwo'));
    setVerifying(true);
  };

  const createMeal = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('create-meal', {
        title: title.trim(),
        proposedDate: proposedDate
          ? new Date(`${proposedDate}T${proposedTime || '18:00'}:00`).toISOString()
          : undefined,
        area: location.trim(),
        cuisine,
        budget,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        notes: notes.trim(),
        menuItems,
        participants,
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      onCreated(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('meal.createFailed'));
    } finally {
      setSaving(false);
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
      <h2 className="font-display text-base font-semibold">{t('meal.newMeal')}</h2>

      {templates.length > 0 && <QuickLoadTemplateSheet templates={templates} onApply={applyTemplate} />}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('meal.namePlaceholder')}
        aria-label={t('meal.mealName')}
        className="h-11"
        autoFocus
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="meal-date">
            {t('meal.dateLabel')}
          </label>
          <Input
            id="meal-date"
            type="date"
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="meal-time">
            {t('meal.time')}
          </label>
          <Input
            id="meal-time"
            type="time"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="meal-location">
          {t('meal.locationLabel')}
        </label>
        <Input
          id="meal-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('meal.locationPlaceholder')}
          className="h-11"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.findCuisineLabel')}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cuisineOptions.map((c) => {
            const selected = cuisines.includes(c);
            // With three already chosen the rest stay tappable-looking but dim,
            // so the allowance is visible instead of an unexplained dead tap.
            const full = !selected && cuisines.length >= MAX_CUISINES;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCuisine(c)}
                disabled={full}
                className={`px-3 h-8 rounded-full border text-xs transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 font-medium'
                    : `border-border text-muted-foreground ${full ? 'opacity-40' : ''}`
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={cuisineInput}
            onChange={(e) => setCuisineInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCuisine();
              }
            }}
            placeholder={t('meal.foodPlaceholder')}
            aria-label={t('meal.foodPlaceholder')}
            className="h-10"
          />
          <Button variant="outline" className="h-10 shrink-0" onClick={addCuisine}>
            {t('meal.add')}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="meal-budget">
          {t('meal.budgetLabel')}
        </label>
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger id="meal-budget" className="h-11" aria-label={t('meal.budgetLabel')}>
            <SelectValue placeholder={t('meal.pickOne')} />
          </SelectTrigger>
          <SelectContent>
            {MEAL_BUDGETS.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <MenuItemsInput items={menuItems} onChange={setMenuItems} />

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('meal.notesPlaceholder')}
        aria-label={t('meal.notesLabel')}
        className="min-h-[70px]"
      />

      {/* Not sure where to take everyone? The AI searches real places from the
          area, occasion, party size, food type, budget and the note above, and
          the place the host picks fills the form in. It sits after everything the
          host has told us, so the note they wrote shapes the search. */}
      {venue && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{venue.name}</p>
            {venue.address && <p className="text-xs text-muted-foreground truncate">{venue.address}</p>}
          </div>
          <button
            type="button"
            onClick={() => setVenue(null)}
            aria-label={t('meal.findRemove')}
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <Button variant="outline" className="h-10 w-full text-xs" onClick={() => setFinding(true)}>
        <Sparkles size={14} /> {t('meal.findWithAi')}
      </Button>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          {t('meal.peopleLabel')} ({participants.length})
        </p>
        {participants.length > 0 && (
          <ul className="space-y-1.5 mb-2.5">
            {participants.map((p) => (
              <li key={p.email} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setParticipants((prev) => prev.filter((x) => x.email !== p.email))}
                  aria-label={t('meal.removePerson', { name: p.name })}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[11px] text-muted-foreground">{t('meal.connectionsOnly')}</p>

        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <UserPlus size={13} /> {t('meal.fromConnections')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addConnection(p)}
                  className="px-3 h-8 rounded-full border border-border text-xs hover:border-primary/50"
                >
                  {p.preferredName || p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t('meal.saveAsTemplate')}</p>
        <div className="flex gap-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={t('meal.templateNamePlaceholder')}
            aria-label={t('meal.templateName')}
            className="h-10"
          />
          <Button variant="outline" className="h-10 shrink-0" onClick={saveTemplate} disabled={savingTemplate}>
            {savingTemplate ? t('meal.savingTemplate') : t('common.save')}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving} className="flex-1 h-11">
          {saving ? t('meal.creating') : t('meal.createAndInvite')}
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-11">
          {t('common.cancel')}
        </Button>
      </div>

      <InviteVerifyDialog
        open={verifying}
        kind="meal"
        invitees={participants.map((p) => ({ personId: p.personId, name: p.name, email: p.email }))}
        sending={saving}
        onCancel={() => setVerifying(false)}
        onConfirm={createMeal}
      />

      <FindRestaurantSheet
        open={finding}
        onClose={() => setFinding(false)}
        defaults={{ area: location, cuisine, budget, notes }}
        onPick={applyRestaurant}
      />
    </div>
  );
}