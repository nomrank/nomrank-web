-- Superadmin: the one account that invites and removes admins. Ordinary admins can no longer add or remove admins.
--
-- The account starts with the well-known login superadmin / superadmin. Until its password is changed, the database
-- refuses every admin action from it (private.require_admin), so the default password alone can't be used to do anything.

create extension if not exists pgcrypto with schema extensions;

alter table public.admins add column is_super boolean not null default false;
create unique index admins_one_super on public.admins (is_super) where is_super;

-- The account. Its sign-in address is reserved: it can't receive mail, and the admin sign-in form maps the username
-- "superadmin" onto it (lib/superadmin.ts keeps the same address).
do $$
declare
  uid uuid;
  mail constant text := 'superadmin@admin.nomrank.in';
begin
  select id into uid from auth.users where email = mail;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
      extensions.crypt('superadmin', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true), 'email', now(), now(), now());
  end if;
  insert into public.profiles (id, username, display_name, home_region)
  values (uid, 'superadmin', 'Superadmin', 'karnataka') on conflict (id) do nothing;
  insert into public.admins (user_id, is_super) values (uid, true) on conflict (user_id) do update set is_super = true;
end $$;

-- Still on the default password? (Only the superadmin starts with a known one.)
create function private.on_default_password(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = uid and u.encrypted_password = extensions.crypt('superadmin', u.encrypted_password)
  );
$$;

create function private.is_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and is_super);
$$;

-- Every admin action starts here. The superadmin must first have changed the default password.
create or replace function private.require_admin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if not (select public.is_admin()) then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if private.is_superadmin() and private.on_default_password(me) then
    raise exception 'change the default password first' using errcode = '42501';
  end if;
  return me;
end $$;

create function private.require_superadmin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  if not private.is_superadmin() then
    raise exception 'superadmin only' using errcode = '42501';
  end if;
  return me;
end $$;

-- What the admin site needs to know about the signed-in person.
create function public.admin_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'admin', (select public.is_admin()),
    'super', private.is_superadmin(),
    'default_password', private.is_superadmin() and private.on_default_password((select auth.uid()))
  );
$$;
revoke execute on function public.admin_status() from public, anon;
grant execute on function public.admin_status() to authenticated;

-- Admins can no longer add or remove each other. Invitations replace adding by handle.
drop function public.admin_set_admin(uuid, boolean);

drop function public.admin_list_admins();
create function public.admin_list_admins() returns table (user_id uuid, username text, display_name text, created_at timestamptz, is_super boolean)
language sql stable security definer set search_path = '' as $$
  select a.user_id, p.username, p.display_name, a.created_at, a.is_super
  from public.admins a join public.profiles p on p.id = a.user_id
  where (select public.is_admin())
  order by a.is_super desc, a.created_at;
$$;

-- Invitations: the emailed link carries a random token; only its hash is stored.
create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and char_length(email) <= 254),
  token_hash text not null unique,
  invited_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);
alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from anon, authenticated;

create function public.admin_create_invite(invite_email text, hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_superadmin();
begin
  invite_email := lower(btrim(invite_email));
  if exists (select 1 from public.admins a join auth.users u on u.id = a.user_id where lower(u.email) = invite_email) then
    raise exception 'already an admin' using errcode = '23505';
  end if;
  delete from public.admin_invites where email = invite_email and accepted_at is null; -- a new invite replaces an open one
  insert into public.admin_invites (email, token_hash, invited_by) values (invite_email, hash, me);
  insert into public.moderation_log (admin_id, action, target_type, detail)
    values (me, 'invite_admin', 'account', jsonb_build_object('name', invite_email));
end $$;

create function public.admin_list_invites() returns table (id uuid, email text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id, i.email, i.created_at, i.expires_at from public.admin_invites i
  where private.is_superadmin() and i.accepted_at is null order by i.created_at desc;
$$;

create function public.admin_cancel_invite(invite uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_superadmin();
begin
  delete from public.admin_invites where id = invite and accepted_at is null;
  insert into public.moderation_log (admin_id, action, target_type, detail) values (me, 'cancel_invite', 'account', '{}');
end $$;

-- The invited person accepts while signed in with the account that has the invited email.
create function public.accept_admin_invite(hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  mine text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  inv public.admin_invites;
begin
  if me is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  select * into inv from public.admin_invites where token_hash = hash and accepted_at is null and expires_at > now();
  if not found then
    raise exception 'invitation not valid' using errcode = 'P0002';
  end if;
  if inv.email <> mine then
    raise exception 'invitation is for another email' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = me and banned_at is not null) then
    raise exception 'a banned account can''t be an admin' using errcode = '42501';
  end if;
  insert into public.admins (user_id) values (me) on conflict do nothing;
  update public.admin_invites set accepted_at = now() where id = inv.id;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'accept_admin', 'account', me, jsonb_build_object('invited_by', inv.invited_by));
end $$;

-- Remove an admin; returns their email so the app can tell them. The superadmin can't be removed.
create function public.admin_remove_admin(account uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_superadmin();
  mail text;
begin
  if exists (select 1 from public.admins where user_id = account and is_super) then
    raise exception 'the superadmin can''t be removed' using errcode = '42501';
  end if;
  select u.email into mail from auth.users u where u.id = account;
  delete from public.admins where user_id = account;
  insert into public.moderation_log (admin_id, action, target_type, target_id)
    values (me, 'remove_admin', 'account', account);
  return mail;
end $$;

revoke execute on function public.admin_list_admins(), public.admin_create_invite(text, text), public.admin_list_invites(),
  public.admin_cancel_invite(uuid), public.accept_admin_invite(text), public.admin_remove_admin(uuid) from public, anon;
grant execute on function public.admin_list_admins(), public.admin_create_invite(text, text), public.admin_list_invites(),
  public.admin_cancel_invite(uuid), public.accept_admin_invite(text), public.admin_remove_admin(uuid) to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
