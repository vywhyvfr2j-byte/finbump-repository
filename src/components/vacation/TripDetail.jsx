import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import TripBudget from '@/components/vacation/TripBudget';
import TripItinerary from '@/components/vacation/TripItinerary';
import TripFlights from '@/components/vacation/TripFlights';
import TripHotels from '@/components/vacation/TripHotels';
import TripRentalCars from '@/components/vacation/TripRentalCars';
import TripPacking from '@/components/vacation/TripPacking';
import TripLocations from '@/components/vacation/TripLocations';
import TripGiftLink from '@/components/vacation/TripGiftLink';
import TripNotes from '@/components/vacation/TripNotes';
import TravelersPanel from '@/components/vacation/TravelersPanel';
import TripReservations from '@/components/vacation/TripReservations';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import ShareTripButton from '@/components/vacation/ShareTripButton';
import TripShareToggle from '@/components/vacation/TripShareToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const SECTIONS = [
  { key: 'notes', label: 'Notes' },
  { key: 'budget', label: 'Budget' },
  { key: 'flights', label: 'Flights' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'rentalCars', label: 'Rental cars' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'packing', label: 'Packing' },
  { key: 'locations', label: 'Locations' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'travelers', label: 'Travelers' },
  { key: 'gifts', label: 'Linked gifts' },
];

export default function TripDetail({ trip, section, setSection, onClose }) {
  const {
    people, partnerName, updateTrip,
    addTripCategory, deleteTripCategory, updateTripCategory,
    addItineraryItem, deleteItineraryItem,
    addFlight, deleteFlight, addHotel, deleteHotel,
    addRentalCar, deleteRentalCar,
    addPackingItem, togglePackingItem, deletePackingItem,
    addTripLocation, deleteTripLocation,
    toggleTripGiftLink,
    shareTripWithPartner, unshareTripWithPartner,
  } = useKeepsake();

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={trip.name}
        subtitle={trip.destination || 'Trip plan'}
        back
        right={
          <div className="flex items-center gap-0.5">
            <ShareTripButton trip={trip} />
            <button onClick={onClose} className="text-primary w-11 h-11 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
        }
      />
      <div className="px-5 mt-2">
        <div className="flex gap-1.5 mb-5">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                section === s.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <TripShareToggle
          trip={trip}
          partnerName={partnerName}
          editable={!trip._fromPartner}
          onToggle={() => (trip.sharedWithPartner ? unshareTripWithPartner(trip.id) : shareTripWithPartner(trip.id))}
        />

        {!trip._fromPartner && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked person</p>
            <Select value={trip.personId || ''} onValueChange={(v) => updateTrip(trip.id, { personId: v })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="No one (unassigned)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No one (unassigned)</SelectItem>
                {sortPeopleForPicker(people).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {section === 'notes' && <TripNotes trip={trip} editable={!trip._fromPartner} onChange={(v) => updateTrip(trip.id, { notes: v })} />}
        {section === 'budget' && (
          <TripBudget
            trip={trip}
            onAddCategory={(c) => addTripCategory(trip.id, c)}
            onUpdateCategory={(id, patch) => updateTripCategory(trip.id, id, patch)}
            onDeleteCategory={(id) => deleteTripCategory(trip.id, id)}
            onSetLimit={(v) => updateTrip(trip.id, { budgetLimit: v })}
          />
        )}
        {section === 'flights' && <TripFlights trip={trip} onAddFlight={(f) => addFlight(trip.id, f)} onDeleteFlight={(id) => deleteFlight(trip.id, id)} />}
        {section === 'hotels' && <TripHotels trip={trip} onAddHotel={(h) => addHotel(trip.id, h)} onDeleteHotel={(id) => deleteHotel(trip.id, id)} />}
        {section === 'rentalCars' && <TripRentalCars trip={trip} onAddRentalCar={(c) => addRentalCar(trip.id, c)} onDeleteRentalCar={(id) => deleteRentalCar(trip.id, id)} />}
        {section === 'itinerary' && <TripItinerary trip={trip} onAddItem={(item) => addItineraryItem(trip.id, item)} onDeleteItem={(id) => deleteItineraryItem(trip.id, id)} />}
        {section === 'packing' && (
          <TripPacking
            trip={trip}
            partnerName={partnerName}
            onAddItem={(item) => addPackingItem(trip.id, item)}
            onToggleItem={(id) => togglePackingItem(trip.id, id)}
            onDeleteItem={(id) => deletePackingItem(trip.id, id)}
          />
        )}
        {section === 'locations' && <TripLocations trip={trip} onAddLocation={(loc) => addTripLocation(trip.id, loc)} onDeleteLocation={(id) => deleteTripLocation(trip.id, id)} />}
        {section === 'travelers' && <TravelersPanel trip={trip} people={people} />}
        {section === 'reservations' && <TripReservations trip={trip} />}
        {section === 'gifts' && <TripGiftLink trip={trip} onToggleGift={(giftId) => toggleTripGiftLink(trip.id, giftId)} />}
      </div>
    </div>
  );
}