import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { locateTrip } from './importer';
import { supabase } from './supabase';
import type { NewTrip, Place, PlacePatch, Trip, TripLink, TripPatch } from './types';

type Store = {
  session: Session | null;
  authReady: boolean;
  trips: Trip[];
  loading: boolean;
  refresh: () => Promise<void>;
  createTrip: (trip: NewTrip) => Promise<Trip>;
  updateTrip: (id: string, patch: TripPatch) => Promise<void>;
  /** Owner only: deletes the trip with its links and places. */
  deleteTrip: (id: string) => Promise<void>;
  /** Places saved to each trip (removed ones too, so they can be added back), loaded when the trip is opened. */
  places: Record<string, Place[]>;
  loadPlaces: (tripId: string) => Promise<Place[]>;
  /** The posts each trip's places came from (cover and link back), loaded with the places. */
  links: Record<string, TripLink[]>;
  /** Star, choose a day or time, remove or add back a place (the planning fields members may change). */
  updatePlace: (tripId: string, placeId: string, patch: PlacePatch) => Promise<void>;
  /** Deletes every trip I own. The login stays: it is shared with Linkbox. */
  deleteMyTrips: () => Promise<number>;
  /** My display name, shown to people in trips I share (shared with Linkbox's profiles). */
  displayName: string | null;
  setDisplayName: (name: string) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = use(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

/** Trips sorted soonest first; trips already over go to the end. */
function sortTrips(trips: Trip[]) {
  const today = new Date().toISOString().slice(0, 10);
  const end = (t: Trip) => {
    const d = new Date(`${t.start_date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + t.days - 1);
    return d.toISOString().slice(0, 10);
  };
  return [...trips].sort((a, b) => {
    const pastA = end(a) < today;
    const pastB = end(b) < today;
    if (pastA !== pastB) return pastA ? 1 : -1;
    return pastA ? b.start_date.localeCompare(a.start_date) : a.start_date.localeCompare(b.start_date);
  });
}

/**
 * Deletes the post covers of these trips from storage. Deleting a trip cascades through its rows but can't reach
 * storage, so this runs first. Only the owner deletes trips, and members may delete their trip's covers.
 */
async function removeCovers(tripIds: string[]) {
  for (const id of tripIds) {
    const bucket = supabase.storage.from('trip-covers');
    const { data } = await bucket.list(id, { limit: 1000 });
    if (data?.length) await bucket.remove(data.map((f) => `${id}/${f.name}`));
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, Place[]>>({});
  const [links, setLinks] = useState<Record<string, TripLink[]>>({});
  const userId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, profile] = await Promise.all([
        supabase.from('trips').select('*, trip_places(count)').eq('trip_places.removed', false),
        supabase.from('profiles').select('display_name').maybeSingle(),
      ]);
      if (t.error) throw t.error;
      const rows = (t.data as (Trip & { trip_places: { count: number }[] })[]).map(({ trip_places, ...trip }) => ({
        ...trip,
        place_count: trip_places?.[0]?.count ?? 0,
      }));
      setTrips(sortTrips(rows));
      setDisplayNameState((profile.data?.display_name as string | undefined) ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  // INITIAL_SESSION fires on subscribe, so this also covers app start.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthReady(true);
      const id = s?.user.id ?? null;
      if (id === userId.current) return; // token refresh, same user
      userId.current = id;
      setTrips([]);
      setPlaces({});
      setLinks({});
      // Supabase calls inside this callback can deadlock the auth lock, so defer.
      if (id) setTimeout(() => void refresh().catch(() => {}), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const createTrip = useCallback(async (trip: NewTrip) => {
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...trip, name: trip.name.trim(), city: trip.city.trim() })
      .select()
      .single();
    if (error) throw error;
    const created = { ...(data as Trip), place_count: 0 };
    setTrips((prev) => sortTrips([...prev, created]));
    // Start each day from the city centre until the traveller sets a hotel (needs Google, so the function does it).
    void locateTrip(created.id)
      .then(({ hotel }) =>
        setTrips((prev) => prev.map((t) => (t.id === created.id ? { ...t, hotel_name: hotel.name, hotel_lat: hotel.lat, hotel_lng: hotel.lng } : t))),
      )
      .catch(() => {});
    return created;
  }, []);

  const updateTrip = useCallback(async (id: string, patch: TripPatch) => {
    const { data, error } = await supabase.from('trips').update(patch).eq('id', id).select().single();
    if (error) throw error;
    setTrips((prev) => sortTrips(prev.map((t) => (t.id === id ? { ...t, ...(data as Trip) } : t))));
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    // RLS lets only the owner delete; a member's delete matches no row, so check that it happened.
    await removeCovers([id]);
    const { data, error } = await supabase.from('trips').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('Only the person who created this trip can delete it.');
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadPlaces = useCallback(async (tripId: string) => {
    const [{ data, error }, linkRows] = await Promise.all([
      supabase.from('trip_places').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('trip_links').select('id, trip_id, url, platform, title, author, cover_path').eq('trip_id', tripId),
    ]);
    if (error) throw error;
    if (linkRows.data) setLinks((prev) => ({ ...prev, [tripId]: linkRows.data as TripLink[] }));
    const rows = data as Place[];
    setPlaces((prev) => ({ ...prev, [tripId]: rows }));
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, place_count: rows.filter((p) => !p.removed).length } : t)));
    return rows;
  }, []);

  const updatePlace = useCallback(async (tripId: string, placeId: string, patch: PlacePatch) => {
    const { error } = await supabase.from('trip_places').update(patch).eq('id', placeId);
    if (error) throw error;
    setPlaces((prev) => ({ ...prev, [tripId]: (prev[tripId] ?? []).map((p) => (p.id === placeId ? { ...p, ...patch } : p)) }));
  }, []);

  const deleteMyTrips = useCallback(async () => {
    const me = userId.current;
    if (!me) return 0;
    const { data: owned } = await supabase.from('trips').select('id').eq('owner_id', me);
    await removeCovers((owned ?? []).map((t) => t.id as string));
    const { data, error } = await supabase.from('trips').delete().eq('owner_id', me).select('id');
    if (error) throw error;
    await refresh();
    return data?.length ?? 0;
  }, [refresh]);

  const setDisplayName = useCallback(async (name: string) => {
    const clean = name.trim().slice(0, 40);
    if (!clean) throw new Error('Enter a name.');
    const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', userId.current ?? '');
    if (error) throw error;
    setDisplayNameState(clean);
  }, []);

  const value = useMemo<Store>(
    () => ({
      session,
      authReady,
      trips,
      loading,
      refresh,
      createTrip,
      updateTrip,
      deleteTrip,
      places,
      loadPlaces,
      links,
      updatePlace,
      deleteMyTrips,
      displayName,
      setDisplayName,
    }),
    [session, authReady, trips, loading, refresh, createTrip, updateTrip, deleteTrip, places, loadPlaces, links, updatePlace, deleteMyTrips, displayName, setDisplayName],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}
