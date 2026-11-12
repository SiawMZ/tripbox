# Tripbox spike

A 2-week test of the two risky parts before building the app:

1. Can AI find the places in real saved posts? (`extract.ts`)
2. Does the 顺路 plan look right to a real traveller? (`plan.ts` + `map.html`)

Plan and pass/stop numbers: the "Trip Planner from Saved Links: App Analysis" doc.

## Setup (once)

1. Install Deno (already on this PC: `deno --version`).
2. Copy `.env.example` to `.env` and fill in:
   - `ANTHROPIC_API_KEY`: set a monthly spend limit in the Anthropic console.
   - `GOOGLE_MAPS_API_KEY`: Google Cloud project, enable **Places API (New)**, restrict the key to it, and add a budget alert.
3. Copy `posts.example.txt` to `posts.txt` and paste 50 links (30 XHS, 10 Instagram, 10 blogs; 2 cities).
4. Copy `trip.example.json` to `trip.json` and set the dates, hotel (lat/lng from Google Maps) and pins.
   `maxMealsPerDay` (default 3: lunch, dinner, late-night snack) and `maxPlacesPerDay` (default: as many as
   fit) set the pace; places that don't fit go to "Maybe" with the reason.

## Run

```
cd spike
deno task extract          # posts -> out/places.json + out/places.csv
deno task photos           # optional: one Google Maps photo per place, for the Places and Plan tabs
deno task plan             # places -> out/plan.json, printed day by day
```

Then open `map.html` through a local server (the map loads `out/plan.js`):

```
deno run --allow-net --allow-read=. jsr:@std/http@1/file-server . --port 8095
```

and go to http://127.0.0.1:8095/map.html.

On the **Trip** tab, set the dates, number of days, day hours, meals and places a day, how you get around,
and the start point (search an address, or click the map). Each leg in the plan shows walk / MRT or bus /
taxi with an estimated time and a Google Maps directions link. On the **Places** tab, ★ marks a must-go and ✕ removes a place from this trip; **Plan** re-plans in the browser.
Must-gos are planned first, then other places are added only when they are on the way (at most 30 extra
minutes of travel). A day with no must-go starts from the biggest group of nearby places. Choices are kept in
this browser; `mustGo` in `trip.json` sets the starting stars.

Try the planner without any keys: `deno task plan:sample` (16 sample Taipei places with approximate coordinates and hours).

## Measuring

| Measure | How | Pass | Stop |
| --- | --- | --- | --- |
| Places found and matched | Mark `correct` y/n in `out/places.csv`; share of y | ≥ 80% | < 60% |
| Posts readable | "Posts read ... blocked" line | ≥ 90% | < 70% |
| Day order makes sense | Show map.html to 5 people who know the city | ≥ 4 of 5 | ≤ 2 of 5 |
| AI cost per 30-place trip | "AI per post" × 30 | < US$0.10 | > US$0.50 |

`--images=always` reads the images of every post (more places, about 30× the AI cost); compare with the default `auto`, which reads images only when the text names no place.

## Notes

- Results are cached in `cache/`, so re-runs only pay for new posts. Delete `cache/` to measure cost again.
- Travel times are straight-line distance × 1.3 at walking / transit / car speeds. Good for comparing orders, not exact.
- Places with unknown opening hours are treated as always open.
