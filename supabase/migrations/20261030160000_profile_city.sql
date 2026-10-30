-- Where someone eats now (separate from home_region, where they grew up). Null until they pick.
alter table public.profiles add column city text check (city in ('Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'));
grant insert (city), update (city) on public.profiles to authenticated;

-- The feed now opens on latest. Everyone on the old default moves over; Following stays.
alter table public.profile_private alter column feed_default set default 'new';
update public.profile_private set feed_default = 'new' where feed_default = 'top';
