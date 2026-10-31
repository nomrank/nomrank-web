-- Accepting an admin invitation, stricter and clearer.
-- Before: someone with no finished Nomrank profile hit a foreign-key error that the app showed as "expired".
-- Now each way it can fail has its own message, an unconfirmed email is refused, and the invitation row is locked so
-- two clicks can't both pass.
create or replace function public.accept_admin_invite(hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  mine text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  inv public.admin_invites;
begin
  if me is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  select * into inv from public.admin_invites where token_hash = hash for update;
  if not found then
    raise exception 'invitation not found' using errcode = 'P0002';
  end if;
  if inv.accepted_at is not null then
    raise exception 'invitation already used' using errcode = 'P0002';
  end if;
  if inv.expires_at <= now() then
    raise exception 'invitation expired' using errcode = 'P0002';
  end if;
  if inv.email <> mine then
    raise exception 'invitation is for another email' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = me and u.email_confirmed_at is not null) then
    raise exception 'confirm your email first' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'finish setting up your account first' using errcode = 'P0003';
  end if;
  if exists (select 1 from public.profiles where id = me and banned_at is not null) then
    raise exception 'a banned account can''t be an admin' using errcode = '42501';
  end if;
  insert into public.admins (user_id) values (me) on conflict do nothing;
  update public.admin_invites set accepted_at = now() where id = inv.id;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'accept_admin', 'account', me, jsonb_build_object('invited_by', inv.invited_by));
end $$;
