// Imports a saved post into a trip: reads it, asks Claude for the places it recommends, matches each on
// Google Places, and stores the result for the member to review. POST with the user's Authorization header:
//   { action: 'import', trip_id, url?, text? }  -> one JSON line per step, the last with the places found
//   { action: 'add', link_id, picks: number[] } -> saves the picked places to the trip
//   { action: 'locate', trip_id }               -> sets a new trip's start point to its city centre
//   { action: 'delete_trip', trip_id }          -> owner only: deletes the trip and its photo folder
// Security requirements: docs/security.md ("Requirements for step 2").
// Membership is checked through the user's own client (RLS); writes use the service role.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.134';

import { extractPlaces, usageCost } from './extract.ts';
import { fetchPhoto, matchPlace, type MatchedPlace } from './places.ts';
import { readPost, type Post } from './post.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Per-user limits: every import spends Anthropic and Google credit.
const IMPORTS_PER_HOUR = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_HOUR') ?? 30);
const IMPORTS_PER_DAY = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_DAY') ?? 150);
// Across everyone, so a burst of new accounts can't run up the bill.
const IMPORTS_PER_DAY_ALL = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_DAY_ALL') ?? 2000);
const MAX_PLACES = 25; // Google lookups per import
const MAX_KM = 50; // a match farther than this from the start point is another place with the same name
const CACHE_DAYS = 30; // Google lookups are refetched after this
const TEXT_LIMIT = 3000;
const MAX_LINKS_PER_TRIP = 300;
const MAX_PLACES_PER_TRIP = 500;

const anthropic = new Anthropic();
const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? '';

type Candidate = {
  name: string;
  name_local: string;
  type: string;
  area: string;
  confidence: string;
  match: (MatchedPlace & { photo_path?: string }) | null;
  km_away: number | null;
  already: boolean;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'missing authorization' }, 401);
  if (!googleKey || !Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'Import is not set up on the server.' }, 503);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // The user's client goes through RLS, so a user can only import into trips they are a member of.
  const userDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const adminDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: who } = await userDb.auth.getUser();
  if (!who.user) return json({ error: 'not signed in' }, 401);
  const userId = who.user.id;

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === 'import') return await importLink(userDb, adminDb, userId, body);
    if (body.action === 'add') return await addPicked(userDb, adminDb, userId, body);
    if (body.action === 'locate') return json(await locate(userDb, adminDb, userId, String(body.trip_id ?? '')));
    if (body.action === 'delete_trip') return await deleteTrip(userDb, adminDb, userId, String(body.trip_id ?? ''));
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('tripbox-import failed', detail);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});

// ---------- import: one link -> places to review ----------

async function importLink(
  userDb: SupabaseClient,
  adminDb: SupabaseClient,
  userId: string,
  body: { trip_id?: string; url?: string; text?: string },
) {
  const tripId = String(body.trip_id ?? '');
  const link = String(body.url ?? '').trim();
  const text = String(body.text ?? '').trim().slice(0, TEXT_LIMIT);
  if (!link && !text) return json({ error: 'Paste a link, or the place names from a post.' }, 400);
  if (link && (!/^https?:\/\//i.test(link) || link.length > 2000)) return json({ error: 'That doesn’t look like a link. It should start with https://' }, 400);

  const trip = await memberTrip(userDb, tripId);
  if (!trip) return json({ error: 'trip not found' }, 404);
  const limited = await rateLimited(adminDb, userId);
  if (limited) {
    await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'import', outcome: 'rate_limited', detail: limited });
    return json({ error: limited }, 429);
  }
  const { count: links } = await adminDb.from('trip_links').select('id', { count: 'exact', head: true }).eq('trip_id', tripId);
  if ((links ?? 0) >= MAX_LINKS_PER_TRIP) return json({ error: `This trip already has ${MAX_LINKS_PER_TRIP} imported links.` }, 429);
  const start = trip.hotel_lat != null ? { lat: trip.hotel_lat, lng: trip.hotel_lng } : (await locate(userDb, adminDb, userId, tripId)).hotel;

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(new TextEncoder().encode(JSON.stringify(o) + '\n'));
      const usage = { ai_input_tokens: 0, ai_output_tokens: 0, places_calls: 0 };
      let linkId: string | null = null;
      try {
        const { data: row, error } = await adminDb
          .from('trip_links')
          .insert({ trip_id: tripId, added_by: userId, url: link || null, status: 'pending' })
          .select('id')
          .single();
        if (error) throw error;
        linkId = row.id as string;

        send({ step: 'open' });
        const post: Post = link ? await readPost(link) : { url: '', resolvedUrl: '', platform: 'web', blocked: false, images: [] };
        if (post.blocked && !text) {
          throw new UserError('This post couldn’t be opened (the site blocked it). Paste its text or the place names and try again.');
        }

        send({ step: 'read', title: post.title });
        const found = await extractPlaces(anthropic, post, { images: 'auto', extraText: text || undefined });
        usage.ai_input_tokens = found.usage.input;
        usage.ai_output_tokens = found.usage.output;
        const places = found.places.slice(0, MAX_PLACES);
        send({ step: 'find', count: places.length });

        const { data: existingRows } = await adminDb.from('trip_places').select('google_place_id').eq('trip_id', tripId).eq('removed', false);
        const existing = new Set((existingRows ?? []).map((r) => r.google_place_id as string));
        const candidates: Candidate[] = [];
        for (const [i, p] of places.entries()) {
          const query = [p.name_local || p.name, p.area, found.city || trip.city].filter(Boolean).join(' ');
          const { match, calls } = await cachedMatch(adminDb, query);
          usage.places_calls += calls;
          let photoPath: string | undefined;
          if (match?.photoName) {
            const got = await storedPhoto(adminDb, tripId, match.id, match.photoName);
            photoPath = got.path;
            usage.places_calls += got.calls;
          }
          candidates.push({
            name: p.name,
            name_local: p.name_local,
            type: p.type,
            area: p.area,
            confidence: p.confidence,
            match: match ? { ...match, photo_path: photoPath } : null,
            km_away: match && start.lat != null ? Math.round(km(match, start as { lat: number; lng: number })) : null,
            already: !!match && existing.has(match.id),
          });
          send({ step: 'details', done: i + 1, total: places.length });
        }

        await adminDb
          .from('trip_links')
          .update({
            status: 'review',
            platform: post.platform.slice(0, 20),
            title: post.title?.slice(0, 500) ?? null,
            author: post.author?.slice(0, 200) ?? null,
            cover_url: post.images[0]?.slice(0, 2000) ?? null,
            candidates,
          })
          .eq('id', linkId);
        await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'import', outcome: 'ok', ...usage, detail: `${candidates.length} places, US$${usageCost(found.usage).toFixed(5)}` });
        send({
          step: 'done',
          link_id: linkId,
          source: { url: link, title: post.title, author: post.author, platform: post.platform, image: post.images[0], read_images: found.readImages },
          candidates,
          max_km: MAX_KM,
        });
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        console.error('import failed', detail);
        if (linkId) await adminDb.from('trip_links').update({ status: 'failed', error: detail.slice(0, 500) }).eq('id', linkId);
        await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'import', outcome: 'failed', ...usage, detail: detail.slice(0, 500) });
        send({ step: 'error', message: e instanceof UserError ? e.message : 'Something went wrong while importing. Please try again.' });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { ...CORS, 'Content-Type': 'application/x-ndjson' } });
}

// ---------- add: the member picked which places to keep ----------

async function addPicked(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, body: { link_id?: string; picks?: unknown }) {
  const linkId = String(body.link_id ?? '');
  const picks = Array.isArray(body.picks) ? body.picks.filter((n): n is number => Number.isInteger(n)) : [];
  // Read through RLS: only a member of the link's trip gets the row.
  const { data: link } = await userDb.from('trip_links').select('id, trip_id, status, candidates').eq('id', linkId).maybeSingle();
  if (!link || link.status !== 'review') return json({ error: 'This import has expired. Import the link again.' }, 410);
  const candidates = (link.candidates ?? []) as Candidate[];
  const { count: placeCount } = await adminDb.from('trip_places').select('id', { count: 'exact', head: true }).eq('trip_id', link.trip_id);
  if ((placeCount ?? 0) + picks.length > MAX_PLACES_PER_TRIP) {
    return json({ error: `A trip can hold ${MAX_PLACES_PER_TRIP} places. Remove some first.` }, 429);
  }
  const rows = picks
    .map((i) => candidates[i])
    .filter((c): c is Candidate & { match: NonNullable<Candidate['match']> } => !!c?.match)
    .map((c) => ({
      trip_id: link.trip_id,
      link_id: link.id,
      added_by: userId,
      google_place_id: c.match.id,
      name: c.match.name.slice(0, 300),
      name_local: c.name_local?.slice(0, 300) || null,
      type: c.type.slice(0, 30),
      area: c.area?.slice(0, 200) || null,
      address: c.match.address?.slice(0, 500) || null,
      lat: c.match.lat,
      lng: c.match.lng,
      // Built from the place id, never a URL taken from a page or the AI (it's opened when tapped).
      maps_url: `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(c.match.id)}`,
      periods: c.match.periods && JSON.stringify(c.match.periods).length <= 20000 ? c.match.periods : null,
      // Photos live under the trip's folder (the database checks the prefix).
      photo_path: c.match.photo_path?.startsWith(`${link.trip_id}/`) ? c.match.photo_path : null,
      photo_credit: c.match.photoCredit?.slice(0, 500) ?? null,
      confidence: c.confidence.slice(0, 20),
      details_fetched_at: new Date().toISOString(),
    }));
  const ids = [...new Set(rows.map((r) => r.google_place_id))];
  if (rows.length) {
    const { error } = await adminDb.from('trip_places').upsert(rows, { onConflict: 'trip_id,google_place_id', ignoreDuplicates: true });
    if (error) throw error;
    // A place removed earlier and imported again comes back.
    await adminDb.from('trip_places').update({ removed: false }).eq('trip_id', link.trip_id).in('google_place_id', ids);
  }
  await adminDb.from('trip_links').update({ status: 'ready' }).eq('id', link.id);
  return json({ added: ids });
}

// ---------- locate: start each day from the city centre until a hotel is set ----------

async function locate(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, tripId: string) {
  const trip = await memberTrip(userDb, tripId);
  if (!trip) throw new UserError('trip not found');
  if (trip.hotel_lat != null) return { hotel: { name: trip.hotel_name, lat: trip.hotel_lat, lng: trip.hotel_lng } };
  // A search for the bare name finds the region ("Penang" is the state, centred on the mainland);
  // "city centre" lands downtown, usually on a mall, so the start point is labelled by the city.
  let { match, calls } = await cachedMatch(adminDb, `${trip.city} city centre`);
  if (!match) ({ match, calls } = await cachedMatch(adminDb, trip.city));
  await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'locate', outcome: match ? 'ok' : 'failed', places_calls: calls });
  if (!match) return { hotel: { name: null, lat: null, lng: null } };
  const hotel = { name: `${trip.city} city centre (set your hotel)`, lat: match.lat, lng: match.lng };
  await adminDb.from('trips').update({ hotel_name: hotel.name, hotel_lat: hotel.lat, hotel_lng: hotel.lng }).eq('id', tripId);
  return { hotel };
}

// ---------- helpers ----------

class UserError extends Error {}

async function memberTrip(userDb: SupabaseClient, tripId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return null;
  const { data } = await userDb.from('trips').select('id, city, hotel_name, hotel_lat, hotel_lng').eq('id', tripId).maybeSingle();
  return data as { id: string; city: string; hotel_name: string | null; hotel_lat: number | null; hotel_lng: number | null } | null;
}

async function rateLimited(adminDb: SupabaseClient, userId: string): Promise<string | null> {
  const count = async (ms: number, mine: boolean) => {
    let q = adminDb
      .from('trip_usage')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'import')
      .neq('outcome', 'rate_limited')
      .gte('created_at', new Date(Date.now() - ms).toISOString());
    if (mine) q = q.eq('user_id', userId);
    const { count: n, error } = await q;
    if (error) throw error;
    return n ?? 0;
  };
  const [hour, day, all] = await Promise.all([count(3_600_000, true), count(86_400_000, true), count(86_400_000, false)]);
  if (hour >= IMPORTS_PER_HOUR) return `You’ve imported ${hour} links in the last hour. Please wait a little and try again.`;
  if (day >= IMPORTS_PER_DAY) return `You’ve reached today’s limit of ${IMPORTS_PER_DAY} imports. Try again tomorrow.`;
  if (all >= IMPORTS_PER_DAY_ALL) return 'Tripbox has reached today’s import limit. Please try again tomorrow.';
  return null;
}

/** Google lookups are cached by query for CACHE_DAYS (Google's terms limit how long details may be kept). */
async function cachedMatch(adminDb: SupabaseClient, query: string): Promise<{ match: MatchedPlace | null; calls: number }> {
  const key = await hash(query.toLowerCase());
  const { data } = await adminDb.from('trip_place_cache').select('match, created_at').eq('query_hash', key).maybeSingle();
  if (data && Date.now() - Date.parse(data.created_at) < CACHE_DAYS * 864e5) return { match: data.match as MatchedPlace | null, calls: 0 };
  const match = await matchPlace(query, googleKey);
  await adminDb.from('trip_place_cache').upsert({ query_hash: key, match, created_at: new Date().toISOString() });
  return { match, calls: 1 };
}

/**
 * A place's photo in the trip's own folder (`<trip_id>/<place_id>.jpg`, as the database requires). The image is
 * downloaded from Google once into `cache/` and copied into each trip that adds the place: copying inside
 * storage is free, so a café saved in many trips costs one Google photo call.
 */
async function storedPhoto(adminDb: SupabaseClient, tripId: string, placeId: string, photoName: string): Promise<{ path?: string; calls: number }> {
  const file = `${placeId.replace(/[^A-Za-z0-9_-]/g, '')}.jpg`;
  const path = `${tripId}/${file}`;
  const bucket = adminDb.storage.from('trip-photos');
  const exists = async (folder: string) => ((await bucket.list(folder, { search: file, limit: 1 })).data ?? []).some((f) => f.name === file);
  if (await exists(tripId)) return { path, calls: 0 };
  let calls = 0;
  if (!(await exists('cache'))) {
    const bytes = await fetchPhoto(photoName, googleKey);
    calls = 1;
    if (!bytes) return { calls };
    const { error } = await bucket.upload(`cache/${file}`, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) return { calls };
  }
  const { error } = await bucket.copy(`cache/${file}`, path);
  return error ? { calls } : { path, calls };
}

// ---------- delete a trip, with its photo folder (database cascades don't reach storage) ----------

async function deleteTrip(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, tripId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return json({ error: 'trip not found' }, 404);
  // Through RLS and checked against the caller: only the owner may delete.
  const { data: trip } = await userDb.from('trips').select('id, owner_id').eq('id', tripId).maybeSingle();
  if (!trip) return json({ error: 'trip not found' }, 404);
  if (trip.owner_id !== userId) return json({ error: 'Only the person who created this trip can delete it.' }, 403);
  const { error } = await userDb.from('trips').delete().eq('id', tripId);
  if (error) throw error;
  const bucket = adminDb.storage.from('trip-photos');
  for (;;) {
    const { data: files } = await bucket.list(tripId, { limit: 100 });
    if (!files?.length) break;
    const { error: rmError } = await bucket.remove(files.map((f) => `${tripId}/${f.name}`));
    if (rmError) {
      console.error('photo cleanup failed', tripId, rmError.message);
      break;
    }
  }
  return json({ deleted: tripId });
}

async function logUsage(adminDb: SupabaseClient, row: Record<string, unknown>) {
  const { error } = await adminDb.from('trip_usage').insert(row);
  if (error) console.error('trip_usage insert failed', error.message);
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function hash(s: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
