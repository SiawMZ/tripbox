// The 顺路 planner: pinned places first, nearby places grouped into areas, one or two areas a day,
// then each day ordered stop by stop with opening hours and lunch/dinner slots.
// Distances are straight-line with a road factor; good enough to compare orders, not to promise times.

import type { OpeningPeriod } from './places.ts';

export type TravelMode = 'walk' | 'transit' | 'car';

export type PlanPlace = {
  key: string;
  name: string;
  nameLocal?: string;
  type: string;
  area?: string;
  lat: number;
  lng: number;
  mapsUrl?: string;
  periods?: OpeningPeriod[];
  /** Starred by the user: planned first; the other places are added only where they fit on the way. */
  must?: boolean;
  /** Display only: a downloaded Google Maps photo and its credit. */
  photo?: string;
  photoCredit?: string;
  /** Chosen by the user: visit on this trip day (1-based), at any time that fits. A time goes in `pins`. */
  day?: number;
};

export type Pin = { key: string; day: number; time: string };

export type TripInput = {
  startDate: string; // YYYY-MM-DD
  days: number;
  hotel: { name: string; lat: number; lng: number };
  dayStart: string; // HH:MM
  dayEnd: string;
  /** Full meals a day (food places and markets). Default 3: lunch, dinner, late-night snack. */
  maxMealsPerDay?: number;
  /** Stops a day, pins included. Default: as many as fit. */
  maxPlacesPerDay?: number;
  travelMode: TravelMode;
  places: PlanPlace[];
  pins: Pin[];
};

export type Stop = PlanPlace & {
  arrive: string;
  start: string;
  leave: string;
  travelMin: number;
  /** How to get here from the previous stop (the hotel for the first one). */
  travelMode: TravelMode;
  travelKm: number;
  waitMin: number;
  pinned: boolean;
  late?: boolean;
};

export type DayPlan = {
  day: number;
  date: string;
  weekday: string;
  stops: Stop[];
  endBack: string;
  freeMin: number;
  /** The last leg, back to the hotel. */
  back?: { travelMin: number; travelMode: TravelMode; travelKm: number };
};
export type Plan = { days: DayPlan[]; maybe: (PlanPlace & { reason: string })[] };

/** Minutes spent at a place, by type. */
const DURATION: Record<string, number> = {
  food: 75, cafe: 60, dessert: 40, bar: 90, attraction: 90, nature: 120, shop: 45, market: 90, other: 60,
};
const AREA_KM = 1.5; // places closer than this (chained) form one area
const LUNCH = [11 * 60 + 30, 14 * 60];
const DINNER = [17 * 60 + 30, 20 * 60 + 30];
const SUPPER = [21 * 60, 24 * 60]; // 宵夜
const MAX_MEALS = 3; // default: lunch, dinner, late-night snack
const MEAL_GAP = 150; // minutes between two meals before a third feels like too much
const MAX_WAIT = 60; // minutes worth waiting for a place to open
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_DETOUR = 30; // extra travel minutes a non-starred place may add to a day
const NEAR_KM = 3; // places added to a day stay this close to the places the day is built around
const SPARE_KM = 2; // a day with no must-go only takes places this close to its own stops

export const duration = (p: PlanPlace) => DURATION[p.type] ?? 60;
const isMeal = (p: PlanPlace) => p.type === 'food' || p.type === 'market';
const meals = (ps: PlanPlace[]) => ps.filter(isMeal).length;

export function planTrip(trip: TripInput): Plan {
  const pinned = new Set(trip.pins.map((p) => p.key));
  if (!trip.places.some((p) => p.must)) return planAll(trip);

  // 1. Plan the must-go places (and pins) on their own: they decide where each day goes.
  const isMust = (p: PlanPlace) => p.must || !!p.day || pinned.has(p.key);
  const base = planAll({ ...trip, places: trip.places.filter(isMust) });
  const days = base.days;
  const maybe = base.maybe;

  // 2. Add the other places that are on the way, nearest to a must-go first, as long as the day keeps
  //    every must-go, stays within its limits, and the place adds at most MAX_DETOUR minutes of travel.
  const dayStart = toMin(trip.dayStart);
  const dayEnd = toMin(trip.dayEnd);
  const maxMeals = trip.maxMealsPerDay ?? MAX_MEALS;
  const maxPlaces = trip.maxPlacesPerDay ?? Infinity;
  const byKey = new Map(trip.places.map((p) => [p.key, p]));
  const pinsOf = (day: number) =>
    trip.pins.filter((p) => p.day === day && byKey.has(p.key)).map((p) => ({ place: byKey.get(p.key)!, at: toMin(p.time) }));
  const hasFree = (d: DayPlan) => d.stops.some((s) => !s.pinned);
  const tryAdd = (i: number, p: PlanPlace): 'ok' | 'full' | 'time' | 'detour' => {
    const d = days[i];
    const { plan, left } = orderDay(trip, d, dayStart, dayEnd, [...d.stops.filter((s) => !s.pinned), p], pinsOf(d.day));
    if (meals(plan.stops) > maxMeals || plan.stops.length > maxPlaces) return 'full';
    if (left.length) return 'time';
    if (hasFree(d) && travel(plan) - travel(d) > MAX_DETOUR) return 'detour';
    // Stay near what the day is built around (its starred, pinned or day-fixed places), so a day
    // can't creep across town one 30-minute hop at a time.
    const core = d.stops.filter((x) => x.must || x.pinned || x.day);
    if (core.length && minDist(p, core) > NEAR_KM) return 'detour';
    days[i] = plan;
    return 'ok';
  };
  const fill = (candidates: PlanPlace[]) => {
    const rest: { p: PlanPlace; why: string }[] = [];
    const anchors = () => days.flatMap((d) => d.stops.filter((s) => !s.pinned || hasFree(d)));
    const sorted = [...candidates].sort((a, b) => minDist(a, anchors()) - minDist(b, anchors()));
    for (const p of sorted) {
      // Only days that already have places can take it here; empty days are started below.
      const order = days.map((_, i) => i).filter((i) => hasFree(days[i]));
      // The day whose core (starred, pinned, day-fixed places) is nearest wins. A second day is tried only
      // when its core is about as close (within 1 km more), so a place near a full day goes to Maybe
      // instead of dragging a farther day back to the same neighbourhood.
      const coreOf = (d: DayPlan) => {
        const c = d.stops.filter((x) => x.must || x.pinned || x.day);
        return c.length ? c : d.stops;
      };
      order.sort((a, b) => minDist(p, coreOf(days[a])) - minDist(p, coreOf(days[b])));
      const nearest = order.length ? minDist(p, coreOf(days[order[0]])) : Infinity;
      order.splice(1, order.length, ...order.slice(1).filter((i) => minDist(p, coreOf(days[i])) <= nearest + 1));
      // Try the nearest day, then the next one; stop at the first that takes it.
      const tries: ReturnType<typeof tryAdd>[] = [];
      for (const i of order.slice(0, 2)) {
        tries.push(tryAdd(i, p));
        if (tries.at(-1) === 'ok') break;
      }
      if (tries.includes('ok')) continue;
      const why = tries.includes('detour')
        ? 'Out of the way of your must-go places'
        : tries.includes('full')
          ? `The nearby days are full (${maxPlaces === Infinity ? '' : `${maxPlaces} places or `}${maxMeals} meals a day)`
          : 'No time left on the nearby days';
      rest.push({ p, why });
    }
    return rest;
  };
  let rest = fill(trip.places.filter((p) => !isMust(p) && p.type !== 'hotel'));

  // 3. A day with no must-go starts from the biggest group of nearby places still unplanned and then
  //    takes only places within SPARE_KM of its own stops, so it stays in one area instead of
  //    collecting leftovers from across the city.
  for (let i = 0; i < days.length; i++) {
    if (hasFree(days[i])) continue;
    const weekday = WEEKDAYS.indexOf(days[i].weekday);
    const open = rest.map((r) => r.p).filter((p) => !closedAllDay(p.periods, weekday));
    const group = cluster(open, AREA_KM).sort((a, b) => b.length - a.length)[0] ?? [];
    const mid = group.length ? centroid(group) : trip.hotel;
    for (const p of [...group].sort((a, b) => km(a, mid) - km(b, mid))) tryAdd(i, p);
    const placedHere = () => new Set(days.flatMap((d) => d.stops.map((s) => s.key)));
    const nearby = open
      .filter((p) => !placedHere().has(p.key) && days[i].stops.length && minDist(p, days[i].stops) <= SPARE_KM)
      .sort((a, b) => minDist(a, days[i].stops) - minDist(b, days[i].stops));
    for (const p of nearby) tryAdd(i, p);
    const placed = placedHere();
    rest = fill(rest.map((r) => r.p).filter((p) => !placed.has(p.key)));
  }

  // 4. Final pass over the whole trip: move a place to another day, or swap two places between days,
  //    when that cuts total travel. Only places the user hasn't tied to a day (pins, chosen days,
  //    places kept by a drag) move, every day keeps its limits, and no day is emptied.
  const movable = (i: number) => days[i].stops.filter((s) => !s.pinned && !s.day) as PlanPlace[];
  const kept = (i: number) => days[i].stops.filter((s) => !s.pinned && s.day) as PlanPlace[];
  const redo = (i: number, pool: PlanPlace[]) =>
    orderDay(trip, days[i], dayStart, dayEnd, [...kept(i), ...pool], pinsOf(days[i].day));
  const fine = (r: { plan: DayPlan; left: PlanPlace[] }) =>
    !r.left.length && meals(r.plan.stops) <= maxMeals && r.plan.stops.length <= maxPlaces;
  const better = (i: number, j: number, a: DayPlan, b: DayPlan) =>
    travel(a) + travel(b) < travel(days[i]) + travel(days[j]) - 5;
  for (let round = 0; round < 30; round++) {
    // One change per round, then look again from the start: each round sees the latest days.
    let improved = false;
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < days.length; j++) {
        if (i === j) continue;
        for (const s of movable(i)) {
          if (days[i].stops.length <= 1) break;
          // Swap s with a place on day j…
          for (const u of i < j ? movable(j) : []) {
            const a = redo(i, [...movable(i).filter((x) => x.key !== s.key), u]);
            const b = redo(j, [...movable(j).filter((x) => x.key !== u.key), s]);
            if (fine(a) && fine(b) && better(i, j, a.plan, b.plan)) {
              days[i] = a.plan;
              days[j] = b.plan;
              improved = true;
              break;
            }
          }
          if (improved) break;
          // …or just move it there.
          const a = redo(i, movable(i).filter((x) => x.key !== s.key));
          const b = redo(j, [...movable(j), s]);
          if (fine(a) && fine(b) && better(i, j, a.plan, b.plan)) {
            days[i] = a.plan;
            days[j] = b.plan;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
      if (improved) break;
    }
    if (!improved) break;
  }

  for (const r of rest) maybe.push({ ...r.p, reason: r.why });
  return { days, maybe };
}

function planAll(trip: TripInput): Plan {
  const dayStart = toMin(trip.dayStart);
  const maxMeals = trip.maxMealsPerDay ?? MAX_MEALS;
  const maxPlaces = trip.maxPlacesPerDay ?? Infinity;
  const withinLimits = (stops: PlanPlace[]) => meals(stops) <= maxMeals && stops.length <= maxPlaces;
  const dayEnd = toMin(trip.dayEnd);
  const places = trip.places.filter((p) => p.type !== 'hotel');
  const byKey = new Map(places.map((p) => [p.key, p]));
  const pins = trip.pins.filter((p) => byKey.has(p.key) && p.day >= 1 && p.day <= trip.days);
  const pinnedKeys = new Set(pins.map((p) => p.key));
  // Places the user put on a day (without a time) go straight to that day and stay there.
  const onDay = (p: PlanPlace) => !pinnedKeys.has(p.key) && !!p.day && p.day >= 1 && p.day <= trip.days;
  const fixed = places.filter(onDay);
  const free = places.filter((p) => !pinnedKeys.has(p.key) && !onDay(p));
  const fixedOn = (day: number) => fixed.filter((p) => p.day === day);
  const dayInfo = Array.from({ length: trip.days }, (_, i) => {
    const date = addDays(trip.startDate, i);
    return { day: i + 1, date, weekday: weekdayOf(date) };
  });

  // 1. Group free places into areas, then merge the closest areas until there are no more areas than
  //    days, as long as the merged group still fits in one day. Two far-off places (both in Banqiao)
  //    end up on the same day instead of each pulling a different day across town.
  const areas = cluster(free, AREA_KM);
  const dayBudget = (dayEnd - dayStart) * 0.75;
  const commonOpenDay = (ps: PlanPlace[]) =>
    dayInfo.some((d) => ps.every((p) => !closedAllDay(p.periods, WEEKDAYS.indexOf(d.weekday))));
  while (areas.length > trip.days) {
    let best: { i: number; j: number; d: number } | null = null;
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const merged = [...areas[i], ...areas[j]];
        if (sumDur(merged) > dayBudget || meals(merged) > maxMeals || merged.length > maxPlaces) continue;
        if (!commonOpenDay(merged)) continue;
        const d = km(centroid(areas[i]), centroid(areas[j]));
        if (!best || d < best.d) best = { i, j, d };
      }
    }
    if (!best) break;
    areas[best.i] = [...areas[best.i], ...areas[best.j]];
    areas.splice(best.j, 1);
  }

  // 2. Give each day an anchor: its pins, or else the area farthest from the anchors chosen so far,
  //    so the days spread over the city instead of all starting in the same corner.
  const anchors: ({ lat: number; lng: number } | null)[] = dayInfo.map(({ day }) => {
    const dayPins = [...pins.filter((p) => p.day === day).map((p) => byKey.get(p.key)!), ...fixedOn(day)];
    return dayPins.length ? centroid(dayPins) : null;
  });
  const weekdayOfDay = (i: number) => WEEKDAYS.indexOf(dayInfo[i].weekday);
  const areaCentres = areas
    .map((a) => ({ ...centroid(a), area: a }))
    .sort((a, b) => b.size - a.size);
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i]) continue;
    // Only areas that are open that day can anchor it (a museum closed on Mondays can't anchor Monday).
    const open = areaCentres.filter((c) => c.area.every((p) => !closedAllDay(p.periods, weekdayOfDay(i))));
    const candidates = open.length ? open : areaCentres;
    const placed = anchors.filter((a): a is { lat: number; lng: number } => !!a);
    const next = placed.length
      ? candidates.reduce<(typeof candidates)[number] | null>(
          (best, c) => (!best || minDist(c, placed) > minDist(best, placed) ? c : best),
          null,
        )
      : candidates[0];
    anchors[i] = next ?? trip.hotel;
  }

  // 3. Assign whole areas to the nearest day with time left; split an area only when no day can take it.
  const budget = (dayEnd - dayStart) * 0.75; // the rest is travel and slack
  const setFor = (day: number) => [...pins.filter((p) => p.day === day).map((p) => byKey.get(p.key)!), ...fixedOn(day)];
  const load = dayInfo.map(({ day }) => sumDur(setFor(day)));
  const mealLoad = dayInfo.map(({ day }) => meals(setFor(day)));
  const placeLoad = dayInfo.map(({ day }) => setFor(day).length);
  const fits = (ps: PlanPlace[], i: number) =>
    load[i] + sumDur(ps) <= budget &&
    mealLoad[i] + meals(ps) <= maxMeals &&
    placeLoad[i] + ps.length <= maxPlaces &&
    openOn(ps, i);
  const assigned: PlanPlace[][] = dayInfo.map(({ day }) => [...fixedOn(day)]);
  const unassigned: PlanPlace[] = [];
  const nearestDays = (pt: { lat: number; lng: number }) =>
    anchors.map((a, i) => ({ i, d: km(pt, a!) })).sort((x, y) => x.d - y.d).map((x) => x.i);
  const openOn = (ps: PlanPlace[], i: number) =>
    ps.every((p) => !closedAllDay(p.periods, WEEKDAYS.indexOf(dayInfo[i].weekday)));
  // Most constrained first: a place open on only two of the trip days gets its day before the
  // places that could go on any day take the meal slots.
  const openDays = (p: PlanPlace) => dayInfo.filter((_, i) => openOn([p], i)).length;
  const tightness = (ps: PlanPlace[]) => Math.min(...ps.map(openDays));
  for (const area of [...areas].sort((a, b) => tightness(a) - tightness(b) || sumDur(b) - sumDur(a))) {
    const dayIdx = nearestDays(centroid(area)).find((i) => fits(area, i));
    if (dayIdx !== undefined) {
      assigned[dayIdx].push(...area);
      load[dayIdx] += sumDur(area);
      mealLoad[dayIdx] += meals(area);
      placeLoad[dayIdx] += area.length;
      continue;
    }
    for (const p of [...area].sort((a, b) => openDays(a) - openDays(b))) {
      const i = nearestDays(p).find((i) => fits([p], i));
      if (i === undefined) unassigned.push(p);
      else {
        assigned[i].push(p);
        load[i] += duration(p);
        mealLoad[i] += meals([p]);
        placeLoad[i] += 1;
      }
    }
  }

  // 4. Order each day; what doesn't fit goes to the "maybe" list.
  const maybe: Plan['maybe'] = [];
  const days: DayPlan[] = dayInfo.map((info, i) => {
    const dayPins = pins.filter((p) => p.day === info.day).map((p) => ({ place: byKey.get(p.key)!, at: toMin(p.time) }));
    const { plan, left } = orderDay(trip, info, dayStart, dayEnd, assigned[i], dayPins);
    unassigned.push(...left);
    return plan;
  });

  // 5. Try the leftovers on any day with time left, closest day first.
  for (const p of unassigned.sort((a, b) => Number(!!b.must) - Number(!!a.must))) {
    let placedIt = false;
    const order = dayInfo
      .map((_, i) => i)
      .filter((i) => !onDay(p) || dayInfo[i].day === p.day)
      .sort((a, b) => minDist(p, days[a].stops) - minDist(p, days[b].stops));
    for (const i of order) {
      const info = dayInfo[i];
      const stops = days[i].stops;
      const { plan, left } = orderDay(
        trip,
        info,
        dayStart,
        dayEnd,
        [...stops.filter((s) => !s.pinned), p],
        stops.filter((s) => s.pinned).map((s) => ({ place: s as PlanPlace, at: toMin(s.start) })),
      );
      if (left.length === 0 && withinLimits(plan.stops)) {
        days[i] = plan;
        placedIt = true;
        break;
      }
    }
    if (!placedIt) {
      const closed = dayInfo.filter((d) => closedAllDay(p.periods, WEEKDAYS.indexOf(d.weekday))).map((d) => d.weekday);
      const reason =
        closed.length === dayInfo.length
          ? 'Closed on all trip days'
          : [
              closed.length ? `Closed on ${closed.join(', ')}` : '',
              isMeal(p) && days.every((d) => meals(d.stops) >= maxMeals)
                ? `the other days already have ${maxMeals} meals`
                : days.every((d) => d.stops.length >= maxPlaces)
                  ? `the other days already have ${maxPlaces} places`
                  : 'no time left on the days it is open',
            ].filter(Boolean).join('; ');
      const why = onDay(p) ? `Doesn't fit on day ${p.day}: ${closed.length ? 'closed that day' : 'not enough time'}` : reason;
      maybe.push({ ...p, reason: why.charAt(0).toUpperCase() + why.slice(1) });
    }
  }

  // 6. Polish: move one place to another day, or swap two places between days, when that cuts the
  //    total travel time of both days. Swaps fix detours that a move can't, because a move would break
  //    a day's meal or place limit (a market detour on a day whose neighbour is already full).
  const replan = (i: number, pool: PlanPlace[]) =>
    orderDay(
      trip,
      dayInfo[i],
      dayStart,
      dayEnd,
      [...keptStops(i), ...pool],
      pins.filter((p) => p.day === dayInfo[i].day).map((p) => ({ place: byKey.get(p.key)!, at: toMin(p.time) })),
    );
  // Pinned and day-fixed stops never move between days.
  const freeStops = (i: number) => days[i].stops.filter((s) => !s.pinned && !onDay(s)) as PlanPlace[];
  const keptStops = (i: number) => days[i].stops.filter((s) => !s.pinned && onDay(s)) as PlanPlace[];
  for (let round = 0; round < 4; round++) {
    let improved = false;
    for (let i = 0; i < days.length; i++) {
      for (const s of freeStops(i)) {
        // Never empty a day: a lone far-off place keeps its own day, and nearby places join it later.
        if (freeStops(i).length === 1) break;
        for (let j = 0; j < days.length; j++) {
          if (j === i) continue;
          const a = replan(i, freeStops(i).filter((x) => x.key !== s.key));
          const b = replan(j, [...freeStops(j), s]);
          if (a.left.length || b.left.length || !withinLimits(b.plan.stops)) continue;
          if (cost(a.plan) + cost(b.plan) < cost(days[i]) + cost(days[j]) - 5) {
            days[i] = a.plan;
            days[j] = b.plan;
            improved = true;
            break;
          }
        }
      }
    }
    for (let i = 0; i < days.length; i++) {
      for (let j = i + 1; j < days.length; j++) {
        for (const s of freeStops(i)) {
          for (const u of freeStops(j)) {
            const a = replan(i, [...freeStops(i).filter((x) => x.key !== s.key), u]);
            const b = replan(j, [...freeStops(j).filter((x) => x.key !== u.key), s]);
            if (a.left.length || b.left.length || !withinLimits(a.plan.stops) || !withinLimits(b.plan.stops)) continue;
            if (cost(a.plan) + cost(b.plan) < cost(days[i]) + cost(days[j]) - 5) {
              days[i] = a.plan;
              days[j] = b.plan;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
    }
    if (!improved) break;
  }
  return { days, maybe };
}

/** Minutes spent travelling in a day, hotel to hotel; long waits count a little, so idle gaps get filled. */
function cost(d: DayPlan) {
  const last = d.stops.at(-1);
  const back = last ? toMin(d.endBack) - toMin(last.leave) : 0;
  return d.stops.reduce((s, x) => s + x.travelMin + 0.2 * x.waitMin, 0) + back;
}

/** Greedy walk through the day: the next stop is the one that is open, keeps the next pin reachable, and is quickest to reach. */
function orderDay(
  trip: TripInput,
  info: { day: number; date: string; weekday: string },
  dayStart: number,
  dayEnd: number,
  pool: PlanPlace[],
  pins: { place: PlanPlace; at: number }[],
): { plan: DayPlan; left: PlanPlace[] } {
  const weekday = WEEKDAYS.indexOf(info.weekday);
  const pending = [...pool];
  const pinQueue = [...pins].sort((a, b) => a.at - b.at);
  const stops: Stop[] = [];
  let pos: { lat: number; lng: number } = trip.hotel;
  let t = dayStart;
  let hadLunch = false;
  let hadDinner = false;
  let hadSupper = false;
  let lastMealEnd = -Infinity;
  const mealAt = (m: number) =>
    m >= LUNCH[0] && m < LUNCH[1] ? 'lunch'
    : m >= DINNER[0] && m < DINNER[1] ? 'dinner'
    : m >= SUPPER[0] && m < SUPPER[1] ? 'supper'
    : null;
  const mealFree = (meal: string | null) =>
    (meal === 'lunch' && !hadLunch) || (meal === 'dinner' && !hadDinner) || (meal === 'supper' && !hadSupper);

  const visit = (p: PlanPlace, travel: number, start: number, pinned: boolean, late = false) => {
    const meal = mealAt(start);
    if (isMeal(p) && meal === 'lunch') hadLunch = true;
    if (isMeal(p) && meal === 'dinner') hadDinner = true;
    if (isMeal(p) && meal === 'supper') hadSupper = true;
    if (isMeal(p)) lastMealEnd = start + duration(p);
    stops.push({
      ...p,
      arrive: toHHMM(t + travel),
      start: toHHMM(start),
      leave: toHHMM(start + duration(p)),
      travelMin: Math.round(travel),
      travelMode: legMode(pos, p, trip.travelMode),
      travelKm: Math.round(km(pos, p) * 1.3 * 10) / 10,
      waitMin: Math.max(0, Math.round(start - (t + travel))),
      pinned,
      late,
    });
    t = start + duration(p);
    pos = p;
  };

  for (;;) {
    const nextPin = pinQueue[0];
    let best: { p: PlanPlace; travel: number; start: number; score: number } | null = null;
    for (const p of pending) {
      const travel = travelMin(pos, p, trip.travelMode);
      const arrive = t + travel;
      const start = startTime(p.periods, weekday, arrive, duration(p));
      if (start === null) continue;
      const end = start + duration(p);
      if (end > dayEnd) continue;
      if (nextPin && end + travelMin(p, nextPin.place, trip.travelMode) > nextPin.at) continue;
      const meal = mealAt(start);
      // A long wait (a night market at 16:00) is allowed, but only when nothing else can go first.
      const wait = start - arrive;
      let score = travel + wait + (wait > MAX_WAIT ? 1000 : 0);
      if (isMeal(p)) {
        score += mealFree(meal) ? -40 : 30; // a meal outside meal time, or a second lunch
        if (start - lastMealEnd < MEAL_GAP) score += 60; // still full from the last one
      } else if (mealFree(meal)) {
        score += 15; // leave room for a meal
      }
      // Lean towards the next pin, so the day flows into it instead of doubling back.
      if (nextPin) score += 0.3 * travelMin(p, nextPin.place, trip.travelMode);
      // Places about to close (a breakfast shop shutting at 12:30) go before places open all day.
      const slack = lastStart(p.periods, weekday, duration(p)) - start;
      if (slack < 120) score -= (120 - slack) / 2;
      if (!best || score < best.score) best = { p, travel, start, score };
    }
    if (best) {
      pending.splice(pending.indexOf(best.p), 1);
      visit(best.p, best.travel, best.start, false);
      continue;
    }
    if (nextPin) {
      pinQueue.shift();
      const travel = travelMin(pos, nextPin.place, trip.travelMode);
      visit(nextPin.place, travel, Math.max(t + travel, nextPin.at), true, t + travel > nextPin.at + 10);
      continue;
    }
    break;
  }
  const backMin = travelMin(pos, trip.hotel, trip.travelMode);
  const back = t + backMin;
  return {
    plan: {
      ...info,
      stops,
      endBack: toHHMM(back),
      freeMin: Math.max(0, dayEnd - back),
      back: stops.length
        ? {
            travelMin: Math.round(backMin),
            travelMode: legMode(pos, trip.hotel, trip.travelMode),
            travelKm: Math.round(km(pos, trip.hotel) * 1.3 * 10) / 10,
          }
        : undefined,
    },
    left: pending,
  };
}

// ---------- opening hours (Google periods: day 0 = Sunday, minutes from midnight) ----------

/** Earliest start at or after `arrive` when the place stays open for `dur` minutes; null if none today. */
function startTime(periods: OpeningPeriod[] | undefined, weekday: number, arrive: number, dur: number): number | null {
  if (!periods?.length) return arrive; // unknown hours: assume open
  let best: number | null = null;
  for (const [open, close] of windows(periods, weekday)) {
    const start = Math.max(arrive, open);
    if (start + dur <= close && (best === null || start < best)) best = start;
  }
  return best;
}

/** Latest start today that still leaves `dur` minutes before closing; unknown hours = end of day. */
function lastStart(periods: OpeningPeriod[] | undefined, weekday: number, dur: number): number {
  if (!periods?.length) return 24 * 60;
  return Math.max(-Infinity, ...windows(periods, weekday).map(([, close]) => close - dur));
}

function closedAllDay(periods: OpeningPeriod[] | undefined, weekday: number) {
  // Only opening times that start that day count: a bar open until 01:00 on Saturday night is not
  // "open on Sunday".
  return !!periods?.length && !periods.some((p) => !p.close || p.open.day === weekday);
}

/** Open windows touching this weekday, as [open, close] minutes; windows from the night before count from 0. */
function windows(periods: OpeningPeriod[], weekday: number): [number, number][] {
  const out: [number, number][] = [];
  for (const p of periods) {
    if (!p.close) return [[0, 24 * 60]]; // open 24 hours
    const open = p.open.hour * 60 + p.open.minute;
    const span = ((p.close.day - p.open.day + 7) % 7) * 24 * 60;
    const close = p.close.hour * 60 + p.close.minute + span;
    const realClose = close <= open ? close + 7 * 24 * 60 : close;
    if (p.open.day === weekday) out.push([open, realClose]);
    if ((p.open.day + 1) % 7 === weekday && realClose > 24 * 60) out.push([0, realClose - 24 * 60]);
  }
  return out;
}

// ---------- geometry ----------

/** Short hops are walked whatever the trip's mode; longer ones use the mode the traveller chose. */
function legMode(a: { lat: number; lng: number }, b: { lat: number; lng: number }, mode: TravelMode): TravelMode {
  return km(a, b) * 1.3 <= 1.2 ? 'walk' : mode;
}

function travelMin(a: { lat: number; lng: number }, b: { lat: number; lng: number }, mode: TravelMode) {
  const road = km(a, b) * 1.3;
  if (mode === 'walk' || road <= 1.2) return (road / 4.5) * 60;
  if (mode === 'transit') return 12 + (road / 22) * 60;
  return 8 + (road / 30) * 60;
}

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Single-link clusters: two places share an area when a chain of places under `limit` km joins them. */
function cluster(places: PlanPlace[], limit: number): PlanPlace[][] {
  const parent = places.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      if (km(places[i], places[j]) <= limit) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, PlanPlace[]>();
  places.forEach((p, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), p]));
  return [...groups.values()];
}

function centroid(ps: { lat: number; lng: number }[]) {
  return {
    lat: ps.reduce((s, p) => s + p.lat, 0) / ps.length,
    lng: ps.reduce((s, p) => s + p.lng, 0) / ps.length,
    size: ps.length,
  };
}

function minDist(p: { lat: number; lng: number }, others: { lat: number; lng: number }[]) {
  return others.length ? Math.min(...others.map((o) => km(p, o))) : Infinity;
}

const sumDur = (ps: PlanPlace[]) => ps.reduce((s, p) => s + duration(p), 0);

// ---------- time ----------

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toHHMM(min: number) {
  const m = Math.round(min);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(date: string) {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

/** Travel minutes only, hotel to hotel (no waiting): what "on the way" is measured in. */
function travel(d: DayPlan) {
  return d.stops.reduce((s, x) => s + x.travelMin, 0) + (d.back?.travelMin ?? 0);
}
