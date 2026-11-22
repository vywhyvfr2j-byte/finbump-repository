import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MenuItemsInput from '@/components/meals/MenuItemsInput';
import { MEAL_BUDGETS } from '@/lib/mealConstants';

// Create or edit one reusable gathering template. `template` is null for a new one.
export default function MealTemplateEditor({ template, onSaved, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: template?.name || '',
    title: template?.title || '',
    venueName: template?.venueName || '',
    venueAddress: template?.venueAddress || '',
    location: template?.location || '',
    cuisine: template?.cuisine || '',
    budget: template?.budget || '',
    notes: template?.notes || '',
    menuItems: template?.menuItems || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) return setError(t('meal.needTemplateName'));
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim(),
        venueName: form.venueName.trim(),
        venueAddress: form.venueAddress.trim(),
        location: form.location.trim(),
        cuisine: form.cuisine.trim(),
        budget: form.budget,
        notes: form.notes.trim(),
        menuItems: form.menuItems,
      };
      const saved = template?.id
        ? await base44.entities.MealTemplate.update(template.id, payload)
        : await base44.entities.MealTemplate.create(payload);
      onSaved(saved);
    } catch {
      setError(t('meal.templateSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
      <Input
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder={t('meal.templateNamePlaceholder')}
        aria-label={t('meal.templateName')}
        className="h-10"
        autoFocus
      />
      <Input
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder={t('meal.namePlaceholder')}
        aria-label={t('meal.templateTitle')}
        className="h-10"
      />
      <Input
        value={form.venueName}
        onChange={(e) => set('venueName', e.target.value)}
        placeholder={t('meal.venuePlaceholder')}
        aria-label={t('meal.venue')}
        className="h-10"
      />
      <Input
        value={form.venueAddress}
        onChange={(e) => set('venueAddress', e.target.value)}
        placeholder={t('meal.addressPlaceholder')}
        aria-label={t('meal.venueAddress')}
        className="h-10"
      />
      <Input
        value={form.location}
        onChange={(e) => set('location', e.target.value)}
        placeholder={t('meal.locationPlaceholder')}
        aria-label={t('meal.locationLabel')}
        className="h-10"
      />
      <Input
        value={form.cuisine}
        onChange={(e) => set('cuisine', e.target.value)}
        placeholder={t('meal.foodPlaceholder')}
        aria-label={t('meal.cuisineLabel')}
        className="h-10"
      />
      <Select value={form.budget} onValueChange={(v) => set('budget', v)}>
        <SelectTrigger className="h-10" aria-label={t('meal.budgetLabel')}>
          <SelectValue placeholder={t('meal.budgetLabel')} />
        </SelectTrigger>
        <SelectContent>
          {MEAL_BUDGETS.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MenuItemsInput items={form.menuItems} onChange={(v) => set('menuItems', v)} />

      <Textarea
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder={t('meal.notesPlaceholder')}
        aria-label={t('meal.notesLabel')}
        className="min-h-[60px]"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1 h-10">
          {saving ? t('meal.savingTemplate') : t('common.save')}
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-10">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}