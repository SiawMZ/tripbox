import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Field, T } from '@/components/ui';
import { findStart, type StartResult } from '@/lib/importer';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';
import type { TravelMode, Trip } from '@/lib/types';

const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const MODES: [TravelMode, string][] = [
  ['transit', 'Train and bus'],
  ['car', 'Taxi or car'],
  ['walk', 'Walking only'],
];

/** How the days are planned: hours, meals, places a day, getting around. Saved for everyone in the trip. */
export function PlanSettings({ trip }: { trip: Trip }) {
  const { updateTrip } = useStore();
  const [dayStart, setDayStart] = useState(trip.day_start.slice(0, 5));
  const [dayEnd, setDayEnd] = useState(trip.day_end.slice(0, 5));
  const [meals, setMeals] = useState(trip.max_meals);
  const [perDay, setPerDay] = useState<number | null>(trip.max_places);
  const [mode, setMode] = useState<TravelMode>(trip.travel_mode);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const valid = isTime(dayStart) && isTime(dayEnd) && dayStart < dayEnd;
  const changed =
    dayStart !== trip.day_start.slice(0, 5) ||
    dayEnd !== trip.day_end.slice(0, 5) ||
    meals !== trip.max_meals ||
    perDay !== trip.max_places ||
    mode !== trip.travel_mode;

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      await updateTrip(trip.id, { day_start: dayStart, day_end: dayEnd, max_meals: meals, max_places: perDay, travel_mode: mode });
      setNote('Saved. Press “Plan my days again” on the Plan tab to use it.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ width: 120 }}>
          <Field label="Day starts" value={dayStart} onChangeText={setDayStart} placeholder="09:00" maxLength={5} />
        </View>
        <View style={{ width: 120 }}>
          <Field label="Day ends" value={dayEnd} onChangeText={setDayEnd} placeholder="22:00" maxLength={5} />
        </View>
      </View>
      <T variant="label" tone="muted">
        Meals a day
      </T>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} label={String(n)} active={meals === n} onPress={() => setMeals(n)} />
        ))}
      </View>
      <T variant="label" tone="muted">
        Places a day
      </T>
      <View style={styles.row}>
        <Chip label="As many as fit" active={perDay === null} onPress={() => setPerDay(null)} />
        {[3, 4, 5, 6, 7, 8].map((n) => (
          <Chip key={n} label={String(n)} active={perDay === n} onPress={() => setPerDay(n)} />
        ))}
      </View>
      <T variant="label" tone="muted">
        Getting around
      </T>
      <View style={styles.row}>
        {MODES.map(([m, label]) => (
          <Chip key={m} label={label} active={mode === m} onPress={() => setMode(m)} />
        ))}
      </View>
      {!valid ? <T tone="danger">Use 24-hour times like 09:00 and 22:00, with the end after the start.</T> : null}
      <Button label="Save" variant="secondary" loading={busy} disabled={!valid || !changed} onPress={save} />
      {note ? (
        <T variant="small" tone="muted">
          {note}
        </T>
      ) : null}
    </View>
  );
}

/** Where each day starts and ends: search a hotel or address (OpenStreetMap). */
export function StartPoint({ trip }: { trip: Trip }) {
  const c = useColors();
  const { updateTrip } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StartResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (query.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      setResults(await findStart(trip.id, query.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  }

  async function pick(r: StartResult) {
    setError(null);
    try {
      await updateTrip(trip.id, { hotel_name: r.name, hotel_lat: r.lat, hotel_lng: r.lng });
      setResults(null);
      setQuery('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <T>
        <T variant="bodyStrong">{trip.hotel_name ?? 'Not set'}</T>
        {trip.hotel_lat != null ? <T tone="muted">{`  ${trip.hotel_lat.toFixed(4)}, ${trip.hotel_lng?.toFixed(4)}`}</T> : null}
      </T>
      <View style={styles.search}>
        <View style={{ flex: 1 }}>
          <Field value={query} onChangeText={setQuery} placeholder="Search your hotel or an address" onSubmitEditing={search} />
        </View>
        <Button label="Search" variant="secondary" loading={busy} onPress={search} />
      </View>
      {results?.length === 0 ? <T tone="muted">Nothing found. Try the hotel’s name with its street.</T> : null}
      {results?.map((r, i) => (
        <Pressable key={i} onPress={() => void pick(r)} accessibilityRole="button" style={[styles.result, { borderColor: c.border }]}>
          <T variant="bodyStrong">{r.name}</T>
          <T variant="small" tone="muted" numberOfLines={2}>
            {r.address}
          </T>
        </Pressable>
      ))}
      {results?.length ? (
        <T variant="small" tone="muted">
          Addresses: © OpenStreetMap contributors
        </T>
      ) : null}
      {error ? <T tone="danger">{error}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  search: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  result: { borderWidth: 1, padding: space.sm, gap: 2 },
});
