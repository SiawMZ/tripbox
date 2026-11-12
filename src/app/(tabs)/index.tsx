import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, ScreenHeader, SectionLabel, T } from '@/components/ui';
import { dateRange, isIsoDate, todayPlus } from '@/lib/dates';
import { useStore } from '@/lib/store';
import type { Trip } from '@/lib/types';
import { pad2, space, useColors } from '@/lib/theme';

/** Home: every trip I'm in, and a form to start a new one. Links are always imported into a trip. */
export default function Trips() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { trips, loading, refresh } = useStore();

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + space.xl }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}>
      <ScreenHeader title="Trips" meta={`${pad2(1)}  ${trips.length} trip${trips.length === 1 ? '' : 's'}`} />

      <SectionLabel index="01">New trip</SectionLabel>
      <NewTripForm />

      <SectionLabel index="02">Your trips</SectionLabel>
      {trips.length ? (
        <View style={styles.grid}>
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </View>
      ) : (
        <T tone="muted">
          No trips yet. Create one above, then import links you saved on Xiaohongshu, Instagram, YouTube or travel blogs into
          it.
        </T>
      )}
    </ScrollView>
  );
}

function NewTripForm() {
  const { createTrip } = useStore();
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [start, setStart] = useState(todayPlus(14));
  const [days, setDays] = useState('3');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayCount = Number(days);
  const valid = city.trim() && isIsoDate(start) && Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 30;

  async function create() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const trip = await createTrip({ city, name: name.trim() || `${city.trim()} trip`, start_date: start, days: dayCount });
      setCity('');
      setName('');
      router.push({ pathname: '/trip/[id]', params: { id: trip.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the trip.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Taipei, Penang, Tokyo" maxLength={80} />
        </View>
        <View style={{ flex: 3 }}>
          <Field label="Trip name (optional)" value={name} onChangeText={setName} placeholder="e.g. Taipei with Ah Boy" maxLength={80} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Field label="Start date" value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={2} onSubmitEditing={create} />
        </View>
        <Button label="Create trip" loading={busy} disabled={!valid} onPress={create} style={{ alignSelf: 'flex-end' }} />
      </View>
      {error ? <T tone="danger">{error}</T> : null}
    </View>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
      accessibilityRole="link"
      accessibilityLabel={`${trip.name}, ${trip.city}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.card,
        { borderColor: hovered || pressed ? c.accent : c.line, backgroundColor: pressed ? c.surface : c.bg },
      ]}>
      <T variant="label" tone="muted">{trip.city}</T>
      <T variant="title" numberOfLines={2}>
        {trip.name}
      </T>
      <T variant="small">{dateRange(trip.start_date, trip.days)} · {trip.days} day{trip.days === 1 ? '' : 's'}</T>
      <T variant="small" tone="muted">
        {trip.place_count ? `${trip.place_count} place${trip.place_count === 1 ? '' : 's'}` : 'No places yet'}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.xl, width: '100%', maxWidth: 960, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: { borderWidth: 2, padding: space.lg, gap: space.xs, flexGrow: 1, flexBasis: 260, maxWidth: 440 },
});
