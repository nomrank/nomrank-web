-- Anyone signed in can start a food list (a Space). Names stay unique (by name_key), suspended accounts are blocked,
-- and each person can start five a day. Lists are seeded or admin-made before this; members add them from here.
grant insert (name) on public.spaces to authenticated;
create policy "members start spaces as themselves" on public.spaces for insert to authenticated
  with check ((select auth.uid()) = created_by);
create trigger spaces_block_banned before insert on public.spaces for each row execute function private.block_banned();
create trigger spaces_rate_limit before insert on public.spaces for each row execute function private.rate_limit('5', '1 day', 'created_by');

-- The first-time tour: set once a new account has seen it (or skipped it). Existing members have used the app already,
-- so they're marked as done rather than shown it.
alter table public.profiles add column tour_done_at timestamptz;
update public.profiles set tour_done_at = now();
grant update (tour_done_at) on public.profiles to authenticated;
