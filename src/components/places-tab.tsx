import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { GoogleMapsCredit } from '@/components/import-sheet';
import { SourceLink, SourceThumb, type PlaceSource } from '@/components/place-source';
import { Button, Chip, Field, T } from '@/components/ui';
import { dayInfo } from '@/lib/planner';
import { space, useColors } from '@/lib/theme';
import type { Place, PlacePatch, Trip } from '@/lib/types';

const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/**
 * Every saved place. ★ = must go (planned first; other places only where they're on the way). A chosen day keeps
 * the place on that day; a time too makes it a booking. ✕ takes it off this trip; + adds it back.
 * Changes here apply the next time the trip is planned.
 */
export function PlacesTab({
  trip,
  places,
  sources,
  onPatch,
}: {
  trip: Trip;
  places: Place[];
  sources: Record<string, PlaceSource>;
  onPatch: (placeId: string, patch: PlacePatch) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const list = places
    .filter((p) => !q || [p.name, p.name_local, p.type, p.area].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => Number(a.removed) - Number(b.removed) || Number(b.must) - Number(a.must) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  const counts = {
    must: places.filter((p) => p.must && !p.removed).length,
    other: places.filter((p) => !p.must && !p.removed).length,
    removed: places.filter((p) => p.removed).length,
  };

  const patch = (id: string, change: PlacePatch) => {
    setError(null);
    onPatch(id, change).catch((e) => setError(e instanceof Error ? e.message : 'Could not save.'));
  };

  if (!places.length) {
    return (
      <T tone="muted">
        No places yet. Import links to posts you saved on Xiaohongshu, Instagram, YouTube, TikTok or travel blogs; the places
        in them become this trip’s plan.
      </T>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      <T variant="small" tone="muted">
        {`${counts.must} must-go · ${counts.other} if on the way · ${counts.removed} removed. ★ marks a must-go. Changes apply when you plan again.`}
      </T>
      {places.length > 8 ? <Field value={query} onChangeText={setQuery} placeholder={`Search ${places.length} places`} /> : null}
      {error ? <T tone="danger">{error}</T> : null}
      {list.map((p) => (
        <PlaceRow
          key={p.id}
          p={p}
          trip={trip}
          source={sources[p.id]}
          open={open === p.id}
          onToggle={() => setOpen(open === p.id ? null : p.id)}
          onPatch={(change) => patch(p.id, change)}
        />
      ))}
      <GoogleMapsCredit />
    </View>
  );
}

function PlaceRow({
  p,
  trip,
  source,
  open,
  onToggle,
  onPatch,
}: {
  p: Place;
  trip: Trip;
  source?: PlaceSource;
  open: boolean;
  onToggle: () => void;
  onPatch: (change: PlacePatch) => void;
}) {
  const c = useColors();
  const [time, setTime] = useState(p.fixed_time?.slice(0, 5) ?? '');
  const day = p.fixed_day && p.fixed_day <= trip.days ? p.fixed_day : null;
  const when = day ? `Day ${day}${p.fixed_time ? ` at ${p.fixed_time.slice(0, 5)}` : ''}` : '';
  return (
    <View style={[styles.row, { borderColor: open ? c.line : c.border, opacity: p.removed ? 0.55 : 1 }]}>
      <View style={styles.main}>
        <Pressable
          onPress={() => onPatch({ must: !p.must })}
          disabled={p.removed}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: p.must }}
          accessibilityLabel={`Must go: ${p.name}`}
          style={styles.star}>
          <T variant="title" tone={p.must ? 'accent' : 'muted'}>
            {p.must ? '★' : '☆'}
          </T>
        </Pressable>
        <SourceThumb source={source} size={48} />
        <Pressable onPress={onToggle} style={{ flex: 1, gap: 2 }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
          <T variant="bodyStrong" numberOfLines={1}>
            {p.name}
            {p.name_local && p.name_local !== p.name ? <T variant="small" tone="muted">{`  ${p.name_local}`}</T> : null}
          </T>
          <T variant="small" tone="muted" numberOfLines={1}>
            {[p.type, p.area, when, p.removed ? 'removed' : ''].filter(Boolean).join(' · ')}
          </T>
          <SourceLink source={source} />
        </Pressable>
        <Button
          size="sm"
          variant="ghost"
          label={p.removed ? '+' : '✕'}
          accessibilityLabel={p.removed ? `Add ${p.name} back` : `Remove ${p.name} from this trip`}
          onPress={() => onPatch({ removed: !p.removed })}
        />
      </View>
      {open && !p.removed ? (
        <View style={{ gap: space.sm, paddingTop: space.sm }}>
          <T variant="label" tone="muted">
            Day
          </T>
          <View style={styles.chips}>
            <Chip label="Any day" active={!day} onPress={() => onPatch({ fixed_day: null, fixed_time: null })} />
            {Array.from({ length: trip.days }, (_, i) => (
              <Chip
                key={i}
                label={`${i + 1} · ${dayInfo(trip.start_date, i + 1).weekday}`}
                active={day === i + 1}
                onPress={() => onPatch({ fixed_day: i + 1, must: true })}
              />
            ))}
          </View>
          {day ? (
            <View style={styles.time}>
              <View style={{ width: 120 }}>
                <Field
                  label="Booked time (optional)"
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  maxLength={5}
                  onSubmitEditing={() => isTime(time) && onPatch({ fixed_time: time })}
                />
              </View>
              <Button
                size="sm"
                variant="secondary"
                label={time ? 'Set time' : 'No time'}
                disabled={!!time && !isTime(time)}
                onPress={() => onPatch({ fixed_time: time ? time : null })}
              />
            </View>
          ) : null}
          {p.maps_url ? (
            <View style={styles.chips}>
              <Button size="sm" variant="secondary" label="Open in Google Maps" onPress={() => void Linking.openURL(p.maps_url!)} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, padding: space.sm },
  main: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  star: { width: 28, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  time: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
});
