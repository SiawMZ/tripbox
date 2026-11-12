// Step 2 of the spike: places -> a day-by-day plan.
//   deno task plan                       uses spike/trip.json and out/places.json
//   deno task plan --trip=sample/trip.sample.json
// Writes out/plan.json and out/plan.js (read by map.html), and prints the plan.

import { parseArgs } from 'jsr:@std/cli@1/parse-args';

import { km, planTrip, type PlanPlace, type TravelMode } from './lib/planner.ts';
import type { PlaceRow } from './extract.ts';

type TripFile = {
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
  /** Path (relative to the trip file) to places.json from `deno task extract`. */
  places: string;
  /** `place` is matched against the extracted or Google name. */
  pins?: { place: string; day: number; time?: string }[];
  /** Starred places (matched against the extracted or Google name). The map page can change these. */
  mustGo?: string[];
};

const args = parseArgs(Deno.args, { string: ['trip'], default: { trip: 'trip.json' } });
const here = new URL('.', import.meta.url);
const tripUrl = new URL(args.trip, here);
const trip: TripFile = JSON.parse(await Deno.readTextFile(tripUrl));
const rows: PlaceRow[] = JSON.parse(await Deno.readTextFile(new URL(trip.places, tripUrl)));

// Photos from `deno task photos`, if it has been run.
let photos: Record<string, { file?: string; credit?: string }> = {};
try {
  photos = JSON.parse(await Deno.readTextFile(new URL('out/photos/index.json', here)));
} catch { /* no photos yet */ }

// One entry per real place (the same café saved from three posts is one stop).
const places = new Map<string, PlanPlace>();
let unmatched = 0;
let otherCity = 0;
const tooFar: string[] = [];
for (const r of rows) {
  if (!r.match) {
    unmatched++;
    continue;
  }
  if (trip.city && r.city && !r.city.toLowerCase().includes(trip.city.toLowerCase())) {
    otherCity++;
    continue;
  }
  // A match far from the hotel is a wrong match (a same-named place in another city), not a day trip.
  if (km(r.match, trip.hotel) > 50) {
    tooFar.push(`${r.name_local || r.name} -> ${r.match.name}, ${r.match.address}`);
    continue;
  }
  if (places.has(r.match.id)) continue;
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
    photo: photos[r.match.id]?.file ? `out/photos/${photos[r.match.id].file}` : undefined,
    photoCredit: photos[r.match.id]?.credit,
  });
}

const all = [...places.values()];
const nameMatches = (p: PlanPlace, q: string) => [p.name, p.nameLocal].some((n) => n?.toLowerCase().includes(q.toLowerCase()));
for (const q of trip.mustGo ?? []) {
  const hits = all.filter((p) => nameMatches(p, q));
  if (!hits.length) console.warn(`Must-go not found among the places: "${q}"`);
  for (const h of hits) h.must = true;
}
const pins = (trip.pins ?? []).flatMap((pin) => {
  const q = pin.place.toLowerCase();
  const hit = all.find((p) => [p.name, p.nameLocal].some((n) => n?.toLowerCase().includes(q)));
  if (!hit) console.warn(`Pin not found among the places: "${pin.place}"`);
  if (hit && !pin.time) hit.day = pin.day; // a day without a time: any time that fits on that day
  return hit && pin.time ? [{ key: hit.key, day: pin.day, time: pin.time }] : [];
});

const input = {
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
const plan = planTrip(input);

await Deno.mkdir(new URL('out', here), { recursive: true });
const output = { trip: { ...trip, places: undefined }, ...plan };
await Deno.writeTextFile(new URL('out/plan.json', here), JSON.stringify(output, null, 2));
// map.html re-plans in the browser from TRIP when places are starred, using out/planner.js.
await Deno.writeTextFile(
  new URL('out/plan.js', here),
  `window.PLAN = ${JSON.stringify(output)};\nwindow.TRIP = ${JSON.stringify({ ...input, city: trip.city })};\n`,
);

console.log(`${all.length} places (${unmatched} not matched on the map, ${otherCity} in another city), ${pins.length} pinned`);
for (const t of tooFar) console.log(`  Left out, over 50 km from the hotel: ${t}`);
console.log('');
for (const d of plan.days) {
  console.log(`Day ${d.day}  ${d.weekday} ${d.date}   from ${trip.hotel.name}`);
  for (const s of d.stops) {
    const flags = [s.pinned && 'PINNED', s.late && 'LATE', s.waitMin > 0 && `${s.waitMin} min free before`].filter(Boolean).join(', ');
    console.log(
      `  ${s.start}-${s.leave}  ${s.nameLocal ? `${s.name} (${s.nameLocal})` : s.name}  [${s.type}]` +
        `  ${s.travelMin} min travel${flags ? `  ${flags}` : ''}`,
    );
  }
  console.log(`  back at the hotel about ${d.endBack}\n`);
}
if (plan.maybe.length) {
  console.log('Maybe (not scheduled):');
  for (const m of plan.maybe) console.log(`  ${m.name}: ${m.reason}`);
}
console.log('\nOpen spike/map.html in a browser to see it on the map.');
