-- Row level security and grants for Tripbox's tables. Run against the local stack:
--   npx supabase test db
-- Two users (A owns a trip, B is a stranger, later an editor) and a signed-out visitor.
-- Everything runs in one transaction that is rolled back, so the database is left as it was.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(72);

-- ---------- fixtures (as postgres) ----------
insert into auth.users (id, aud, role, email, instance_id) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'a@trip.test', '00000000-0000-0000-0000-000000000000'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'b@trip.test', '00000000-0000-0000-0000-000000000000');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated, service_role, anon;

-- Helpers to act as someone. `set local` lasts until the end of the transaction.
create function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;
create function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  execute 'set local role service_role';
end $$;

-- ---------- owner A ----------
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');

select lives_ok(
  $$ with t as (insert into trips (name, city, start_date) values ('Taipei', 'Taipei', '2027-01-10') returning id)
     insert into ids select 'trip', id from t $$,
  'A creates a trip and reads it back (insert … returning)'
);
select is((select owner_id from trips where id = (select id from ids where name = 'trip')),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'owner_id defaults to the signed-in user');
select is((select role from trip_members where trip_id = (select id from ids where name = 'trip')
  and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'owner', 'the creator is added as owner member');
select is((select count(*)::int from trips), 1, 'A sees their trip');
select results_eq(
  $$ with u as (update trips set name = 'Taipei 2027' where id = (select id from ids where name = 'trip') returning 1) select count(*)::int from u $$,
  array[1], 'A renames their trip'
);
select throws_ok(
  $$ update trips set owner_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  '42501', null, 'owner_id cannot be changed'
);
select throws_ok(
  $$ insert into trips (owner_id, name, city, start_date) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x', 'x', '2027-01-01') $$,
  '42501', null, 'A cannot create a trip owned by someone else'
);
select throws_ok(
  $$ insert into trip_places (trip_id, google_place_id, name, lat, lng) select id, 'g1', 'Shop', 25, 121 from ids where name = 'trip' $$,
  '42501', null, 'A cannot insert places directly (only the import function can)'
);
select throws_ok(
  $$ insert into trip_links (trip_id, url) select id, 'https://example.com' from ids where name = 'trip' $$,
  '42501', null, 'A cannot insert links directly (only the import function can)'
);
select throws_ok(
  $$ insert into trip_members (trip_id, user_id) select id, 'bbbbbbbb-0000-4000-8000-000000000002' from ids where name = 'trip' $$,
  '42501', null, 'the owner cannot add members directly (invites come with step 4)'
);
select throws_ok($$ truncate trips cascade $$, '42501', null, 'signed-in users cannot truncate trips');
select throws_ok($$ truncate trip_places $$, '42501', null, 'signed-in users cannot truncate trip_places');

-- ---------- the import function (service key) adds a link and a place ----------
reset role;
select pg_temp.as_service();
select lives_ok(
  $$ with l as (insert into trip_links (trip_id, added_by, url, status)
       select id, 'aaaaaaaa-0000-4000-8000-000000000001', 'https://www.xiaohongshu.com/explore/1', 'ready' from ids where name = 'trip' returning id)
     insert into ids select 'link', id from l $$,
  'service role inserts a link'
);
select lives_ok(
  $$ with p as (insert into trip_places (trip_id, link_id, google_place_id, name, lat, lng, coords_fetched_at, maps_url)
       select (select id from ids where name = 'trip'), (select id from ids where name = 'link'), 'g1', 'Shop', 25, 121, now(),
              'https://maps.google.com/?cid=1' returning id)
     insert into ids select 'place', id from p $$,
  'service role inserts a place'
);
select throws_ok(
  $$ insert into trip_places (trip_id, google_place_id, name, lat, lng, coords_fetched_at, maps_url)
     select id, 'g2', 'Bad', 25, 121, now(), 'javascript:alert(1)' from ids where name = 'trip' $$,
  '23514', null, 'maps_url must be an https link'
);
select throws_ok(
  $$ insert into trip_places (trip_id, google_place_id, name, lat, lng)
     select id, 'g3', 'Bad', 25, 121 from ids where name = 'trip' $$,
  '23514', null, 'Google coordinates must come with their fetch date (they expire after 30 days)'
);
-- A second trip for B, to check a place can't point at another trip's link.
select lives_ok(
  $$ with t as (insert into trips (owner_id, name, city, start_date)
       values ('bbbbbbbb-0000-4000-8000-000000000002', 'Penang', 'Penang', '2027-02-01') returning id)
     insert into ids select 'trip_b', id from t $$,
  'service role creates a trip for B'
);
select throws_ok(
  $$ insert into trip_places (trip_id, link_id, google_place_id, name, lat, lng, coords_fetched_at)
     select (select id from ids where name = 'trip_b'), (select id from ids where name = 'link'), 'g4', 'Mixed', 5, 100, now() $$,
  '23503', null, 'a place cannot point at a link of another trip'
);

-- ---------- A plans the place ----------
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select is((select count(*)::int from trip_links), 1, 'A sees the link in their trip');
select is((select count(*)::int from trip_places), 1, 'A sees the place in their trip');
select is((select count(*)::int from trips), 1, 'A does not see B''s trip');
select results_eq(
  $$ with u as (update trip_places set must = true, note = 'go early' returning 1) select count(*)::int from u $$,
  array[1], 'A stars a place and adds a note'
);
select throws_ok($$ update trip_places set lat = 0 $$, '42501', null, 'A cannot change a place''s Google data');
select throws_ok($$ update trip_places set trip_id = (select id from ids where name = 'trip_b') $$,
  '42501', null, 'A cannot move a place to another trip');
select throws_ok($$ update trip_links set url = 'https://evil.example' $$, '42501', null, 'A cannot rewrite a link');
select is(
  public.trip_save_plan((select id from ids where name = 'trip'),
    jsonb_build_array(jsonb_build_object('id', (select id from trip_places limit 1), 'day', 1, 'pos', 0))),
  1, 'A saves the plan'
);
select is((select plan_day from trip_places limit 1), 1, 'the place is on day 1');
select isnt((select planned_at from trips where id = (select id from ids where name = 'trip')), null, 'the trip remembers when it was planned');

-- ---------- stranger B ----------
reset role;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from trips where id = (select id from ids where name = 'trip')), 0, 'B cannot read A''s trip');
select is((select count(*)::int from trip_members where trip_id = (select id from ids where name = 'trip')), 0, 'B cannot read A''s members');
select is((select count(*)::int from trip_links where trip_id = (select id from ids where name = 'trip')), 0, 'B cannot read A''s links');
select is((select count(*)::int from trip_places where trip_id = (select id from ids where name = 'trip')), 0, 'B cannot read A''s places');
select results_eq(
  $$ with u as (update trips set name = 'hacked' where id = (select id from ids where name = 'trip') returning 1) select count(*)::int from u $$,
  array[0], 'B cannot rename A''s trip'
);
select results_eq(
  $$ with u as (update trip_places set note = 'hacked' where trip_id = (select id from ids where name = 'trip') returning 1) select count(*)::int from u $$,
  array[0], 'B cannot plan A''s places'
);
select is(
  public.trip_save_plan((select id from ids where name = 'trip'), '[]'::jsonb), 0, 'B cannot save a plan for A''s trip'
);
select throws_ok(
  $$ select public.trip_save_plan((select id from ids where name = 'trip_b'), '{"id": 1}'::jsonb) $$,
  '22023', null, 'a plan must be a list of places'
);
select results_eq(
  $$ with d as (delete from trips where id = (select id from ids where name = 'trip') returning 1) select count(*)::int from d $$,
  array[0], 'B cannot delete A''s trip'
);
select results_eq(
  $$ with d as (delete from trip_places where trip_id = (select id from ids where name = 'trip') returning 1) select count(*)::int from d $$,
  array[0], 'B cannot delete A''s places'
);
select throws_ok(
  $$ insert into trip_members (trip_id, user_id) select id, 'bbbbbbbb-0000-4000-8000-000000000002' from ids where name = 'trip' $$,
  '42501', null, 'B cannot join A''s trip on their own'
);
select is(is_trip_member((select id from ids where name = 'trip')), false, 'is_trip_member only answers for the caller');

-- ---------- signed-out visitor ----------
reset role;
select pg_temp.as_anon();
select throws_ok($$ select * from trips $$, '42501', null, 'anon cannot read trips');
select throws_ok($$ select * from trip_members $$, '42501', null, 'anon cannot read trip_members');
select throws_ok($$ select * from trip_links $$, '42501', null, 'anon cannot read trip_links');
select throws_ok($$ select * from trip_places $$, '42501', null, 'anon cannot read trip_places');
select throws_ok($$ insert into trips (name, city, start_date) values ('x', 'x', '2027-01-01') $$, '42501', null, 'anon cannot create trips');
select throws_ok($$ select is_trip_member(gen_random_uuid()) $$, '42501', null, 'anon cannot call is_trip_member');

-- ---------- B as an editor (added by the service role until invites exist) ----------
reset role;
select pg_temp.as_service();
insert into trip_members (trip_id, user_id) select id, 'bbbbbbbb-0000-4000-8000-000000000002' from ids where name = 'trip';
reset role;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from trip_places where trip_id = (select id from ids where name = 'trip')), 1, 'editor B reads the trip''s places');
select results_eq(
  $$ with u as (update trips set days = 4 where id = (select id from ids where name = 'trip') returning 1) select count(*)::int from u $$,
  array[1], 'editor B edits the trip details'
);
select results_eq(
  $$ with d as (delete from trips where id = (select id from ids where name = 'trip') returning 1) select count(*)::int from d $$,
  array[0], 'editor B cannot delete the trip'
);
select throws_ok($$ update trip_members set role = 'owner' $$, '42501', null, 'editor B cannot make themself owner');
select results_eq(
  $$ with d as (delete from trip_members returning 1) select count(*)::int from d $$,
  array[0], 'editor B cannot remove members directly'
);

-- ---------- nothing reaches Linkbox's tables ----------
reset role;
select is(
  (select count(*)::int from pg_constraint c join pg_class t on t.oid = c.conrelid
    where c.contype = 'f' and t.relname like 'trip%' and t.relnamespace = 'public'::regnamespace
      and c.confrelid not in ('public.trips'::regclass, 'public.trip_links'::regclass, 'auth.users'::regclass)),
  0, 'trip tables only reference trip tables and auth.users'
);
select is(
  (select count(*)::int from pg_trigger g join pg_class t on t.oid = g.tgrelid join pg_proc p on p.oid = g.tgfoid
    where not g.tgisinternal and t.relname not like 'trip%' and p.proname like '%trip%'),
  0, 'no Tripbox function runs as a trigger on a non-Tripbox table'
);

-- ---------- "Delete my trips" keeps the shared login ----------
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select results_eq(
  $$ with d as (delete from trips where owner_id = 'aaaaaaaa-0000-4000-8000-000000000001' returning 1) select count(*)::int from d $$,
  array[1], 'A deletes the trips they own'
);
reset role;
select is((select count(*)::int from trip_members where trip_id = (select id from ids where name = 'trip')), 0, 'members cascade with the trip');
select is((select count(*)::int from trip_links where trip_id = (select id from ids where name = 'trip'))
        + (select count(*)::int from trip_places where trip_id = (select id from ids where name = 'trip')), 0, 'links and places cascade with the trip');
select is((select count(*)::int from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1, 'A''s login is still there');
select is((select count(*)::int from trips where id = (select id from ids where name = 'trip_b')), 1, 'B''s own trip is untouched');

-- ---------- trip limit ----------
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
insert into trips (name, city, start_date) select 'T' || g, 'X', '2027-01-01' from generate_series(1, 100) g;
select throws_ok($$ insert into trips (name, city, start_date) values ('one too many', 'X', '2027-01-01') $$,
  '54000', null, 'one account can have at most 100 trips');

-- ---------- step 2: usage log, lookup cache, Google coordinates expire (docs/google-maps-terms.md) ----------
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$ select * from trip_usage $$, '42501', null, 'users cannot read the usage log');
select throws_ok($$ insert into trip_usage (user_id, kind, outcome) values ('aaaaaaaa-0000-4000-8000-000000000001', 'import', 'ok') $$,
  '42501', null, 'users cannot write the usage log');
select throws_ok($$ select * from trip_place_cache $$, '42501', null, 'users cannot read the Google lookup cache');
select throws_ok($$ select public.trip_expire_google_coords() $$, '42501', null, 'users cannot run the coordinate clean-up');
reset role;
insert into trip_places (trip_id, google_place_id, name, lat, lng, coords_fetched_at)
  select id, 'old', 'Old', 5, 100, now() - interval '31 days' from ids where name = 'trip_b';
insert into trip_places (trip_id, google_place_id, name, lat, lng, coords_fetched_at)
  select id, 'new', 'New', 5, 100, now() - interval '2 days' from ids where name = 'trip_b';
select public.trip_expire_google_coords();
select is((select lat from trip_places where google_place_id = 'old'), null, 'coordinates older than 30 days are deleted');
select is((select lat from trip_places where google_place_id = 'new'), 5::float8, 'recent coordinates are kept');

-- ---------- step 3: post covers in the private trip-covers bucket (B owns trip_b, A is a stranger) ----------
-- The Storage API sets storage.allow_delete_query for its own deletes; set it here to test the delete policy.
reset role;
set local storage.allow_delete_query = 'true';
insert into storage.objects (bucket_id, name) values
  ('trip-covers', (select id from ids where name = 'trip_b')::text || '/cover-b.jpg'),
  ('trip-covers', 'not-a-trip/evil.jpg');
select throws_ok(
  $$ insert into trip_links (trip_id, cover_path) values ((select id from ids where name = 'trip_b'), 'elsewhere/x.jpg') $$,
  '23514', null, 'a cover must be in its own trip''s folder'
);
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from storage.objects where bucket_id = 'trip-covers'), 1, 'B sees only the covers of their trips');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('trip-covers', (select id from ids where name = 'trip_b')::text || '/mine.jpg') $$,
  '42501', null, 'members cannot upload covers (only the import function)'
);
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select is((select count(*)::int from storage.objects where bucket_id = 'trip-covers'), 0, 'A cannot see the covers of B''s trip');
select results_eq(
  $$ with d as (delete from storage.objects where bucket_id = 'trip-covers' returning 1) select count(*)::int from d $$,
  array[0], 'A cannot delete B''s covers'
);
reset role;
select pg_temp.as_anon();
select is((select count(*)::int from storage.objects where bucket_id = 'trip-covers'), 0, 'signed-out visitors see no covers');
reset role;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select results_eq(
  $$ with d as (delete from storage.objects where bucket_id = 'trip-covers' returning 1) select count(*)::int from d $$,
  array[1], 'B can delete their trip''s covers (before deleting the trip)'
);
reset role;

select * from finish();
rollback;
