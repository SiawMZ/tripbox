import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Field, ScreenHeader, SectionLabel, T } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { dateRange, isIsoDate } from '@/lib/dates';
import { useStore } from '@/lib/store';
import type { Trip } from '@/lib/types';
import { space, useColors } from '@/lib/theme';

/** One trip. Step 1: details, rename and delete. Import (step 2) and the plan with its map (step 3) come next. */
export default function TripScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, session } = useStore();
  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: 'Trip' }} />
        <T tone="muted">This trip isn’t in your list. It may have been deleted, or you were removed from it.</T>
        <Button variant="secondary" label="All trips" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const isOwner = trip.owner_id === session?.user.id;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: trip.name }} />
      <ScreenHeader title={trip.name} meta={`${trip.city}  ·  ${dateRange(trip.start_date, trip.days)}`} />

      <SectionLabel index="01">Places</SectionLabel>
      <T tone="muted">
        {trip.place_count
          ? `${trip.place_count} place${trip.place_count === 1 ? '' : 's'} saved.`
          : 'No places yet.'}{' '}
        Importing links and the day-by-day plan with its map are the next steps of the build.
      </T>

      <SectionLabel index="02">Trip details</SectionLabel>
      <TripDetails key={trip.updated_at} trip={trip} />

      <SectionLabel index="03">{isOwner ? 'Delete trip' : 'Leave trip'}</SectionLabel>
      {isOwner ? (
        <DeleteTrip trip={trip} />
      ) : (
        <T tone="muted">Leaving a trip you were invited to comes with collaborators (step 4).</T>
      )}
    </ScrollView>
  );
}

function TripDetails({ trip }: { trip: Trip }) {
  const { updateTrip } = useStore();
  const [name, setName] = useState(trip.name);
  const [city, setCity] = useState(trip.city);
  const [start, setStart] = useState(trip.start_date);
  const [days, setDays] = useState(String(trip.days));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const dayCount = Number(days);
  const valid = name.trim() && city.trim() && isIsoDate(start) && Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 30;
  const changed = name.trim() !== trip.name || city.trim() !== trip.city || start !== trip.start_date || dayCount !== trip.days;

  async function save() {
    if (!valid || !changed) return;
    setBusy(true);
    setNote(null);
    try {
      await updateTrip(trip.id, { name: name.trim(), city: city.trim(), start_date: start, days: dayCount });
      setNote('Saved.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ flex: 3 }}>
          <Field label="Trip name" value={name} onChangeText={setName} maxLength={80} />
        </View>
        <View style={{ flex: 2 }}>
          <Field label="City" value={city} onChangeText={setCity} maxLength={80} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Field label="Start date" value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={2} onSubmitEditing={save} />
        </View>
        <Button label="Save" variant="secondary" loading={busy} disabled={!valid || !changed} onPress={save} style={{ alignSelf: 'flex-end' }} />
      </View>
      {note ? <T variant="small" tone="muted">{note}</T> : null}
    </View>
  );
}

function DeleteTrip({ trip }: { trip: Trip }) {
  const { deleteTrip } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const places = trip.place_count ? ` and its ${trip.place_count} saved place${trip.place_count === 1 ? '' : 's'}` : '';
    const ok = await confirm(`Delete “${trip.name}”?`, `This deletes the trip${places} for everyone in it. This can’t be undone.`, 'Delete trip');
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await deleteTrip(trip.id);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the trip.');
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.sm }}>
      <T tone="muted">Deletes this trip, its imported links and places, for everyone in it.</T>
      <Button variant="danger" label="Delete trip" loading={busy} onPress={remove} />
      {error ? <T tone="danger">{error}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingBottom: space.xxxl, gap: space.xl, width: '100%', maxWidth: 760, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
