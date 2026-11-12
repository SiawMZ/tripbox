# Tripbox spike

A 2-week test of the two risky parts before building the app:

1. Can AI find the places in real saved posts? (`extract.ts`)
2. Does the 顺路 plan look right to a real traveller? (`lib/planner.ts`, shown in `trip.html`)

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
deno task serve            # local server: http://127.0.0.1:8095
```

The **home page** lists your trips; **New trip** asks for the city, dates and days (the start point is the
city centre until you set your hotel). Each trip keeps its places in `out/trips/<trip>/` (`trip.json` for
settings, `places.json` for places found in its links). Your API keys stay in `.env` on the server; the
browser only talks to it.

In a trip, **+ Import link** takes a link (Xiaohongshu, Instagram, YouTube, TikTok, a blog) and optionally
place names or text, shows the steps as it works, then lists the places it found (ticked, with photos and
a map preview, plus 👍/👎 for import quality, saved to `out/feedback.jsonl`). **Add** saves the ticked ones
and re-plans.

On the **Trip** tab, set the dates, number of days, day hours, meals and places a day, how you get around,
and the start point (search an address, or click the map). Each leg in the plan shows walk / MRT or bus /
taxi with an estimated time and a Google Maps directions link. On the **Places** tab, ★ marks a must-go and
✕ removes a place from this trip; drag stops between days on the **Plan** tab. Must-gos are planned first,
then other places are added only when they are on the way. Stars, chosen days and removals are kept in this
browser, per trip.

Batch scripts (the first version of the spike, still useful for measuring):

```
deno task extract          # posts.txt -> out/places.json + out/places.csv
deno task photos           # one Google Maps photo per place
deno task plan             # trip.json + out/places.json -> plan printed day by day
```

Try the planner without any keys: `deno task plan:sample` (16 sample Taipei places with approximate coordinates and hours).

## Measuring

| Measure | How | Pass | Stop |
| --- | --- | --- | --- |
| Places found and matched | Mark `correct` y/n in `out/places.csv`; share of y | ≥ 80% | < 60% |
| Posts readable | "Posts read ... blocked" line | ≥ 90% | < 70% |
| Day order makes sense | Show a trip page to 5 people who know the city | ≥ 4 of 5 | ≤ 2 of 5 |
| AI cost per 30-place trip | "AI per post" × 30 | < US$0.10 | > US$0.50 |

`--images=always` reads the images of every post (more places, about 30× the AI cost); compare with the default `auto`, which reads images only when the text names no place.

## Notes

- Results are cached in `cache/`, so re-runs only pay for new posts. Delete `cache/` to measure cost again.
- Travel times are straight-line distance × 1.3 at walking / transit / car speeds. Good for comparing orders, not exact.
- Places with unknown opening hours are treated as always open.
