import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { T } from '@/components/ui';
import { fonts, space, useColors } from '@/lib/theme';

import type { TripMapProps } from './trip-map-types';

/**
 * The trip on a Google map (Maps SDK for Android: no charge). Places come from Google, so Google's terms
 * require a Google map here (docs/google-maps-terms.md); the map shows Google's logo itself.
 */
export function TripMap({ hotel, days, maybe, focus, onPick, height }: TripMapProps) {
  const c = useColors();
  const ref = useRef<MapView>(null);
  const keySet = !!Constants.expoConfig?.extra?.mapsKeySet;
  const points = [...(hotel ? [hotel] : []), ...days.flatMap((d) => d.stops), ...maybe];
  const fitKey = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');

  useEffect(() => {
    if (!fitKey) return;
    const coords = fitKey.split('|').map((s) => {
      const [latitude, longitude] = s.split(',').map(Number);
      return { latitude, longitude };
    });
    const t = setTimeout(
      () => ref.current?.fitToCoordinates(coords, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false }),
      300,
    );
    return () => clearTimeout(t);
  }, [fitKey]);

  useEffect(() => {
    const s = days.flatMap((d) => d.stops).find((x) => x.key === focus);
    if (s) ref.current?.animateToRegion({ latitude: s.lat, longitude: s.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
  }, [focus, days]);

  if (!keySet) {
    return (
      <View style={[styles.empty, { height, backgroundColor: c.surface }]}>
        <T variant="small" tone="muted">
          The map needs a Google Maps key for Android (GOOGLE_MAPS_ANDROID_KEY) in this build.
        </T>
      </View>
    );
  }

  const loop = (stops: { lat: number; lng: number }[]) =>
    [...(hotel ? [hotel] : []), ...stops, ...(hotel ? [hotel] : [])].map((p) => ({ latitude: p.lat, longitude: p.lng }));

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={{ height, width: '100%' }}
      initialRegion={hotel ? { latitude: hotel.lat, longitude: hotel.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 } : undefined}
      toolbarEnabled={false}>
      {hotel ? (
        <Marker coordinate={{ latitude: hotel.lat, longitude: hotel.lng }} title={hotel.name} description="Start and end of each day" />
      ) : null}
      {days.map((d) =>
        d.stops.length ? <Polyline key={`line-${d.day}`} coordinates={loop(d.stops)} strokeColor={d.color} strokeWidth={3} /> : null,
      )}
      {days.flatMap((d) =>
        d.stops.map((s) => (
          <Marker
            key={s.key}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={`${s.must ? '★ ' : ''}${s.name}`}
            description={`Day ${d.day}, stop ${s.n}`}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => onPick?.(s.key)}>
            <View style={[styles.num, { backgroundColor: d.color, borderColor: s.must ? '#000000' : '#FFFFFF' }]}>
              <Text style={styles.numText}>{s.n}</Text>
            </View>
          </Marker>
        )),
      )}
      {maybe.map((m) => (
        <Marker
          key={m.key}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.name}
          description="Maybe"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}>
          <View style={styles.dot} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  empty: { width: '100%', justifyContent: 'center', padding: space.lg },
  num: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 11 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(102,102,96,0.5)', borderWidth: 1, borderColor: '#666660' },
});
