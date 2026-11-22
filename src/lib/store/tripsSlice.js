// #9: Trips domain slice — extracted from keepsakeStore.jsx.
import { useCallback } from 'react';

export function useTripsSlice({ setState, entities, refs }) {
  const { tripsRef, savedTripsRef, prevSharedRef } = refs;

  const addTrip = useCallback((trip) => {
    setState((s) => ({
      ...s,
      trips: [{ id: 'tr' + Date.now(), categories: [], itinerary: [], flights: [], hotels: [], packingList: [], linkedGiftIds: [], locations: [], ...trip }, ...s.trips],
    }));
  }, []);

  const updateTrip = useCallback((tripId, patch) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)) }));
  }, []);

  const deleteTrip = useCallback((tripId) => {
    const t = tripsRef.current.find((x) => x.id === tripId);
    if (t?.backendId && !t._fromPartner) entities.Trip.delete(t.backendId).catch(() => {});
    delete savedTripsRef.current[tripId];
    delete prevSharedRef.current[tripId];
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== tripId) }));
  }, []);

  const shareTripWithPartner = useCallback((tripId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, sharedWithPartner: true } : t)) }));
  }, []);

  const unshareTripWithPartner = useCallback((tripId) => {
    const t = tripsRef.current.find((x) => x.id === tripId);
    // Revoke the stored trip too: switching the toggle off must actually stop
    // the partner seeing it. The row stays (readable only by its owner), so
    // switching sharing back on just flips the flag again.
    if (t?.backendId && !t._fromPartner) entities.Trip.update(t.backendId, { shared: false }).catch(() => {});
    delete savedTripsRef.current[tripId];
    prevSharedRef.current[tripId] = false;
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, sharedWithPartner: false } : t)) }));
  }, []);

  const addTripCategory = useCallback((tripId, category) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, categories: [...t.categories, { id: 'tc' + Date.now(), ...category }] } : t)) }));
  }, []);

  const updateTripCategory = useCallback((tripId, categoryId, patch) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, categories: t.categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)) } : t)) }));
  }, []);

  const deleteTripCategory = useCallback((tripId, categoryId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, categories: t.categories.filter((c) => c.id !== categoryId) } : t)) }));
  }, []);

  const addItineraryItem = useCallback((tripId, item) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, itinerary: [...t.itinerary, { id: 'it' + Date.now(), ...item }] } : t)) }));
  }, []);

  const deleteItineraryItem = useCallback((tripId, itemId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, itinerary: t.itinerary.filter((i) => i.id !== itemId) } : t)) }));
  }, []);

  const addFlight = useCallback((tripId, flight) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, flights: [...(t.flights || []), { id: 'fl' + Date.now(), ...flight }] } : t)) }));
  }, []);

  const deleteFlight = useCallback((tripId, flightId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, flights: (t.flights || []).filter((f) => f.id !== flightId) } : t)) }));
  }, []);

  const addHotel = useCallback((tripId, hotel) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, hotels: [...(t.hotels || []), { id: 'ht' + Date.now(), ...hotel }] } : t)) }));
  }, []);

  const deleteHotel = useCallback((tripId, hotelId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, hotels: (t.hotels || []).filter((h) => h.id === hotelId) } : t)) }));
  }, []);

  const addRentalCar = useCallback((tripId, car) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, rentalCars: [...(t.rentalCars || []), { id: 'rc' + Date.now(), ...car }] } : t)) }));
  }, []);

  const deleteRentalCar = useCallback((tripId, carId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, rentalCars: (t.rentalCars || []).filter((c) => c.id !== carId) } : t)) }));
  }, []);

  const addPackingItem = useCallback((tripId, item) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, packingList: [...(t.packingList || []), { id: 'pk' + Date.now(), packed: false, ...item }] } : t)) }));
  }, []);

  const togglePackingItem = useCallback((tripId, itemId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, packingList: (t.packingList || []).map((p) => (p.id === itemId ? { ...p, packed: !p.packed } : p)) } : t)) }));
  }, []);

  const deletePackingItem = useCallback((tripId, itemId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, packingList: (t.packingList || []).filter((p) => p.id !== itemId) } : t)) }));
  }, []);

  const addTripLocation = useCallback((tripId, location) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, locations: [...(t.locations || []), { id: 'tl' + Date.now(), ...location }] } : t)) }));
  }, []);

  const deleteTripLocation = useCallback((tripId, locationId) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, locations: (t.locations || []).filter((l) => l.id !== locationId) } : t)) }));
  }, []);

  const toggleTripGiftLink = useCallback((tripId, giftId) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => (t.id === tripId ? { ...t, linkedGiftIds: t.linkedGiftIds.includes(giftId) ? t.linkedGiftIds.filter((id) => id !== giftId) : [...t.linkedGiftIds, giftId] } : t)),
    }));
  }, []);

  return {
    addTrip, updateTrip, deleteTrip,
    addTripCategory, updateTripCategory, deleteTripCategory,
    addItineraryItem, deleteItineraryItem,
    addFlight, deleteFlight,
    addHotel, deleteHotel,
    addRentalCar, deleteRentalCar,
    addPackingItem, togglePackingItem, deletePackingItem,
    addTripLocation, deleteTripLocation,
    toggleTripGiftLink,
    shareTripWithPartner, unshareTripWithPartner,
  };
}