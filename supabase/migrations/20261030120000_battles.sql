-- Battles: two dishes head to head, one vote per person per battle (you can change your pick).
-- Anyone can read battles and the tally; only signed-in people vote; only admins create or delete (functions below).

create table public.battles (
  id uuid primary key default gen_random_uuid(),
  dish_a uuid not null references public.dishes on delete cascade,
  dish_b uuid not null references public.dishes on delete cascade,
  tag text not null check (tag = btrim(tag) and char_length(tag) between 3 and 80),
  city text check (city in ('Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad')), -- null: a city war, shown in every city
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  check (dish_a <> dish_b)
);
create index battles_created_idx on public.battles (created_at);
alter table public.battles enable row level security;
grant select on public.battles to anon, authenticated;
create policy "battles are public" on public.battles for select using (true);

create table public.battle_votes (
  battle_id uuid not null references public.battles on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  side text not null check (side in ('a', 'b')),
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);
alter table public.battle_votes enable row level security;
revoke all on public.battle_votes from anon, authenticated;
grant select, insert, update on public.battle_votes to authenticated;
create policy "people see their own battle votes" on public.battle_votes for select to authenticated using ((select auth.uid()) = user_id);
create policy "people vote as themselves" on public.battle_votes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "people change their own battle votes" on public.battle_votes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create trigger battle_votes_block_banned before insert or update on public.battle_votes for each row execute function private.block_banned();
create trigger battle_votes_rate_limit before insert on public.battle_votes for each row execute function private.rate_limit('300', '1 day', 'user_id');

-- The tally: counts only, never who voted. A plain view (it runs as its owner) so everyone can read it.
create view public.battle_tally as
  select battle_id, count(*) filter (where side = 'a')::int as a, count(*) filter (where side = 'b')::int as b
  from public.battle_votes group by battle_id;
grant select on public.battle_tally to anon, authenticated;

-- Admin: create a battle between two live dishes, or delete one. Both are logged.
create function public.admin_create_battle(dish_a uuid, dish_b uuid, tag text, city text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  if (select count(*) from public.dishes d where d.id in (dish_a, dish_b) and d.approved_at is not null) < 2 then
    raise exception 'both dishes must be live' using errcode = '22023';
  end if;
  insert into public.battles (dish_a, dish_b, tag, city, created_by) values (dish_a, dish_b, btrim(tag), city, me);
  insert into public.moderation_log (admin_id, action, target_type, detail) values (me, 'add', 'battle', jsonb_build_object('name', btrim(tag)));
end $$;

create function public.admin_delete_battle(battle uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  about text;
begin
  select b.tag into about from public.battles b where b.id = battle;
  delete from public.battles where id = battle;
  insert into public.moderation_log (admin_id, action, target_type, detail) values (me, 'delete', 'battle', jsonb_build_object('name', about));
end $$;

revoke execute on function public.admin_create_battle(uuid, uuid, text, text), public.admin_delete_battle(uuid) from public, anon;
grant execute on function public.admin_create_battle(uuid, uuid, text, text), public.admin_delete_battle(uuid) to authenticated;
