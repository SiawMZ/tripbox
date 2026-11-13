import { fetchDetails } from './importer';
import { insertCheapest, planOneDay, planTrip, timeDay, type DayPlan, type OpeningPeriod, type PlanPlace, type TripInput } from './planner';
import { supabase } from './supabase';
import type { Place, Trip } from './types';

/**
 * Opening hours are Google content: fetched live when planning and kept only in memory for this visit
 * (docs/google-maps-terms.md). Keyed by Google place id; `null` = Google has no hours (treated as always open).
 */
const hoursCache = new Map<string, OpeningPeriod[] | null>();

export type ShownPlan = {
  /** Never optimized: the app offers "Plan my days" instead of empty days. */
  unplanned: boolean;
  /**
   * Whether this visit has the opening hours of every planned place. Without them the times assume each place is
   * open (hours are never stored, so after a restart they come back only with "Plan my days").
   */
  hoursChecked: boolean;
  days: DayPlan[];
  maybe: { place: Place; reason: string }[];
};

const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);

/** A saved place as the planner sees it. Places without coordinates (expired) can't be planned. */
function toPlanPlace(p: Place): PlanPlace | null {
  if (p.lat == null || p.lng == null) return null;
  return {
    key: p.id,
    googleId: p.google_place_id,
    name: p.name,
    nameLocal: p.name_local ?? undefined,
    type: p.type,
    area: p.area ?? undefined,
    lat: p.lat,
    lng: p.lng,
    mapsUrl: p.maps_url ?? undefined,
    periods: hoursCache.get(p.google_place_id) ?? undefined,
    must: p.must,
    // A chosen day without a time keeps the place on that day; with a time it's a pin (below).
    day: p.fixed_day && !p.fixed_time ? p.fixed_day : undefined,
  };
}

/** Where days start: the trip's hotel, or the middle of its places until one is set. */
export function startPoint(trip: Trip, places: Place[]) {
  if (trip.hotel_lat != null && trip.hotel_lng != null) return { name: trip.hotel_name ?? trip.city, lat: trip.hotel_lat, lng: trip.hotel_lng };
  const located = places.filter((p) => !p.removed && p.lat != null && p.lng != null);
  if (!located.length) return null;
  return {
    name: 'the middle of your places (set your hotel in Trip)',
    lat: located.reduce((s, p) => s + p.lat!, 0) / located.length,
    lng: located.reduce((s, p) => s + p.lng!, 0) / located.length,
  };
}

export function tripInput(trip: Trip, places: Place[]): TripInput {
  const active = places.filter((p) => !p.removed);
  return {
    startDate: trip.start_date,
    days: trip.days,
    hotel: startPoint(trip, places) ?? { name: trip.city, lat: 0, lng: 0 },
    dayStart: hhmm(trip.day_start) ?? '09:00',
    dayEnd: hhmm(trip.day_end) ?? '22:00',
    maxMealsPerDay: trip.max_meals,
    maxPlacesPerDay: trip.max_places ?? undefined,
    travelMode: trip.travel_mode,
    places: active.map(toPlanPlace).filter((p): p is PlanPlace => !!p),
    pins: active
      .filter((p) => p.fixed_day && p.fixed_time && p.fixed_day <= trip.days)
      .map((p) => ({ key: p.id, day: p.fixed_day!, time: hhmm(p.fixed_time)! })),
  };
}

/** The saved plan, timed again from the saved order (so everyone in the trip sees the same days). */
export function shownPlan(trip: Trip, places: Place[]): ShownPlan {
  const input = tripInput(trip, places);
  const byKey = new Map(input.places.map((p) => [p.key, p]));
  const active = places.filter((p) => !p.removed);
  const days = Array.from({ length: trip.days }, (_, i) => {
    const ordered = active
      .filter((p) => p.plan_day === i + 1 && byKey.has(p.id))
      .sort((a, b) => (a.plan_pos ?? 0) - (b.plan_pos ?? 0))
      .map((p) => byKey.get(p.id)!);
    return timeDay(input, i + 1, ordered);
  });
  const planned = new Set(days.flatMap((d) => d.stops.map((s) => s.key)));
  const maybe = active
    .filter((p) => !planned.has(p.id))
    .map((p) => ({
      place: p,
      reason: !byKey.has(p.id)
        ? 'Location not loaded yet: press Plan my days again'
        : p.plan_day && p.plan_day > trip.days
          ? `Was on day ${p.plan_day}; the trip is shorter now`
          : (p.plan_reason ?? (trip.planned_at ? 'Added after the last plan' : '')),
    }));
  const hoursChecked = days.every((d) => d.stops.every((x) => !!x.googleId && hoursCache.has(x.googleId)));
  return { unplanned: !trip.planned_at, hoursChecked, days, maybe };
}

type SavedStop = { id: string; day: number | null; pos: number | null; reason: string | null };

async function save(tripId: string, stops: SavedStop[]) {
  const { error } = await supabase.rpc('trip_save_plan', { p_trip: tripId, p_stops: stops });
  if (error) throw error;
}

function toSaved(days: DayPlan[], maybe: { key: string; reason: string }[]): SavedStop[] {
  return [
    ...days.flatMap((d) => d.stops.map((s, i) => ({ id: s.key, day: d.day, pos: i, reason: null }))),
    ...maybe.map((m) => ({ id: m.key, day: null, pos: null, reason: m.reason.slice(0, 200) })),
  ];
}

/**
 * Fetches opening hours for the places that don't have them in memory yet (one Google call each), in groups of
 * 60, the function's limit per call. Returns how many places still have no coordinates.
 */
async function loadHours(tripId: string, places: Place[]) {
  const missing = [...new Set(places.filter((p) => !p.removed && !hoursCache.has(p.google_place_id)).map((p) => p.google_place_id))];
  for (let i = 0; i < missing.length; i += 60) {
    const got = await fetchDetails(tripId, missing.slice(i, i + 60), ['hours']);
    for (const id of missing.slice(i, i + 60)) {
      const h = got[id]?.hours;
      hoursCache.set(id, Array.isArray(h) && h.length ? (h as OpeningPeriod[]) : null);
    }
  }
  return missing.length;
}

/**
 * "Plan my days": fetch opening hours, run the planner over every place, save the result for the whole trip.
 * `reload` reloads the places afterwards (the function may have refreshed expired coordinates).
 */
export async function optimize(trip: Trip, places: Place[], reload: () => Promise<Place[]>) {
  const fetched = await loadHours(trip.id, places);
  // Fetching hours also refreshes coordinates older than 25 days; read them again before planning.
  const fresh = fetched && places.some((p) => p.lat == null) ? await reload() : places;
  const plan = planTrip(tripInput(trip, fresh));
  const inPlan = new Set([...plan.days.flatMap((d) => d.stops.map((s) => s.key)), ...plan.maybe.map((m) => m.key)]);
  const noCoords = fresh.filter((p) => !p.removed && !inPlan.has(p.id)).map((p) => ({ key: p.id, reason: 'Location not loaded: try again later' }));
  await save(trip.id, toSaved(plan.days, [...plan.maybe, ...noCoords]));
  await reload();
}

/** The plan as it is now, in the shape the database saves. */
function current(trip: Trip, places: Place[]) {
  const shown = shownPlan(trip, places);
  return { shown, maybe: shown.maybe.map((m) => ({ key: m.place.id, reason: m.reason })) };
}

/**
 * Drag a stop (or a Maybe place) onto a day: it stays on that day from now on (also when re-planning), it is fitted
 * into that day and the day it came from just closes the gap. A booked time moves with the place. No Google call.
 */
export async function moveToDay(trip: Trip, places: Place[], placeId: string, day: number) {
  const place = places.find((p) => p.id === placeId);
  if (!place) return;
  const { error } = await supabase.from('trip_places').update({ fixed_day: day, must: true }).eq('id', placeId);
  if (error) throw error;
  const moved = places.map((p) => (p.id === placeId ? { ...p, fixed_day: day, must: true } : p));
  const input = tripInput(trip, moved);
  const { shown, maybe } = current(trip, moved);
  const target = input.places.find((p) => p.key === placeId);
  if (!target) return;
  const days = shown.days.map((d) => ({ ...d, stops: d.stops.filter((s) => s.key !== placeId) }));
  days[day - 1] = fitDay(input, day, days[day - 1].stops, [target]);
  await save(trip.id, toSaved(days, maybe.filter((m) => m.key !== placeId)));
}

/** ✕ on a stop: off this trip (the Places tab can add it back); the rest of its day closes the gap. */
export async function removeFromPlan(trip: Trip, places: Place[], placeId: string) {
  const { error } = await supabase.from('trip_places').update({ removed: true }).eq('id', placeId);
  if (error) throw error;
  const { shown, maybe } = current(trip, places);
  const days = shown.days.map((d) => ({ ...d, stops: d.stops.filter((s) => s.key !== placeId) }));
  await save(trip.id, toSaved(days, maybe.filter((m) => m.key !== placeId)));
}

/**
 * Fits places the traveller put on a day into it. With every place's opening hours in memory (after "Plan my days"
 * in this visit) the day is re-ordered around them; what can't fit (closed, or past the end of the day) still stays,
 * at the end, because the traveller chose it. Without hours, each place goes where it adds the least travel and
 * the rest of the day keeps its order: no Google call.
 */
function fitDay(input: TripInput, day: number, stops: PlanPlace[], adding: PlanPlace[]): DayPlan {
  const all = [...stops, ...adding];
  if (all.every((p) => !!p.googleId && hoursCache.has(p.googleId))) {
    const { plan, left } = planOneDay(input, day, all);
    return left.length ? timeDay(input, day, [...plan.stops, ...left]) : plan;
  }
  return timeDay(input, day, adding.reduce((ordered, p) => insertCheapest(input, ordered, p), stops));
}

/** "+ Add" on a day: the picked places become must-gos on that day, fitted in as above. */
export async function addToDay(trip: Trip, places: Place[], placeIds: string[], day: number) {
  const picked = new Set(placeIds);
  const { error } = await supabase.from('trip_places').update({ fixed_day: day, must: true, removed: false }).in('id', placeIds);
  if (error) throw error;
  const next = places.map((p) => (picked.has(p.id) ? { ...p, fixed_day: day, must: true, removed: false } : p));
  const input = tripInput(trip, next);
  const { shown, maybe } = current(trip, next);
  const days = shown.days.map((d) => ({ ...d, stops: d.stops.filter((s) => !picked.has(s.key)) }));
  const adding = input.places.filter((p) => picked.has(p.key));
  days[day - 1] = fitDay(input, day, days[day - 1].stops, adding);
  await save(trip.id, toSaved(days, maybe.filter((m) => !picked.has(m.key))));
}

/** Google Maps directions between two stops, in the leg's travel mode. */
export function directionsUrl(from: { lat: number; lng: number }, to: { lat: number; lng: number }, mode: string) {
  const gm = mode === 'walk' ? 'walking' : mode === 'car' ? 'driving' : 'transit';
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${gm}`;
}
