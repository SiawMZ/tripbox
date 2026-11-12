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
