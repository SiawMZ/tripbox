// A trip's settings file and the planner input built from it plus the places saved to it.
// Used by `deno task plan` (one trip.json) and the local server (one folder per trip).

import { km, type PlanPlace, type TravelMode, type TripInput } from './planner.ts';
import type { PlaceRow } from '../extract.ts';
import type { PhotoEntry } from './photo.ts';

export type TripFile = {
  name?: string;
  city?: string;
  startDate: string;
  days: number;
  hotel: { name: string; lat: number; lng: number };
  dayStart?: string;
  dayEnd?: string;
  travelMode?: TravelMode;
  /** Full meals a day (default 3) and stops a day (default: as many as fit). */
  maxMealsPerDay?: number;
  maxPlacesPerDay?: number;
  /** Path (relative to the trip file) to places.json; the server keeps it next to trip.json. */
  places?: string;
  /** `place` is matched against the extracted or Google name; without a time, any time that day. */
  pins?: { place: string; day: number; time?: string }[];
  /** Starred places (matched against the extracted or Google name). The map page can change these. */
  mustGo?: string[];
  created?: string;
};

/** A match this far from the hotel is a wrong match (a same-named place elsewhere), not a day trip. */
export const MAX_KM_FROM_HOTEL = 50;

export function buildInput(trip: TripFile, rows: PlaceRow[], photos: Record<string, PhotoEntry>, photoBase = 'out/photos/') {
  // One entry per real place (the same café saved from three posts is one stop).
  const places = new Map<string, PlanPlace>();
  let unmatched = 0;
  const tooFar: string[] = [];
  for (const r of rows) {
    if (!r.match) {
      unmatched++;
      continue;
    }
    if (km(r.match, trip.hotel) > MAX_KM_FROM_HOTEL) {
      tooFar.push(`${r.name_local || r.name} -> ${r.match.name}, ${r.match.address}`);
      continue;
    }
    if (places.has(r.match.id)) continue;
    const photo = photos[r.match.id];
    places.set(r.match.id, {
      key: r.match.id,
      name: r.match.name,
      nameLocal: r.name_local || undefined,
      type: r.type,
      area: r.area || undefined,
      lat: r.match.lat,
      lng: r.match.lng,
      mapsUrl: r.match.mapsUrl,
      periods: r.match.periods,
      photo: photo && 'file' in photo ? `${photoBase}${photo.file}` : undefined,
      photoCredit: photo && 'file' in photo ? photo.credit : undefined,
    });
  }

  const all = [...places.values()];
  const matches = (p: PlanPlace, q: string) => [p.name, p.nameLocal].some((n) => n?.toLowerCase().includes(q.toLowerCase()));
  const notFound: string[] = [];
  for (const q of trip.mustGo ?? []) {
    const hits = all.filter((p) => matches(p, q));
    if (!hits.length) notFound.push(q);
    for (const h of hits) h.must = true;
  }
  const pins = (trip.pins ?? []).flatMap((pin) => {
    const hit = all.find((p) => matches(p, pin.place));
    if (!hit) notFound.push(pin.place);
    if (hit && !pin.time) hit.day = pin.day; // a day without a time: any time that fits on that day
    return hit && pin.time ? [{ key: hit.key, day: pin.day, time: pin.time }] : [];
  });

  const input: TripInput & { city?: string; name?: string } = {
    name: trip.name,
    city: trip.city,
    startDate: trip.startDate,
    days: trip.days,
    hotel: trip.hotel,
    dayStart: trip.dayStart ?? '09:30',
    dayEnd: trip.dayEnd ?? '21:30',
    travelMode: trip.travelMode ?? 'transit',
    maxMealsPerDay: trip.maxMealsPerDay,
    maxPlacesPerDay: trip.maxPlacesPerDay,
    places: all,
    pins,
  };
  return { input, unmatched, tooFar, notFound };
}
