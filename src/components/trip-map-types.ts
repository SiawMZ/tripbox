export type MapStop = { key: string; name: string; lat: number; lng: number; n: number; must: boolean };
export type MapDay = { day: number; color: string; stops: MapStop[] };

export type TripMapProps = {
  /** Where each day starts and ends. */
  hotel: { name: string; lat: number; lng: number } | null;
  days: MapDay[];
  /** Places not on a day, shown as small grey dots. */
  maybe: { key: string; name: string; lat: number; lng: number }[];
  /** A stop to centre on (tapped in the list). */
  focus?: string | null;
  onPick?: (key: string) => void;
  height: number | '100%';
};
