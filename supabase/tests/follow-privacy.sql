-- Follower and following privacy, tested as the roles the app really uses (anon, authenticated), so the row-level
-- policy is exercised rather than bypassed. One transaction that always rolls back:
--   pnpm dlx supabase db query --linked -f supabase/tests/follow-privacy.sql
-- The last line of the error says ALL_OK when every check passed, or names the first one that didn't.
do $$
declare
  o uuid := gen_random_uuid();   -- the owner whose lists we look at
  f uuid := gen_random_uuid();   -- follows the owner
  g uuid := gen_random_uuid();   -- also follows the owner; hides who they follow
  s uuid := gen_random_uuid();   -- a stranger
  x uuid := gen_random_uuid();   -- someone the owner follows; hides who they follow
  region text;
  su uuid;
  n int;
  msg text;

begin
  select slug into region from public.regions limit 1;
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fp_' || left(u::text, 8) || '@example.com', 'x', now(), now(), now()
  from unnest(array[o, f, g, s, x]) as u;
  insert into public.profiles (id, username, home_region) values
    (o, 'fp_owner', region), (f, 'fp_fan', region), (g, 'fp_gap', region), (s, 'fp_stranger', region), (x, 'fp_target', region);
  update public.profiles set following_visibility = 'only_me' where id in (g, x);
  insert into public.follows (follower_id, followee_id) values (f, o), (g, o), (o, x);

  -- 1. Everyone (the default): a stranger and a signed-out visitor see both lists.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where followee_id = o;
  if n <> 2 then raise exception 'FAIL everyone/followers (stranger): saw %', n; end if;
  if not public.can_see_follow_list(o, 'followers') then raise exception 'FAIL can_see followers default'; end if;
  execute 'reset role'; execute 'set local role anon'; perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.follows where followee_id = o;
  if n <> 2 then raise exception 'FAIL everyone/followers (signed out): saw %', n; end if;
  execute 'reset role';

  -- 2. Followers only. A follower sees the list; a stranger and a signed-out visitor don't.
  update public.profiles set followers_visibility = 'followers' where id = o;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where followee_id = o;
  if n <> 2 then raise exception 'FAIL followers-only (a follower): saw %', n; end if;
  if not public.can_see_follow_list(o, 'followers') then raise exception 'FAIL can_see followers-only follower'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where followee_id = o and follower_id = g;
  if n <> 0 then raise exception 'FAIL followers-only (a stranger): saw %', n; end if;
  if public.can_see_follow_list(o, 'followers') then raise exception 'FAIL can_see followers-only stranger'; end if;
  execute 'reset role'; execute 'set local role anon'; perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.follows where followee_id = o and follower_id = g;
  if n <> 0 then raise exception 'FAIL followers-only (signed out): saw %', n; end if;
  execute 'reset role';

  -- 3. Only me. Even a follower can't list it; the owner can; both people in a follow always see their own.
  update public.profiles set followers_visibility = 'only_me' where id = o;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where followee_id = o and follower_id = g;
  if n <> 0 then raise exception 'FAIL only-me (a follower sees another): saw %', n; end if;
  select count(*) into n from public.follows where followee_id = o and follower_id = f;
  if n <> 1 then raise exception 'FAIL only-me (own follow hidden from its owner): saw %', n; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where followee_id = o;
  if n <> 2 then raise exception 'FAIL only-me (the owner): saw %', n; end if;

  -- 4. The people someone follows.
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where follower_id = o and followee_id = x;
  if n <> 1 then raise exception 'FAIL following list of an open owner: saw %', n; end if;  -- owner shows who they follow
  -- A follow shows up in two lists: the owner's following and the followed person's followers. Both must hide it.
  execute 'reset role'; update public.profiles set following_visibility = 'only_me' where id = o;
  execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where follower_id = o and followee_id = x;
  if n <> 1 then raise exception 'FAIL still visible through the followed person''s open followers list: saw %', n; end if;
  execute 'reset role'; update public.profiles set followers_visibility = 'only_me' where id = x;
  execute 'set local role authenticated'; perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where follower_id = o and followee_id = x;
  if n <> 0 then raise exception 'FAIL following list hidden by owner and by the followed person: saw %', n; end if;
  if public.can_see_follow_list(o, 'following') then raise exception 'FAIL can_see following only-me stranger'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
  select count(*) into n from public.follows where follower_id = o and followee_id = x;
  if n <> 1 then raise exception 'FAIL the followed person still sees who follows them: saw %', n; end if;
  execute 'reset role';

  -- 5. The counts on a profile stay exact for a viewer who may list nothing.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  select followers into n from public.profile_stats(o);
  if n <> 2 then raise exception 'FAIL follower count for a stranger: %', n; end if;
  select following into n from public.profile_stats(o);
  if n <> 1 then raise exception 'FAIL following count for a stranger: %', n; end if;
  execute 'reset role';

  -- 6. The superadmin account can't be deleted; an ordinary account can.
  select user_id into su from public.admins where is_super limit 1;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated')::text, true);
  begin perform public.delete_my_account(); msg := 'deleted'; exception when others then msg := sqlerrm; end;
  if msg <> 'the superadmin account can''t be deleted' then raise exception 'FAIL superadmin delete: %', msg; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  perform public.delete_my_account();
  execute 'reset role';
  if exists (select 1 from auth.users where id = s) then raise exception 'FAIL ordinary delete left the user'; end if;

  raise exception 'ALL_OK';
end $$;
