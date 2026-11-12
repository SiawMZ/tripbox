// Step 2 of the spike: places -> a day-by-day plan, printed.
//   deno task plan                       uses spike/trip.json and out/places.json
//   deno task plan --trip=sample/trip.sample.json
// The map page plans in the browser itself; this prints the same plan for a quick check.

import { parseArgs } from 'jsr:@std/cli@1/parse-args';

import { planTrip } from './lib/planner.ts';
import { readPhotoIndex } from './lib/photo.ts';
import { buildInput, MAX_KM_FROM_HOTEL, type TripFile } from './lib/trip.ts';
import type { PlaceRow } from './extract.ts';

const args = parseArgs(Deno.args, { string: ['trip'], default: { trip: 'trip.json' } });
const here = new URL('.', import.meta.url);
const tripUrl = new URL(args.trip, here);
const trip: TripFile = JSON.parse(await Deno.readTextFile(tripUrl));
const rows: PlaceRow[] = JSON.parse(await Deno.readTextFile(new URL(trip.places ?? 'out/places.json', tripUrl)));
const { input, unmatched, tooFar, notFound } = buildInput(trip, rows, await readPhotoIndex(new URL('out/photos/', here)));
const plan = planTrip(input);

await Deno.mkdir(new URL('out', here), { recursive: true });
await Deno.writeTextFile(new URL('out/plan.json', here), JSON.stringify({ trip: { ...trip, places: undefined }, ...plan }, null, 2));

console.log(`${input.places.length} places (${unmatched} not matched on the map, ${tooFar.length} over ${MAX_KM_FROM_HOTEL} km away), ${input.pins.length} pinned`);
for (const q of notFound) console.warn(`  Not found among the places: "${q}"`);
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
console.log('\nRun `deno task serve` and open http://127.0.0.1:8095 to see trips on the map.');
