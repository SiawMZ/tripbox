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

/** A row of public.trip_places: one real place in a trip, shared by its members. */
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
  address: string | null;
  lat: number;
  lng: number;
  maps_url: string | null;
  periods: unknown;
  photo_path: string | null;
  photo_credit: string | null;
  confidence: string | null;
  must: boolean;
  fixed_day: number | null;
  fixed_time: string | null;
  note: string | null;
  duration_min: number | null;
  removed: boolean;
  created_at: string;
};
