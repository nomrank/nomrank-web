-- Importing a menu sheet: restaurants and their dishes in one go, all or nothing.
-- One function serves both the preview and the real import. A preview runs the very same steps and then undoes them, so the
-- numbers it shows can't differ from what an import then does, and an error part-way leaves nothing half-imported.
--
-- `sheet` is an array of { restaurant, area, city, dish?, diet?, list?, slug, slug_alt }, already checked by the app. A
-- restaurant is found by name, area and city (any capitals), or made with the first free address of: slug, slug_alt,
-- slug_alt-2 ... slug_alt-5. A dish already on the menu is left alone. Admins' dishes go live at once, and a food list that
-- doesn't exist is reported (the dish is still added; it's placed in a list by its name, as any new dish is).
create function public.admin_import_menu(sheet jsonb, apply boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  r jsonb;
  rid uuid;
  made boolean;
  list_id uuid;
  dish_id uuid;
  pick text;
  i int;
  seen uuid[] := '{}';
  unknown_lists text[] := '{}';
  new_restaurants int := 0;
  old_restaurants int := 0;
  new_dishes int := 0;
  old_dishes int := 0;
begin
  if jsonb_typeof(sheet) <> 'array' or jsonb_array_length(sheet) > 1000 then
    raise exception 'a sheet has at most 1000 rows' using errcode = '22023';
  end if;

  begin
    for r in select * from jsonb_array_elements(sheet) loop
      select x.id into rid from public.restaurants x
        where lower(x.name) = lower(r ->> 'restaurant') and lower(x.area) = lower(r ->> 'area') and x.city = r ->> 'city' limit 1;
      made := false;
      if rid is null then
        pick := null;
        for i in 0..5 loop
          pick := case i when 0 then r ->> 'slug' when 1 then r ->> 'slug_alt' else (r ->> 'slug_alt') || '-' || i end;
          exit when not exists (select 1 from public.restaurants where slug = pick);
          pick := null;
        end loop;
        if pick is null then
          raise exception 'no free address for %', r ->> 'restaurant' using errcode = '23505';
        end if;
        insert into public.restaurants (slug, name, area, city)
          values (pick, btrim(r ->> 'restaurant'), btrim(r ->> 'area'), r ->> 'city') returning id into rid;
        made := true;
      end if;
      if not (rid = any (seen)) then
        seen := seen || rid;
        if made then new_restaurants := new_restaurants + 1; else old_restaurants := old_restaurants + 1; end if;
      end if;

      if coalesce(r ->> 'dish', '') <> '' then
        if (r ->> 'diet') not in ('veg', 'vegan', 'egg', 'non_veg') then
          raise exception 'a dish needs veg, vegan, egg or non_veg' using errcode = '22023';
        end if;
        list_id := null;
        if coalesce(r ->> 'list', '') <> '' then
          select s.id into list_id from public.spaces s where lower(s.name) = lower(r ->> 'list');
          if list_id is null and not ((r ->> 'list') = any (unknown_lists)) then
            unknown_lists := unknown_lists || (r ->> 'list');
          end if;
        end if;
        insert into public.dishes (restaurant_id, name, diet, space_id, approved_at, created_by)
          values (rid, btrim(r ->> 'dish'), r ->> 'diet', list_id, now(), me)
          on conflict (restaurant_id, name_key) do nothing returning id into dish_id;
        if dish_id is null then old_dishes := old_dishes + 1; else new_dishes := new_dishes + 1; end if;
      end if;
    end loop;

    if not apply then
      raise exception 'preview only' using errcode = 'P0099';
    end if;
  exception when sqlstate 'P0099' then
    null; -- undone on purpose: a preview writes nothing
  end;

  if apply then
    insert into public.moderation_log (admin_id, action, target_type, detail)
      values (me, 'import', 'restaurant', jsonb_build_object('name', format('a menu sheet: %s new places, %s new dishes', new_restaurants, new_dishes)));
  end if;

  return jsonb_build_object(
    'restaurants_new', new_restaurants, 'restaurants_existing', old_restaurants,
    'dishes_new', new_dishes, 'dishes_existing', old_dishes, 'unknown_lists', to_jsonb(unknown_lists)
  );
end $$;

revoke execute on function public.admin_import_menu(jsonb, boolean) from public, anon;
grant execute on function public.admin_import_menu(jsonb, boolean) to authenticated;
