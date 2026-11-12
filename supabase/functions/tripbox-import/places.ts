// Google Places API (New): find the place a post names, and fetch its first photo.
// https://developers.google.com/maps/documentation/places/web-service/text-search

export type OpeningPeriod = {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
};

export type MatchedPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType?: string;
  mapsUrl?: string;
  /** Google's weekly hours; day 0 = Sunday. Missing = unknown (treated as always open). */
  periods?: OpeningPeriod[];
  /** Resource name of the first photo, and its author (Google asks apps to show the credit). */
  photoName?: string;
  photoCredit?: string;
};

// Hours and photos put the call in a higher price tier; the planner needs hours, and asking for the
// photo here saves a separate Place Details call per place.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.googleMapsUri',
  'places.regularOpeningHours.periods',
  'places.photos',
].join(',');

export async function matchPlace(query: string, apiKey: string): Promise<MatchedPlace | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const p = (await res.json()).places?.[0];
  if (!p?.location) return null;
  return {
    id: p.id,
    name: p.displayName?.text ?? query,
    address: p.formattedAddress ?? '',
    lat: p.location.latitude,
    lng: p.location.longitude,
    primaryType: p.primaryType,
    mapsUrl: p.googleMapsUri,
    periods: p.regularOpeningHours?.periods,
    photoName: p.photos?.[0]?.name,
    photoCredit: p.photos?.[0]?.authorAttributions?.[0]?.displayName,
  };
}

/** Downloads a place photo (about 240 px wide). Returns the JPEG bytes, or null. */
export async function fetchPhoto(photoName: string, apiKey: string): Promise<Uint8Array | null> {
  // skipHttpRedirect returns the image address as JSON instead of redirecting to it.
  const meta = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=240&skipHttpRedirect=true`, {
    headers: { 'X-Goog-Api-Key': apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  const uri = meta.ok ? (await meta.json()).photoUri : null;
  if (!uri || !/^https:\/\/[a-z0-9.-]+\.(googleusercontent|google|googleapis)\.com\//i.test(uri)) return null;
  const img = await fetch(uri, { signal: AbortSignal.timeout(15_000) });
  if (!img.ok) return null;
  const bytes = new Uint8Array(await img.arrayBuffer());
  return bytes.length && bytes.length <= 2 * 1024 * 1024 ? bytes : null;
}
