-- Superadmin rules, checked as real signed-in users. Everything runs inside a transaction that is rolled back, so no data
-- (and not the superadmin's password) changes.
--   pnpm dlx supabase db query --linked -f supabase/tests/superadmin.sql
begin;

create temp table result (step text, ok boolean);
grant all on result to authenticated;

-- A second account to invite, and the superadmin with a changed password (as after their first sign-in).
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'invitee@example.com');
insert into public.profiles (id, username, home_region) values ('00000000-0000-0000-0000-0000000000a1', 'test_invitee', 'karnataka');
update auth.users set encrypted_password = extensions.crypt('changed-by-test', extensions.gen_salt('bf')) where email = 'superadmin@admin.nomrank.in';

do $$
declare
  sa uuid := (select id from auth.users where email = 'superadmin@admin.nomrank.in');
  invitee uuid := '00000000-0000-0000-0000-0000000000a1';
  mail text;
  failed boolean;
begin
  -- As the superadmin (password changed): invite, list, accept as someone with a different email → refused.
  perform set_config('request.jwt.claims', json_build_object('sub', sa, 'email', 'superadmin@admin.nomrank.in', 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_create_invite('invitee@example.com', 'hash-1');
  insert into result values ('superadmin can invite', (select count(*) from public.admin_list_invites()) = 1);

  -- The invitee, wrong email in the session → refused; right email → becomes admin.
  perform set_config('request.jwt.claims', json_build_object('sub', invitee, 'email', 'someone-else@example.com', 'role', 'authenticated')::text, true);
  failed := false;
  begin perform public.accept_admin_invite('hash-1'); exception when others then failed := true; end;
  insert into result values ('wrong email is refused', failed);

  perform set_config('request.jwt.claims', json_build_object('sub', invitee, 'email', 'invitee@example.com', 'role', 'authenticated')::text, true);
  perform public.accept_admin_invite('hash-1');
  insert into result values ('right email becomes admin', (select public.is_admin()));

  failed := false;
  begin perform public.accept_admin_invite('hash-1'); exception when others then failed := true; end;
  insert into result values ('invite works once', failed);

  -- A plain admin can't invite or remove admins.
  failed := false;
  begin perform public.admin_create_invite('x@example.com', 'hash-2'); exception when others then failed := true; end;
  insert into result values ('plain admin can''t invite', failed);
  failed := false;
  begin perform public.admin_remove_admin(sa); exception when others then failed := true; end;
  insert into result values ('plain admin can''t remove', failed);

  -- The superadmin removes the new admin (gets their email back) and can't remove themselves.
  perform set_config('request.jwt.claims', json_build_object('sub', sa, 'email', 'superadmin@admin.nomrank.in', 'role', 'authenticated')::text, true);
  mail := public.admin_remove_admin(invitee);
  insert into result values ('removal returns their email', mail = 'invitee@example.com');
  insert into result values ('they are no longer admin', not exists (select 1 from public.admin_list_admins() a where a.user_id = invitee));
  failed := false;
  begin perform public.admin_remove_admin(sa); exception when others then failed := true; end;
  insert into result values ('superadmin can''t be removed', failed);
end $$;

reset role;
select step, ok from result order by step;
rollback;
