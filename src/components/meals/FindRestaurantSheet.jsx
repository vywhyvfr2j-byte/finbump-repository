import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MEAL_BUDGETS, MEAL_CUISINES } from '@/lib/mealConstants';
import { Sparkles, MapPin, Utensils, Loader2, Star } from 'lucide-react';

// Asks the AI where to eat: the host gives a neighborhood or an address, what the
// gathering is for, how many are coming, the food type, the budget and anything
// else that matters. Web search runs server-side, so every place named is real.
// Choosing one hands it back to the meal form to fill in.
export default function FindRestaurantSheet({ open, onClose, defaults = {}, onPick }) {
  const { t } = useI18n();
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [occasion, setOccasion] = useState('');
  const [partySize, setPartySize] = useState('4');
  const [cuisines, setCuisines] = useState([]);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Each time it opens, start from whatever the meal form already knows — the
  // note included, so an ask like "outdoor dining" or "margaritas" written with
  // the meal shapes the search without being typed again here.
  useEffect(() => {
    if (!open) return;
    setArea(defaults.area || '');
    // The meal form can hold up to three food types in that one value.
    setCuisines(
      defaults.cuisine
        ? defaults.cuisine.split(',').map((c) => c.trim()).filter(Boolean).slice(0, 3)
        : [],
    );
    setBudget(defaults.budget || '');
    setNotes(defaults.notes || '');
    setError('');
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleCuisine = (c) => {
    setCuisines((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      return prev.length >= 3 ? prev : [...prev, c];
    });
  };

  const search = async () => {
    if (!area.trim() && !address.trim()) {
      setError(t('meal.findNeedWhere'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('suggest-restaurants', {
        area: area.trim(),
        address: address.trim(),
        occasion: occasion.trim(),
        partySize: Number(partySize) || 0,
        cuisines,
        budget,
        notes: notes.trim(),
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('meal.findFailed'));
    } finally {
      setLoading(false);
    }
  };

  const options = result?.options || [];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose?.(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <Sparkles size={17} /> {t('meal.findTitle')}
          </SheetTitle>
          <SheetDescription className="text-left">{t('meal.findDesc')}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-area">
              {t('meal.findArea')}
            </label>
            <Input
              id="find-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={t('meal.findAreaPlaceholder')}
              className="h-11"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-address">
              {t('meal.findAddress')}
            </label>
            <Input
              id="find-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('meal.findAddressPlaceholder')}
              className="h-11"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-occasion">
              {t('meal.findOccasion')}
            </label>
            <Input
              id="find-occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder={t('meal.findOccasionPlaceholder')}
              className="h-11"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-party">
                {t('meal.findPartySize')}
              </label>
              <Input
                id="find-party"
                type="number"
                min="1"
                max="30"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-budget">
                {t('meal.budgetLabel')}
              </label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger id="find-budget" className="h-11" aria-label={t('meal.budgetLabel')}>
                  <SelectValue placeholder={t('meal.pickOne')} />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_BUDGETS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.findCuisineLabel')}</p>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_CUISINES.slice(0, 12).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cuisines.includes(c)}
                  onClick={() => toggleCuisine(c)}
                  className={`px-3 h-8 rounded-full border text-xs transition-colors ${
                    cuisines.includes(c) ? 'border-primary bg-primary/10 font-medium' : 'border-border text-muted-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="find-notes">
              {t('meal.findNotes')}
            </label>
            <Textarea
              id="find-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('meal.findNotesPlaceholder')}
              className="min-h-[64px]"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={search} disabled={loading} className="h-11 w-full">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('meal.findSearching')}
              </>
            ) : (
              t('meal.findSearch')
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-5 space-y-3 pb-6">
            {result.summary && <p className="text-xs text-muted-foreground">{result.summary}</p>}
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('meal.findOptions')}
            </p>

            {options.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('meal.findFailed')}</p>
            )}

            {options.map((o, i) => (
              <div key={`${o.name}-${i}`} className="rounded-2xl border border-border bg-card p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-tight">{o.name}</p>
                  {o.priceBand && (
                    <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 shrink-0">{o.priceBand}</span>
                  )}
                </div>
                {o.address && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MapPin size={13} className="mt-0.5 shrink-0" /> {o.address}
                  </p>
                )}
                {(o.cuisine || o.area) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Utensils size={13} /> {[o.cuisine, o.area].filter(Boolean).join(' · ')}
                  </p>
                )}
                {/* The ratings the host checks a place against, so an option is
                    judged on how it is actually rated, not just on the pitch. */}
                {(o.yelpRating || o.googleRating) && (
                  <div className="flex flex-wrap gap-1.5">
                    {o.yelpRating && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        <Star size={10} /> {t('meal.ratingYelp')} {o.yelpRating}
                      </span>
                    )}
                    {o.googleRating && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        <Star size={10} /> {t('meal.ratingGoogle')} {o.googleRating}
                      </span>
                    )}
                  </div>
                )}
                {o.why && <p className="text-xs leading-relaxed">{o.why}</p>}
                {o.goodFor && <p className="text-[11px] text-muted-foreground">{o.goodFor}</p>}
                {o.reserveTip && <p className="text-[11px] text-muted-foreground">{o.reserveTip}</p>}
                <Button
                  variant="outline"
                  className="h-10 w-full mt-1"
                  onClick={() => { onPick?.(o); onClose?.(); }}
                >
                  {t('meal.findUse')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}