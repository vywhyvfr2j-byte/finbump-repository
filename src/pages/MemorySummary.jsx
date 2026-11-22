import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useI18n } from '@/lib/i18n/I18nContext';
import { parseMemoryDay, monthLabel } from '@/lib/memoryDates';
import TopNav from '@/components/TopNav';
import EmptyState from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import YearSummaryCard from '@/components/memory/YearSummaryCard';
import YearPhotoStrip from '@/components/memory/year/YearPhotoStrip';
import YearMonthSection from '@/components/memory/year/YearMonthSection';
import YearPersonFilter from '@/components/memory/YearPersonFilter';
import YearGalleryStrip from '@/components/memory/YearGalleryStrip';

// How far back the reflection reaches: this month and the eleven before it.
const WINDOW_MONTHS = 12;

// The last twelve months as one scroll — what the year adds up to, the pictures
// kept through it, then every month newest-first with the notes (and their
// photos) written in it. Everyone reads the moments on their own; picking a
// name reads what is already linked to that person, plus the photos saved on
// their profile.
export default function MemorySummary() {
  useFeatureTracking('memorySummary');
  useEnsureEntities(['personalNotes']);
  const { t, language } = useI18n();
  const { personalNotes, updatePersonalNote, deletePersonalNote, people } = useKeepsake();
  // Arriving from a contact's page ("See their year") opens the reflection
  // already scoped to them; an id that matches nobody falls back to Everyone.
  const requested = new URLSearchParams(window.location.search).get('person') || '';
  const [who, setWho] = useState(requested);
  const appliedRef = useRef(requested);

  // Re-read the URL whenever it changes — a second "See their year" arrival
  // lands on the right person, while picking someone in the dropdown (which
  // leaves the URL alone) is never overridden.
  useEffect(() => {
    if (appliedRef.current === requested) return;
    appliedRef.current = requested;
    setWho(requested);
  }, [requested]);

  useEffect(() => {
    if (who && people.length && !people.some((person) => String(person.id) === who)) setWho('');
  }, [who, people]);

  const pending = !Array.isArray(personalNotes);
  const notes = Array.isArray(personalNotes) ? personalNotes : [];

  // The window opens on the first day of the earliest month it covers, so a
  // moment saved on the 1st is never pushed out of it.
  const windowStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - (WINDOW_MONTHS - 1), 1);
  }, []);

  const inWindow = (note) => {
    const day = parseMemoryDay(note.memoryDate || note.created_date);
    return !Number.isNaN(day.getTime()) && day >= windowStart;
  };

  const scoped = useMemo(
    () => notes.filter((note) => (who ? String(note.personId) === who : note.type === 'memory')),
    [notes, who, windowStart]
  );

  const { months, total, photos, photoCount, monthsCovered, from, to } = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: WINDOW_MONTHS }, (_, back) => {
      const at = new Date(now.getFullYear(), now.getMonth() - back, 1);
      return {
        key: `${at.getFullYear()}-${at.getMonth()}`,
        index: at.getMonth(),
        year: at.getFullYear(),
        items: [],
      };
    });
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const photos = [];

    scoped.forEach((note) => {
      const at = note.memoryDate || note.created_date;
      const day = parseMemoryDay(at);
      // Anything older than the window still lives on the Memory Moments
      // timeline — it just isn't part of this year's reflection.
      if (Number.isNaN(day.getTime()) || day < windowStart) return;
      const bucket = byKey.get(`${day.getFullYear()}-${day.getMonth()}`);
      if (!bucket) return;
      const entry = { id: note.id, at, text: note.text || '', photos: note.photos || [], type: note.type };
      bucket.items.push(entry);
      entry.photos.filter(Boolean).forEach((uri) => photos.push({ uri, at }));
    });

    const months = buckets
      .filter((bucket) => bucket.items.length > 0)
      .map((bucket) => ({
        key: bucket.key,
        index: bucket.index,
        // Two Septembers can't collide in a twelve-month window, but the year
        // still helps when the reflection runs across a new year.
        label: `${monthLabel(bucket.index, bucket.year, language)} ${bucket.year}`,
        items: bucket.items.slice().sort((a, b) => parseMemoryDay(b.at) - parseMemoryDay(a.at)),
      }));

    const locale = language === 'es' ? 'es-ES' : 'en-US';
    const monthYear = (date) => date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });

    return {
      months,
      total: months.reduce((sum, month) => sum + month.items.length, 0),
      photos,
      photoCount: photos.length,
      monthsCovered: months.map((month) => month.index),
      from: monthYear(windowStart),
      to: monthYear(now),
    };
  }, [scoped, language, windowStart]);

  // The pictures saved on the chosen person's profile — undated, so they sit
  // beside the year rather than inside a month.
  const gallery = useMemo(() => {
    if (!who) return [];
    const person = people.find((p) => String(p.id) === who);
    if (!person) return [];
    return [...new Set((person.photos || []).filter(Boolean))].map((url) => ({
      url,
      personName: person.preferredName || person.name,
    }));
  }, [who, people]);

  // Only people who have something to show — a note tied to them inside the
  // window, or photos on their profile — so the list never leads somewhere empty.
  const filterPeople = useMemo(() => {
    const ids = new Set();
    notes.forEach((note) => {
      if (note.personId && inWindow(note)) ids.add(String(note.personId));
    });
    people.forEach((person) => {
      if ((person.photos || []).length) ids.add(String(person.id));
    });
    // Whoever we arrived with stays selectable even before they have a moment
    // to show, so the dropdown never disagrees with the view below it.
    if (who) ids.add(who);
    return people.filter((person) => ids.has(String(person.id)));
  }, [notes, people, who, windowStart]);

  const hasYear = months.length > 0;
  const nothingToShow = !hasYear && gallery.length === 0;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('memorySummary.title')} subtitle={t('memorySummary.subtitle')} back />

      <div className="px-5 mt-2">
        <YearPersonFilter people={filterPeople} value={who} onChange={setWho} />

        {pending && nothingToShow ? (
          <div className="space-y-3 mt-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : nothingToShow ? (
          <EmptyState icon={CalendarRange} title={t('memorySummary.empty')} subtitle={t('memorySummary.emptyDesc')} />
        ) : (
          <>
            {hasYear && (
              <>
                <YearSummaryCard
                  total={total}
                  photoCount={photoCount}
                  monthsCovered={monthsCovered}
                  windowLabel={t('memorySummary.window', { from, to })}
                />
                <YearPhotoStrip photos={photos} />
              </>
            )}
            {gallery.length > 0 && <YearGalleryStrip photos={gallery} />}
            <div className="mt-6">
              {months.map((month) => (
                <YearMonthSection
                  key={month.key}
                  label={month.label}
                  items={month.items}
                  onSave={updatePersonalNote}
                  onDelete={deletePersonalNote}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}