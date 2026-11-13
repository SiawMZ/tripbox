import { fetch as streamingFetch } from 'expo/fetch';

import { supabase } from './supabase';

/**
 * A place the import found, waiting for the member to tick it (see supabase/functions/tripbox-import).
 * `address`, `photo_uri` and the credit are Google's, shown live and never stored (docs/google-maps-terms.md).
 */
export type Candidate = {
  name: string;
  name_local: string;
  type: string;
  area: string;
  confidence: 'high' | 'medium' | 'low' | string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  km_away: number | null;
  already: boolean;
  address?: string;
  photo_uri?: string | null;
  photo_credit?: string;
  photo_credit_uri?: string;
  maps_url: string | null;
};

/** Live Google details for a saved place (never stored). */
export type LiveDetails = {
  address?: string;
  photo_uri?: string | null;
  photo_credit?: string;
  photo_credit_uri?: string;
  hours?: unknown;
  lat?: number;
  lng?: number;
};

export type ImportSource = {
  url: string;
  title?: string;
  author?: string;
  platform: string;
  image?: string;
  read_images: boolean;
};

export type ImportEvent =
  | { step: 'open' }
  | { step: 'read'; title?: string }
  | { step: 'find'; count: number }
  | { step: 'details'; done: number; total: number }
  | { step: 'done'; link_id: string; source: ImportSource; candidates: Candidate[]; max_km: number }
  | { step: 'error'; message: string };

const FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/tripbox-import`;

async function headers() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  return {
    Authorization: `Bearer ${data.session.access_token}`,
    apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    'Content-Type': 'application/json',
  };
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(FUNCTION_URL, { method: 'POST', headers: await headers(), body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error ?? `Request failed (${res.status})`);
  return out as T;
}

/**
 * Imports one link (and/or pasted text) into a trip. The function answers with one JSON line per step,
 * so `onEvent` sees the progress as it happens; the last event is `done` or `error`.
 * Uses expo/fetch, whose response body can be read as a stream on phones too.
 */
export async function runImport(tripId: string, url: string, text: string, onEvent: (e: ImportEvent) => void) {
  const res = await streamingFetch(FUNCTION_URL, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ action: 'import', trip_id: tripId, url, text }),
  });
  if (!res.ok || !res.body) {
    const out = await res.json().catch(() => ({}));
    onEvent({ step: 'error', message: out.error ?? `Import failed (${res.status})` });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) onEvent(JSON.parse(line) as ImportEvent);
    }
  }
}

/** Saves the ticked places (by their index in `candidates`) to the trip. Returns their Google place ids. */
export async function addPicked(linkId: string, picks: number[]) {
  const out = await call<{ added: string[] }>({ action: 'add', link_id: linkId, picks });
  return out.added;
}

/** Starts a new trip's days from its city centre until a hotel is set. */
export async function locateTrip(tripId: string) {
  return call<{ hotel: { name: string | null; lat: number | null; lng: number | null } }>({ action: 'locate', trip_id: tripId });
}

/**
 * Live Google details (address, photo, opening hours) for places of a trip. Each costs a Google call, so ask
 * only for what the screen shows; results may be kept in memory for the visit but never stored.
 */
export async function fetchDetails(tripId: string, placeIds: string[], want: ('address' | 'photo' | 'hours')[]) {
  const out = await call<{ places: Record<string, LiveDetails> }>({ action: 'details', trip_id: tripId, place_ids: placeIds, want });
  return out.places;
}

/** 👍 / 👎 on an import: how well it found the places. */
export async function rateImport(linkId: string, rating: 'good' | 'bad') {
  const { error } = await supabase.from('trip_links').update({ rating }).eq('id', linkId);
  if (error) throw error;
}

export type StartResult = { name: string; address: string; lat: number; lng: number };

/** Searches a hotel or address (OpenStreetMap) to start each day from. */
export async function findStart(tripId: string, query: string) {
  const out = await call<{ results: StartResult[] }>({ action: 'find_start', trip_id: tripId, query });
  return out.results;
}
