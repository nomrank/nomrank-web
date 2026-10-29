-- DEMO DATA for testing the feed, votes and comments. NOT real reviews: run supabase/demo/clear.sql before launch.
-- Demo accounts use @demo.bitecast.test emails (undeliverable, so nobody can sign in as them) and demo_ handles.
-- Run: pnpm dlx supabase db query --linked -f supabase/demo/seed.sql   (safe to re-run: it clears old demo data first)
-- Then attach demo photos: pnpm dlx supabase db query --linked -f supabase/demo/photos.sql
-- And demo profiles (names, bios, favourites): pnpm dlx supabase db query --linked -f supabase/demo/profiles.sql
-- Then the other launch cities (Mumbai, Delhi, Hyderabad): pnpm dlx supabase db query --linked -f supabase/demo/cities.sql
begin;

delete from auth.users where email like '%@demo.bitecast.test';

insert into auth.users (id, email, created_at)
select gen_random_uuid(), h || '@demo.bitecast.test', now() - interval '20 days'
from unnest(array['demo_idli_insider', 'demo_hot_takes', 'demo_dosa_devotee', 'demo_biryani_brain',
                  'demo_filter_kaapi', 'demo_late_night', 'demo_crispy_edges', 'demo_ghee_please']) as h;

insert into public.profiles (id, username, home_region)
select id, split_part(email, '@', 1), 'karnataka' from auth.users where email like '%@demo.bitecast.test';

-- Ratings: (handle, restaurant slug, dish, score, take or null for score-only, hours ago)
insert into public.ratings (user_id, dish_id, score, take, created_at, updated_at)
select p.id, d.id, r.score, r.take, now() - make_interval(hours => r.hours_ago), now() - make_interval(hours => r.hours_ago)
from (values
  ('demo_idli_insider', 'the-rameshwaram-cafe', 'Ghee Podi Idli', 9.5, 'Ghee podi idli at 7am is a personality trait now. Soft, spicy, unreasonably good.', 2),
  ('demo_hot_takes', 'vidyarthi-bhavan', 'Masala Dosa', 6.5, 'Good dosa, but the chutney is doing most of the work here. The queue is longer than the flavour.', 5),
  ('demo_dosa_devotee', 'vidyarthi-bhavan', 'Masala Dosa', 10, 'Crisp outside, buttery inside, potato that actually tastes like something. Worth every minute of the line.', 30),
  ('demo_biryani_brain', 'meghana-foods', 'Chicken Biryani', 8.5, 'Big portions, properly spiced rice, chicken that falls apart. Not subtle, not trying to be.', 9),
  ('demo_filter_kaapi', 'brahmins-coffee-bar', 'Filter Coffee', 9, 'Strong, frothy, decoction hits right. Stand at the counter like everyone else.', 20),
  ('demo_late_night', 'empire-restaurant', 'Ghee Rice', 7.5, 'Comfort food after midnight. Rice is fragrant, a bit oily, and I would still order it again.', 50),
  ('demo_crispy_edges', 'ctr', 'Benne Masala Dosa', 10, 'The butter pools at the edges and crisps up. That edge is the whole point.', 14),
  ('demo_ghee_please', 'mtr', 'Rava Idli', 8.5, 'Rava idli with cashew bits and that ghee drizzle. Heavy in the best way.', 70),
  ('demo_hot_takes', 'meghana-foods', 'Boneless Chicken Biryani', 5, 'Boneless is convenient, but the bones are where the flavour lives. Mid.', 26),
  ('demo_biryani_brain', 'shivaji-military-hotel', 'Mutton Donne Biryani', 9, 'The leaf does something I can''t explain. Smoky, tender mutton, short-grain rice soaking it all up.', 40),
  ('demo_idli_insider', 'brahmins-coffee-bar', 'Idli', 8, 'Pillowy. The chutney is thin and peppery, exactly how it should be.', 100),
  ('demo_dosa_devotee', 'the-rameshwaram-cafe', 'Ghee Masala Dosa', 7, 'Great ghee, slightly soft centre. Get it hot or don''t get it.', 60),
  ('demo_filter_kaapi', 'vidyarthi-bhavan', 'Kesari Bath', 6, 'Sweet, buttery, a little too sweet after two bites. Share it.', 130),
  ('demo_crispy_edges', 'truffles', 'All American Cheeseburger', 7, 'Messy, juicy, the bun gives up halfway. Fries carry the plate.', 80),
  ('demo_late_night', 'nagarjuna', 'Andhra Meals', 9, 'Unlimited rice and a gunpowder that clears your head. Go hungry, leave sweating.', 170),
  ('demo_ghee_please', 'ctr', 'Mangalore Bajji', 8, 'Crunchy shell, fluffy inside, coconut chutney on the side. Order two plates.', 190),
  ('demo_biryani_brain', 'nagarjuna', 'Chicken Biryani', 7, null, 12),
  ('demo_hot_takes', 'mtr', 'Bisi Bele Bath', 4.5, null, 44),
  ('demo_idli_insider', 'mtr', 'Masala Dosa', 8, null, 210),
  ('demo_late_night', 'empire-restaurant', 'Chicken Kebab', 8, 'Reliable late-night kebab. Charred bits, squeeze of lime, done.', 260),
  -- Two meals (same person, same place, same sitting) so the feed shows a grouped meal card.
  ('demo_crispy_edges', 'ctr', 'Mangalore Bajji', 8.5, 'Ordered these while waiting for the dosa. Fluffy, not oily, gone in a minute.', 14),
  ('demo_filter_kaapi', 'brahmins-coffee-bar', 'Idli', 7.5, 'Had it with the coffee. Soft and simple; the chutney does the talking.', 20)
) as r (handle, slug, dish, score, take, hours_ago)
join public.profiles p on p.username = r.handle
join public.restaurants rest on rest.slug = r.slug
join public.dishes d on d.restaurant_id = rest.id and d.name = r.dish;

-- Votes: every demo user weighs in on a spread of other demo takes (never their own). The trigger keeps the counts.
insert into public.votes (rating_id, user_id, kind, created_at)
select r.id, p.id,
       case when (abs(hashtext(r.id::text || p.id::text)) % 100) < (40 + r.score * 5) then 'facts' else 'cap' end,
       r.created_at + interval '1 hour'
from public.ratings r
join public.profiles author on author.id = r.user_id and author.username like 'demo\_%'
join public.profiles p on p.username like 'demo\_%' and p.id <> r.user_id
where r.take is not null and abs(hashtext(r.id::text || p.username)) % 3 <> 0;

-- A few comment threads: (take author, dish, commenter, body, reply-from, reply)
with threads (take_by, dish, by_handle, body, reply_by, reply) as (values
  ('demo_hot_takes', 'Masala Dosa', 'demo_dosa_devotee', 'Respectfully, I disagree. The dosa holds its own.', 'demo_hot_takes', 'Hold its own? It''s holding the chutney''s coat.'),
  ('demo_hot_takes', 'Masala Dosa', 'demo_crispy_edges', 'The queue is part of the experience though.', null, null),
  ('demo_idli_insider', 'Ghee Podi Idli', 'demo_ghee_please', 'Agreed. Extra podi, always.', 'demo_idli_insider', 'Extra ghee too, obviously.'),
  ('demo_biryani_brain', 'Mutton Donne Biryani', 'demo_late_night', 'Is the leaf placebo? Asking for science.', 'demo_biryani_brain', 'Science says the leaf stays.'),
  ('demo_hot_takes', 'Boneless Chicken Biryani', 'demo_biryani_brain', 'Fair. Boneless is for meetings.', null, null)
), tops as (
  insert into public.comments (rating_id, user_id, body, created_at)
  select r.id, c.id, t.body, r.created_at + interval '2 hours'
  from threads t
  join public.profiles a on a.username = t.take_by
  join public.dishes d on d.name = t.dish
  join public.ratings r on r.user_id = a.id and r.dish_id = d.id
  join public.profiles c on c.username = t.by_handle
  returning id, rating_id, body
)
insert into public.comments (rating_id, user_id, parent_id, body, created_at)
select tops.rating_id, rp.id, tops.id, t.reply, now() - interval '1 hour'
from tops
join threads t on t.body = tops.body and t.reply is not null
join public.profiles rp on rp.username = t.reply_by;

select
  (select count(*) from public.profiles where username like 'demo\_%') as demo_users,
  (select count(*) from public.ratings r join public.profiles p on p.id = r.user_id where p.username like 'demo\_%') as ratings,
  (select count(*) from public.votes v join public.profiles p on p.id = v.user_id where p.username like 'demo\_%') as votes,
  (select count(*) from public.comments c join public.profiles p on p.id = c.user_id where p.username like 'demo\_%') as comments;
commit;
