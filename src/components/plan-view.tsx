import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { SourceLink, SourceThumb, type PlaceSource } from '@/components/place-source';
import { Button, Chip, T } from '@/components/ui';
import { directionsUrl, type ShownPlan } from '@/lib/plan';
import { closedOnDay, type DayPlan, type Stop, type TravelMode } from '@/lib/planner';
import { dayColor, space, useColors } from '@/lib/theme';
import type { Place, Trip } from '@/lib/types';

type ViewRef = ComponentRef<typeof View>;

const MODE: Record<TravelMode, string> = { walk: 'Walk', transit: 'Train or bus', car: 'Taxi or car' };

/** Where a dragged place would land: a day, and its position among that day's other stops. */
type Target = { day: number; index: number };

/** A place being dragged, with the day sections' and stops' positions on screen (measured when the drag starts). */
type Drag = {
  key: string;
  fromDay: number | null;
  target: Target | null;
  days: { day: number; y: number; height: number }[];
  stops: { key: string; day: number; mid: number }[];
};

type DragApi = {
  begin: (key: string, fromDay: number | null) => void;
  move: (absoluteY: number) => void;
  end: () => void;
  dragging: string | null;
};

/**
 * The day-by-day plan. Drag a stop by its ⠿ handle (or hold it, on a phone) to another spot in its day or onto
 * another day; Maybe places drag the same way. Tap a stop for its actions. Only the days involved change; "Plan my
 * days again" re-plans all.
 */
export function PlanView({
  trip,
  start,
  shown,
  sources,
  busy,
  onOptimize,
  onMove,
  onUnplan,
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
  /** `index` (a drop spot) keeps the day's order and puts the place there; without it the place is fitted in. */
  onMove: (placeId: string, day: number, index?: number) => void;
  onUnplan: (placeId: string) => void;
  onRemove: (placeId: string) => void;
  onAdd: (day: number) => void;
  onFocus: (key: string | null) => void;
  focus: string | null;
}) {
  const sections = useRef(new Map<number, ViewRef>());
  const stopViews = useRef(new Map<string, { day: number; view: ViewRef }>());
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const hotelName = start?.name ?? trip.city;

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const api: DragApi = {
    begin(key, fromDay) {
      noTextSelection(true);
      const d: Drag = { key, fromDay, target: null, days: [], stops: [] };
      setDragBoth(d);
      for (const [day, view] of sections.current) {
        view.measureInWindow((_x, y, _w, height) => d.days.push({ day, y, height }));
      }
      for (const [k, { day, view }] of stopViews.current) {
        if (k !== key) view.measureInWindow((_x, y, _w, height) => d.stops.push({ key: k, day, mid: y + height / 2 }));
      }
    },
    move(y) {
      const d = dragRef.current;
      if (!d) return;
      const day = d.days.find((r) => y >= r.y && y <= r.y + r.height)?.day ?? null;
      const target = day === null ? null : { day, index: d.stops.filter((s) => s.day === day && s.mid < y).length };
      if (target?.day !== d.target?.day || target?.index !== d.target?.index) setDragBoth({ ...d, target });
    },
    end() {
      noTextSelection(false);
      const d = dragRef.current;
      setDragBoth(null);
      if (!d?.target) return;
      // Dropped where it already was: nothing to do.
      const day = shown.days.find((x) => x.day === d.target!.day);
      const now = day?.stops.findIndex((s) => s.key === d.key) ?? -1;
      if (d.fromDay === d.target.day && now === d.target.index) return;
      onMove(d.key, d.target.day, d.target.index);
    },
    dragging: drag?.key ?? null,
  };

  const registerStop = (key: string, day: number) => (v: ViewRef | null) => {
    if (v) stopViews.current.set(key, { day, view: v });
    else stopViews.current.delete(key);
  };

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
          {Platform.OS === 'web'
            ? 'Drag a stop by ⠿ to change its order or its day. Other days stay as they are until you plan again.'
            : 'Drag a stop by ⠿, or hold it, to change its order or its day. Other days stay as they are until you plan again.'}
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
          registerStop={registerStop}
          target={drag?.target?.day === d.day ? drag.target.index : null}
          hotel={start}
          hotelName={hotelName}
          days={trip.days}
          startDate={trip.start_date}
          dayEnd={trip.day_end.slice(0, 5)}
          sources={sources}
          focus={focus}
          onFocus={onFocus}
          onMove={onMove}
          onUnplan={onUnplan}
          onRemove={onRemove}
          onAdd={() => onAdd(d.day)}
          drag={api}
        />
      ))}
      {shown.maybe.length ? (
        <View style={{ gap: space.sm }}>
          <T variant="label">{`Maybe (${shown.maybe.length})`}</T>
          <T variant="small" tone="muted">
            Not on a day yet. Drag one onto a day, or tap it to pick a day.
          </T>
          {shown.maybe.map((m) => (
            <MaybeRow key={m.place.id} place={m.place} reason={m.reason} days={trip.days} sources={sources} onMove={onMove} drag={api} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Makes a row draggable. The ⠿ handle (`handle` in the render function) starts a drag at once, which is what a mouse
 * needs; on phones holding the row anywhere works too. The row follows the pointer; letting go drops it.
 */
function Draggable({
  id,
  fromDay,
  drag,
  children,
}: {
  id: string;
  fromDay: number | null;
  drag: DragApi;
  children: (handle: ReactNode) => ReactNode;
}) {
  const c = useColors();
  const [ty] = useState(() => new Animated.Value(0));
  const build = (pan: ReturnType<typeof Gesture.Pan>) =>
    pan
      .runOnJS(true)
      .onStart(() => drag.begin(id, fromDay))
      .onUpdate((e) => {
        ty.setValue(e.translationY);
        drag.move(e.absoluteY);
      })
      .onEnd(() => drag.end())
      .onFinalize(() => {
        ty.setValue(0);
        noTextSelection(false);
      });
  const handleGesture = build(Gesture.Pan().minDistance(2));
  const holdGesture = build(Gesture.Pan().activateAfterLongPress(350));
  const active = drag.dragging === id;
  const handle = (
    <GestureDetector gesture={handleGesture}>
      <View
        style={[styles.handle, Platform.OS === 'web' && (webGrab as ViewStyle)]}
        accessibilityLabel="Drag to move"
        accessibilityHint="Or open the stop and pick a day">
        <T tone="muted" style={{ fontSize: 18, lineHeight: 20, color: active ? c.accent : c.muted }}>
          ⠿
        </T>
      </View>
    </GestureDetector>
  );
  const row = (
    <Animated.View style={[{ transform: [{ translateY: ty }] }, active && styles.lifted]}>{children(handle)}</Animated.View>
  );
  // Holding the whole row would fight text selection and scrolling with a mouse, so on the web only the handle drags.
  return Platform.OS === 'web' ? row : <GestureDetector gesture={holdGesture}>{row}</GestureDetector>;
}

/** On the web, a mouse drag would also select the text it passes over; switch that off while dragging. */
function noTextSelection(on: boolean) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.body.style.userSelect = on ? 'none' : '';
  if (on) window.getSelection()?.removeAllRanges();
}

/** react-native-web passes these through to CSS; they aren't in React Native's style types. */
const webGrab = { cursor: 'grab', userSelect: 'none', touchAction: 'none' } as unknown;

function DropLine() {
  const c = useColors();
  return <View style={[styles.dropLine, { backgroundColor: c.accent }]} accessibilityLabel="Drop here" />;
}

function DaySection({
  d,
  refFn,
  registerStop,
  target,
  hotel,
  hotelName,
  days,
  startDate,
  dayEnd,
  sources,
  focus,
  onFocus,
  onMove,
  onUnplan,
  onRemove,
  onAdd,
  drag,
}: {
  d: DayPlan;
  refFn: (v: ViewRef | null) => void;
  registerStop: (key: string, day: number) => (v: ViewRef | null) => void;
  /** Drop position while a place is dragged over this day, among its other stops. */
  target: number | null;
  hotel: { lat: number; lng: number } | null;
  hotelName: string;
  days: number;
  startDate: string;
  dayEnd: string;
  sources: Record<string, PlaceSource>;
  focus: string | null;
  onFocus: (key: string | null) => void;
  onMove: (placeId: string, day: number, index?: number) => void;
  onUnplan: (placeId: string) => void;
  onRemove: (placeId: string) => void;
  onAdd: () => void;
  drag: DragApi;
}) {
  const c = useColors();
  const color = dayColor(d.day);
  const over = target !== null;
  let others = 0; // stops other than the dragged one, so far: where the drop line goes
  return (
    <View
      ref={refFn}
      style={[styles.day, { borderColor: over ? c.accent : 'transparent', backgroundColor: over ? c.surface : 'transparent' }]}>
      <View style={styles.dayHead}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <T variant="heading" style={{ flex: 1 }}>{`Day ${d.day} · ${d.weekday} ${d.date.slice(5)}`}</T>
        <Button label="+ Add" variant="ghost" size="sm" onPress={onAdd} accessibilityLabel={`Add places to day ${d.day}`} />
      </View>
      <T variant="small" tone="muted">{`From ${hotelName}`}</T>
      {d.stops.map((s, i) => {
        const from = i ? d.stops[i - 1] : hotel;
        const isDragged = drag.dragging === s.key;
        const lineBefore = over && !isDragged && others === target;
        if (!isDragged) others++;
        return (
          <View key={s.key} ref={registerStop(s.key, d.day)}>
            {lineBefore ? <DropLine /> : null}
            <Leg from={from} to={s} travelMin={s.travelMin} travelKm={s.travelKm} mode={s.travelMode} />
            <Draggable id={s.key} fromDay={d.day} drag={drag}>
              {(handle) => (
                <StopRow
                  s={s}
                  n={i + 1}
                  handle={handle}
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
                  onUnplan={() => onUnplan(s.key)}
                  onRemove={() => onRemove(s.key)}
                />
              )}
            </Draggable>
          </View>
        );
      })}
      {over && target === others ? <DropLine /> : null}
      {!d.stops.length ? (
        <T tone="muted" style={{ paddingVertical: space.sm }}>
          Nothing planned. Drag a place here or press + Add.
        </T>
      ) : null}
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
  handle,
  color,
  source,
  open,
  days,
  day,
  warning,
  onToggle,
  onMove,
  onUnplan,
  onRemove,
}: {
  s: Stop;
  n: number;
  handle: ReactNode;
  color: string;
  source?: PlaceSource;
  open: boolean;
  days: number;
  day: number;
  warning: string;
  onToggle: () => void;
  onMove: (day: number) => void;
  onUnplan: () => void;
  onRemove: () => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.stopWrap, { borderColor: open ? c.line : c.border, backgroundColor: c.bg }]}>
      <View style={styles.stop}>
        {handle}
        <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.stopMain}>
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
      </View>
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
            <Button size="sm" variant="secondary" label="Off this day" accessibilityLabel="Move to Maybe, keep in the trip" onPress={onUnplan} />
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
  onMove: (placeId: string, day: number, index?: number) => void;
  drag: DragApi;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const source = sources[place.id];
  const row = (handle: ReactNode) => (
    <View style={[styles.stopWrap, { borderColor: c.border, backgroundColor: c.bg }]}>
      <View style={styles.stop}>
        {handle}
        <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.stopMain}>
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
      </View>
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
    row(<View style={styles.handle} />)
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
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stopMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  handle: { width: 24, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  num: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dropLine: { height: 3, marginVertical: 2 },
  lifted: { zIndex: 10, opacity: 0.9, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
