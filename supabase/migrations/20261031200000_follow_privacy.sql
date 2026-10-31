-- Who can see your followers and who you follow.
-- Until now every follow was public to anyone, even signed-out visitors. Each person now picks, for each list, between
-- everyone, only their followers, or only themselves (the same three choices as the Want to try list and Diary).
-- The database enforces it, so the app can't leak a hidden list by mistake.

alter table public.profiles
  add column followers_visibility text not null default 'everyone' check (followers_visibility in ('everyone', 'followers', 'only_me')),
  add column following_visibility text not null default 'everyone' check (following_visibility in ('everyone', 'followers', 'only_me'));
grant update (followers_visibility, following_visibility) on public.profiles to authenticated;

-- May the caller see `owner`'s list `kind` ('followers' or 'following')? Their own: always. Otherwise it depends on the
-- owner's choice; "followers" means the caller follows the owner. It runs as the owner of the function because it reads
-- profiles and follows itself, which would otherwise loop back through the follows policy below.
create function public.can_see_follow_list(owner uuid, kind text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = owner
    or exists (
      select 1
      from public.profiles p
      cross join lateral (select case kind when 'followers' then p.followers_visibility else p.following_visibility end as v) s
      where p.id = owner
        and (
          s.v = 'everyone'
          or (s.v = 'followers' and exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = owner))
        )
    );
$$;
revoke execute on function public.can_see_follow_list(uuid, text) from public;
grant execute on function public.can_see_follow_list(uuid, text) to anon, authenticated;

-- A follow is visible to the two people in it, and to anyone who may see either list it appears in.
drop policy "follows are public" on public.follows;
create policy "follows follow the lists' privacy" on public.follows for select to anon, authenticated
  using (
    (select auth.uid()) = follower_id
    or (select auth.uid()) = followee_id
    or public.can_see_follow_list(followee_id, 'followers')
    or public.can_see_follow_list(follower_id, 'following')
  );

-- The counts on a profile stay exact for everyone, whatever they're allowed to list: they run as the function's owner.
-- (Everything else this reads, the ratings and comments, is public already.)
alter function public.profile_stats(uuid) security definer;

-- The superadmin account is how the admin site is run and invitations are sent; deleting it would lock everyone out.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if private.is_superadmin() then
    raise exception 'the superadmin account can''t be deleted' using errcode = '42501';
  end if;
  delete from auth.users where id = (select auth.uid());
end $$;
