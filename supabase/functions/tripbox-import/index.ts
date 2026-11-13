// Imports a saved post into a trip and serves live Google details for its places.
// POST with the user's Authorization header:
//   { action: 'import', trip_id, url?, text? }  -> one JSON line per step, the last with the places found
//   { action: 'add', link_id, picks: number[] } -> saves the picked places to the trip
//   { action: 'find_start', trip_id, query }     -> up to 5 OpenStreetMap results for a hotel or address
//   { action: 'details', trip_id, place_ids, want: ('address'|'photo'|'hours')[] }
//                                               -> live Google details for places of the trip (never stored)
//   { action: 'locate', trip_id }               -> sets a new trip's start point to its city centre
// Membership is checked through the user's own client (RLS); writes use the service role.
// Security requirements: docs/security.md. Google's terms (what may be stored): docs/google-maps-terms.md.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.134';

import { extractPlaces, usageCost } from './extract.ts';
import { basics, findPlaceId, hours, mapsUrl, photoUri, type Basics, type OpeningPeriod } from './places.ts';
import { downloadImageBytes, readPost, type Post } from './post.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Per-user limits: every import spends Anthropic and Google credit, every details call Google credit.
const IMPORTS_PER_HOUR = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_HOUR') ?? 30);
const IMPORTS_PER_DAY = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_DAY') ?? 150);
const IMPORTS_PER_DAY_ALL = Number(Deno.env.get('TRIPBOX_IMPORTS_PER_DAY_ALL') ?? 2000);
const DETAILS_PER_DAY = Number(Deno.env.get('TRIPBOX_DETAILS_PER_DAY') ?? 1500); // Google calls per person
const DETAILS_PER_DAY_ALL = Number(Deno.env.get('TRIPBOX_DETAILS_PER_DAY_ALL') ?? 20000);
// Opening hours are Google's priciest call (Place Details Enterprise: 1,000 free a month for the whole billing
// account, then US$20 per 1,000). Counted per calendar month (UTC), so one person can't use up everyone's allowance.
const HOURS_PER_MONTH = Number(Deno.env.get('TRIPBOX_HOURS_PER_MONTH') ?? 300); // per person, about 7 plans of 40 places
const HOURS_PER_MONTH_ALL = Number(Deno.env.get('TRIPBOX_HOURS_PER_MONTH_ALL') ?? 950); // everyone: stays in the free 1,000
const MAX_PLACES = 25; // places per import
const MAX_DETAILS = 60; // places per details call
const MAX_KM = 50; // a match farther than this from the start point is another place with the same name
const COORDS_DAYS = 25; // refresh Google coordinates before the 30-day limit in Google's terms
const TEXT_LIMIT = 3000;
const MAX_LINKS_PER_TRIP = 300;
const MAX_PLACES_PER_TRIP = 500;

const anthropic = new Anthropic();
const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? '';

/** Stored on the link while it waits for review: our data, place IDs and coordinates only. */
type Candidate = {
  name: string;
  name_local: string;
  type: string;
  area: string;
  confidence: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  km_away: number | null;
  already: boolean;
};

/** What the app is shown, live; never stored. */
type Live = { address?: string; photo_uri?: string | null; photo_credit?: string; photo_credit_uri?: string; hours?: OpeningPeriod[] };

type Usage = { places_calls: number; photo_calls: number; hours_calls: number };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'missing authorization' }, 401);
  if (!googleKey || !Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'Import is not set up on the server.' }, 503);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // The user's client goes through RLS, so a user only reaches trips they are a member of.
  const userDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const adminDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: who } = await userDb.auth.getUser();
  if (!who.user) return json({ error: 'not signed in' }, 401);
  const userId = who.user.id;

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === 'import') return await importLink(userDb, adminDb, userId, body);
    if (body.action === 'add') return await addPicked(userDb, adminDb, userId, body);
    if (body.action === 'details') return await details(userDb, adminDb, userId, body);
    if (body.action === 'locate') return json(await locate(userDb, adminDb, userId, String(body.trip_id ?? '')));
    if (body.action === 'find_start') return await findStart(userDb, adminDb, userId, body);
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('tripbox-import failed', e instanceof Error ? e.message : String(e));
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
  const limited = await importLimited(adminDb, userId);
  if (limited) {
    await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'import', outcome: 'rate_limited', detail: limited });
    return json({ error: limited }, 429);
  }
  const { count: links } = await adminDb.from('trip_links').select('id', { count: 'exact', head: true }).eq('trip_id', tripId);
  if ((links ?? 0) >= MAX_LINKS_PER_TRIP) return json({ error: `This trip already has ${MAX_LINKS_PER_TRIP} imported links.` }, 429);
  const start = trip.hotel_lat != null ? { lat: trip.hotel_lat, lng: trip.hotel_lng! } : (await locate(userDb, adminDb, userId, tripId)).hotel;

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(new TextEncoder().encode(JSON.stringify(o) + '\n'));
      const usage: Usage & { ai_input_tokens: number; ai_output_tokens: number } = {
        ai_input_tokens: 0, ai_output_tokens: 0, places_calls: 0, photo_calls: 0, hours_calls: 0,
      };
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
        const live: Live[] = [];
        for (const [i, p] of places.entries()) {
          const query = [p.name_local || p.name, p.area, found.city || trip.city].filter(Boolean).join(' ');
          const placeId = await cachedPlaceId(adminDb, query);
          // Address for the review and fresh coordinates (Essentials). No Google photo: places show the post's cover.
          const got = placeId ? await basics(placeId, googleKey) : null;
          if (placeId) usage.places_calls++;
          if (got) await cacheCoords(adminDb, query, got);
          candidates.push({
            name: p.name.slice(0, 300),
            name_local: p.name_local.slice(0, 300),
            type: p.type,
            area: p.area.slice(0, 200),
            confidence: p.confidence,
            place_id: got ? placeId : null,
            lat: got?.lat ?? null,
            lng: got?.lng ?? null,
            km_away: got && start.lat != null ? Math.round(km(got, start as { lat: number; lng: number })) : null,
            already: !!placeId && existing.has(placeId),
          });
          live.push({ address: got?.address });
          send({ step: 'details', done: i + 1, total: places.length });
        }

        await adminDb
          .from('trip_links')
          .update({
            status: 'review',
            platform: post.platform.slice(0, 20),
            title: post.title?.slice(0, 500) ?? null,
            author: post.author?.slice(0, 200) ?? null,
            cover_path: post.images[0] ? await saveCover(adminDb, tripId, linkId, post.images[0]) : null,
            candidates,
          })
          .eq('id', linkId);
        await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'import', outcome: 'ok', ...usage, detail: `${candidates.length} places, AI US$${usageCost(found.usage).toFixed(5)}` });
        send({
          step: 'done',
          link_id: linkId,
          source: { url: link, title: post.title, author: post.author, platform: post.platform, image: post.images[0], read_images: found.readImages },
          candidates: candidates.map((c, i) => ({ ...c, ...live[i], maps_url: c.place_id ? mapsUrl(c.place_id) : null })),
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

/**
 * Copies the post's first picture into the private trip-covers bucket (post image links expire and refuse other
 * sites). Each place from the post shows it, with a link back to the post. Null if it can't be fetched.
 */
async function saveCover(adminDb: SupabaseClient, tripId: string, linkId: string, imageUrl: string) {
  const img = await downloadImageBytes(imageUrl);
  if (!img) return null;
  const ext = img.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${tripId}/${linkId}.${ext}`;
  const { error } = await adminDb.storage.from('trip-covers').upload(path, img.bytes, { contentType: img.type, upsert: true });
  if (error) {
    console.error('cover upload failed', error.message);
    return null;
  }
  return path;
}

// ---------- add: the member picked which places to keep ----------

async function addPicked(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, body: { link_id?: string; picks?: unknown }) {
  const linkId = String(body.link_id ?? '');
  const picks = Array.isArray(body.picks) ? body.picks.filter((n): n is number => Number.isInteger(n)) : [];
  // Read through RLS: only a member of the link's trip gets the row.
  const { data: link } = await userDb.from('trip_links').select('id, trip_id, status, candidates').eq('id', linkId).maybeSingle();
  if (!link || link.status !== 'review') return json({ error: 'This import has expired. Import the link again.' }, 410);
  const { count: placeCount } = await adminDb.from('trip_places').select('id', { count: 'exact', head: true }).eq('trip_id', link.trip_id);
  if ((placeCount ?? 0) + picks.length > MAX_PLACES_PER_TRIP) return json({ error: `A trip can hold ${MAX_PLACES_PER_TRIP} places. Remove some first.` }, 429);

  const candidates = (link.candidates ?? []) as Candidate[];
  const now = new Date().toISOString();
  const rows = picks
    .map((i) => candidates[i])
    .filter((c): c is Candidate & { place_id: string } => !!c?.place_id)
    .map((c) => ({
      trip_id: link.trip_id,
      link_id: link.id,
      added_by: userId,
      google_place_id: c.place_id,
      // The name as the post wrote it (ours); Google's name is shown live, never stored.
      name: (c.name || c.name_local).slice(0, 300),
      name_local: c.name_local?.slice(0, 300) || null,
      type: c.type.slice(0, 30),
      area: c.area?.slice(0, 200) || null,
      maps_url: mapsUrl(c.place_id),
      lat: c.lat,
      lng: c.lat == null ? null : c.lng,
      coords_fetched_at: c.lat == null ? null : now,
      confidence: c.confidence.slice(0, 20),
    }));
  const ids = [...new Set(rows.map((r) => r.google_place_id))];
  if (rows.length) {
    const { error } = await adminDb.from('trip_places').upsert(rows, { onConflict: 'trip_id,google_place_id', ignoreDuplicates: true });
    if (error) throw error;
    // A place removed earlier and imported again comes back.
    await adminDb.from('trip_places').update({ removed: false }).eq('trip_id', link.trip_id).in('google_place_id', ids);
  }
  await adminDb.from('trip_links').update({ status: 'ready', candidates: null }).eq('id', link.id);
  return json({ added: ids });
}

// ---------- details: live Google data for places of a trip ----------

async function details(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, body: { trip_id?: string; place_ids?: unknown; want?: unknown }) {
  const tripId = String(body.trip_id ?? '');
  const want = new Set(Array.isArray(body.want) ? body.want.filter((w): w is string => ['address', 'photo', 'hours'].includes(String(w))) : []);
  const asked = Array.isArray(body.place_ids) ? [...new Set(body.place_ids.map(String))].slice(0, MAX_DETAILS) : [];
  if (!asked.length) return json({ places: {} });
  // Only places of a trip the caller is a member of (RLS on trip_places).
  const { data: rows, error } = await userDb
    .from('trip_places')
    .select('id, google_place_id, coords_fetched_at')
    .eq('trip_id', tripId)
    .in('google_place_id', asked);
  if (error) throw error;
  if (!rows.length) return json({ places: {} }); // not a member, or no such places: nothing to fetch or log
  const limited =
    (await detailsLimited(adminDb, userId, rows.length * (want.size + 1))) ??
    (want.has('hours') ? await hoursLimited(adminDb, userId, rows.length) : null);
  if (limited) {
    await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'details', outcome: 'rate_limited', detail: limited });
    return json({ error: limited }, 429);
  }

  const usage: Usage = { places_calls: 0, photo_calls: 0, hours_calls: 0 };
  const out: Record<string, Live & { lat?: number; lng?: number }> = {};
  const staleBefore = Date.now() - COORDS_DAYS * 864e5;
  await Promise.all(
    rows.map(async (r) => {
      const id = r.google_place_id as string;
      const stale = !r.coords_fetched_at || Date.parse(r.coords_fetched_at) < staleBefore;
      const live: Live & { lat?: number; lng?: number } = {};
      try {
        if (want.has('address') || want.has('photo') || stale) {
          const got = await basics(id, googleKey);
          usage.places_calls++;
          if (got) {
            if (stale) {
              await adminDb.from('trip_places').update({ lat: got.lat, lng: got.lng, coords_fetched_at: new Date().toISOString() }).eq('id', r.id);
              Object.assign(live, { lat: got.lat, lng: got.lng });
            }
            if (want.has('address')) live.address = got.address;
            if (want.has('photo') && got.photoName) {
              live.photo_uri = await photoUri(got.photoName, googleKey).catch(() => null);
              live.photo_credit = got.photoCredit;
              live.photo_credit_uri = got.photoCreditUri;
              usage.photo_calls++;
            }
          }
        }
        if (want.has('hours')) {
          live.hours = await hours(id, googleKey);
          usage.hours_calls++;
        }
      } catch (e) {
        console.error('details failed', id, e instanceof Error ? e.message : e);
      }
      out[id] = live;
    }),
  );
  await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'details', outcome: 'ok', ...usage });
  return json({ places: out });
}

// ---------- locate: start each day from the city centre until a hotel is set ----------

/**
 * The city centre comes from OpenStreetMap (Nominatim), not Google: OpenStreetMap data may be stored
 * (ODbL, with attribution), so the start point never needs refreshing. Nominatim's usage policy allows light
 * use with an identifying User-Agent; one lookup per new trip.
 */
async function locate(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, tripId: string) {
  const trip = await memberTrip(userDb, tripId);
  if (!trip) throw new UserError('trip not found');
  if (trip.hotel_lat != null) return { hotel: { name: trip.hotel_name, lat: trip.hotel_lat, lng: trip.hotel_lng } };
  // A city first; then any match ("Penang" is a state, whose centre is on the island near George Town).
  let place: { lat: string; lon: string } | undefined;
  const tries: Record<string, string>[] = [{ featureType: 'city' }, {}];
  for (const extra of tries) {
    const q = new URLSearchParams({ q: trip.city, format: 'jsonv2', limit: '1', ...extra });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
        headers: { 'User-Agent': 'Tripbox/0.1 (+https://github.com/SiawMZ/tripbox)', 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.error('nominatim', res.status, (await res.text()).slice(0, 200));
      else place = (await res.json())[0];
    } catch (e) {
      console.error('nominatim failed', e instanceof Error ? e.message : e);
    }
    if (place) break;
  }
  await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'locate', outcome: place ? 'ok' : 'failed' });
  if (!place) return { hotel: { name: null, lat: null, lng: null } };
  const hotel = { name: `${trip.city} city centre (set your hotel)`, lat: Number(place.lat), lng: Number(place.lon) };
  await adminDb.from('trips').update({ hotel_name: hotel.name, hotel_lat: hotel.lat, hotel_lng: hotel.lng }).eq('id', tripId);
  return { hotel };
}

// ---------- find_start: search a hotel or address to start each day from ----------

const SEARCHES_PER_HOUR = 60;

/** OpenStreetMap search near the trip's city (stored freely, like the city centre above). The app saves the pick. */
async function findStart(userDb: SupabaseClient, adminDb: SupabaseClient, userId: string, body: { trip_id?: string; query?: string }) {
  const tripId = String(body.trip_id ?? '');
  const query = String(body.query ?? '').trim().slice(0, 200);
  if (query.length < 2) return json({ results: [] });
  const trip = await memberTrip(userDb, tripId);
  if (!trip) return json({ error: 'trip not found' }, 404);
  if ((await countUsage(adminDb, 'locate', 3_600_000, userId)) >= SEARCHES_PER_HOUR) {
    return json({ error: 'Too many searches this hour. Try again later.' }, 429);
  }
  const search = async (q: string) => {
    const params = new URLSearchParams({ q, format: 'jsonv2', limit: '5', addressdetails: '0' });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Tripbox/0.1 (+https://github.com/SiawMZ/tripbox)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return (await res.json()) as { display_name: string; name?: string; lat: string; lon: string }[];
  };
  let found: Awaited<ReturnType<typeof search>> = [];
  try {
    // Near the trip's city first ("Hotel Jen" is in many cities); then anywhere.
    found = await search(`${query}, ${trip.city}`);
    if (!found.length) found = await search(query);
  } catch (e) {
    console.error('nominatim failed', e instanceof Error ? e.message : e);
  }
  await logUsage(adminDb, { user_id: userId, trip_id: tripId, kind: 'locate', outcome: found.length ? 'ok' : 'failed' });
  return json({
    results: found.map((r) => ({
      name: (r.name || r.display_name.split(',')[0]).slice(0, 120),
      address: r.display_name.slice(0, 300),
      lat: Number(r.lat),
      lng: Number(r.lon),
    })),
  });
}

// ---------- helpers ----------

class UserError extends Error {}

async function memberTrip(userDb: SupabaseClient, tripId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return null;
  const { data } = await userDb.from('trips').select('id, city, hotel_name, hotel_lat, hotel_lng').eq('id', tripId).maybeSingle();
  return data as { id: string; city: string; hotel_name: string | null; hotel_lat: number | null; hotel_lng: number | null } | null;
}

async function countUsage(adminDb: SupabaseClient, kind: string, ms: number, userId?: string, sumGoogle = false) {
  let q = adminDb
    .from('trip_usage')
    .select(sumGoogle ? 'places_calls, photo_calls, hours_calls' : 'id', sumGoogle ? undefined : { count: 'exact', head: true })
    .eq('kind', kind)
    .neq('outcome', 'rate_limited')
    .gte('created_at', new Date(Date.now() - ms).toISOString());
  if (userId) q = q.eq('user_id', userId);
  const { data, count, error } = await q;
  if (error) throw error;
  if (!sumGoogle) return count ?? 0;
  return (data as unknown as Usage[]).reduce((n, r) => n + r.places_calls + r.photo_calls + r.hours_calls, 0);
}

async function importLimited(adminDb: SupabaseClient, userId: string): Promise<string | null> {
  const [hour, day, all] = await Promise.all([
    countUsage(adminDb, 'import', 3_600_000, userId),
    countUsage(adminDb, 'import', 86_400_000, userId),
    countUsage(adminDb, 'import', 86_400_000),
  ]);
  if (hour >= IMPORTS_PER_HOUR) return `You’ve imported ${hour} links in the last hour. Please wait a little and try again.`;
  if (day >= IMPORTS_PER_DAY) return `You’ve reached today’s limit of ${IMPORTS_PER_DAY} imports. Try again tomorrow.`;
  if (all >= IMPORTS_PER_DAY_ALL) return 'Tripbox has reached today’s import limit. Please try again tomorrow.';
  return null;
}

async function detailsLimited(adminDb: SupabaseClient, userId: string, upcoming: number): Promise<string | null> {
  const [mine, all] = await Promise.all([
    countUsage(adminDb, 'details', 86_400_000, userId, true),
    countUsage(adminDb, 'details', 86_400_000, undefined, true),
  ]);
  if (mine + upcoming > DETAILS_PER_DAY) return 'You’ve viewed a lot of place details today. Photos and opening hours are back tomorrow.';
  if (all + upcoming > DETAILS_PER_DAY_ALL) return 'Tripbox has reached today’s limit for place details. Please try again tomorrow.';
  return null;
}

/** Opening-hours calls this calendar month (UTC), for one person or everyone. */
async function hoursThisMonth(adminDb: SupabaseClient, userId?: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  let q = adminDb.from('trip_usage').select('hours_calls').eq('kind', 'details').gt('hours_calls', 0).gte('created_at', monthStart);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as { hours_calls: number }[]).reduce((n, r) => n + r.hours_calls, 0);
}

async function hoursLimited(adminDb: SupabaseClient, userId: string, upcoming: number): Promise<string | null> {
  const [mine, all] = await Promise.all([hoursThisMonth(adminDb, userId), hoursThisMonth(adminDb)]);
  if (mine + upcoming > HOURS_PER_MONTH) {
    return `Planning checks each place’s opening hours, and you’ve used this month’s ${HOURS_PER_MONTH} checks. You can still drag places between days; planning with opening hours is back on the 1st.`;
  }
  if (all + upcoming > HOURS_PER_MONTH_ALL) {
    return 'Tripbox has used this month’s opening-hours checks for everyone. You can still drag places between days; planning with opening hours is back on the 1st.';
  }
  return null;
}

/** Query -> Google place ID, cached (place IDs may be stored indefinitely). The ID-only search is free. */
async function cachedPlaceId(adminDb: SupabaseClient, query: string): Promise<string | null> {
  const key = await hash(query.toLowerCase());
  const { data } = await adminDb.from('trip_place_cache').select('place_id').eq('query_hash', key).maybeSingle();
  if (data) return data.place_id as string | null;
  const placeId = await findPlaceId(query, googleKey);
  await adminDb.from('trip_place_cache').upsert({ query_hash: key, place_id: placeId });
  return placeId;
}

/** Coordinates beside the cached ID, with their date (cleared after 30 days by trip_expire_google_coords). */
async function cacheCoords(adminDb: SupabaseClient, query: string, got: Basics) {
  const key = await hash(query.toLowerCase());
  await adminDb.from('trip_place_cache').update({ lat: got.lat, lng: got.lng, coords_fetched_at: new Date().toISOString() }).eq('query_hash', key);
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
