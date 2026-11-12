// Step 1b of the spike: one small Google Maps photo per matched place, for the Places tab.
//   deno task photos
// Downloads each photo once into out/photos/ (so the browser never needs the API key) and writes
// out/photos/index.json with the photographer credit Google asks apps to show.

import type { PlaceRow } from './extract.ts';

const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
if (!key) {
  console.error('Set GOOGLE_MAPS_API_KEY in spike/.env.');
  Deno.exit(1);
}
const here = new URL('.', import.meta.url);
const rows: PlaceRow[] = JSON.parse(await Deno.readTextFile(new URL('out/places.json', here)));
const dir = new URL('out/photos/', here);
await Deno.mkdir(dir, { recursive: true });

type Entry = { file: string; credit?: string } | { none: true };
const indexUrl = new URL('index.json', dir);
let index: Record<string, Entry> = {};
try {
  index = JSON.parse(await Deno.readTextFile(indexUrl));
} catch { /* first run */ }

const ids = [...new Set(rows.flatMap((r) => (r.match && !r.match.id.startsWith('sample-') ? [r.match.id] : [])))];
let details = 0;
let media = 0;
for (const id of ids) {
  if (index[id]) continue;
  // Place Details with only the photos field: the photo's resource name and its author.
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'photos' },
  });
  details++;
  if (!res.ok) {
    console.warn(`  ${id}: details ${res.status}`);
    continue;
  }
  const photo = (await res.json()).photos?.[0];
  if (!photo?.name) {
    index[id] = { none: true };
    continue;
  }
  // skipHttpRedirect returns the image address as JSON instead of redirecting to it.
  const meta = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=240&skipHttpRedirect=true`,
    { headers: { 'X-Goog-Api-Key': key } },
  );
  media++;
  const uri = meta.ok ? (await meta.json()).photoUri : null;
  const img = uri ? await fetch(uri) : null;
  if (!img?.ok) {
    console.warn(`  ${id}: photo failed`);
    continue;
  }
  const file = `${id}.jpg`;
  await Deno.writeFile(new URL(file, dir), new Uint8Array(await img.arrayBuffer()));
  index[id] = { file, credit: photo.authorAttributions?.[0]?.displayName };
  console.log(`  ${rows.find((r) => r.match?.id === id)?.match?.name}`);
}
await Deno.writeTextFile(indexUrl, JSON.stringify(index, null, 2));

const have = Object.values(index).filter((e) => 'file' in e).length;
console.log(`
Photos:        ${have} of ${ids.length} places (${Object.values(index).filter((e) => 'none' in e).length} have none on Google Maps)
Google calls:  ${details} Place Details (photos) + ${media} Place Photo this run; already downloaded photos cost nothing
Next:          deno task plan, then reload map.html`);
