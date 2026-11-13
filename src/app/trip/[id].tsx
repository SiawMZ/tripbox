import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GoogleMapsCredit, ImportSheet } from '@/components/import-sheet';
import { usePlaceSources } from '@/components/place-source';
import { PlanView } from '@/components/plan-view';
import { PlacesTab } from '@/components/places-tab';
import { TripMap } from '@/components/trip-map';
import type { MapDay } from '@/components/trip-map-types';
import { PlanSettings, StartPoint } from '@/components/trip-settings';
import { Button, Check, Field, Rule, ScreenHeader, SectionLabel, Sheet, T } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { dateRange, isIsoDate } from '@/lib/dates';
import { addToDay, moveToDay, optimize, removeFromPlan, shownPlan, startPoint } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { dayColor, space, type as typeScale, useColors, useIsWide } from '@/lib/theme';
import type { Place, Trip } from '@/lib/types';

type Tab = 'plan' | 'places' | 'trip';

/** One trip: the day-by-day plan with its map, the saved places, and the trip's settings. */
export default function TripScreen() {
  const c = useColors();
  const wide = useIsWide();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, session, places: placesByTrip, links, loadPlaces, updatePlace, refresh } = useStore();
  const trip = trips.find((t) => t.id === id);
  const places = placesByTrip[id ?? ''];
  const [tab, setTab] = useState<Tab>('plan');
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const sources = usePlaceSources(places, links[id ?? '']);

  useEffect(() => {
    if (id) void loadPlaces(id).catch(() => {});
  }, [id, loadPlaces]);

  const shown = useMemo(() => (trip && places ? shownPlan(trip, places) : null), [trip, places]);
  const mapDays = useMemo<MapDay[]>(
    () =>
      shown?.days.map((d) => ({
        day: d.day,
        color: dayColor(d.day),
        stops: d.stops.map((s, i) => ({ key: s.key, name: s.name, lat: s.lat, lng: s.lng, n: i + 1, must: !!s.must })),
      })) ?? [],
    [shown],
  );
  const mapMaybe = useMemo(
    () =>
      (shown?.maybe ?? [])
        .filter((m) => m.place.lat != null && m.place.lng != null)
        .map((m) => ({ key: m.place.id, name: m.place.name, lat: m.place.lat!, lng: m.place.lng! })),
    [shown],
  );

  if (!trip) {
    return (
      <View style={[styles.missing, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: 'Trip' }} />
        <T tone="muted">This trip isn’t in your list. It may have been deleted, or you were removed from it.</T>
        <Button variant="secondary" label="All trips" onPress={() => router.replace('/')} />
      </View>
    );
  }

  /** Runs a plan change, then reloads the places and the trip (its planned time) for everyone's view. */
  async function run(what: () => Promise<unknown>, done?: string) {
    if (!trip || !places) return;
    setBusy(true);
    setNote(null);
    try {
      await what();
      await Promise.all([loadPlaces(trip.id), refresh()]);
      if (done) setNote(done);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Something went wrong.');
      void loadPlaces(trip.id).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const hotel = startPoint(trip, places ?? []);
  const activeCount = places?.filter((p) => !p.removed).length ?? trip.place_count ?? 0;
  const isOwner = trip.owner_id === session?.user.id;

  const body = (
    <View style={styles.body}>
      <Stack.Screen options={{ title: trip.name }} />
      <ScreenHeader
        title={trip.name}
        meta={`${trip.city}  ·  ${dateRange(trip.start_date, trip.days)}`}
        actions={<Button label="+ Import link" onPress={() => setImporting(true)} />}
      />
      <View style={styles.tabs} accessibilityRole="tablist">
        {(
          [
            ['plan', 'Plan'],
            ['places', `Places (${activeCount})`],
            ['trip', 'Trip'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === k }}
            style={[styles.tab, { borderBottomColor: tab === k ? c.accent : 'transparent' }]}>
            <T variant="label" tone={tab === k ? 'text' : 'muted'}>
              {label}
            </T>
          </Pressable>
        ))}
      </View>
      {note ? <T tone="muted">{note}</T> : null}

      {!places || !shown ? (
        <T tone="muted">Loading places…</T>
      ) : tab === 'plan' ? (
        <PlanView
          trip={trip}
          start={hotel}
          shown={shown}
          sources={sources}
          busy={busy}
          focus={focus}
          onFocus={setFocus}
          onOptimize={() =>
            void run(
              () => optimize(trip, places, () => loadPlaces(trip.id)),
              'Planned with each place’s opening hours.',
            )
          }
          onMove={(placeId, day) => void run(() => moveToDay(trip, places, placeId, day))}
          onRemove={(placeId) => void run(() => removeFromPlan(trip, places, placeId), 'Removed. Add it back from Places.')}
          onAdd={setAdding}
        />
      ) : tab === 'places' ? (
        <PlacesTab trip={trip} places={places} sources={sources} onPatch={(placeId, patch) => updatePlace(trip.id, placeId, patch)} />
      ) : (
        <View style={{ gap: space.xl }}>
          <SectionLabel index="01">Trip details</SectionLabel>
          <TripDetails key={trip.updated_at} trip={trip} />
          <SectionLabel index="02">Start and end each day at</SectionLabel>
          <StartPoint trip={trip} />
          <SectionLabel index="03">Planning</SectionLabel>
          <PlanSettings key={`plan-${trip.updated_at}`} trip={trip} />
          <SectionLabel index="04">{isOwner ? 'Delete trip' : 'Leave trip'}</SectionLabel>
          {isOwner ? <DeleteTrip trip={trip} /> : <T tone="muted">Leaving a trip you were invited to comes with collaborators (step 4).</T>}
        </View>
      )}
      {tab === 'plan' && places?.length ? <GoogleMapsCredit /> : null}

      <ImportSheet
        tripId={trip.id}
        visible={importing}
        importedUrls={(links[trip.id] ?? []).flatMap((l) => (l.url ? [l.url] : []))}
        onClose={() => setImporting(false)}
        onAdded={(n) => {
          setImporting(false);
          setNote(`Added ${n} place${n === 1 ? '' : 's'}. They’re under Maybe until you plan again or drag them onto a day.`);
          void loadPlaces(trip.id).catch(() => {});
        }}
      />
      {adding !== null && places ? (
        <AddSheet
          day={adding}
          places={places}
          onClose={() => setAdding(null)}
          onAdd={(ids) => {
            const day = adding;
            setAdding(null);
            void run(() => addToDay(trip, places, ids, day));
          }}
        />
      ) : null}
    </View>
  );

  const map = <TripMap hotel={hotel} days={mapDays} maybe={mapMaybe} focus={focus} onPick={setFocus} height={wide ? '100%' : 260} />;

  if (wide) {
    return (
      <View style={[styles.split, { backgroundColor: c.bg }]}>
        <ScrollView style={styles.side} contentContainerStyle={styles.sideContent} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
        <View style={[styles.mapPane, { borderLeftColor: c.line }]}>{map}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {tab === 'plan' ? map : null}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.narrowContent} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
    </View>
  );
}

/** "+ Add" on a day: pick saved places that aren't on this day yet (removed ones too). */
function AddSheet({ day, places, onClose, onAdd }: { day: number; places: Place[]; onClose: () => void; onAdd: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = places
    .filter((p) => p.plan_day !== day && p.lat != null)
    .filter((p) => !q || [p.name, p.name_local, p.type, p.area].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => Number(a.removed) - Number(b.removed) || Number(a.plan_day != null) - Number(b.plan_day != null));
  return (
    <Sheet visible onClose={onClose} title={`Add to day ${day}`}>
      <Field value={query} onChangeText={setQuery} placeholder={`Search your saved places (${list.length})`} />
      {list.map((p) => (
        <Pressable
          key={p.id}
          onPress={() =>
            setPicked((prev) => {
              const next = new Set(prev);
              if (next.has(p.id)) next.delete(p.id);
              else next.add(p.id);
              return next;
            })
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: picked.has(p.id) }}
          style={styles.addRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="bodyStrong" numberOfLines={1}>
              {p.name}
            </T>
            <T variant="small" tone="muted" numberOfLines={1}>
              {[p.type, p.area, p.removed ? 'removed earlier' : p.plan_day ? `now on day ${p.plan_day}` : 'Maybe'].filter(Boolean).join(' · ')}
            </T>
          </View>
          <Check checked={picked.has(p.id)} />
        </Pressable>
      ))}
      {!list.length ? <T tone="muted">Every saved place is already on this day.</T> : null}
      <Rule />
      <Button
        label={picked.size ? `Add ${picked.size} place${picked.size === 1 ? '' : 's'} to day ${day}` : 'Pick places to add'}
        disabled={!picked.size}
        onPress={() => onAdd([...picked])}
      />
    </Sheet>
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
      setNote(dayCount !== trip.days ? 'Saved. Plan your days again to use the new number of days.' : 'Saved.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ flex: 3, minWidth: 160 }}>
          <Field label="Trip name" value={name} onChangeText={setName} maxLength={80} />
        </View>
        <View style={{ flex: 2, minWidth: 120 }}>
          <Field label="City" value={city} onChangeText={setCity} maxLength={80} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 2, minWidth: 130 }}>
          <Field label="Start date" value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" maxLength={10} />
        </View>
        <View style={{ flex: 1, minWidth: 70 }}>
          <Field label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={2} onSubmitEditing={save} />
        </View>
        <Button label="Save" variant="secondary" loading={busy} disabled={!valid || !changed} onPress={save} style={{ alignSelf: 'flex-end' }} />
      </View>
      {note ? (
        <T variant="small" tone="muted">
          {note}
        </T>
      ) : null}
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
  missing: { flex: 1, padding: space.xl, gap: space.xl },
  body: { gap: space.lg },
  split: { flex: 1, flexDirection: 'row' },
  side: { width: 520, flexGrow: 0, flexShrink: 0 },
  sideContent: { padding: space.xl, paddingBottom: space.xxxl },
  mapPane: { flex: 1, borderLeftWidth: 2, overflow: 'hidden' },
  narrowContent: { padding: space.lg, paddingBottom: space.xxxl },
  tabs: { flexDirection: 'row', gap: space.lg },
  tab: { paddingVertical: space.sm, borderBottomWidth: 3, minHeight: typeScale.label.lineHeight + space.lg },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
});
