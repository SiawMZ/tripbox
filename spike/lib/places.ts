// Matches an extracted name to a real place with Google Places API (New) Text Search.
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
};

// Opening hours put the call in a higher price tier; the planner needs them, so they stay in.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.googleMapsUri',
  'places.regularOpeningHours.periods',
].join(',');

export async function matchPlace(query: string, apiKey: string): Promise<MatchedPlace | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const p = data.places?.[0];
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
  };
}
