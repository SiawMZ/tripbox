// Local server for the spike: serves the pages and keeps trips, so links can be imported from the page.
//   deno task serve   ->   http://127.0.0.1:8095
// Keys stay here (spike/.env); the browser only talks to this server. Each trip is a folder in
// out/trips/<id>/ with trip.json (settings) and places.json (places found in its links).

import { serveDir } from 'jsr:@std/http@1/file-server';
import { fromFileUrl } from 'jsr:@std/path@1';
import Anthropic from 'npm:@anthropic-ai/sdk@0.134';

import { readPost, type Post } from './lib/post.ts';
import { extractPlaces, usageCost } from './lib/extract.ts';
import { matchPlace, type MatchedPlace } from './lib/places.ts';
import { downloadPhoto, readPhotoIndex, writePhotoIndex } from './lib/photo.ts';
import { buildInput, MAX_KM_FROM_HOTEL, type TripFile } from './lib/trip.ts';
import { km } from './lib/planner.ts';
import type { PlaceRow } from './extract.ts';

const here = new URL('.', import.meta.url);
const tripsDir = new URL('out/trips/', here);
const photoDir = new URL('out/photos/', here);
const placeCache = new URL('cache/places/', here);
const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? '';
if (!Deno.env.get('ANTHROPIC_API_KEY') || !googleKey) {
  console.error('Set ANTHROPIC_API_KEY and GOOGLE_MAPS_API_KEY in spike/.env.');
  Deno.exit(1);
}
const client = new Anthropic();
await Deno.mkdir(tripsDir, { recursive: true });
await Deno.mkdir(photoDir, { recursive: true });
await Deno.mkdir(placeCache, { recursive: true });
await migrateFirstTrip();

/** Imports waiting for the user to pick places, by id. Kept in memory: a restart drops them. */
const pending = new Map<string, { tripId: string; rows: PlaceRow[]; source: Record<string, unknown> }>();

Deno.serve({ hostname: '127.0.0.1', port: 8095 }, async (req) => {
  const url = new URL(req.url);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, url);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
  return serveDir(req, { fsRoot: fromFileUrl(here), quiet: true });
});

async function api(req: Request, url: URL): Promise<Response> {
  const parts = url.pathname.split('/').filter(Boolean); // api, trips, <id>, <action>
  if (parts[1] !== 'trips') return json({ error: 'not found' }, 404);
  const id = parts[2];
  const action = parts[3];

  if (!id && req.method === 'GET') return json(await listTrips());
  if (!id && req.method === 'POST') return json(await createTrip(await req.json()));
  if (!id || !/^[a-z0-9-]{1,60}$/.test(id)) return json({ error: 'bad trip id' }, 400);
  const trip = await readTrip(id);
  if (!trip) return json({ error: 'trip not found' }, 404);

  if (!action && req.method === 'GET') return json(await tripPayload(id, trip));
  if (!action && req.method === 'DELETE') {
    // Removes the trip's folder (settings and places). Photos are shared by all trips and stay.
    await Deno.remove(new URL(`${id}/`, tripsDir), { recursive: true });
    for (const [k, v] of pending) if (v.tripId === id) pending.delete(k);
    return json({ ok: true });
  }
  if (!action && req.method === 'PATCH') {
    const body = await req.json();
    const allowed = ['name', 'startDate', 'days', 'dayStart', 'dayEnd', 'travelMode', 'maxMealsPerDay', 'maxPlacesPerDay', 'hotel'];
    for (const k of allowed) if (k in body) (trip as Record<string, unknown>)[k] = body[k];
    await writeJson(new URL(`${id}/trip.json`, tripsDir), trip);
    return json(await tripPayload(id, trip));
  }
  if (action === 'import' && req.method === 'POST') return importLink(id, trip, await req.json());
  if (action === 'add' && req.method === 'POST') {
    const { importId, picks } = await req.json();
    const imp = pending.get(importId);
    if (!imp || imp.tripId !== id) return json({ error: 'This import has expired. Import the link again.' }, 410);
    const chosen = (picks as number[]).map((i) => imp.rows[i]).filter(Boolean);
    const rows = await readRows(id);
    await writeJson(new URL(`${id}/places.json`, tripsDir), [...rows, ...chosen]);
    pending.delete(importId);
    return json({ added: chosen.map((r) => r.match?.id).filter(Boolean), ...(await tripPayload(id, trip)) });
  }
  if (action === 'feedback' && req.method === 'POST') {
    const { importId, rating } = await req.json();
    const imp = pending.get(importId);
    const line = JSON.stringify({ at: new Date().toISOString(), trip: id, url: imp?.source.url, rating }) + '\n';
    await Deno.writeTextFile(new URL('out/feedback.jsonl', here), line, { append: true });
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
}

// ---------- import: one link -> places to review, streamed as one JSON line per step ----------

function importLink(tripId: string, trip: TripFile, body: { url?: string; text?: string }) {
  const link = (body.url ?? '').trim();
  const text = (body.text ?? '').trim().slice(0, 3000);
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(new TextEncoder().encode(JSON.stringify(o) + '\n'));
      try {
        if (!link && !text) throw new Error('Paste a link, or the place names from a post.');
        if (link && !/^https?:\/\//i.test(link)) throw new Error('That doesn’t look like a link. It should start with https://');
        send({ step: 'open' });
        const post: Post = link
          ? await readPost(link)
          : { url: '', resolvedUrl: '', platform: 'web', blocked: false, images: [] };
        if (post.blocked && !text) {
          throw new Error('This post couldn’t be opened (the site blocked it). Paste its text or the place names below and try again.');
        }
        send({ step: 'read', title: post.title });
        const found = await extractPlaces(client, post, { images: 'auto', extraText: text || undefined });
        send({ step: 'find', count: found.places.length });

        const photos = await readPhotoIndex(photoDir);
        const rows: PlaceRow[] = [];
        for (const [i, p] of found.places.entries()) {
          const query = [p.name_local || p.name, p.area, found.city || trip.city].filter(Boolean).join(' ');
          const match = await cachedMatch(query);
          if (match && !photos[match.id]) {
            const entry = await downloadPhoto(match.id, googleKey, photoDir);
            if (entry) photos[match.id] = entry;
          }
          rows.push({ post_url: link || 'pasted text', platform: post.platform, city: found.city, ...p, match });
          send({ step: 'details', done: i + 1, total: found.places.length });
        }
        await writePhotoIndex(photoDir, photos);

        const existing = new Set((await readRows(tripId)).map((r) => r.match?.id));
        const importId = crypto.randomUUID();
        const source = {
          url: link,
          title: post.title,
          author: post.author,
          platform: post.platform,
          image: post.images[0],
          readImages: found.readImages,
          costUsd: usageCost(found.usage),
        };
        pending.set(importId, { tripId, rows, source });
        const places = rows.map((r) => {
          const photo = r.match ? photos[r.match.id] : undefined;
          return {
            name: r.match?.name ?? r.name,
            nameLocal: r.name_local,
            type: r.type,
            area: r.area,
            confidence: r.confidence,
            address: r.match?.address,
            lat: r.match?.lat,
            lng: r.match?.lng,
            photo: photo && 'file' in photo ? `out/photos/${photo.file}` : undefined,
            matched: !!r.match,
            already: !!r.match && existing.has(r.match.id),
            kmAway: r.match ? Math.round(km(r.match, trip.hotel)) : undefined,
          };
        });
        send({ step: 'done', importId, source, places, maxKm: MAX_KM_FROM_HOTEL });
      } catch (e) {
        send({ step: 'error', message: e instanceof Error ? e.message : String(e) });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
}

async function cachedMatch(query: string): Promise<MatchedPlace | null> {
  const file = new URL(`${await hash(query)}.json`, placeCache);
  try {
    return JSON.parse(await Deno.readTextFile(file));
  } catch { /* not cached */ }
  const match = await matchPlace(query, googleKey);
  await Deno.writeTextFile(file, JSON.stringify(match));
  return match;
}

// ---------- trips ----------

async function listTrips() {
  const photos = await readPhotoIndex(photoDir);
  const out = [];
  for await (const e of Deno.readDir(tripsDir)) {
    if (!e.isDirectory) continue;
    const trip = await readTrip(e.name);
    if (!trip) continue;
    const { input } = buildInput(trip, await readRows(e.name), photos);
    out.push({
      id: e.name,
      name: trip.name ?? trip.city ?? e.name,
      city: trip.city,
      startDate: trip.startDate,
      days: trip.days,
      places: input.places.length,
      cover: input.places.find((p) => p.photo)?.photo,
      created: trip.created,
    });
  }
  return out.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''));
}

async function createTrip(body: { name?: string; city?: string; startDate?: string; days?: number }) {
  const city = (body.city ?? '').trim();
  if (!city) throw new Error('Which city is the trip to?');
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(body.startDate ?? '') ? body.startDate! : new Date().toISOString().slice(0, 10);
  const days = Math.max(1, Math.min(14, Number(body.days) || 3));
  // Start each day from the city centre until the user sets a hotel. A search for the bare name finds the
  // region ("Penang" is the state, centred on the mainland); "city centre" lands downtown, usually on a
  // mall there, so the start point is labelled by the city, not by the place found.
  const centre = (await cachedMatch(`${city} city centre`)) ?? (await cachedMatch(city));
  if (!centre) throw new Error(`Couldn’t find “${city}” on the map. Try the city’s English name.`);
  const name = (body.name ?? '').trim() || `${city} trip`;
  const id = `${slug(name)}-${crypto.randomUUID().slice(0, 4)}`;
  const trip: TripFile = {
    name,
    city,
    startDate,
    days,
    hotel: { name: `${city} city centre (set your hotel)`, lat: centre.lat, lng: centre.lng },
    dayStart: '09:30',
    dayEnd: '21:30',
    travelMode: 'transit',
    maxMealsPerDay: 3,
    created: new Date().toISOString(),
  };
  await Deno.mkdir(new URL(`${id}/`, tripsDir), { recursive: true });
  await writeJson(new URL(`${id}/trip.json`, tripsDir), trip);
  await writeJson(new URL(`${id}/places.json`, tripsDir), []);
  return { id };
}

async function tripPayload(id: string, trip: TripFile) {
  const { input, tooFar } = buildInput(trip, await readRows(id), await readPhotoIndex(photoDir));
  return { id, trip, input, tooFar };
}

async function readTrip(id: string): Promise<TripFile | null> {
  try {
    return JSON.parse(await Deno.readTextFile(new URL(`${id}/trip.json`, tripsDir)));
  } catch {
    return null;
  }
}

async function readRows(id: string): Promise<PlaceRow[]> {
  try {
    return JSON.parse(await Deno.readTextFile(new URL(`${id}/places.json`, tripsDir)));
  } catch {
    return [];
  }
}

/** The single trip from before there were trip folders (trip.json + out/places.json) becomes the first trip. */
async function migrateFirstTrip() {
  for await (const _ of Deno.readDir(tripsDir)) return;
  try {
    const trip: TripFile = JSON.parse(await Deno.readTextFile(new URL('trip.json', here)));
    const rows = await Deno.readTextFile(new URL('out/places.json', here));
    const id = 'taipei-test';
    await Deno.mkdir(new URL(`${id}/`, tripsDir), { recursive: true });
    delete trip.places;
    await writeJson(new URL(`${id}/trip.json`, tripsDir), {
      ...trip,
      name: trip.name ?? `${trip.city ?? 'First'} test`,
      created: new Date().toISOString(),
    });
    await Deno.writeTextFile(new URL(`${id}/places.json`, tripsDir), rows);
    console.log(`Moved the existing trip into out/trips/${id}/`);
  } catch { /* nothing to move */ }
}

// ---------- helpers ----------

function slug(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'trip';
}

async function hash(s: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function writeJson(file: URL, data: unknown) {
  await Deno.writeTextFile(file, JSON.stringify(data, null, 2));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
