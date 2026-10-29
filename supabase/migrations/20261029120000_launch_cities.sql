-- Nomrank launches in four cities. A restaurant must be in one of them (the app keeps the same list in lib/cities.ts).
alter table public.restaurants
  add constraint restaurants_city_launch check (city in ('Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'));

-- Admins add a restaurant with its city. The old three-argument version (always Bengaluru) goes.
drop function public.admin_add_restaurant(text, text, text);
create function public.admin_add_restaurant(slug text, name text, area text, city text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  insert into public.restaurants (slug, name, area, city) values (slug, btrim(name), btrim(area), city);
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'add', 'restaurant', (select id from public.restaurants r where r.slug = admin_add_restaurant.slug), jsonb_build_object('name', name, 'city', city));
end $$;
revoke execute on function public.admin_add_restaurant(text, text, text, text) from public, anon;
grant execute on function public.admin_add_restaurant(text, text, text, text) to authenticated;
