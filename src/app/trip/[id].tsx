import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GoogleMapsCredit, ImportSheet, PhotoCredit } from '@/components/import-sheet';
import { Button, Field, ScreenHeader, SectionLabel, T } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { dateRange, isIsoDate } from '@/lib/dates';
import { fetchDetails, type LiveDetails } from '@/lib/importer';
import { useStore } from '@/lib/store';
import type { Place, Trip } from '@/lib/types';
import { space, useColors } from '@/lib/theme';

/** One trip: its places (import links into it), details, and delete. The plan with its map comes in step 3. */
export default function TripScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, session, places, loadPlaces } = useStore();
  const trip = trips.find((t) => t.id === id);
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (id) void loadPlaces(id).catch(() => {});
  }, [id, loadPlaces]);

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
      <View style={styles.row}>
        <Button label="+ Import link" onPress={() => setImporting(true)} />
        <T variant="small" tone="muted" style={{ flex: 1, alignSelf: 'center' }}>
          {trip.hotel_name ? `Days start from ${trip.hotel_name}.` : ''}
        </T>
      </View>
      {note ? <T tone="muted">{note}</T> : null}
      <PlaceList tripId={trip.id} places={places[trip.id]} />
      <ImportSheet
        tripId={trip.id}
        visible={importing}
        onClose={() => setImporting(false)}
        onAdded={(n) => {
          setImporting(false);
          setNote(`Added ${n} place${n === 1 ? '' : 's'}. The day-by-day plan comes in the next step of the build.`);
          void loadPlaces(trip.id).catch(() => {});
        }}
      />

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

/**
 * The trip's places. Photos are Google's, so they are fetched live for the places shown (one Google call each)
 * and kept only in memory for this visit, never stored (docs/google-maps-terms.md).
 */
function PlaceList({ tripId, places }: { tripId: string; places: Place[] | undefined }) {
  const c = useColors();
  const [live, setLive] = useState<Record<string, LiveDetails>>({});
  const ids = (places ?? []).map((p) => p.google_place_id).join(',');

  useEffect(() => {
    if (!ids) return;
    let alive = true;
    void fetchDetails(tripId, ids.split(','), ['photo'])
      .then((got) => alive && setLive((prev) => ({ ...prev, ...got })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tripId, ids]);

  if (!places) return <T tone="muted">Loading places…</T>;
  if (!places.length) {
    return (
      <T tone="muted">
        No places yet. Import links to posts you saved on Xiaohongshu, Instagram, YouTube, TikTok or travel blogs; the
        places in them become this trip’s plan.
      </T>
    );
  }
  return (
    <View style={{ gap: space.sm }}>
      {places.map((p) => {
        const d = live[p.google_place_id];
        return (
          <Pressable
            key={p.id}
            onPress={() => (p.maps_url ? void Linking.openURL(p.maps_url) : undefined)}
            accessibilityRole="link"
            accessibilityLabel={`${p.name}, open in Google Maps`}
            style={styles.place}>
            <View style={{ gap: 2 }}>
              {d?.photo_uri ? (
                <Image source={{ uri: d.photo_uri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: c.surface }]} />
              )}
              {d?.photo_credit ? <PhotoCredit name={d.photo_credit} uri={d.photo_credit_uri} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="bodyStrong" numberOfLines={1}>
                {p.name}
                {p.name_local && p.name_local !== p.name ? <T variant="small" tone="muted">{`  ${p.name_local}`}</T> : null}
              </T>
              <T variant="small" tone="muted" numberOfLines={1}>
                {p.type}
                {p.area ? ` · ${p.area}` : ''}
              </T>
            </View>
          </Pressable>
        );
      })}
      <GoogleMapsCredit />
    </View>
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
  place: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { width: 48, height: 48 },
});
