# Google Maps Platform: what Tripbox may store and show

Checked 2026-11-12 against Google's own pages. Re-check before a public launch; terms and prices change.

Sources:
- [Maps Platform Terms](https://cloud.google.com/maps-platform/terms) (last modified 25 Aug 2026), §3.2.3
- [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), §14 Places API, §15 Places UI Kit
- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Price list](https://developers.google.com/maps/billing-and-pricing/pricing) and [fields by price tier](https://developers.google.com/maps/documentation/places/web-service/data-fields)

## Rules

| Rule (Google's words, shortened) | Tripbox |
| --- | --- |
| "Customer may cache (a) place_id from Places API" (Service Terms) | `trip_places.google_place_id`, `trip_place_cache.place_id` kept indefinitely |
| "temporarily cache latitude and longitude values … for up to 30 consecutive calendar days, after which Customer must delete" (§14.3) | `lat`/`lng` with `coords_fetched_at`; refreshed by the function after 25 days; `trip_expire_google_coords()` (pg_cron, daily) clears anything older than 30 days |
| "No Caching … except as expressly permitted" (Terms §3.2.3(b)): nothing else may be stored | Google's names, addresses, opening hours and photos are fetched live (`details` action) and never stored. `name`/`name_local` are the names read from the post (ours). The link waiting for review holds only our fields, place IDs and coordinates. |
| "You cannot cache a photo name. Also, the name can expire." Google recommends loading photos on demand | Photos are fetched when shown; the app gets a short-lived image address and keeps it in memory only |
| "must not use Google Maps Content from the Places API in conjunction with a non-Google map" (§14.2); Terms §3.2.3(e): e.g. "display or use Places content on a non-Google Map" | The trip map must be a Google map wherever it shows our places (their positions come from Google). The spike's OpenStreetMap page is a private test only. |
| "Customer may use Google Maps Content from the Places API … without a corresponding Google Map" (§14.1) | Lists without a map are fine |
| Credit the photographer with each photo (or on a larger view of a thumbnail); give access to the place on Google Maps; show "Google Maps" (logo, or the text where space is short) near Places content | Credit under each photo (links to their profile); places open on Google Maps (`maps_url` built from the place ID); "Places and photos: Google Maps" under Google content |
| Places UI Kit may be used with any map, including a non-Google map (§15.1) | Option for showing place details later |

City centres come from OpenStreetMap (Nominatim), whose data may be stored (ODbL: credit "© OpenStreetMap contributors" where shown).

## Prices (US$, first tier; free allowance per billing account per month)

| Call | Free / month | Per 1,000 after |
| --- | --- | --- |
| Text Search, IDs only (find a place) | unlimited | free |
| Place Details Essentials (address, coordinates, photo list) | 10,000 | 5 |
| Place Details Pro (Google's name, Maps link) | 5,000 | 17 |
| Place Details Enterprise (opening hours) | 1,000 | 20 |
| Place Photo | 1,000 | 7 |
| Maps SDK (Android) | unlimited | free |
| Dynamic Maps (web) | 10,000 loads | 7 |

Photos: Tripbox shows no Google photos (2026-11-13). Each place shows the cover picture of the post it came from,
copied into Tripbox's own storage at import, with a link back to the post. Google photos (with the credit rules above)
are kept for places searched in the app, if that comes later.

What Tripbox calls: import = 1 free ID search (cached) + 1 Essentials per place found (address for the review,
coordinates); opening a trip = no Google call (an Essentials only when a place's coordinates are older than 25 days); planning ("Plan my days") = 1 Enterprise per active place, once per
visit (hours are kept in memory until the app restarts); dragging or adding a place to a day = no call. The trip map:
free on Android; on the web 1 Dynamic Maps load each time a trip screen opens. Only each place's day and order are
saved; times are worked out again when shown (from opening hours only if they're in memory), so nothing derived from
Google's hours is stored. The free allowances are per billing account, i.e. shared by all Tripbox users.
Start point search: 1 Autocomplete request per search plus 1 Essentials call for the picked place, in one session
(Google bills an autocomplete session that ends in Place Details by the Details call; check the price list). The
picked place's ID is kept; its coordinates are dated, refreshed when planning and cleared after 30 days. The saved
label is what the traveller typed, not Google's text. A new trip's city centre comes from OpenStreetMap. Each call is
logged in `trip_usage` and limited per person per day (`TRIPBOX_DETAILS_PER_DAY`).
