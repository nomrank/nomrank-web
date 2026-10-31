-- Accepting an admin invitation: every way it can go wrong gives its own message, and the good path works.
-- Runs in one transaction that always rolls back, so nothing is left behind:
--   pnpm dlx supabase db query --linked -f supabase/tests/admin-invite.sql
-- The last line of the error says ALL_OK when every check passed, or names the first one that didn't.
do $$
declare
  nobody uuid := gen_random_uuid();   -- confirmed email, no Nomrank profile yet
  member uuid := gen_random_uuid();   -- confirmed email, finished profile
  fresh uuid := gen_random_uuid();    -- profile, but the email was never confirmed
  other uuid := gen_random_uuid();    -- a different email
  region text;
  tok text;
  msg text;
begin
  select slug into region from public.regions limit 1;
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
    (nobody, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inv_nobody@example.com', 'x', now(), now(), now()),
    (member, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inv_member@example.com', 'x', now(), now(), now()),
    (fresh,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inv_fresh@example.com',  'x', null,  now(), now()),
    (other,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inv_other@example.com',  'x', now(), now(), now());
  insert into public.profiles (id, username, home_region) values (member, 'inv_member', region), (fresh, 'inv_fresh', region), (other, 'inv_other', region);

  -- 1. No profile -> its own message (this used to surface as "expired").
  insert into public.admin_invites (email, token_hash) values ('inv_nobody@example.com', 'h_nobody');
  perform set_config('request.jwt.claims', json_build_object('sub', nobody, 'role', 'authenticated', 'email', 'inv_nobody@example.com')::text, true);
  begin perform public.accept_admin_invite('h_nobody'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'finish setting up your account first' then raise exception 'FAIL no-profile: %', msg; end if;

  -- 2. Unconfirmed email is refused.
  insert into public.admin_invites (email, token_hash) values ('inv_fresh@example.com', 'h_fresh');
  perform set_config('request.jwt.claims', json_build_object('sub', fresh, 'role', 'authenticated', 'email', 'inv_fresh@example.com')::text, true);
  begin perform public.accept_admin_invite('h_fresh'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'confirm your email first' then raise exception 'FAIL unconfirmed: %', msg; end if;

  -- 3. Wrong account for the invited email.
  insert into public.admin_invites (email, token_hash) values ('inv_member@example.com', 'h_member');
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated', 'email', 'inv_other@example.com')::text, true);
  begin perform public.accept_admin_invite('h_member'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'invitation is for another email' then raise exception 'FAIL wrong-email: %', msg; end if;

  -- 4. Unknown token.
  begin perform public.accept_admin_invite('h_nothing'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'invitation not found' then raise exception 'FAIL not-found: %', msg; end if;

  -- 5. Expired.
  insert into public.admin_invites (email, token_hash, expires_at) values ('inv_other@example.com', 'h_old', now() - interval '1 minute');
  begin perform public.accept_admin_invite('h_old'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'invitation expired' then raise exception 'FAIL expired: %', msg; end if;

  -- 6. Signed out.
  perform set_config('request.jwt.claims', '', true);
  begin perform public.accept_admin_invite('h_member'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'sign in first' then raise exception 'FAIL signed-out: %', msg; end if;

  -- 7. The good path, then reuse.
  perform set_config('request.jwt.claims', json_build_object('sub', member, 'role', 'authenticated', 'email', 'Inv_Member@Example.com')::text, true);
  begin perform public.accept_admin_invite('h_member'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'ok' then raise exception 'FAIL accept: %', msg; end if;
  if not exists (select 1 from public.admins where user_id = member) then raise exception 'FAIL accept: not made admin'; end if;
  begin perform public.accept_admin_invite('h_member'); msg := 'ok'; exception when others then msg := sqlerrm; end;
  if msg <> 'invitation already used' then raise exception 'FAIL reuse: %', msg; end if;

  raise exception 'ALL_OK';
end $$;
