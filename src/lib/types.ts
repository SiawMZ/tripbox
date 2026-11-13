export type TravelMode = 'walk' | 'transit' | 'car';

/** A row of public.trips (see supabase/migrations/20261112000000_trips.sql). */
export type Trip = {
  id: string;
  owner_id: string;
  name: string;
  city: string;
  start_date: string; // YYYY-MM-DD
  days: number;
  day_start: string; // HH:MM:SS
  day_end: string;
  travel_mode: TravelMode;
  max_meals: number;
  max_places: number | null;
  hotel_name: string | null;
  hotel_lat: number | null;
  hotel_lng: number | null;
  /** When the trip was last optimized; null = never. */
  planned_at: string | null;
  created_at: string;
  updated_at: string;
  /** Places saved to the trip and not removed (from a count query). */
  place_count?: number;
};

/** The trip fields the app may change (the database grants update on exactly these). */
export type TripPatch = Partial<
  Pick<
    Trip,
    | 'name'
    | 'city'
    | 'start_date'
    | 'days'
    | 'day_start'
    | 'day_end'
    | 'travel_mode'
    | 'max_meals'
    | 'max_places'
    | 'hotel_name'
    | 'hotel_lat'
    | 'hotel_lng'
  >
>;

export type NewTrip = Pick<Trip, 'name' | 'city' | 'start_date' | 'days'>;

/**
 * A row of public.trip_places: one real place in a trip, shared by its members. `name` and `name_local` are as
 * the post wrote them (ours); Google's name, address, hours and photo are fetched live (see importer.fetchDetails).
 */
export type Place = {
  id: string;
  trip_id: string;
  link_id: string | null;
  added_by: string | null;
  google_place_id: string;
  name: string;
  name_local: string | null;
  type: string;
  area: string | null;
  /** From Google: kept at most 30 days (Google's terms), then cleared until refreshed. */
  lat: number | null;
  lng: number | null;
  coords_fetched_at: string | null;
  maps_url: string | null;
  confidence: string | null;
  must: boolean;
  fixed_day: number | null;
  fixed_time: string | null;
  note: string | null;
  duration_min: number | null;
  removed: boolean;
  /** The saved plan (ours, see trip_save_plan): day and order within the day. No day = Maybe. Times aren't saved. */
  plan_day: number | null;
  plan_pos: number | null;
  plan_reason: string | null;
  created_at: string;
};

/** The place fields members may change (the database grants update on these and the plan columns). */
export type PlacePatch = Partial<Pick<Place, 'must' | 'fixed_day' | 'fixed_time' | 'note' | 'duration_min' | 'removed'>>;

/** An imported post (public.trip_links), as places show it: its cover (in the trip-covers bucket) and a link back. */
export type TripLink = {
  id: string;
  trip_id: string;
  url: string | null;
  platform: string | null;
  title: string | null;
  author: string | null;
  cover_path: string | null;
};
