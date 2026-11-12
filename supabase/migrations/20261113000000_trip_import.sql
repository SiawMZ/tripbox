-- Step 2: importing links into a trip through the tripbox-import function.
-- Like 20261112000000_trips.sql, this is also copied into Linkbox's supabase/migrations.

-- An import first finds places and waits for the member to pick which to add ('review').
alter table public.trip_links
  add column candidates jsonb,
  add column cover_url text check (char_length(cover_url) <= 2000),
  add column rating text check (rating in ('good', 'bad'));
alter table public.trip_links drop constraint trip_links_status_check;
alter table public.trip_links
  add constraint trip_links_status_check check (status in ('pending', 'review', 'ready', 'failed'));

-- Members can rate an import (👍/👎); nothing else on a link is writable from the app.
grant update (rating) on public.trip_links to authenticated;
create policy "members rate links" on public.trip_links
  for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- When a place's Google details (name, address, hours, photo) were last fetched. Google's terms allow
-- keeping the place ID; other details are to be refreshed rather than kept indefinitely.
alter table public.trip_places add column details_fetched_at timestamptz not null default now();

-- Log of import work per user: rate limits (each import spends Anthropic and Google credit) and an
-- audit trail. Written only by the function (service role); users can't read or change it.
create table public.trip_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  trip_id uuid references public.trips on delete set null,
  kind text not null check (kind in ('import', 'locate')),
  outcome text not null check (outcome in ('ok', 'failed', 'blocked', 'rate_limited')),
  ai_input_tokens int not null default 0,
  ai_output_tokens int not null default 0,
  places_calls int not null default 0,
  detail text,
  created_at timestamptz not null default now()
);
create index trip_usage_user_created on public.trip_usage (user_id, created_at desc);
alter table public.trip_usage enable row level security;
revoke all on public.trip_usage from anon, authenticated;

-- Google Places lookups by query, shared by all trips, so a café saved by many people is looked up
-- once. Entries older than 30 days are refetched (see the function). Service role only.
create table public.trip_place_cache (
  query_hash text primary key,
  match jsonb,
  created_at timestamptz not null default now()
);
alter table public.trip_place_cache enable row level security;
revoke all on public.trip_place_cache from anon, authenticated;

-- One small photo per Google place, shared by all trips (path: <google place id>.jpg).
-- Public to read; only the function writes. Before a public launch, check this against Google's
-- terms for Place Photos (see docs) and switch to fetching photos on demand if needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-photos', 'trip-photos', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
