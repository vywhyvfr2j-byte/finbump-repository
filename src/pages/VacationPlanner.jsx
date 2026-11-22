import React, { useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import AITripIdeas from '@/components/vacation/AITripIdeas';
import TripAddForm from '@/components/vacation/TripAddForm';
import TripDetail from '@/components/vacation/TripDetail';
import TripList from '@/components/vacation/TripList';
import { Plus } from 'lucide-react';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import { sendTripInvites } from '@/lib/tripInvite';
import { useNavigate } from 'react-router-dom';

export default function VacationPlanner() {
  useFeatureTracking('vacation_planner');
  useEnsureEntities(['trips', 'favoriteIdeas']);
  const { t } = useI18n();
  const { trips, addTrip, deleteTrip, addEvent, people, profile, myPreferences, partnerName } = useKeepsake();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [section, setSection] = useState('budget');

  const activeTrip = trips.find((t) => t.id === activeTripId);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (!q) return;
    const match = trips.find(
      (t) => t.name.toLowerCase().includes(q.toLowerCase()) || (t.destination || '').toLowerCase().includes(q.toLowerCase())
    );
    if (match) setActiveTripId(match.id);
  }, [trips]);

  const openTrip = (trip) => {
    setActiveTripId(trip.id);
    setSection('notes');
  };

  const handleAddTrip = async (data) => {
    const tripId = 'tr' + Date.now();
    addTrip({ id: tripId, name: data.name, destination: data.destination, tripType: data.tripType, startDate: data.startDate, endDate: data.endDate, who: data.who, personId: data.personId, notes: data.notes });
    if (data.startDate) {
      addEvent({
        name: `${data.name} trip`,
        date: new Date(data.startDate).toISOString(),
        type: 'trip',
        note: data.destination ? `Trip to ${data.destination}` : '',
        reminderDays: data.reminderDays,
        tripId,
      });
    }
    setAdding(false);
    if (data.invitees?.length) {
      try {
        const r = await sendTripInvites({
          tripId,
          name: data.name,
          destination: data.destination || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          notes: data.notes || '',
          invitees: data.invitees,
        });
        toast({ title: 'Trip created', description: r?.inviteCount ? `Invitations sent to ${r.inviteCount}.` : 'Invitations sent.' });
      } catch (err) {
        toast({ title: 'Trip created', description: err?.message || 'Open the trip to invite your travelers.' });
      }
    }
  };

  if (activeTrip) {
    return <TripDetail trip={activeTrip} section={section} setSection={setSection} onClose={() => setActiveTripId(null)} />;
  }

  const partner =
    people.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase())) ||
    people.find((p) => p.name === profile?.name) ||
    people[0] ||
    null;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('vacation.title')}
        subtitle={t('vacation.subtitle')}
        back
        right={
          <button
            onClick={() => {
              setAdding(false);
              const el = document.getElementById('ai-trip-prompt');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => el?.focus(), 250);
            }}
            className="text-primary"
          >
            <Plus size={20} />
          </button>
        }
      />
      <div className="px-5 mt-2">
        <AITripIdeas
          partner={partner}
          myPreferences={myPreferences}
          people={people}
          existingTrips={trips.map((t) => (t.destination ? `${t.name} (${t.destination})` : t.name))}
          onOpenTrip={(id) => { setActiveTripId(id); setSection('budget'); }}
          onReview={(payload) => navigate('/trip-idea', { state: payload })}
          onAddManually={() => {
            setAdding(true);
            setTimeout(() => document.querySelector('input[placeholder="Trip name"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          }}
        />
        {adding && <TripAddForm people={people} onAdd={handleAddTrip} onCancel={() => setAdding(false)} />}
        <TripList trips={trips} people={people} onOpen={openTrip} onDelete={deleteTrip} />
      </div>
    </div>
  );
}