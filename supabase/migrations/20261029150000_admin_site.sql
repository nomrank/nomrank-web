-- The admin site (admin.nomrank.in): manage admins, edit or delete restaurants, edit dishes.
-- Each function checks the caller is an admin (private.require_admin) and writes the moderation log.

-- Who's an admin. The admins table itself stays unreadable; this returns it to admins only.
create function public.admin_list_admins() returns table (user_id uuid, username text, display_name text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.user_id, p.username, p.display_name, a.created_at
  from public.admins a join public.profiles p on p.id = a.user_id
  where (select public.is_admin())
  order by a.created_at;
$$;

-- Make someone an admin, or remove one. You can't remove yourself, so there's always at least one admin left.
create function public.admin_set_admin(account uuid, make boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  if make then
    if exists (select 1 from public.profiles where id = account and banned_at is not null) then
      raise exception 'a banned account can''t be an admin' using errcode = '42501';
    end if;
    insert into public.admins (user_id) values (account) on conflict do nothing;
  else
    if account = me then
      raise exception 'you can''t remove yourself' using errcode = '42501';
    end if;
    delete from public.admins where user_id = account;
  end if;
  insert into public.moderation_log (admin_id, action, target_type, target_id)
    values (me, case when make then 'make_admin' else 'remove_admin' end, 'account', account);
end $$;

-- Fix a restaurant's name, area or city (the slug, and so its links, stay the same).
create function public.admin_update_restaurant(target uuid, name text, area text, city text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  update public.restaurants r set name = btrim(admin_update_restaurant.name), area = btrim(admin_update_restaurant.area), city = admin_update_restaurant.city
  where r.id = target;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'edit', 'restaurant', target, jsonb_build_object('name', name, 'city', city));
end $$;

-- Delete a restaurant with its dishes and their takes (cascade). Returns the photo files to remove from Storage.
create function public.admin_delete_restaurant(target uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
  about text;
begin
  select r.name into about from public.restaurants r where r.id = target;
  select array_agg(p.path) into paths
    from public.rating_photos p join public.ratings x on x.id = p.rating_id join public.dishes d on d.id = x.dish_id
    where d.restaurant_id = target;
  delete from public.restaurants where id = target;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'delete', 'restaurant', target, jsonb_build_object('name', about));
  return coalesce(paths, '{}');
end $$;

-- Rename a dish or fix its diet mark.
create function public.admin_update_dish(target uuid, name text, diet text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  update public.dishes d set name = btrim(admin_update_dish.name), diet = admin_update_dish.diet where d.id = target;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'edit', 'dish', target, jsonb_build_object('name', name));
end $$;

revoke execute on function public.admin_list_admins(), public.admin_set_admin(uuid, boolean), public.admin_update_restaurant(uuid, text, text, text),
  public.admin_delete_restaurant(uuid), public.admin_update_dish(uuid, text, text) from public, anon;
grant execute on function public.admin_list_admins(), public.admin_set_admin(uuid, boolean), public.admin_update_restaurant(uuid, text, text, text),
  public.admin_delete_restaurant(uuid), public.admin_update_dish(uuid, text, text) to authenticated;
