-- DEMO DATA for Mumbai, Delhi and Hyderabad, mirroring seed.sql's Bengaluru demo so the city picker has something in
-- every city. NOT real reviews: clear.sql removes the demo accounts and, by cascade, everything they wrote.
-- The places, food lists and dishes it adds are real and well known, and stay (like the Bengaluru seed list).
-- Run after seed.sql (re-running seed.sql deletes these demo accounts too, so run this again after it):
--   pnpm dlx supabase db query --linked -f supabase/demo/cities.sql      (safe to re-run)
begin;

-- Places, food lists and dishes -------------------------------------------------------------------------------------

insert into public.restaurants (slug, name, area, city) values
  ('bademiya', 'Bademiya', 'Colaba', 'Mumbai'),
  ('sardar-pav-bhaji', 'Sardar Pav Bhaji', 'Tardeo', 'Mumbai'),
  ('ashok-vada-pav', 'Ashok Vada Pav', 'Dadar', 'Mumbai'),
  ('cafe-madras', 'Cafe Madras', 'Matunga', 'Mumbai'),
  ('karims', 'Karim''s', 'Jama Masjid', 'Delhi'),
  ('sita-ram-diwan-chand', 'Sita Ram Diwan Chand', 'Paharganj', 'Delhi'),
  ('moti-mahal', 'Moti Mahal', 'Daryaganj', 'Delhi'),
  ('saravana-bhavan-cp', 'Saravana Bhavan', 'Connaught Place', 'Delhi'),
  ('paradise', 'Paradise', 'Secunderabad', 'Hyderabad'),
  ('bawarchi', 'Bawarchi', 'RTC X Roads', 'Hyderabad'),
  ('pista-house', 'Pista House', 'Shalibanda', 'Hyderabad'),
  ('cafe-niloufer', 'Cafe Niloufer', 'Lakdikapul', 'Hyderabad'),
  ('shah-ghouse', 'Shah Ghouse', 'Tolichowki', 'Hyderabad')
on conflict (slug) do nothing;

-- New food lists, each with the region it comes from (for Tastes like home). Dishes join a list by name (trigger).
insert into public.spaces (name, origin_region)
select v.name, v.region from (values
  ('Vada Pav', 'maharashtra'), ('Pav Bhaji', 'maharashtra'), ('Butter Chicken', 'delhi'), ('Nihari', 'delhi'),
  ('Chole Bhature', 'punjab'), ('Haleem', 'telangana'), ('Irani Chai', 'telangana')
) as v(name, region)
where not exists (select 1 from public.spaces s where lower(s.name) = lower(v.name));

insert into public.dishes (restaurant_id, name, diet)
select r.id, v.dish, v.diet from (values
  ('bademiya', 'Chicken Seekh Kebab', 'non_veg'), ('bademiya', 'Chicken Baida Roti', 'non_veg'),
  ('sardar-pav-bhaji', 'Butter Pav Bhaji', 'veg'),
  ('ashok-vada-pav', 'Vada Pav', 'veg'),
  ('cafe-madras', 'Masala Dosa', 'veg'), ('cafe-madras', 'Filter Coffee', 'veg'),
  ('karims', 'Mutton Nihari', 'non_veg'), ('karims', 'Mutton Seekh Kebab', 'non_veg'),
  ('sita-ram-diwan-chand', 'Chole Bhature', 'veg'),
  ('moti-mahal', 'Butter Chicken', 'non_veg'),
  ('saravana-bhavan-cp', 'Rava Dosa', 'veg'),
  ('paradise', 'Chicken Dum Biryani', 'non_veg'), ('paradise', 'Mutton Biryani', 'non_veg'),
  ('bawarchi', 'Chicken Biryani', 'non_veg'),
  ('pista-house', 'Haleem', 'non_veg'),
  ('cafe-niloufer', 'Irani Chai', 'veg'),
  ('shah-ghouse', 'Mutton Biryani', 'non_veg'), ('shah-ghouse', 'Haleem', 'non_veg')
) as v(slug, dish, diet)
join public.restaurants r on r.slug = v.slug
on conflict (restaurant_id, name_key) do nothing;

-- Added from SQL there's no admin session, so approve them here (they'd otherwise wait in the admin queue).
update public.dishes d set approved_at = now()
from public.restaurants r
where d.restaurant_id = r.id and r.city in ('Mumbai', 'Delhi', 'Hyderabad') and d.approved_at is null;

-- Demo accounts: three people from each city's home region, so Tastes like home shows (it needs 3 ratings) ----------

delete from public.ratings r using public.dishes d, public.restaurants rest, public.profiles p
where r.dish_id = d.id and d.restaurant_id = rest.id and r.user_id = p.id
  and rest.city in ('Mumbai', 'Delhi', 'Hyderabad') and p.username like 'demo\_%';
delete from auth.users where email in (select h || '@demo.bitecast.test' from unnest(array[
  'demo_mumbai_local', 'demo_vada_pav_king', 'demo_bandra_bites', 'demo_dilli_dil', 'demo_chandni_chowk',
  'demo_cp_walker', 'demo_hyd_haleem', 'demo_irani_chai', 'demo_dum_pukht']) as h);

insert into auth.users (id, email, created_at)
select gen_random_uuid(), h || '@demo.bitecast.test', now() - interval '20 days'
from unnest(array['demo_mumbai_local', 'demo_vada_pav_king', 'demo_bandra_bites', 'demo_dilli_dil', 'demo_chandni_chowk',
                  'demo_cp_walker', 'demo_hyd_haleem', 'demo_irani_chai', 'demo_dum_pukht']) as h;

insert into public.profiles (id, username, home_region, display_name, bio)
select u.id, v.handle, v.region, v.name, v.bio
from (values
  ('demo_mumbai_local', 'maharashtra', 'Mumbai Local', 'Eats between stations. Knows every khau galli.'),
  ('demo_vada_pav_king', 'maharashtra', 'Vada Pav King', 'Three vada pavs a day keeps the hunger away.'),
  ('demo_bandra_bites', 'maharashtra', 'Bandra Bites', 'Sea face walks, then something fried.'),
  ('demo_dilli_dil', 'delhi', 'Dilli Dil', 'Old Delhi on weekends, butter on everything.'),
  ('demo_chandni_chowk', 'delhi', 'Chandni Chowk', 'If it''s in a gali, I''ve eaten it.'),
  ('demo_cp_walker', 'delhi', 'CP Walker', 'Inner circle, outer circle, all the dosa in between.'),
  ('demo_hyd_haleem', 'telangana', 'Haleem Hunter', 'Counting down to Ramzan all year.'),
  ('demo_irani_chai', 'telangana', 'Irani Chai', 'One chai, two Osmania biscuits, zero hurry.'),
  ('demo_dum_pukht', 'telangana', 'Dum Pukht', 'Biryani is a Hyderabad thing. Fight me (politely).')
) as v(handle, region, name, bio)
join auth.users u on u.email = v.handle || '@demo.bitecast.test';

-- Ratings: (handle, place, dish, score, take or null for score-only, hours ago). Two Bengaluru demo regulars travel too.
insert into public.ratings (user_id, dish_id, score, take, created_at, updated_at)
select p.id, d.id, r.score, r.take, now() - make_interval(hours => r.hours_ago), now() - make_interval(hours => r.hours_ago)
from (values
  -- Mumbai
  ('demo_vada_pav_king', 'ashok-vada-pav', 'Vada Pav', 9.5, 'The chutney has a kick, the vada is still hot, the pav is soft. Ten rupees of joy. Okay, more than ten now.', 3),
  ('demo_mumbai_local', 'ashok-vada-pav', 'Vada Pav', 9, 'Worth getting off at Dadar for. Ask for the fried chilli on the side.', 28),
  ('demo_bandra_bites', 'ashok-vada-pav', 'Vada Pav', 8, null, 52),
  ('demo_bandra_bites', 'sardar-pav-bhaji', 'Butter Pav Bhaji', 9, 'That much butter should be illegal. The bhaji is smoky, the pav is crisp at the edges.', 7),
  ('demo_mumbai_local', 'sardar-pav-bhaji', 'Butter Pav Bhaji', 7.5, 'Rich and good, but after half a plate I needed a nap.', 75),
  ('demo_mumbai_local', 'bademiya', 'Chicken Seekh Kebab', 8.5, 'Midnight in Colaba, smoke everywhere, kebab straight off the coals.', 30),
  -- a meal: same person, same place, same sitting
  ('demo_mumbai_local', 'bademiya', 'Chicken Baida Roti', 8, 'Ordered with the kebab. Eggy, flaky, dangerous at 1am.', 30),
  ('demo_vada_pav_king', 'cafe-madras', 'Masala Dosa', 7, 'Solid dosa, but I came for the coffee honestly.', 96),
  ('demo_bandra_bites', 'cafe-madras', 'Filter Coffee', 8.5, 'Proper decoction, steel tumbler, the works. Matunga does it right.', 120),
  ('demo_dosa_devotee', 'cafe-madras', 'Masala Dosa', 6, 'Good, but Bengaluru spoilt me. The potato needs more love.', 140),
  -- Delhi
  ('demo_dilli_dil', 'moti-mahal', 'Butter Chicken', 9.5, 'The original. Smoky tandoori chicken in a sauce that''s more butter than tomato. As it should be.', 5),
  ('demo_chandni_chowk', 'moti-mahal', 'Butter Chicken', 8.5, 'Rich, mild, and the naan was perfect for mopping. A little sweet for me.', 33),
  ('demo_cp_walker', 'moti-mahal', 'Butter Chicken', 8, null, 60),
  ('demo_chandni_chowk', 'karims', 'Mutton Nihari', 9, 'Slow-cooked overnight and you can taste every hour. Go early, it runs out.', 11),
  ('demo_chandni_chowk', 'karims', 'Mutton Seekh Kebab', 8, 'Had these with the nihari. Soft, peppery, a bit too much fat.', 11),
  ('demo_dilli_dil', 'karims', 'Mutton Seekh Kebab', 7, null, 80),
  ('demo_dilli_dil', 'sita-ram-diwan-chand', 'Chole Bhature', 9, 'Bhature the size of your face, chole with tang. Breakfast of champions.', 22),
  ('demo_cp_walker', 'sita-ram-diwan-chand', 'Chole Bhature', 7.5, 'Great chole, the bhatura was a bit oily today.', 100),
  ('demo_cp_walker', 'saravana-bhavan-cp', 'Rava Dosa', 7, 'Lacy and crisp. The sambar is the real hero here.', 150),
  -- Hyderabad
  ('demo_dum_pukht', 'paradise', 'Chicken Dum Biryani', 8.5, 'Classic Paradise. Fragrant rice, tender chicken, a mirchi ka salan that makes it.', 4),
  ('demo_hyd_haleem', 'paradise', 'Chicken Dum Biryani', 7.5, 'Good, but it''s become a tourist stop. Shah Ghouse does it better.', 40),
  ('demo_irani_chai', 'paradise', 'Chicken Dum Biryani', 8, null, 66),
  ('demo_biryani_brain', 'paradise', 'Chicken Dum Biryani', 8, 'Made the trip from Bengaluru for this. Lighter than Meghana, more fragrant. Different school.', 90),
  ('demo_dum_pukht', 'shah-ghouse', 'Mutton Biryani', 9.5, 'This is the one. Mutton falls off the bone, every grain has flavour.', 18),
  ('demo_hyd_haleem', 'shah-ghouse', 'Haleem', 9, 'Thick, meaty, topped with fried onions and a squeeze of lime. Worth the Ramzan crowd.', 26),
  ('demo_hyd_haleem', 'pista-house', 'Haleem', 8.5, 'The famous one. Smooth and rich, a little less spice than I like.', 55),
  ('demo_irani_chai', 'cafe-niloufer', 'Irani Chai', 9, 'Creamy, sweet, perfect with an Osmania biscuit. The queue at 7am says it all.', 9),
  ('demo_dum_pukht', 'cafe-niloufer', 'Irani Chai', 8, 'Had it after the biryani. Exactly what you need.', 18),
  ('demo_irani_chai', 'bawarchi', 'Chicken Biryani', 7, 'Big portion, spicier than Paradise. Not my favourite, still finished it.', 110),
  ('demo_hot_takes', 'bawarchi', 'Chicken Biryani', 5.5, 'Overhyped. The rice was dry and the chicken was hiding.', 130)
) as r (handle, slug, dish, score, take, hours_ago)
join public.profiles p on p.username = r.handle
join public.restaurants rest on rest.slug = r.slug
join public.dishes d on d.restaurant_id = rest.id and d.name = r.dish;

-- Votes: demo people weigh in on the new cities' takes, and the new people on Bengaluru's. Counts update by trigger.
insert into public.votes (rating_id, user_id, kind, created_at)
select r.id, p.id,
       case when (abs(hashtext(r.id::text || p.id::text)) % 100) < (40 + r.score * 5) then 'facts' else 'cap' end,
       r.created_at + interval '1 hour'
from public.ratings r
join public.dishes d on d.id = r.dish_id
join public.restaurants rest on rest.id = d.restaurant_id
join public.profiles author on author.id = r.user_id and author.username like 'demo\_%'
join public.profiles p on p.username like 'demo\_%' and p.id <> r.user_id
where r.take is not null and abs(hashtext(r.id::text || p.username)) % 3 <> 0
  and (rest.city <> 'Bengaluru' or p.home_region <> 'karnataka')
on conflict do nothing;

-- Comment threads: (take author, place, dish, commenter, body, reply-from, reply)
with threads (take_by, slug, dish, by_handle, body, reply_by, reply) as (values
  ('demo_vada_pav_king', 'ashok-vada-pav', 'Vada Pav', 'demo_bandra_bites', 'Ten rupees? Which year are you living in?', 'demo_vada_pav_king', 'The year my heart lives in.'),
  ('demo_dilli_dil', 'moti-mahal', 'Butter Chicken', 'demo_chandni_chowk', 'Agree it''s the original, but Old Delhi has better now.', 'demo_dilli_dil', 'Name one. I''ll wait.'),
  ('demo_dum_pukht', 'paradise', 'Chicken Dum Biryani', 'demo_biryani_brain', 'Respect from Bengaluru. Donne still wins though.', 'demo_dum_pukht', 'Come back for Shah Ghouse and we''ll talk.'),
  ('demo_hot_takes', 'bawarchi', 'Chicken Biryani', 'demo_irani_chai', 'Dry rice? You went at closing time.', null, null),
  ('demo_hyd_haleem', 'shah-ghouse', 'Haleem', 'demo_dum_pukht', 'Best haleem in the city, no contest.', null, null)
), tops as (
  insert into public.comments (rating_id, user_id, body, created_at)
  select r.id, c.id, t.body, r.created_at + interval '2 hours'
  from threads t
  join public.profiles a on a.username = t.take_by
  join public.restaurants rest on rest.slug = t.slug
  join public.dishes d on d.restaurant_id = rest.id and d.name = t.dish
  join public.ratings r on r.user_id = a.id and r.dish_id = d.id
  join public.profiles c on c.username = t.by_handle
  returning id, rating_id, body
)
insert into public.comments (rating_id, user_id, parent_id, body, created_at)
select tops.rating_id, rp.id, tops.id, t.reply, now() - interval '1 hour'
from tops
join threads t on t.body = tops.body and t.reply is not null
join public.profiles rp on rp.username = t.reply_by;

-- Two demo photos on the new takes: copies of biryani-2.jpg and filter-coffee.jpg (credits in PHOTO-CREDITS.md), uploaded
-- to the same Storage folder as photos.sql's files.
insert into public.rating_photos (rating_id, path, position)
select r.id, '00000000-0000-0000-0000-0000000000de/' || v.file, 1
from (values
  ('demo_dum_pukht', 'paradise', 'Chicken Dum Biryani', 'paradise-dum-biryani.jpg'),
  ('demo_bandra_bites', 'cafe-madras', 'Filter Coffee', 'cafe-madras-filter-coffee.jpg')
) as v (handle, slug, dish, file)
join public.profiles p on p.username = v.handle
join public.restaurants rest on rest.slug = v.slug
join public.dishes d on d.restaurant_id = rest.id and d.name = v.dish
join public.ratings r on r.user_id = p.id and r.dish_id = d.id;

-- Favourites (each new person's best three) and follows (each follows the other two from their city, plus two
-- Bengaluru regulars, so the Following feed and follower counts have something in them).
insert into public.favourites (user_id, rating_id, position)
select user_id, id, rn from (
  select r.user_id, r.id, row_number() over (partition by r.user_id order by r.score desc, r.created_at) as rn
  from public.ratings r join public.profiles p on p.id = r.user_id
  where p.username like 'demo\_%' and p.home_region <> 'karnataka'
) ranked where rn <= 3;

insert into public.follows (follower_id, followee_id)
select a.id, b.id from public.profiles a
join public.profiles b on b.id <> a.id and (b.home_region = a.home_region or b.username in ('demo_biryani_brain', 'demo_hot_takes'))
where a.username like 'demo\_%' and a.home_region <> 'karnataka' and b.username like 'demo\_%'
on conflict do nothing;

select
  (select count(*) from public.restaurants where city <> 'Bengaluru') as new_city_places,
  (select count(*) from public.dishes d join public.restaurants r on r.id = d.restaurant_id where r.city <> 'Bengaluru' and d.space_id is not null) as dishes_in_lists,
  (select count(*) from public.ratings r join public.dishes d on d.id = r.dish_id join public.restaurants rest on rest.id = d.restaurant_id where rest.city <> 'Bengaluru') as ratings,
  (select count(*) from public.votes v join public.profiles p on p.id = v.user_id where p.username like 'demo\_%' and p.home_region <> 'karnataka') as votes_by_new,
  (select count(*) from public.comments c join public.ratings r on r.id = c.rating_id join public.dishes d on d.id = r.dish_id join public.restaurants rest on rest.id = d.restaurant_id where rest.city <> 'Bengaluru') as comments;
commit;
