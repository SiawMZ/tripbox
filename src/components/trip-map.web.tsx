import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { space, useColors } from '@/lib/theme';

import type { TripMapProps } from './trip-map-types';

// Google Maps JavaScript API. Each map created counts as one "Dynamic Maps" load (10,000 free a month, then
// US$7 per 1,000), so one map is made per trip screen and redrawn in place. The key is a browser key: restrict it
// in Google Cloud to "Maps JavaScript API" and to the Tripbox website's address.
const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;

type G = any;
let loading: Promise<G> | null = null;

function loadGoogle(): Promise<G> {
  const w = window as G;
  if (w.google?.maps?.Map) return Promise.resolve(w.google);
  loading ??= new Promise((resolve, reject) => {
    w.__tripboxMapsReady = () => resolve(w.google);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY ?? '')}&v=weekly&loading=async&callback=__tripboxMapsReady`;
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new Error('Could not load Google Maps.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

const pinSvg = (color: string, n: number, must: boolean) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="11" fill="${color}" stroke="${must ? '#000' : '#fff'}" stroke-width="2"/><text x="13" y="17" font-family="Arial" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${n}</text></svg>`,
  )}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** The trip on a Google map (web). Google's terms require a Google map for Places data (docs/google-maps-terms.md). */
export function TripMap({ hotel, days, maybe, focus, onPick, height }: TripMapProps) {
  const c = useColors();
  const box = useRef<ComponentRef<typeof View>>(null);
  const map = useRef<G>(null);
  const layer = useRef<G[]>([]);
  const markers = useRef<Map<string, G>>(new Map());
  const info = useRef<G>(null);
  const [error, setError] = useState<string | null>(
    KEY ? null : 'The map needs a Google Maps browser key (EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY).',
  );
  const [ready, setReady] = useState(false);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  const start = useRef(hotel);
  useEffect(() => {
    if (!KEY) return;
    let alive = true;
    loadGoogle()
      .then((google) => {
        if (!alive || !box.current) return;
        const h = start.current;
        map.current = new google.maps.Map(box.current as unknown as HTMLElement, {
          center: h ? { lat: h.lat, lng: h.lng } : { lat: 0, lng: 0 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        info.current = new google.maps.InfoWindow();
        setReady(true);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const drawKey = JSON.stringify([hotel, days, maybe]);
  useEffect(() => {
    const google = (window as G).google;
    if (!ready || !map.current || !google) return;
    const [h, ds, mb] = JSON.parse(drawKey) as [TripMapProps['hotel'], TripMapProps['days'], TripMapProps['maybe']];
    for (const x of layer.current) x.setMap(null);
    layer.current = [];
    markers.current.clear();
    const bounds = new google.maps.LatLngBounds();
    const add = (x: G) => {
      layer.current.push(x);
      return x;
    };
    const popup = (m: G, html: string) =>
      m.addListener('click', () => {
        info.current.setContent(html);
        info.current.open({ map: map.current, anchor: m });
      });
    if (h) {
      const hm = add(new google.maps.Marker({ map: map.current, position: { lat: h.lat, lng: h.lng }, title: h.name }));
      popup(hm, `<b>${esc(h.name)}</b><br>Start and end of each day`);
      bounds.extend({ lat: h.lat, lng: h.lng });
    }
    const home = h ? [{ lat: h.lat, lng: h.lng }] : [];
    for (const d of ds) {
      if (!d.stops.length) continue;
      const path = [...home, ...d.stops.map((s) => ({ lat: s.lat, lng: s.lng })), ...home];
      add(new google.maps.Polyline({ map: map.current, path, strokeColor: d.color, strokeWeight: 3, strokeOpacity: 0.85 }));
      for (const s of d.stops) {
        const m = add(
          new google.maps.Marker({
            map: map.current,
            position: { lat: s.lat, lng: s.lng },
            title: s.name,
            icon: { url: pinSvg(d.color, s.n, s.must), anchor: new google.maps.Point(13, 13) },
            zIndex: 10,
          }),
        );
        markers.current.set(s.key, m);
        popup(m, `<b>${s.must ? '★ ' : ''}${esc(s.name)}</b><br>Day ${d.day}, stop ${s.n}`);
        m.addListener('click', () => pick.current?.(s.key));
        bounds.extend({ lat: s.lat, lng: s.lng });
      }
    }
    for (const p of mb) {
      const m = add(
        new google.maps.Marker({
          map: map.current,
          position: { lat: p.lat, lng: p.lng },
          title: p.name,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#666660', fillOpacity: 0.4, strokeColor: '#666660', strokeWeight: 1 },
        }),
      );
      popup(m, `<b>${esc(p.name)}</b><br>Maybe`);
      bounds.extend({ lat: p.lat, lng: p.lng });
    }
    if (layer.current.length > 1) map.current.fitBounds(bounds, 30);
    else if (h) map.current.setCenter({ lat: h.lat, lng: h.lng });
  }, [ready, drawKey]);

  useEffect(() => {
    const m = focus ? markers.current.get(focus) : null;
    if (!m || !map.current) return;
    map.current.panTo(m.getPosition());
    if (map.current.getZoom() < 15) map.current.setZoom(15);
    (window as G).google.maps.event.trigger(m, 'click');
  }, [focus]);

  return (
    <View style={{ height, width: '100%', backgroundColor: c.surface }}>
      <View ref={box} style={StyleSheet.absoluteFill} />
      {error ? (
        <View style={[StyleSheet.absoluteFill, styles.note]}>
          <T variant="small" tone="muted">
            {error}
          </T>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { justifyContent: 'center', padding: space.lg },
});
