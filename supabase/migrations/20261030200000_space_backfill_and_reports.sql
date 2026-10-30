-- A new list takes in the dishes already on the site that carry its name and sit in no list yet.
create function private.fill_new_space() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.dishes d set space_id = new.id where d.space_id is null and position(new.name_key in d.name_key) > 0;
  return null;
end $$;
revoke execute on function private.fill_new_space() from public, anon, authenticated;
create trigger spaces_fill_dishes after insert on public.spaces for each row execute function private.fill_new_space();

-- Spaces can be reported, and admins can remove them. Their dishes stay, unlisted.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('rating', 'comment', 'dish', 'space'));
alter table public.reports drop constraint reports_reason_check;
alter table public.reports add constraint reports_reason_check check (
  (target_type = 'rating' and reason in ('off_topic', 'fake', 'wrong_dish', 'abusive', 'photo', 'spam', 'other'))
  or (target_type = 'comment' and reason in ('abusive', 'spam', 'off_topic', 'other'))
  or (target_type = 'dish' and reason in ('duplicate', 'wrong_place', 'not_on_menu', 'misspelled', 'wrong_diet', 'inappropriate', 'other'))
  or (target_type = 'space' and reason in ('duplicate', 'inappropriate', 'spam', 'other'))
);

create or replace function public.admin_delete(target_type text, target uuid, note text default null) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
  author uuid;
  about text;
  about_dish uuid;
begin
  if target_type = 'rating' then
    select r.user_id, d.name, d.id into author, about, about_dish from public.ratings r join public.dishes d on d.id = r.dish_id where r.id = target;
    select array_agg(path) into paths from public.rating_photos where rating_id = target;
    delete from public.ratings where id = target;
    if author is not null then
      insert into public.notifications (user_id, kind, dish_id, detail) values (author, 'take_removed', about_dish, left(about, 200));
    end if;
  elsif target_type = 'comment' then
    select c.user_id, d.name, d.id into author, about, about_dish
      from public.comments c join public.ratings r on r.id = c.rating_id join public.dishes d on d.id = r.dish_id where c.id = target;
    delete from public.comments where id = target;
    if author is not null then
      insert into public.notifications (user_id, kind, dish_id, detail) values (author, 'comment_removed', about_dish, left(about, 200));
    end if;
  elsif target_type = 'dish' then
    select created_by, name into author, about from public.dishes where id = target;
    select array_agg(p.path) into paths from public.rating_photos p join public.ratings r on r.id = p.rating_id where r.dish_id = target;
    delete from public.dishes where id = target;
    if author is not null and author <> me then
      insert into public.notifications (user_id, kind, detail) values (author, 'dish_removed', left(about, 200));
    end if;
  elsif target_type = 'space' then
    delete from public.spaces where id = target;
  else
    raise exception 'unknown target type' using errcode = '22023';
  end if;
  update public.reports set resolved_at = now(), resolved_by = me, resolution = 'removed'
    where reports.target_type = admin_delete.target_type and target_id = target and resolved_at is null;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'delete', target_type, target, jsonb_build_object('note', note));
  return coalesce(paths, '{}');
end $$;
