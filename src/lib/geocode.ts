import { Platform } from 'react-native';

/**
 * A new trip's city centre from OpenStreetMap's Nominatim, called from the traveller's own browser or phone.
 * (Hotels are searched with Google instead: OpenStreetMap misses many of them.)
 * Nominatim refuses requests from Supabase's cloud servers (403, shared cloud addresses), so it can't run in the
 * edge function. Its usage policy allows light use like this: one lookup when a trip is created, and an identifying User-Agent (phones) or the browser's Referer (web).
 * OpenStreetMap data may be stored (ODbL): show "© OpenStreetMap contributors" next to results.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export type StartResult = { name: string; address: string; lat: number; lng: number };

type Hit = { display_name: string; name?: string; lat: string; lon: string };

async function nominatim(params: Record<string, string>): Promise<Hit[]> {
  const q = new URLSearchParams({ format: 'jsonv2', addressdetails: '0', ...params });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
    // Browsers send their own User-Agent and the page as Referer; phones identify the app.
    headers: Platform.OS === 'web' ? { 'Accept-Language': 'en' } : { 'User-Agent': 'Tripbox/0.1 (+https://github.com/SiawMZ/tripbox)', 'Accept-Language': 'en' },
  });
  if (!res.ok) throw new Error(res.status === 429 ? 'Too many searches. Wait a minute and try again.' : 'Search isn’t working right now.');
  return (await res.json()) as Hit[];
}

const toResult = (h: Hit): StartResult => ({
  name: (h.name || h.display_name.split(',')[0]).slice(0, 120),
  address: h.display_name.slice(0, 300),
  lat: Number(h.lat),
  lng: Number(h.lon),
});


/** The city's centre, where a new trip's days start until a hotel is set. A city first, then any match. */
export async function cityCentre(city: string): Promise<StartResult | null> {
  let hits = await nominatim({ q: city, limit: '1', featureType: 'city' });
  // "Penang" is a state, not a city: any match then (its centre is on the island).
  if (!hits.length) hits = await nominatim({ q: city, limit: '1' });
  return hits[0] ? toResult(hits[0]) : null;
}
