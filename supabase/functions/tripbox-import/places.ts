// Google Places API (New), used within Google's terms (docs/google-maps-terms.md): the place ID may be stored,
// coordinates for up to 30 days, and everything else is fetched live and never stored.
// Each call asks only for the fields it needs, because the field mask sets the price tier:
//   findPlaceId  Text Search, IDs only            free
//   basics       Place Details Essentials         address, coordinates, photo list (US$5 / 1,000)
//   hours        Place Details Enterprise         opening hours (US$20 / 1,000)
//   photoUri     Place Photo                      one image (US$7 / 1,000)
// Prices and free monthly allowances: https://developers.google.com/maps/billing-and-pricing/pricing

export type OpeningPeriod = {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
};

export type Basics = {
  lat: number;
  lng: number;
  address: string;
  /** Resource name of the first photo (can't be stored; it also expires), and its author. */
  photoName?: string;
  photoCredit?: string;
  /** Link to the photographer on Google Maps (Google asks apps to show the credit with the photo). */
  photoCreditUri?: string;
};

const BASE = 'https://places.googleapis.com/v1';

async function google(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

/** The place a post names, as a Google place ID. IDs-only Text Search is free. */
export async function findPlaceId(query: string, apiKey: string): Promise<string | null> {
  const data = await google(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id' },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  });
  return (data.places?.[0]?.id as string | undefined) ?? null;
}

/** Address, coordinates and the first photo's name (Place Details Essentials; the photo list is free with it). */
export async function basics(placeId: string, apiKey: string): Promise<Basics | null> {
  const p = await google(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'location,formattedAddress,photos' },
  });
  if (!p?.location) return null;
  const author = p.photos?.[0]?.authorAttributions?.[0];
  return {
    lat: p.location.latitude,
    lng: p.location.longitude,
    address: p.formattedAddress ?? '',
    photoName: p.photos?.[0]?.name,
    photoCredit: author?.displayName,
    photoCreditUri: author?.uri,
  };
}

/** Weekly opening hours (Place Details Enterprise); day 0 = Sunday. Undefined when Google has none. */
export async function hours(placeId: string, apiKey: string): Promise<OpeningPeriod[] | undefined> {
  const p = await google(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'regularOpeningHours' },
  });
  return p?.regularOpeningHours?.periods;
}

/** A short-lived address of the photo image (about `width` px wide), for the app to show directly. */
export async function photoUri(photoName: string, apiKey: string, width = 240): Promise<string | null> {
  const meta = await google(`${BASE}/${photoName}/media?maxWidthPx=${width}&skipHttpRedirect=true`, {
    headers: { 'X-Goog-Api-Key': apiKey },
  });
  const uri = meta?.photoUri as string | undefined;
  return uri && /^https:\/\/[a-z0-9.-]+\.(googleusercontent|google|googleapis)\.com\//i.test(uri) ? uri : null;
}

/** The place on Google Maps, built from its ID (never a URL from a page or the AI). */
export function mapsUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}
