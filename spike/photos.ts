// Step 1b of the spike: one small Google Maps photo per matched place, for the Places tab.
//   deno task photos
// Downloads each photo once into out/photos/ (so the browser never needs the API key) and writes
// out/photos/index.json with the photographer credit Google asks apps to show.

import type { PlaceRow } from './extract.ts';
import { downloadPhoto, readPhotoIndex, writePhotoIndex } from './lib/photo.ts';

const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
if (!key) {
  console.error('Set GOOGLE_MAPS_API_KEY in spike/.env.');
  Deno.exit(1);
}
const here = new URL('.', import.meta.url);
const rows: PlaceRow[] = JSON.parse(await Deno.readTextFile(new URL('out/places.json', here)));
const dir = new URL('out/photos/', here);
await Deno.mkdir(dir, { recursive: true });
const index = await readPhotoIndex(dir);

const ids = [...new Set(rows.flatMap((r) => (r.match && !r.match.id.startsWith('sample-') ? [r.match.id] : [])))];
let calls = 0;
for (const id of ids) {
  if (index[id]) continue;
  const entry = await downloadPhoto(id, key, dir);
  calls++;
  if (!entry) {
    console.warn(`  ${id}: photo failed`);
    continue;
  }
  index[id] = entry;
  if ('file' in entry) console.log(`  ${rows.find((r) => r.match?.id === id)?.match?.name}`);
}
await writePhotoIndex(dir, index);

const have = Object.values(index).filter((e) => 'file' in e).length;
console.log(`
Photos:        ${have} of ${ids.length} places (${Object.values(index).filter((e) => 'none' in e).length} have none on Google Maps)
Google calls:  about ${calls * 2} this run (Place Details + Place Photo per new place); downloaded photos cost nothing again
Next:          deno task plan, then reload map.html`);
