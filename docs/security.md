# Tripbox security

Tripbox shares Linkbox's hosted Supabase project: one `auth.users`, one `profiles`, one storage. Every Tripbox
table starts with `trip`, every function with `tripbox-`, and nothing Tripbox adds may read or change Linkbox's
tables (`links`, `folders`, `folder_members`, `profiles` except the user's own display name, `enrich_log`,
storage `thumbnails`).

Run the database checks with `npx supabase db reset` then `npx supabase test db`
(`supabase/tests/database/trips_rls.test.sql`: two users, a signed-out visitor and the service role; 65 checks).
Add a check there with every new table, policy or RPC.

## Review of step 1 (2026-11-12)

Fixed in `20261112120000_trips_hardening.sql`:

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | Medium | `authenticated` kept Supabase's default TRUNCATE, TRIGGER and REFERENCES on all four trip tables (`20261112000000_trips.sql:146-154` only revoked insert/update). TRUNCATE ignores RLS: as the `authenticated` role it wiped every user's trips in the test. PostgREST and GraphQL can't send TRUNCATE today, so it isn't reachable from the app's API, but one more exposed path (an RPC that runs dynamic SQL, a future API feature) would make it a delete-everything button. | Revoked. |
| 2 | Medium | `trip_places.link_id` (`trips.sql:54`) could point at a link of any trip, which would show another trip's post (title, author, URL) as a place's source. Only the service key can set it, so it depends on step 2 getting it right. | Composite foreign key `(trip_id, link_id)` → `trip_links (trip_id, id)`, `on delete set null (link_id)`. |
| 3 | Low | Columns the import function fills from scraped pages and the AI had no limits: `maps_url` (opened on tap, so `javascript:` would run), `photo_path`, `periods`, `address`, `area`, `type`, `confidence`, `platform`, `error`… (`trips.sql:41-68`). | Length checks, `maps_url` must be `https://`, `photo_path` must start with `<trip_id>/`. |
| 4 | Low | No cap on trips per account: one account could fill the shared free-tier database. | At most 100 owned trips (trigger, error code 54000; the app shows the message). |
| 5 | Low | The trips triggers called Linkbox's `touch_updated_at()`, so a Linkbox change could break Tripbox. | Tripbox's own `trip_touch_updated_at()` with `search_path = ''`. |

Checked and fine:
- RLS on all four tables; anon has no privileges at all and can't execute `is_trip_member`.
- `owner_id`, `trip_id`, `id` and every Google field are outside the column grants, so they can't be changed through the API. No self-join, no direct link/place inserts, no member inserts/updates/deletes.
- `is_trip_member` and `add_trip_owner` are security definer with `search_path = ''`; `is_trip_member` only answers for the caller; `add_trip_owner` can't be called directly.
- Cascades: deleting a trip removes its members, links and places; no foreign key or trigger points from a trip table to a Linkbox table (checked by the test).
- "Delete my trips" (`src/lib/store.tsx:116`) deletes only `trips where owner_id = me` through RLS; it never touches `auth.users` (checked by the test). Display name reads/writes only the user's own `profiles` row (Linkbox's own-row policies).
- Google sign-in on the phone uses PKCE with the verifier kept in memory, so another app registering `tripbox://` can't use an intercepted code.
- `app.json` has no EAS project id or updates URL (nothing points at Linkbox's EAS project); package `com.siawmz.tripbox`, scheme `tripbox`.

Notes for later (not bugs today):
- **Editors can edit trip details and delete any link or place** in the trip (`trips.sql:121,134,141`). That's the collaborative design; revisit if "only the adder deletes a link", like Linkbox, is wanted.
- **"Delete my trips" leaves the person in trips others own.** Step 4's `leave_trip` should be part of it, so Tripbox data is really gone.
- **Deleting the account in Linkbox now also deletes the person's trips, for everyone in them** (`trips.owner_id … on delete cascade`). Linkbox's delete-account text should say so; step 4 may want ownership to pass to the next member instead.
- **Hosted auth settings** (not in this repo, change them in the dashboard): add `tripbox://**` and the exact Tripbox web URL to the redirect allow list. Never add a wildcard like `https://*.vercel.app/**`: anyone can deploy there and receive sign-in tokens. Until the Tripbox URL is listed, Supabase falls back to Linkbox's site URL for email links.
- Linkbox's own tables have the same default TRUNCATE/TRIGGER/REFERENCES grants to `anon` and `authenticated`. That's for Linkbox's repo to fix; Tripbox migrations don't touch Linkbox tables.

## Step 2 status (2026-11-12)

How `supabase/functions/tripbox-import` meets the requirements below:
- 1, 2: the trip is read through the caller's client (RLS) before any work; `auth.getUser()` gives the user id;
  places are written only for the authorised trip and the link just created for it. `add` reads the link
  through RLS too.
- 3: one link (≤ 2000 characters, `^https?://`) and up to 3000 characters of pasted text per call. A list of
  links (bulk import) comes with step 7 and must follow the 20-link limit here.
- 4: `post.ts` carries Linkbox's `safeFetch` / `assertPublicUrl` / `isPrivateIp` unchanged.
- 5: the log table is `trip_usage` (kind, outcome, AI tokens, Google calls), checked before each import:
  30 imports an hour and 150 a day per person, 2000 a day for everyone (env vars `TRIPBOX_IMPORTS_*`);
  at most 300 links and 500 places per trip.
- 6: the reply is parsed against a fixed schema (types and confidence from fixed lists); strings are cut to
  the column limits before insert.
- 7: `maps_url` is built from the place id.
- 8: superseded by Google's terms (docs/google-maps-terms.md): no photos or other Google content are stored.
  Photos are fetched live through the `details` action, which only answers for places of a trip the caller is
  a member of. The photo bucket and the `<trip_id>/` photo rule went with it.
- 10: `trips_rls.test.sql` checks that users can't read or write `trip_usage` or `trip_place_cache`, can't run the
  coordinate clean-up, and that coordinates older than 30 days are deleted (60 checks).

## Step 3 notes (2026-11-13): plan and map

- The plan is saved on each place (`plan_day`, `plan_pos`, `plan_reason`; `20261113120000_trip_plan.sql`). Times are
  not saved, because they come partly from Google's opening hours; the app works them out when it shows the plan.
  Members change them only through column grants or `trip_save_plan(trip, stops)`, which is **security invoker**:
  RLS decides, so a non-member's call updates nothing (checked by the test). It takes at most 500 places.
- Opening hours are fetched with the `details` action (`want: ['hours']`) only for "Plan my days", for every active
  place of the trip not already in memory; kept in memory, never stored. Dragging or adding a place to a day makes no
  Google call (it goes where it adds the least travel).
- Opening-hours checks are limited per calendar month: 300 per person and 950 for everyone (inside Google's free
  1,000), env `TRIPBOX_HOURS_PER_MONTH` / `TRIPBOX_HOURS_PER_MONTH_ALL`. Over the limit "Plan my days" returns 429
  with a readable message; dragging still works.
- `find_start` searches OpenStreetMap for a start point: query ≤ 200 characters, members only, 60 searches an hour
  per person (logged as `locate` in `trip_usage`).
- Map keys are public by design (they ship in the web bundle and the APK), so they must be restricted in Google
  Cloud: the web key to Maps JavaScript API and the Tripbox web address; the Android key to Maps SDK for Android
  and the app's package and signing SHA-1. Neither may be the server's Places key (`GOOGLE_MAPS_API_KEY`).
- Post covers: the import copies the post's first picture (through `safeFetch`, images only, 5 MB) into the private
  `trip-covers` bucket at `<trip_id>/<link_id>.<ext>`; `trip_links.cover_path` must start with the trip id. Members
  read covers through signed URLs (1 hour) and may delete them (`trip_cover_member`, which rejects malformed folder
  names); only the service role uploads. The app deletes a trip's covers before deleting the trip ("Delete trip" and
  "Delete my trips"). Not covered yet: deleting the account in Linkbox cascades the trips but leaves their covers;
  Linkbox's `delete-account` function should also empty the person's `trip-covers` folders (or a clean-up job).
- The web map builds its popups as HTML from place names (which come from posts): names are escaped (`esc` in
  `trip-map.web.tsx`).

## Requirements for step 2 (import function)

`tripbox-import` reads posts and pages from user-given URLs, asks the AI for places, looks them up on Google
and writes `trip_links` / `trip_places` with the service key. The service key skips RLS, so the function
itself must do what the policies would.

1. **Authorise first, with the user's token.** Read the trip through a client made with the caller's
   `Authorization` header (RLS) — `select id from trips where id = $1` must return the row — before anything
   is fetched or written. Use `auth.getUser()` for the user id; never take a user id or trip id's ownership
   from the request body. Reject a missing or anon token with 401.
2. **Write only to that trip.** Every insert sets `trip_id` to the authorised trip and `added_by` to the caller.
   A place's `link_id` must be a link the function just created for that trip (the database also enforces it).
   Upsert places on `(trip_id, google_place_id)`; never update a place's planning fields (`must`, `fixed_day`,
   `note`, …) that members set.
3. **Validate input.** `urls`: an array of at most 20 strings, each `^https?://`, ≤ 2000 characters, deduplicated
   with `_shared/url.ts` normalisation; extract URLs from shared text with the same helper. Reject other body fields.
4. **Safe fetching (SSRF).** Reuse Linkbox's `safeFetch` / `assertPublicUrl` / `isPrivateIp` from its former
   `enrich` function: http(s) on ports 80/443 only, no credentials in the URL, no `localhost`/`.local`/`.internal`
   hosts, DNS resolved and every address checked against private, loopback, link-local (169.254.x, cloud
   metadata), CGNAT, multicast and IPv6 ULA/link-local ranges, re-checked on **every redirect** (`redirect:
   'manual'`, at most 5 hops), 10 s timeout, HTML capped at 1.5 MB and images at 5 MB with a streamed byte limit.
   Keep a redirect that leaves the post's platform from replacing the original URL (bot checks, login walls).
5. **Per-user rate limits and an audit log.** A `trip_import_log` table (`user_id`, `trip_id`, `url`, `used_ai`,
   `google_calls`, `outcome`, `detail`, `created_at`), RLS on, all privileges revoked from `anon` and
   `authenticated`, written only by the function. Check it before work, like `enrich_log`: links per hour, AI
   calls per hour and per day, Google Places calls per day, all from env vars. Return 429 with a readable message.
   Also cap links per trip (e.g. 300) and places per trip (e.g. 500).
6. **AI output is untrusted data.** Post text goes to the model as data, never as instructions; parse the reply
   against a strict schema (place names, types from a fixed list, confidence from a fixed list) and drop
   anything else. Never let the model choose `trip_id`, URLs to fetch, or SQL/filters. Truncate every string to
   the column limits before insert (the database rejects longer values and the whole insert fails).
7. **Google data.** Build `maps_url` from the place id (`https://www.google.com/maps/place/?q=place_id:…`)
   rather than storing a URL from a page or the AI. Coordinates come only from the Places API.
8. **Photos.** Store in a Tripbox bucket (e.g. `trip-photos`, not Linkbox's `thumbnails`) under
   `<trip_id>/<place_id>.<ext>` (the database requires the `<trip_id>/` prefix); images only, 5 MB limit set on
   the bucket. Store the path, never a full URL (`SUPABASE_URL` is an internal host inside the local runtime).
   The bucket is private or public by decision: if public, paths must be unguessable (random file names);
   if private, members read through a storage policy that calls `is_trip_member((storage.foldername(name))[1]::uuid)`.
   Deleting a trip must also delete its photo folder (the function or a cleanup job; cascades don't reach storage).
9. **Secrets.** `ANTHROPIC_API_KEY` and the Google key live only in function secrets, never `EXPO_PUBLIC_*`.
   Restrict the Google key to the Places API. Errors returned to the app are short and generic; details go to the log.
10. **Tests.** Extend `trips_rls.test.sql` for the log table (users can't read or write it) and the bucket
    policies; add a check that a non-member's call to the function gets 401/404 and writes nothing.
