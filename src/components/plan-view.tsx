import { useRef, useState, type ComponentRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { SourceLink, SourceThumb, type PlaceSource } from '@/components/place-source';
import { Button, Chip, T } from '@/components/ui';
import { directionsUrl, type ShownPlan } from '@/lib/plan';
import { closedOnDay, type DayPlan, type Stop, type TravelMode } from '@/lib/planner';
import { dayColor, space, useColors } from '@/lib/theme';
import type { Place, Trip } from '@/lib/types';

type ViewRef = ComponentRef<typeof View>;

const MODE: Record<TravelMode, string> = { walk: 'Walk', transit: 'Train or bus', car: 'Taxi or car' };

type Rect = { day: number; y: number; height: number };

/** A place being dragged: which day it would land on, and the day sections' positions on screen. */
type Drag = { key: string; over: number | null; rects: Rect[] };

/**
 * The day-by-day plan. Long-press a stop (or a Maybe place) and drag it onto another day; tap a stop for its
 * actions (move to a day, directions, Google Maps, remove). Only the days involved change; "Plan my days" re-plans all.
 */
export function PlanView({
  trip,
  start,
  shown,
  sources,
  busy,
  onOptimize,
  onMove,
  onRemove,
  onAdd,
  onFocus,
  focus,
}: {
  trip: Trip;
  /** Where days start: the hotel, or the middle of the places until one is set. */
  start: { name: string; lat: number; lng: number } | null;
  shown: ShownPlan;
  sources: Record<string, PlaceSource>;
  busy: boolean;
  onOptimize: () => void;
  onMove: (placeId: string, day: number) => void;
  onRemove: (placeId: string) => void;
  onAdd: (day: number) => void;
  onFocus: (key: string | null) => void;
  focus: string | null;
}) {
  const sections = useRef(new Map<number, ViewRef>());
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const hotel = start;
  const hotelName = start?.name ?? trip.city;

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const begin = (key: string) => {
    const rects: Rect[] = [];
    const entries = [...sections.current.entries()];
    let left = entries.length;
    setDragBoth({ key, over: null, rects });
    for (const [day, view] of entries) {
      view.measureInWindow((_x, y, _w, height) => {
        rects.push({ day, y, height });
        if (--left === 0 && dragRef.current) setDragBoth({ ...dragRef.current, rects: [...rects] });
      });
    }
  };
  const over = (absoluteY: number) => {
    const d = dragRef.current;
    if (!d) return;
    const hit = d.rects.find((r) => absoluteY >= r.y && absoluteY <= r.y + r.height)?.day ?? null;
    if (hit !== d.over) setDragBoth({ ...d, over: hit });
  };
  const drop = (fromDay: number | null) => {
    const d = dragRef.current;
    setDragBoth(null);
    if (d?.over && d.over !== fromDay) onMove(d.key, d.over);
  };
  const dragProps = { begin, over, drop, dragging: drag?.key ?? null };

  if (shown.unplanned) {
    const count = shown.maybe.length;
    return (
      <View style={{ gap: space.md }}>
        <T tone="muted">
          {count
            ? `${count} place${count === 1 ? '' : 's'} saved. Tripbox puts nearby places on the same day, in an order that saves travel, around opening hours and meal times.`
            : 'Import links first; their places become the plan.'}
        </T>
        <Button label="Plan my days" loading={busy} disabled={!count} onPress={onOptimize} />
        <T variant="small" tone="muted">
          Star the places you must go to in Places, or give them a day and time, before planning.
        </T>
      </View>
    );
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.bar}>
        <Button label="Plan my days again" variant="secondary" size="sm" loading={busy} onPress={onOptimize} />
        <T variant="small" tone="muted" style={{ flex: 1, minWidth: 180 }}>
          Hold a stop and drag it to another day. Other days stay as they are until you plan again.
        </T>
      </View>
      {!shown.hoursChecked ? (
        <T variant="small" tone="muted">
          Times assume every place is open. Opening hours can’t be saved (Google’s rules), so “Plan my days again”
          checks them.
        </T>
      ) : null}
      {shown.days.map((d) => (
        <DaySection
          key={d.day}
          d={d}
          refFn={(v) => {
            if (v) sections.current.set(d.day, v);
            else sections.current.delete(d.day);
          }}
          highlighted={drag?.over === d.day}
          hotel={hotel}
          hotelName={hotelName}
          days={trip.days}
          startDate={trip.start_date}
          dayEnd={trip.day_end.slice(0, 5)}
          sources={sources}
          focus={focus}
          onFocus={onFocus}
          onMove={onMove}
          onRemove={onRemove}
          onAdd={() => onAdd(d.day)}
          drag={dragProps}
        />
      ))}
      {shown.maybe.length ? (
        <View style={{ gap: space.sm }}>
          <T variant="label">{`Maybe (${shown.maybe.length})`}</T>
          <T variant="small" tone="muted">
            Not on a day yet. Drag one onto a day, or tap it to pick a day.
          </T>
          {shown.maybe.map((m) => (
            <MaybeRow key={m.place.id} place={m.place} reason={m.reason} days={trip.days} sources={sources} onMove={onMove} drag={dragProps} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type DragProps = {
  begin: (key: string) => void;
  over: (absoluteY: number) => void;
  drop: (fromDay: number | null) => void;
  dragging: string | null;
};

/** Long-press then drag. The row follows the finger; letting go over a day moves the place there. */
function Draggable({ id, fromDay, drag, children }: { id: string; fromDay: number | null; drag: DragProps; children: React.ReactNode }) {
  const [ty] = useState(() => new Animated.Value(0));
  const gesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .runOnJS(true)
    .onStart(() => drag.begin(id))
    .onUpdate((e) => {
      ty.setValue(e.translationY);
      drag.over(e.absoluteY);
    })
    .onEnd(() => drag.drop(fromDay))
    .onFinalize(() => {
      ty.setValue(0);
      if (drag.dragging === id) drag.drop(fromDay);
    });
  const active = drag.dragging === id;
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ transform: [{ translateY: ty }] }, active && styles.lifted]}>{children}</Animated.View>
    </GestureDetector>
  );
}

function DaySection({
  d,
  refFn,
  highlighted,
  hotel,
  hotelName,
  days,
  startDate,
  dayEnd,
  sources,
  focus,
  onFocus,
  onMove,
  onRemove,
  onAdd,
  drag,
}: {
  d: DayPlan;
  refFn: (v: ViewRef | null) => void;
  highlighted: boolean;
  hotel: { lat: number; lng: number } | null;
  hotelName: string;
  days: number;
  startDate: string;
  dayEnd: string;
  sources: Record<string, PlaceSource>;
  focus: string | null;
  onFocus: (key: string | null) => void;
  onMove: (placeId: string, day: number) => void;
  onRemove: (placeId: string) => void;
  onAdd: () => void;
  drag: DragProps;
}) {
  const c = useColors();
  const color = dayColor(d.day);
  return (
    <View
      ref={refFn}
      style={[styles.day, { borderColor: highlighted ? c.accent : 'transparent', backgroundColor: highlighted ? c.surface : 'transparent' }]}>
      <View style={styles.dayHead}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <T variant="heading" style={{ flex: 1 }}>{`Day ${d.day} · ${d.weekday} ${d.date.slice(5)}`}</T>
        <Button label="+ Add" variant="ghost" size="sm" onPress={onAdd} accessibilityLabel={`Add places to day ${d.day}`} />
      </View>
      <T variant="small" tone="muted">{`From ${hotelName}`}</T>
      {d.stops.length ? (
        d.stops.map((s, i) => {
          const from = i ? d.stops[i - 1] : hotel;
          return (
            <View key={s.key}>
              <Leg from={from} to={s} travelMin={s.travelMin} travelKm={s.travelKm} mode={s.travelMode} />
              <Draggable id={s.key} fromDay={d.day} drag={drag}>
                <StopRow
                  s={s}
                  n={i + 1}
                  color={color}
                  source={sources[s.key]}
                  open={focus === s.key}
                  days={days}
                  day={d.day}
                  warning={
                    closedOnDay(s.periods, startDate, d.day)
                      ? `Closed on ${d.weekday}`
                      : s.leave > dayEnd
                        ? 'Ends after your day ends'
                        : ''
                  }
                  onToggle={() => onFocus(focus === s.key ? null : s.key)}
                  onMove={(day) => onMove(s.key, day)}
                  onRemove={() => onRemove(s.key)}
                />
              </Draggable>
            </View>
          );
        })
      ) : (
        <T tone="muted" style={{ paddingVertical: space.sm }}>
          Nothing planned. Drag a place here or press + Add.
        </T>
      )}
      {d.stops.length && d.back ? (
        <>
          <Leg from={d.stops.at(-1)!} to={hotel} travelMin={d.back.travelMin} travelKm={d.back.travelKm} mode={d.back.travelMode} />
          <T variant="small" tone="muted">{`Back at ${hotelName} about ${d.endBack}`}</T>
        </>
      ) : null}
    </View>
  );
}

function Leg({
  from,
  to,
  travelMin,
  travelKm,
  mode,
}: {
  from: { lat: number; lng: number } | null;
  to: { lat: number; lng: number } | null;
  travelMin: number;
  travelKm: number;
  mode: TravelMode;
}) {
  if (travelKm < 0.1) {
    return (
      <T variant="small" tone="muted" style={styles.leg}>
        ↓ Next door
      </T>
    );
  }
  return (
    <T variant="small" tone="muted" style={styles.leg}>
      {`↓ ${MODE[mode]} · about ${travelMin} min · ${travelKm} km · `}
      {from && to ? (
        <T variant="small" tone="accent" onPress={() => void Linking.openURL(directionsUrl(from, to, mode))} accessibilityRole="link">
          Directions
        </T>
      ) : null}
    </T>
  );
}

function StopRow({
  s,
  n,
  color,
  source,
  open,
  days,
  day,
  warning,
  onToggle,
  onMove,
  onRemove,
}: {
  s: Stop;
  n: number;
  color: string;
  source?: PlaceSource;
  open: boolean;
  days: number;
  day: number;
  warning: string;
  onToggle: () => void;
  onMove: (day: number) => void;
  onRemove: () => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.stopWrap, { borderColor: open ? c.line : c.border, backgroundColor: c.bg }]}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.stop}>
        <View style={[styles.num, { backgroundColor: color }]}>
          <T variant="number" style={{ color: '#FFFFFF' }}>
            {n}
          </T>
        </View>
        <SourceThumb source={source} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyStrong" numberOfLines={1}>
            {s.must ? <T tone="accent">★ </T> : null}
            {s.name}
          </T>
          <T variant="small" tone="muted" numberOfLines={1}>
            {`${s.start}–${s.leave} · ${s.type}`}
            {s.pinned ? ' · booked time' : ''}
            {s.late ? ' · late' : ''}
            {s.waitMin >= 15 ? ` · ${s.waitMin} min free before` : ''}
          </T>
          {warning ? (
            <T variant="small" tone="danger">
              {warning}
            </T>
          ) : null}
          <SourceLink source={source} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm, paddingTop: space.sm }}>
          <View style={styles.chips}>
            {Array.from({ length: days }, (_, i) => i + 1)
              .filter((x) => x !== day)
              .map((x) => (
                <Chip key={x} label={`To day ${x}`} onPress={() => onMove(x)} />
              ))}
          </View>
          <View style={styles.chips}>
            {s.mapsUrl ? <Button size="sm" variant="secondary" label="Google Maps" onPress={() => void Linking.openURL(s.mapsUrl!)} /> : null}
            <Button size="sm" variant="danger" label="Remove from trip" onPress={onRemove} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MaybeRow({
  place,
  reason,
  days,
  sources,
  onMove,
  drag,
}: {
  place: Place;
  reason: string;
  days: number;
  sources: Record<string, PlaceSource>;
  onMove: (placeId: string, day: number) => void;
  drag: DragProps;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const source = sources[place.id];
  const row = (
    <View style={[styles.stopWrap, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.stop}>
        <SourceThumb source={source} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyStrong" numberOfLines={1}>
            {place.must ? <T tone="accent">★ </T> : null}
            {place.name}
          </T>
          {reason ? (
            <T variant="small" tone="muted" numberOfLines={2}>
              {reason}
            </T>
          ) : null}
          <SourceLink source={source} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.chips, { paddingTop: space.sm }]}>
          {Array.from({ length: days }, (_, i) => (
            <Chip key={i} label={`To day ${i + 1}`} onPress={() => onMove(place.id, i + 1)} />
          ))}
        </View>
      ) : null}
    </View>
  );
  // Without coordinates the place can't go on a day yet.
  return place.lat == null ? (
    row
  ) : (
    <Draggable id={place.id} fromDay={null} drag={drag}>
      {row}
    </Draggable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: space.md, alignItems: 'center', flexWrap: 'wrap' },
  day: { gap: space.xs, borderWidth: 2, padding: space.sm, marginHorizontal: -space.sm },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: { width: 14, height: 14 },
  leg: { paddingVertical: space.xs, paddingLeft: space.xl },
  stopWrap: { borderWidth: 1, padding: space.sm },
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  lifted: { zIndex: 10, opacity: 0.9, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
