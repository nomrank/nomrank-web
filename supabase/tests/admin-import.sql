-- Importing a menu sheet (public.admin_import_menu): a preview writes nothing, an import writes what the preview said,
-- a second import changes nothing, names and addresses collide safely, and only admins may run it. Runs as a real admin
-- and a real non-admin, in one transaction that always rolls back:
--   pnpm dlx supabase db query --linked -f supabase/tests/admin-import.sql
-- The last line of the error says ALL_OK when every check passed, or names the first one that didn't.
do $$
declare
  boss uuid := gen_random_uuid();   -- an admin
  plain uuid := gen_random_uuid();  -- not an admin
  region text;
  sheet jsonb;
  out jsonb;
  n int;
  msg text;
  list_id uuid;
begin
  select slug into region from public.regions limit 1;
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values (boss, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'imp_boss@example.com', 'x', now(), now(), now()),
         (plain, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'imp_plain@example.com', 'x', now(), now(), now());
  insert into public.profiles (id, username, home_region) values (boss, 'imp_boss', region), (plain, 'imp_plain', region);
  insert into public.admins (user_id) values (boss);
  -- the address "zz-imp-cafe" is taken by another place, so the importer must pick another one
  insert into public.restaurants (slug, name, area, city) values ('zz-imp-cafe', 'Imp Cafe', 'Elsewhere', 'Delhi');
  select id into list_id from public.spaces where name = 'Biryani';

  sheet := jsonb_build_array(
    jsonb_build_object('restaurant', 'Imp Cafe', 'area', 'Indiranagar', 'city', 'Bengaluru', 'dish', 'Imp Biryani', 'diet', 'non_veg', 'list', 'Biryani', 'slug', 'zz-imp-cafe', 'slug_alt', 'zz-imp-cafe-indiranagar'),
    jsonb_build_object('restaurant', 'Imp Cafe', 'area', 'Indiranagar', 'city', 'Bengaluru', 'dish', 'Imp Special', 'diet', 'veg', 'list', 'No Such List', 'slug', 'zz-imp-cafe', 'slug_alt', 'zz-imp-cafe-indiranagar'),
    jsonb_build_object('restaurant', 'imp cafe', 'area', 'elsewhere', 'city', 'Delhi', 'dish', 'Imp Tea', 'diet', 'veg', 'slug', 'zz-imp-cafe', 'slug_alt', 'zz-imp-cafe-elsewhere'),
    jsonb_build_object('restaurant', 'Imp Quiet Place', 'area', 'Bandra', 'city', 'Mumbai', 'slug', 'zz-imp-quiet', 'slug_alt', 'zz-imp-quiet-bandra')
  );

  -- 1. A non-admin can't run it.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', plain, 'role', 'authenticated')::text, true);
  begin perform public.admin_import_menu(sheet, false); msg := 'ran'; exception when others then msg := sqlerrm; end;
  if msg = 'ran' then raise exception 'FAIL a non-admin ran the import'; end if;
  execute 'reset role'; execute 'set local role anon'; perform set_config('request.jwt.claims', '', true);
  begin perform public.admin_import_menu(sheet, false); msg := 'ran'; exception when others then msg := sqlerrm; end;
  if msg = 'ran' then raise exception 'FAIL a signed-out visitor ran the import'; end if;
  execute 'reset role';

  -- 2. A preview counts, and writes nothing.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
  out := public.admin_import_menu(sheet, false);
  execute 'reset role';
  if out <> jsonb_build_object('restaurants_new', 2, 'restaurants_existing', 1, 'dishes_new', 3, 'dishes_existing', 0, 'unknown_lists', jsonb_build_array('No Such List')) then
    raise exception 'FAIL preview counts: %', out;
  end if;
  select count(*) into n from public.restaurants where name in ('Imp Cafe', 'Imp Quiet Place') and slug <> 'zz-imp-cafe';
  if n <> 0 then raise exception 'FAIL the preview wrote % restaurants', n; end if;
  select count(*) into n from public.dishes where name like 'Imp %';
  if n <> 0 then raise exception 'FAIL the preview wrote % dishes', n; end if;

  -- 3. The import does what the preview said.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
  if public.admin_import_menu(sheet, true) <> out then raise exception 'FAIL the import differs from its preview'; end if;
  execute 'reset role';
  select count(*) into n from public.restaurants where slug = 'zz-imp-cafe-indiranagar';
  if n <> 1 then raise exception 'FAIL the same-name place got no fallback address'; end if;
  select count(*) into n from public.dishes d join public.restaurants r on r.id = d.restaurant_id where d.name like 'Imp %' and d.approved_at is not null;
  if n <> 3 then raise exception 'FAIL dishes not live: %', n; end if;
  select count(*) into n from public.dishes where name = 'Imp Biryani' and space_id = list_id;
  if n <> 1 then raise exception 'FAIL the named list was not applied'; end if;
  select count(*) into n from public.dishes d join public.restaurants r on r.id = d.restaurant_id where d.name = 'Imp Tea' and r.slug = 'zz-imp-cafe';
  if n <> 1 then raise exception 'FAIL a differently-capitalised name made a duplicate place'; end if;
  select count(*) into n from public.moderation_log where admin_id = boss and action = 'import';
  if n <> 1 then raise exception 'FAIL the import was not logged: %', n; end if;

  -- 4. Importing the same sheet again changes nothing.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
  out := public.admin_import_menu(sheet, true);
  execute 'reset role';
  if (out ->> 'restaurants_new')::int <> 0 or (out ->> 'dishes_new')::int <> 0 or (out ->> 'dishes_existing')::int <> 3 then raise exception 'FAIL a second import: %', out; end if;
  select count(*) into n from public.restaurants where name in ('Imp Cafe', 'Imp Quiet Place');
  if n <> 3 then raise exception 'FAIL a second import duplicated places: %', n; end if;

  -- 5. A bad row stops everything, and a sheet over the limit is refused.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
  begin
    perform public.admin_import_menu(jsonb_build_array(
      jsonb_build_object('restaurant', 'Imp Fresh', 'area', 'A', 'city', 'Delhi', 'dish', 'Imp Ok', 'diet', 'veg', 'slug', 'zz-imp-fresh', 'slug_alt', 'zz-imp-fresh-a'),
      jsonb_build_object('restaurant', 'Imp Fresh', 'area', 'A', 'city', 'Delhi', 'dish', 'Imp Bad', 'diet', 'meat', 'slug', 'zz-imp-fresh', 'slug_alt', 'zz-imp-fresh-a')), true);
    msg := 'ran';
  exception when others then msg := sqlerrm; end;
  if msg = 'ran' then raise exception 'FAIL a bad diet got through'; end if;
  begin
    perform public.admin_import_menu((select jsonb_agg(jsonb_build_object('restaurant', 'R' || g, 'area', 'A', 'city', 'Delhi', 'slug', 'zz-r' || g, 'slug_alt', 'zz-r-a' || g)) from generate_series(1, 1001) g), false);
    msg := 'ran';
  exception when others then msg := sqlerrm; end;
  if msg <> 'a sheet has at most 1000 rows' then raise exception 'FAIL row limit: %', msg; end if;
  execute 'reset role';
  select count(*) into n from public.restaurants where name = 'Imp Fresh';
  if n <> 0 then raise exception 'FAIL a failed import left a restaurant behind'; end if;

  raise exception 'ALL_OK';
end $$;
