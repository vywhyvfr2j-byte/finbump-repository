import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import MyPersonalNeeds from '@/components/prayer/MyPersonalNeeds';
import CareCard from '@/components/prayer/CareCard';
import CareAddForm from '@/components/prayer/CareAddForm';
import CareEmptyState from '@/components/prayer/CareEmptyState';
import PrayerTabBar from '@/components/prayer/PrayerTabBar';
import { Plus, X } from 'lucide-react';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { sortPeopleForPicker, sortPetsForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

const CHECK_IN_FIELDS = { prayer: 'lastPrayedAt', health: 'lastHealthCheckIn', other: 'lastOtherCheckIn' };

export default function Prayer() {
  useFeatureTracking('prayer');
  useEnsureEntities(['personalNeeds']);
  const { t } = useI18n();
  const { people, updatePerson, addPerson, pets, updatePet } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();

  const contacts = [
    ...sortPeopleForPicker(people).map((p) => ({ ...p, kind: 'person' })),
    ...sortPetsForPicker(pets).map((p) => ({ ...p, kind: 'pet' })),
  ];
  const updateContact = (contact, patch) =>
    contact.kind === 'pet' ? updatePet(contact.id, patch) : updatePerson(contact.id, patch);
  const updateContactById = (id, patch) => {
    const contact = contacts.find((c) => c.id === id);
    if (contact) updateContact(contact, patch);
  };

  const [tab, setTab] = useState('prayer');
  const [adding, setAdding] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const prayerPeople = contacts.filter((p) => p.prayerEnabled);
  const healthPeople = contacts.filter((p) => p.healthReminderDays > 0 || (p.healthNotes && p.healthNotes.trim()));
  const otherPeople = contacts.filter((p) => p.otherReminderDays > 0 || (p.otherNotes && p.otherNotes.trim()));

  const handleCheckIn = (person) => {
    updateContact(person, { [CHECK_IN_FIELDS[tab]]: new Date().toISOString() });
  };

  const handleDeleteCare = async (person) => {
    const label = tab === 'prayer' ? 'prayer request' : tab === 'health' ? 'health check-in' : 'reminder';
    const answer = await confirm({
      title: `Remove this ${label}?`,
      description: `Reminders for ${person.name} will stop. Their other notes and dates stay.`,
      confirmLabel: 'Remove',
    });
    if (!answer) return;
    const clear = tab === 'prayer'
      ? { prayerEnabled: false, prayerReminderDays: 0, prayerNames: '', prayerReason: '', prayerReminderEndDate: null }
      : tab === 'health'
        ? { healthReminderDays: 0, healthNotes: '', healthReminderEndDate: null }
        : { otherReminderDays: 0, otherNotes: '', otherReminderEndDate: null };
    updateContact(person, clear);
  };

  const switchTab = (t) => { setAdding(false); setTab(t); };

  const currentPeople = tab === 'prayer' ? prayerPeople : tab === 'health' ? healthPeople : otherPeople;
  const addButtonLabel = tab === 'prayer' ? t('prayer.addPrayer') : tab === 'health' ? t('prayer.addHealth') : t('prayer.addReminder');
  const dashedButtonLabel = tab === 'prayer' ? t('prayer.addPrayerRequest') : tab === 'health' ? t('prayer.addHealthCheckIn') : t('prayer.addReminderDashed');
  const emptyMessages = {
    prayer: [t('prayer.empty.prayer.0'), t('prayer.empty.prayer.1')],
    health: [t('prayer.empty.health.0'), t('prayer.empty.health.1')],
    other: [t('prayer.empty.other.0'), t('prayer.empty.other.1')],
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('prayer.title')}
        back
        right={
          <button onClick={() => setAdding((v) => !v)} aria-label={adding ? t('prayer.closeAria') : t('prayer.addAria')} className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors">
            {adding ? <X size={20} /> : <Plus size={20} />}
          </button>
        }
      />
      <div className="px-5 pt-4">
        <PrayerTabBar tab={tab} onSwitch={switchTab} />

        {tab !== 'mine' && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium mb-4 hover:bg-primary/5 transition-colors"
          >
            <Plus size={16} /> {dashedButtonLabel}
          </button>
        )}

        {(adding || editingPerson) && tab !== 'mine' && (
          <CareAddForm
            tab={tab}
            availablePeople={contacts}
            editPerson={editingPerson}
            onUpdateExisting={(id, payload) => { updateContactById(id, payload); setAdding(false); setEditingPerson(null); }}
            onAddNew={(payload) => { addPerson(payload); setAdding(false); }}
            onCancel={() => { setAdding(false); setEditingPerson(null); }}
          />
        )}

        {tab === 'mine' ? (
          <MyPersonalNeeds />
        ) : currentPeople.length === 0 && !adding ? (
          <CareEmptyState
            message={emptyMessages[tab][0]}
            submessage={emptyMessages[tab][1]}
            onAdd={() => setAdding(true)}
            addButtonLabel={addButtonLabel}
          />
        ) : (
          <div className="rounded-2xl border px-4 py-4 shadow-card space-y-3 ks-card-tint">
            {currentPeople.map((person) => (
              <CareCard
                key={person.id}
                person={person}
                tab={tab}
                onCheckIn={handleCheckIn}
                onEdit={(p) => setEditingPerson(p)}
                onDelete={handleDeleteCare}
              />
            ))}
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}