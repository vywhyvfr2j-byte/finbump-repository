import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cake } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';
import OccasionsSummary from '@/components/occasions/OccasionsSummary';
import OccasionMonthSection from '@/components/occasions/OccasionMonthSection';
import OccasionCardPicker from '@/components/occasions/OccasionCardPicker';
import OccasionGiftSheet from '@/components/occasions/OccasionGiftSheet';
import { useUpcomingOccasions } from '@/hooks/useUpcomingOccasions';
import { useUpcomingRemembrances } from '@/hooks/useUpcomingRemembrances';
import RemembranceSection from '@/components/occasions/RemembranceSection';
import { cardBuilderLink } from '@/lib/cardBuilderLink';
import { occasionLabel } from '@/lib/occasionDisplay';
import { useI18n } from '@/lib/i18n/I18nContext';

// Month Ahead — a scrollable dashboard of every upcoming birthday, anniversary
// and pet Gotcha Day, grouped by month, so the weeks ahead can be planned in one
// place. Tapping a row opens tailored card messages; the mail shortcut jumps
// straight into the Card Builder for that person and occasion.
export default function Occasions() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const occasions = useUpcomingOccasions();
  const remembrances = useUpcomingRemembrances();
  const [cardOccasion, setCardOccasion] = useState(null);
  const [giftOccasion, setGiftOccasion] = useState(null);

  const groups = useMemo(() => {
    const now = new Date();
    const map = new Map();
    occasions.forEach((o) => {
      const key = `${o.date.getFullYear()}-${o.date.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: o.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          isCurrentMonth:
            o.date.getFullYear() === now.getFullYear() && o.date.getMonth() === now.getMonth(),
          items: [],
        });
      }
      map.get(key).items.push(o);
    });
    return [...map.values()];
  }, [occasions]);

  const sendCard = (o) =>
    navigate(
      cardBuilderLink({
        personId: o.personId,
        personName: o.name,
        occasion: o.occasion === 'birthday' ? 'birthday' : 'anniversary',
      })
    );

  const pickerReminder = cardOccasion && {
    name: cardOccasion.name,
    occasion: occasionLabel(cardOccasion.occasion, t),
    relation: cardOccasion.relation,
    ageTurning: cardOccasion.occasion === 'birthday' ? cardOccasion.years : null,
    yearsTogether: cardOccasion.occasion === 'birthday' ? null : cardOccasion.years,
    notes: cardOccasion.notes,
    likes: cardOccasion.likes,
    species: cardOccasion.species,
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('occasions.title')}
        subtitle={t('occasions.subtitle')}
        back
        backTo="/"
      />

      {occasions.length === 0 && remembrances.length === 0 ? (
        <EmptyState
          icon={Cake}
          title={t('occasions.empty')}
          subtitle={t('occasions.emptyDesc')}
          action={<Button onClick={() => navigate('/people')}>{t('occasions.addConnection')}</Button>}
        />
      ) : (
        <>
          {occasions.length > 0 && (
            <div className="px-5 mt-2">
              <OccasionsSummary occasions={occasions} />
            </div>
          )}
          {groups.length > 0 && (
            <div className="px-5 mt-5 space-y-5">
              {groups.map((group) => (
                <OccasionMonthSection
                  key={group.key}
                  group={group}
                  onOpenCards={setCardOccasion}
                  onSendCard={sendCard}
                  onSendGift={setGiftOccasion}
                />
              ))}
            </div>
          )}
          {remembrances.length > 0 && (
            <div className="px-5 mt-6">
              <RemembranceSection remembrances={remembrances} />
            </div>
          )}
        </>
      )}

      <OccasionCardPicker
        reminder={pickerReminder}
        open={!!cardOccasion}
        onOpenChange={(o) => !o && setCardOccasion(null)}
      />
      <OccasionGiftSheet
        occasion={giftOccasion}
        open={!!giftOccasion}
        onOpenChange={(o) => !o && setGiftOccasion(null)}
      />
    </div>
  );
}